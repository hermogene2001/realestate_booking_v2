import { C, bg, footer, kicker, miniBar, title } from "./shared.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Security Design");
  title(slide, ctx, "Security controls are layered around identity, input, payment, and smart-contract risk.");
  const controls = [
    ["JWT + refresh tokens", 92, C.teal],
    ["Role-based access", 88, C.green],
    ["Zod input validation", 90, C.gold],
    ["KYC + property docs", 82, C.teal],
    ["2FA + rate limits", 76, C.green],
    ["Fraud detection rules", 74, C.red],
  ];
  controls.forEach((r, i) => miniBar(slide, ctx, 90, 215 + i * 55, r[0], r[1], 100, r[2]));
  ctx.addShape(slide, { x: 770, y: 215, w: 360, h: 330, fill: C.deep, line: ctx.line(C.deep, 0) });
  ctx.addText(slide, { x: 800, y: 245, w: 300, h: 50, text: "Smart-contract safeguards", fontSize: 26, bold: true, color: C.white });
  const items = ["OpenZeppelin ReentrancyGuard", "Pausable emergency control", "Dual handover confirmation", "Timeout-based refund", "Admin dispute resolution"];
  items.forEach((item, i) => {
    ctx.addShape(slide, { x: 804, y: 318 + i * 40, w: 8, h: 8, fill: C.green, line: ctx.line(C.green, 0) });
    ctx.addText(slide, { x: 825, y: 307 + i * 40, w: 280, h: 30, text: item, fontSize: 16, color: C.mist });
  });
  footer(slide, ctx, 10);
  return slide;
}
