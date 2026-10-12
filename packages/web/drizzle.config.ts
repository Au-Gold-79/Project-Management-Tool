import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/api/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: resolve(process.env.APP_DATA_DIR || "../../data", "workspace.sqlite"),
  },
});
