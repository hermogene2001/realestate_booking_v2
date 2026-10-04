import { A, C, bg, footer, metric, subtitle, text } from "./shared.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.deep);
  ctx.addShape(slide, { x: 18, y: 0, w: 640, h: 720, fill: C.deep, line: ctx.line(C.deep, 0) });
  await ctx.addImage(slide, { path: A.properties, x: 690, y: 42, w: 520, h: 510, fit: "cover", alt: "Platform properties page" });
  ctx.addShape(slide, { x: 640, y: 0, w: 70, h: 720, fill: "#09212ACC", line: ctx.line("#09212ACC", 0) });
  text(slide, ctx, { x: 66, y: 58, w: 560, h: 26, text: "CAPSTONE PROJECT DEFENSE", fontSize: 14, bold: true, color: C.green });
  text(slide, ctx, { x: 66, y: 122, w: 580, h: 170, text: "Blockchain-based real estate booking platform for safer rental deposits in Kigali", fontSize: 44, bold: true, color: C.white, typeface: "Aptos Display" });
  subtitle(slide, ctx, "A full-stack web dApp that combines verified listings, multi-payment booking, smart-contract escrow, fraud monitoring, and administrative dispute resolution.", 68, 322, 540, 20, C.mist);
  metric(slide, ctx, 70, 470, 170, "80+", "API endpoints", "15 route files", C.green);
  metric(slide, ctx, 260, 470, 170, "27", "Data models", "Prisma + MySQL", C.gold);
  metric(slide, ctx, 450, 470, 170, "4", "Core services", "Web, API, DB, chain", C.teal);
  footer(slide, ctx, 1, "Bachelor of Technology Capstone Project | Defense");
  return slide;
}
