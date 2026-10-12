import { resolve } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { Database } from "bun:sqlite";

const root = resolve(import.meta.dirname, "..");
if (!(await Bun.file(resolve(root, ".env")).exists()))
  await Bun.write(resolve(root, ".env"), "APP_MODE=local\nAPP_DATA_DIR=./data\n");
const dir = resolve(process.env.APP_DATA_DIR || resolve(root, "data"));
await mkdir(resolve(dir, "uploads"), { recursive: true });
const db = new Database(resolve(dir, "workspace.sqlite"), { create: true });
db.exec("CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY);");
const migrations = resolve(root, "packages/web/migrations");
for (const name of (await readdir(migrations)).filter((n) => n.endsWith(".sql")).sort()) {
  if (db.query("SELECT name FROM app_migrations WHERE name=?").get(name)) continue;
  const sql = await Bun.file(resolve(migrations, name)).text();
  db.transaction(() => {
    db.exec(sql);
    db.query("INSERT INTO app_migrations (name) VALUES (?)").run(name);
  })();
  console.log(`Applied ${name}`);
}
db.close();
console.log(`Workspace ready: ${dir}. Existing data preserved.`);
