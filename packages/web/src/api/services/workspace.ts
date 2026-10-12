import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { db } from "../database/local";
import * as tables from "../database/schema";
import {
  entrySchema,
  fresh,
  kinds,
  projectStatuses,
  taskStatuses,
  type Entry,
  type Kind,
  type Workspace,
} from "../../shared/model";
import { uploadDir } from "./workspace-config";

const fail = (message: string): never => {
  throw new ORPCError("BAD_REQUEST", { message });
};
export async function list(kind: Kind) {
  return (await db.select().from(tables[kind])).map((r) => r.data);
}
export async function workspace(): Promise<Workspace> {
  const result = {} as Workspace;
  for (const kind of kinds) result[kind] = await list(kind);
  return result;
}
export async function get(kind: Kind, id: string) {
  const rows = await db.select().from(tables[kind]).where(eq(tables[kind].id, id));
  if (!rows[0]) throw new ORPCError("NOT_FOUND", { message: "This item no longer exists." });
  return rows[0].data;
}
export async function validate(kind: Kind, item: Entry) {
  for (const value of [item.startDate, item.dueDate, item.date]) {
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      fail("Enter a valid date.");
  }
  if (item.startDate && item.dueDate && item.startDate > item.dueDate)
    fail("Start date must not be after the due date.");
  if (["projects", "tasks", "members", "milestones", "files"].includes(kind) && !item.name.trim())
    fail("A name is required.");
  if (kind === "projects" && !(projectStatuses as readonly string[]).includes(item.status))
    fail("Invalid project status.");
  if (kind === "tasks" && !(taskStatuses as readonly string[]).includes(item.status))
    fail("Invalid task status.");
  if (["tasks", "milestones", "files", "comments", "time"].includes(kind)) {
    if (!item.projectId) fail("Select a project.");
    await get("projects", item.projectId);
  }
  if (item.taskId) {
    const task = await get("tasks", item.taskId);
    if (task.projectId !== item.projectId) fail("Task belongs to a different project.");
  }
  if (["comments", "time"].includes(kind) && !item.taskId) fail("Select a task.");
  if (kind === "comments" && !item.content.trim()) fail("Comment cannot be empty.");
  if (kind === "time" && (item.hours <= 0 || !item.date)) fail("Enter a date and positive hours.");
  if (item.assigneeId) await get("members", item.assigneeId);
  for (const id of item.memberIds) await get("members", id);
  if (kind === "members" && item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email))
    fail("Enter a valid email.");
}
export async function record(projectId: string, description: string, taskId = "") {
  const item = fresh({ projectId, taskId, description, createdAt: new Date().toISOString() });
  await db.insert(tables.activity).values({ id: item.id, data: item });
}
async function persist(kind: Kind, item: Entry) {
  await db
    .insert(tables[kind])
    .values({ id: item.id, data: item })
    .onConflictDoUpdate({ target: tables[kind].id, set: { data: item } });
  return item;
}
export async function save(kind: Kind, input: Entry) {
  if (["files", "activity"].includes(kind)) fail("Use the dedicated file operation.");
  const previous = (await list(kind)).find((t) => t.id === input.id);
  const now = new Date().toISOString();
  const item = entrySchema.parse({
    ...input,
    name: input.name.trim(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    fileKey: "",
    size: 0,
    mime: "",
    timerStarted: previous?.timerStarted || "",
    completed: kind === "tasks" ? input.status === "done" : input.completed,
  });
  await validate(kind, item);
  if (kind === "tasks" && item.status === "done" && item.timerStarted) await stopTimer(item.id);
  if (kind === "tasks" && item.status === "done") item.timerStarted = "";
  await persist(kind, item);
  await record(
    kind === "projects" ? item.id : item.projectId,
    `${previous ? "Updated" : "Created"} ${kind === "comments" ? "comment" : item.name || kind}`,
    item.taskId || (kind === "tasks" ? item.id : ""),
  );
  return item;
}
export async function remove(kind: Kind, id: string) {
  if (kind === "activity" || kind === "profile") fail("This item cannot be deleted.");
  const item = await get(kind, id);
  if (kind === "projects" || kind === "tasks") {
    for (const childKind of [
      "tasks",
      "comments",
      "milestones",
      "time",
      "files",
      "activity",
    ] as Kind[]) {
      for (const child of await list(childKind)) {
        if (
          (kind === "projects" && child.projectId === id) ||
          (kind === "tasks" && child.taskId === id)
        )
          await rawRemove(childKind, child);
      }
    }
  }
  if (kind === "members") {
    for (const k of ["tasks", "projects"] as Kind[])
      for (const row of await list(k)) {
        if (row.assigneeId === id || row.memberIds.includes(id))
          await persist(k, {
            ...row,
            assigneeId: row.assigneeId === id ? "" : row.assigneeId,
            memberIds: row.memberIds.filter((x) => x !== id),
          });
      }
  }
  await rawRemove(kind, item);
  if (kind !== "projects") await record(item.projectId, `Deleted ${item.name || kind}`);
  return { success: true };
}
async function rawRemove(kind: Kind, item: Entry) {
  if (kind === "files" && /^[0-9a-f-]{36}$/.test(item.fileKey)) {
    await unlink(resolve(uploadDir, item.fileKey)).catch(() => {});
  }
  await db.delete(tables[kind]).where(eq(tables[kind].id, item.id));
}
export async function upload(input: {
  projectId: string;
  taskId: string;
  name: string;
  data: string;
  mime: string;
}) {
  if (input.data.length > 28_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data))
    fail("Invalid file or file exceeds 20 MB.");
  const bytes = Buffer.from(input.data, "base64");
  if (bytes.length > 20 * 1024 * 1024 || bytes.length === 0)
    fail("Files must be nonempty and at most 20 MB.");
  const name = Array.from(input.name, char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || char === "/" || char === "\\" ? "_" : char).join("").slice(0, 200);
  const item = fresh({
    projectId: input.projectId,
    taskId: input.taskId,
    name,
    mime: input.mime,
    size: bytes.length,
    fileKey: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  await validate("files", item);
  await mkdir(uploadDir, { recursive: true });
  const path = resolve(uploadDir, item.fileKey);
  await Bun.write(path, bytes);
  try {
    await persist("files", item);
  } catch (error) {
    await unlink(path);
    throw error;
  }
  await record(item.projectId, `Uploaded ${name}`, item.taskId);
  return item;
}
export async function startTimer(id: string) {
  const task = await get("tasks", id);
  if (task.status === "done") fail("Reopen a completed task before starting a timer.");
  if ((await list("tasks")).some((t) => t.timerStarted)) fail("Stop the running timer first.");
  return persist("tasks", { ...task, timerStarted: new Date().toISOString() });
}
export async function stopTimer(id: string) {
  const task = await get("tasks", id);
  if (!task.timerStarted) fail("This timer is not running.");
  const hours = Math.max((Date.now() - Date.parse(task.timerStarted)) / 3_600_000, 1 / 3600);
  await save(
    "time",
    fresh({
      projectId: task.projectId,
      taskId: id,
      hours,
      date: new Date().toISOString().slice(0, 10),
      description: "Tracked with timer",
    }),
  );
  return persist("tasks", { ...task, timerStarted: "" });
}
