# PDF feature mapping

The PDF is a Django/MySQL internship specification. This delivery implements the approved supported-stack alternative; it is **not an exact internship submission**.

| PDF requirement | Delivered implementation |
|---|---|
| Create, update, delete projects with timelines | Project forms, statuses/priorities, start/due dates, budgets, members, cascading delete |
| Assign tasks with deadlines | Contact-based assignment, priorities, dates, estimates and status editing |
| Gantt timeline tracking | Date-scaled task bars, due-date markers, today line; missing dates handled |
| Comments, mentions, activity feed | Task conversations with highlighted local mentions and persisted activity; no notification delivery |
| Upload and share files | Project/task file uploads and attachment downloads within the workspace, 20 MB maximum |
| Reports and analytics | Progress, overdue tasks, workload, estimates/actual time, planned budgets, CSV export and browser Print/PDF |
| Drag-and-drop Kanban | Four task-status lanes with drag-and-drop and accessible status selectors |
| Time tracking | Manual dated entries and one persisted timer, stopped on completion |
| Milestone model | Project checkpoints, dates and completion |
| Project invitations and multiple users | Not included: single-user scope was selected; contacts are not accounts |
| Django 4.x, Django REST Framework, Python, MySQL, Bootstrap | Replaced with managed Bun, React, Vite, Hono, oRPC, Drizzle and local SQLite |
| Django models and migrations | Separate SQLite entity tables with typed JSON payloads, service-enforced relations and versioned SQL setup |
| Python virtual environment, mysqlclient, MySQL user setup, superuser | Not applicable. Windows Bun setup/launch scripts replace these steps |
| Django views, URLs and templates | Typed APIs and a React interface |
| collectstatic and deployment on Python hosting | Vite build, local Bun server, source on GitHub and a separate Runable sample preview |
| Tests | Automated service tests and real Chrome UI smoke checks; native Windows execution unverified |

## Constraints
- No login, access roles, real-time multi-user synchronization, email, public file sharing, or production account security.
- No actual spending/budget accounting: reports total **planned** budgets only.
- Demo data is fictional and isolated from Windows data; demo edits are not a guaranteed long-term backup.
- Source is downloadable and requires Bun, not a bundled standalone Windows executable.
- CSV and print-to-PDF are browser exports; no dedicated server-generated PDF report is claimed.