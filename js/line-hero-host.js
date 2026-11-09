// WIFIGATE Host hero: the owner-approved line animation (42 s loop).
// Ported mechanically from the approved standalone page: the drawing,
// choreography and timing are unchanged. The page driver, error title hook,
// URL debug hooks (fixed time, speed, geometry and frame self-tests) with
// their data-* outputs, and the window globals were removed; js/line-hero.js
// drives render(t). The only id
// (the door jamb clip) is scoped as wgh-door-clip.
export const HOST_DURATION = 42;
export const HOST_STILL = 27.0;

// Builds the scene inside an empty <svg> and returns its deterministic render(t).
export function createHostScene(svg) {

  /* ------------------------------------------------------------------ basics */
  var DUR = 42;
  var NS = 'http://www.w3.org/2000/svg', B = '#146BFF', INK = '#151719';
  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(x) { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eo(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function es(x) { x = clamp(x); return (1 - Math.cos(Math.PI * x)) / 2; }
  function E(t, a, b) { return eio(seg(t, a, b)); }
  function sm(a, b, x) { var u = seg(x, a, b); return u * u * (3 - 2 * u); }
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function f3(v) { return (Math.round(v * 1000) / 1000).toString(); }
  function el(tag, at, par) { var e = svg.ownerDocument.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (par || svg).appendChild(e); return e; }
  function set(e, k, v) { var c = e.__c || (e.__c = {}); if (c[k] !== v) { c[k] = v; e.setAttribute(k, v); } }
  function op(e, v) { set(e, 'opacity', f3(clamp(v))); }
  function sty(e, on, offW, offO, onW, onO) { /* secondary <-> primary stroke */
    set(e, 'stroke-width', f3(lerp(offW || 1.5, onW || 3, on)));
    set(e, 'stroke-opacity', f3(lerp(offO || 0.4, onO || 1, on)));
  }
  function light(e, on, baseOp) { /* shared status light: 12px hollow ring -> solid dot */
    set(e, 'r', f3(lerp(6, 5.25, on)));
    set(e, 'fill-opacity', f3(on));
    set(e, 'stroke-opacity', f3(lerp(baseOp === undefined ? 1 : baseOp, 1, on)));
  }
  function polyD(pl, close) { var s = ''; for (var i = 0; i < pl.length; i++) s += (i ? 'L' : 'M') + f1(pl[i][0]) + ' ' + f1(pl[i][1]); return close ? s + 'Z' : s; }
  function arcP(cx, cy, r, a0, a1, n) { var o = []; for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
  function rr(x, y, w, h, r, n) { /* rounded rect outline, closed by repeating the first point */
    n = n || 3; var o = [], c = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
    for (var j = 0; j < 4; j++) for (var i = 0; i <= n; i++) { var a = (c[j][2] + 90 * i / n) * Math.PI / 180; o.push([c[j][0] + r * Math.cos(a), c[j][1] + r * Math.sin(a)]); }
    o.push(o[0]); return o;
  }

  /* ------------------------------------------------------------------ camera
     One rigid world: plan coordinates (u,v) of the compound + height h, no yaw.
     The side view is an elevation looking north (screen x = u), the plan is the same
     world seen from straight above.  The H1 sketch is that elevation at scale KS:
     the building facade stands on the building's south front (v=530); its door is the
     west entrance (605,530) that guest 1 walks through, the barrier is the compound
     gate (v=640).  In the plan the guest continues from that door to his unit (T1).
     Camera = zoom + tilt about the compound centre (800,450), whose screen height cy
     rises from the H1 ground line to the frame centre while the camera pulls back, so
     the plane opens symmetrically inside the forming ring. */
  var KS = 2.75, U0 = 605, X0 = 362, GX0 = X0 + KS * (800 - U0);
  var DY = 30;                          /* H1 composition offset (vertical centring) */
  var FV = 530;                         /* facade plane: building south front */
  var cam = { k: KS, sx: GX0, cy: 594 + DY, s: 0, c: 1, tau: 0, z: 0, key: '' };
  function tauOf(m) { return eio(clamp((m - 0.04) / 0.72)); }
  function setCam(m) {
    var z = eio(clamp((m - 0.04) / 0.62)), ta = tauOf(m);
    cam.z = z; cam.tau = ta; cam.k = Math.pow(KS, 1 - z);
    cam.sx = lerp(GX0, 800, z); cam.cy = 594 + DY;   /* final cy is set by frameCy() */
    var ph = Math.PI / 2 * ta; cam.s = Math.sin(ph); cam.c = Math.cos(ph);
    cam.key = m.toFixed(5);
  }
  function P(u, v, h) { return [cam.sx + cam.k * (u - 800), cam.cy + cam.k * ((v - 450) * cam.s - h * cam.c)]; }
  /* side-sketch coordinates (ground y=600) on a vertical plane v -> world */
  function sw(x, y, v) { return [U0 + (x - X0) / KS, v, (600 - y) / KS]; }
  function projD(polys, close) { var s = ''; for (var j = 0; j < polys.length; j++) { var pl = polys[j]; for (var i = 0; i < pl.length; i++) { var p = P(pl[i][0], pl[i][1], pl[i][2]); s += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); } if (close) s += 'Z'; } return s; }
  function sideW(pl, v) { return pl.map(function (p) { return sw(p[0], p[1], v); }); }
  function planW(pl) { return pl.map(function (p) { return [p[0], p[1], 0]; }); }

  var WS = []; /* static world paths: re-projected only when the camera moves */
  function wpath(par, at, polys, close, grp) { var e = el('path', at, par); WS.push({ e: e, polys: polys, close: !!close, grp: grp, key: '' }); return e; }

  /* ------------------------------------------------------------------ bar <-> ring bend
     Bar space: x along the time bar (sketch px), d = offset above the ruler baseline.
     The bar is a world object: one circular arc lying in a plane just under the ground
     (depth hb), bottom point (uA,vB), curvature kap, sw world units per bar px.  It is
     projected by the same camera as the compound, so while the plane is still edge-on
     the arc is a flat, foreshortened curve right under the ground line, and it opens
     into a ring around the compound together with the plan.  Offsets d are screen px
     along the projected normal (ticks, lanes and capsule keep their pixel sizes).
     m=0 : straight bar, baseline y=690+DY.   m=1 : calendar ring r=404 around (800,450). */
  var SIG1 = Math.PI * 404 / 700, XTH = 700 / 180;
  var BQ = { q: 0, sig: 1, kap: 0, sw: 1 / KS, uA: 800, vB: 854, hb: 0 };
  function setBend(m) {
    BQ.q = es((m - 0.18) / 0.78);                       /* styling progress (ticks, capsule, playhead) */
    /* world half-width: the bar's own width under the sketch -> the ring, 144 outside the compound */
    var Wh = lerp(700 / KS, 404, es(seg(m, 0.0, 0.55))), phi = Math.PI * es(seg(m, 0.08, 0.92));
    var kp = phi < Math.PI / 2 ? Math.sin(phi) / Wh : 1 / Wh;
    BQ.kap = kp;
    BQ.sw = kp > 1e-9 ? phi / (700 * kp) : Wh / 700;
    BQ.sig = cam.k * BQ.sw;                             /* screen px per bar px at the bottom */
    var w = es(seg(m, 0.06, 0.62));
    BQ.uA = lerp(800 + (800 - GX0) / KS, 800, w);
    /* front: just ahead of the gate -> ring bottom, and never cutting the compound's front corners */
    var R = kp > 1e-9 ? 1 / kp : 1e9, cc = R > 300 ? R - Math.sqrt(R * R - 90000) : R;
    var vA = lerp(676, 854, es(seg(cam.tau, 0.25, 0.95))), vC = 680 + cc;
    BQ.vB = (vA + vC + Math.sqrt((vA - vC) * (vA - vC) + 400 * (1 - es(seg(m, 0.8, 1))))) / 2;
    BQ.hb = -(96 / KS) * (1 - es(seg(m, 0.08, 0.6)));    /* the side-view bar sits 96 px under the ground */
  }
  function bend(x, d) {
    var s = (800 - x) * BQ.sw, kp = BQ.kap, u, v, du, dv;
    if (kp < 1e-9) { u = BQ.uA - s; v = BQ.vB; du = -1; dv = 0; }
    else { var a = s * kp, sa = Math.sin(a), ca = Math.cos(a); u = BQ.uA - sa / kp; v = BQ.vB - (1 - ca) / kp; du = -ca; dv = -sa; }
    var p = P(u, v, BQ.hb), tx = cam.k * du, ty = cam.k * cam.s * dv, n = Math.hypot(tx, ty);
    if (!d) return p;
    if (n < 1e-9) return [p[0], p[1] - d];
    return [p[0] - d * ty / n, p[1] + d * tx / n];
  }
  /* camera height: rises from the H1 ground line and keeps the whole scene (sketch or
     compound plus the bar/ring) centred in the frame while the side overlays fade.
     The centring target is tabulated once over m (monotone, lightly smoothed) so the
     camera never bobs, then handed over to the ring's own centre as the ring closes. */
  function cyRaw() {
    var keep = cam.cy; cam.cy = 0;
    var top = 1e9, bot = -1e9;
    function acc(p) { if (p[1] < top) top = p[1]; if (p[1] > bot) bot = p[1]; }
    /* top of what is drawn: the facade's roof, handing over to the compound's back edge
       as the plan forms; bottom: the bar/ring */
    var bt = sw(280, 340, FV), pb = P(bt[0], bt[1], bt[2]), pk = P(540, 260, 0);
    acc([0, lerp(pb[1], pk[1], es(seg(cam.tau, 0.15, 0.6)))]); acc(P(540, 640, 0));
    for (var x = 100; x <= 1500; x += 50) acc(bend(x, 0));
    cam.cy = keep;
    return 450 - (top + bot) / 2;
  }
  var CYN = 400, CYT = (function () {
    var raw = [], i, j, out = [];
    for (i = 0; i <= CYN; i++) { setCam(i / CYN); setBend(i / CYN); raw.push(cyRaw()); }
    for (i = 1; i <= CYN; i++) raw[i] = Math.min(raw[i], raw[i - 1]);   /* the camera only rises */
    for (i = 0; i <= CYN; i++) { var a = 0, w = 0; for (j = -24; j <= 24; j++) { var k2 = clamp(i + j, 0, CYN), g = Math.exp(-j * j / 128); a += raw[k2] * g; w += g; } out.push(a / w); }
    setCam(0); setBend(0);
    return out;
  })();
  function frameCy(m) {
    var f = clamp(m) * CYN, i = Math.min(CYN - 1, Math.floor(f)), cy = lerp(CYT[i], CYT[i + 1], f - i);
    cam.cy = lerp(lerp(594 + DY, cy, E(m, 0.0, 0.3)), 450, es(seg(m, 0.4, 0.85)));
  }
  function xth(th) { return 800 - (th - 180) * XTH; }
  function thx(x) { return 180 + (800 - x) / XTH; }
  function barLine(xa, xb, d, step) {
    step = step || 8; var n = Math.max(1, Math.ceil(Math.abs(xb - xa) / step)), o = [];
    for (var i = 0; i <= n; i++) o.push(bend(xa + (xb - xa) * i / n, d)); return o;
  }
  function cutGap(xa, xb, g) { /* xa > xb ; pieces avoiding [800-g, 800+g] (the drive) */
    if (g < 0.01 || xb >= 800 + g || xa <= 800 - g) return [[xa, xb]];
    var out = []; if (xa > 800 + g) out.push([xa, 800 + g]); if (xb < 800 - g) out.push([800 - g, xb]); return out;
  }
  function arcD(thA, thB, d, g) {
    if (thB - thA < 0.05) return '';
    var s = '', a = thA;
    while (a < thB - 1e-6) {
      var n = Math.floor(a / 360 + 1e-9), b = Math.min(thB, (n + 1) * 360);
      var pcs = cutGap(xth(a - n * 360), xth(b - n * 360), g);
      for (var i = 0; i < pcs.length; i++) if (pcs[i][0] - pcs[i][1] > 0.2) s += polyD(barLine(pcs[i][0], pcs[i][1], d, 6));
      a = b;
    }
    return s;
  }
  function capsuleD(xa, xb, dc, hh, g) { /* pending/booked window capsule, opened at the drive gap */
    var ra = xa - hh, rb = xb + hh, n = 8, i;
    var capR = [], capL = [];
    for (i = 0; i <= n; i++) { var a = Math.PI / 2 - Math.PI * i / n; capR.push(bend(ra + hh * Math.cos(a), dc + hh * Math.sin(a))); }
    for (i = 0; i <= n; i++) { var a2 = Math.PI / 2 + Math.PI * i / n; capL.push(bend(rb + hh * Math.cos(a2), dc + hh * Math.sin(a2))); }
    var pcs = cutGap(ra, rb, g);
    if (pcs.length === 1) {
      var top = barLine(ra, rb, dc + hh, 8), bot = barLine(rb, ra, dc - hh, 8);
      return polyD(top.concat(capL.slice(1), bot.slice(1), capR.slice().reverse().slice(1)), true);
    }
    var A = pcs[0], Bp = pcs[1];
    return polyD(barLine(A[1], A[0], dc + hh, 8).concat(capR.slice(1), barLine(A[0], A[1], dc - hh, 8).slice(1))) +
           polyD(barLine(Bp[0], Bp[1], dc + hh, 8).concat(capL.slice(1), barLine(Bp[1], Bp[0], dc - hh, 8).slice(1)));
  }

  /* ------------------------------------------------------------------ routes (plan) */
  function route(pts) { var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { p: pts, L: L, len: L[L.length - 1] }; }
  function rAt(R, d) { d = clamp(d, 0, R.len); for (var i = 1; i < R.p.length; i++) if (d <= R.L[i] + 1e-9) { var t = (d - R.L[i - 1]) / ((R.L[i] - R.L[i - 1]) || 1); return [lerp(R.p[i - 1][0], R.p[i][0], t), lerp(R.p[i - 1][1], R.p[i][1], t)]; } return R.p[R.p.length - 1].slice(); }
  function rSub(R, d0, d1) { d0 = clamp(d0, 0, R.len); d1 = clamp(d1, 0, R.len); if (d1 - d0 < 0.3) return null; var o = [rAt(R, d0)]; for (var i = 1; i < R.p.length - 1; i++) if (R.L[i] > d0 && R.L[i] < d1) o.push(R.p[i]); o.push(rAt(R, d1)); return o; }
  var TOPL = 380, BOTL = 410;
  /* bottom-west bay 540-650 is the entrance lobby (west entrance door at (605,530)) */
  var UNITS = { T1: ['t', 605], T2: ['t', 735], T3: ['t', 865], T4: ['t', 995], B2: ['b', 705], B3: ['b', 895], B4: ['b', 1005] };
  function unitRoute(u, y0) { var s = UNITS[u][0], d = UNITS[u][1]; return s === 't' ? route([[800, y0], [800, TOPL], [d, TOPL], [d, 360]]) : route([[800, y0], [800, BOTL], [d, BOTL], [d, 430]]); }
  function lightPos(u) { var s = UNITS[u][0], d = UNITS[u][1]; return s === 't' ? [d + 24, 344] : [d + 24, 446]; }
  /* guest 1: gate -> walkway along the building front -> west entrance (side-view door) -> lobby -> T1 */
  /* he stops in the corridor just outside his unit door (clear of the door swing) */
  var R1 = route([[800, 640], [800, 541], [605, 541], [605, 374]]), G1DOOR = 305, G1UNIT = R1.len;
  var RB = unitRoute('B4', 640), RC = unitRoute('T3', 872), RD = unitRoute('B2', 872);
  function gd(u, v) { return Math.abs(u - 800) + Math.abs(v - 640); }   /* reveal distance from the gate */
  var WMAX = 780;
  /* the reveal follows the tilt itself: the plan grows as the ground plane opens */
  function waveW(m) { return WMAX * es(seg(tauOf(m), 0.12, 0.9)); }
  /* compound outline: drawn length along each side (from the gate), leading the same wave */
  var OUTL = [860, 850];
  function outLen(W) { return Math.max(0, 2.3 * W - 20); }

  /* ------------------------------------------------------------------ timeline */
  var MS = 19.4, ME = 24.4, RS = 37.0, RE = 42.0;
  function mergeM(t) { if (t < MS) return 0; if (t < ME) return seg(t, MS, ME); if (t < RS) return 1; return 1 - seg(t, RS, RE); }
  function gxA(t) { /* first guest's x in the side view (sketch px) */
    if (t < 8.2) return lerp(1300, 1150, eo(seg(t, 6.2, 8.2)));
    if (t < 11.0) return 1150;
    if (t < 14.2) return lerp(1150, 545, eio(seg(t, 11.0, 14.2)));
    if (t < 16.2) return 545;
    return lerp(545, 352, eio(seg(t, 16.2, 17.4)));
  }
  var TK = [[17.6, thx(352), 0], [34.1, thx(152), 4.0], [RE, 372, 0]];
  function theta(t) {
    if (t < 6.0) return thx(lerp(xth(12), 1290, eio(t / 6.0)));
    if (t < TK[0][0]) return thx(Math.min(1290, gxA(t)));
    for (var i = 0; i < TK.length - 1; i++) {
      var a = TK[i], b = TK[i + 1];
      if (t <= b[0]) {
        var h = b[0] - a[0], u = (t - a[0]) / h, u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * a[1] + (u3 - 2 * u2 + u) * h * a[2] + (-2 * u3 + 3 * u2) * b[1] + (u3 - u2) * h * b[2];
      }
    }
    return 372;
  }
  var S_C = theta(26.4), S_D = theta(30.0);
  var BOOK = [
    { d: 30, s: 200, e: 440 },        /* in-house guest, unit B4 */
    { d: 45, s: S_C, e: S_C + 150 },  /* arrives: unit T3 */
    { d: 60, s: S_D, e: S_D + 135 }   /* arrives: unit B1 */
  ];

  /* ------------------------------------------------------------------ build DOM (once) */
  el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: '#fff' });
  var defs = el('defs', {});
  var clipG = el('clipPath', { id: 'wgh-door-clip' }, defs);
  el('rect', { x: 392, y: 0, width: 1300, height: 900 }, clipG);

  /* ground (ink).  The single H1 ground line is two coincident lines: the gate line
     (v=640) and the building front line (v=530).  As the camera tilts they separate. */
  var gGround = el('g', { fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'butt' });
  var grFront = el('path', {}, gGround), grBack = el('path', {}, gGround);
  var gDrive = el('g', { fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'butt' });
  var drL = el('path', {}, gDrive), drR = el('path', {}, gDrive);
  var gStreet = el('g', { fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'butt' });
  var stL = el('path', {}, gStreet), stR = el('path', {}, gStreet);

  /* ---- bar / ring */
  var gBar = el('g', { fill: 'none', stroke: B, 'stroke-linecap': 'butt' });
  var ringBase = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gBar);
  var ticksMain = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gBar);
  var tickMid = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gBar);
  var tickEnd = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gBar);
  var gLanes = el('g', {}, gBar);
  BOOK.forEach(function (bk) {
    bk.pale = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45 }, gLanes);
    bk.lit = el('path', { 'stroke-width': 3 }, gLanes);
    bk.endT = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45 }, gLanes);
    bk.st = el('circle', { r: 4.5, fill: B, stroke: B, 'stroke-width': 1.5 }, gLanes);
  });
  var capsule = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45 }, gBar);
  var futArc = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '5 7' }, gBar);
  var futSt = el('circle', { r: 4.5, fill: 'none', stroke: B, 'stroke-width': 1.5 }, gBar);
  var fillP = el('path', { 'stroke-linecap': 'round' }, gBar);
  var brT0 = el('path', { 'stroke-linecap': 'round' }, gBar);
  var brT1 = el('path', { 'stroke-linecap': 'round' }, gBar);
  var stDot = el('circle', { r: 5, fill: B, stroke: 'none' }, gBar);
  var nowLine = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45 }, gBar);
  var connector = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, gBar);
  var playhead = el('circle', { r: 8, fill: B, stroke: B, 'stroke-width': 3 }, gBar);

  /* ---- plan interiors: every wall draws on from its end nearest the gate as a wave
     spreads from the gate through the compound during the tilt */
  var gPlan = el('g', { fill: 'none', stroke: B, 'stroke-linejoin': 'miter' });
  var tint = wpath(gPlan, { fill: B, 'fill-opacity': 0, stroke: 'none' }, [planW([[540, 360], [1060, 360], [1060, 430], [840, 430], [840, 530], [760, 530], [760, 430], [540, 430]])], true, 'plan');
  var arch = [];
  function A2(x0, y0, x1, y1) { arch.push([[x0, y0], [x1, y1]]); }
  [[540, 593], [617, 723], [747, 853], [877, 983], [1007, 1060]].forEach(function (p) { A2(p[0], 360, p[1], 360); });
  [670, 800, 930].forEach(function (x) { A2(x, 260, x, 360); });
  [[540, 593], [617, 693], [717, 760], [840, 883], [907, 993], [1017, 1060]].forEach(function (p) { A2(p[0], 430, p[1], 430); });
  A2(540, 530, 593, 530); A2(617, 530, 760, 530); A2(840, 530, 1060, 530);
  [650, 760, 840, 950].forEach(function (x) { A2(x, 430, x, 530); });
  Object.keys(UNITS).forEach(function (k) {
    var s = UNITS[k][0], d = UNITS[k][1];
    if (s === 't') {
      arch.push([[d - 12, 360], [d - 12, 336]].concat(arcP(d - 12, 360, 24, -90, 0, 8).slice(1)));
      arch.push([[d - 22, 260], [d - 22, 310], [d + 22, 310], [d + 22, 260]]); A2(d - 22, 274, d + 22, 274);
    } else {
      arch.push([[d - 12, 430], [d - 12, 454]].concat(arcP(d - 12, 430, 24, 90, 0, 8).slice(1)));
      arch.push([[d - 22, 530], [d - 22, 480], [d + 22, 480], [d + 22, 530]]); A2(d - 22, 516, d + 22, 516);
    }
  });
  A2(760, 552, 760, 634); A2(840, 530, 840, 630); A2(560, 552, 744, 552); A2(856, 552, 1040, 552);
  [560, 606, 652, 698, 744, 856, 902, 948, 994, 1040].forEach(function (x) { A2(x, 552, x, 622); });
  [583, 675, 925, 1017].forEach(function (c) { arch.push(rr(c - 12, 563, 24, 46, 6, 3)); A2(c - 8, 575, c + 8, 575); A2(c - 8, 599, c + 8, 599); });
  var gArch = el('g', { 'stroke-width': 1.5, 'stroke-opacity': 0.45 }, gPlan);
  var ARCH = arch.map(function (pl) {
    var d0 = gd(pl[0][0], pl[0][1]), d1 = gd(pl[pl.length - 1][0], pl[pl.length - 1][1]), dm = Infinity, L = 0, i;
    if (d1 < d0 && pl[0] !== pl[pl.length - 1]) pl = pl.slice().reverse();
    for (i = 0; i < pl.length; i++) dm = Math.min(dm, gd(pl[i][0], pl[i][1]));
    for (i = 1; i < pl.length; i++) L += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
    return { e: wpath(gArch, { pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, [planW(pl)], false, 'plan'), d0: dm, L: Math.max(L, 24), p: -1 };
  });
  var gPaths = el('g', { 'stroke-linejoin': 'miter' }, gPlan);
  var restC = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '5 7' }, gPaths);
  var restD = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '5 7' }, gPaths);
  var litB = el('path', { 'stroke-width': 3 }, gPaths);
  var litC = el('path', { 'stroke-width': 3 }, gPaths);
  var litD = el('path', { 'stroke-width': 3 }, gPaths);
  var litG1 = el('path', { 'stroke-width': 3 }, gPaths);
  var uLights = {};
  Object.keys(UNITS).forEach(function (k) { uLights[k] = el('circle', { r: 6, fill: B, 'fill-opacity': 0, stroke: B, 'stroke-width': 1.5 }, gPlan); });
  function headEl(par) { return { ring: el('circle', { r: 17, fill: 'none', stroke: B, 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, par), dot: el('circle', { r: 8, fill: B, stroke: 'none' }, par) }; }
  var hC = headEl(gPlan), hD = headEl(gPlan);
  var lock = el('path', { 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gPlan);
  var LOCKB = rr(641, 298, 18, 14, 3, 2), LOCKK = [[650, 303], [650, 307]];
  function lockPolys(dy) { return [LOCKB, LOCKK, [[645, 298 + dy], [645, 292 + dy]].concat(arcP(650, 292 + dy, 5, 180, 360, 8).slice(1)).concat([[655, 292 + dy], [655, 298 + dy]])].map(planW); }

  /* ---- compound outline: draws on from the gate along the ground once the ground opens */
  var gOut = el('g', { fill: 'none', stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' });
  var outL = wpath(gOut, { pathLength: 1, 'stroke-dasharray': '1 1' }, [planW([[760, 640], [540, 640], [540, 260], [800, 260]])], false, 'out');
  var outR = wpath(gOut, { pathLength: 1, 'stroke-dasharray': '1 1' }, [planW([[850, 640], [1060, 640], [1060, 260], [800, 260]])], false, 'out');

  /* ---- barrier gate: one real 3D object, seen from the side in H1 and from above in H2.
     Housing 830-850 x 630-650, rest post 760-768, arm 8 deep (v 636-644) on a pivot
     just west of the housing.  Line widths are switched, never scaled. */
  var HH = 126 / KS, PH = 99 / KS;
  var PV = sw(970, 494, 0), AU = PV[0], AH = PV[2], AT = 7 / KS, AS0 = -6 / KS, AS1 = (970 - 792) / KS;
  var gB3 = el('g', { fill: 'none', stroke: B, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  var housing = wpath(gB3, {}, [[[830, 650, 0], [830, 650, HH], [850, 650, HH], [850, 650, 0]], [[830, 650, HH], [830, 630, HH], [850, 630, HH], [850, 650, HH]]], false, 'b3');
  var post = wpath(gB3, {}, [[[760, 646, 0], [760, 646, PH], [768, 646, PH], [768, 646, 0]], [[760, 646, PH], [760, 634, PH], [768, 634, PH], [768, 646, PH]]], false, 'b3');
  var armF = el('path', {}, gB3);
  var hatF = el('path', { 'stroke-width': 1.5 }, gB3);
  var hatT = el('path', { 'stroke-width': 1.5 }, gB3);
  var pivot = el('circle', { r: 3, fill: B, stroke: 'none' }, gB3);
  var barLight = el('circle', { r: 6, fill: B, stroke: B, 'stroke-width': 1.5 });
  var ARMF = rr(AS0, -AT, AS1 - AS0, 2 * AT, 3 / KS, 2);
  var HATCH = [40, 86, 132].map(function (px) { return px / KS; });
  function armW(s, t, v, ca, sa) { return [AU - s * ca + t * sa, v, AH + s * sa + t * ca]; }
  function armGeo(al) {
    var ca = Math.cos(al), sa = Math.sin(al), F = [], hf = [], ht = [];
    [644, 636].forEach(function (v) { F.push(ARMF.map(function (p) { return armW(p[0], p[1], v, ca, sa); })); });
    F.push([armW(AS1, 0, 636, ca, sa), armW(AS1, 0, 644, ca, sa)]);
    F.push([armW(AS0, 0, 636, ca, sa), armW(AS0, 0, 644, ca, sa)]);
    HATCH.forEach(function (s0) {
      var a = 9 / KS, b = 11 / KS, c = 20 / KS;
      hf.push([armW(s0, AT, 644, ca, sa), armW(s0 + a, -AT, 644, ca, sa)]);
      hf.push([armW(s0 + b, AT, 644, ca, sa), armW(s0 + c, -AT, 644, ca, sa)]);
      ht.push([armW(s0, AT, 644, ca, sa), armW(s0 + a, AT, 636, ca, sa)]);
      ht.push([armW(s0 + b, AT, 644, ca, sa), armW(s0 + c, AT, 636, ca, sa)]);
    });
    return { F: F, hf: hf, ht: ht };
  }

  /* ---- side-view flats on the building's south front (v = FV = 530) */
  var gFac = el('g', { fill: 'none', stroke: B, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  var bldg = [[[280, 600], [280, 340], [600, 340], [600, 600]], [[270, 340], [610, 340]], [[320, 488], [404, 488]]];
  for (var rI = 0; rI < 2; rI++) for (var cI = 0; cI < 4; cI++) bldg.push(rr(308 + cI * 72, [368, 420][rI], 50, 34, 3, 2));
  wpath(gFac, {}, bldg.map(function (p) { return sideW(p, FV); }), false, 'flat');
  var gFlat = el('g', { fill: 'none', stroke: B, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  var doorTint = el('path', { fill: B, 'fill-opacity': 0, stroke: 'none' }, gFlat);
  var doorFrame = wpath(gFlat, {}, [sideW([[332, 600], [332, 500], [392, 500], [392, 600]], FV)], false, 'flat');
  var doorLeaf = el('path', {}, gFlat);
  var doorHandle = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gFlat);
  var reader = wpath(gFlat, {}, [sideW(rr(419, 500, 18, 30, 4, 2), FV)], false, 'flat');
  /* the reader light IS the unit light of the guest's unit (T1): same world point */
  /* the reader light sits just inside the entrance, like the unit lights sit inside their doors */
  var T1L = sw(428, 515, FV - 16);
  var t1Light = el('circle', { r: 6, fill: B, stroke: B, 'stroke-width': 1.5 });
  el('g', {}).appendChild(barLight);

  /* ---- first guest: dot in the plan */
  var hG1 = headEl(svg);

  /* ---- first guest: pictogram in the side view (screen space, sketch px); the clip is the door jamb */
  var gGuestW = el('g', { transform: 'translate(0 ' + (DY - 6) + ')' });
  var gGuest = el('g', { 'clip-path': 'url(#wgh-door-clip)', fill: 'none', stroke: B, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gGuestW);
  var gBody = el('path', { 'stroke-width': 3 }, gGuest);
  var gHead = el('circle', { r: 17, 'stroke-width': 3 }, gGuest);
  var gPhone = el('path', { 'stroke-width': 3 }, gGuest);
  var gLine = el('path', { 'stroke-width': 1.5 }, gGuest);
  var gArc1 = el('path', { 'stroke-width': 3 }, gGuest);
  var gArc2 = el('path', { 'stroke-width': 3 }, gGuest);

  /* ---- side-view overlay: booking, link, phone, ending (screen space) */
  var gOv = el('g', { transform: 'translate(0 ' + (DY - 6) + ')', fill: 'none', stroke: B, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  el('path', { d: 'M1600 196 C1540 196 1490 214 1450 240', 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 8' }, gOv);
  var env = el('g', { transform: 'rotate(-8 1386 258)' }, gOv);
  var envR = el('rect', { x: 1350, y: 235, width: 72, height: 46, rx: 6 }, env);
  var envF = el('path', { d: 'M1354 240 L1386 264 L1418 240' }, env);
  el('path', { d: 'M1392 294 V340', 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 8' }, gOv);
  var calR = el('rect', { x: 1340, y: 362, width: 130, height: 122, rx: 12 }, gOv);
  var calL = el('path', { d: 'M1340 394 H1470 M1374 348 V374 M1436 348 V374' }, gOv);
  var cells = [], cellIn = [];
  for (var r0 = 0; r0 < 3; r0++) for (var c0 = 0; c0 < 4; c0++) {
    var bk0 = r0 === 1 && (c0 === 1 || c0 === 2);
    var ce = el('rect', { x: 1351 + c0 * 30, y: 406 + r0 * 24, width: 18, height: 18, rx: 4, 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gOv);
    if (bk0) { cells.push(ce); cellIn.push(el('circle', { cx: 1360 + c0 * 30, cy: 439, r: 3, fill: B, 'stroke-width': 1.5 }, gOv)); }
  }
  el('path', { d: 'M1334 424 C1240 424 1180 340 1112 340', 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 8' }, gOv);
  var phR = el('rect', { x: 1040, y: 286, width: 62, height: 112, rx: 12 }, gOv);
  el('path', { d: 'M1062 298 H1080 M1060 386 H1082', 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gOv);
  var phG = el('g', { transform: 'translate(1071 342) rotate(-45)' }, gOv);
  el('rect', { x: -19.5, y: -8.25, width: 22.5, height: 16.5, rx: 8.25 }, phG);
  el('rect', { x: -3, y: -8.25, width: 22.5, height: 16.5, rx: 8.25 }, phG);
  var notify = el('circle', { cx: 1107, cy: 281, r: 6, fill: B, 'stroke-width': 1.5 }, gOv);
  var call1 = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4, pathLength: 1, 'stroke-dasharray': '1 1' }, gOv);
  var call2 = el('path', { 'stroke-width': 1.5, 'stroke-opacity': 0.4, pathLength: 1, 'stroke-dasharray': '1 1' }, gOv);
  el('path', { d: 'M274 440 H206', 'stroke-width': 1.5, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 8' }, gOv);
  var gEnd = el('g', { 'stroke-width': 1.5, 'stroke-opacity': 0.4 }, gOv);
  el('rect', { x: 112, y: 404, width: 80, height: 76, rx: 12 }, gEnd);
  el('path', { d: 'M128 404 V364 A24 24 0 0 1 176 364 V376' }, gEnd);
  el('circle', { cx: 152, cy: 436, r: 7 }, gEnd);
  el('path', { d: 'M152 443 V458' }, gEnd);
  el('circle', { cx: 232, cy: 330, r: 28 }, gEnd);
  el('path', { d: 'M253 330 L257 330 M232 351 L232 355 M211 330 L207 330 M232 309 L232 305 M232 330 V314' }, gEnd);
  var clockHand = el('path', {}, gEnd);
  el('circle', { cx: 232, cy: 330, r: 2 }, gEnd);
  var pulse = el('circle', { r: 6, fill: B, stroke: 'none' }, gOv);

  /* ------------------------------------------------------------------ helpers for the frame */
  function cubic(p, t) { var u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; }
  var TRAIL = [1600, 196, 1540, 196, 1490, 214, 1450, 240], LINK = [1334, 424, 1240, 424, 1180, 340, 1112, 340];
  function headAt(h, x, y, dotR, ringW, ringO, o) {
    set(h.ring, 'cx', f1(x)); set(h.ring, 'cy', f1(y)); set(h.dot, 'cx', f1(x)); set(h.dot, 'cy', f1(y));
    set(h.ring, 'stroke-width', f3(ringW)); set(h.ring, 'stroke-opacity', f3(ringO)); set(h.dot, 'r', f3(dotR));
    op(h.ring, o); op(h.dot, dotR > 0.05 ? o : 0);
  }
  function pathOrHide(e, pl) { set(e, 'd', pl ? projD([planW(pl)]) : ''); }
  function at(e, p) { set(e, 'cx', f1(p[0])); set(e, 'cy', f1(p[1])); }
  var armKey = '';

  /* ------------------------------------------------------------------ render(t) */
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var m = mergeM(t);
    setCam(m);
    var ta = cam.tau, k = cam.k;
    setBend(m); frameCy(m);
    var q = BQ.q;
    var th = theta(t);
    var W = waveW(m);                    /* plan interiors: reveal front, distance from the gate */
    var iv = W > 0.01 ? 1 : 0;
    var fv = 1 - sm(0.28, 0.52, ta);     /* standing flats (facade, door, reader) */
    var ov = 1 - sm(0.0, 0.2, m);        /* side overlays */
    var lv = sm(0.75, 0.98, m);          /* other lanes on the ring */
    var dv = sm(0.5, 0.85, ta);          /* drive edges */
    var sv = sm(0.78, 1.0, ta);          /* street */
    var partA = t < RS;
    var GB = dv * 30 * k / BQ.sig, GL = dv * (30 * k + 4) / BQ.sig;

    /* ---- static world items (re-projected only when the camera moved) */
    var vis = { plan: iv, flat: fv, out: 1, b3: 1 };
    for (var i = 0; i < WS.length; i++) { var it = WS[i]; if (vis[it.grp] > 0 && it.key !== cam.key) { set(it.e, 'd', projD(it.polys, it.close)); it.key = cam.key; } }

    /* ---- ground */
    var gs = 1 - sm(0.2, 0.6, ta);
    op(gGround, 0.22 * gs);
    if (gs > 0) {
      var uA = lerp(800 + (80 - GX0) / KS, 540, cam.z), uB = lerp(800 + (1520 - GX0) / KS, 1060, cam.z);
      set(grFront, 'd', projD([[[uA, 640, 0], [uB, 640, 0]]]));
      set(grBack, 'd', projD([[[uA, FV, 0], [uB, FV, 0]]]));
    }
    op(gDrive, 0.2 * dv);
    if (dv > 0) {
      set(drL, 'd', projD([[[770, 652, 0], [770, 866, 0]]]));
      set(drR, 'd', projD([[[830, 652, 0], [830, 866, 0]]]));
    }
    op(gStreet, 0.2 * sv);
    if (sv > 0) {
      var uL = 800 + (-20 - cam.sx) / k, uR = 800 + (1620 - cam.sx) / k;
      set(stL, 'd', projD([[[770, 866, 0], [769.2, 872.2, 0], [766.4, 876, 0], [762.6, 877.6, 0], [758, 878, 0], [Math.min(uL, 700), 878, 0]]]));
      set(stR, 'd', projD([[[830, 866, 0], [830.8, 872.2, 0], [833.6, 876, 0], [837.4, 877.6, 0], [842, 878, 0], [Math.max(uR, 900), 878, 0]]]));
    }

    /* ---- ring base + ticks */
    set(ringBase, 'd', polyD(barLine(800 - GB, 100, 0, 10)) + polyD(barLine(1500, 800 + GB, 0, 10)));
    var tk = '';
    for (var kk = 0; kk <= 28; kk++) {
      if (kk === 14 || kk === 28) continue;
      var x = 100 + 50 * kk, len = kk % 7 === 0 ? 18 : lerp(9, 8, q);
      tk += polyD([bend(x, 0), bend(x, -len)]);
    }
    set(ticksMain, 'd', tk);
    set(tickMid, 'd', polyD([bend(800, 0), bend(800, -18)])); op(tickMid, 1 - Math.max(q, dv));
    set(tickEnd, 'd', polyD([bend(1500, 0), bend(1500, -18)])); op(tickEnd, 1 - q);

    /* ---- other bookings on the ring */
    op(gLanes, lv);
    if (lv > 0) BOOK.forEach(function (b) {
      if (th < b.s) {
        set(b.lit, 'd', ''); set(b.endT, 'd', '');
        set(b.pale, 'd', arcD(b.s + 1.4, b.e, b.d, GL)); set(b.pale, 'stroke-dasharray', '5 7');
        at(b.st, bend(xth(b.s % 360), b.d)); set(b.st, 'r', '4.5'); set(b.st, 'fill-opacity', '0');
      } else {
        var a = sm(b.s, b.s + 4, th);
        set(b.lit, 'd', arcD(b.s, Math.min(th, b.e), b.d, GL));
        set(b.pale, 'd', arcD(th, b.e, b.d, GL));
        set(b.pale, 'stroke-dasharray', a > 0.995 ? 'none' : '5 ' + f3(7 * (1 - a)));
        at(b.st, bend(xth(b.s % 360), b.d)); set(b.st, 'r', f3(lerp(4.5, 4.25, a))); set(b.st, 'fill-opacity', f3(a));
        var ex = xth(b.e % 360); set(b.endT, 'd', polyD([bend(ex, b.d - 6), bend(ex, b.d + 6)])); op(b.endT, a);
      }
    });

    /* ---- first guest's window (bar capsule -> lane arc) and the next booking at the seam */
    var act = partA ? sm(6.0, 6.4, t) : 0;                 /* window open */
    var close1 = partA ? sm(34.1, 34.9, t) : 0;             /* window closed */
    var gone1 = partA ? sm(35.3, 36.1, t) : 1;              /* closed arc removed */
    var playX = t < TK[0][0] ? (t < 6.0 ? lerp(xth(12), 1290, eio(t / 6.0)) : Math.min(1290, gxA(t))) : xth(th % 360);
    var dc = lerp(28, 15, q), hh = 9 * (1 - q);
    var capO = partA ? 1 - sm(34.1, 34.7, t) : 1 - sm(0.7, 1.0, q);
    set(capsule, 'd', capO > 0 ? capsuleD(1290, 152, dc, hh, GL) : ''); op(capsule, capO);
    var xNow = Math.max(152, playX);
    if (act > 0 && gone1 < 1 && 1290 - xNow > 0.5) {
      var xa = 1290 - 9 * (1 - q), xb = xNow + 5 * (1 - q), fs = '';
      if (xa - xb > 0.3) cutGap(xa, xb, GL).forEach(function (pc) { if (pc[0] - pc[1] > 0.3) fs += polyD(barLine(pc[0], pc[1], dc, 6)); });
      set(fillP, 'd', fs);
      set(fillP, 'stroke-width', f3(lerp(10, 3, q)));
      set(fillP, 'stroke-linecap', q < 0.98 ? 'round' : 'butt');
      set(fillP, 'stroke-dasharray', close1 > 0.002 ? '10 ' + f3(8 * close1) : 'none');
      op(fillP, lerp(1, 0.35, close1) * (1 - gone1));
    } else { set(fillP, 'd', ''); }
    /* window brackets: continuous; secondary while pending, primary once the window is open */
    function brk(x, top, bot) { return polyD([bend(x, top), bend(x, bot)]); }
    set(brT1, 'd', brk(1290, lerp(44, 15, q), lerp(0, 15, q)));
    set(brT1, 'stroke-width', f3(lerp(1.5, 3, act))); set(brT1, 'stroke-opacity', f3(lerp(0.45, 1, act)));
    op(brT1, 1 - sm(0.0, 0.6, q));
    at(stDot, bend(1290, 15)); set(stDot, 'r', f3(5 * (partA ? sm(0.4, 1, q) : 0))); op(stDot, partA ? 1 - close1 : 0);
    set(brT0, 'd', brk(152, lerp(44, 21, q), lerp(0, 9, q)));
    set(brT0, 'stroke-width', f3(lerp(lerp(1.5, 3, act), 1.5, q))); set(brT0, 'stroke-opacity', f3(lerp(lerp(0.45, 1, act), 0.45, q)));
    op(brT0, partA ? 1 - close1 : 1 - sm(0.6, 1.0, q));
    var fut = partA ? E(t, 35.5, 36.5) : 1, futO = partA ? sm(35.5, 35.8, t) : sm(0.55, 0.95, q);
    if (futO > 0 && fut > 0) {
      var fxb = lerp(1290, 152, fut), fs2 = '';
      cutGap(1290 - 5, fxb, GL).forEach(function (pc) { if (pc[0] - pc[1] > 0.3) fs2 += polyD(barLine(pc[0], pc[1], dc, 6)); });
      set(futArc, 'd', fs2); op(futArc, futO);
      at(futSt, bend(1290, dc)); op(futSt, futO);
    } else { set(futArc, 'd', ''); op(futSt, 0); }
    set(nowLine, 'd', polyD([bend(playX, 72), bend(playX, -20)])); op(nowLine, sm(0.45, 1, q));
    at(playhead, bend(playX, lerp(28, -26, q)));
    var pf = partA ? (t < 6.0 ? 0 : Math.max(act, q)) : sm(0.25, 0.9, q);
    if (t >= ME && partA) pf = 1;
    set(playhead, 'fill-opacity', f3(pf));
    set(playhead, 'r', f3(lerp(lerp(8, 7.5, pf), 4.5, q)));
    var conO = t < MS ? sm(6.2, 6.8, t) * (1 - sm(16.3, 16.9, t)) : 0;
    set(connector, 'd', polyD([bend(playX, 84), bend(playX, 46)])); op(connector, conO);

    /* ---- compound outline (draws on from the gate, just ahead of the interiors) */
    var oL = outLen(W);
    set(outL, 'stroke-dashoffset', f3(1 - clamp(oL / OUTL[0]))); set(outR, 'stroke-dashoffset', f3(1 - clamp(oL / OUTL[1])));
    op(gOut, sm(0, 10, oL));
    /* while the ground is still edge-on the outline is context (it lies on the ground line) */
    var oS = sm(0.3, 0.5, ta);
    set(gOut, 'stroke-width', f3(lerp(1.5, 3, oS))); set(gOut, 'stroke-opacity', f3(lerp(0.4, 1, oS)));

    /* ---- barrier (3D, both views) */
    var barOn = partA ? sm(6.0, 6.6, t) - sm(14.6, 15.3, t) : 0;
    var barS = Math.max(barOn, sm(0.3, 0.8, ta));
    op(gB3, lerp(0.4, 1, barS));
    set(housing, 'stroke-width', f3(lerp(1.5, 3, barS))); set(post, 'stroke-width', f3(lerp(1.5, 3, barS))); set(armF, 'stroke-width', f3(lerp(1.5, 3, barS)));
    var liftA = E(t, 9.3, 10.6) - E(t, 13.3, 14.5);
    var liftC = E(t, 26.6, 27.3) - E(t, 28.3, 29.0), liftD = E(t, 30.2, 30.9) - E(t, 32.0, 32.7);
    var lift = partA ? Math.max(liftA, liftC, liftD) * 85 * Math.PI / 180 : 0;
    var ak = cam.key + '|' + lift.toFixed(5);
    if (ak !== armKey) {
      armKey = ak;
      var ag = armGeo(lift);
      set(armF, 'd', projD(ag.F)); set(hatF, 'd', projD(ag.hf)); set(hatT, 'd', projD(ag.ht));
      at(pivot, P(AU, 644, AH));
    }
    op(hatF, 1 - sm(0.3, 0.75, ta));
    op(hatT, sm(0.35, 0.8, ta) * sm(0.3, 0.7, Math.cos(lift)));
    set(pivot, 'r', f3(lerp(3, 2.5, ta)));
    at(barLight, P(840, 668, 25.45));
    var barL = partA ? Math.max(sm(9.0, 9.3, t) - sm(14.4, 14.7, t), sm(26.4, 26.7, t) - sm(28.9, 29.2, t), sm(30.0, 30.3, t) - sm(32.5, 32.8, t)) : 0;
    light(barLight, barL, lerp(0.4, 1, barS));

    /* ---- standing flats: facade, door, reader */
    var doorOn = partA ? sm(13.5, 14.2, t) : 0;
    op(gFac, 0.4 * fv); op(gFlat, fv);
    if (fv > 0) {
      var o = partA ? E(t, 15.0, 16.0) - E(t, 17.5, 18.3) : 0;
      sty(doorFrame, doorOn); sty(doorLeaf, doorOn); sty(reader, doorOn);
      set(reader, 'stroke-opacity', f3(lerp(0.4, 1, doorOn) * (1 - sm(0.3, 0.9, cam.z))));
      var lx = lerp(392, 356, o);
      set(doorLeaf, 'd', projD([sideW([[332, 500], [lx, 500 + 9 * o], [lx, 600 - 6 * o], [332, 600]], FV)]));
      op(doorLeaf, sm(0, 0.25, o));
      set(doorHandle, 'd', projD([sideW([[lerp(380, 350, o), lerp(546, 552, o)], [lerp(380, 350, o), lerp(560, 564, o)]], FV)]));
      set(doorTint, 'd', projD([sideW([[lx, 500 + 9 * o], [332, 500], [392, 500], [392, 600], [332, 600], [lx, 600 - 6 * o]], FV)], true));
      set(doorTint, 'fill-opacity', f3(0.06 * o));
    }
    /* entrance reader light: unlocks for guest 1, relocks once he has walked on into the lobby */
    at(t1Light, P(T1L[0], T1L[1], T1L[2]));
    var on1 = partA ? sm(14.7, 15.0, t) - sm(22.6, 22.9, t) : 0;
    light(t1Light, on1, lerp(lerp(0.4, 1, doorOn), 1, sm(0.3, 0.9, ta)));
    op(t1Light, 1 - sm(0.8, 0.95, m));     /* the entrance light retires once the plan has formed */

    /* ---- first guest: pictogram (side) */
    var gvis = t < 17.6 ? sm(6.2, 6.8, t) : 0;
    op(gGuest, gvis);
    if (gvis > 0) {
      var cx = gxA(t), hx = cx - 28, ax = hx - 40;
      set(gBody, 'd', polyD([[cx - 28, 600], [cx - 28, 530]].concat(arcP(cx, 530, 28, 180, 360, 14).slice(1), [[cx + 28, 600]])));
      set(gHead, 'cx', f1(cx)); set(gHead, 'cy', '476');
      /* the phone is lowered while walking past the barrier and raised again for the door reader */
      var down = sm(10.6, 11.0, t) - sm(13.4, 13.9, t), dy = 16 * down;
      set(gPhone, 'd', polyD([[hx, 548], [hx - 14, 553 + dy * 0.5]]) + polyD(rr(hx - 36, 532 + dy, 22, 38, 5, 2)));
      set(gLine, 'd', polyD([[hx - 29, 562 + dy], [hx - 21, 562 + dy]]));
      var phO = (1 - down) * (1 - sm(15.8, 16.2, t));
      op(gPhone, phO); op(gLine, phO);
      set(gArc1, 'd', polyD(arcP(ax, 549, 18, 150, 210, 8))); set(gArc2, 'd', polyD(arcP(ax, 549, 32, 150, 210, 10)));
      op(gArc1, Math.max(sm(8.7, 8.9, t) - sm(10.2, 10.6, t), sm(14.4, 14.6, t) - sm(15.5, 15.9, t)));
      op(gArc2, Math.max(sm(8.85, 9.05, t) - sm(10.2, 10.6, t), sm(14.55, 14.75, t) - sm(15.5, 15.9, t)));
    }

    /* ---- first guest: dot in the plan.  It appears on the threshold of the door he went
       through in the side view, then walks on through the lobby to his unit (T1) */
    var g1d = partA ? lerp(G1DOOR, G1UNIT, E(t, 22.3, 23.8)) : G1DOOR;
    var g1o = partA ? sm(0.2, 0.42, ta) * (1 - sm(24.6, 25.2, t)) : 0;
    var g1p = rAt(R1, g1d), gp = P(g1p[0], g1p[1], 0);
    headAt(hG1, gp[0], gp[1], 8, 1.5, 0.4, g1o);

    /* ---- plan interiors */
    op(gPlan, iv);
    if (iv > 0) {
      for (var ai = 0; ai < ARCH.length; ai++) {
        var A = ARCH[ai], pa = clamp((W - A.d0) / A.L);
        if (pa !== A.p) { A.p = pa; set(A.e, 'stroke-dashoffset', f3(1 - pa)); op(A.e, sm(0, 6, pa * A.L)); }
      }
      set(tint, 'fill-opacity', f3(0.05 * sm(220, 520, W)));
      /* lit path: the walk so far follows the reveal front up to the entrance, then draws behind the dot */
      var d1 = Math.min(W, partA ? g1d : R1.len);
      pathOrHide(litG1, rSub(R1, 0, d1));
      /* lit routes only once the ground is open: edge-on they would read as posts */
      var lpo = sm(0.42, 0.6, ta); op(gPaths, lpo);
      var cl = partA ? close1 : 1;
      set(litG1, 'stroke-dasharray', cl > 0.002 ? '10 ' + f3(8 * cl) : 'none');
      set(litG1, 'stroke-opacity', f3(lerp(1, 0.35, cl)));
      pathOrHide(litB, rSub(RB, 0, W));
      function arrive(R, litE, restE, hd, tIn, tGate, tGo, tEnd) {
        var dist = t < tGate ? lerp(0, 172, eo(seg(t, tIn, tGate))) : t < tGo ? 172 : lerp(172, R.len, eio(seg(t, tGo, tEnd)));
        var present = t >= tIn;
        pathOrHide(litE, present && dist > 232 ? rSub(R, 232, dist) : null);
        pathOrHide(restE, present && dist < R.len - 0.5 ? rSub(R, dist, R.len) : null);
        op(restE, sm(tIn, tIn + 0.5, t));
        var hp = rAt(R, dist), pp = P(hp[0], hp[1], 0);
        headAt(hd, pp[0], pp[1], 8, 1.5, 0.4, sm(tIn, tIn + 0.5, t) * (1 - sm(tEnd, tEnd + 0.6, t)));
      }
      if (partA) {
        arrive(RC, litC, restC, hC, 24.8, 26.4, 27.3, 29.7);
        arrive(RD, litD, restD, hD, 28.4, 30.0, 30.9, 33.3);
      } else {
        pathOrHide(litC, rSub(RC, 232, 232 + W)); pathOrHide(litD, rSub(RD, 232, 232 + W)); set(restC, 'd', ''); set(restD, 'd', '');
        op(hC.ring, 0); op(hC.dot, 0); op(hD.ring, 0); op(hD.dot, 0);
      }
      var on = { T1: partA ? sm(23.7, 24.0, t) - sm(34.3, 34.8, t) : 0, B4: 1, T3: partA ? sm(29.6, 29.9, t) : 1, B2: partA ? sm(33.2, 33.5, t) : 1 };
      Object.keys(uLights).forEach(function (u) { var lp = lightPos(u); at(uLights[u], P(lp[0], lp[1], 0)); light(uLights[u], on[u] || 0, 1); op(uLights[u], sm(gd(lp[0], lp[1]) - 20, gd(lp[0], lp[1]) + 60, W)); });
      /* padlock on the closed unit (projected like the rest of the plan) */
      op(lock, (partA ? sm(34.1, 34.5, t) : 1) * sm(470, 560, W));
      set(lock, 'd', projD(lockPolys(-6 * (1 - (partA ? E(t, 34.5, 35.0) : 1)))));
    }

    /* ---- side overlays */
    op(gOv, ov);
    if (ov > 0) {
      var envOn = sm(1.0, 1.5, t) - sm(4.0, 4.8, t), calOn = sm(1.9, 2.4, t) - sm(4.0, 4.8, t);
      var phOn = sm(4.6, 5.1, t) - sm(11.4, 12.2, t), nOn = sm(5.0, 5.3, t) - sm(11.4, 12.2, t);
      if (!partA) { envOn = calOn = phOn = nOn = 0; }
      sty(envR, envOn); sty(envF, envOn); sty(calR, calOn); sty(calL, calOn); sty(phR, phOn); sty(phG, phOn);
      var booked = t < 30 ? sm(2.3, 2.8, t) : 0;
      for (var ci = 0; ci < cells.length; ci++) {
        set(cells[ci], 'stroke-opacity', f3(lerp(0.4, lerp(0.4, 1, calOn), booked)));
        set(cellIn[ci], 'r', f3(lerp(3, 3.25, calOn))); set(cellIn[ci], 'fill-opacity', f3(calOn));
        set(cellIn[ci], 'stroke-opacity', f3(lerp(0.4, 1, calOn))); op(cellIn[ci], booked);
      }
      set(notify, 'r', f3(lerp(6, 5.25, nOn))); set(notify, 'fill-opacity', f3(nOn)); set(notify, 'stroke-opacity', f3(lerp(lerp(0.4, 1, phOn), 1, nOn)));
      var hx2 = gxA(t) - 28;
      set(call1, 'd', 'M1050 404 L' + f1(hx2 - 34) + ' 526'); set(call2, 'd', 'M1092 404 L' + f1(hx2 - 16) + ' 526');
      var cd = partA ? E(t, 8.0, 8.6) : 0, co = partA ? 1 - sm(10.4, 10.8, t) : 0;
      set(call1, 'stroke-dashoffset', f3(1 - cd)); set(call2, 'stroke-dashoffset', f3(1 - cd)); op(call1, co * (cd > 0 ? 1 : 0)); op(call2, co * (cd > 0 ? 1 : 0));
      var ca = (128.7 + th - 12) * Math.PI / 180;
      set(clockHand, 'd', 'M232 330 L' + f1(232 + 12.8 * Math.sin(ca)) + ' ' + f1(330 - 12.8 * Math.cos(ca)));
      var pp2 = null, po2 = 0;
      if (t < 1.45) { pp2 = cubic(TRAIL, eio(seg(t, 0, 1.4))); po2 = sm(0, 0.3, t) * (1 - sm(1.2, 1.45, t)); }
      else if (t < 2.3) { pp2 = [1392, lerp(294, 340, eio(seg(t, 1.45, 2.2)))]; po2 = sm(1.45, 1.75, t) * (1 - sm(2.0, 2.3, t)); }
      else if (t > 3.7 && t < 5.2) { pp2 = cubic(LINK, eio(seg(t, 3.8, 5.0))); po2 = sm(3.75, 3.95, t) * (1 - sm(4.85, 5.1, t)); }
      if (pp2) at(pulse, pp2);
      op(pulse, po2);
    }
  }

  return { render: render, duration: DUR, still: HOST_STILL };
}
