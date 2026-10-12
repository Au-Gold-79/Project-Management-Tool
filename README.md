# Project-Management-Tool

**Meridian** is a local, single-user project-management workspace with a React interface, Hono/oRPC API, Drizzle ORM, and SQLite persistence through Bun's built-in driver. It includes project management, task assignment, drag-and-drop Kanban, Gantt timelines, milestones, comments and local mentions, files, activity, time tracking, and reports.

**This is not Django or MySQL.** The original PDF specified those technologies; the supported Bun/React/Hono implementation was explicitly approved as a substitute. See [FEATURE-CHECKLIST.md](FEATURE-CHECKLIST.md) for feature mapping and limitations.

## Windows: first run

1. Install **Bun 1.3.14 or later** from [Bun's official installation instructions](https://bun.com/docs/installation). Windows 10 version 1809 or newer is required by Bun. Open a new terminal after installation and check `bun --version`.
2. Extract the ZIP fully to a writable folder, such as `Documents\Project-Management-Tool`. **Do not run from inside the ZIP**, a read-only folder, or a network share.
3. Double-click **`SETUP-WINDOWS.bat`**. It installs dependencies, creates the database, applies migrations, and builds the interface. Internet is required for installation. Setup does not erase existing data.
4. Double-click **`START-WINDOWS.bat`**. The browser opens at `http://127.0.0.1:4200`. Keep the terminal window open while using the app.
5. Add team contacts, create a project, and add tasks. A new Windows workspace starts empty; it does not contain your Runable demo edits.

On later visits, use only `START-WINDOWS.bat`. Press **Ctrl+C** in its terminal, or close the terminal, to stop the app. Your changes are saved to SQLite as you work.

This is a **source-based ZIP requiring Bun**, not an executable installer. No MySQL, Python, WSL, Docker, or Git is required to use the downloaded Windows app. Native Windows execution has not been tested in the Linux build environment; see [TEST-RESULTS.md](TEST-RESULTS.md).

## Start from a GitHub clone / non-Windows setup

```sh
git clone https://github.com/Au-Gold-79/Project-Management-Tool.git
cd Project-Management-Tool
bun install --frozen-lockfile
bun scripts/setup.ts
bun run --filter @template/web build
bun scripts/start-local.ts --no-browser
```

Open `http://127.0.0.1:4200`. This launcher binds to localhost and rejects cross-origin browser requests. It is intended for local use, **not exposing unauthenticated user data on the internet**.

For development, run `bun run dev` after setup. This uses Vite **under Bun**, which is required for the built-in SQLite driver. Keep the assigned ports in `__ports.cjs` and `.runable/ports.json` unchanged. The web and API share port 4200; `/api/health` provides a health check.

## Optional fictional sample data

To seed an empty local workspace explicitly:

```sh
bun scripts/seed-demo.ts
```

Seeding refuses to run if projects or contacts already exist. Routine setup and startup never reset or seed your workspace. The interactive **Runable preview** uses a separate sample database and upload directory, visibly labels itself as a demo, and does not synchronize with the Windows database. Demo edits are shared within that sample workspace; do not enter sensitive information. Sandbox demo storage is not a production backup guarantee. Access the preview through its delivered Runable artifact; a permanent public URL requires the platform's Publish control.

## Features

- **Projects:** create/edit/delete, status, priority, dates, planned budget, contact membership, computed progress.
- **Tasks:** create/edit/delete, assignments, deadlines, estimates, priorities, completion status.
- **Kanban:** real drag-and-drop plus accessible status selectors and filtered task lists.
- **Timelines:** date-scaled Gantt bars, deadline markers, current-date line; add task dates to display bars.
- **Collaboration:** plain-text task comments, `@Name` mentions of contacts, chronological activity. Mentions do not send notifications or emails.
- **Milestones:** dated project checkpoints and completion controls.
- **Files:** upload/download and delete project/task attachments, up to 20 MB each. Files are downloaded as attachments rather than rendered as executable previews.
- **Time:** manual dated entries and one running task timer. Stop the timer to record elapsed time; completing a timed task also stops it. A timer continues across reloads/server restarts until stopped.
- **Reports:** completion, overdue tasks, estimated/actual time, planned budgets, workload, CSV export and print-friendly browser Save as PDF.
- **Team:** local assignment contacts, not separate authenticated users. Set your author name using the workspace owner control in the sidebar.

## Storage, backup and restore

- Setup creates one root `.env` containing local defaults. All environment values belong in that file; it is not committed or shipped. Optional backend settings are `APP_MODE=demo` and `APP_DATA_DIR` (an absolute path is recommended for custom storage).
- Default database: `data/workspace.sqlite`; uploads: `data/uploads/`. SQLite journal files may be present while the server is running.
- **Backup:** stop the application first, then copy the entire `data` folder to a safe location. Files and database metadata must be backed up together. If you use a custom data directory, copy that directory instead.
- **Restore:** stop the app, retain a backup of current data, and replace the entire data folder with the saved copy. Restart. Never overwrite a running SQLite database.
- Deleting a project deletes its tasks, files, comments, time entries, milestones and activity; UI confirmation is required. Removing a contact unassigns its tasks and removes it from project membership.
- GitHub and the ZIP exclude environment files, credentials, real databases, uploads and dependency folders. The repository retains the minimal nonsecret port configuration.

## Architecture and maintenance

```text
packages/web/src/web/          React pages, components and typed query hooks
packages/web/src/shared/       Shared validated entity types and report calculations
packages/web/src/api/routes/   Typed oRPC workspace procedures
packages/web/src/api/services/ Validation, relations, persistence, files and timers
packages/web/src/api/database/ Drizzle tables and Bun SQLite driver
packages/web/migrations/       Versioned, idempotent SQL migrations
scripts/                      Setup, local launcher, optional demo seeder and packaging
tests/                        Bun service tests and optional browser-check script
```

Entities are stored in separate SQLite tables with validated JSON payloads. Application services enforce relation integrity and cleanup; this is **not** a translation of the PDF's Django relational models. Managed Expo and Electron template packages are retained, but mobile/native desktop clients are not implemented features of this delivery.

```sh
bun test tests/workspace.test.ts
bun run lint
bun run typecheck
bun run build
```

`bun scripts/setup.ts` applies versioned migrations without wiping records. Use it for existing installations. Drizzle configuration can generate future schema work, but do not use an unchecked `db:push` to change a populated user's database. Rebuild the web package after changing frontend code. Browser tests optionally require Python, Playwright, Chrome and the running seeded preview; these are **development tools only**, not app prerequisites.

Required Runable analytics remain in the template. Dependency tooling may also collect its standard telemetry. Local persistence does **not** mean the app makes zero external network requests. Poppins is self-hosted; no external image services are needed.

## Troubleshooting

- **“Bun not found”:** reinstall from the official instructions, reopen the terminal, and verify `bun --version`.
- **Installation failure:** check internet/proxy access and write permissions; rerun setup in a fully extracted folder. Do not copy Linux `node_modules` to Windows.
- **Port 4200 in use:** stop the other copy of Meridian or the conflicting service. Do not alter the managed port files.
- **Database/table errors:** stop the server and rerun setup from the app root. Never delete the data folder just to fix a setup error.
- **Native driver errors in Vite:** use `bun run dev`; plain `npx vite` runs Node and cannot load `bun:sqlite`.
- **No timeline bars:** add task start and due dates; undated tasks are listed without bars.
- **Timer won't start:** stop the current running timer and reopen completed tasks first.
- **No emailed mentions/invitations:** contacts and mentions are local records; sending messages is outside this single-user scope.

## GitHub and preview

Source repository: https://github.com/Au-Gold-79/Project-Management-Tool . GitHub is source hosting, not the backend host. GitHub Pages is not configured. See [docs/GITHUB.md](docs/GITHUB.md) for publication and preview notes.
