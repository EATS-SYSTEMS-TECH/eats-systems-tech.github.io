// WIFIGATE Manager hero: the owner-approved line animation (38.9 s loop).
// Ported mechanically from the approved standalone page: the drawing,
// choreography and timing are unchanged, except the entrance (owner request,
// 12 Nov 2026), which now shows Auto Open: the resident walks in without
// stopping, the phone in the pocket signals and the door opens on the way;
// the entrance has no reader, only the doors and their status light.
// The page driver, URL debug hooks and window globals were removed;
// js/line-hero.js drives render(t). The approved page's static SVG markup is
// created here in its original order, and the only id (the dive lens clip) is
// scoped as wgm-lens.
export const MANAGER_DURATION = 38.9;
export const MANAGER_STILL = 27.65;

// Builds the scene inside an empty <svg> and returns its deterministic render(t).
export function createManagerScene(svg) {

  var NS = 'http://www.w3.org/2000/svg';
  var BLUE = '#146BFF';
  /* Line tone (owner request, 10 Nov 2026): the blue reads clearly on the white
     hero. Every stroke opacity passes through one curve that keeps 0 and 1 (so
     fades, keyframes and timing are unchanged) and lifts the pale context
     strokes (0.3 -> 0.62, 0.4 -> 0.75); every stroke weight is 1.2x. Blue tints
     are 1.6x. Geometry, choreography and timing are untouched. */
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
  /* the approved page's static markup, in its original order; only the clip id is scoped */
  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  var shellLens = el('clipPath', { id: 'wgm-lens', clipPathUnits: 'userSpaceOnUse' }, el('defs', {}));
  var shellLensP = el('path', { 'clip-rule': 'evenodd', d: 'M-10 -10H1610V910H-10Z' }, shellLens);
  el('rect', { width: '1600', height: '900', fill: '#fff' });
  var shellGlobeW = el('g', {}), shellGlobe = el('g', {}, shellGlobeW);
  var shellM2 = el('g', {});
  var shellPmr = el('rect', { x: '66', y: '518', width: '360', height: '324', fill: '#fff' });
  var shellM3 = el('g', {});
  var shellScr = el('g', {});
  var shellPanel = el('g', {});
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function f2(v) { return (Math.round(v * 100) / 100).toString(); }
  function f4(v) { return (Math.round(v * 10000) / 10000).toString(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function seg(t, a, b) { if (b === undefined) { b = a[1]; a = a[0]; } return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function sm(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function eSine(u) { u = clamp(u, 0, 1); return -(Math.cos(Math.PI * u) - 1) / 2; }
  function eOut(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  function pingK(t, t0, d) { var k = (t - t0) / (d || 0.8); return (k >= 0 && k < 1) ? k : -1; }

  /* ================================================================ timeline */
  var TL = {
    A: [0.6, 2.1], CAR: [1.9, 4.7], AB: [5.7, 7.4], SH: [7.3, 8.9], BC: [9.9, 11.6], CD: [11.3, 12.9],
    /* the entrance, Auto Open: one unbroken walk from the sidewalk into the lobby (WK); on the walkway the phone
       in the resident's pocket signals (WF), the light fills and the left leaf swings out ahead of the resident */
    WK: [8.9, 14.55], WF: [10.7, 12.75], GT: [12.15, 12.7], DO: [12.65, 13.4], CW: [14.3, 16.3],
    MG: [17.4, 23.0], MO: [17.4, 20.6], PN: [17.6, 19.3], ST: [19.4, 20.6], BL: [19.5, 22.0], MD: [20.3, 22.2],
    LT: [21.3, 22.5], TN: [21.6, 22.8],
    PU: [22.9, 24.2], RG: [24.0, 24.8], AR0: 24.8, ARd: 1.0, ARs: 0.32,
    PL: [27.8, 31.0], GA0: 30.4, GAd: 1.0, GAs: 0.2, GP: [32.5, 33.3],
    DV: [33.9, 38.4], DZ: [33.9, 36.2], DZP: [34.05, 36.1], DMO: [35.8, 37.3], DP: [37.0, 38.4], PIN: [37.5, 38.5]
  };
  var DUR = 38.9;
  var STILL_T = 27.65;

  /* ================================================================ M2: isometric site (port of M2-gen.py) */
  var K = Math.sqrt(1.5);
  var TH_ISO = Math.PI / 4, PH_ISO = Math.asin(1 / Math.sqrt(3)), PH_TOP = Math.PI / 2;
  var SX0 = -121, SX1 = 1214, SY0 = -430, SY1 = 160;
  var ROAD_Y0 = 20, ROAD_Y1 = 120, PL = -30;
  var A_X0 = 0, A_X1 = 420, A_Y0 = -360, H_X0 = 10, H_X1 = 50, PIV = [50, PL, 62], ARM_L = 214, GAP = [50, 278];
  var B_X0 = 490, B_X1 = 790, B_Y0 = -270, B_Yf = -70, B_H = 280, GF = 150, SH_X0 = 520, SH_X1 = 760, SH_Z = 118, DEP = 36;
  var C_X0 = 880, C_X1 = 1110, C_Y0 = -410, C_Yf = -200, C_H = 380;
  /* the tower's front entrance: a recessed double door, its status light on the wall to its right; the left leaf is the active
     one and swings out (towards the street), so the open leaf shows as a whole panel; the lobby lies behind */
  var D_X0 = 955, D_X1 = 1035, DH = 94, RD = 10, D_YR = C_Yf - RD, LW = (D_X1 - D_X0) / 2, OPEN = 95;
  var LOB = [915, -285];
  /* the canopy clears the door head by more than its own depth, so the head stays in view from above */
  var DLX = D_X1 + 26, DLZ = DH, CAN = [D_X0 - 14, D_X1 + 14, 124, 22], CURB = [850, 1140], WALKR = DLX + 17;
  var INKL = 0, SECD = 1, SEC = 2, SECV = 3, PRIM = 4;

  var PC = { cx: 0, cy: 0, cz: 0, ct: 1, st: 0, sp: 1, cp: 0, ks: 1, ox: 0, oy: 0 };
  /* camera: centre (cx,cy,cz), scale s, yaw th, pitch ph; optional framing fit f (scale about screen centre) and screen offset ox/oy */
  function setCam(c) {
    PC.cx = c.cx; PC.cy = c.cy; PC.cz = c.cz;
    PC.ct = Math.cos(c.th); PC.st = Math.sin(c.th); PC.sp = Math.sin(c.ph); PC.cp = Math.cos(c.ph);
    PC.ks = K * c.s * (c.f || 1); PC.ox = c.ox || 0; PC.oy = c.oy || 0;
  }
  function P(X, Y, Z) {
    var dx = X - PC.cx, dy = Y - PC.cy, dz = (Z || 0) - PC.cz;
    return [800 + PC.ox + (dx * PC.ct - dy * PC.st) * PC.ks, 450 + PC.oy + ((dx * PC.st + dy * PC.ct) * PC.sp - dz * PC.cp) * PC.ks];
  }
  function Pq(q) { return P(q[0], q[1], q[2]); }
  /* generator camera (focus fx,fy,fz drawn at screen sx,sy, scale s) -> centre form */
  function convCam(fx, fy, fz, sx, sy, s) {
    var ct = Math.cos(TH_ISO), st = Math.sin(TH_ISO), sp = Math.sin(PH_ISO);
    var a = (sx - 800) / (K * s), b = (sy - 450) / (K * s), v = b / sp;
    var dx = a * ct + v * st, dy = -a * st + v * ct;
    return { cx: fx - dx, cy: fy - dy, cz: fz, s: s, th: TH_ISO, ph: PH_ISO };
  }
  var camA = convCam(150, -60, 40, 930, 505, 1.5);
  var camB = convCam(725, -90, 60, 930, 440, 1.55);
  var camC = convCam(995, -150, 40, 880, 470, 2.2);   /* the entrance and its walkway */
  var camD = convCam(995, -200, 50, 860, 420, 3.6);   /* push in: the door large, the payoff */
  var camW = convCam(545, -110, 60, 850, 410, 0.82);

  function zoomLerp(c0, s0, c1, s1, u) {
    var s = s0 * Math.pow(s1 / s0, u), w;
    if (Math.abs(Math.log(s1 / s0)) < 0.25) w = u;
    else w = (1 / s - 1 / s0) / (1 / s1 - 1 / s0);
    return { c: [c0[0] + (c1[0] - c0[0]) * w, c0[1] + (c1[1] - c0[1]) * w], s: s };
  }
  function lerpCam(a, b, u) {
    var z = zoomLerp([a.cx, a.cy], a.s, [b.cx, b.cy], b.s, u);
    return { cx: z.c[0], cy: z.c[1], cz: lerp(a.cz, b.cz, u), s: z.s, th: TH_ISO, ph: PH_ISO };
  }

  /* ---- framing guard: keep the projected site inside a margin while the projection morphs */
  var SIL = [];
  [SX0, SX1].forEach(function (x) { [SY0, SY1].forEach(function (y) { SIL.push([x, y, 0], [x, y, -18]); }); });
  [[490, 790, -270, -70, 280], [880, 1110, -410, -200, 380]].forEach(function (b) {
    [b[0], b[1]].forEach(function (x) { [b[2], b[3]].forEach(function (y) { SIL.push([x, y, b[4]]); }); });
  });
  SIL.push([50, -30, 62 + 214]);
  function softOver(x) { return x > 0 ? x * x / (x + 40) : 0; }
  function fitFor(cam, m, w) {
    setCam({ cx: cam.cx, cy: cam.cy, cz: cam.cz, s: cam.s, th: cam.th, ph: cam.ph });
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < SIL.length; i++) {
      var p = Pq(SIL[i]);
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    var rw = (x1 - x0) / (1600 - 2 * m), rh = (y1 - y0) / (900 - 2 * m);
    var f = 1 / Math.pow(1 + Math.pow(rw, 16) + Math.pow(rh, 16), 1 / 16);
    var X0 = 800 + f * (x0 - 800), X1 = 800 + f * (x1 - 800), Y0 = 450 + f * (y0 - 450), Y1 = 450 + f * (y1 - 450);
    var ox = softOver(m - X0) - softOver(X1 - (1600 - m)), oy = softOver(m - Y0) - softOver(Y1 - (900 - m));
    return { f: lerp(1, f, w), ox: ox * w, oy: oy * w };
  }

  /* ---- hidden-line removal in screen space */
  function hull(pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var q = [], i;
    for (i = 0; i < p.length; i++) {
      var l = q[q.length - 1], a = p[i];
      if (!l || Math.abs(l[0] - a[0]) > 1e-3 || Math.abs(l[1] - a[1]) > 1e-3) q.push(a);
    }
    if (q.length < 3) return q;
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [];
    for (i = 0; i < q.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q[i]) <= 0) lo.pop(); lo.push(q[i]); }
    for (i = q.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q[i]) <= 0) up.pop(); up.push(q[i]); }
    lo.pop(); up.pop();
    return lo.concat(up);
  }
  function prep(poly) {
    var n = poly.length, area = 0, i, bb = [1e9, 1e9, -1e9, -1e9];
    for (i = 0; i < n; i++) {
      var a = poly[i], b = poly[(i + 1) % n];
      area += a[0] * b[1] - b[0] * a[1];
      if (a[0] < bb[0]) bb[0] = a[0]; if (a[1] < bb[1]) bb[1] = a[1];
      if (a[0] > bb[2]) bb[2] = a[0]; if (a[1] > bb[3]) bb[3] = a[1];
    }
    if (n < 3 || Math.abs(area) < 2) return null;
    var sg = area > 0 ? 1 : -1, E = [];
    for (i = 0; i < n; i++) {
      var a2 = poly[i], b2 = poly[(i + 1) % n], ex = b2[0] - a2[0], ey = b2[1] - a2[1], L = Math.hypot(ex, ey);
      if (L < 1e-9) continue;
      E.push([a2[0], a2[1], -ey * sg / L, ex * sg / L]);
    }
    return { E: E, bb: bb };
  }
  function inIv(p, q, o, eps) {
    var t0 = 0, t1 = 1, dx = q[0] - p[0], dy = q[1] - p[1], E = o.E;
    for (var i = 0; i < E.length; i++) {
      var e = E[i];
      var f0 = e[2] * (p[0] - e[0]) + e[3] * (p[1] - e[1]) - eps, fd = e[2] * dx + e[3] * dy;
      if (Math.abs(fd) < 1e-12) { if (f0 < 0) return null; continue; }
      var t = -f0 / fd;
      if (fd > 0) { if (t > t0) t0 = t; } else { if (t < t1) t1 = t; }
      if (t0 >= t1) return null;
    }
    return [t0, t1];
  }
  function subtract(iv, c) {
    var out = [];
    for (var i = 0; i < iv.length; i++) {
      var a = iv[i][0], b = iv[i][1];
      if (c[1] <= a || c[0] >= b) { out.push([a, b]); continue; }
      if (c[0] > a) out.push([a, c[0]]);
      if (c[1] < b) out.push([c[1], b]);
    }
    return out.filter(function (x) { return x[1] - x[0] > 1e-4; });
  }
  function distSeg(m, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    var u = L2 > 0 ? clamp(((m[0] - a[0]) * dx + (m[1] - a[1]) * dy) / L2, 0, 1) : 0;
    return Math.hypot(a[0] + dx * u - m[0], a[1] + dy * u - m[1]);
  }
  function distPoly(m, H) {
    var d = 1e9;
    for (var i = 0; i < H.length; i++) d = Math.min(d, distSeg(m, H[i], H[(i + 1) % H.length]));
    return d;
  }

  var ST, OC, LAY, TINTS;
  function scReset() { ST = []; OC = []; LAY = 0; TINTS = []; }
  function nxt() { LAY++; }
  function strokeW(W, style, closed, keep) { ST.push([LAY, W.map(Pq), !!closed, style, keep || null]); }
  function sstroke(S, style, closed) { ST.push([LAY, S, !!closed, style, null]); }
  function socc(S) { OC.push([LAY, hull(S)]); }
  function line(a, b, style) { strokeW([a, b], style); }
  function solid(W, style, inner) {
    var S = W.map(Pq), H = hull(S);
    sstroke(H, style, true);
    if (inner) for (var i = 0; i < inner.length; i++) {
      var a = Pq(inner[i][0]), b = Pq(inner[i][1]);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6) continue;
      if (H.length >= 3 && distPoly([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], H) < 0.8) continue;
      ST.push([LAY, [a, b], false, style, null]);
    }
    OC.push([LAY, H]);
  }
  function box(x0, y0, z0, dx, dy, dz, style) {
    var x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz, V = [];
    [x0, x1].forEach(function (x) { [y0, y1].forEach(function (y) { [z0, z1].forEach(function (z) { V.push([x, y, z]); }); }); });
    var n = [x1, y1, z1];
    solid(V, style, [[n, [x0, y1, z1]], [n, [x1, y0, z1]], [n, [x1, y1, z0]]]);
  }
  function rectY(x0, x1, y, z0, z1, style) { strokeW([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], style, true); }
  function rectX(x, y0, y1, z0, z1, style) { strokeW([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], style, true); }
  function octagon(c, r) { var o = []; for (var k = 0; k < 8; k++) o.push([c[0] + r * Math.cos(k * Math.PI / 4), c[1] + r * Math.sin(k * Math.PI / 4)]); return o; }

  function emit() {
    var out = [[], [], [], [], [], []], occs = [], i, j;
    for (i = 0; i < OC.length; i++) { var pr = prep(OC[i][1]); if (pr) { pr.L = OC[i][0]; occs.push(pr); } }
    for (i = 0; i < ST.length; i++) {
      var s = ST[i], lay = s[0], pts = s[1], closed = s[2], style = s[3], keep = s[4];
      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      for (j = 0; j < pts.length; j++) {
        var pp = pts[j];
        if (pp[0] < mnx) mnx = pp[0]; if (pp[0] > mxx) mxx = pp[0]; if (pp[1] < mny) mny = pp[1]; if (pp[1] > mxy) mxy = pp[1];
      }
      if (mxx - mnx < 0.4 && mxy - mny < 0.4) continue;
      if (mxx < -50 || mnx > 1650 || mxy < -50 || mny > 950) continue;
      var cand = [];
      for (j = 0; j < occs.length; j++) {
        var o = occs[j];
        if (o.L > lay && o.bb[0] < mxx + 1 && o.bb[2] > mnx - 1 && o.bb[1] < mxy + 1 && o.bb[3] > mny - 1) cand.push(o);
      }
      var n = pts.length, ns = closed ? n : n - 1, pieces = [], whole = true;
      for (j = 0; j < ns; j++) {
        var p = pts[j], q = pts[(j + 1) % n], iv = [[0, 1]];
        if (keep) { var kk = inIv(p, q, keep, 0); iv = kk ? [kk] : []; }
        var sx0 = Math.min(p[0], q[0]), sx1 = Math.max(p[0], q[0]), sy0 = Math.min(p[1], q[1]), sy1 = Math.max(p[1], q[1]);
        for (var k = 0; k < cand.length && iv.length; k++) {
          var oc = cand[k];
          if (oc.bb[0] > sx1 + 1 || oc.bb[2] < sx0 - 1 || oc.bb[1] > sy1 + 1 || oc.bb[3] < sy0 - 1) continue;
          var c = inIv(p, q, oc, 0.9);
          if (c) iv = subtract(iv, c);
        }
        pieces.push(iv);
        if (!(iv.length === 1 && iv[0][0] === 0 && iv[0][1] === 1)) whole = false;
      }
      var d = [];
      if (whole) {
        var str = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
        for (j = 1; j < n; j++) str += 'L' + f1(pts[j][0]) + ' ' + f1(pts[j][1]);
        if (closed) str += 'Z';
        d.push(str);
      } else {
        var pen = null;
        for (j = 0; j < ns; j++) {
          var a = pts[j], b = pts[(j + 1) % n], ivs = pieces[j];
          for (k = 0; k < ivs.length; k++) {
            var u0 = ivs[k][0], u1 = ivs[k][1];
            var A = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], B = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1];
            if (pen && u0 < 1e-6 && Math.hypot(pen[0] - A[0], pen[1] - A[1]) < 0.01) d.push('L' + f1(B[0]) + ' ' + f1(B[1]));
            else d.push('M' + f1(A[0]) + ' ' + f1(A[1]) + 'L' + f1(B[0]) + ' ' + f1(B[1]));
            pen = u1 > 1 - 1e-6 ? B : null;
          }
        }
      }
      if (d.length) out[style].push(d.join(''));
    }
    return out;
  }

  /* ---- the site, back to front */
  function ground() {
    var T = 18;
    strokeW([[SX0, SY0, 0], [SX1, SY0, 0], [SX1, SY1, 0], [SX0, SY1, 0]], SEC, true);
    strokeW([[SX1, SY0, 0], [SX1, SY0, -T], [SX1, SY1, -T], [SX0, SY1, -T], [SX0, SY1, 0]], SECV);
    line([SX1, SY1, 0], [SX1, SY1, -T], SECV);
    line([SX0, ROAD_Y0, 0], [SX1, ROAD_Y0, 0], INKL);
    line([SX0, ROAD_Y1, 0], [SX1, ROAD_Y1, 0], INKL);
    line([SX0 + 30, (ROAD_Y0 + ROAD_Y1) / 2, 0], [SX1 - 20, (ROAD_Y0 + ROAD_Y1) / 2, 0], SECD);
  }
  function car(x, y) {
    var L = 100, W = 52, H = 18, z = 0;
    box(x, y, z, W, L, H, SEC);
    var c = [[x + 5, y + 22], [x + W - 5, y + 22], [x + W - 5, y + 74], [x + 5, y + 74]];
    var t = [[x + 8, y + 34], [x + W - 8, y + 34], [x + W - 8, y + 62], [x + 8, y + 62]];
    nxt();
    var zb = z + H, zt = z + H + 16;
    var Bq = c.map(function (p) { return [p[0], p[1], zb]; }), Tq = t.map(function (p) { return [p[0], p[1], zt]; });
    solid(Bq.concat(Tq), SEC, [[Tq[2], Tq[1]], [Tq[2], Tq[3]], [Tq[2], Bq[2]]]);
    nxt();
  }
  /* the arriving car, at any heading psi (0 = driving towards -y, pi/2 = towards +x) */
  function nearIdx(Q) {
    var bi = 0, bd = -1e9;
    for (var i = 0; i < Q.length; i++) { var d = (Q[i][0] - PC.cx) * PC.st + (Q[i][1] - PC.cy) * PC.ct; if (d > bd) { bd = d; bi = i; } }
    return bi;
  }
  function carR(cx, cy, psi) {
    var F = [Math.sin(psi), -Math.cos(psi)], R = [Math.cos(psi), Math.sin(psi)];
    function w(u, v, z) { return [cx + u * R[0] - v * F[0], cy + u * R[1] - v * F[1], z]; }
    var Bt = [w(-26, -50, 0), w(26, -50, 0), w(26, 50, 0), w(-26, 50, 0)];
    var Tt = Bt.map(function (p) { return [p[0], p[1], 18]; }), k = nearIdx(Tt);
    solid(Bt.concat(Tt), SEC, [[Tt[k], Tt[(k + 1) % 4]], [Tt[k], Tt[(k + 3) % 4]], [Tt[k], Bt[k]]]);
    nxt();
    var Bq = [w(-21, -28, 18), w(21, -28, 18), w(21, 24, 18), w(-21, 24, 18)];
    var Tq = [w(-18, -16, 34), w(18, -16, 34), w(18, 12, 34), w(-18, 12, 34)], j = nearIdx(Tq);
    solid(Bq.concat(Tq), SEC, [[Tq[j], Tq[(j + 1) % 4]], [Tq[j], Tq[(j + 3) % 4]], [Tq[j], Bq[j]]]);
    nxt();
  }
  /* path: straight through the gate, a quarter turn to the left, then nose-in to a free bay on the
     lot's open left side (clear of the parked row and of every building on screen) */
  var CP0 = [(GAP[0] + GAP[1]) / 2, 32], CRAD = 60, CPARK = [60, -174], CY1 = CPARK[1] + CRAD;
  var CPL1 = CP0[1] - CY1, CPL2 = Math.PI * CRAD / 2, CPL3 = CP0[0] - CRAD - CPARK[0], CPLT = CPL1 + CPL2 + CPL3;
  function carPose(u) {
    var s = clamp(u, 0, 1) * CPLT;
    if (s <= CPL1) return [CP0[0], CP0[1] - s, 0];
    s -= CPL1;
    if (s <= CPL2) { var a = s / CRAD; return [CP0[0] - CRAD + CRAD * Math.cos(a), CY1 - CRAD * Math.sin(a), -a]; }
    s -= CPL2;
    return [CP0[0] - CRAD - s, CPARK[1], -Math.PI / 2];
  }
  function siteAGround() {
    strokeW([[GAP[1], PL, 0], [A_X1, PL, 0], [A_X1, A_Y0, 0], [A_X0, A_Y0, 0], [A_X0, PL, 0], [H_X0, PL, 0]], SEC);
    [GAP[0] + 4, GAP[1] - 4].forEach(function (x) { line([x, ROAD_Y0, 0], [x, PL, 0], SEC); line([x, PL, 0], [x, PL - 120, 0], SEC); });
    for (var i = 0; i < 7; i++) { var x = A_X0 + 24 + i * 62; line([x, A_Y0, 0], [x, A_Y0 + 110, 0], SEC); }
    [-205, -143].forEach(function (y) { line([A_X0, y, 0], [A_X0 + 110, y, 0], SEC); });
    nxt();
    box(GAP[1], PL - 8, 0, A_X1 - GAP[1], 8, 8, SEC);
    nxt();
  }
  function barrier(ang) {
    box(GAP[1] - 14, PL - 5, 0, 10, 10, 52, PRIM); nxt();
    box(H_X0, PL - 20, 0, H_X1 - H_X0, 40, 84, PRIM); nxt();
    var hw = 8, a = ang * Math.PI / 180, d = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)];
    function ap(t, o) { return [PIV[0] + d[0] * t + n[0] * o, PIV[1], PIV[2] + d[1] * t + n[1] * o]; }
    solid([ap(-6, -hw), ap(ARM_L, -hw), ap(ARM_L, hw), ap(-6, hw)], PRIM);
    for (var t = 30; t < ARM_L - 10; t += 34) { line(ap(t, -hw), ap(t, hw), SEC); line(ap(t + 14, -hw), ap(t + 14, hw), SEC); }
    nxt();
  }
  function shop(frac) {
    var X0 = B_X0, X1 = B_X1, Y0 = B_Y0, Yf = B_Yf, H = B_H;
    box(X0, Y0, 0, X1 - X0, Yf - Y0, H, SEC);
    strokeW([[X0, Yf, GF], [X1, Yf, GF], [X1, Y0, GF]], SECV);
    strokeW([[X0 + 14, Y0 + 14, H], [X1 - 14, Y0 + 14, H], [X1 - 14, Yf - 14, H], [X0 + 14, Yf - 14, H]], SEC, true);
    [180, 228].forEach(function (z) { rectY(X0 + 30, X1 - 30, Yf, z, z + 26, SECV); rectX(X1, Y0 + 30, Yf - 30, z, z + 26, SECV); });
    var zb = SH_Z * clamp(frac, 0, 1);
    if (zb > 2) {
      var opening = [P(SH_X0, Yf, 0), P(SH_X1, Yf, 0), P(SH_X1, Yf, zb), P(SH_X0, Yf, zb)];
      var band = prep(hull(opening));
      if (band) {
        TINTS.push(opening);
        strokeW([[SH_X0, Yf - DEP, 0], [SH_X1, Yf - DEP, 0]], SECV, false, band);
        strokeW([[SH_X0, Yf, 0], [SH_X0, Yf - DEP, 0], [SH_X0, Yf - DEP, SH_Z]], SECV, false, band);
        for (var k = 0; k < 3; k++) {
          var x = SH_X0 + 40 + k * 64;
          strokeW([[x, Yf - DEP + 6, 0], [x, Yf - DEP + 6, 52], [x + 40, Yf - DEP + 6, 52], [x + 40, Yf - DEP + 6, 0]], SECV, false, band);
        }
      }
    }
    nxt();
    strokeW([[SH_X0, Yf, 0], [SH_X0, Yf, SH_Z], [SH_X1, Yf, SH_Z], [SH_X1, Yf, 0]], PRIM);
    if (zb < SH_Z - 4) {
      rectY(SH_X0 + 6, SH_X1 - 6, Yf + 2, zb, SH_Z, PRIM);
      for (var z = zb + 12; z < SH_Z - 4; z += 12) line([SH_X0 + 6, Yf + 2, z], [SH_X1 - 6, Yf + 2, z], SECV);
    }
    nxt();
    box(SH_X0 - 8, Yf, SH_Z, SH_X1 - SH_X0 + 16, 16, 20, PRIM);
    nxt();
  }
  function tower() {
    var X0 = C_X0, X1 = C_X1, Y0 = C_Y0, Yf = C_Yf, H = C_H;
    box(X0, Y0, 0, X1 - X0, Yf - Y0, H, SEC);
    strokeW([[X0 + 14, Y0 + 14, H], [X1 - 14, Y0 + 14, H], [X1 - 14, Yf - 14, H], [X0 + 14, Yf - 14, H]], SEC, true);
    [160, 220, 280, 340].forEach(function (z) { rectY(X0 + 28, X1 - 28, Yf, z - 2, z + 22, SECV); rectX(X1, Y0 + 28, Yf - 28, z - 2, z + 22, SECV); });
    nxt();
    /* forecourt: a low curb along the sidewalk, open at the walkway that leads to the door */
    line([CURB[0], PL, 0], [D_X0 - 10, PL, 0], SEC); line([WALKR, PL, 0], [CURB[1], PL, 0], SEC);
    line([D_X0 - 10, PL, 0], [D_X0 - 10, Yf, 0], SEC); line([WALKR, PL, 0], [WALKR, Yf, 0], SEC);
    nxt();
  }
  /* convex polygon a clipped to convex polygon c (screen space) */
  function clipConvex(a, c) {
    var n = c.length, ar = 0, i, j;
    for (i = 0; i < n; i++) ar += c[i][0] * c[(i + 1) % n][1] - c[(i + 1) % n][0] * c[i][1];
    var sg = ar > 0 ? 1 : -1, out = a;
    for (i = 0; i < n && out.length; i++) {
      var e0 = c[i], e1 = c[(i + 1) % n], inp = out, sd = [];
      out = [];
      for (j = 0; j < inp.length; j++) sd.push(sg * ((e1[0] - e0[0]) * (inp[j][1] - e0[1]) - (e1[1] - e0[1]) * (inp[j][0] - e0[0])));
      for (j = 0; j < inp.length; j++) {
        var k = (j + 1) % inp.length, p = inp[j], q = inp[k];
        if (sd[j] >= 0) out.push(p);
        if ((sd[j] >= 0) !== (sd[k] >= 0)) { var u = sd[j] / (sd[j] - sd[k]); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); }
      }
    }
    return out;
  }
  /* one glass door leaf, hinged at x = hx in the recess plane; sg = +1 left leaf, -1 right leaf; it swings in */
  function doorLeaf(hx, sg, ang, keep, apH) {
    var a = ang * Math.PI / 180, dx = sg * Math.cos(a), dy = -Math.sin(a);
    function q(t, z) { return [hx + dx * t, D_YR + dy * t, z]; }
    var W = LW, O = [q(0, 1), q(W, 1), q(W, DH - 1), q(0, DH - 1)];
    strokeW(O, PRIM, true, keep);
    strokeW([q(7, 11), q(W - 7, 11), q(W - 7, DH - 11), q(7, DH - 11)], SEC, true, keep);
    strokeW([q(W - 14, 50), q(W - 14, 66)], PRIM, false, keep);
    var oc = clipConvex(hull(O.map(Pq)), apH);
    if (oc.length >= 3) socc(oc);
    nxt();
  }
  /* the active (left) leaf, hinged at the back of the reveal; it swings out towards the street. The part of
     the leaf still behind the facade plane is seen only through the opening (keep), the part in front of it
     is seen whole and hides what lies behind it */
  function activeLeaf(ang, ap, apH) {
    var a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
    var t0 = dy > 1e-3 ? Math.min(LW, RD / dy) : LW, LH = DH - 1;
    function q(t, z) { return [D_X0 + dx * t, D_YR + dy * t, z]; }
    function sg(t1, z1, t2, z2, style) {
      var lo = Math.min(t1, t2), hi = Math.max(t1, t2);
      if (hi <= t0 + 1e-6) { if (ap) strokeW([q(t1, z1), q(t2, z2)], style, false, ap); return; }
      if (lo >= t0 - 1e-6) { strokeW([q(t1, z1), q(t2, z2)], style); return; }
      var u = (t0 - t1) / (t2 - t1), zm = z1 + (z2 - z1) * u;
      var A = q(t1, z1), M = q(t0, zm), B = q(t2, z2);
      if (t1 < t0) { if (ap) strokeW([A, M], style, false, ap); strokeW([M, B], style); }
      else { strokeW([A, M], style); if (ap) strokeW([M, B], style, false, ap); }
    }
    function rq(ta, tb, za, zb, style) { sg(ta, za, tb, za, style); sg(tb, za, tb, zb, style); sg(tb, zb, ta, zb, style); sg(ta, zb, ta, za, style); }
    rq(0, LW, 1, LH, PRIM);
    rq(7, LW - 7, 11, LH - 10, SEC);
    sg(LW - 12, 50, LW - 12, 66, PRIM);
    if (t0 < LW) socc(hull([q(t0, 1), q(LW, 1), q(LW, LH), q(t0, LH)].map(Pq)));
    if (ap) { var oc = clipConvex(hull([q(0, 1), q(t0, 1), q(t0, LH), q(0, LH)].map(Pq)), apH); if (oc.length >= 3) socc(oc); }
    nxt();
  }
  var DOOR_TINT = null;
  function entrance(stt, pop, mp) {
    var w = stt.walk, inside = w[1] < C_Yf - 4;
    var apH = hull([P(D_X0, C_Yf, 0), P(D_X1, C_Yf, 0), P(D_X1, C_Yf, DH), P(D_X0, C_Yf, DH)]), ap = prep(apH);
    DOOR_TINT = null;
    if (ap) {
      /* what shows through the opening: the left reveal, the sill, the lobby floor running back to its far
         corner, the fixed right leaf and a resident who has gone in */
      DOOR_TINT = { q: apH, holes: [] };
      strokeW([[D_X0, C_Yf, 0], [D_X0, D_YR, 0], [D_X1, D_YR, 0]], SEC, false, ap);
      strokeW([[D_X0, C_Yf, DH], [D_X0, D_YR, DH], [D_X0, D_YR, 0]], SEC, false, ap);
      strokeW([[LOB[0], D_YR, 0], [LOB[0], LOB[1], 0], [D_X1 + 120, LOB[1], 0]], SEC, false, ap);
      nxt();
      if (inside) { person(w[0], w[1], pop, ap, apH); nxt(); }
      doorLeaf(D_X1, -1, 0, ap, apH);
    }
    activeLeaf(stt.door, ap, apH);
    /* plan notation: as the camera rises overhead the open leaf draws its swing back to the threshold */
    var ka = sm((mp - 0.55) / 0.4), a0 = Math.asin(RD / LW) * 180 / Math.PI;
    if (ka > 0.01 && stt.door > a0 + 4) {
      var arc = [], a1 = stt.door - (stt.door - a0) * ka;
      for (var ai = 0; ai <= 16; ai++) {
        var aa = lerp(stt.door, a1, ai / 16) * Math.PI / 180;
        arc.push([D_X0 + LW * Math.cos(aa), D_YR + LW * Math.sin(aa), 0]);
      }
      strokeW(arc, SEC);
      nxt();
    }
    /* the frame at the facade and the canopy (it folds into the facade on the way to the plan, so
       the plan shows the threshold and the open leaf, not a roof over them) */
    strokeW([[D_X0, C_Yf, 0], [D_X0, C_Yf, DH], [D_X1, C_Yf, DH], [D_X1, C_Yf, 0]], PRIM);
    nxt();
    var cd = CAN[3] * (1 - sm(mp / 0.8));
    if (cd > 0.6) { box(CAN[0], C_Yf, CAN[2], CAN[1] - CAN[0], cd, 8, SEC); nxt(); }
    if (!inside) { person(w[0], w[1], pop); nxt(); }
    else PERSON_OP = ap ? pop : 0;
  }

  /* status-light anchors: iso (above the device) -> plan (beside it, on the sidewalk) */
  var L_ISO = [[H_X0 + 2, PL + 22, 84 + 30], [SH_X1 + 15, B_Yf, SH_Z - 30], [DLX, C_Yf, DLZ]];
  var L_PLAN = [[-22, 4, 0], [640, 6, 0], [DLX, 6, 0]];
  var LPOS = [[0, 0], [0, 0], [0, 0]];
  function lightAt(i, mp, occR) {
    var a = L_ISO[i], b = L_PLAN[i], u = sm(mp), ux = u, uz = u;
    /* the barrier light first steps clear of the housing, then descends beside it */
    if (i === 0) { ux = sm(mp / 0.5); uz = sm((mp - 0.3) / 0.7); }
    var uy = uz;
    /* the door light steps out from the facade first, then settles */
    if (i === 2) { uy = sm(mp / 0.55); uz = sm((mp - 0.25) / 0.75); }
    var p = P(lerp(a[0], b[0], ux), lerp(a[1], b[1], uy), lerp(a[2], b[2], uz));
    LPOS[i] = p;
    socc(octagon(p, occR));
  }
  var PERS = 5, PERSON_OP = 0, PERSON_AT = [0, 0, 1];
  function capsule(x, top, bot, r) {
    var pts = [], k;
    for (k = 0; k <= 10; k++) { var a = Math.PI + Math.PI * k / 10; pts.push([x + r * Math.cos(a), top + r + r * Math.sin(a)]); }
    for (k = 0; k <= 10; k++) { var b = Math.PI * k / 10; pts.push([x + r * Math.cos(b), bot - r + r * Math.sin(b)]); }
    return pts;
  }
  function circlePts(c, r, n) { var o = []; for (var k = 0; k < n; k++) o.push([c[0] + r * Math.cos(2 * Math.PI * k / n), c[1] + r * Math.sin(2 * Math.PI * k / n)]); return o; }
  function person(X, Y, op, keep, apH) {
    /* resident drawn as hidden-line strokes; once through the door it is seen only through the opening
       (keep), so the jamb and the lintel hide it as it walks on into the lobby */
    PERSON_OP = op;
    if (op <= 0.01) return;
    var p = P(X, Y, 0), s = PC.ks / K;
    PERSON_AT = [p[0], p[1], s];
    var w = 18 * s, h = 40 * s, r = 8.5 * s, x = p[0], y = p[1], hy = y - h - r - 5 * s;
    var body = capsule(x, y - h, y, w / 2), head = circlePts([x, hy], r, 20);
    ST.push([LAY, body, true, PERS, keep || null]);
    ST.push([LAY, head, true, PERS, keep || null]);
    /* the figure hides what is behind it; as it fades its occluder shrinks with it, so lines close in smoothly */
    var ko = sm(op / 0.6);
    if (ko > 0.02) {
      var cyM = (y + hy) / 2;
      var ob = capsule(x, y - h - 5, y + 5, w / 2 + 5).map(function (q) { return [x + (q[0] - x) * ko, cyM + (q[1] - cyM) * ko]; });
      var oh = octagon([x, cyM + (hy - cyM) * ko], (r + 5) * ko);
      if (apH) { ob = clipConvex(hull(ob), apH); oh = clipConvex(oh, apH); }
      if (ob.length >= 3) socc(ob);
      if (oh.length >= 3) socc(oh);
    }
    /* standing in front of the open door: keep the lobby tint off the figure */
    if (!keep && DOOR_TINT) {
      var hb = clipConvex(hull(body), DOOR_TINT.q), hh = clipConvex(head, DOOR_TINT.q);
      if (hb.length >= 3) DOOR_TINT.holes.push(hb);
      if (hh.length >= 3) DOOR_TINT.holes.push(hh);
    }
  }
  /* Auto Open: one unbroken walk - along the sidewalk, round the corner into the walkway, then a long bend to
     the active leaf's opening and straight on into the lobby; the resident never stops on the way. The
     last leg runs up the screen, so the resident stays clear of the leaf that swings out beside the opening */
  var WALK = (function () {
    var o = [[1200, 6], [1104, 6]];
    function bend(c, b) { var a = o[o.length - 1]; for (var k = 1; k <= 14; k++) o.push(qpt(a, c, b, k / 14)); }
    bend([1062, 6], [1058, -50]);
    bend([1050, -122], [1016, -160]);
    o.push([938, -250]);
    return o;
  })();
  var WALK_CUM = cumOf(WALK), WALK_LEN = WALK_CUM[WALK_CUM.length - 1];
  /* the distance along the walk at which the resident crosses the facade */
  var WALK_DOOR = (function () {
    for (var i = 1; i < WALK.length; i++) if (WALK[i][1] < C_Yf) return lerp(WALK_CUM[i - 1], WALK_CUM[i], (C_Yf - WALK[i - 1][1]) / (WALK[i][1] - WALK[i - 1][1]));
    return WALK_LEN;
  })();
  /* a short step off from standing, then an even pace all the way in */
  function walkDist(u) { var a = 0.12; return (u < a ? u * u / (2 * a) : u - a / 2) / (1 - a / 2) * WALK_LEN; }

  var LS = 1, PIN_OCC = 0;
  function buildM2(stt, mp) {
    scReset();
    var occR = lerp(18, 8.5, sm(mp)) * LS;
    ground(); siteAGround(); nxt();
    car(A_X0 + 29, A_Y0 + 6); car(A_X0 + 153, A_Y0 + 6);
    barrier(stt.arm); lightAt(0, mp, occR);
    carR(stt.car[0], stt.car[1], stt.car[2]);
    shop(stt.shut); lightAt(1, mp, occR);
    nxt(); tower();
    entrance(stt, (1 - sm(mp / 0.3)) * stt.wop, mp);
    lightAt(2, mp, occR);
    if (PIN_OCC > 0.01) { nxt(); socc(octagon(P(345, -185, 0), 19 * PIN_OCC * LS)); }
    return emit();
  }

  /* ---- DOM for M2 */
  var gM2 = shellM2;
  var tintPath = el('path', { fill: BLUE, 'fill-opacity': r3(0.06 * TINT), stroke: 'none', d: '' }, gM2);
  var doorTint = el('path', { fill: BLUE, 'fill-opacity': 0, 'fill-rule': 'evenodd', stroke: 'none', d: '' }, gM2);
  var m2Paths = [
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.3, 'stroke-width': 1.5, d: '' }, gM2),
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'stroke-dasharray': '16 14', d: '' }, gM2),
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: '' }, gM2),
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: '' }, gM2),
    el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: '' }, gM2),
    el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: '' }, gM2)
  ];

  function mkLight(parent) {
    var g = el('g', {}, parent);
    return {
      g: g,
      ping: el('circle', { r: 12, fill: 'none', stroke: BLUE, 'stroke-width': 1.5, opacity: 0 }, g),
      ring: el('circle', { r: 7, fill: 'none', stroke: BLUE, 'stroke-width': 1.5 }, g),
      dot: el('circle', { r: 0, fill: BLUE }, g)
    };
  }
  function setLight(L, x, y, ringR, ringOp, dotR, op, pk, pr0, dotOp) {
    if (op <= 0.003) { sa(L.g, 'display', 'none'); return; }
    sa(L.g, 'display', 'inline');
    sa(L.g, 'opacity', f2(op));
    var xs = f1(x), ys = f1(y);
    sa(L.ring, 'cx', xs); sa(L.ring, 'cy', ys); sa(L.ring, 'r', f2(Math.max(0, ringR))); sa(L.ring, 'opacity', f2(ringOp));
    sa(L.dot, 'cx', xs); sa(L.dot, 'cy', ys); sa(L.dot, 'r', f2(Math.max(0, dotR))); sa(L.dot, 'opacity', dotOp === undefined ? '1' : f2(dotOp));
    if (pk >= 0) {
      var r0 = pr0 || ringR;
      sa(L.ping, 'cx', xs); sa(L.ping, 'cy', ys); sa(L.ping, 'r', f2(r0 + 22 * eOut(pk))); sa(L.ping, 'opacity', f2(0.6 * (1 - pk) * (1 - pk)));
    } else sa(L.ping, 'opacity', '0');
  }
  var dLights = [mkLight(gM2), mkLight(gM2), mkLight(gM2)];
  /* Auto Open: the phone in the resident's pocket and its Wi-Fi mark, over the site lines (screen space).
     The mark is created when it first shows, so the static start and still frames keep their markup */
  var gWifi = null, wifiPhone, wifiArcs;
  var WIFI_PULSES = 3, WIFI_HALF = 32 * Math.PI / 180;
  function setWifi(t) {
    var u = seg(t, TL.WF), op = (u > 0 && u < 1) ? Math.min(1, u / 0.08, (1 - u) / 0.1) * PERSON_OP : 0;
    if (op <= 0.003) { if (gWifi) sa(gWifi, 'display', 'none'); return; }
    if (!gWifi) {
      gWifi = el('g', {}, gM2);
      wifiPhone = el('rect', { fill: BLUE, stroke: 'none' }, gWifi);
      wifiArcs = [0, 1, 2].map(function () { return el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: '' }, gWifi); });
    }
    sa(gWifi, 'display', 'inline'); sa(gWifi, 'opacity', f2(op));
    /* the phone sits at the hip, on the side of the door; the mark opens towards the entrance light, held
       low enough for its arcs to clear the resident's own outline */
    var s = PERSON_AT[2], cx = PERSON_AT[0] + 4.5 * s, cy = PERSON_AT[1] - 17 * s;
    sa(wifiPhone, 'x', f1(cx - 2.6 * s)); sa(wifiPhone, 'y', f1(cy - 4.6 * s));
    sa(wifiPhone, 'width', f1(5.2 * s)); sa(wifiPhone, 'height', f1(9.2 * s)); sa(wifiPhone, 'rx', f1(1.3 * s));
    var aim = clamp(Math.atan2(LPOS[2][1] - cy, LPOS[2][0] - cx), -0.62, 0.2), ph = (u * WIFI_PULSES) % 1;
    for (var i = 0; i < 3; i++) {
      /* each pulse lights the arcs outwards, one after the other, then lets them all go */
      var k = sm((ph - 0.14 * i) / 0.14) * (1 - sm((ph - 0.7) / 0.26)), r = (13 + 8.5 * i) * s;
      sa(wifiArcs[i], 'opacity', f2(k));
      sa(wifiArcs[i], 'd', 'M' + f1(cx + r * Math.cos(aim - WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim - WIFI_HALF)) +
        'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r * Math.cos(aim + WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim + WIFI_HALF)));
    }
  }

  /* ================================================================ panel (screen space, no text) */
  var PX = 96, PY = 548, PW = 300, PH = 264, PCX = PX + PW / 2, PCY = PY + PH / 2;
  var gPanel = shellPanel;
  var gPanelIn = el('g', {}, gPanel);
  el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 22, fill: 'none', stroke: BLUE, 'stroke-width': 3 }, gPanelIn);
  el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: 'M' + (PX + 30) + ' ' + (PY + 38) + 'H' + (PX + 72) }, gPanelIn);
  el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: 'M' + (PX + 20) + ' ' + (PY + 66) + 'H' + (PX + PW - 20) }, gPanelIn);
  var LENS = [[138, 84], [112, 96], [150, 70]];
  var rows = [];
  for (var ri = 0; ri < 3; ri++) {
    var cy = PY + 66 + 60 * ri + 34, lx = PX + 86;
    if (ri) el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: 'M' + (PX + 30) + ' ' + (cy - 30) + 'H' + (PX + PW - 30) }, gPanelIn);
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: 'M' + lx + ' ' + (cy - 7) + 'H' + (lx + LENS[ri][0]) }, gPanelIn);
    var over = el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, 'stroke-linecap': 'butt', d: 'M' + lx + ' ' + (cy - 7) + 'H' + (lx + LENS[ri][0]), 'stroke-dasharray': LENS[ri][0] + ' ' + (LENS[ri][0] + 10), 'stroke-dashoffset': LENS[ri][0] }, gPanelIn);
    el('path', { fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, d: 'M' + lx + ' ' + (cy + 9) + 'H' + (lx + LENS[ri][1]) }, gPanelIn);
    var lt = mkLight(gPanelIn);
    rows.push({ cx: PX + 46, cy: cy, over: over, len: LENS[ri][0], light: lt });
  }
  var pmr = shellPmr;

  /* ================================================================ M3: the letter and the city (port of m3-work/gen2.py) */
  var MW = 610, CAP = 800;
  var M_PTS = [[0, 800], [0, 0], [150, 0], [305, 600], [460, 0], [610, 0], [610, 800], [490, 800], [490, 277], [355, 800], [255, 800], [120, 277], [120, 800]];
  var SLOPE = 600 / 155;
  var GG = 60, BB = 226.67, PITCH = GG + BB;
  var KEYF = { s: 0.66, ox: 800 - MW * 0.33, oy: 176 };
  function kT(p) { return [KEYF.ox + KEYF.s * p[0], KEYF.oy + KEYF.s * p[1]]; }
  function kInv(p) { return [(p[0] - KEYF.ox) / KEYF.s, (p[1] - KEYF.oy) / KEYF.s]; }
  var KEY3 = { c: [(800 - KEYF.ox) / KEYF.s, (450 - KEYF.oy) / KEYF.s], S: KEYF.s };
  /* the M2 site becomes the double block right of the letter */
  var SB = [MW + GG, 0, MW + GG + 2 * BB + GG, BB];
  var MSC = BB / (SY1 - SY0);
  var SB0 = [SB[0] + ((SB[2] - SB[0]) - (SX1 - SX0) * MSC) / 2, SB[1]];
  function siteToLocal(X, Y) { return [SB0[0] + (X - SX0) * MSC, SB0[1] + (Y - SY0) * MSC]; }
  /* small M on the globe */
  var S_F = 72 / CAP, O_F = [800 - 305 * S_F, 470 - 400 * S_F];
  var GF3 = { c: [(800 - O_F[0]) / S_F, (450 - O_F[1]) / S_F], S: S_F };

  function P2(pts, close) {
    var s = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
    for (var i = 1; i < pts.length; i++) s += 'L' + f1(pts[i][0]) + ' ' + f1(pts[i][1]);
    return s + (close ? 'Z' : '');
  }
  function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function rrectD(x0, y0, x1, y1, r) {
    return 'M' + f1(x0 + r) + ' ' + f1(y0) + 'H' + f1(x1 - r) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x1) + ' ' + f1(y0 + r) +
      'V' + f1(y1 - r) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x1 - r) + ' ' + f1(y1) + 'H' + f1(x0 + r) +
      'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x0) + ' ' + f1(y1 - r) + 'V' + f1(y0 + r) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x0 + r) + ' ' + f1(y0) + 'Z';
  }
  function inset(poly, m) {
    var n = poly.length, a = 0, i;
    for (i = 0; i < n; i++) a += poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1];
    var sgn = a > 0 ? 1 : -1, lines = [];
    for (i = 0; i < n; i++) {
      var p1 = poly[i], p2 = poly[(i + 1) % n], dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy);
      var nx = -dy / L * sgn, ny = dx / L * sgn;
      lines.push([[p1[0] + nx * m, p1[1] + ny * m], [dx, dy]]);
    }
    var out = [];
    for (i = 0; i < n; i++) {
      var l1 = lines[(i - 1 + n) % n], l2 = lines[i], d1 = l1[1], d2 = l2[1], q1 = l1[0], q2 = l2[0];
      var den = d1[0] * d2[1] - d1[1] * d2[0];
      var t = ((q2[0] - q1[0]) * d2[1] - (q2[1] - q1[1]) * d2[0]) / den;
      out.push([q1[0] + d1[0] * t, q1[1] + d1[1] * t]);
    }
    return out;
  }
  var VE = 'non-scaling-stroke';
  function ctxPath(d, parent, extra) {
    var a = { d: d, fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'vector-effect': VE, 'stroke-linejoin': 'miter', 'stroke-miterlimit': 12, 'stroke-linecap': 'butt' };
    for (var k in extra || {}) a[k] = extra[k];
    return el('path', a, parent);
  }
  function ctxRing(c, r, parent) {
    return el('circle', { cx: f1(c[0]), cy: f1(c[1]), r: f1(r), fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'vector-effect': VE }, parent);
  }

  var gM3 = shellM3;
  var gCity = el('g', {}, gM3);
  var KINDS = ['bld', 'park', 'two', 'lot', 'court', 'bld', 'lot', 'trees', 'two', 'court', 'bld', 'lot'];
  var KIND_MAP = { '-1,-1': 'park', '0,-1': 'lot', '0.5,-1': 'bld', '1,-1': 'two', '-2,0': 'bld', '-1,0': 'two', '1,0': 'bld', '2,0': 'lot', '3,0': 'two',
    '-3,1': 'two', '-2,1': 'lot', '-1,1': 'court', '1,1': 'trees', '2,1': 'bld', '3,1': 'two', '-3,2': 'bld', '-2,2': 'bld', '-1,2': 'lot', '1,2': 'court', '2,2': 'lot',
    '-2,3': 'park', '-1,3': 'two', '0,3': 'park', '0.5,3': 'lot', '1,3': 'two' };
  function kindFor(col, row) {
    var k = col + ',' + row;
    if (KIND_MAP[k]) return KIND_MAP[k];
    var i = Math.round(col * 2) * 5 + row * 7;
    return KINDS[((i % 12) + 12) % 12];
  }
  function cellRect(col, row) {
    var y0 = row * PITCH, y1 = y0 + BB, half = (MW - GG) / 2;
    if (col === 0) return [0, y0, half, y1];
    if (col === 0.5) return [half + GG, y0, MW, y1];
    if (col > 0) { var x0 = MW + GG + (col - 1) * PITCH; return [x0, y0, x0 + BB, y1]; }
    var x1 = -GG - (-col - 1) * PITCH; return [x1 - BB, y0, x1, y1];
  }
  var CELLS = [[-2, 0], [-1, 0], [3, 0], [-3, 1], [-2, 1], [-1, 1], [1, 1], [2, 1], [3, 1], [-3, 2], [-2, 2], [-1, 2], [1, 2], [2, 2], [-1, 3], [0, 3], [0.5, 3]];
  var SITES = { '-2,0': 1, '-3,2': 1, '3,1': 1 };

  function blockContent(x0, y0, x1, y1, kind, g) {
    var w = x1 - x0, h = y1 - y0, pad = 22, d = [], k;
    if (kind === 'bld' || kind === 'court' || kind === 'site') {
      var bx0, by0, bx1, by1;
      if (kind === 'site') { bx0 = x0 + pad; by0 = y0 + h * 0.5; bx1 = x1 - pad; by1 = y1 - pad; }
      else { bx0 = x0 + pad; by0 = y0 + pad; bx1 = x1 - pad; by1 = y1 - pad; }
      if (kind === 'court') {
        d.push(P2([[bx0, by0], [bx1, by0], [bx1, by0 + 70], [bx0 + 70, by0 + 70], [bx0 + 70, by1], [bx0, by1]], true));
      } else {
        d.push(P2(rect(bx0, by0, bx1, by1), true));
        d.push(P2(rect(bx0 + 12, by0 + 12, bx1 - 12, by1 - 12), true));
        if (kind === 'bld' && w > 150) {
          var ux0 = bx1 - 26 - 54, uy0 = by0 + 26;
          d.push(P2(rect(ux0, uy0, ux0 + 54, uy0 + 40), true));
          ctxRing([ux0 + 27, uy0 + 20], 13, g);
          var gx0 = bx0 + 26, gy0 = by1 - 26 - 40;
          d.push(P2(rect(gx0, gy0, gx0 + 74, gy0 + 40), true));
          for (k = 1; k < 6; k++) d.push('M' + f1(gx0 + 74 * k / 6) + ' ' + f1(gy0 + 6) + 'V' + f1(gy0 + 34));
        }
      }
    } else if (kind === 'two') {
      if (w >= h) { var mid = (x0 + x1) / 2; d.push(P2(rect(x0 + pad, y0 + pad, mid - 10, y1 - pad), true)); d.push(P2(rect(mid + 10, y0 + pad, x1 - pad, y1 - pad), true)); }
      else { var mv = (y0 + y1) / 2; d.push(P2(rect(x0 + pad, y0 + pad, x1 - pad, mv - 10), true)); d.push(P2(rect(x0 + pad, mv + 10, x1 - pad, y1 - pad), true)); }
    } else if (kind === 'lot') {
      [[y0 + 30, y0 + 92], [y0 + 134, y0 + 196]].forEach(function (yy) {
        var ya = yy[0], yb = yy[1];
        if (yb > y1 - 10) return;
        var n = Math.floor((w - 2 * pad) / 28), xs = [];
        for (var i = 0; i <= n; i++) xs.push(x0 + (w - n * 28) / 2 + i * 28);
        xs.forEach(function (xx) { d.push('M' + f1(xx) + ' ' + f1(ya) + 'V' + f1(yb)); });
        var ly = ya < y0 + 100 ? yb : ya;
        d.push(P2([[xs[0], ly], [xs[xs.length - 1], ly]]));
      });
      var n2 = Math.floor((w - 2 * pad) / 28), xs0 = x0 + (w - n2 * 28) / 2;
      d.push(rrectD(xs0 + 2 * 28 + 5, y0 + 38, xs0 + 3 * 28 - 5, y0 + 86, 4.5));
    } else if (kind === 'park' || kind === 'trees') {
      var pts = kind === 'park' ? [[0.3, 0.32, 0.15], [0.68, 0.4, 0.12], [0.42, 0.72, 0.13]] : [[0.28, 0.3, 0.11], [0.62, 0.26, 0.11], [0.34, 0.66, 0.11], [0.7, 0.66, 0.11]];
      pts.forEach(function (q) { ctxRing([x0 + w * q[0], y0 + h * q[1]], q[2] * w, g); });
    }
    if (d.length) ctxPath(d.join(''), g);
  }

  /* streets: centre dashes in the gutters, merged so that nothing is drawn twice */
  var hSegs = {}, vSegs = {};
  function addSeg(map, key, a, b) { (map[key] = map[key] || []).push([a, b]); }
  function blockStreets(r) {
    var h = GG / 2;
    addSeg(hSegs, f1(r[1] - h), r[0], r[2]); addSeg(hSegs, f1(r[3] + h), r[0], r[2]);
    addSeg(vSegs, f1(r[0] - h), r[1], r[3]); addSeg(vSegs, f1(r[2] + h), r[1], r[3]);
  }
  var blocks = [];
  var sbCenter = [(SB[0] + SB[2]) / 2, (SB[1] + SB[3]) / 2];
  CELLS.forEach(function (cr) {
    var r = cellRect(cr[0], cr[1]), key = cr[0] + ',' + cr[1], g = el('g', { opacity: 0 }, gCity);
    if (SITES[key]) { el('path', { d: P2(rect(r[0], r[1], r[2], r[3]), true), fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'vector-effect': VE, 'stroke-linejoin': 'miter' }, g); blockContent(r[0], r[1], r[2], r[3], 'site', g); }
    else { ctxPath(P2(rect(r[0], r[1], r[2], r[3]), true), g); blockContent(r[0], r[1], r[2], r[3], kindFor(cr[0], cr[1]), g); }
    blockStreets(r);
    var cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
    /* blocks gather around the letter symmetrically, so the M emerges as the space between them */
    blocks.push({ g: g, r: r, key: key, dist: Math.hypot(cx - MW / 2, cy - CAP / 2) });
  });
  blockStreets(SB);
  var minDist = 1e9, maxDist = 0; blocks.forEach(function (b) { maxDist = Math.max(maxDist, b.dist); minDist = Math.min(minDist, b.dist); });
  function mergeIv(list) {
    list.sort(function (a, b) { return a[0] - b[0]; });
    var out = [];
    list.forEach(function (s) { var l = out[out.length - 1]; if (l && s[0] <= l[1] + 0.01) l[1] = Math.max(l[1], s[1]); else out.push([s[0], s[1]]); });
    return out;
  }
  var stD = [];
  Object.keys(hSegs).forEach(function (y) { mergeIv(hSegs[y]).forEach(function (s) { stD.push('M' + f1(s[0]) + ' ' + y + 'H' + f1(s[1])); }); });
  Object.keys(vSegs).forEach(function (x) { mergeIv(vSegs[x]).forEach(function (s) { stD.push('M' + x + ' ' + f1(s[0]) + 'V' + f1(s[1])); }); });
  var streets = ctxPath(stD.join(''), gM3, { 'stroke-dasharray': '8 10', opacity: 0 });
  gM3.insertBefore(streets, gCity);
  /* the site block outline (full weight, site vocabulary) */
  var sbOutline = el('path', { d: P2(rect(SB[0], SB[1], SB[2], SB[3]), true), fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'vector-effect': VE, 'stroke-linejoin': 'miter', opacity: 0 }, gM3);

  /* the letter */
  var mTint = el('path', { d: P2(M_PTS, true), fill: BLUE, 'fill-opacity': r3(0.05 * TINT), stroke: 'none', opacity: 0 }, gM3);
  var gLetter = el('g', { opacity: 0 }, gM3);
  var mOutline = el('path', { d: '', fill: 'none', stroke: BLUE, 'stroke-width': 3, 'vector-effect': VE, 'stroke-linejoin': 'miter', 'stroke-miterlimit': 12, 'stroke-linecap': 'butt' }, gM3);
  /* reveal: every corner of the outline grows its two arms at once (miter joins intact), so each partial
     state is the whole letter in construction marks; arms meet at the edge midpoints */
  var M_FULL = P2(M_PTS, true);
  function mCorners(u) {
    if (u <= 0.002) return '';
    if (u >= 0.999) return M_FULL;
    var n = M_PTS.length, h = u / 2, d = '';
    for (var i = 0; i < n; i++) {
      var v = M_PTS[i], a = M_PTS[(i - 1 + n) % n], b = M_PTS[(i + 1) % n];
      d += 'M' + f1(v[0] + (a[0] - v[0]) * h) + ' ' + f1(v[1] + (a[1] - v[1]) * h) + 'L' + v[0] + ' ' + v[1] +
        'L' + f1(v[0] + (b[0] - v[0]) * h) + ' ' + f1(v[1] + (b[1] - v[1]) * h);
    }
    return d;
  }
  function polyPartial(pts, cum, a, b) {
    /* sub-polyline between arc lengths a..b */
    var L = cum[cum.length - 1]; a = clamp(a, 0, L); b = clamp(b, 0, L);
    if (b - a < 0.01) return '';
    function at(s) {
      var i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      var l = cum[i] - cum[i - 1], u = l > 0 ? (s - cum[i - 1]) / l : 0;
      return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u), i];
    }
    var A = at(a), B = at(b), out = [[A[0], A[1]]];
    for (var i = A[2]; i < B[2]; i++) out.push(pts[i]);
    out.push([B[0], B[1]]);
    return P2(out);
  }
  function polyAt(pts, cum, s) {
    var L = cum[cum.length - 1]; s = clamp(s, 0, L);
    var i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
    var l = cum[i] - cum[i - 1], u = l > 0 ? (s - cum[i - 1]) / l : 0;
    return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
  }
  function cumOf(pts) { var c = [0]; for (var i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }

  (function siteInM() {
    var g = gLetter, k;
    var dash = { 'stroke-dasharray': '9 11' };
    var d = [];
    [60, 550].forEach(function (x) { d.push(P2([[x, 40], [x, 640]])); });
    [0, 1].forEach(function (side) {
      var a = [99.2 + 330 / SLOPE, 330], b = [99.2 + 690 / SLOPE, 690];
      if (side) { a = [MW - a[0], a[1]]; b = [MW - b[0], b[1]]; }
      d.push(P2([a, b]));
    });
    ctxPath(d.join(''), g, dash);
    function dol(v) { return 150 + v / SLOPE; }
    var m = 26, top = m, bot = 168;
    var tl = [dol(top) + m * 1.03, top], tr = [MW - tl[0], top], bl = [dol(bot) + m * 1.03, bot], br = [MW - bl[0], bot];
    var trap = [tl, tr, br, bl], dd = [];
    dd.push(P2(trap, true)); dd.push(P2(inset(trap, 12), true));
    var ux0 = 335, uy0 = 52; dd.push(P2(rect(ux0, uy0, ux0 + 54, uy0 + 40), true)); ctxRing([ux0 + 27, uy0 + 20], 13, g);
    var gx0 = 222, gy0 = 52; dd.push(P2(rect(gx0, gy0, gx0 + 74, gy0 + 40), true));
    for (k = 1; k < 6; k++) dd.push('M' + f1(gx0 + 74 * k / 6) + ' ' + (gy0 + 6) + 'V' + (gy0 + 34));
    for (k = 1; k < 4; k++) dd.push(P2([[MW / 2 - 48, bot - 9 * k], [MW / 2 + 48, bot - 9 * k]]));
    var rowsX = [];
    [[228, 290], [330, 392]].forEach(function (yy) {
      var ya = yy[0], yb = yy[1], xl = dol(yb) + 24, xr = MW - xl, n = Math.floor((xr - xl) / 28), xst = MW / 2 - n * 14, xs = [];
      for (var i = 0; i <= n; i++) xs.push(xst + i * 28);
      xs.forEach(function (xx) { dd.push('M' + f1(xx) + ' ' + ya + 'V' + yb); });
      dd.push(P2([[xs[0], yb], [xs[xs.length - 1], yb]]));
      rowsX.push(xs);
    });
    var xs0 = rowsX[0], kk = Math.floor(xs0.length / 2) - 1;
    dd.push(rrectD(xs0[kk] + 5, 236, xs0[kk + 1] - 5, 284, 6));
    [[[120, 277], [120, 800], [255, 800]], [[490, 277], [355, 800], [490, 800]]].forEach(function (tri) {
      dd.push(P2(inset(tri, 24), true)); dd.push(P2(inset(tri, 36), true));
    });
    ctxPath(dd.join(''), g);
    var prim = { 'stroke-opacity': 1, 'stroke-width': 3 };
    ctxPath(P2([[MW / 2 - 52, bot], [MW / 2 + 52, bot]]), g, prim);
    var hs = 12.1;
    ctxPath(P2(rect(22 - hs, 712 - hs, 22 + hs, 712 + hs), true), g, prim);
    ctxPath(P2([[22 + hs, 712], [110, 712]]), g, prim);
    ctxPath(P2(rect(588 - hs, 712 - hs, 588 + hs, 712 + hs), true), g, prim);
  })();
  var rArm = ctxPath('', gLetter, { 'stroke-opacity': 1, 'stroke-width': 3 });
  var R_PIV = [578, 704], R_LEN = 84;
  gM3.appendChild(mOutline);

  /* origin, site pins, hub-and-spoke links in the city */
  var ORIGIN = [305, -30];
  var SB_PIN = siteToLocal(345, -185);
  var cityTargets = [SB_PIN];
  [[3, 1], [-2, 0], [-3, 2]].forEach(function (cr) { var r = cellRect(cr[0], cr[1]); cityTargets.push([(r[0] + r[2]) / 2, r[1] + (r[3] - r[1]) * 0.26]); });
  function arcCtrl(a, b, lift, up) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    var nx = -dy / L, ny = dx / L;
    if ((ny > 0) === up) { nx = -nx; ny = -ny; }
    return [mx + nx * L * lift, my + ny * L * lift];
  }
  function cpt(P4, t) {
    var a = P4[0], b = P4[1], c = P4[2], d = P4[3], m = 1 - t;
    return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]];
  }
  function qpt(a, c, b, t) { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]; }
  function sampleTrim(fn, a, b, ra, rb, N) {
    /* sample parametric curve fn(t), trimmed to start ra from a and end rb from b */
    var lo = 0, hi = 0.5, i, mid;
    for (i = 0; i < 40; i++) { mid = (lo + hi) / 2; var p = fn(mid); if (Math.hypot(p[0] - a[0], p[1] - a[1]) < ra) lo = mid; else hi = mid; }
    var t0 = (lo + hi) / 2; lo = 0.5; hi = 1;
    for (i = 0; i < 40; i++) { mid = (lo + hi) / 2; var q = fn(mid); if (Math.hypot(q[0] - b[0], q[1] - b[1]) < rb) hi = mid; else lo = mid; }
    var t1 = (lo + hi) / 2, out = [];
    for (i = 0; i <= N; i++) out.push(fn(lerp(t0, t1, i / N)));
    return out;
  }
  var gLinks = el('g', {}, gM3);
  var cityLinks = cityTargets.map(function (tg) {
    var o = kT(ORIGIN), t = kT(tg), dx = t[0] - o[0], dy = t[1] - o[1], c1, c2;
    if (dy > 150) { c1 = [o[0] + dx * 0.25, o[1] - 150]; c2 = [t[0] + dx * 0.12, t[1] - 0.75 * dy - 120]; }
    else { var c = arcCtrl(o, t, 0.16, true); c1 = [o[0] + (c[0] - o[0]) * 2 / 3, o[1] + (c[1] - o[1]) * 2 / 3]; c2 = [t[0] + (c[0] - t[0]) * 2 / 3, t[1] + (c[1] - t[1]) * 2 / 3]; }
    var P4 = [o, c1, c2, t];
    var pts = sampleTrim(function (u) { return cpt(P4, u); }, o, t, 14, 14, 90).map(kInv);
    return { pts: pts, cum: cumOf(pts), path: el('path', { d: '', fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'vector-effect': VE }, gLinks), last: null };
  });
  var PULSE_PATH = [[ORIGIN[0] + 22, ORIGIN[1]], [550, -30], [550, 692]];
  var PULSE_CUM = cumOf(PULSE_PATH);
  var pulseTrail = ctxPath('', gM3, { 'stroke-opacity': 1, 'stroke-width': 3, 'stroke-linecap': 'round' });

  /* ================================================================ globe (port of sb3) */
  var gGlobe = shellGlobe, globeW = shellGlobeW, lensP = shellLensP;
  var GCt = [800, 700], GR = 560, PHI0 = 16 * Math.PI / 180;
  function gproj(lon, lat) {
    var l = lon * Math.PI / 180, p = lat * Math.PI / 180;
    var x = GR * Math.cos(p) * Math.sin(l), y = GR * (Math.cos(PHI0) * Math.sin(p) - Math.sin(PHI0) * Math.cos(p) * Math.cos(l));
    var vis = Math.sin(PHI0) * Math.sin(p) + Math.cos(PHI0) * Math.cos(p) * Math.cos(l);
    return [GCt[0] + x, GCt[1] - y, vis];
  }
  function gratPath(samples) {
    var parts = [], cur = [];
    samples.forEach(function (s) { if (s[2] > 0 && s[1] < 910) cur.push(s); else { if (cur.length > 1) parts.push(cur); cur = []; } });
    if (cur.length > 1) parts.push(cur);
    return parts.map(function (c) { return P2(c); }).join('');
  }
  var gBody = el('g', { opacity: 0 }, gGlobe);
  el('circle', { cx: GCt[0], cy: GCt[1], r: GR, fill: BLUE, 'fill-opacity': r3(0.04 * TINT), stroke: 'none' }, gBody);
  (function () {
    var d = [], lon, lat, s;
    [-45, -15, 15, 45].forEach(function (lo) { s = []; for (lat = -180; lat <= 180; lat++) s.push(gproj(lo, lat / 2)); d.push(gratPath(s)); });
    [-60, -30, 0, 30, 60].forEach(function (la) { s = []; for (lon = -360; lon <= 360; lon++) s.push(gproj(lon / 2, la)); d.push(gratPath(s)); });
    ctxPath(d.join(''), gBody, { 'stroke-linejoin': 'round' });
    ctxRing(GCt, GR, gBody);
  })();
  var G_ORIGIN = [800, 470];
  var G_TARGETS = [[390, 606], [524, 308], [1078, 304], [1208, 560], [612, 768], [988, 766]];
  var G_LIFTS = [0.26, 0.3, 0.3, 0.26, 0.24, 0.24];
  var G_ORDER = [1, 2, 3, 5, 4, 0];
  var DIVE_I = 3;
  var gArcsG = el('g', {}, gGlobe);
  var gLinksArr = G_TARGETS.map(function (t, i) {
    var c = arcCtrl(G_ORIGIN, t, G_LIFTS[i], true);
    var pts = sampleTrim(function (u) { return qpt(G_ORIGIN, c, t, u); }, G_ORIGIN, t, 46, 14, 70);
    return { pts: pts, cum: cumOf(pts), path: el('path', { d: '', fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'vector-effect': VE }, gArcsG), last: null };
  });

  /* dive geometry: the remote site's plan sits inside the dived pin */
  var MG = 22 / (SX1 - SX0);
  var SLAB_C = [(SX0 + SX1) / 2, (SY0 + SY1) / 2];
  var DPIN = G_TARGETS[DIVE_I];
  var OFF0 = [DPIN[0] - 800, DPIN[1] - 450];       /* pin offset from the frame centre on the globe hold */
  var LN_ZP = Math.log(55);                         /* plan arrives at s ~ 0.74, the scale the iso view fits at */
  var LN_ZG = Math.log(4.5);                          /* the globe itself only closes in a little: it stays a globe */
  var HW = (SX1 - SX0) * MG / 2, HH = (SY1 - SY0) * MG / 2, HD = Math.hypot(HW, HH);
  /* the pin's ring opens as a lens around the remote plan; the plan grows inside it ahead of the globe */
  function lensR(Zp) { return 14 + 1.12 * HD * (Zp - 1); }
  /* the arc into the dived pin, finely sampled, so its end can stay attached to the pin ring / plan edge */
  var DFULL = (function () {
    var c = arcCtrl(G_ORIGIN, DPIN, G_LIFTS[DIVE_I], true), o = [];
    for (var i = 0; i <= 600; i++) o.push(qpt(G_ORIGIN, c, DPIN, i / 600));
    return o;
  })();
  var DSTART = 0; while (Math.hypot(DFULL[DSTART][0] - G_ORIGIN[0], DFULL[DSTART][1] - G_ORIGIN[1]) < 46) DSTART++;
  function diveArcD(rc) {
    /* the arc stays attached to the lens ring (rc: ring radius in globe units) */
    function inside(p) { return Math.hypot(p[0] - DPIN[0], p[1] - DPIN[1]) <= rc; }
    var e = DFULL.length - 1;
    while (e > DSTART && inside(DFULL[e])) e--;
    var a = DFULL[e], b = DFULL[Math.min(e + 1, DFULL.length - 1)], lo = 0, hi = 1;
    for (var k = 0; k < 18; k++) { var m = (lo + hi) / 2; if (inside([lerp(a[0], b[0], m), lerp(a[1], b[1], m)])) hi = m; else lo = m; }
    return P2(DFULL.slice(DSTART, e + 1).concat([[lerp(a[0], b[0], lo), lerp(a[1], b[1], lo)]]));
  }

  /* ================================================================ screen layer */
  var gScr = shellScr;
  var mLights = [mkLight(gScr), mkLight(gScr), mkLight(gScr)];     /* shutter, left gate, right gate in the letter */
  var pulseDot = el('circle', { r: 6, fill: BLUE, opacity: 0 }, gScr);
  var originPin = mkLight(gScr);
  var cityPins = cityTargets.map(function () { return mkLight(gScr); });
  var cityHeads = cityTargets.map(function () { return el('circle', { r: 5, fill: BLUE, opacity: 0 }, gScr); });
  var globePins = G_TARGETS.map(function () { return mkLight(gScr); });
  var globeHeads = G_TARGETS.map(function () { return el('circle', { r: 5, fill: BLUE, opacity: 0 }, gScr); });
  var flyers = [0, 1, 2].map(function () { return el('circle', { r: 6.5, fill: BLUE, opacity: 0 }, gScr); });

  /* ================================================================ cameras */
  var W3 = (function () { return { c: [SB0[0] + (camW.cx - SX0) * MSC, SB0[1] + (camW.cy - SY0) * MSC], S: K * camW.s / MSC }; })();
  function m2From3(c3, mTh, mPh, cz) {
    return { cx: SX0 + (c3.c[0] - SB0[0]) / MSC, cy: SY0 + (c3.c[1] - SB0[1]) / MSC, cz: cz, s: c3.S * MSC / K,
      th: TH_ISO * (1 - mTh), ph: lerp(PH_ISO, PH_TOP, mPh) };
  }
  function gFrom3(c3) { return { c: [O_F[0] + S_F * c3.c[0], O_F[1] + S_F * c3.c[1]], Z: c3.S / S_F }; }
  function m3FromG(g) { return { c: [(g.c[0] - O_F[0]) / S_F, (g.c[1] - O_F[1]) / S_F], S: g.Z * S_F }; }
  function m2Cam(t) {
    if (t < TL.AB[0]) return camA;
    if (t < TL.AB[1]) return lerpCam(camA, camB, ease(seg(t, TL.AB)));
    if (t < TL.BC[0]) return camB;
    if (t < TL.CD[1]) return lerpCam(lerpCam(camB, camC, ease(seg(t, TL.BC))), camD, ease(seg(t, TL.CD)));
    if (t < TL.CW[0]) return camD;
    if (t < TL.CW[1]) return lerpCam(camD, camW, ease(seg(t, TL.CW)));
    return camW;
  }
  function scr3(c3, q) { return [800 + (q[0] - c3.c[0]) * c3.S, 450 + (q[1] - c3.c[1]) * c3.S]; }
  function scrG(g, q) { return [800 + (q[0] - g.c[0]) * g.Z, 450 + (q[1] - g.c[1]) * g.Z]; }

  /* ================================================================ state */
  function m2State(t) {
    if (t >= TL.DV[0]) return { arm: 0, shut: 0, door: 0, car: carPose(0), walk: WALK[0], wop: 1, p: [0, 0, 0] };
    var pa = ease(seg(t, TL.A)), ps = ease(seg(t, TL.SH)), pg = ease(seg(t, TL.GT));
    /* the resident keeps walking: the door is open before the threshold; inside, the resident fades as the
       lintel starts to take the head, so clip and fade end together */
    var wd = walkDist(seg(t, TL.WK));
    return { arm: 90 * pa, shut: ps, door: OPEN * ease(seg(t, TL.DO)), car: carPose(ease(seg(t, TL.CAR))),
      walk: polyAt(WALK, WALK_CUM, wd), wop: 1 - sm((wd - WALK_DOOR - 8) / 38), p: [pa, ps, pg] };
  }
  var DONE_T = [TL.A[1], TL.SH[1], TL.GT[1]];

  var lastStr = [null, null, null, null, null, null], lastTint = null;
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var cam2, c3 = null, gc = null, mp = 0, inDive = t >= TL.DV[0], Zp = 1, lensC = null, lensRad = 0;
    if (t < TL.MG[0]) cam2 = m2Cam(t);
    else if (!inDive) {
      if (t < TL.MG[1]) { var z = zoomLerp(W3.c, W3.S, KEY3.c, KEY3.S, ease(seg(t, TL.MG))); c3 = { c: z.c, S: z.s }; }
      else if (t < TL.PL[0]) c3 = KEY3;
      else { var z2 = zoomLerp(KEY3.c, KEY3.S, GF3.c, GF3.S, ease(seg(t, TL.PL))); c3 = { c: z2.c, S: z2.s }; }
      /* the camera first squares up to the street (yaw leads), then rises overhead */
      var uMo = seg(t, TL.MO);
      mp = ease(uMo);
      cam2 = m2From3(c3, ease(uMo / 0.7), mp, camW.cz);
      if (t < TL.MG[1]) {
        /* framing guard: as the iso foreshortening goes, keep the whole site inside a 60 px margin */
        var fit = fitFor(cam2, 60, sm(seg(t, TL.MG[0], TL.MG[0] + 0.7)));
        cam2.f = fit.f; cam2.ox = fit.ox; cam2.oy = fit.oy;
        var S1 = c3.S * fit.f;
        c3 = { c: [c3.c[0] - fit.ox / S1, c3.c[1] - fit.oy / S1], S: S1 };
      }
      gc = gFrom3(c3);
    } else {
      /* dive: pan the pin to the centre while the globe closes in only a little, so it stays a globe; the
         pin's ring opens into a lens and the remote plan grows inside it ahead of the globe until the plan
         carries the frame; the plan then tilts up to iso inside a 60 px framing guard, and the camera
         pushes in to the opening close-up */
      var uz = seg(t, TL.DZ), Zg = Math.exp(LN_ZG * ease(uz)), pn = 1 - ease(uz / 0.5);
      Zp = Math.exp(LN_ZP * (1 - Math.pow(1 - sm(seg(t, TL.DZP)), 1.6)));   /* quick to open, long soft landing */
      var Sx = 800 + OFF0[0] * pn, Sy = 450 + OFF0[1] * pn;
      var uM = seg(t, TL.DMO);
      mp = 1 - ease(uM);
      var base = { cx: SLAB_C[0] - (Sx - 800) / (Zp * MG), cy: SLAB_C[1] - (Sy - 450) / (Zp * MG), cz: camA.cz,
        s: Zp * MG / K, th: TH_ISO * ease((uM - 0.3) / 0.7), ph: lerp(PH_ISO, PH_TOP, mp) };
      var fd = fitFor(base, 60, 1);
      lensC = [800 + fd.ox + fd.f * (Sx - 800), 450 + fd.oy + fd.f * (Sy - 450)];
      lensRad = lensR(Zp) * fd.f;
      gc = { c: [DPIN[0] - (lensC[0] - 800) / Zg, DPIN[1] - (lensC[1] - 450) / Zg], Z: Zg };
      var wA = ease(seg(t, TL.DP));
      if (wA > 0) {
        var zl = zoomLerp([base.cx, base.cy], base.s * fd.f, [camA.cx, camA.cy], camA.s, wA);
        cam2 = { cx: zl.c[0], cy: zl.c[1], cz: camA.cz, s: zl.s, th: base.th, ph: base.ph, ox: fd.ox * (1 - wA), oy: fd.oy * (1 - wA) };
        /* landed: exactly the opening camera, so the loop seam is pixel-identical */
        if (wA >= 1) cam2 = camA;
      } else { base.f = fd.f; base.ox = fd.ox; base.oy = fd.oy; cam2 = base; }
      c3 = m3FromG(gc);
    }
    var S3 = c3 ? c3.S : 1;

    /* ---------------- opacities: the city keeps full weight while it shrinks, then lets go when small */
    var opM2;
    if (t < TL.PL[0]) opM2 = 1;
    else if (!inDive) opM2 = sm((S3 - 0.17) / 0.13);
    else opM2 = sm((Zp - 1.6) / 2.4);

    var panelP, panelU = -1;
    if (t < TL.PN[0]) panelP = 1;
    else if (t < TL.PIN[0]) { panelU = seg(t, TL.PN); panelP = 1 - sm(panelU / 0.7); if (t >= TL.PN[1]) panelU = -1; }
    else panelP = ease(seg(t, TL.PIN));

    /* ---------------- M2 scene */
    var stt = m2State(t);
    if (opM2 > 0.003) {
      sa(gM2, 'display', 'inline'); sa(gM2, 'opacity', f2(opM2));
      setCam(cam2);
      PIN_OCC = (t >= TL.BL[0] && !inDive) ? sm(seg(t, TL.BL[0], TL.BL[0] + 1.0)) * sm((S3 - 0.13) / 0.11) : 0;
      LS = clamp((SX1 - SX0) * PC.ks / 340, 0, 1);
      var out = buildM2(stt, mp);
      var fv = clamp(1 - mp * 1.25, 0, 1);
      for (var s = 0; s < 6; s++) {
        var str = out[s].join(' ');
        if (str !== lastStr[s]) { m2Paths[s].setAttribute('d', str); lastStr[s] = str; }
      }
      sa(m2Paths[SECV], 'stroke-opacity', f2(0.4 * fv));
      var td = TINTS.map(function (q) { return P2(q, true); }).join('');
      if (td !== lastTint) { tintPath.setAttribute('d', td); lastTint = td; }
      sa(tintPath, 'fill-opacity', f2(0.06 * TINT * fv));
      /* the lobby, seen through the open door */
      var dOpen = sm(stt.door / 45), dTd = '';
      if (DOOR_TINT && dOpen * fv > 0.003) dTd = [DOOR_TINT.q].concat(DOOR_TINT.holes).map(function (q) { return P2(q, true); }).join('');
      sa(doorTint, 'd', dTd);
      sa(doorTint, 'fill-opacity', f2(0.06 * TINT * dOpen * fv));
      sa(m2Paths[PERS], 'stroke-opacity', f2(PERSON_OP));
      var ms = sm(mp);
      for (var i = 0; i < 3; i++) {
        var p = stt.p[i], pk = -1;
        var kk = pingK(t, DONE_T[i]); if (kk >= 0 && t < TL.MG[0]) pk = kk;
        var fk = pingK(t, TL.PN[0] + (0.12 * i + 0.76) * (TL.PN[1] - TL.PN[0]), 0.8); if (fk >= 0) pk = fk;
        var ringR = lerp(7 + 5 * p, 6 + 3 * p, ms) * LS, ringOp = lerp(1, 1 - p, ms), dotR = p * lerp(6.5, 6, ms) * LS;
        setLight(dLights[i], LPOS[i][0], LPOS[i][1], ringR, ringOp, dotR, LS > 0.2 ? 1 : LS / 0.2, pk, lerp(12, 6, ms) * LS);
      }
      setWifi(t);
    } else sa(gM2, 'display', 'none');
    /* white occluder behind the panel (same as the page background) keeps site lines out of the panel */
    sa(pmr, 'fill-opacity', f2(panelP)); sa(pmr, 'display', panelP > 0.003 ? 'inline' : 'none');

    /* ---------------- panel */
    if (panelP > 0.003 || panelU >= 0) {
      sa(gPanel, 'display', 'inline');
      var sc = t >= TL.PIN[0] ? lerp(0.94, 1, panelP) : (panelU >= 0 ? 1 - 0.06 * sm(panelU) : 1);
      sa(gPanelIn, 'opacity', f2(panelP));
      sa(gPanelIn, 'transform', 'translate(' + f2(PCX) + ' ' + f2(PCY) + ') scale(' + f4(sc) + ') translate(' + f2(-PCX) + ' ' + f2(-PCY) + ')');
      for (var r = 0; r < 3; r++) {
        var rp = t >= TL.DV[0] ? 0 : stt.p[r];
        var rw = rows[r], rpk = pingK(t, DONE_T[r]);
        sa(rw.over, 'stroke-dashoffset', f1(rw.len * (1 - rp)));
        var hideDot = panelU >= 0 || (t >= TL.PN[1] && t < TL.DV[0]);
        setLight(rw.light, rw.cx, rw.cy, 7 + 5 * rp, 1, hideDot ? 0 : 6.5 * rp, 1, (rpk >= 0 && t < TL.MG[0]) ? rpk : -1, 12);
      }
    } else sa(gPanel, 'display', 'none');
    /* flying status dots: panel rows -> device lights */
    for (var fI = 0; fI < 3; fI++) {
      var fl = flyers[fI];
      if (panelU >= 0) {
        /* lifts off gently, arrives at speed (ease-in) on the live light position and merges into its dot on
           that frame, with the light's ping; a high arc keeps it clear of the other lights on the way */
        var ui = clamp((panelU - 0.12 * fI) / 0.76, 0, 1), ue = 1 - Math.cos(ui * Math.PI / 2);
        var sc2 = 1 - 0.06 * sm(panelU);
        var from = [PCX + (rows[fI].cx - PCX) * sc2, PCY + (rows[fI].cy - PCY) * sc2], to = LPOS[fI];
        var ctl = [lerp(from[0], to[0], 0.4), Math.min(from[1], to[1]) - 300];
        var pos = qpt(from, ctl, to, ue), devR = stt.p[fI] * lerp(6.5, 6, sm(mp)) * LS;
        sa(fl, 'cx', f1(pos[0])); sa(fl, 'cy', f1(pos[1])); sa(fl, 'r', f2(lerp(6.5, devR, ue)));
        sa(fl, 'opacity', ui >= 0.995 ? '0' : '1');
      } else sa(fl, 'opacity', '0');
    }

    /* ---------------- M3 */
    var showM3 = c3 && t >= TL.ST[0] - 0.01 && !(inDive && gc.Z > 3);
    if (showM3) {
      sa(gM3, 'display', 'inline');
      sa(gM3, 'transform', 'matrix(' + f4(c3.S) + ' 0 0 ' + f4(c3.S) + ' ' + f2(800 - c3.c[0] * c3.S) + ' ' + f2(450 - c3.c[1] * c3.S) + ')');
      /* the city stays at full weight while it shrinks onto the globe and fades only once it is small */
      var outCity = sm((S3 - 0.10) / 0.07), outLetter = sm((S3 - 0.2) / 0.14), outLinks = sm((S3 - 0.13) / 0.11), outAll = 1;
      if (inDive) { outCity = 0; outLetter = 0; outLinks = 0; }
      sa(streets, 'opacity', f2(sm(seg(t, TL.ST)) * outCity));
      blocks.forEach(function (b) {
        var st0 = TL.BL[0] + ((b.dist - minDist) / (maxDist - minDist)) * (TL.BL[1] - TL.BL[0] - 0.9);
        sa(b.g, 'opacity', f2(sm(seg(t, st0, st0 + 0.9)) * outCity));
      });
      sa(sbOutline, 'opacity', f2(sm(seg(t, TL.BL[0], TL.BL[0] + 1.0)) * outCity));
      sa(mOutline, 'd', mCorners(inDive ? 1 : eOut(seg(t, TL.MD))));
      sa(mTint, 'opacity', f2(sm(seg(t, TL.TN)) * (inDive ? 0 : sm((S3 - 0.16) / 0.14))));
      var lop = sm(seg(t, TL.LT)) * outLetter;
      sa(gLetter, 'opacity', f2(lop));
      var ra = 68 * ease(seg(t, TL.RG)) * Math.PI / 180;
      sa(rArm, 'd', P2([R_PIV, [R_PIV[0] - R_LEN * Math.cos(ra), R_PIV[1] - R_LEN * Math.sin(ra)]]));
      /* statuses in the letter */
      var rgp = ease(seg(t, TL.RG[1] - 0.35, TL.RG[1]));
      var stPos = [[305, 168 + 27.3], [22, 751.4], [588, 751.4]];
      var stOn = [1, 0, rgp];
      for (var k = 0; k < 3; k++) {
        var q = scr3(c3, stPos[k]), on = stOn[k], pkk = k === 2 ? pingK(t, TL.RG[1]) : -1;
        setLight(mLights[k], q[0], q[1], 6, 1 - on, 6 * on, lop, pkk, 6);
      }
      /* status pulse along the right stem */
      var pp = seg(t, TL.PU);
      if (pp > 0 && pp < 1 && lop > 0) {
        var Ltot = PULSE_CUM[PULSE_CUM.length - 1], sH = ease(pp) * Ltot, tail = 95;
        var hp = scr3(c3, polyAt(PULSE_PATH, PULSE_CUM, sH));
        var fade = Math.min(1, pp / 0.08, (1 - pp) / 0.12);
        sa(pulseDot, 'cx', f1(hp[0])); sa(pulseDot, 'cy', f1(hp[1])); sa(pulseDot, 'opacity', f2(fade));
        sa(pulseTrail, 'd', polyPartial(PULSE_PATH, PULSE_CUM, sH - tail, sH)); sa(pulseTrail, 'opacity', f2(fade));
      } else { sa(pulseDot, 'opacity', '0'); sa(pulseTrail, 'opacity', '0'); }
      /* origin pin */
      var op0 = scr3(c3, ORIGIN);
      setLight(originPin, op0[0], op0[1], 14, 1, 6, lop * outLinks, -1);
      /* hub-and-spoke links to the city sites */
      cityLinks.forEach(function (lk, i) {
        var a0 = TL.AR0 + i * TL.ARs, u = ease(seg(t, a0, a0 + TL.ARd)), Lt = lk.cum[lk.cum.length - 1];
        var dd = u > 0 ? (u >= 1 ? polyPartial(lk.pts, lk.cum, 0, Lt) : polyPartial(lk.pts, lk.cum, 0, u * Lt)) : '';
        if (dd !== lk.last) { lk.path.setAttribute('d', dd); lk.last = dd; }
        sa(lk.path, 'opacity', f2(outLinks));
        var head = cityHeads[i];
        if (u > 0 && u < 1) { var hq = scr3(c3, polyAt(lk.pts, lk.cum, u * Lt)); sa(head, 'cx', f1(hq[0])); sa(head, 'cy', f1(hq[1])); sa(head, 'opacity', '1'); }
        else sa(head, 'opacity', '0');
        var pq = scr3(c3, cityTargets[i]);
        var bop = i === 0 ? sm(seg(t, TL.BL[0], TL.BL[0] + 1.0)) : sm(seg(t, TL.BL[0] + 0.6, TL.BL[1]));
        var arrived = t >= a0 + TL.ARd ? 1 : 0;
        setLight(cityPins[i], pq[0], pq[1], 14, 1, 6 * arrived, bop * outLinks, pingK(t, a0 + TL.ARd), 14);
      });
    } else {
      sa(gM3, 'display', 'none');
      sa(pulseDot, 'opacity', '0');
      mLights.forEach(function (L) { sa(L.g, 'display', 'none'); });
      sa(originPin.g, 'display', 'none');
      cityPins.forEach(function (L) { sa(L.g, 'display', 'none'); });
      cityHeads.forEach(function (h) { sa(h, 'opacity', '0'); });
    }

    /* ---------------- globe */
    var gOp = 0, diveArcOp = 0;
    if (gc) {
      /* the graticule comes in at full context weight as soon as the pull-out starts; its lines enter by scale */
      if (t >= TL.PL[0] && !inDive) gOp = sm(seg(t, TL.PL[0], TL.PL[0] + 0.7));
      /* in the dive the lines leave the frame by scale; only the faint tint lets go, once the site fills the frame */
      else if (inDive) {
        gOp = (1 - sm(seg(t, TL.DMO[0] + 0.1, TL.DMO[0] + 0.8))) * (1 - sm((lensRad - 500) / 250));
        diveArcOp = 1 - sm(seg(t, TL.DMO[0], TL.DMO[0] + 0.5));
      }
    }
    /* the lens: inside the opening ring the globe gives way to the plan */
    var lensHole = inDive && lensC ? lensRad * sm((Zp - 1.4) / 0.8) : 0;
    if (lensHole > 0.5 && Math.max(gOp, diveArcOp) > 0.003) {
      sa(lensP, 'd', 'M-10 -10H1610V910H-10Z M' + f1(lensC[0] - lensHole) + ' ' + f1(lensC[1]) + 'a' + f1(lensHole) + ' ' + f1(lensHole) + ' 0 1 0 ' +
        f1(2 * lensHole) + ' 0a' + f1(lensHole) + ' ' + f1(lensHole) + ' 0 1 0 ' + f1(-2 * lensHole) + ' 0Z');
      sa(globeW, 'clip-path', 'url(#wgm-lens)');
    } else sa(globeW, 'clip-path', 'none');
    if (Math.max(gOp, diveArcOp) > 0.003) {
      sa(gGlobe, 'display', 'inline');
      sa(gGlobe, 'transform', 'matrix(' + f4(gc.Z) + ' 0 0 ' + f4(gc.Z) + ' ' + f2(800 - gc.c[0] * gc.Z) + ' ' + f2(450 - gc.c[1] * gc.Z) + ')');
      sa(gBody, 'opacity', f2(gOp));
      G_ORDER.forEach(function (gi, n) {
        var lk = gLinksArr[gi], a0 = TL.GA0 + n * TL.GAs, u = ease(seg(t, a0, a0 + TL.GAd)), Lt = lk.cum[lk.cum.length - 1];
        var dd = u > 0 ? (u >= 1 ? polyPartial(lk.pts, lk.cum, 0, Lt) : polyPartial(lk.pts, lk.cum, 0, u * Lt)) : '';
        if (gi === DIVE_I && inDive) dd = diveArcOp > 0.003 ? diveArcD(Math.max(14, lensRad) / gc.Z) : '';
        if (dd !== lk.last) { lk.path.setAttribute('d', dd); lk.last = dd; }
        sa(lk.path, 'opacity', f2(gi === DIVE_I && inDive ? diveArcOp : gOp));
        var head = globeHeads[gi], hu = -1;
        if (u > 0 && u < 1) hu = u * Lt;
        if (gi === DIVE_I) { var gpu = seg(t, TL.GP); if (gpu > 0 && gpu < 1) hu = ease(gpu) * Lt; }
        if (hu >= 0) { var hq = scrG(gc, polyAt(lk.pts, lk.cum, hu)); sa(head, 'cx', f1(hq[0])); sa(head, 'cy', f1(hq[1])); sa(head, 'opacity', f2(gOp)); }
        else sa(head, 'opacity', '0');
        var pq = scrG(gc, G_TARGETS[gi]), arrived = t >= a0 + TL.GAd ? 1 : 0;
        var pk = pingK(t, a0 + TL.GAd, 0.8);
        if (gi === DIVE_I) { var pk2 = pingK(t, TL.GP[1], 0.8); if (pk2 >= 0) pk = pk2; }
        var pop = gOp, pR = 14, pD = 6 * arrived, pDo = 1;
        if (inDive) {
          if (gi === DIVE_I) {
            /* the dived pin's ring opens into the lens around a dot that stays solid (the site stays open);
               the dot hands over to the plan once the plan is legible inside the lens; the ring lets go once
               it is larger than the frame */
            pR = lensRad; pDo = 1 - sm((Zp - 2.0) / 1.8); pop = 1 - sm((lensRad - 470) / 260);
          } else pop *= sm((Math.hypot(pq[0] - lensC[0], pq[1] - lensC[1]) - lensRad - 6) / 24);
        }
        setLight(globePins[gi], pq[0], pq[1], pR, 1, pD, pop, pk, 14, pDo);
      });
    } else {
      sa(gGlobe, 'display', 'none');
      globePins.forEach(function (L) { sa(L.g, 'display', 'none'); });
      globeHeads.forEach(function (h) { sa(h, 'opacity', '0'); });
    }
  }

  return { render: render, duration: DUR, still: STILL_T };
}
