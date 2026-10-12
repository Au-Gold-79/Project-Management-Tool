import { z } from "zod";

export const kinds = [
  "projects",
  "tasks",
  "members",
  "comments",
  "milestones",
  "time",
  "files",
  "activity",
  "profile",
] as const;
export const kindSchema = z.enum(kinds);
export type Kind = z.infer<typeof kindSchema>;
export const entrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(200).default(""),
  description: z.string().max(10000).default(""),
  projectId: z.string().default(""),
  taskId: z.string().default(""),
  status: z.string().max(30).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  startDate: z.string().default(""),
  dueDate: z.string().default(""),
  assigneeId: z.string().default(""),
  memberIds: z.array(z.string()).default([]),
  budget: z.number().finite().min(0).default(0),
  estimatedHours: z.number().finite().min(0).default(0),
  hours: z.number().finite().min(0).max(100000).default(0),
  date: z.string().default(""),
  completed: z.boolean().default(false),
  email: z.string().max(200).default(""),
  role: z.string().max(100).default(""),
  content: z.string().max(10000).default(""),
  author: z.string().max(100).default("You"),
  fileKey: z.string().default(""),
  size: z.number().min(0).default(0),
  mime: z.string().default(""),
  timerStarted: z.string().default(""),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});
export type Entry = z.infer<typeof entrySchema>;
export type Workspace = Record<Kind, Entry[]>;
export const taskStatuses = ["todo", "in-progress", "review", "done"] as const;
export const projectStatuses = [
  "planning",
  "in-progress",
  "review",
  "completed",
  "on-hold",
  "cancelled",
] as const;
export const labels: Record<string, string> = {
  todo: "To do",
  "in-progress": "In progress",
  review: "In review",
  done: "Done",
  planning: "Planning",
  completed: "Completed",
  "on-hold": "On hold",
  cancelled: "Cancelled",
};
export function fresh(values: Partial<Entry> = {}): Entry {
  return entrySchema.parse({ id: crypto.randomUUID(), ...values });
}
export function progress(tasks: Entry[]) {
  return tasks.length
    ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100)
    : 0;
}
export function report(
  workspace: Workspace,
  projectId = "",
  today = new Date().toISOString().slice(0, 10),
) {
  const tasks = workspace.tasks.filter((t) => !projectId || t.projectId === projectId);
  const entries = workspace.time.filter((t) => !projectId || t.projectId === projectId);
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    progress: progress(tasks),
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done").length,
    estimated: tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
    actual: entries.reduce((sum, t) => sum + t.hours, 0),
    budget: workspace.projects
      .filter((p) => !projectId || p.id === projectId)
      .reduce((sum, p) => sum + p.budget, 0),
  };
}
