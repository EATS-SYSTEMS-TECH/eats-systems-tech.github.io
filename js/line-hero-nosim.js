// "No SIM, No Router" hero: a line animation in the language of the WIFIGATE
// Host and WIFIGATE Manager heroes (14 s loop). A SIM card and a router hang
// over a gate and are struck out; a resident walks up, the phone in the pocket
// signals the WIFIGATE device at the gate directly, the light fills, the gate
// slides open and the resident walks in. js/line-hero.js drives render(t).
// Nothing here has an id, reads the page or keeps a global.
export const NOSIM_DURATION = 14;
export const NOSIM_STILL = 6.3;

// Builds the scene inside an empty <svg> and returns its deterministic render(t).
export function createNoSimScene(svg) {

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

  /* ================================================================ timeline */
  var TL = {
    X1: [0.8, 1.5], X2: [1.7, 2.4],                 /* the SIM card, then the router, are struck out */
    WK: [2.6, 10.4],                                /* one unbroken walk from the pavement into the yard */
    WF: [4.7, 7.3], LK: [5.0, 5.7],                 /* the phone signals; a direct link reaches the device */
    GT: [6.9, 7.4], DO: [7.3, 8.3], DC: [10.7, 11.7], LO: [11.7, 12.2],
    RS: [12.2, 13.2]                                /* the scene returns to its opening state */
  };
  var DUR = 14, STILL_T = 6.3;

  /* ================================================================ the site (isometric, back to front) */
  var S = 2.9, C = Math.sqrt(3) / 2, CX = 800, CY = 452;
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
  function tintFace(points, parent) { return el('path', { d: dPath(points, true), fill: BLUE, 'fill-opacity': r3(0.06 * TINT), stroke: 'none' }, parent); }
  /* a box: its top, street (+y) and right (+x) faces */
  function box(x, y, z, dx, dy, dz, style, parent) {
    var x1 = x + dx, y1 = y + dy, z1 = z + dz;
    face([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], style, parent);
    face([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], style, parent);
    face([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], style, parent);
  }

  var PW = 140, PB = -110, PF = 120;              /* the plate: x -PW..PW, y PB..PF */
  var GATE = 36, POST = 12, WALL_H = 44, LEAF_Y = -8, OPEN = 2 * GATE + 6;

  var gBack = el('g', {});
  /* the plate and what is drawn on it */
  face([[-PW, PB, 0], [PW, PB, 0], [PW, PF, 0], [-PW, PF, 0]], CTX, gBack);
  line([[-PW, PF, 0], [-PW, PF, -8], [PW, PF, -8], [PW, PB, -8], [PW, PB, 0]], CTX, gBack);
  line([[PW, PF, 0], [PW, PF, -8]], CTX, gBack);
  line([[-PW, 70, 0], [PW, 70, 0]], CTX, gBack); line([[-PW, 100, 0], [PW, 100, 0]], CTX, gBack);     /* the pavement */
  line([[-GATE, 0, 0], [-GATE, 70, 0]], CTX, gBack); line([[GATE, 0, 0], [GATE, 70, 0]], CTX, gBack);   /* the drive */
  line([[-GATE, -10, 0], [-GATE, -78, 0]], CTX, gBack); line([[GATE, -10, 0], [GATE, -56, 0]], CTX, gBack);
  /* the house at the back of the yard */
  box(44, -104, 0, 84, 48, 40, CTX, gBack);
  shape([[50, -98, 40], [122, -98, 40], [122, -62, 40], [50, -62, 40]], CTX, 'none', true, gBack);
  shape([[58, -56, 0], [74, -56, 0], [74, -56, 30], [58, -56, 30]], CTX, 'none', true, gBack);
  shape([[86, -56, 12], [118, -56, 12], [118, -56, 30], [86, -56, 30]], CTX, 'none', true, gBack);
  shape([[128, -96, 12], [128, -66, 12], [128, -66, 30], [128, -96, 30]], CTX, 'none', true, gBack);
  /* a car in the yard and a tree by the wall */
  box(-112, -98, 0, 32, 64, 13, CTX, gBack); box(-108, -84, 13, 24, 34, 10, CTX, gBack);
  line([[-58, -84, 0], [-58, -84, 26]], CTX, gBack);
  (function () { var c = P(-58, -84, 38); el('circle', { cx: f1(c[0]), cy: f1(c[1]), r: f1(14 * S), fill: '#fff', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, gBack); })();

  /* the resident, once inside the yard: behind the wall and the gate */
  var gPersonBack = el('g', { display: 'none' });

  /* the sliding gate leaf: it runs behind the right-hand wall */
  var gLeaf = el('g', {});
  tintFace([[-GATE, LEAF_Y, 2], [GATE, LEAF_Y, 2], [GATE, LEAF_Y, WALL_H - 2], [-GATE, LEAF_Y, WALL_H - 2]], gLeaf);
  face([[-GATE, LEAF_Y, 2], [GATE, LEAF_Y, 2], [GATE, LEAF_Y, WALL_H - 2], [-GATE, LEAF_Y, WALL_H - 2]], PRIM, gLeaf);
  for (var bx = -GATE + 10; bx < GATE - 2; bx += 10) line([[bx, LEAF_Y, 2], [bx, LEAF_Y, WALL_H - 2]], CTX, gLeaf);
  line([[-GATE, LEAF_Y, 24], [GATE, LEAF_Y, 24]], CTX, gLeaf);

  /* the wall, its two posts and the WIFIGATE device on the right-hand post */
  var gWall = el('g', {});
  box(-PW + 10, -6, 0, PW - 10 - GATE - POST, 6, WALL_H, CTX, gWall);
  box(GATE + POST, -6, 0, PW - 10 - GATE - POST, 6, WALL_H, CTX, gWall);
  box(-GATE - POST, -10, 0, POST, 12, 56, CTX, gWall);
  box(GATE, -10, 0, POST, 12, 56, CTX, gWall);
  box(GATE + 1, 2, 22, 10, 4, 18, PRIM, gWall);
  var LIGHT = P(GATE + 6, 2, 84);

  /* the resident on the pavement and the drive, in front of the wall */
  var gPersonFront = el('g', {});

  /* ================================================================ the resident */
  var PW_ = 18 * S, PH_ = 40 * S, PR_ = 8.5 * S;
  function mkPerson(parent) {
    var r = PW_ / 2, d = 'M' + f1(-r) + ' ' + f1(-PH_ + r) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(r) + ' ' + f1(-PH_ + r) + 'V' + f1(-r) +
      'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(-r) + ' ' + f1(-r) + 'Z';
    var g = el('g', {}, parent);
    el('path', { d: d, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, g);
    el('circle', { cx: 0, cy: f1(-PH_ - PR_ - 5 * S), r: f1(PR_), fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, g);
    return g;
  }
  var personFront = mkPerson(gPersonFront), personBack = mkPerson(gPersonBack);
  function qpt(a, c, b, t) { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]; }
  /* along the pavement, round onto the drive, through the gate and on into the yard */
  var WALK = (function () {
    var o = [[128, 85], [38, 85]];
    for (var k = 1; k <= 14; k++) o.push(qpt([38, 85], [4, 85], [2, 52], k / 14));
    o.push([0, 0]); o.push([0, -58]);
    return o;
  })();
  var WALK_CUM = (function () { var c = [0]; for (var i = 1; i < WALK.length; i++) c.push(c[i - 1] + Math.hypot(WALK[i][0] - WALK[i - 1][0], WALK[i][1] - WALK[i - 1][1])); return c; })();
  var WALK_LEN = WALK_CUM[WALK_CUM.length - 1], WALK_GATE = WALK_LEN - 58;
  function walkAt(d) {
    d = clamp(d, 0, WALK_LEN);
    var i = 1; while (i < WALK_CUM.length - 1 && WALK_CUM[i] < d) i++;
    var l = WALK_CUM[i] - WALK_CUM[i - 1], u = l > 0 ? (d - WALK_CUM[i - 1]) / l : 0;
    return [lerp(WALK[i - 1][0], WALK[i][0], u), lerp(WALK[i - 1][1], WALK[i][1], u)];
  }
  /* a short step off from standing, then an even pace all the way in */
  function walkDist(u) { var a = 0.1; return (u < a ? u * u / (2 * a) : u - a / 2) / (1 - a / 2) * WALK_LEN; }

  /* ================================================================ the signal: phone, Wi-Fi mark, direct link, light */
  var gSignal = el('g', {});
  var link = el('path', { d: '', fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'stroke-dasharray': '9 11' }, gSignal);
  var linkDot = el('circle', { r: 5.5, fill: BLUE, opacity: 0 }, gSignal);
  var gWifi = el('g', { display: 'none' }, gSignal);
  var wifiPhone = el('rect', { fill: BLUE, stroke: 'none' }, gWifi);
  var wifiArcs = [0, 1, 2].map(function () { return el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 3, d: '' }, gWifi); });
  var WIFI_HALF = 32 * Math.PI / 180;

  var gLight = el('g', {});
  var lightPing = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 12, fill: 'none', stroke: BLUE, 'stroke-width': 1.5, opacity: 0 }, gLight);
  el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 19, fill: '#fff', stroke: 'none' }, gLight);
  var lightRing = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 7, fill: 'none', stroke: BLUE, 'stroke-width': 1.5 }, gLight);
  var lightDot = el('circle', { cx: f1(LIGHT[0]), cy: f1(LIGHT[1]), r: 0, fill: BLUE }, gLight);

  /* ================================================================ what the entrance does not need: a SIM card and a router */
  function mkGhost(cx, cy, draw) {
    var g = el('g', {}), icon = el('g', {}, g);
    var tether = el('path', { d: 'M' + f1(cx) + ' ' + f1(cy + 70) + 'Q' + f1(lerp(cx, LIGHT[0], 0.35)) + ' ' + f1(LIGHT[1] - 20) + ' ' + f1(LIGHT[0] + (cx < LIGHT[0] ? -22 : 22)) + ' ' + f1(LIGHT[1] - 8),
      fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'stroke-dasharray': '9 11' }, g);
    draw(icon, cx, cy);
    var L = 2 * 78 * Math.SQRT2;
    el('path', { d: 'M' + f1(cx - 78) + ' ' + f1(cy + 78) + 'L' + f1(cx + 78) + ' ' + f1(cy - 78), fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-dasharray': f1(L) + ' ' + f1(L + 10), 'stroke-dashoffset': f1(L) }, g);
    var slash = el('path', { d: 'M' + f1(cx - 78) + ' ' + f1(cy + 78) + 'L' + f1(cx + 78) + ' ' + f1(cy - 78), fill: 'none', stroke: BLUE, 'stroke-width': 3, 'stroke-dasharray': f1(L) + ' ' + f1(L + 10), 'stroke-dashoffset': f1(L) }, g);
    return { icon: icon, tether: tether, slash: slash, under: slash.previousSibling || null, len: L };
  }
  var ghosts = [
    mkGhost(300, 170, function (g, x, y) {
      /* the card, its cut corner and its chip */
      el('path', { d: 'M' + (x - 44) + ' ' + (y - 58) + 'h58l30 30v86h-88Z', fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, g);
      el('rect', { x: x - 24, y: y - 12, width: 48, height: 40, rx: 7, fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, g);
      el('path', { d: 'M' + (x - 24) + ' ' + (y + 2) + 'h48M' + (x - 24) + ' ' + (y + 14) + 'h48M' + x + ' ' + (y - 12) + 'v40', fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, g);
    }),
    mkGhost(1336, 132, function (g, x, y) {
      /* the router: its body, lights, two antennas and its own signal */
      el('path', { d: 'M' + (x - 56) + ' ' + (y + 8) + 'l-16 -58M' + (x + 56) + ' ' + (y + 8) + 'l16 -58', fill: 'none', stroke: BLUE, 'stroke-width': 3 }, g);
      el('rect', { x: x - 80, y: y + 8, width: 160, height: 50, rx: 9, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, g);
      el('path', { d: 'M' + (x - 54) + ' ' + (y + 33) + 'h0.1M' + (x - 34) + ' ' + (y + 33) + 'h0.1M' + (x - 14) + ' ' + (y + 33) + 'h0.1M' + (x + 20) + ' ' + (y + 33) + 'h36', fill: 'none', stroke: BLUE, 'stroke-width': 3 }, g);
      el('path', { d: 'M' + (x - 26) + ' ' + (y - 14) + 'a36 36 0 0 1 52 0M' + (x - 14) + ' ' + (y - 2) + 'a20 20 0 0 1 28 0', fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, g);
    })
  ];

  /* ================================================================ render */
  function place(g, p) { sa(g, 'transform', 'translate(' + f1(p[0]) + ' ' + f1(p[1]) + ')'); }
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var back = sm(seg(t, TL.RS));                          /* 0 until the reset, 1 once the scene is back at its opening state */

    /* the SIM card and the router: struck out, pale and cut loose, until the reset */
    for (var i = 0; i < 2; i++) {
      var gh = ghosts[i], x = ease(seg(t, i ? TL.X2 : TL.X1)) * (1 - back);
      var off = f1(gh.len * (1 - x));
      sa(gh.slash, 'stroke-dashoffset', off);
      if (gh.under) sa(gh.under, 'stroke-dashoffset', off);
      sa(gh.icon, 'opacity', f2(1 - 0.5 * sm(x)));
      sa(gh.tether, 'opacity', f2(1 - sm(x)));
    }

    /* the gate and its light */
    var open = ease(seg(t, TL.DO)) * (1 - ease(seg(t, TL.DC)));
    sa(gLeaf, 'transform', 'translate(' + f1(OPEN * open * C * S) + ' ' + f1(OPEN * open * 0.5 * S) + ')');
    var lit = ease(seg(t, TL.GT)) * (1 - ease(seg(t, TL.LO)));
    sa(lightRing, 'r', f2(7 + 5 * lit)); sa(lightDot, 'r', f2(6.5 * lit));
    var pk = pingK(t, TL.GT[1]);
    if (pk >= 0) { sa(lightPing, 'r', f2(12 + 22 * eOut(pk))); sa(lightPing, 'opacity', f2(0.6 * (1 - pk) * (1 - pk))); }
    else sa(lightPing, 'opacity', '0');

    /* the resident: waiting on the pavement, walking in, gone into the yard, back for the next loop */
    var d = t < TL.RS[0] ? walkDist(seg(t, TL.WK)) : 0, w = walkAt(d), p = P(w[0], w[1], 0);
    var inside = w[1] < -2, op = t < TL.RS[0] ? 1 - sm((d - WALK_GATE - 10) / 44) : back;
    sa(gPersonFront, 'display', inside ? 'none' : 'inline'); sa(gPersonBack, 'display', inside ? 'inline' : 'none');
    place(inside ? personBack : personFront, p);
    sa(inside ? gPersonBack : gPersonFront, 'opacity', f2(op));

    /* the phone in the pocket signals: the Wi-Fi mark pulses and a direct link reaches the device */
    var u = seg(t, TL.WF), sig = (u > 0 && u < 1 && !inside) ? Math.min(1, u / 0.07, (1 - u) / 0.1) : 0;
    if (sig <= 0.003) { sa(gWifi, 'display', 'none'); sa(link, 'd', ''); sa(linkDot, 'opacity', '0'); return; }
    sa(gWifi, 'display', 'inline'); sa(gWifi, 'opacity', f2(sig));
    var cx = p[0] + 4.5 * S, cy = p[1] - 17 * S;
    sa(wifiPhone, 'x', f1(cx - 2.6 * S)); sa(wifiPhone, 'y', f1(cy - 4.6 * S));
    sa(wifiPhone, 'width', f1(5.2 * S)); sa(wifiPhone, 'height', f1(9.2 * S)); sa(wifiPhone, 'rx', f1(1.3 * S));
    var aim = clamp(Math.atan2(LIGHT[1] - cy, LIGHT[0] - cx), -1.1, 0.2), ph = (u * 3) % 1;
    for (var a = 0; a < 3; a++) {
      var k = sm((ph - 0.14 * a) / 0.14) * (1 - sm((ph - 0.7) / 0.26)), r = (13 + 8.5 * a) * S;
      sa(wifiArcs[a], 'opacity', f2(k));
      sa(wifiArcs[a], 'd', 'M' + f1(cx + r * Math.cos(aim - WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim - WIFI_HALF)) +
        'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r * Math.cos(aim + WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim + WIFI_HALF)));
    }
    var dx = LIGHT[0] - cx, dy = LIGHT[1] - cy, len = Math.hypot(dx, dy), reach = ease(seg(t, TL.LK));
    var x0 = cx + dx / len * 46 * S, y0 = cy + dy / len * 46 * S, x1 = LIGHT[0] - dx / len * 24, y1 = LIGHT[1] - dy / len * 24;
    sa(link, 'opacity', f2(sig));
    sa(link, 'd', reach > 0.01 ? 'M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(lerp(x0, x1, reach)) + ' ' + f1(lerp(y0, y1, reach)) : '');
    var run = t >= TL.LK[1] ? ((t - TL.LK[1]) / 0.7) % 1 : -1;
    if (run >= 0) { sa(linkDot, 'cx', f1(lerp(x0, x1, run))); sa(linkDot, 'cy', f1(lerp(y0, y1, run))); sa(linkDot, 'opacity', f2(sig * Math.min(1, run / 0.15, (1 - run) / 0.15))); }
    else sa(linkDot, 'opacity', '0');
  }

  return { render: render, duration: DUR, still: STILL_T };
}
