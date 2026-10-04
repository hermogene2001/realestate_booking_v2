export const C = {
  ink: "#10202B",
  deep: "#09212A",
  navy: "#123B4A",
  teal: "#0D7C78",
  green: "#20A26B",
  gold: "#D8A135",
  paper: "#F7F4EA",
  mist: "#E8F1EE",
  line: "#C9D8D2",
  white: "#FFFFFF",
  muted: "#5D716D",
  red: "#B9574B",
};

export const A = {
  erd: "E:/realestate_booking/COMPLETE_ERD.png",
  schema: "E:/realestate_booking/appendix_b_database_schema_diagram.png",
  login: "E:/realestate_booking/thesis_screenshots/01-login.png",
  register: "E:/realestate_booking/thesis_screenshots/02-register.png",
  properties: "E:/realestate_booking/thesis_screenshots/03-properties.png",
  detail: "E:/realestate_booking/thesis_screenshots/04-property-detail.png",
  dashboard: "E:/realestate_booking/thesis_screenshots/05-dashboard.png",
  admin: "E:/realestate_booking/thesis_screenshots/06-admin.png",
  bookings: "E:/realestate_booking/thesis_screenshots/07-bookings.png",
  wallet: "E:/realestate_booking/thesis_screenshots/08-wallet.png",
};

export function bg(slide, ctx, fill = C.paper) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill, line: ctx.line(fill, 0) });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: ctx.H, fill: C.teal, line: ctx.line(C.teal, 0) });
}

export function kicker(slide, ctx, text, color = C.teal) {
  ctx.addShape(slide, { x: 58, y: 42, w: 10, h: 10, fill: color, line: ctx.line(color, 0), name: "kicker-marker" });
  ctx.addText(slide, {
    x: 78, y: 35, w: 360, h: 28, text: text.toUpperCase(), fontSize: 13, bold: true,
    color, typeface: "Aptos", valign: "middle", name: "kicker-label",
  });
}

export function title(slide, ctx, text, y = 76, w = 980, size = 38) {
  ctx.addText(slide, {
    x: 58, y, w, h: 92, text, fontSize: size, bold: true, color: C.ink,
    typeface: "Aptos Display", insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

export function subtitle(slide, ctx, text, x = 60, y = 170, w = 660, size = 21, color = C.muted) {
  ctx.addText(slide, { x, y, w, h: 78, text, fontSize: size, color, typeface: "Aptos" });
}

export function footer(slide, ctx, n, label = "Kigali Real Estate Booking Platform | Defense Deck") {
  ctx.addText(slide, { x: 60, y: 675, w: 780, h: 22, text: label, fontSize: 10, color: C.muted });
  ctx.addText(slide, { x: 1180, y: 675, w: 70, h: 22, text: String(n).padStart(2, "0"), fontSize: 12, bold: true, color: C.teal, align: "right" });
}

export function text(slide, ctx, box) {
  return ctx.addText(slide, { typeface: "Aptos", color: C.ink, ...box });
}

export function pill(slide, ctx, x, y, w, label, fill = C.mist, color = C.ink) {
  ctx.addShape(slide, { x, y, w, h: 38, fill, line: ctx.line(fill, 0) });
  ctx.addText(slide, { x: x + 12, y: y + 8, w: w - 24, h: 22, text: label, fontSize: 14, bold: true, color, align: "center", valign: "middle" });
}

export function metric(slide, ctx, x, y, w, value, label, note, accent = C.teal) {
  ctx.addShape(slide, { x, y, w, h: 112, fill: C.white, line: ctx.line(C.line, 1) });
  ctx.addShape(slide, { x, y, w: 6, h: 112, fill: accent, line: ctx.line(accent, 0) });
  ctx.addText(slide, { x: x + 20, y: y + 16, w: w - 34, h: 35, text: value, fontSize: 28, bold: true, color: accent, typeface: "Aptos Display" });
  ctx.addText(slide, { x: x + 20, y: y + 52, w: w - 34, h: 28, text: label, fontSize: 15, bold: true, color: C.ink });
  ctx.addText(slide, { x: x + 20, y: y + 80, w: w - 34, h: 26, text: note, fontSize: 11, color: C.muted });
}

export function bulletList(slide, ctx, x, y, items, w = 500, gap = 58, color = C.ink) {
  items.forEach((item, i) => {
    const yy = y + i * gap;
    ctx.addShape(slide, { x, y: yy + 7, w: 9, h: 9, fill: C.teal, line: ctx.line(C.teal, 0) });
    ctx.addText(slide, { x: x + 22, y: yy, w, h: gap - 8, text: item, fontSize: 18, color, typeface: "Aptos" });
  });
}

export function flowNode(slide, ctx, x, y, w, h, heading, body, fill = C.white, accent = C.teal) {
  ctx.addShape(slide, { x, y, w, h, fill, line: ctx.line(C.line, 1) });
  ctx.addShape(slide, { x, y, w, h: 5, fill: accent, line: ctx.line(accent, 0) });
  ctx.addText(slide, { x: x + 14, y: y + 16, w: w - 28, h: 28, text: heading, fontSize: 16, bold: true, color: C.ink });
  ctx.addText(slide, { x: x + 14, y: y + 48, w: w - 28, h: h - 56, text: body, fontSize: 12.5, color: C.muted });
}

export function arrow(slide, ctx, x1, y, x2, color = C.teal) {
  const w = Math.max(1, x2 - x1 - 14);
  ctx.addShape(slide, { x: x1, y, w, h: 3, fill: color, line: ctx.line(color, 0) });
  ctx.addShape(slide, { x: x2 - 14, y: y - 6, w: 0, h: 0, geometry: "triangle", fill: color, line: ctx.line(color, 0), rotation: 90 });
}

export async function screen(slide, ctx, imagePath, x, y, w, h, fit = "cover") {
  ctx.addShape(slide, { x: x - 6, y: y - 6, w: w + 12, h: h + 12, fill: "#DDE7E4", line: ctx.line("#DDE7E4", 0) });
  await ctx.addImage(slide, { path: imagePath, x, y, w, h, fit, alt: "Project screenshot" });
}

export function miniBar(slide, ctx, x, y, label, value, max, color = C.teal) {
  ctx.addText(slide, { x, y, w: 160, h: 24, text: label, fontSize: 13, color: C.ink, bold: true });
  ctx.addShape(slide, { x: x + 170, y: y + 6, w: 220, h: 10, fill: "#DDE7E4", line: ctx.line("#DDE7E4", 0) });
  ctx.addShape(slide, { x: x + 170, y: y + 6, w: 220 * (value / max), h: 10, fill: color, line: ctx.line(color, 0) });
  ctx.addText(slide, { x: x + 402, y: y - 1, w: 90, h: 24, text: String(value), fontSize: 13, color, bold: true });
}
