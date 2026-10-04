import { C, bg, bulletList, footer, kicker, metric, title } from "./shared.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Problem Framing");
  title(slide, ctx, "Traditional rental booking leaves tenants and owners exposed before trust is established.");
  bulletList(slide, ctx, 72, 238, [
    "Deposit payments are often made before property handover is independently guaranteed.",
    "Property ownership and listing legitimacy can be difficult to verify digitally.",
    "Disputes are slow, informal, and often biased toward the party holding the money.",
    "Manual booking channels create room for double-booking, impersonation, and weak audit trails.",
  ], 560, 70);
  metric(slide, ctx, 770, 225, 330, "Deposit theft", "Core user risk", "Owner can take funds before delivery", C.red);
  metric(slide, ctx, 770, 355, 330, "Double booking", "Operational risk", "Same property/date conflict", C.gold);
  metric(slide, ctx, 770, 485, 330, "No audit trail", "Governance risk", "Weak recovery and dispute evidence", C.teal);
  footer(slide, ctx, 2);
  return slide;
}
