import { A, C, bg, footer, kicker, screen, title } from "./shared.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "User Experience");
  title(slide, ctx, "The interface makes decentralized booking usable through familiar screens and payment options.");
  await screen(slide, ctx, A.properties, 72, 205, 350, 230, "cover");
  await screen(slide, ctx, A.detail, 460, 205, 350, 230, "cover");
  await screen(slide, ctx, A.wallet, 848, 205, 350, 230, "cover");
  const captions = [
    ["Search", "Browse Kigali listings with district and property context."],
    ["Book", "View property details, request dates, and start deposit flow."],
    ["Pay", "Use wallet, MTN MoMo, or card while escrow is tracked."],
  ];
  captions.forEach((c, i) => {
    const x = 72 + i * 388;
    ctx.addText(slide, { x, y: 470, w: 350, h: 26, text: c[0], fontSize: 22, bold: true, color: [C.teal, C.green, C.gold][i], align: "center" });
    ctx.addText(slide, { x: x + 25, y: 505, w: 300, h: 48, text: c[1], fontSize: 15, color: C.muted, align: "center" });
  });
  footer(slide, ctx, 8);
  return slide;
}
