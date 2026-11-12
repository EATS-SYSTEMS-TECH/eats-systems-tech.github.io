// Feature page heroes: line animations in the language of the WIFIGATE Host
// and WIFIGATE Manager heroes, one per "What is WIFIGATE?" feature page. They
// share the site of the "No SIM, No Router" scene (a gate in a wall, the
// WIFIGATE device on its post, a resident on the pavement) and its walk-in;
// each adds its own story above it:
//   guest    - an invite flies from a phone to a guest, who then opens the gate
//   history  - every entry lands as a new line in the access history
//   autoopen - the gate opens by itself as the resident comes near, hands full
//   events   - a clock opens and closes the gate at the scheduled hours
//   rf       - a remote is paired through the phone, then opens the gate
//   security - a protected link opens the gate; an attacker gets nothing
//   nofees   - months go by on a calendar and no bill ever arrives
// js/line-hero.js drives render(t). Nothing here has an id, reads the page or
// keeps a global.

// Builds one scene inside an empty <svg> and returns its deterministic render(t).
function createFeatureScene(svg, V) {


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

  /* ================================================================ timeline: each scene brings its own */
  var TL = V.TL, DUR = V.DUR, STILL_T = V.STILL;

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

  /* ================================================================ what the stories draw with */
  var gTop = el('g', {});
  function qcurve(a, c, b, u) { return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]; }
  function prim(tag, attrs, parent) { attrs.stroke = BLUE; attrs['stroke-width'] = 3; if (attrs.fill === undefined) attrs.fill = 'none'; return el(tag, attrs, parent || gTop); }
  function pale(tag, attrs, parent) { attrs.stroke = BLUE; attrs['stroke-opacity'] = 0.4; attrs['stroke-width'] = 1.5; if (attrs.fill === undefined) attrs.fill = 'none'; return el(tag, attrs, parent || gTop); }
  function tintOf(tag, attrs, parent) { attrs.fill = BLUE; attrs['fill-opacity'] = r3(0.06 * TINT); attrs.stroke = 'none'; return el(tag, attrs, parent || gTop); }
  /* a bold stroke that crosses out whatever sits at (cx, cy); set(0..1) draws it */
  function strike(cx, cy, parent) {
    var L = 2 * 78 * Math.SQRT2, d = 'M' + f1(cx - 78) + ' ' + f1(cy + 78) + 'L' + f1(cx + 78) + ' ' + f1(cy - 78), dash = f1(L) + ' ' + f1(L + 10);
    var under = el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-dasharray': dash, 'stroke-dashoffset': f1(L) }, parent || gTop);
    var over = el('path', { d: d, fill: 'none', stroke: BLUE, 'stroke-width': 3, 'stroke-dasharray': dash, 'stroke-dashoffset': f1(L) }, parent || gTop);
    return function (x) { var off = f1(L * (1 - clamp(x, 0, 1))); sa(under, 'stroke-dashoffset', off); sa(over, 'stroke-dashoffset', off); };
  }
  /* a line that draws itself from its start; set(0..1) */
  function drawn(d, length, style, parent) {
    var e = (style === 'pale' ? pale : prim)('path', { d: d, 'stroke-dasharray': f1(length) + ' ' + f1(length + 10), 'stroke-dashoffset': f1(length) }, parent);
    return function (x) { sa(e, 'stroke-dashoffset', f1(length * (1 - clamp(x, 0, 1)))); };
  }
  /* a dot that travels a curve from a to b; at(u) with u outside 0..1 hides it */
  function flyer(r, parent) {
    var e = el('circle', { r: r || 6, fill: BLUE, opacity: 0 }, parent || gTop);
    return function (a, c, b, u) {
      if (!(u > 0 && u < 1)) { sa(e, 'opacity', '0'); return; }
      var q = qcurve(a, c, b, ease(u));
      sa(e, 'cx', f1(q[0])); sa(e, 'cy', f1(q[1])); sa(e, 'opacity', f2(Math.min(1, u / 0.12, (1 - u) / 0.12)));
    };
  }
  var extraPing = -1;

  /* ================================================================ the stories */
  var STORIES = {
    /* an invite flies from the resident's phone to the guest on the pavement, and the guest's phone then opens the gate */
    guest: function () {
      prim('rect', { x: 110, y: 46, width: 150, height: 232, rx: 22, fill: '#fff' });
      pale('path', { d: 'M165 62h40' });
      pale('rect', { x: 128, y: 92, width: 114, height: 74, rx: 10 });
      pale('path', { d: 'M142 112h60M142 128h86M142 144h44' });
      var press = tintOf('rect', { x: 128, y: 196, width: 114, height: 44, rx: 22 });
      prim('rect', { x: 128, y: 196, width: 114, height: 44, rx: 22 });
      prim('path', { d: 'M168 218h28M188 209l9 9l-9 9' });
      var plane = el('g', { opacity: 0 }, gTop);
      el('path', { d: 'M-16 -12L18 0L-16 12L-9 0Z', fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, plane);
      var trail = drawn('M262 218Q700 40 1118 610', 1180, 'pale');
      var start = P(128, 85, 0), target = [start[0], start[1] - 150];
      return function (st) {
        var t = st.t, fly = seg(t, [1.3, 3.0]) * (1 - st.back), u = ease(fly);
        sa(press, 'fill-opacity', r3(0.06 * TINT * (1 + 3 * sm(seg(t, [0.9, 1.3])) * (1 - sm(seg(t, [1.3, 1.9]))))));
        trail(fly > 0 && fly < 1 ? u : 0);
        if (fly > 0.01 && fly < 0.99) {
          var q = qcurve([262, 218], [700, 40], target, u), q2 = qcurve([262, 218], [700, 40], target, Math.min(1, u + 0.02));
          sa(plane, 'opacity', '1');
          sa(plane, 'transform', 'translate(' + f1(q[0]) + ' ' + f1(q[1]) + ') rotate(' + f1(Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI) + ')');
        } else sa(plane, 'opacity', '0');
        extraPing = -1;
      };
    },
    /* every entry lands in the history: a new line at the top of the list */
    history: function () {
      prim('rect', { x: 70, y: 46, width: 300, height: 232, rx: 18, fill: '#fff' });
      prim('path', { d: 'M70 86h300' });
      for (var k = 0; k < 3; k++) el('circle', { cx: 92 + k * 14, cy: 66, r: 3.2, fill: BLUE, stroke: 'none' }, gTop);
      pale('path', { d: 'M104 106V258' });
      var rows = [116, 162, 208, 254 - 14];
      for (var i = 1; i < 4; i++) {
        pale('circle', { cx: 104, cy: rows[i], r: 7, fill: '#fff' });
        pale('path', { d: 'M126 ' + (rows[i] - 6) + 'h120M126 ' + (rows[i] + 8) + 'h70M290 ' + rows[i] + 'h50' });
      }
      var fresh = el('g', { opacity: 0 }, gTop);
      tintOf('rect', { x: 84, y: rows[0] - 20, width: 272, height: 40, rx: 8 }, fresh);
      el('circle', { cx: 104, cy: rows[0], r: 7, fill: BLUE, stroke: 'none' }, fresh);
      var line1 = drawn('M126 ' + (rows[0] - 6) + 'h120', 120, 'prim', fresh), line2 = drawn('M290 ' + rows[0] + 'h50', 50, 'prim', fresh);
      var fly = flyer(6.5);
      return function (st) {
        var t = st.t, u = seg(t, [6.5, 7.5]);
        fly(LIGHT, [520, 60], [104, rows[0]], st.back > 0 ? -1 : u);
        var on = sm(seg(t, [7.4, 7.7])) * (1 - st.back);
        sa(fresh, 'opacity', f2(on));
        line1(seg(t, [7.5, 8.1])); line2(seg(t, [8.0, 8.4]));
        extraPing = -1;
      };
    },
    /* the gate opens by itself as the resident comes near; the hands stay full */
    autoopen: function () {
      var ring = [], cx = 0, cy = 34, r = 60;
      for (var k = 0; k <= 48; k++) { var a = Math.PI * 2 * k / 48, p = P(cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.9, 0); ring.push((k ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])); }
      var zone = el('path', { d: ring.join('') + 'Z', fill: BLUE, 'fill-opacity': r3(0.06 * TINT), stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5, 'stroke-dasharray': '9 11' }, gBack);
      /* a shopping bag in each hand */
      [personFront, personBack].forEach(function (g) {
        [-1, 1].forEach(function (side) {
          var x = side * (PW_ / 2 + 13), y = -PH_ * 0.38;
          el('path', { d: 'M' + f1(x - 9) + ' ' + f1(y) + 'h18v24h-18Z', fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, g);
          el('path', { d: 'M' + f1(x - 5) + ' ' + f1(y) + 'v-7a5 5 0 0 1 10 0v7', fill: 'none', stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, g);
        });
      });
      return function (st) {
        sa(zone, 'fill-opacity', r3(0.06 * TINT * (1 + 0.6 * st.lit)));
        extraPing = -1;
      };
    },
    /* a clock opens the gate at one hour and closes it at another */
    events: function () {
      var cx = 214, cy = 166, r = 104, a0 = TL.DO[0] / DUR * Math.PI * 2 - Math.PI / 2, a1 = TL.DC[0] / DUR * Math.PI * 2 - Math.PI / 2;
      function at(a, k) { return [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)]; }
      var s0 = at(a0, 1), s1 = at(a1, 1);
      el('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: 'none' }, gTop);
      tintOf('path', { d: 'M' + cx + ' ' + cy + 'L' + f1(s0[0]) + ' ' + f1(s0[1]) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + f1(s1[0]) + ' ' + f1(s1[1]) + 'Z' });
      prim('circle', { cx: cx, cy: cy, r: r });
      var ticks = '';
      for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6, p = at(a, 0.86), q = at(a, 0.96); ticks += 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]); }
      pale('path', { d: ticks });
      [a0, a1].forEach(function (a) { var p = at(a, 1); el('circle', { cx: f1(p[0]), cy: f1(p[1]), r: 8, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, gTop); });
      var hand = prim('path', { d: '' });
      el('circle', { cx: cx, cy: cy, r: 6, fill: BLUE, stroke: 'none' }, gTop);
      return function (st) {
        var a = st.t / DUR * Math.PI * 2 - Math.PI / 2, p = at(a, 0.74);
        sa(hand, 'd', 'M' + cx + ' ' + cy + 'L' + f1(p[0]) + ' ' + f1(p[1]));
        extraPing = pingK(st.t, TL.DC[0]);
      };
    },
    /* a remote is paired through the phone, and from then on it opens the gate */
    rf: function () {
      var fx = 250, fy = 170;
      prim('circle', { cx: fx, cy: fy - 104, r: 15 });
      prim('rect', { x: fx - 50, y: fy - 86, width: 100, height: 168, rx: 26, fill: '#fff' });
      var button = tintOf('circle', { cx: fx, cy: fy - 36, r: 26 });
      prim('circle', { cx: fx, cy: fy - 36, r: 26 });
      pale('circle', { cx: fx, cy: fy + 36, r: 18 });
      var waves = [0, 1, 2].map(function (k) { var rr = 76 + k * 26; return prim('path', { d: 'M' + f1(fx + rr * 0.92) + ' ' + f1(fy - 36 - rr * 0.39) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + f1(fx + rr * 0.92) + ' ' + f1(fy - 36 + rr * 0.39), opacity: 0 }); });
      /* the phone that pairs it: a list of remotes, the new one gets its mark */
      var px = 1250, py = 44;
      prim('rect', { x: px, y: py, width: 168, height: 236, rx: 22, fill: '#fff' });
      pale('path', { d: 'M' + (px + 64) + ' ' + (py + 16) + 'h40' });
      [0, 1].forEach(function (k) {
        var y = py + 52 + k * 78;
        pale('rect', { x: px + 16, y: y, width: 136, height: 60, rx: 10 });
        pale('rect', { x: px + 30, y: y + 12, width: 20, height: 36, rx: 7 });
        pale('path', { d: 'M' + (px + 64) + ' ' + (y + 24) + 'h44M' + (px + 64) + ' ' + (y + 38) + 'h28' });
      });
      var mark = el('g', { opacity: 0 }, gTop);
      tintOf('rect', { x: px + 16, y: py + 52, width: 136, height: 60, rx: 10 }, mark);
      el('circle', { cx: px + 130, cy: py + 82, r: 12, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, mark);
      el('path', { d: 'M' + (px + 124) + ' ' + (py + 82) + 'l5 5l8 -9', fill: 'none', stroke: BLUE, 'stroke-width': 3 }, mark);
      var learn = flyer(6), tell = flyer(6);
      return function (st) {
        var t = st.t, pair = seg(t, [0.9, 2.3]), press = sm(seg(t, [4.4, 4.7])) * (1 - sm(seg(t, [5.4, 6.0])));
        var beat = (t >= 0.9 && t < 2.5) ? ((t - 0.9) / 0.8) % 1 : (press > 0.05 ? ((t - 4.4) / 0.6) % 1 : -1);
        for (var k = 0; k < 3; k++) sa(waves[k], 'opacity', f2(beat < 0 ? 0 : sm((beat - 0.16 * k) / 0.16) * (1 - sm((beat - 0.7) / 0.28))));
        sa(button, 'fill-opacity', r3(0.06 * TINT * (1 + 4 * press)));
        learn([fx + 60, fy - 36], [560, 120], LIGHT, st.back > 0 ? -1 : pair);
        tell(LIGHT, [1040, 70], [px + 16, py + 82], st.back > 0 ? -1 : seg(t, [2.3, 3.3]));
        sa(mark, 'opacity', f2(sm(seg(t, [3.2, 3.6])) * (1 - st.back)));
        extraPing = pingK(t, 2.3);
      };
    },
    /* the link between phone and gate is protected: an attacker close by gets nothing */
    security: function () {
      var lx = 300, ly = 176;
      prim('path', { d: 'M' + (lx - 34) + ' ' + (ly - 26) + 'v-30a34 34 0 0 1 68 0v30' });
      prim('rect', { x: lx - 56, y: ly - 26, width: 112, height: 92, rx: 16, fill: '#fff' });
      tintOf('rect', { x: lx - 56, y: ly - 26, width: 112, height: 92, rx: 16 });
      prim('path', { d: 'M' + lx + ' ' + (ly + 10) + 'v22' });
      el('circle', { cx: lx, cy: ly + 8, r: 9, fill: BLUE, stroke: 'none' }, gTop);
      /* the attacker: a hooded figure at a laptop who reaches for the link and is struck out */
      var ex = 1330, ey = 158, foe = el('g', {}, gTop);
      prim('path', { d: 'M' + (ex - 98) + ' ' + (ey + 84) + 'C' + (ex - 96) + ' ' + (ey + 44) + ' ' + (ex - 78) + ' ' + (ey + 26) + ' ' + (ex - 54) + ' ' + (ey + 16) +
        'C' + (ex - 70) + ' ' + (ey - 30) + ' ' + (ex - 46) + ' ' + (ey - 82) + ' ' + ex + ' ' + (ey - 84) +
        'C' + (ex + 46) + ' ' + (ey - 82) + ' ' + (ex + 70) + ' ' + (ey - 30) + ' ' + (ex + 54) + ' ' + (ey + 16) +
        'C' + (ex + 78) + ' ' + (ey + 26) + ' ' + (ex + 96) + ' ' + (ey + 44) + ' ' + (ex + 98) + ' ' + (ey + 84) + 'Z', fill: '#fff' }, foe);
      /* the face lost in the shadow of the hood, and two eyes */
      el('path', { d: 'M' + (ex - 34) + ' ' + (ey - 20) + 'C' + (ex - 34) + ' ' + (ey - 62) + ' ' + (ex + 34) + ' ' + (ey - 62) + ' ' + (ex + 34) + ' ' + (ey - 20) +
        'C' + (ex + 34) + ' ' + (ey + 10) + ' ' + (ex - 34) + ' ' + (ey + 10) + ' ' + (ex - 34) + ' ' + (ey - 20) + 'Z', fill: BLUE, 'fill-opacity': r3(0.2 * TINT), stroke: BLUE, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }, foe);
      el('path', { d: 'M' + (ex - 20) + ' ' + (ey - 27) + 'l12 5M' + (ex + 20) + ' ' + (ey - 27) + 'l-12 5', fill: 'none', stroke: BLUE, 'stroke-width': 3 }, foe);
      /* the laptop, seen from behind its lid */
      prim('rect', { x: ex - 54, y: ey + 30, width: 108, height: 66, rx: 7, fill: '#fff' }, foe);
      pale('circle', { cx: ex, cy: ey + 63, r: 9 }, foe);
      prim('path', { d: 'M' + (ex - 74) + ' ' + (ey + 100) + 'h148' }, foe);
      var probe = drawn('M' + (ex - 90) + ' ' + (ey + 30) + 'Q1090 330 ' + f1(LIGHT[0] + 70) + ' ' + f1(LIGHT[1] + 150), 420, 'pale');
      var cross = strike(ex, ey + 4);
      /* the padlock that rides the link */
      var lock = el('g', { opacity: 0 }, gTop);
      el('rect', { x: -13, y: -6, width: 26, height: 22, rx: 5, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }, lock);
      el('path', { d: 'M-7 -6v-6a7 7 0 0 1 14 0v6', fill: 'none', stroke: BLUE, 'stroke-width': 3 }, lock);
      return function (st) {
        var t = st.t, look = seg(t, [4.8, 5.6]), out = ease(seg(t, [5.6, 6.3])) * (1 - st.back);
        probe(look * (1 - sm(seg(t, [5.8, 6.4]))));
        cross(out);
        sa(foe, 'opacity', f2(1 - 0.5 * sm(out)));
        if (st.link && st.sig > 0.05) {
          var u = ((t - TL.LK[0]) / 1.4) % 1;
          sa(lock, 'opacity', f2(st.sig));
          sa(lock, 'transform', 'translate(' + f1(lerp(st.link[0], st.link[2], 0.25 + 0.5 * u)) + ' ' + f1(lerp(st.link[1], st.link[3], 0.25 + 0.5 * u)) + ')');
        } else sa(lock, 'opacity', '0');
        extraPing = -1;
      };
    },
    /* months go by on the calendar; the monthly bill is struck out and never arrives */
    nofees: function () {
      prim('rect', { x: 70, y: 56, width: 300, height: 222, rx: 18, fill: '#fff' });
      prim('path', { d: 'M70 100h300M130 40v32M310 40v32' });
      var cells = [];
      for (var k = 0; k < 6; k++) {
        var x = 94 + (k % 3) * 90, y = 118 + Math.floor(k / 3) * 74;
        cells.push(tintOf('rect', { x: x, y: y, width: 72, height: 58, rx: 10, 'fill-opacity': 0 }));
        pale('rect', { x: x, y: y, width: 72, height: 58, rx: 10 });
      }
      /* the bill that would come every month */
      var bx = 1330, by = 168, bill = el('g', {}, gTop);
      prim('path', { d: 'M' + (bx - 52) + ' ' + (by - 78) + 'h104v140l-17.3 12l-17.4 -12l-17.3 12l-17.4 -12l-17.3 12l-17.3 -12Z', fill: '#fff' }, bill);
      pale('path', { d: 'M' + (bx - 30) + ' ' + (by - 48) + 'h60M' + (bx - 30) + ' ' + (by - 24) + 'h60M' + (bx - 30) + ' ' + by + 'h36' }, bill);
      prim('path', { d: 'M' + (bx - 30) + ' ' + (by + 30) + 'h60' }, bill);
      var cross = strike(bx, by);
      return function (st) {
        var t = st.t, out = ease(seg(t, [0.8, 1.5])) * (1 - st.back);
        cross(out);
        sa(bill, 'opacity', f2(1 - 0.5 * sm(out)));
        for (var k = 0; k < 6; k++) sa(cells[k], 'fill-opacity', r3(0.06 * TINT * 1.6 * sm(seg(t, [1.6 + k * 1.5, 2.1 + k * 1.5])) * (1 - st.back)));
        extraPing = -1;
      };
    }
  };
  var story = STORIES[V.name]();

  /* ================================================================ render */
  function place(g, p) { sa(g, 'transform', 'translate(' + f1(p[0]) + ' ' + f1(p[1]) + ')'); }
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    var back = sm(seg(t, TL.RS));                          /* 0 until the reset, 1 once the scene is back at its opening state */

    /* the gate and its light */
    var open = ease(seg(t, TL.DO)) * (1 - ease(seg(t, TL.DC)));
    sa(gLeaf, 'transform', 'translate(' + f1(OPEN * open * C * S) + ' ' + f1(OPEN * open * 0.5 * S) + ')');
    var lit = ease(seg(t, TL.GT)) * (1 - ease(seg(t, TL.LO)));
    sa(lightRing, 'r', f2(7 + 5 * lit)); sa(lightDot, 'r', f2(6.5 * lit));

    /* the resident: waiting on the pavement, walking in, gone into the yard, back for the next loop */
    var d = t < TL.RS[0] ? walkDist(seg(t, TL.WK)) : 0, w = walkAt(d), p = P(w[0], w[1], 0);
    var inside = w[1] < -2, op = t < TL.RS[0] ? 1 - sm((d - WALK_GATE - 10) / 44) : back;
    sa(gPersonFront, 'display', inside ? 'none' : 'inline'); sa(gPersonBack, 'display', inside ? 'inline' : 'none');
    place(inside ? personBack : personFront, p);
    sa(inside ? gPersonBack : gPersonFront, 'opacity', f2(op));

    /* the phone in the pocket signals: the Wi-Fi mark pulses and, in some stories, a direct link reaches the device */
    var u = TL.WF ? seg(t, TL.WF) : 0, sig = (u > 0 && u < 1 && !inside) ? Math.min(1, u / 0.07, (1 - u) / 0.1) : 0, ends = null;
    if (sig <= 0.003) { sa(gWifi, 'display', 'none'); sa(link, 'd', ''); sa(linkDot, 'opacity', '0'); }
    else {
      sa(gWifi, 'display', 'inline'); sa(gWifi, 'opacity', f2(sig));
      var cx = p[0] + 4.5 * S, cy = p[1] - 17 * S;
      sa(wifiPhone, 'x', f1(cx - 2.6 * S)); sa(wifiPhone, 'y', f1(cy - 4.6 * S));
      sa(wifiPhone, 'width', f1(5.2 * S)); sa(wifiPhone, 'height', f1(9.2 * S)); sa(wifiPhone, 'rx', f1(1.3 * S));
      var aim = clamp(Math.atan2(LIGHT[1] - cy, LIGHT[0] - cx), -1.1, 0.2), ph = (u * V.pulses) % 1;
      for (var a = 0; a < 3; a++) {
        var k = sm((ph - 0.14 * a) / 0.14) * (1 - sm((ph - 0.7) / 0.26)), r = (13 + 8.5 * a) * S;
        sa(wifiArcs[a], 'opacity', f2(k));
        sa(wifiArcs[a], 'd', 'M' + f1(cx + r * Math.cos(aim - WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim - WIFI_HALF)) +
          'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r * Math.cos(aim + WIFI_HALF)) + ' ' + f1(cy + r * Math.sin(aim + WIFI_HALF)));
      }
      if (TL.LK) {
        var dx = LIGHT[0] - cx, dy = LIGHT[1] - cy, len = Math.hypot(dx, dy), reach = ease(seg(t, TL.LK));
        var x0 = cx + dx / len * 46 * S, y0 = cy + dy / len * 46 * S, x1 = LIGHT[0] - dx / len * 24, y1 = LIGHT[1] - dy / len * 24;
        ends = [x0, y0, x1, y1];
        sa(link, 'opacity', f2(sig));
        sa(link, 'd', reach > 0.01 ? 'M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(lerp(x0, x1, reach)) + ' ' + f1(lerp(y0, y1, reach)) : '');
        var go = (t >= TL.LK[1] && !V.quietLink) ? ((t - TL.LK[1]) / 0.7) % 1 : -1;
        if (go >= 0) { sa(linkDot, 'cx', f1(lerp(x0, x1, go))); sa(linkDot, 'cy', f1(lerp(y0, y1, go))); sa(linkDot, 'opacity', f2(sig * Math.min(1, go / 0.15, (1 - go) / 0.15))); }
        else sa(linkDot, 'opacity', '0');
      } else { sa(link, 'd', ''); sa(linkDot, 'opacity', '0'); }
    }

    story({ t: t, back: back, open: open, lit: lit, sig: sig, link: ends, person: p, inside: inside });
    var pk = pingK(t, TL.GT[1]);
    if (pk < 0) pk = extraPing;
    if (pk >= 0) { sa(lightPing, 'r', f2(12 + 22 * eOut(pk))); sa(lightPing, 'opacity', f2(0.6 * (1 - pk) * (1 - pk))); }
    else sa(lightPing, 'opacity', '0');
  }

  return { render: render, duration: DUR, still: STILL_T };
}

/* ================================================================ the scenes: timelines over the shared walk-in
   WK the walk, WF the phone's signal (absent where the phone plays no part), LK the direct link,
   GT the light, DO and DC the gate opening and closing, LO the light going out, RS the reset. */
var SCENES = {
  guest: { name: 'guest', DUR: 14.5, STILL: 6.8, pulses: 3,
    TL: { WK: [3.2, 10.8], WF: [5.4, 7.8], LK: [5.7, 6.4], GT: [7.4, 7.9], DO: [7.8, 8.8], DC: [11.0, 11.9], LO: [11.9, 12.3], RS: [12.5, 13.5] } },
  history: { name: 'history', DUR: 13, STILL: 8.3, pulses: 3,
    TL: { WK: [1.6, 9.4], WF: [3.6, 6.0], LK: [3.9, 4.6], GT: [5.6, 6.1], DO: [6.0, 7.0], DC: [9.6, 10.5], LO: [10.5, 10.9], RS: [11.2, 12.2] } },
  autoopen: { name: 'autoopen', DUR: 12.4, STILL: 5.2, pulses: 2,
    TL: { WK: [1.2, 8.8], WF: [3.9, 5.3], LK: null, GT: [4.3, 4.8], DO: [4.7, 5.7], DC: [9.0, 9.9], LO: [9.9, 10.3], RS: [10.5, 11.5] } },
  events: { name: 'events', DUR: 12.5, STILL: 6.4, pulses: 3,
    TL: { WK: [3.0, 9.0], WF: null, LK: null, GT: [1.9, 2.4], DO: [2.4, 3.4], DC: [9.2, 10.1], LO: [10.1, 10.5], RS: [10.8, 11.8] } },
  rf: { name: 'rf', DUR: 13.5, STILL: 5.6, pulses: 3,
    TL: { WK: [3.6, 10.4], WF: null, LK: null, GT: [4.8, 5.3], DO: [5.2, 6.2], DC: [10.6, 11.5], LO: [11.5, 11.9], RS: [12.0, 13.0] } },
  security: { name: 'security', DUR: 13, STILL: 6.0, pulses: 3, quietLink: true,
    TL: { WK: [1.6, 9.4], WF: [3.6, 6.6], LK: [3.9, 4.6], GT: [6.4, 6.9], DO: [6.8, 7.8], DC: [9.6, 10.5], LO: [10.5, 10.9], RS: [11.2, 12.2] } },
  nofees: { name: 'nofees', DUR: 13, STILL: 7.0, pulses: 3,
    TL: { WK: [2.0, 9.8], WF: [4.0, 6.4], LK: [4.3, 5.0], GT: [6.2, 6.7], DO: [6.6, 7.6], DC: [10.0, 10.9], LO: [10.9, 11.3], RS: [11.4, 12.4] } }
};
export function createGuestScene(svg) { return createFeatureScene(svg, SCENES.guest); }
export function createHistoryScene(svg) { return createFeatureScene(svg, SCENES.history); }
export function createAutoOpenScene(svg) { return createFeatureScene(svg, SCENES.autoopen); }
export function createEventsScene(svg) { return createFeatureScene(svg, SCENES.events); }
export function createRfScene(svg) { return createFeatureScene(svg, SCENES.rf); }
export function createSecurityScene(svg) { return createFeatureScene(svg, SCENES.security); }
export function createNoFeesScene(svg) { return createFeatureScene(svg, SCENES.nofees); }
