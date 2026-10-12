import { fresh, type Entry } from "../packages/web/src/shared/model";
import { list, save, record } from "../packages/web/src/api/services/workspace";
import { db } from "../packages/web/src/api/database/local";
import { files } from "../packages/web/src/api/database/schema";
import { uploadDir } from "../packages/web/src/api/services/workspace-config";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

if ((await list("projects")).length || (await list("members")).length) {
  console.log("Workspace is not empty; no sample data inserted.");
} else {
  const day = (offset: number) =>
    new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const members: Entry[] = [];
  for (const [name, role] of [
    ["Alex Morgan", "Product designer"],
    ["Sam Chen", "Developer"],
    ["Jordan Lee", "Project lead"],
    ["Taylor Brooks", "Content strategist"],
  ]) {
    members.push(
      await save(
        "members",
        fresh({ name, role, email: `${name.split(" ")[0].toLowerCase()}@example.com` }),
      ),
    );
  }
  const names = ["Website relaunch", "Customer experience", "Brand guidelines"];
  const projects: Entry[] = [];
  for (let i = 0; i < names.length; i++)
    projects.push(
      await save(
        "projects",
        fresh({
          name: names[i],
          description: [
            "A thoughtful new home for our product. Design, build, and ship the next chapter.",
            "Make every customer touchpoint simpler, clearer, and more helpful.",
            "One consistent visual language across every channel.",
          ][i],
          status: i === 2 ? "planning" : "in-progress",
          startDate: day(-14 + i * 3),
          dueDate: day(18 + i * 12),
          budget: [24000, 12000, 8000][i],
          priority: i === 0 ? "high" : "medium",
          memberIds: members.map((m) => m.id),
        }),
      ),
    );
  const taskNames = [
    [
      "Map the customer journey",
      "Design system foundations",
      "Homepage explorations",
      "Build responsive layouts",
      "Accessibility audit",
      "Launch checklist",
      "Stakeholder review",
      "Analytics implementation",
    ],
    [
      "Interview five customers",
      "Document support pain points",
      "Prototype onboarding flow",
      "Test the welcome sequence",
    ],
    ["Audit existing assets", "Define color and typography", "Create brand playbook"],
  ];
  for (let p = 0; p < projects.length; p++)
    for (let i = 0; i < taskNames[p].length; i++) {
      const status =
        p === 0
          ? ["done", "done", "review", "in-progress", "todo", "todo", "review", "in-progress"][i]
          : ["done", "in-progress", "todo", "todo"][i];
      const task = await save(
        "tasks",
        fresh({
          name: taskNames[p][i],
          description:
            "Capture requirements, collaborate on the approach, and document the final outcome.",
          projectId: projects[p].id,
          status,
          assigneeId: members[i % 4].id,
          priority: i % 3 === 0 ? "high" : "medium",
          startDate: day(-10 + i * 2),
          dueDate: day(-3 + i * 3 + p * 7),
          estimatedHours: 4 + i * 2,
        }),
      );
      if (i < 3)
        await save(
          "time",
          fresh({
            projectId: task.projectId,
            taskId: task.id,
            date: day(-1),
            hours: 2 + i,
            description: "Research and implementation",
          }),
        );
      if (i === 2)
        await save(
          "comments",
          fresh({
            projectId: task.projectId,
            taskId: task.id,
            content:
              "@Alex Morgan The updated direction looks good. Let's review the mobile layout next.",
            author: "Jordan Lee",
          }),
        );
    }
  for (const p of projects) {
    await save(
      "milestones",
      fresh({ name: "Discovery complete", projectId: p.id, dueDate: day(-5), completed: true }),
    );
    await save(
      "milestones",
      fresh({ name: "Ready for launch", projectId: p.id, dueDate: p.dueDate }),
    );
  }
  await mkdir(uploadDir, { recursive: true });
  const file = fresh({
    name: "project-brief.txt",
    projectId: projects[0].id,
    fileKey: crypto.randomUUID(),
    mime: "text/plain",
    createdAt: new Date().toISOString(),
  });
  const content =
    "Website relaunch — sample project brief\nGoal: Create a clear, accessible product experience.\nThis is fictional demo data.\n";
  file.size = Buffer.byteLength(content);
  await Bun.write(resolve(uploadDir, file.fileKey), content);
  await db.insert(files).values({ id: file.id, data: file });
  await record(projects[0].id, "Uploaded project brief");
  console.log("Fictional sample workspace created.");
}
