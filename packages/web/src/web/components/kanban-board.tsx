import { useState } from "react";
import { labels, taskStatuses, type Entry, type Workspace } from "../../shared/model";
import type { Actions } from "../queries/workspace";
import { Avatar, DateText, Priority } from "./workspace-ui";

export function KanbanBoard({
  tasks,
  data,
  actions,
  open,
}: {
  tasks: Entry[];
  data: Workspace;
  actions: Actions;
  open: (t: Entry) => void;
}) {
  const [error, setError] = useState("");
  async function move(id: string, status: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task || actions.busy) return;
    setError("");
    try {
      await actions.save.mutateAsync({ kind: "tasks", item: { ...task, status } });
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="board">
        {taskStatuses.map((status) => (
          <section
            key={status}
            className={`lane lane-${status}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void move(e.dataTransfer.getData("text/plain"), status);
            }}
          >
            <header>
              <span>
                <i />
                {labels[status]}
              </span>
              <b>{tasks.filter((t) => t.status === status).length}</b>
            </header>
            {tasks
              .filter((t) => t.status === status)
              .map((t) => (
                <article
                  className="task-card"
                  key={t.id}
                  draggable={!actions.busy}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                >
                  <Priority value={t.priority} />
                  <button className="text-btn" onClick={() => open(t)}>
                    <h3>{t.name}</h3>
                  </button>
                  <p>
                    {t.description.slice(0, 65)}
                    {t.description.length > 65 ? "…" : ""}
                  </p>
                  <div className="card-bottom">
                    <Avatar small name={data.members.find((m) => m.id === t.assigneeId)?.name} />
                    <DateText date={t.dueDate} />
                  </div>
                  <select
                    aria-label={`Status for ${t.name}`}
                    value={t.status}
                    disabled={actions.busy}
                    onChange={(e) => void move(t.id, e.target.value)}
                  >
                    {taskStatuses.map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            {!tasks.some((t) => t.status === status) && (
              <div className="drop-empty">Drop a task here</div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
