import { C, bg, footer, kicker, title, flowNode, arrow } from "./shared.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Methodology");
  title(slide, ctx, "A design-science approach links the problem analysis to a working, verified artifact.");
  const y = 260;
  flowNode(slide, ctx, 70, y, 210, 150, "1. Problem analysis", "Map rental fraud risks: deposits, identity, double-booking, and dispute gaps.", C.white, C.red);
  flowNode(slide, ctx, 340, y, 210, 150, "2. Architecture design", "Specify smart-contract escrow, API, database, roles, and payment flows.", C.white, C.teal);
  flowNode(slide, ctx, 610, y, 210, 150, "3. Prototype build", "Implement Next.js frontend, Express API, Prisma schema, and Solidity contract.", C.white, C.green);
  flowNode(slide, ctx, 880, y, 210, 150, "4. Technical evaluation", "Compile, deploy, test endpoints, verify escrow transaction, and prepare UAT framework.", C.white, C.gold);
  arrow(slide, ctx, 286, y + 75, 334);
  arrow(slide, ctx, 556, y + 75, 604);
  arrow(slide, ctx, 826, y + 75, 874);
  ctx.addText(slide, { x: 160, y: 505, w: 960, h: 54, text: "The artifact is evaluated through objective completion, technical verification, and a prepared user acceptance study framework.", fontSize: 23, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 4);
  return slide;
}
