import type { Entry } from "../../shared/model";
import { Empty, Status } from "./workspace-ui";

export function GanttTimeline({ tasks, open }: { tasks: Entry[]; open: (t: Entry) => void }) {
  const dates = tasks
    .flatMap((t) => [t.startDate, t.dueDate])
    .filter(Boolean)
    .map((d) => Date.parse(d));
  if (!dates.length)
    return (
      <Empty
        title="Give your tasks a timeline"
        detail="Add start and due dates to see the Gantt chart."
      />
    );
  const min = Math.min(...dates) - 2 * 86400000;
  const max = Math.max(...dates) + 3 * 86400000;
  const range = Math.max(max - min, 7 * 86400000);
  const ticks = Array.from({ length: 8 }, (_, i) => new Date(min + (range * i) / 7));
  const today = ((Date.now() - min) / range) * 100;
  return (
    <div className="timeline-scroll">
      <div className="timeline">
        <div className="timeline-head">
          <span>Task / date range</span>
          <div>
            {ticks.map((d, i) => (
              <small key={i}>
                {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </small>
            ))}
          </div>
        </div>
        {tasks.map((t) => {
          const start = Date.parse(t.startDate || t.dueDate);
          const end = Date.parse(t.dueDate || t.startDate);
          const left = ((start - min) / range) * 100;
          const width = Math.max(((end - start + 86400000) / range) * 100, 2);
          return (
            <div className="timeline-row" key={t.id}>
              <button className="text-btn" onClick={() => open(t)}>
                <span>{t.name}</span>
                <small>
                  {t.startDate || "No start"} → {t.dueDate || "No deadline"}
                </small>
              </button>
              <div className="timeline-track">
                {today >= 0 && today <= 100 && (
                  <i className="today-line" style={{ left: `${today}%` }} />
                )}
                {Number.isFinite(left) ? (
                  <button
                    aria-label={`Open ${t.name}`}
                    className={`gantt-bar ${t.status}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => open(t)}
                  >
                    {t.name}
                    <span className="deadline-marker" />
                  </button>
                ) : (
                  <Status value={t.status} />
                )}
              </div>
            </div>
          );
        })}
        <div className="timeline-legend">
          Vertical green line: today · Diamond: due date · Bars span start to due date
        </div>
      </div>
    </div>
  );
}
