import { resolve } from "node:path";

export const appRoot = resolve(import.meta.dirname, "../../../../..");
export const dataDir = resolve(process.env.APP_DATA_DIR || resolve(appRoot, "data"));
export const uploadDir = resolve(dataDir, "uploads");
export const isDemo = process.env.APP_MODE === "demo";
