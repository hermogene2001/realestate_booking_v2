import { C, bg, footer, kicker, title } from "./shared.mjs";

export async function slide11(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, "#F7F4EA");
  kicker(slide, ctx, "Evaluation");
  title(slide, ctx, "The system has technical evidence now; live user validation is the next research step.");
  const cols = [
    ["Technical verification", "Passed", C.green, ["Backend TypeScript compile: zero errors", "Frontend production build: 32 static pages", "Blockchain escrow deployment and test tx", "Database synced with 27 Prisma models"]],
    ["User acceptance framework", "Prepared", C.gold, ["UAT methodology for 12-20 users", "SUS usability questionnaire", "Perceived security questionnaire", "Comparative analysis against traditional agents"]],
    ["Production evidence", "Pending", C.red, ["No live user study completed yet", "No fraud-prevention metrics over time", "Load testing still required", "Native mobile app not completed"]],
  ];
  cols.forEach((col, i) => {
    const x = 70 + i * 385;
    ctx.addShape(slide, { x, y: 215, w: 330, h: 385, fill: C.white, line: ctx.line(C.line, 1) });
    ctx.addText(slide, { x: x + 22, y: 238, w: 280, h: 32, text: col[0], fontSize: 22, bold: true, color: C.ink });
    ctx.addText(slide, { x: x + 22, y: 285, w: 120, h: 32, text: col[1], fontSize: 16, bold: true, color: col[2], align: "center", fill: "#EFF5F2", valign: "middle" });
    col[3].forEach((item, j) => {
      ctx.addShape(slide, { x: x + 26, y: 350 + j * 45, w: 8, h: 8, fill: col[2], line: ctx.line(col[2], 0) });
      ctx.addText(slide, { x: x + 44, y: 340 + j * 45, w: 260, h: 34, text: item, fontSize: 13.5, color: C.muted });
    });
  });
  footer(slide, ctx, 11);
  return slide;
}
