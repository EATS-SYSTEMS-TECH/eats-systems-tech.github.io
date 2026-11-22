// WIFIGATE Manager, "simple management" spotlight: the Manager control panel
// as a line drawing, with no text so it suits every language. Buildings line
// the sidebar; a resident is added and another struck out; a guest link flies
// out of a phone with a timer that runs down; a day is scheduled on the
// calendar while a clock turns; new access history rows arrive one by one;
// a shield with a lock and a check seals it all. The loop starts and ends on
// the resting panel, so the start frame is the complete panel. Same line
// language as the other line heroes; js/line-spotlight.js mounts it.
// Builds the scene inside an empty <svg> and returns its deterministic render(t).
export const CONTROL_DURATION = 16;
export const CONTROL_STILL = 12.6;

export function createControlScene(svg) {
  var NS = 'http://www.w3.org/2000/svg';
  var BLUE = '#146BFF';
  /* Line tone, as in the Host and Manager scenes: every stroke opacity passes
     one curve that keeps 0 and 1 and lifts the pale context strokes
     (0.4 -> 0.75); every stroke weight is 1.2x; blue tints are 1.6x. */
  var TONE = 2.7, WEIGHT = 1.2, TINT = 1.6;
  function r3(v) { return (Math.round(v * 1000) / 1000).toString(); }
  function tone(k, v) {
    if (k === 'stroke-opacity') return r3(1 - Math.pow(1 - Math.min(1, Math.max(0, +v)), TONE));
    if (k === 'stroke-width') return r3(+v * WEIGHT);
    return v;
  }
  function el(tag, attrs, parent) {
    var e = svg.ownerDocument.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, tone(k, attrs[k]));
    (parent || svg).appendChild(e);
    return e;
  }
  function sa(e, n, v) {
    var c = e._c || (e._c = {});
    if (c[n] !== v) { e.setAttribute(n, tone(n, v)); c[n] = v; }
  }
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function f2(v) { return (Math.round(v * 100) / 100).toString(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function eOut(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  /* Length of a cubic Bezier, by a fixed number of chords (deterministic). */
  function cubicLen(a, b, c, d) {
    var len = 0, px = a[0], py = a[1];
    for (var i = 1; i <= 48; i++) {
      var u = i / 48, v = 1 - u;
      var x = v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0];
      var y = v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1];
      len += Math.hypot(x - px, y - py); px = x; py = y;
    }
    return len;
  }

  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  el('rect', { width: '1600', height: '900', fill: '#fff' });

  var CTX = { 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, PRIM = { 'stroke-width': 3 };
  function mk(tag, geometry, style, parent) {
    var a = { stroke: BLUE, fill: 'none' }, k;
    for (k in geometry) a[k] = geometry[k];
    for (k in style || CTX) a[k] = (style || CTX)[k];
    return el(tag, a, parent);
  }
  function rect(x, y, w, h, r, style, parent) { return mk('rect', { x: f1(x), y: f1(y), width: f1(w), height: f1(h), rx: f1(r) }, style, parent); }
  function line(x1, y1, x2, y2, style, parent) { return mk('line', { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2) }, style, parent); }
  function path(d, style, parent) { return mk('path', { d: d }, style, parent); }
  function circle(cx, cy, r, style, parent) { return mk('circle', { cx: f1(cx), cy: f1(cy), r: f1(r) }, style, parent); }
  function tint(x, y, w, h, r, parent) { return el('rect', { x: f1(x), y: f1(y), width: f1(w), height: f1(h), rx: f1(r), fill: BLUE, 'fill-opacity': r3(0.06 * TINT), stroke: 'none' }, parent); }
  function group(parent) { return el('g', {}, parent); }
  /* A layer fades in while it slides by (dx, dy) into place. */
  function show(g, u, dx, dy) {
    sa(g, 'opacity', f2(clamp(u, 0, 1)));
    sa(g, 'transform', 'translate(' + f1((1 - u) * (dx || 0)) + ' ' + f1((1 - u) * (dy || 0)) + ')');
  }
  function drawOn(e, len, u) {
    sa(e, 'stroke-dasharray', f1(len) + ' ' + f1(len + 10));
    sa(e, 'stroke-dashoffset', f1(len * (1 - clamp(u, 0, 1))));
  }

  /* ================================================================ timeline */
  var DUR = 16, STILL_T = 12.6;
  var RESET = [14.2, 15.2];                       /* the panel returns to its resting state */

  /* ================================================================ the panel (x 230..1370, y 90..810) */
  var WX = 230, WY = 90, WW = 1140, WH = 720, R = 22;
  path('M' + (WX + R) + ' ' + WY + 'H' + (WX + WW - R) + 'Q' + (WX + WW) + ' ' + WY + ' ' + (WX + WW) + ' ' + (WY + R) +
    'V' + (WY + WH - R) + 'Q' + (WX + WW) + ' ' + (WY + WH) + ' ' + (WX + WW - R) + ' ' + (WY + WH) +
    'H' + (WX + R) + 'Q' + WX + ' ' + (WY + WH) + ' ' + WX + ' ' + (WY + WH - R) + 'V' + (WY + R) + 'Q' + WX + ' ' + WY + ' ' + (WX + R) + ' ' + WY + 'Z', PRIM);
  /* the top bar: three dots and an address field with a small lock */
  line(WX, WY + 56, WX + WW, WY + 56);
  for (var dot = 0; dot < 3; dot++) circle(WX + 34 + dot * 26, WY + 28, 7);
  rect(WX + 470, WY + 16, 300, 24, 12);
  rect(WX + 484, WY + 26, 12, 10, 2);
  path('M' + (WX + 486) + ' ' + (WY + 26) + 'v-4a4 4 0 0 1 8 0v4');
  line(WX + 506, WY + 28, WX + 700, WY + 28);

  /* the sidebar: four buildings, the first one selected */
  var SX = WX + WW - 250, SY = WY + 56;
  line(SX, SY, SX, WY + WH);
  for (var b = 0; b < 4; b++) {
    var by = SY + 36 + b * 120;
    if (b === 0) tint(SX + 18, by - 14, 214, 100, 14);
    rect(SX + 40, by + 8, 44, 62, 4, b === 0 ? PRIM : CTX);
    for (var wy = 0; wy < 3; wy++) for (var wx = 0; wx < 2; wx++) rect(SX + 48 + wx * 18, by + 16 + wy * 16, 9, 9, 1.5);
    line(SX + 104, by + 26, SX + 210, by + 26, b === 0 ? PRIM : CTX);
    line(SX + 104, by + 50, SX + 176, by + 50);
  }

  /* four cards: guest invites, residents, history, events */
  var MX = WX + 30, MY = WY + 80, CW = 400, CH = 280, GAP = 26;
  function card(i) {
    var x = MX + (i % 2) * (CW + GAP), y = MY + Math.floor(i / 2) * (CH + GAP);
    rect(x, y, CW, CH, 18);
    return { x: x, y: y };
  }
  var cGuest = card(0), cUsers = card(1), cHist = card(2), cEvents = card(3);

  /* ================================================================ residents */
  function person(x, y, style, parent) {
    var g = group(parent);
    circle(x, y - 10, 13, style, g);
    path('M' + (x - 22) + ' ' + (y + 24) + 'q22 -26 44 0', style, g);
    line(x + 40, y - 6, x + 200, y - 6, style, g);
    line(x + 40, y + 16, x + 150, y + 16, CTX, g);
    return g;
  }
  var ux = cUsers.x, uy = cUsers.y;
  var users = [0, 1, 2].map(function (i) { return person(ux + 60, uy + 58 + i * 64, CTX); });
  var newUser = person(ux + 60, uy + 250, PRIM);
  var plus = group();
  circle(ux + CW - 50, uy + 250, 18, PRIM, plus);
  line(ux + CW - 59, uy + 250, ux + CW - 41, uy + 250, PRIM, plus);
  line(ux + CW - 50, uy + 241, ux + CW - 50, uy + 259, PRIM, plus);
  var STRIKE_LEN = 262;
  var strike = line(ux + 28, uy + 122, ux + 28 + STRIKE_LEN, uy + 122, PRIM);

  /* ================================================================ guest invite */
  var gx = cGuest.x, gy = cGuest.y;
  rect(gx + 46, gy + 60, 104, 190, 18, PRIM);
  line(gx + 84, gy + 78, gx + 112, gy + 78);
  rect(gx + 64, gy + 120, 68, 40, 10);
  var chain = group();
  path('M' + (gx + 82) + ' ' + (gy + 140) + 'h-6a8 8 0 0 1 0 -16h14', PRIM, chain);
  path('M' + (gx + 114) + ' ' + (gy + 140) + 'h6a8 8 0 0 0 0 -16h-14', PRIM, chain);
  var TRAIL = [[gx + 150, gy + 140], [gx + 220, gy + 120], [gx + 260, gy + 80], [gx + 330, gy + 92]];
  var TRAIL_LEN = cubicLen(TRAIL[0], TRAIL[1], TRAIL[2], TRAIL[3]);
  var trail = path('M' + TRAIL[0].join(' ') + 'C' + TRAIL[1].join(' ') + ' ' + TRAIL[2].join(' ') + ' ' + TRAIL[3].join(' '));
  var flyer = group();
  path('M0 0l44 -18l-14 40l-8 -16z', PRIM, flyer);
  line(8, 2, 30, -9, CTX, flyer);
  var timer = group();
  var TCX = gx + 300, TCY = gy + 210, TIMER_LEN = 2 * Math.PI * 40;
  circle(TCX, TCY, 40, CTX, timer);
  var timerArc = path('M' + TCX + ' ' + (TCY - 40) + 'A40 40 0 1 1 ' + (TCX - 0.1) + ' ' + (TCY - 40), PRIM, timer);
  line(TCX, TCY, TCX, TCY - 24, PRIM, timer);

  /* ================================================================ events */
  var ex = cEvents.x, ey = cEvents.y;
  rect(ex + 36, ey + 30, 220, 220, 14);
  line(ex + 36, ey + 74, ex + 256, ey + 74);
  for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) rect(ex + 50 + c * 41, ey + 88 + r * 40, 26, 24, 5);
  var dayTint = el('rect', { x: f1(ex + 128), y: f1(ey + 124), width: '34', height: '32', rx: '7', fill: BLUE, 'fill-opacity': '0', stroke: 'none' });
  var day = rect(ex + 132, ey + 128, 26, 24, 5);
  var KX = ex + 318, KY = ey + 140;
  circle(KX, KY, 46, PRIM);
  var hourHand = line(KX, KY, KX, KY - 26, PRIM), minHand = line(KX, KY, KX + 30, KY);

  /* ================================================================ access history */
  /* Six rows; at rest the three oldest are on the card. Row 0 arrives last. */
  var hx = cHist.x, hy = cHist.y, rows = [];
  for (var h = 0; h < 6; h++) {
    var row = group();
    circle(hx + 46, 0, 9, h === 0 ? PRIM : CTX, row);
    line(hx + 72, -6, hx + 300, -6, h === 0 ? PRIM : CTX, row);
    line(hx + 72, 12, hx + 220, 12, CTX, row);
    rows.push(row);
  }

  /* ================================================================ security seal */
  var SHX = WX + 60, SHY = WY - 30;
  var gShield = group();
  var SHIELD_LEN = 2 * Math.hypot(62, 22) + 58 + 58 +
    cubicLen([124, 64], [124, 114], [90, 144], [62, 158]) + cubicLen([62, 158], [34, 144], [0, 114], [0, 64]);
  var shield = mk('path', { d: 'M' + SHX + ' ' + (SHY + 6) + 'l62 -22l62 22v58c0 50 -34 80 -62 94c-28 -14 -62 -44 -62 -94z', fill: '#fff' }, PRIM, gShield);
  rect(SHX + 40, SHY + 52, 44, 36, 6, PRIM, gShield);
  var shackle = path('M' + (SHX + 48) + ' ' + (SHY + 52) + 'v-12a14 14 0 0 1 28 0v12', PRIM, gShield);
  var CHECK_LEN = Math.hypot(9, 9) + Math.hypot(17, 18);
  var check = path('M' + (SHX + 50) + ' ' + (SHY + 70) + 'l9 9l17 -18', PRIM, gShield);
  var ring = circle(SHX + 62, SHY + 60, 62, CTX, gShield);

  /* ================================================================ render */
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var back = 1 - seg(t, RESET[0], RESET[1]);     /* 1 until the reset, then 0 */

    /* a resident is added; another is struck out */
    show(plus, (seg(t, 0.8, 1.2) - seg(t, 2.2, 2.6)), 0, 0);
    show(newUser, eOut(seg(t, 1.1, 1.8)) * back, -30, 0);
    drawOn(strike, STRIKE_LEN, ease(seg(t, 2.8, 3.4)));
    sa(strike, 'opacity', f2(back));
    sa(users[1], 'opacity', f2(1 - 0.7 * seg(t, 3.2, 3.8) * back));

    /* a guest link flies out of the phone; its timer runs down */
    sa(chain, 'opacity', f2(seg(t, 3.8, 4.2) * back));
    var fly = ease(seg(t, 4.3, 5.7));
    var fx = gx + 150 + fly * 180, fy = gy + 140 - Math.sin(fly * Math.PI) * 40 - fly * 48;
    sa(flyer, 'transform', 'translate(' + f1(fx) + ' ' + f1(fy) + ') rotate(' + f1(-12 + fly * 18) + ')');
    sa(flyer, 'opacity', f2(seg(t, 4.2, 4.4) * back));
    drawOn(trail, TRAIL_LEN, ease(seg(t, 4.4, 5.7)));
    sa(trail, 'opacity', f2(back));
    show(timer, eOut(seg(t, 5.5, 6.0)) * back, 0, 12);
    drawOn(timerArc, TIMER_LEN, 1 - 0.75 * seg(t, 6.0, 12.0));

    /* a day is scheduled; the clock turns an hour, and back at the reset */
    var pick = seg(t, 6.4, 6.9) * back;
    sa(dayTint, 'fill-opacity', r3(0.1 * TINT * pick));
    sa(day, 'stroke-width', f2(1.5 + 1.5 * pick));
    sa(day, 'stroke-opacity', f2(0.4 + 0.6 * pick));
    var turn = 360 * (ease(seg(t, 6.7, 8.6)) - ease(seg(t, RESET[0], RESET[1])));
    sa(minHand, 'transform', 'rotate(' + f1(turn) + ' ' + KX + ' ' + KY + ')');
    sa(hourHand, 'transform', 'rotate(' + f1(turn / 12) + ' ' + KX + ' ' + KY + ')');

    /* three new history rows arrive at the top and push the older ones down */
    var n = t < 14.7 ? seg(t, 8.0, 10.6) * 3 : 0, whole = Math.floor(n), shift = whole + eOut(n - whole);
    var rowsAlpha = t < 14.7 ? 1 - seg(t, 14.2, 14.7) : seg(t, 14.8, 15.5);
    rows.forEach(function (g, i) {
      var y = hy + 60 + (i - 3 + shift) * 46;
      var arrived = i >= 3 ? 1 : eOut(clamp(n - (2 - i), 0, 1));
      var inside = clamp((hy + 270 - y) / 24, 0, 1);
      sa(g, 'transform', 'translate(0 ' + f1(y) + ')');
      sa(g, 'opacity', f2(arrived * inside * rowsAlpha));
    });

    /* the shield seals it all */
    var s = seg(t, 10.4, 11.4);
    sa(gShield, 'opacity', f2((s > 0 ? 1 : 0) * (1 - seg(t, RESET[0], RESET[0] + 0.8))));
    drawOn(shield, SHIELD_LEN, ease(s));
    sa(shackle, 'transform', 'translate(0 ' + f1((1 - eOut(seg(t, 11.2, 11.7))) * -8) + ')');
    drawOn(check, CHECK_LEN, ease(seg(t, 11.5, 12.0)));
    var pk = seg(t, 11.9, 13.1);
    sa(ring, 'opacity', f2(pk > 0 && pk < 1 ? 1 - pk : 0));
    sa(ring, 'r', f1(62 + pk * 34));
  }

  return { render: render, duration: DUR, still: STILL_T };
}
