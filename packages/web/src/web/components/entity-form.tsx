import { useState, type FormEvent } from "react";
import {
  entrySchema,
  fresh,
  labels,
  projectStatuses,
  taskStatuses,
  type Entry,
  type Kind,
  type Workspace,
} from "../../shared/model";
import type { Actions } from "../queries/workspace";
import { Modal } from "./workspace-ui";

export function EntityForm({
  kind,
  initial,
  data,
  actions,
  close,
}: {
  kind: Kind;
  initial?: Partial<Entry>;
  data: Workspace;
  actions: Actions;
  close: () => void;
}) {
  const [item, setItem] = useState<Entry>(() =>
    initial?.id
      ? entrySchema.parse(initial)
      : fresh({ status: kind === "projects" ? "planning" : "todo", ...initial }),
  );
  const [error, setError] = useState("");
  const set = (key: keyof Entry, value: unknown) => setItem((i) => ({ ...i, [key]: value }));
  const input = (key: keyof Entry, label: string, type = "text") => (
    <label>
      {label}
      <input
        aria-label={label}
        required={key === "name" || (key === "date" && kind === "time")}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={String(item[key])}
        onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await actions.save.mutateAsync({ kind, item });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    }
  }
  const title = `${initial?.id ? "Edit" : "New"} ${kind === "time" ? "time entry" : kind === "profile" ? "profile" : kind.slice(0, -1)}`;
  return (
    <Modal title={title} close={close}>
      <form onSubmit={submit} className="entity-form">
        {kind === "profile"
          ? input("name", "Your name")
          : kind !== "time" && input("name", kind === "tasks" ? "Task title" : "Name")}
        {!["members", "profile"].includes(kind) && (
          <label>
            {kind === "time" ? "Notes" : "Description"}
            <textarea
              aria-label={kind === "time" ? "Notes" : "Description"}
              rows={3}
              value={item.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
        )}
        {kind === "members" && (
          <>
            {input("email", "Email address", "email")}
            {input("role", "Role")}
          </>
        )}
        {kind === "tasks" && (
          <label>
            Project
            <select
              required
              value={item.projectId}
              onChange={(e) => set("projectId", e.target.value)}
            >
              <option value="">Select project</option>
              {data.projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {["projects", "tasks"].includes(kind) && (
          <>
            <div className="form-grid">
              <label>
                Status
                <select value={item.status} onChange={(e) => set("status", e.target.value)}>
                  {(kind === "projects" ? projectStatuses : taskStatuses).map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select value={item.priority} onChange={(e) => set("priority", e.target.value)}>
                  {["low", "medium", "high", "urgent"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              {input("startDate", "Start date", "date")}
              {input("dueDate", "Due date", "date")}
            </div>
          </>
        )}
        {kind === "projects" && (
          <>
            {input("budget", "Budget ($)", "number")}
            <label>
              Project members
              <select
                multiple
                value={item.memberIds}
                onChange={(e) =>
                  set(
                    "memberIds",
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
              >
                {data.members.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <small>Ctrl-click to select multiple contacts.</small>
            </label>
          </>
        )}
        {kind === "tasks" && (
          <div className="form-grid">
            <label>
              Assignee
              <select value={item.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
                <option value="">Unassigned</option>
                {data.members.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            {input("estimatedHours", "Estimated hours", "number")}
          </div>
        )}
        {kind === "milestones" && (
          <>
            {input("dueDate", "Due date", "date")}
            <label className="check">
              <input
                aria-label="Completed"
                type="checkbox"
                checked={item.completed}
                onChange={(e) => set("completed", e.target.checked)}
              />
              Completed
            </label>
          </>
        )}
        {kind === "time" && (
          <div className="form-grid">
            {input("date", "Date", "date")}
            {input("hours", "Hours", "number")}
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={actions.busy}>
            {actions.busy ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
