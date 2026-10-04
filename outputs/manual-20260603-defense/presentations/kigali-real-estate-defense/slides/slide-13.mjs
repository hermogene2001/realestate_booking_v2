import { C, bg, footer, kicker, title, flowNode } from "./shared.mjs";

export async function slide13(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, "#F3F7F5");
  kicker(slide, ctx, "Limitations And Future Work");
  title(slide, ctx, "The next phase moves from verified prototype to field-tested platform.");
  flowNode(slide, ctx, 80, 220, 245, 150, "Current limitations", "No completed live user study\nResponsive web app, not native mobile\nNo long-term production fraud dataset", C.white, C.red);
  flowNode(slide, ctx, 365, 220, 245, 150, "Near-term work", "Conduct UAT with Kigali tenants and owners\nRun load and security tests\nDeploy staging environment", C.white, C.gold);
  flowNode(slide, ctx, 650, 220, 245, 150, "Product maturity", "Add native mobile app\nImprove offline support\nExpand MoMo/Card production integrations", C.white, C.teal);
  flowNode(slide, ctx, 935, 220, 245, 150, "Research extension", "Measure fraud reduction over time\nCompare escrow trust against agent-mediated booking\nStudy blockchain comprehension", C.white, C.green);
  ctx.addText(slide, { x: 142, y: 500, w: 980, h: 54, text: "Most important next evidence: real users completing end-to-end bookings and reporting whether escrow increases perceived deposit safety.", fontSize: 24, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 13);
  return slide;
}
