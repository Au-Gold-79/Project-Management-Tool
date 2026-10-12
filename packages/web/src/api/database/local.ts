import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { dataDir } from "../services/workspace-config";
import * as schema from "./schema";

mkdirSync(dataDir, { recursive: true });
export const sqlite = new Database(resolve(dataDir, "workspace.sqlite"), { create: true });
sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
export const db = drizzle(sqlite, { schema });
