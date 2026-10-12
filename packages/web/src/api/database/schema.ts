import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Entry } from "../../shared/model";

// Separate entity tables. Typed JSON payloads allow one reusable local-workspace
// service; relation validation and cascading cleanup are enforced in that service.
const entityTable = (name: string) =>
  sqliteTable(name, {
    id: text("id").primaryKey(),
    data: text("data", { mode: "json" }).$type<Entry>().notNull(),
  });
export const projects = entityTable("projects");
export const tasks = entityTable("tasks");
export const members = entityTable("members");
export const comments = entityTable("comments");
export const milestones = entityTable("milestones");
export const time = entityTable("time_entries");
export const files = entityTable("files");
export const activity = entityTable("activity");
export const profile = entityTable("profile");
