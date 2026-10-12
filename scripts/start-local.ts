import { resolve, sep } from "node:path";
import { createRequire } from "node:module";
import app from "../packages/web/src/api";

const root = resolve(import.meta.dirname, "..");
const ports = createRequire(import.meta.url)(resolve(root, "__ports.cjs"));
const dist = resolve(root, "packages/web/dist");
const server = Bun.serve({
  hostname: "127.0.0.1", port: ports.website,
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return new Response("Cross-origin access denied", { status: 403 });
    if (url.pathname.startsWith("/api/")) return app.fetch(request);
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); } catch { return new Response("Bad path", { status: 400 }); }
    const path = resolve(dist, `.${pathname}`);
    if (!path.startsWith(dist + sep) && path !== dist) return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    if (path !== dist && await file.exists()) return new Response(file);
    const index = Bun.file(resolve(dist, "index.html"));
    return await index.exists() ? new Response(index, { headers: { "Content-Type": "text/html" } }) : new Response("Run SETUP-WINDOWS.bat first.", { status: 500 });
  },
});
const url = `http://127.0.0.1:${server.port}`;
console.log(`Meridian is running at ${url}\nKeep this terminal open. Press Ctrl+C to stop.\nData stays in your local data folder.`);
if (process.platform === "win32" && !process.argv.includes("--no-browser")) Bun.spawn(["cmd", "/c", "start", "", url]);