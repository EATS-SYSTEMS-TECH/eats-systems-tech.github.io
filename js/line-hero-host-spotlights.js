// WIFIGATE Host page spotlights, in the line language of the other line heroes
// (js/line-spotlight.js mounts them; no text, so they suit every language):
//   createHostBookingScene - a booking system receives a new booking, it is
//     confirmed, travels to WIFIGATE Host, which issues an access link; the
//     link flies to the guest's phone, the lock on it opens, and only the
//     entrances of the booking light up (the fourth stays dark).
//   createHostStayScene - a guest with a suitcase walks up, the phone signals
//     the WIFIGATE device, the gate slides open, then the hotel door opens and
//     the guest walks in; the view follows inside, to the corridor, where the
//     door of the guest's room opens the same way. Above, the stay runs from
//     check-in to check-out, where a lock closes: the access ends by itself.
// Each loop starts and ends on its resting picture, so the start frame is a
// complete drawing. Each factory builds its scene inside an empty <svg> and
// returns its deterministic render(t).
export const HOST_BOOKING_DURATION = 13.5;
export const HOST_BOOKING_STILL = 8.4;
export const HOST_STAY_DURATION = 19;
export const HOST_STAY_STILL = 14.0;

// Shared drawing kit: the brand line tone and small shape helpers.
function lineKit(svg) {
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
  function tint(x, y, w, h, r, parent) { return el('rect', { x: f1(x), y: f1(y), width: f1(w), height: f1(h), rx: f1(r), fill: BLUE, 'fill-opacity': '0', stroke: 'none' }, parent); }
  function group(parent) { return el('g', {}, parent); }
  function drawOn(e, len, u) {
    sa(e, 'stroke-dasharray', f1(len) + ' ' + f1(len + 10));
    sa(e, 'stroke-dashoffset', f1(len * (1 - clamp(u, 0, 1))));
  }
  /* Length of a quadratic Bezier, by a fixed number of chords (deterministic). */
  function quadPoint(a, c, b, u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
  function quadLen(a, c, b) { var len = 0, p = a; for (var i = 1; i <= 48; i++) { var q = quadPoint(a, c, b, i / 48); len += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return len; }

  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  el('rect', { width: '1600', height: '900', fill: '#fff' });

  return { BLUE: BLUE, TINT: TINT, CTX: CTX, PRIM: PRIM, el: el, sa: sa, r3: r3, f1: f1, f2: f2, clamp: clamp, seg: seg, ease: ease, eOut: eOut,
    mk: mk, rect: rect, line: line, path: path, circle: circle, tint: tint, group: group, drawOn: drawOn, quadPoint: quadPoint, quadLen: quadLen };
}

export function createHostBookingScene(svg) {
  var K = lineKit(svg), CTX = K.CTX, PRIM = K.PRIM, sa = K.sa, f1 = K.f1, f2 = K.f2, seg = K.seg, ease = K.ease, eOut = K.eOut;
  var DUR = 13.5, STILL_T = 8.4, RESET = [11.4, 12.4];

  /* ================================================================ the booking system */
  K.rect(140, 190, 480, 520, 22, PRIM);
  K.line(140, 244, 620, 244);
  for (var d = 0; d < 3; d++) K.circle(170 + d * 24, 217, 6);
  for (var c = 0; c < 7; c++) K.rect(188 + c * 60, 270, 44, 26, 6);
  [[0, 200, 180], [1, 320, 240], [2, 180, 120], [2, 420, 160]].forEach(function (b) {
    var y = 320 + b[0] * 70;
    var tt = K.tint(b[1], y, b[2], 28, 14); sa(tt, 'fill-opacity', K.r3(0.06 * K.TINT));
    K.rect(b[1], y, b[2], 28, 14);
  });
  /* the new booking grows on the fourth row and is confirmed */
  var NB = { x: 260, y: 530, w: 240 };
  var newTint = K.tint(NB.x, NB.y, NB.w, 28, 14);
  var newBar = K.rect(NB.x, NB.y, 1, 28, 14, PRIM);
  var confirm = K.group();
  K.circle(560, 544, 20, PRIM, confirm);
  var CHECK_LEN = Math.hypot(8, 8) + Math.hypot(15, 15);
  var check = K.path('M550 545l8 8l15 -15', PRIM, confirm);

  /* ================================================================ WIFIGATE Host */
  var HX = 800, HY = 450;
  var hubTint = K.tint(HX - 80, HY - 80, 160, 160, 34);
  K.rect(HX - 80, HY - 80, 160, 160, 34, PRIM);
  K.circle(HX - 30, HY, 22, PRIM);
  K.line(HX - 8, HY, HX + 46, HY, PRIM); K.line(HX + 26, HY, HX + 26, HY + 16, PRIM); K.line(HX + 40, HY, HX + 40, HY + 12, PRIM);
  var pulse = K.circle(HX, HY, 100);

  /* the booking travels from the system to WIFIGATE Host */
  var IN = [[520, 544], [660, 520], [HX - 84, HY]], IN_LEN = K.quadLen(IN[0], IN[1], IN[2]);
  var inTrail = K.path('M' + IN[0].join(' ') + 'Q' + IN[1].join(' ') + ' ' + IN[2].join(' '));
  var card = K.group();
  K.rect(-42, -26, 84, 52, 10, PRIM, card); K.line(-26, -8, 26, -8, CTX, card); K.line(-26, 10, 10, 10, CTX, card);

  /* ================================================================ the guest's phone and the entrances */
  var PX = 1245, PY = 370;
  K.rect(1170, 220, 150, 300, 24, PRIM);
  K.line(1225, 242, 1265, 242);
  var screen = K.group();
  K.rect(PX - 25, PY, 50, 40, 7, PRIM, screen);
  var shackle = K.path('M' + (PX - 17) + ' ' + PY + 'v-14a17 17 0 0 1 34 0v14', PRIM, screen);
  K.line(PX - 40, PY + 72, PX + 40, PY + 72, CTX, screen); K.line(PX - 26, PY + 94, PX + 26, PY + 94, CTX, screen);

  /* four entrances: gate, parking barrier, door, roller shutter (not in this booking) */
  var tiles = [];
  for (var i = 0; i < 4; i++) {
    var tx = 1052 + i * 96, ty = 600, g = K.group();
    var glow = K.tint(tx, ty, 80, 90, 14, g);
    var frame = K.rect(tx, ty, 80, 90, 14, CTX, g);
    if (i === 0) { K.rect(tx + 14, ty + 22, 52, 50, 3, CTX, g); for (var bx = 1; bx < 5; bx++) K.line(tx + 14 + bx * 10.4, ty + 22, tx + 14 + bx * 10.4, ty + 72, CTX, g); }
    if (i === 1) { K.line(tx + 20, ty + 26, tx + 20, ty + 74, CTX, g); K.line(tx + 20, ty + 32, tx + 66, ty + 32, CTX, g); K.line(tx + 12, ty + 74, tx + 28, ty + 74, CTX, g); }
    if (i === 2) { K.rect(tx + 24, ty + 16, 32, 58, 3, CTX, g); K.circle(tx + 48, ty + 47, 3, CTX, g); }
    if (i === 3) { K.rect(tx + 14, ty + 18, 52, 56, 3, CTX, g); for (var sl = 1; sl < 5; sl++) K.line(tx + 14, ty + 18 + sl * 11.2, tx + 66, ty + 18 + sl * 11.2, CTX, g); }
    tiles.push({ glow: glow, frame: frame });
  }

  /* the access link flies from WIFIGATE Host to the phone */
  var OUT = [[HX + 84, HY], [1060, 290], [PX, 330]], OUT_LEN = K.quadLen(OUT[0], OUT[1], OUT[2]);
  var outTrail = K.path('M' + OUT[0].join(' ') + 'Q' + OUT[1].join(' ') + ' ' + OUT[2].join(' '));
  var link = K.group();
  K.mk('rect', { x: '-85', y: '-35', width: '170', height: '70', rx: '16', fill: '#fff' }, PRIM, link);
  K.path('M-46 6h-6a8 8 0 0 1 0 -16h14', PRIM, link); K.path('M-30 6h6a8 8 0 0 0 0 -16h-14', PRIM, link);
  K.line(2, -2, 62, -2, CTX, link); K.line(2, -10, 2, 6, PRIM, link); K.line(62, -10, 62, 6, PRIM, link);

  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var back = 1 - seg(t, RESET[0], RESET[1]);
    /* a booking arrives and is confirmed */
    var grow = ease(seg(t, 0.6, 1.4));
    sa(newBar, 'width', f1(Math.max(1, NB.w * grow)));
    sa(newBar, 'opacity', f2(K.clamp(grow * 8, 0, 1) * back));
    sa(newTint, 'width', f1(Math.max(1, NB.w * grow)));
    sa(newTint, 'fill-opacity', K.r3(0.1 * K.TINT * grow * back));
    sa(confirm, 'opacity', f2(seg(t, 1.3, 1.5) * back));
    K.drawOn(check, CHECK_LEN, ease(seg(t, 1.4, 1.9)));
    /* it travels to WIFIGATE Host */
    var mv = ease(seg(t, 2.0, 3.4)), p = K.quadPoint(IN[0], IN[1], IN[2], mv);
    sa(card, 'transform', 'translate(' + f1(p[0]) + ' ' + f1(p[1]) + ') scale(' + f2(1 - 0.3 * mv) + ')');
    sa(card, 'opacity', f2(seg(t, 1.9, 2.1) * (1 - seg(t, 3.2, 3.5))));
    K.drawOn(inTrail, IN_LEN, mv);
    sa(inTrail, 'opacity', f2(back));
    /* WIFIGATE Host issues the access link */
    var pk = seg(t, 3.4, 4.4);
    sa(pulse, 'opacity', f2(pk > 0 && pk < 1 ? 1 - pk : 0)); sa(pulse, 'r', f1(96 + pk * 50));
    sa(hubTint, 'fill-opacity', K.r3(0.1 * K.TINT * (seg(t, 3.4, 3.8) - seg(t, 4.8, 5.6))));
    var fl = ease(seg(t, 4.2, 5.8)), q = K.quadPoint(OUT[0], OUT[1], OUT[2], fl);
    sa(link, 'transform', 'translate(' + f1(q[0]) + ' ' + f1(q[1]) + ') scale(' + f2(1 - 0.45 * fl) + ')');
    sa(link, 'opacity', f2(seg(t, 4.1, 4.3) * (1 - seg(t, 5.7, 6.0))));
    K.drawOn(outTrail, OUT_LEN, fl);
    sa(outTrail, 'opacity', f2(back));
    /* the lock on the phone opens */
    sa(screen, 'opacity', f2(seg(t, 5.8, 6.1) * back));
    sa(shackle, 'transform', 'translate(0 ' + f1(-12 * eOut(seg(t, 6.2, 6.6))) + ')');
    /* only the entrances of the booking light up */
    tiles.forEach(function (tile, i) {
      var on = i < 3 ? eOut(seg(t, 6.6 + i * 0.4, 6.95 + i * 0.4)) * back : 0;
      sa(tile.glow, 'fill-opacity', K.r3(0.08 * K.TINT * on));
      sa(tile.frame, 'stroke-width', f2(1.5 + 1.5 * on));
      sa(tile.frame, 'stroke-opacity', f2(0.4 + 0.6 * on));
    });
  }
  return { render: render, duration: DUR, still: STILL_T };
}

export function createHostStayScene(svg) {
  var K = lineKit(svg), CTX = K.CTX, PRIM = K.PRIM, sa = K.sa, f1 = K.f1, f2 = K.f2, seg = K.seg, ease = K.ease, eOut = K.eOut;
  var DUR = 19, STILL_T = 14.0, GROUND = 720, PAN = 1260, RESET = [17.6, 18.0, 18.6];

  /* ================================================================ the stay, from check-in to check-out (fixed) */
  var T0 = 320, T1 = 1280, TY = 150;
  K.line(T0, TY, T1, TY);
  /* check-in: an arrow into a doorway; check-out: a lock that closes */
  K.path('M' + (T0 - 12) + ' ' + (TY - 66) + 'h24v40h-24', CTX); K.path('M' + (T0 - 34) + ' ' + (TY - 46) + 'h30m-8 -8l8 8l-8 8', CTX);
  K.circle(T0, TY, 9, PRIM);
  var progress = K.line(T0, TY, T0, TY, PRIM);
  var marker = K.mk('circle', { cx: f1(T0), cy: f1(TY), r: '12', fill: '#fff' }, PRIM);
  var lockBody = K.rect(T1 - 18, TY - 14, 36, 30, 6, CTX);
  var lockTop = K.path('M' + (T1 - 11) + ' ' + (TY - 14) + 'v-10a11 11 0 0 1 22 0v10', CTX);

  /* ================================================================ the world: street, gate, hotel, then its corridor */
  var world = K.group(), outside = K.group(world), inside = K.group(world);
  K.line(100, GROUND, 1450, GROUND, CTX, outside); K.line(100, GROUND + 22, 1450, GROUND + 22, CTX, outside);
  K.line(120, 600, 548, 600, CTX, outside); K.line(120, 600, 120, GROUND, CTX, outside);
  /* the sliding leaf runs behind the wall on the right */
  var leaf = K.group(outside);
  K.mk('rect', { x: '568', y: '540', width: '184', height: '170', rx: '4', fill: '#fff' }, PRIM, leaf);
  for (var bx = 1; bx < 8; bx++) K.line(568 + bx * 23, 548, 568 + bx * 23, 702, CTX, leaf);
  K.mk('rect', { x: '772', y: '530', width: '230', height: '190', rx: '3', fill: '#fff' }, CTX, outside);
  K.line(772, 580, 1002, 580, CTX, outside); K.line(772, 640, 1002, 640, CTX, outside);
  K.rect(548, 500, 20, 220, 3, PRIM, outside); K.rect(752, 500, 20, 220, 3, PRIM, outside);
  /* the WIFIGATE devices: at the gate, at the hotel door and at the room door */
  function device(x, y, parent) {
    K.rect(x, y, 18, 28, 4, PRIM, parent);
    return K.mk('circle', { cx: f1(x + 9), cy: f1(y + 10), r: '4.5', fill: K.BLUE, 'fill-opacity': '0' }, PRIM, parent);
  }
  var gateLight = device(522, 586, outside);
  /* the hotel, its windows and the entrance door */
  K.rect(1020, 300, 400, 420, 6, PRIM, outside);
  K.line(1000, 300, 1440, 300, PRIM, outside);
  for (var wr = 0; wr < 3; wr++) for (var wc = 0; wc < 4; wc++) K.rect(1052 + wc * 90, 340 + wr * 80, 40, 44, 4, CTX, outside);
  K.rect(1160, 600, 90, 120, 4, PRIM, outside);
  var door = K.mk('rect', { x: '1164', y: '604', width: '82', height: '116', rx: '3', fill: '#fff' }, CTX, outside);
  var doorLight = device(1266, 626, outside);
  /* inside: the corridor on the guest's floor (x 1500..2620), shown after the pan */
  var CX0 = 1500, CX1 = 2620, CEIL = 360;
  K.rect(CX0, CEIL, CX1 - CX0, GROUND - CEIL + 22, 8, PRIM, inside);
  K.line(CX0, GROUND, CX1, GROUND, CTX, inside);
  K.line(CX0 + 60, GROUND + 10, CX1 - 60, GROUND + 10, CTX, inside);
  for (var lp = 0; lp < 4; lp++) { var lx = CX0 + 180 + lp * 280; K.line(lx, CEIL, lx, CEIL + 26, CTX, inside); K.path('M' + (lx - 22) + ' ' + (CEIL + 44) + 'q22 -24 44 0z', CTX, inside); }
  /* the lift the guest comes out of */
  K.rect(CX0 + 30, 500, 110, 220, 4, CTX, inside); K.line(CX0 + 85, 500, CX0 + 85, 720, CTX, inside); K.circle(CX0 + 160, 610, 6, CTX, inside);
  /* three room doors, each with a number plate; the middle one is the guest's room */
  var roomDoor, roomLight, RD = 2040;
  for (var rd = 0; rd < 3; rd++) {
    var dx = 1780 + rd * 260;
    K.rect(dx - 6, 494, 102, 226, 4, rd === 1 ? PRIM : CTX, inside);
    K.rect(dx + 26, 462, 38, 20, 4, rd === 1 ? PRIM : CTX, inside);
    var leafRoom = K.mk('rect', { x: f1(dx), y: '500', width: '90', height: '220', rx: '3', fill: '#fff' }, rd === 1 ? PRIM : CTX, inside);
    K.circle(dx + 74, 612, 4, CTX, inside);
    if (rd === 1) { roomDoor = leafRoom; roomLight = device(dx + 110, 594, inside); }
  }
  /* a painting and a plant, so the corridor reads as a hotel */
  K.rect(CX0 + 950, 450, 120, 80, 4, CTX, inside); K.path('M' + (CX0 + 960) + ' 520l34 -36l26 22l20 -16l30 30', CTX, inside);
  K.path('M' + (CX0 + 990) + ' 720l-8 -44h56l-8 44z', CTX, inside); K.path('M' + (CX0 + 1010) + ' 676c-20 -30 -18 -60 0 -84c18 24 20 54 0 84', CTX, inside);

  /* ================================================================ the guest, with a suitcase */
  var guest = K.group(world);
  var legA = K.path('', PRIM, guest), legB = K.path('', PRIM, guest);
  K.line(0, GROUND - 76, 0, GROUND - 134, PRIM, guest);
  K.circle(0, GROUND - 154, 17, PRIM, guest);
  var armBack = K.line(0, GROUND - 126, -22, GROUND - 92, PRIM, guest);
  K.line(-22, GROUND - 92, -46, GROUND - 66, CTX, guest);
  K.rect(-74, GROUND - 66, 42, 56, 7, PRIM, guest);
  K.circle(-64, GROUND - 5, 5, CTX, guest); K.circle(-42, GROUND - 5, 5, CTX, guest);
  var armFront = K.path('', PRIM, guest);
  var phone = K.rect(24, GROUND - 150, 16, 26, 4, PRIM, guest);
  /* the phone's signal to a device */
  var signal = K.mk('path', { d: '', 'stroke-dasharray': '9 11' }, CTX, world);

  /* Where the guest is and whether they walk. Between walks the guest waits
     at the start of the next one (unseen while going up to the room floor). */
  var WALKS = [[0.5, 4.0, 200, 470], [5.0, 8.4, 470, 1120], [8.9, 9.7, 1120, 1205], [11.2, 13.4, 1660, RD - 30], [14.3, 15.0, RD - 30, RD + 50]];
  function where(t) {
    for (var i = 0; i < WALKS.length; i++) {
      var w = WALKS[i];
      if (t < w[0]) return { x: w[2], moving: false };
      if (t <= w[1]) return { x: w[2] + (w[3] - w[2]) * seg(t, w[0], w[1]), moving: true };
    }
    return { x: WALKS[WALKS.length - 1][3], moving: false };
  }
  function signalTo(fromX, x, y, u) {
    var fromY = GROUND - 128;
    sa(signal, 'd', 'M' + f1(fromX) + ' ' + f1(fromY) + 'Q' + f1((fromX + x) / 2) + ' ' + f1(Math.min(fromY, y) - 60) + ' ' + f1(x) + ' ' + f1(y));
    sa(signal, 'opacity', f2(u));
  }
  function swingDoor(e, hinge, u) { sa(e, 'transform', 'translate(' + hinge + ' 0) scale(' + f2(1 - 0.78 * u) + ' 1) translate(-' + hinge + ' 0)'); }

  function renderWorld(t) {
    var g = where(t);
    var swing = g.moving ? Math.sin(g.x / 34) * 0.42 : 0, L = 76, hip = GROUND - 76;
    sa(legA, 'd', 'M0 ' + hip + 'L' + f1(Math.sin(swing) * L) + ' ' + f1(hip + Math.cos(swing) * L));
    sa(legB, 'd', 'M0 ' + hip + 'L' + f1(-Math.sin(swing) * L) + ' ' + f1(hip + Math.cos(swing) * L));
    sa(armBack, 'x2', f1(-22 + swing * 6));
    /* the front hand raises the phone at the gate, the hotel door and the room door */
    var raise = Math.max(seg(t, 3.6, 4.0) - seg(t, 5.0, 5.3), seg(t, 8.0, 8.3) - seg(t, 8.9, 9.1), seg(t, 13.2, 13.5) - seg(t, 14.3, 14.5));
    var hx = 14 + 18 * raise, hy = GROUND - 88 - 36 * raise;
    sa(armFront, 'd', 'M0 ' + (GROUND - 126) + 'L' + f1(hx) + ' ' + f1(hy));
    sa(phone, 'opacity', f2(raise));
    sa(phone, 'transform', 'translate(' + f1(hx - 24) + ' ' + f1(hy - (GROUND - 124)) + ')');
    sa(guest, 'transform', 'translate(' + f1(g.x) + ' 0)');
    var seen = t < 10.8 ? 1 - seg(t, 9.3, 9.7) : t < 14.6 ? seg(t, 10.8, 11.2) : 1 - seg(t, 14.6, 15.0);
    sa(guest, 'opacity', f2(seen));
    /* the signal reaches the gate, the hotel door, then the room door */
    var s1 = seg(t, 3.9, 4.2) * (1 - seg(t, 4.8, 5.1)), s2 = seg(t, 8.2, 8.4) * (1 - seg(t, 8.8, 9.0)), s3 = seg(t, 13.4, 13.6) * (1 - seg(t, 14.0, 14.2));
    if (s1 > 0) signalTo(g.x + 32, 531, 596, s1);
    else if (s2 > 0) signalTo(g.x + 32, 1275, 636, s2);
    else if (s3 > 0) signalTo(g.x + 32, RD + 119, 604, s3);
    else sa(signal, 'opacity', '0');
    sa(gateLight, 'fill-opacity', K.r3(seg(t, 4.1, 4.3) * (1 - seg(t, 9.4, 10.2))));
    sa(doorLight, 'fill-opacity', K.r3(seg(t, 8.3, 8.5) * (1 - seg(t, 9.8, 10.4))));
    sa(roomLight, 'fill-opacity', K.r3(seg(t, 13.5, 13.7) * (1 - seg(t, 15.1, 15.7))));
    /* the gate slides; the hotel door and the room door swing open and close */
    sa(leaf, 'transform', 'translate(' + f1(ease(seg(t, 4.4, 5.2)) * (1 - ease(seg(t, 9.4, 10.2))) * 190) + ' 0)');
    swingDoor(door, 1164, ease(seg(t, 8.4, 8.9)) * (1 - ease(seg(t, 9.8, 10.4))));
    swingDoor(roomDoor, RD, ease(seg(t, 13.7, 14.2)) * (1 - ease(seg(t, 15.1, 15.7))));
    /* the view follows the guest inside: the street fades out, the corridor in */
    sa(world, 'transform', 'translate(' + f1(-PAN * ease(seg(t, 9.8, 11.0))) + ' 0)');
    sa(outside, 'opacity', f2(1 - seg(t, 9.9, 10.8)));
    sa(inside, 'opacity', f2(seg(t, 10.0, 10.9)));
  }

  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    /* after check-out the picture fades and returns to its resting state */
    if (t < RESET[1]) { renderWorld(t); sa(world, 'opacity', f2(1 - seg(t, RESET[0], RESET[1]))); }
    else { renderWorld(0); sa(world, 'opacity', f2(seg(t, RESET[1], RESET[2]))); }
    /* the stay runs to check-out, where the access ends */
    var back = 1 - seg(t, RESET[0], RESET[2]);
    var run = ease(seg(t, 0.5, 16.4)) * back;
    var mx = T0 + (T1 - 18 - T0) * run;
    sa(marker, 'cx', f1(mx)); sa(progress, 'x2', f1(mx));
    var closed = eOut(seg(t, 16.4, 16.9)) * back;
    sa(lockTop, 'transform', 'translate(0 ' + f1(8 * closed - 8) + ')');
    sa(lockBody, 'stroke-width', f2(1.5 + 1.5 * closed)); sa(lockBody, 'stroke-opacity', f2(0.4 + 0.6 * closed));
    sa(lockTop, 'stroke-width', f2(1.5 + 1.5 * closed)); sa(lockTop, 'stroke-opacity', f2(0.4 + 0.6 * closed));
    sa(marker, 'opacity', f2(1 - closed));
  }
  return { render: render, duration: DUR, still: STILL_T };
}
