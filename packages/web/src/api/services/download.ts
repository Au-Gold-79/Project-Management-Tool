import type { Context } from "hono";
import { resolve } from "node:path";
import { get } from "./workspace";
import { uploadDir } from "./workspace-config";

export async function download(c: Context) {
  const id = c.req.param("id");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return c.json({ error: "Invalid file" }, 400);
  try {
    const item = await get("files", id);
    if (!/^[0-9a-f-]{36}$/.test(item.fileKey)) return c.json({ error: "Invalid file" }, 400);
    const file = Bun.file(resolve(uploadDir, item.fileKey));
    if (!(await file.exists())) return c.json({ error: "File not found" }, 404);
    return new Response(file.stream(), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`,
      },
    });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
}
