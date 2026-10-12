import { z } from "zod";
import { base } from "../__core/app";
import { entrySchema, kindSchema, report } from "../../shared/model";
import * as service from "../services/workspace";
import { isDemo } from "../services/workspace-config";

export const workspace = {
  read: base.handler(async () => ({ data: await service.workspace(), demo: isDemo })),
  save: base
    .input(z.object({ kind: kindSchema, item: entrySchema }))
    .handler(({ input }) => service.save(input.kind, input.item)),
  remove: base
    .input(z.object({ kind: kindSchema, id: z.string().uuid() }))
    .handler(({ input }) => service.remove(input.kind, input.id)),
  upload: base
    .input(
      z.object({
        projectId: z.string().uuid(),
        taskId: z.string().default(""),
        name: z.string().min(1).max(500),
        data: z.string().max(28_000_000),
        mime: z.string().max(200),
      }),
    )
    .handler(({ input }) => service.upload(input)),
  startTimer: base
    .input(z.object({ id: z.string().uuid() }))
    .handler(({ input }) => service.startTimer(input.id)),
  stopTimer: base
    .input(z.object({ id: z.string().uuid() }))
    .handler(({ input }) => service.stopTimer(input.id)),
  report: base
    .input(z.object({ projectId: z.string().default("") }))
    .handler(async ({ input }) => report(await service.workspace(), input.projectId)),
};
