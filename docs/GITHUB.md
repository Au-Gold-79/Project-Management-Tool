# Source publishing and preview

Repository: https://github.com/Au-Gold-79/Project-Management-Tool

The existing public repository's history and project title are retained. Source files, migrations, tests and Windows scripts are published; `.env`, tokens, runtime databases, uploads, caches and `node_modules` are excluded. The only retained Runable metadata is the nonsecret `.runable/ports.json` required by `__ports.cjs`.

## Get the source
```sh
git clone https://github.com/Au-Gold-79/Project-Management-Tool.git
cd Project-Management-Tool
bun install --frozen-lockfile
bun scripts/setup.ts
bun run --filter @template/web build
bun scripts/start-local.ts
```

The GitHub source archive has no built interface: setup builds it. The separately delivered Windows ZIP includes a verified frontend build, and setup still rebuilds it for your installation.

## Update your own checkout
Use GitHub Desktop or an authenticated Git client. Before committing, inspect staged files to ensure no credentials, personal data or uploaded files are included. Do not force-push or overwrite unrelated work.

```sh
git add .
git diff --cached --stat
git commit -m "Describe your changes"
git push origin main
```

## Interactive preview
Open the **Meridian — Interactive Demo** website artifact delivered in Runable. It uses the same source with a separate fictional sample-data database. GitHub does not host its API or SQLite data. No GitHub Pages site or independent production server is configured.

A permanent/shareable public URL is controlled by Runable's platform Publish UI. No permanent URL is embedded here because one has not been issued. An unauthenticated sample demo is not an appropriate place for real personal or confidential project data.