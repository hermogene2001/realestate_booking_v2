import { C, bg, footer, kicker, title, flowNode, arrow } from "./shared.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, "#F3F7F5");
  kicker(slide, ctx, "Solution Architecture");
  title(slide, ctx, "The platform separates user experience, booking logic, verified records, and escrow settlement.");
  flowNode(slide, ctx, 70, 245, 235, 145, "Frontend PWA", "Next.js 14 + React\nProperties, booking, KYC, wallet, admin UI", C.white, C.teal);
  flowNode(slide, ctx, 370, 245, 255, 145, "Backend API", "Express + TypeScript\nAuth, properties, bookings, payments, fraud, notifications", C.white, C.green);
  flowNode(slide, ctx, 705, 170, 235, 120, "MySQL database", "Prisma ORM\nUsers, listings, bookings, payments, reviews, documents", C.white, C.gold);
  flowNode(slide, ctx, 705, 345, 235, 120, "Ethereum escrow", "Hardhat + Solidity\nLock, release, refund, dispute, fee", C.white, C.teal);
  flowNode(slide, ctx, 1000, 245, 190, 145, "Admin controls", "Approvals, fraud alerts, disputes, reports, commissions", C.white, C.red);
  arrow(slide, ctx, 310, 318, 365, C.green);
  arrow(slide, ctx, 630, 270, 700, C.gold);
  arrow(slide, ctx, 630, 390, 700, C.teal);
  arrow(slide, ctx, 945, 318, 994, C.red);
  ctx.addText(slide, { x: 92, y: 535, w: 1050, h: 42, text: "Design principle: tenants can use familiar web and mobile payment flows while high-risk deposits receive blockchain-backed accountability.", fontSize: 22, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 5);
  return slide;
}
