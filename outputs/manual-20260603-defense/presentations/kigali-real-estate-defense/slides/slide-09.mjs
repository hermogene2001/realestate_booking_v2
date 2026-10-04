import { A, C, bg, footer, kicker, metric, screen, title } from "./shared.mjs";

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, "#F3F7F5");
  kicker(slide, ctx, "Implementation Evidence");
  title(slide, ctx, "The prototype is operational across frontend, backend, database, and blockchain services.");
  metric(slide, ctx, 70, 210, 210, "32", "Frontend pages", "PWA build generated successfully", C.teal);
  metric(slide, ctx, 305, 210, 210, "15", "Route files", "80+ backend endpoints", C.green);
  metric(slide, ctx, 540, 210, 210, "0", "TypeScript errors", "Backend compile check passed", C.gold);
  metric(slide, ctx, 775, 210, 210, "1", "Verified escrow tx", "Deposit locked on-chain", C.red);
  await screen(slide, ctx, A.dashboard, 100, 390, 335, 180, "cover");
  await screen(slide, ctx, A.admin, 475, 390, 335, 180, "cover");
  await screen(slide, ctx, A.bookings, 850, 390, 335, 180, "cover");
  footer(slide, ctx, 9);
  return slide;
}
