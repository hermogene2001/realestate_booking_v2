import { C, bg, flowNode, footer, kicker, title } from "./shared.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Research Objectives");
  title(slide, ctx, "The project translates rental-market vulnerabilities into four testable system objectives.");
  const nodes = [
    ["Analyze", "Identify financial friction and fraud patterns in Kigali residential booking."],
    ["Design", "Create smart-contract escrow for conditional locking and release of rental deposits."],
    ["Develop", "Build a user-friendly decentralized booking application for non-technical users."],
    ["Evaluate", "Assess security, technical effectiveness, and user acceptance against deposit fraud."],
  ];
  nodes.forEach((n, i) => flowNode(slide, ctx, 90 + i * 290, 250, 235, 188, n[0], n[1], C.white, [C.red, C.teal, C.green, C.gold][i]));
  ctx.addText(slide, { x: 142, y: 500, w: 960, h: 58, text: "Defense focus: show how each objective moved from research problem to implemented, verifiable system behavior.", fontSize: 24, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 3);
  return slide;
}
