import { A, C, bg, footer, kicker, title, text } from "./shared.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, "#F7F4EA");
  kicker(slide, ctx, "Data Model");
  title(slide, ctx, "The data model supports trust workflows, not only property listing.");
  await ctx.addImage(slide, { path: A.erd, x: 58, y: 182, w: 710, h: 456, fit: "contain", alt: "Complete ERD diagram" });
  text(slide, ctx, { x: 820, y: 205, w: 360, h: 54, text: "Core entities", fontSize: 26, bold: true, color: C.ink });
  const rows = [
    ["User + Verification", "Roles, KYC, wallet, 2FA"],
    ["Property + Documents", "Approval workflow and ownership evidence"],
    ["Booking + Payment", "Lifecycle, dates, method, transaction hash"],
    ["Dispute + FraudAlert", "Exception handling and automated monitoring"],
    ["Review + Message", "Post-booking trust and communication"],
  ];
  rows.forEach((r, i) => {
    const y = 268 + i * 66;
    ctx.addShape(slide, { x: 820, y, w: 348, h: 50, fill: C.white, line: ctx.line(C.line, 1) });
    text(slide, ctx, { x: 835, y: y + 8, w: 165, h: 26, text: r[0], fontSize: 14, bold: true, color: C.teal });
    text(slide, ctx, { x: 1000, y: y + 8, w: 150, h: 30, text: r[1], fontSize: 12.5, color: C.muted });
  });
  footer(slide, ctx, 7);
  return slide;
}
