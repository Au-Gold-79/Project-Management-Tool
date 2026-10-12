import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  ChartNoAxesCombined,
  Plus,
  Search,
  ChevronRight,
  ArrowUpRight,
  Leaf,
  Settings,
  CalendarDays,
  Clock,
  CircleCheck,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Download,
  Printer,
  Menu,
  Github,
  Info,
} from "lucide-react";
import { fresh, progress, report, type Entry, type Kind, type Workspace } from "../../shared/model";
import { useWorkspace, useActions } from "../queries/workspace";
import { EntityForm } from "../components/entity-form";
import {
  Activity,
  Avatar,
  DateText,
  Empty,
  Status,
  TaskTable,
} from "../components/workspace-ui";
import { KanbanBoard } from "../components/kanban-board";
import { GanttTimeline } from "../components/gantt-timeline";
import { FilesPanel } from "../components/files-panel";
import { TaskDetail } from "../components/task-detail";

export default function WorkspacePage() {
  const query = useWorkspace();
  const actions = useActions();
  const [path, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("Board");
  const [form, setForm] = useState<{ kind: Kind; initial?: Partial<Entry> } | null>(null);
  const [taskId, setTaskId] = useState("");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [reportProject, setReportProject] = useState("");
  if (query.isLoading)
    return (
      <div className="loading">
        <Leaf size={34} />
        <h2>Opening your workspace…</h2>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="loading">
        <h2>Workspace unavailable</h2>
        <p>{query.error?.message}</p>
        <button onClick={() => void query.refetch()}>Try again</button>
      </div>
    );
  const data = query.data.data;
  const demo = query.data.demo;
  const project = path.startsWith("/projects/")
    ? data.projects.find((p) => p.id === path.split("/")[2])
    : undefined;
  const page = project
    ? "project"
    : path === "/projects"
      ? "projects"
      : path === "/tasks"
        ? "tasks"
        : path === "/team"
          ? "team"
          : path === "/reports"
            ? "reports"
            : "dashboard";
  const titles = {
    dashboard: "Workspace overview",
    projects: "Your projects",
    tasks: "All tasks",
    team: "Team directory",
    reports: "Reports & insights",
    project: project?.name || "Project",
  };
  const matches = (e: Entry) =>
    `${e.name} ${e.description}`.toLowerCase().includes(search.toLowerCase());
  const tasks = data.tasks.filter(
    (t) =>
      (!project || t.projectId === project.id) &&
      matches(t) &&
      (filter === "all" || t.status === filter),
  );
  const task = data.tasks.find((t) => t.id === taskId);
  const metrics = report(data);
  const edit = (kind: Kind, initial?: Partial<Entry>) => setForm({ kind, initial });
  async function remove(kind: Kind, item: Entry) {
    if (
      !confirm(
        `Delete ${item.name}? ${kind === "projects" ? "All related tasks, files and time entries will also be removed." : "This cannot be undone."}`,
      )
    )
      return;
    setError("");
    try {
      await actions.remove.mutateAsync({ kind, id: item.id });
      if (kind === "projects" && project) navigate("/projects");
    } catch (e) {
      setError(String(e));
    }
  }
  const navItems = [
    ["/", "Overview", LayoutDashboard],
    ["/projects", "Projects", FolderKanban],
    ["/tasks", "My tasks", CheckSquare],
    ["/team", "Team", Users],
    ["/reports", "Reports", ChartNoAxesCombined],
  ] as const;
  const projectTable = (projects: Entry[]) =>
    projects.length ? (
      <div className="table-scroll">
        <table className="project-table">
          <thead>
            <tr>
              <th>Project name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Team</th>
              <th>Due date</th>
              <th aria-label="Project actions" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => {
              const percent = progress(data.tasks.filter((t) => t.projectId === p.id));
              return (
                <tr key={p.id}>
                  <td aria-label={p.name}>
                    <div className="project-cell">
                      <span className={`project-icon tone-${i % 3}`}>
                        <FolderKanban size={18} />
                      </span>
                      <div>
                        <Link
                          href={`/projects/${p.id}`}
                          onClick={() => {
                            setFilter("all");
                            setSearch("");
                            setTab("Board");
                          }}
                        >
                          {p.name}
                        </Link>
                        <small>
                          {data.tasks.filter((t) => t.projectId === p.id).length} tasks ·{" "}
                          {p.priority} priority
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td aria-label={`${percent}% complete`}>
                    <div className="progress-inline">
                      <div className="progress-track">
                        <i style={{ width: `${percent}%` }} />
                      </div>
                      <span>{percent}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="avatars">
                      {p.memberIds.slice(0, 3).map((id) => (
                        <Avatar small key={id} name={data.members.find((m) => m.id === id)?.name} />
                      ))}
                      {!p.memberIds.length && <small>—</small>}
                    </div>
                  </td>
                  <td>
                    <DateText date={p.dueDate} />
                  </td>
                  <td>
                    <button
                      aria-label={`Edit ${p.name}`}
                      className="icon-btn"
                      onClick={() => edit("projects", p)}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty
        title="A fresh start for your projects"
        detail="Create a project to organize your tasks, files and milestones."
      />
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <Link href="/" className="brand">
          <span>
            <Leaf size={22} />
          </span>
          meridian<span className="brand-period">.</span>
        </Link>
        <div className="workspace-switch">
          <span className="workspace-square">M</span>
          <div>
            <b>My workspace</b>
            <small>{demo ? "Sample workspace" : "Local workspace"}</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <small className="nav-label">WORKSPACE</small>
        <nav>
          {navItems.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={(href === "/" ? path === "/" : path.startsWith(href)) ? "active" : ""}
              onClick={() => {
                setSearch("");
                setFilter("all");
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              {label}
              {label === "My tasks" && (
                <span className="nav-count">
                  {data.tasks.filter((t) => t.status !== "done").length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div>
            <small className="nav-label">YOUR PROJECTS</small>
            <button aria-label="New project" className="icon-btn" onClick={() => edit("projects")}>
              <Plus size={15} />
            </button>
          </div>
          {data.projects.slice(0, 5).map((p, i) => (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              onClick={() => {
                setFilter("all");
                setSearch("");
                setTab("Board");
                setMobileNav(false);
              }}
            >
              <i className={`project-dot tone-${i % 3}`} />
              {p.name}
            </Link>
          ))}
        </div>
        <div className="sidebar-bottom">
          <a
            href="https://github.com/Au-Gold-79/Project-Management-Tool"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} />
            Source on GitHub
            <ArrowUpRight size={13} />
          </a>
          <button onClick={() => edit("profile", data.profile[0])}>
            <Avatar small name={data.profile[0]?.name || "My Workspace"} />
            <span>
              <b>{data.profile[0]?.name || "Workspace owner"}</b>
              <small>Single-user workspace</small>
            </span>
            <Settings size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-btn menu-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{project ? "Projects" : page === "dashboard" ? "Overview" : titles[page]}</b>
          </div>
          <div className="topbar-right">
            <span className="local-dot" />
            {demo ? "Demo mode" : "Stored locally"}
            <span className="topbar-divider" />
            <Avatar small name={data.profile[0]?.name || "Workspace Owner"} />
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <Info size={14} />
            <span>
              Interactive sample workspace. Demo edits are shared here; do not upload personal or
              sensitive data. Your Windows workspace is separate.
            </span>
          </div>
        )}
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {project ? "PROJECT WORKSPACE" : "MAKE ROOM FOR GOOD WORK"}
              </span>
              <h1>{titles[page]}</h1>
              <p>
                {project
                  ? project.description
                  : page === "dashboard"
                    ? "A little clarity for everything you’re working on."
                    : page === "projects"
                      ? "From the first idea to the final deliverable."
                      : page === "team"
                        ? "The people behind your projects. Local contacts, no login required."
                        : page === "reports"
                          ? "A clear picture of progress, workload, and time."
                          : "Keep the important work moving forward."}
              </p>
            </div>
            <div className="heading-actions">
              {project ? (
                <>
                  <button onClick={() => edit("projects", project)}>
                    <Pencil size={15} />
                    Edit project
                  </button>
                  <button
                    className="primary"
                    onClick={() => edit("tasks", { projectId: project.id })}
                  >
                    <Plus size={17} />
                    New task
                  </button>
                </>
              ) : page === "team" ? (
                <button className="primary" onClick={() => edit("members")}>
                  <Plus size={17} />
                  Add member
                </button>
              ) : page !== "reports" ? (
                <button
                  className="primary"
                  onClick={() => edit(page === "tasks" ? "tasks" : "projects")}
                >
                  <Plus size={17} />
                  {page === "tasks" ? "New task" : "New project"}
                </button>
              ) : null}
            </div>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {page === "dashboard" && (
            <>
              <div className="metrics">
                {[
                  [
                    "Active projects",
                    data.projects.filter((p) => !["completed", "cancelled"].includes(p.status))
                      .length,
                    FolderKanban,
                    "Across your workspace",
                  ],
                  [
                    "Tasks completed",
                    `${metrics.done}/${metrics.total}`,
                    CircleCheck,
                    `${metrics.progress}% of all tasks`,
                  ],
                  [
                    "Upcoming deadlines",
                    data.tasks.filter(
                      (t) =>
                        t.status !== "done" &&
                        t.dueDate &&
                        t.dueDate >= new Date().toISOString().slice(0, 10) &&
                        t.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                    ).length,
                    CalendarDays,
                    "Within the next 7 days",
                  ],
                  [
                    "Hours tracked",
                    metrics.actual.toFixed(1),
                    Clock,
                    `${metrics.estimated}h estimated in total`,
                  ],
                ].map(([label, value, Icon, detail]) => {
                  const I = Icon as typeof Clock;
                  return (
                    <section className="metric" key={String(label)}>
                      <div>
                        <span>{String(label)}</span>
                        <I size={18} />
                      </div>
                      <strong>{String(value)}</strong>
                      <small>{String(detail)}</small>
                    </section>
                  );
                })}
              </div>
              <div className="dashboard-grid">
                <div>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>
                        Projects in motion <span>{data.projects.length}</span>
                      </h2>
                      <Link href="/projects">
                        View all
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    {projectTable(data.projects.slice(0, 5))}
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Focus for today</h2>
                      <Link href="/tasks">
                        All tasks
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <TaskTable
                      tasks={data.tasks
                        .filter((t) => t.status !== "done")
                        .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
                        .slice(0, 5)}
                      data={data}
                      open={(t) => setTaskId(t.id)}
                    />
                  </section>
                </div>
                <aside className="dashboard-rail">
                  <section className="focus-card">
                    <span className="eyebrow">YOUR WORK, AT A GLANCE</span>
                    <h2>
                      Small steps.
                      <br />
                      Meaningful progress.
                    </h2>
                    <div
                      className="progress-ring"
                      style={{
                        background: `conic-gradient(#98ddc4 ${metrics.progress}%, #33524b 0)`,
                      }}
                    >
                      <div>
                        <strong>{metrics.progress}%</strong>
                        <span>complete</span>
                      </div>
                    </div>
                    <p>
                      {metrics.done} tasks finished.
                      <br />
                      Keep the momentum going.
                    </p>
                    <Link href="/reports">
                      Explore your reports
                      <ArrowUpRight size={16} />
                    </Link>
                  </section>
                  <section className="panel activity-panel">
                    <div className="panel-heading">
                      <h2>Recent activity</h2>
                      <span className="live-label">LIVE</span>
                    </div>
                    <Activity entries={data.activity} />
                  </section>
                </aside>
              </div>
            </>
          )}
          {page === "projects" && (
            <section className="panel">
              <div className="toolbar">
                <label className="search">
                  <Search size={16} />
                  <input
                      aria-label="Search projects"
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <span className="muted">{data.projects.length} projects</span>
              </div>
              {projectTable(data.projects.filter(matches))}
            </section>
          )}
          {(page === "tasks" || page === "project") && (
            <>
              {project && (
                <div className="project-summary">
                  <Status value={project.status} />
                  <span>
                    <CalendarDays size={15} />
                    {project.startDate || "No start"} — {project.dueDate || "No deadline"}
                  </span>
                  <span>
                    <Users size={15} />
                    {project.memberIds.length} members
                  </span>
                  <span className="summary-progress">
                    {progress(data.tasks.filter((t) => t.projectId === project.id))}% complete
                  </span>
                  <button
                    className="icon-btn danger"
                    aria-label="Delete project"
                    onClick={() => void remove("projects", project)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
              <div className="tabs">
                {[
                  "Board",
                  "List",
                  "Timeline",
                  ...(project ? ["Milestones", "Files", "Activity", "Reports"] : []),
                ].map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={tab === t ? "active" : ""}>
                    {t}
                  </button>
                ))}
              </div>
              {["Board", "List", "Timeline"].includes(tab) && (
                <div className="toolbar no-panel">
                  <label className="search">
                    <Search size={16} />
                    <input
                        aria-label="Search tasks"
                      placeholder="Search tasks…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label className="filter">
                    <SlidersHorizontal size={15} />
                    <select
                      aria-label="Filter task status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="review">In review</option>
                      <option value="done">Done</option>
                    </select>
                  </label>
                </div>
              )}
              {tab === "Board" && (
                <KanbanBoard
                  tasks={tasks}
                  data={data}
                  actions={actions}
                  open={(t) => setTaskId(t.id)}
                />
              )}
              {tab === "List" && (
                <section className="panel">
                  <TaskTable tasks={tasks} data={data} open={(t) => setTaskId(t.id)} />
                </section>
              )}
              {tab === "Timeline" && (
                <section className="panel">
                  <GanttTimeline tasks={tasks} open={(t) => setTaskId(t.id)} />
                </section>
              )}
              {project && tab === "Files" && (
                <section className="panel padded">
                  <FilesPanel projectId={project.id} data={data} actions={actions} />
                </section>
              )}
              {project && tab === "Activity" && (
                <section className="panel padded">
                  <Activity entries={data.activity.filter((a) => a.projectId === project.id)} />
                </section>
              )}
              {project && tab === "Milestones" && (
                <section className="panel padded">
                  <div className="section-heading">
                    <h2>Project milestones</h2>
                    <button
                      className="primary"
                      onClick={() => edit("milestones", { projectId: project.id })}
                    >
                      <Plus size={15} />
                      New milestone
                    </button>
                  </div>
                  {data.milestones
                    .filter((m) => m.projectId === project.id)
                    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                    .map((m) => (
                      <div className="milestone-row" key={m.id}>
                        <input
                          aria-label={`Complete ${m.name}`}
                          type="checkbox"
                          checked={m.completed}
                          disabled={actions.busy}
                          onChange={async (e) => {
                            try {
                              await actions.save.mutateAsync({
                                kind: "milestones",
                                item: { ...m, completed: e.target.checked },
                              });
                            } catch (e) {
                              setError(String(e));
                            }
                          }}
                        />
                        <div>
                          <b className={m.completed ? "struck" : ""}>{m.name}</b>
                          <p>{m.description}</p>
                        </div>
                        <DateText date={m.dueDate} />
                        <button
                          className="icon-btn"
                          aria-label="Edit milestone"
                          onClick={() => edit("milestones", m)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label="Delete milestone"
                          onClick={() => void remove("milestones", m)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  {!data.milestones.some((m) => m.projectId === project.id) && (
                    <Empty
                      title="Mark the moments that matter"
                      detail="Add milestones for important project checkpoints."
                    />
                  )}
                </section>
              )}
              {project && tab === "Reports" && <Reports data={data} projectId={project.id} />}
            </>
          )}
          {page === "team" && (
            <>
              <section className="panel">
                <div className="toolbar">
                  <label className="search">
                    <Search size={16} />
                    <input
                        aria-label="Search team members"
                      placeholder="Search team members…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <span className="muted">{data.members.length} contacts</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Assigned tasks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.members.filter(matches).map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="person">
                              <Avatar name={m.name} />
                              <b>{m.name}</b>
                            </div>
                          </td>
                          <td>{m.role || "—"}</td>
                          <td>{m.email || "—"}</td>
                          <td>
                            {
                              data.tasks.filter((t) => t.assigneeId === m.id && t.status !== "done")
                                .length
                            }{" "}
                            open
                          </td>
                          <td>
                            <button
                              className="icon-btn"
                              aria-label={`Edit ${m.name}`}
                              onClick={() => edit("members", m)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-btn"
                              aria-label={`Delete ${m.name}`}
                              onClick={() => void remove("members", m)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!data.members.length && (
                  <Empty
                    title="Who’s on your team?"
                    detail="Add contacts to assign tasks and mention people in comments."
                  />
                )}
              </section>
              <p className="footnote">
                Contacts are local assignment records, not app accounts. No invitations or emails
                are sent.
              </p>
            </>
          )}
          {page === "reports" && (
            <>
              <div className="toolbar no-panel">
                <label>
                  Project{" "}
                  <select value={reportProject} onChange={(e) => setReportProject(e.target.value)}>
                    <option value="">All projects</option>
                    {data.projects.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Reports data={data} projectId={reportProject} />
            </>
          )}
          <footer className="page-footer">
            <span>Good work starts with a clear workspace.</span>
            <span>Meridian · Project Management Tool</span>
          </footer>
        </main>
      </div>
      {task && (
        <TaskDetail
          task={task}
          data={data}
          actions={actions}
          close={() => setTaskId("")}
          edit={(kind, initial) => edit(kind, initial)}
        />
      )}
      {form && (
        <EntityForm
          kind={form.kind}
          initial={form.initial}
          data={data}
          actions={actions}
          close={() => setForm(null)}
        />
      )}
    </div>
  );
}

function Reports({ data, projectId }: { data: Workspace; projectId: string }) {
  const r = report(data, projectId);
  const tasks = data.tasks.filter((t) => !projectId || t.projectId === projectId);
  function csv() {
    const rows = [
      ["Task", "Project", "Status", "Assignee", "Due date", "Estimated hours", "Actual hours"],
      ...tasks.map((t) => [
        t.name,
        data.projects.find((p) => p.id === t.projectId)?.name || "",
        t.status,
        data.members.find((m) => m.id === t.assigneeId)?.name || "",
        t.dueDate,
        String(t.estimatedHours),
        String(data.time.filter((e) => e.taskId === t.id).reduce((s, e) => s + e.hours, 0)),
      ]),
    ];
    const quote = (s: string) =>
      `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
    const blob = new Blob(["﻿" + rows.map((row) => row.map(quote).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="report-area">
      <div className="section-heading">
        <div>
          <h2>Project performance</h2>
          <p className="muted">
            {data.projects.find((p) => p.id === projectId)?.name || "All projects"} ·{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="heading-actions">
          <button onClick={csv}>
            <Download size={15} />
            Export CSV
          </button>
          <button onClick={() => window.print()}>
            <Printer size={15} />
            Print / PDF
          </button>
        </div>
      </div>
      <div className="metrics">
        {[
          ["Completion", `${r.progress}%`],
          ["Overdue tasks", r.overdue],
          ["Tracked hours", `${r.actual.toFixed(1)}h`],
          ["Project budgets", `$${r.budget.toLocaleString()}`],
        ].map(([label, value]) => (
          <section className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>
              {label === "Project budgets"
                ? "Planned budget, not actual spend"
                : "Based on current workspace data"}
            </small>
          </section>
        ))}
      </div>
      <div className="report-grid">
        <section className="panel padded">
          <h3>Task distribution</h3>
          {["todo", "in-progress", "review", "done"].map((status) => (
            <div className="bar-row" key={status}>
              <Status value={status} />
              <div className="progress-track">
                <i
                  style={{
                    width: `${tasks.length ? (tasks.filter((t) => t.status === status).length / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <b>{tasks.filter((t) => t.status === status).length}</b>
            </div>
          ))}
        </section>
        <section className="panel padded">
          <h3>Estimated vs. actual time</h3>
          <div className="hours-compare">
            <div>
              <strong>{r.estimated}h</strong>
              <span>Estimated</span>
            </div>
            <div>
              <strong>{r.actual.toFixed(1)}h</strong>
              <span>Logged</span>
            </div>
          </div>
          <p className="muted">
            {(r.estimated - r.actual).toFixed(1)}h remaining against task estimates.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Team workload</h2>
          <span className="muted">Open tasks by assignee</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Team member</th>
              <th>Open tasks</th>
              <th>Completed</th>
              <th>Estimated hours</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...data.members,
              fresh({ id: "00000000-0000-4000-8000-000000000000", name: "Unassigned" }),
            ].map((m) => {
              const assigned = tasks.filter((t) =>
                m.name === "Unassigned" ? !t.assigneeId : t.assigneeId === m.id,
              );
              return (
                <tr key={m.id}>
                  <td>
                    <div className="person">
                      <Avatar small name={m.name} />
                      {m.name}
                    </div>
                  </td>
                  <td>{assigned.filter((t) => t.status !== "done").length}</td>
                  <td>{assigned.filter((t) => t.status === "done").length}</td>
                  <td>{assigned.reduce((s, t) => s + t.estimatedHours, 0)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
