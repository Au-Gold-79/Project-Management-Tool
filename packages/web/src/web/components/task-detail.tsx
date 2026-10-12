import { useEffect, useState } from "react";
import { Play, Square, Pencil, Trash2, Plus, Clock } from "lucide-react";
import { fresh, type Entry, type Workspace } from "../../shared/model";
import type { Actions } from "../queries/workspace";
import { Modal, Status, Priority, Avatar, Activity } from "./workspace-ui";
import { FilesPanel } from "./files-panel";

export function TaskDetail({
  task,
  data,
  actions,
  close,
  edit,
}: {
  task: Entry;
  data: Workspace;
  actions: Actions;
  close: () => void;
  edit: (kind: "tasks" | "time", initial: Partial<Entry>) => void;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = data.time.filter((t) => t.taskId === task.id);
  async function act(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }
  return (
    <Modal title="Task details" close={close}>
      <div className="task-detail">
        <div className="detail-actions">
          <Status value={task.status} />
          <Priority value={task.priority} />
          <button onClick={() => edit("tasks", task)}>
            <Pencil size={14} />
            Edit
          </button>
          <button
            className="danger"
            disabled={actions.busy}
            onClick={() => {
              if (confirm("Delete this task, its comments, files and time entries?"))
                void act(async () => {
                  await actions.remove.mutateAsync({ kind: "tasks", id: task.id });
                  close();
                });
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
        <h2>{task.name}</h2>
        <p>{task.description || "No description added."}</p>
        <div className="detail-meta">
          <span>
            <Avatar small name={data.members.find((m) => m.id === task.assigneeId)?.name} />
            {data.members.find((m) => m.id === task.assigneeId)?.name || "Unassigned"}
          </span>
          <span>Due {task.dueDate || "not set"}</span>
          <span>{task.estimatedHours}h estimated</span>
        </div>
        <section className="detail-section">
          <div className="section-heading">
            <h3>
              <Clock size={16} />
              Time tracking
            </h3>
            <button
              onClick={() =>
                edit("time", {
                  projectId: task.projectId,
                  taskId: task.id,
                  date: new Date().toISOString().slice(0, 10),
                })
              }
            >
              <Plus size={14} />
              Log time
            </button>
          </div>
          <div className="time-summary">
            <b>
              {time.reduce((s, t) => s + t.hours, 0).toFixed(2)}
              <small> hours logged</small>
            </b>
            <button
              disabled={actions.busy}
              onClick={() =>
                void act(() =>
                  task.timerStarted
                    ? actions.stop.mutateAsync({ id: task.id })
                    : actions.start.mutateAsync({ id: task.id }),
                )
              }
            >
              {task.timerStarted ? <Square size={14} /> : <Play size={14} />}
              {task.timerStarted
                ? `Stop · ${Math.floor((now - Date.parse(task.timerStarted)) / 1000)}s`
                : "Start timer"}
            </button>
          </div>
          {time.map((t) => (
            <div className="compact-row" key={t.id}>
              <span>
                {t.date} · {t.description || "Time entry"}
              </span>
              <b>{t.hours.toFixed(2)}h</b>
              <button
                className="icon-btn"
                aria-label="Delete time entry"
                disabled={actions.busy}
                onClick={() => {
                  if (confirm("Delete time entry?"))
                    void act(() => actions.remove.mutateAsync({ kind: "time", id: t.id }));
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </section>
        <section className="detail-section">
          <h3>Conversation</h3>
          <p className="muted">
            Use @Name to mention a local team contact. Mentions do not send notifications.
          </p>
          {data.comments
            .filter((c) => c.taskId === task.id)
            .map((c) => (
              <div className="comment" key={c.id}>
                <Avatar small name={c.author} />
                <div>
                  <b>{c.author}</b>
                  <small>{new Date(c.createdAt).toLocaleString()}</small>
                  <p>
                    {c.content
                      .split(/(@[A-Za-z]+ [A-Za-z]+)/g)
                      .map((part, i) =>
                        part.startsWith("@") && data.members.some((m) => part === `@${m.name}`) ? (
                          <mark key={i}>{part}</mark>
                        ) : (
                          part
                        ),
                      )}
                  </p>
                </div>
                <button
                  className="icon-btn"
                  disabled={actions.busy}
                  aria-label="Delete comment"
                  onClick={() => {
                    if (confirm("Delete comment?"))
                      void act(() => actions.remove.mutateAsync({ kind: "comments", id: c.id }));
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await actions.save.mutateAsync({
                  kind: "comments",
                  item: fresh({
                    projectId: task.projectId,
                    taskId: task.id,
                    content: comment,
                    author: data.profile[0]?.name || "You",
                  }),
                });
                setComment("");
              });
            }}
          >
            <textarea
              aria-label="Comment"
              required
              placeholder="Share an update or @mention a teammate…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="comment-footer">
              <select
                aria-label="Insert mention"
                value=""
                onChange={(e) => setComment((c) => `${c} @${e.target.value} `)}
              >
                <option value="">Mention contact</option>
                {data.members.map((m) => (
                  <option key={m.id}>{m.name}</option>
                ))}
              </select>
              <button className="primary" disabled={actions.busy || !comment.trim()}>
                Post comment
              </button>
            </div>
          </form>
        </section>
        <section className="detail-section">
          <FilesPanel projectId={task.projectId} taskId={task.id} data={data} actions={actions} />
        </section>
        <section className="detail-section">
          <h3>Task activity</h3>
          <Activity entries={data.activity.filter((a) => a.taskId === task.id)} />
        </section>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
