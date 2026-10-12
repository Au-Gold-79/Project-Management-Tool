# Verification results

Tests run in a Debian Linux sandbox using Bun 1.4.2 and installed Google Chrome. Native Windows execution was **not** tested.

## Passed
- `bun test tests/workspace.test.ts`: 4 test groups, 38 assertions, zero failures.
  - Project/contact/task CRUD, assignment, created timestamp preservation and repeat setup without data loss.
  - Rejected invalid dates/statuses, negative budgets, empty names, invalid email, missing/foreign relations.
  - Comments, milestones, task status completion, report calculations, manual time and running timer rules.
  - File roundtrip, sanitized unsafe filenames, empty/invalid/oversized file rejection, safe attachment response, invalid/missing file handling and cascading cleanup.
- `bun run lint`: no violations or warnings.
- `bun run typecheck`: all three template packages passed after adding required server type declarations.
- `bun run build`: succeeded. Vite reported the nonblocking >500 kB frontend chunk warning and Node tooling deprecation notice.
- `python tests/browser-check.py`: real Chrome verification passed for project/task creation, contact assignment, accessible status changes, actual drag-and-drop, reload persistence, Gantt chart, comments/mentions, manual time, timer start/stop, file upload/download with content comparison, milestone completion, CSV export, cascading deletion and mobile navigation. No browser JavaScript errors recorded.
- Preview health endpoint returned HTTP 200; sample mode displayed a visible warning. Demo storage uses `demo-data`, while the Windows defaults use `data`.
- Sanitized ZIP: 123 files at the initial integrity check; excluded environment/credential files, node_modules, runtime databases and uploads. Every archive member was scanned against the actual secret values without printing them; no matches found.
- Clean extracted ZIP installed with `bun install --frozen-lockfile`, applied migrations, rebuilt the web app and passed all 4 test groups / 38 assertions. The clean frontend build was about 390 kB before gzip.
- Extracted ZIP local launcher passed real-browser empty-workspace, project creation and reload checks. Data remained after a server restart. Cross-origin browser access was rejected with HTTP 403.
- Repeat setup preserved existing records. The exact Windows source/scripts were tested for portable paths in Linux; this is not Windows certification.

## Scope and limitations
- Browser automation operates against a fictional sandbox workspace and removes only its own temporary test project.
- The Windows `.bat` launchers use quoted paths, native `cd /d`, Bun availability checks and explicit error handling; they have not been executed on Windows.
- Printing invokes the browser's print-to-PDF UI; no automated PDF-export fidelity test is claimed.
- This is a local single-user tool, not a production shared-account service. Local APIs are unauthenticated and must not be exposed publicly with real data.
- Template Expo/Electron packages are retained but no mobile or native executable delivery is claimed.