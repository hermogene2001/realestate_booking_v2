import { C, bg, footer, kicker, title, flowNode, arrow } from "./shared.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Escrow Mechanism");
  title(slide, ctx, "Smart-contract escrow changes the booking from trust-first to condition-first.");
  const y = 235;
  flowNode(slide, ctx, 65, y, 180, 150, "Created", "Booking request is recorded with tenant, owner, property, amount, and timeout.", C.white, C.muted);
  flowNode(slide, ctx, 295, y, 180, 150, "Locked", "Deposit is submitted and held by the RealEstateEscrow contract.", C.white, C.teal);
  flowNode(slide, ctx, 525, y, 180, 150, "Confirmed", "Tenant and owner both confirm handover before funds are released.", C.white, C.green);
  flowNode(slide, ctx, 755, y - 78, 190, 126, "Completed", "Owner receives deposit minus platform fee.", C.white, C.green);
  flowNode(slide, ctx, 755, y + 100, 190, 126, "Refunded", "Timeout, cancellation, or admin decision returns funds.", C.white, C.gold);
  flowNode(slide, ctx, 1000, y + 10, 180, 150, "Disputed", "Admin reviews evidence and resolves on-chain outcome.", C.white, C.red);
  arrow(slide, ctx, 252, y + 75, 290);
  arrow(slide, ctx, 482, y + 75, 520);
  arrow(slide, ctx, 712, y + 55, 750, C.green);
  arrow(slide, ctx, 712, y + 135, 750, C.gold);
  arrow(slide, ctx, 950, y + 150, 995, C.red);
  ctx.addText(slide, { x: 128, y: 545, w: 980, h: 38, text: "Contract controls: ReentrancyGuard, Pausable, configurable 2.5% fee, timeout refund, admin dispute resolution.", fontSize: 22, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 6);
  return slide;
}
