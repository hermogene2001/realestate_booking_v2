import { C, bg, footer, kicker, title } from "./shared.mjs";

export async function slide12(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Objective Assessment");
  title(slide, ctx, "Two objectives are fully achieved; two are substantively built with clear remaining validation gaps.");
  const rows = [
    ["Analyze vulnerabilities", "Achieved", "Architecture addresses deposit theft, double-booking, dispute bias, KYC, impersonation, and fraud signals.", C.green],
    ["Design escrow architecture", "Fully achieved", "RealEstateEscrow contract deployed and verified with booking state machine and conditional release.", C.green],
    ["Build user-friendly dApp", "Partially achieved", "Responsive PWA completed; native mobile app and biometric/offline features remain out of scope.", C.gold],
    ["Evaluate effectiveness", "Partially achieved", "Technical evaluation and instruments delivered; live Kigali user study remains pending.", C.gold],
  ];
  ctx.addShape(slide, { x: 70, y: 205, w: 1100, h: 58, fill: C.deep, line: ctx.line(C.deep, 0) });
  ["Objective", "Status", "Defense evidence"].forEach((h, i) => ctx.addText(slide, { x: [92, 430, 650][i], y: 222, w: [300, 170, 460][i], h: 22, text: h, fontSize: 15, bold: true, color: C.white }));
  rows.forEach((r, i) => {
    const y = 272 + i * 88;
    ctx.addShape(slide, { x: 70, y, w: 1100, h: 76, fill: C.white, line: ctx.line(C.line, 1) });
    ctx.addShape(slide, { x: 70, y, w: 9, h: 76, fill: r[3], line: ctx.line(r[3], 0) });
    ctx.addText(slide, { x: 92, y: y + 21, w: 295, h: 34, text: r[0], fontSize: 18, bold: true, color: C.ink });
    ctx.addText(slide, { x: 430, y: y + 21, w: 160, h: 34, text: r[1], fontSize: 16, bold: true, color: r[3] });
    ctx.addText(slide, { x: 650, y: y + 14, w: 460, h: 48, text: r[2], fontSize: 14.5, color: C.muted });
  });
  footer(slide, ctx, 12);
  return slide;
}
