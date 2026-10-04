import { A, C, bg, footer, metric, screen, text } from "./shared.mjs";

export async function slide14(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.deep);
  text(slide, ctx, { x: 70, y: 58, w: 450, h: 26, text: "DEFENSE CLOSE", fontSize: 14, bold: true, color: C.green });
  text(slide, ctx, { x: 70, y: 122, w: 560, h: 150, text: "The contribution is a working trust layer for rental booking, not only another listing website.", fontSize: 42, bold: true, color: C.white, typeface: "Aptos Display" });
  text(slide, ctx, { x: 72, y: 310, w: 530, h: 78, text: "By locking deposits in escrow, verifying property evidence, and giving administrators auditable dispute and fraud tools, the platform directly addresses the highest-risk moment in Kigali rental booking: paying before trust is proven.", fontSize: 20, color: C.mist });
  metric(slide, ctx, 72, 455, 170, "Escrow", "Core innovation", "Condition-based release", C.green);
  metric(slide, ctx, 260, 455, 170, "PWA", "User access", "Mobile-friendly web", C.gold);
  metric(slide, ctx, 448, 455, 170, "UAT", "Next evidence", "Field validation", C.teal);
  await screen(slide, ctx, A.detail, 710, 90, 470, 420, "cover");
  text(slide, ctx, { x: 735, y: 558, w: 430, h: 40, text: "Thank you. Questions?", fontSize: 34, bold: true, color: C.white, align: "center" });
  footer(slide, ctx, 14, "Bachelor of Technology Capstone Project | Defense");
  return slide;
}
