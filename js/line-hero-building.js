// WIFIGATE Manager, Auto Open spotlight: a resident walks along the pavement
// to an apartment building, hands full. The phone stays in the pocket; as the
// resident comes near the entrance the WIFIGATE device by the door recognises
// them, the lobby's glass doors slide open by themselves, the resident walks
// in without breaking step and the doors close behind. A small Manager card
// shows which residents have Auto Open on; the resident's row lights up as
// the entrance opens. Same line language as the other line heroes.
// Builds the scene inside an empty <svg> and returns its deterministic render(t).
export function createBuildingEntryScene(svg) {
  var NS = 'http://www.w3.org/2000/svg';
  var BLUE = '#146BFF';
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
  function lerp(a, b, u) { return a + (b - a) * u; }
  function seg(t, a) { return clamp((t - a[0]) / (a[1] - a[0]), 0, 1); }
  function ease(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function sm(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function eOut(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  function pingK(t, t0, d) { var k = (t - t0) / (d || 0.8); return (k >= 0 && k < 1) ? k : -1; }

  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  el('rect', { width: '1600', height: '900', fill: '#fff' });

  /* ================================================================ projection (isometric, +y toward the street) */
  var S = 3.4, C = Math.sqrt(3) / 2, CX = 900, CY = 600;
  function P(x, y, z) { return [CX + (x - y) * C * S, CY + (x + y) * 0.5 * S - (z || 0) * S]; }
  function dPath(points, closed) {
    var s = '';
    for (var i = 0; i < points.length; i++) { var p = P(points[i][0], points[i][1], points[i][2]); s += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }
    return s + (closed ? 'Z' : '');
  }
  var CTX = { 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, PRIM = { 'stroke-width': 3 };
  function shape(points, style, fill, closed, parent) {
    var a = { d: dPath(points, closed), stroke: BLUE, fill: fill || 'none' };
    for (var k in style) a[k] = style[k];
    return el('path', a, parent);
  }
  function face(points, style, parent) { return shape(points, style, '#fff', true, parent); }
  function line(points, style, parent) { return shape(points, style || CTX, 'none', false, parent); }
  function tintFace(points, parent, k) { return el('path', { d: dPath(points, true), fill: BLUE, 'fill-opacity': r3(0.06 * TINT * (k || 1)), stroke: 'none' }, parent); }
  function box(x, y, z, dx, dy, dz, style, parent) {
    var x1 = x + dx, y1 = y + dy, z1 = z + dz;
    face([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], style, parent);
    face([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], style, parent);
    face([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], style, parent);
  }
  /* a window on the street face (y = const) or the side face (x = const) */
  function winY(x, y, z, w, h, parent) { shape([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]], CTX, 'none', true, parent); line([[x + w / 2, y, z], [x + w / 2, y, z + h]], CTX, parent); }
  function winX(x, y, z, w, h, parent) { shape([[x, y, z], [x, y + w, z], [x, y + w, z + h], [x, y, z + h]], CTX, 'none', true, parent); }

  /* ================================================================ the street and the building */
  var BX0 = -92, BX1 = 92, BY0 = -70, GF = 56, FL = 38, NF = 2, BH = GF + NF * FL;
  var DOOR = 16, DOOR_H = 46, POCKET = 2.5;
  var PX0 = -136, PX1 = 136, PY0 = -90, PY1 = 98, KERB = 40;

  var gBack = el('g', {});
  face([[PX0, PY0, 0], [PX1, PY0, 0], [PX1, PY1, 0], [PX0, PY1, 0]], CTX, gBack);
  line([[PX0, PY1, 0], [PX0, PY1, -8], [PX1, PY1, -8], [PX1, PY0, -8], [PX1, PY0, 0]], CTX, gBack);
  line([[PX1, PY1, 0], [PX1, PY1, -8]], CTX, gBack);
  line([[PX0, KERB, 0], [PX1, KERB, 0]], CTX, gBack);                                  /* the kerb */
  for (var lx = PX0 + 14; lx < PX1 - 20; lx += 46) line([[lx, 70, 0], [lx + 24, 70, 0]], CTX, gBack);   /* the road's centre line */
  line([[-26, 0, 0], [-26, KERB, 0]], CTX, gBack); line([[26, 0, 0], [26, KERB, 0]], CTX, gBack); /* the entrance path */

  /* the building: roof and side face, then the lobby seen through the door, then the street face */
  var gBuild = el('g', {}, gBack);
  face([[BX0, BY0, BH], [BX1, BY0, BH], [BX1, 0, BH], [BX0, 0, BH]], CTX, gBuild);
  shape([[BX0 + 8, BY0 + 8, BH], [BX1 - 8, BY0 + 8, BH], [BX1 - 8, -8, BH], [BX0 + 8, -8, BH]], CTX, 'none', true, gBuild);
  box(24, -50, BH, 26, 22, 12, CTX, gBuild);                                           /* the roof's stair hut */
  face([[BX1, BY0, 0], [BX1, 0, 0], [BX1, 0, BH], [BX1, BY0, BH]], CTX, gBuild);
  for (var f = 0; f < NF; f++) { var zf = GF + f * FL; line([[BX1, BY0, zf], [BX1, 0, zf]], CTX, gBuild); [-58, -30].forEach(function (y) { winX(BX1, y, zf + 9, 18, 20, gBuild); }); }
  winX(BX1, -52, 14, 34, 22, gBuild);

  /* the lobby behind the door: floor, back wall, lift doors and a light */
  var gLobby = el('g', {}, gBack);
  face([[-40, -42, 0], [40, -42, 0], [40, 0, 0], [-40, 0, 0]], CTX, gLobby);
  face([[-40, -42, 0], [40, -42, 0], [40, -42, 50], [-40, -42, 50]], CTX, gLobby);
  tintFace([[-40, -42, 0], [40, -42, 0], [40, -42, 50], [-40, -42, 50]], gLobby);
  shape([[-12, -42, 0], [12, -42, 0], [12, -42, 34], [-12, -42, 34]], CTX, 'none', true, gLobby);
  line([[0, -42, 0], [0, -42, 34]], CTX, gLobby);
  line([[-40, -42, 0], [-40, 0, 0]], CTX, gLobby);

  /* the resident, once inside the lobby: behind the street face and the glass */
  var gPersonBack = el('g', { display: 'none' }, gBack);

  /* the two glass leaves; they slide apart into pockets in the wall */
  function mkLeaf(x0) {
    var g = el('g', {}, gBack), pts = [[x0, -POCKET, 1], [x0 + DOOR, -POCKET, 1], [x0 + DOOR, -POCKET, DOOR_H - 1], [x0, -POCKET, DOOR_H - 1]];
    tintFace(pts, g, 1.4);
    shape(pts, PRIM, 'none', true, g);
    line([[x0 + DOOR * 0.25, -POCKET, 8], [x0 + DOOR * 0.25, -POCKET, 30]], CTX, g);
    return g;
  }
  var leafL = mkLeaf(-DOOR), leafR = mkLeaf(0);

  /* the street face, with the door cut out of it */
  (function () {
    var outer = dPath([[BX0, 0, 0], [BX1, 0, 0], [BX1, 0, BH], [BX0, 0, BH]], true);
    var hole = dPath([[-DOOR, 0, 0], [-DOOR, 0, DOOR_H], [DOOR, 0, DOOR_H], [DOOR, 0, 0]], true);
    el('path', { d: outer + hole, 'fill-rule': 'evenodd', fill: '#fff', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, gBack);
  })();
  for (var f2_ = 0; f2_ < NF; f2_++) {
    var zz = GF + f2_ * FL;
    line([[BX0, 0, zz], [BX1, 0, zz]], CTX, gBack);
    [-80, -50, -20, 10, 40, 66].forEach(function (x) { winY(x, 0, zz + 9, 16, 20, gBack); });
  }
  winY(-80, 0, 12, 40, 24, gBack); winY(46, 0, 12, 36, 24, gBack);
  shape([[-DOOR - 3, 0, 0], [-DOOR - 3, 0, DOOR_H + 3], [DOOR + 3, 0, DOOR_H + 3], [DOOR + 3, 0, 0]], CTX, 'none', false, gBack);   /* the door frame */
  box(-DOOR - 8, 0, DOOR_H + 4, 2 * DOOR + 16, 9, 3, CTX, gBack);                            /* the canopy */

  /* the WIFIGATE device on the wall beside the door */
  box(DOOR + 6, 0, 17, 7, 2.5, 14, PRIM, gBack);
  var LIGHT = P(DOOR + 9.5, 2.5, 37);

  /* the Auto Open zone on the pavement in front of the door */
  var ZC = [0, 22], ZR = 30;
  var zone = (function () {
    var ring = [];
    for (var k = 0; k <= 48; k++) { var a = Math.PI * 2 * k / 48, p = P(ZC[0] + ZR * Math.cos(a), ZC[1] + ZR * Math.sin(a) * 0.62, 0); ring.push((k ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])); }
    return el('path', { d: ring.join('') + 'Z', fill: BLUE, 'fill-opacity': r3(0.06 * TINT), stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'stroke-dasharray': '9 11' }, gBack);
  })();

  /* a parked car, for scale */
  box(-104, 50, 0, 58, 24, 11, CTX, gBack); box(-90, 52, 11, 32, 20, 9, CTX, gBack);

  /* the resident on the pavement, in front of the building */
  var gPersonFront = el('g', {});

  /* ================================================================ the resident */
  var K = 0.56, PW_ = 18 * S * K, PH_ = 40 * S * K, PR_ = 8.5 * S * K;
  function mkPerson(parent) {
    var r = PW_ / 2, d = 'M' + f1(-r) + ' ' + f1(-PH_ + r) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(r) + ' ' + f1(-PH_ + r) + 'V' + f1(-r) +
      'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(-r) + ' ' + f1(-r) + 'Z';
    var g = el('g', {}, parent);
    el('path', { d: d, fill: '#fff', stroke: BLUE, 'stroke-width': 2.6 }, g);
    el('circle', { cx: 0, cy: f1(-PH_ - PR_ - 5 * S * K), r: f1(PR_), fill: '#fff', stroke: BLUE, 'stroke-width': 2.6 }, g);
    /* a shopping bag in each hand: the hands are full */
    [-1, 1].forEach(function (side) {
      var x = side * (PW_ / 2 + 6), y = -PH_ * 0.42;
      el('path', { d: 'M' + f1(x - 5.5) + ' ' + f1(y) + 'h11v17h-11Z', fill: '#fff', stroke: BLUE, 'stroke-width': 2.6 }, g);
      el('path', { d: 'M' + f1(x - 3) + ' ' + f1(y) + 'v-4a3 3 0 0 1 6 0v4', fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, g);
    });
    return g;
  }
  var personFront = mkPerson(gPersonFront), personBack = mkPerson(gPersonBack);
  function qpt(a, c, b, t) { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]; }
  /* along the pavement, round onto the entrance path, through the door and on toward the lift */
  var INSIDE = 30;
  var WALK = (function () {
    var o = [[138, 26], [24, 26]];
    for (var k = 1; k <= 14; k++) o.push(qpt([24, 26], [1, 26], [0, 6], k / 14));
    o.push([0, 0]); o.push([0, -INSIDE]);
    return o;
  })();
  var WALK_CUM = (function () { var c = [0]; for (var i = 1; i < WALK.length; i++) c.push(c[i - 1] + Math.hypot(WALK[i][0] - WALK[i - 1][0], WALK[i][1] - WALK[i - 1][1])); return c; })();
  var WALK_LEN = WALK_CUM[WALK_CUM.length - 1], WALK_DOOR = WALK_LEN - INSIDE;
  function walkAt(d) {
    d = clamp(d, 0, WALK_LEN);
    var i = 1; while (i < WALK_CUM.length - 1 && WALK_CUM[i] < d) i++;
    var l = WALK_CUM[i] - WALK_CUM[i - 1], u = l > 0 ? (d - WALK_CUM[i - 1]) / l : 0;
    return [lerp(WALK[i - 1][0], WALK[i][0], u), lerp(WALK[i - 1][1], WALK[i][1], u)];
  }
  function walkDist(u) { var a = 0.1; return (u < a ? u * u / (2 * a) : u - a / 2) / (1 - a / 2) * WALK_LEN; }

  /* ================================================================ timeline
     WK the walk; the resident steps into the zone at about 5.6 s and reaches the door at about 7.4 s.
     WF the phone's signal, GT the light, DO and DC the doors opening and closing, LO the light going out,
     RS the reset. The still frame: the doors open, the resident a step from the threshold. */
  var TL = { WK: [1.0, 8.6], WF: [5.5, 6.9], GT: [6.0, 6.4], DO: [6.3, 7.1], DC: [9.0, 9.8], LO: [9.8, 10.2], RS: [10.5, 11.5] };
  var DUR = 11.9, STILL_T = 7.3;

  /* ================================================================ the phone's signal and the device's light */
  var gSignal = el('g', {});
  var gWifi = el('g', { display: 'none' }, gSignal);
  var wifiPhone = el('rect', { fill: BLUE, stroke: 'none' }, gWifi);
  var wifiArcs = [0, 1, 2].map(function () { return el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: '' }, gWifi); });
  var WIFI_HALF = 32 * Math.PI / 180;

  var gLight = el('g', {});
  var lightPing = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 10, fill: 'none', stroke: BLUE, 'stroke-width': 1.5, opacity: 0 }, gLight);
  el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 15, fill: '#fff', stroke: 'none' }, gLight);
  var lightRing = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 6, fill: 'none', stroke: BLUE, 'stroke-width': 1.5 }, gLight);
  var lightDot = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 0, fill: BLUE }, gLight);

  /* ================================================================ the Manager card: who has Auto Open */
  var gCard = el('g', {});
  function prim(tag, attrs, parent) { attrs.stroke = BLUE; attrs['stroke-width'] = 3; if (attrs.fill === undefined) attrs.fill = 'none'; return el(tag, attrs, parent || gCard); }
  function pale(tag, attrs, parent) { attrs.stroke = BLUE; attrs['stroke-opacity'] = 0.4; attrs['stroke-width'] = 1.5; if (attrs.fill === undefined) attrs.fill = 'none'; return el(tag, attrs, parent || gCard); }
  function tintOf(tag, attrs, parent) { attrs.fill = BLUE; attrs['fill-opacity'] = r3(0.06 * TINT); attrs.stroke = 'none'; return el(tag, attrs, parent || gCard); }
  var CX0 = 70, CY0 = 70, CW = 330, CH = 252;
  prim('rect', { x: CX0, y: CY0, width: CW, height: CH, rx: 20, fill: '#fff' });
  prim('path', { d: 'M' + CX0 + ' ' + (CY0 + 44) + 'h' + CW });
  /* the card's title: the Auto Open mark (a pocketed phone with its signal) and a line */
  prim('rect', { x: CX0 + 22, y: CY0 + 12, width: 12, height: 20, rx: 3 });
  pale('path', { d: 'M' + (CX0 + 42) + ' ' + (CY0 + 16) + 'a10 10 0 0 1 0 12M' + (CX0 + 48) + ' ' + (CY0 + 11) + 'a17 17 0 0 1 0 22' });
  pale('path', { d: 'M' + (CX0 + 72) + ' ' + (CY0 + 22) + 'h120' });
  var ROWS = [CY0 + 86, CY0 + 150, CY0 + 214], ON = [true, true, false];
  var rowGlow = tintOf('rect', { x: CX0 + 12, y: ROWS[0] - 28, width: CW - 24, height: 56, rx: 12, 'fill-opacity': 0 });
  ROWS.forEach(function (y, i) {
    (i === 0 ? prim : pale)('circle', { cx: CX0 + 44, cy: y, r: 15, fill: '#fff' });
    pale('path', { d: 'M' + (CX0 + 74) + ' ' + (y - 7) + 'h' + (i === 0 ? 120 : 96 - i * 12) + 'M' + (CX0 + 74) + ' ' + (y + 9) + 'h' + (70 - i * 8) });
    var tx = CX0 + CW - 84;
    if (ON[i]) { tintOf('rect', { x: tx, y: y - 15, width: 54, height: 30, rx: 15 }); prim('rect', { x: tx, y: y - 15, width: 54, height: 30, rx: 15 }); el('circle', { cx: tx + 39, cy: y, r: 9, fill: BLUE, stroke: 'none' }, gCard); }
    else { pale('rect', { x: tx, y: y - 15, width: 54, height: 30, rx: 15 }); pale('circle', { cx: tx + 15, cy: y, r: 9, fill: '#fff' }); }
  });
  /* the check that lands on the resident's row as the entrance opens */
  var check = el('g', { opacity: 0 }, gCard);
  el('circle', { cx: CX0 + 44, cy: ROWS[0], r: 15, fill: BLUE, stroke: 'none' }, check);
  el('path', { d: 'M' + (CX0 + 37) + ' ' + ROWS[0] + 'l5 5l9 -10', fill: 'none', stroke: '#fff', 'stroke-width': 3 }, check);
  var flyDot = el('circle', { r: 6, fill: BLUE, opacity: 0 }, gCard);
  function qcurve(a, c, b, u) { return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]; }

  /* ================================================================ render */
  function place(g, p) { sa(g, 'transform', 'translate(' + f1(p[0]) + ' ' + f1(p[1]) + ')'); }
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var back = sm(seg(t, TL.RS));

    /* the doors and the light */
    var open = ease(seg(t, TL.DO)) * (1 - ease(seg(t, TL.DC)));
    var dx = DOOR * open * C * S, dy = DOOR * open * 0.5 * S;
    sa(leafL, 'transform', 'translate(' + f1(-dx) + ' ' + f1(-dy) + ')');
    sa(leafR, 'transform', 'translate(' + f1(dx) + ' ' + f1(dy) + ')');
    var lit = ease(seg(t, TL.GT)) * (1 - ease(seg(t, TL.LO)));
    sa(lightRing, 'r', f2(6 + 4 * lit)); sa(lightDot, 'r', f2(5.5 * lit));
    sa(zone, 'fill-opacity', r3(0.06 * TINT * (1 + 0.8 * lit)));

    /* the resident: waiting on the pavement, walking in, gone toward the lift, back for the next loop */
    var d = t < TL.RS[0] ? walkDist(seg(t, TL.WK)) : 0, w = walkAt(d), p = P(w[0], w[1], 0);
    var inside = w[1] < -0.5, op = t < TL.RS[0] ? 1 - sm((d - WALK_DOOR - 8) / (INSIDE - 8)) : back;
    sa(gPersonFront, 'display', inside ? 'none' : 'inline'); sa(gPersonBack, 'display', inside ? 'inline' : 'none');
    place(inside ? personBack : personFront, p);
    sa(inside ? gPersonBack : gPersonFront, 'opacity', f2(op));

    /* the phone in the pocket signals toward the device */
    var u = seg(t, TL.WF), sig = (u > 0 && u < 1 && !inside) ? Math.min(1, u / 0.07, (1 - u) / 0.1) : 0;
    if (sig <= 0.003) sa(gWifi, 'display', 'none');
    else {
      sa(gWifi, 'display', 'inline'); sa(gWifi, 'opacity', f2(sig));
      var cx = p[0] + 4.5 * S * K, cy = p[1] - 17 * S * K;
      sa(wifiPhone, 'x', f1(cx - 2.6 * S * K)); sa(wifiPhone, 'y', f1(cy - 4.6 * S * K));
      sa(wifiPhone, 'width', f1(5.2 * S * K)); sa(wifiPhone, 'height', f1(9.2 * S * K)); sa(wifiPhone, 'rx', f1(1.3 * S * K));
      var aim = clamp(Math.atan2(LIGHT[1] - cy, LIGHT[0] - cx), -1.6, 0.2), ph = (u * 2) % 1;
      for (var a = 0; a < 3; a++) {
        var k = sm((ph - 0.14 * a) / 0.14) * (1 - sm((ph - 0.7) / 0.26)), r = (13 + 8.5 * a) * S * K;
        sa(wifiArcs[a], 'opacity', f2(k));
        sa(wifiArcs[a], 'd', 'M' + f1(cx + r * Math.cos(aim - WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim - WIFI_HALF)) +
          'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r * Math.cos(aim + WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim + WIFI_HALF)));
      }
    }

    /* the Manager card: a dot carries the entry from the device to the resident's row */
    var fu = seg(t, [TL.GT[1], TL.GT[1] + 1.0]);
    if (fu > 0 && fu < 1 && back === 0) {
      var q = qcurve(LIGHT, [560, 120], [CX0 + 44, ROWS[0]], ease(fu));
      sa(flyDot, 'cx', f1(q[0])); sa(flyDot, 'cy', f1(q[1])); sa(flyDot, 'opacity', f2(Math.min(1, fu / 0.12, (1 - fu) / 0.12)));
    } else sa(flyDot, 'opacity', '0');
    var mark = sm(seg(t, [TL.GT[1] + 0.9, TL.GT[1] + 1.2])) * (1 - back);
    sa(check, 'opacity', f2(mark));
    sa(rowGlow, 'fill-opacity', r3(0.06 * TINT * 1.4 * mark));

    var pk = pingK(t, TL.GT[1]);
    if (pk >= 0) { sa(lightPing, 'r', f2(10 + 20 * eOut(pk))); sa(lightPing, 'opacity', f2(0.6 * (1 - pk) * (1 - pk))); }
    else sa(lightPing, 'opacity', '0');
  }

  return { render: render, duration: DUR, still: STILL_T };
}
