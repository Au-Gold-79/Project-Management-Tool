import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { labels, type Entry, type Workspace } from "../../shared/model";

export function Status({ value }: { value: string }) {
  return <span className={`status ${value}`}>{labels[value] || value}</span>;
}
export function Avatar({ name = "Unassigned", small = false }: { name?: string; small?: boolean }) {
  return (
    <span title={name} className={`avatar ${small ? "small" : ""}`}>
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-label={title} className="native-modal modal">
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>
        {children}
    </dialog>
  );
}
export function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{detail || "Create your first item to get started."}</p>
    </div>
  );
}
export function DateText({ date }: { date: string }) {
  return (
    <span>
      {date
        ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "No date"}
    </span>
  );
}
export function Priority({ value }: { value: string }) {
  return (
    <span className={`priority ${value}`}>
      <i />
      {value}
    </span>
  );
}
export function TaskTable({
  tasks,
  data,
  open,
}: {
  tasks: Entry[];
  data: Workspace;
  open: (t: Entry) => void;
}) {
  if (!tasks.length) return <Empty title="No tasks yet" />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Task name</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Due date</th>
            <th aria-label="Open task" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} onClick={() => open(t)}>
              <td>
                <button className="text-btn task-name" onClick={() => open(t)}>
                  {t.name}
                </button>
                <small>{data.projects.find((p) => p.id === t.projectId)?.name}</small>
              </td>
              <td>
                <Status value={t.status} />
              </td>
              <td>
                <div className="person">
                  <Avatar small name={data.members.find((m) => m.id === t.assigneeId)?.name} />
                  <span>
                    {data.members.find((m) => m.id === t.assigneeId)?.name.split(" ")[0] ||
                      "Unassigned"}
                  </span>
                </div>
              </td>
              <td>
                <Priority value={t.priority} />
              </td>
              <td
                className={
                  t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== "done"
                    ? "overdue"
                    : ""
                }
              >
                <DateText date={t.dueDate} />
              </td>
              <td>
                <ArrowUpRight size={15} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Activity({ entries }: { entries: Entry[] }) {
  return (
    <div className="activity-list">
      {entries
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map((e) => (
          <div className="activity-item" key={e.id}>
            <span className="activity-dot" />
            <div>
              <p>{e.description}</p>
              <small>
                {new Date(e.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {e.author}
              </small>
            </div>
          </div>
        ))}
      {!entries.length && <p className="muted">Changes will appear here.</p>}
    </div>
  );
}
