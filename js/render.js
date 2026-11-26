/* folkstyle · © 2026 Jay · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Canvas renderer: camera, arena, mat, shadows, bodies, referee and effects. */
const cv = $('c'), g = cv.getContext('2d');
const shade = document.createElement('canvas'), sg = shade.getContext('2d');
let cam = { eye: V(1, 1.9, -2.8), at: V(0, .9, 0), zoom: 1 }, W = 0, H = 0, C;
const NEAR = .25, SOFT = 6;

/* greys only: [lit side, body, shadow side] */
const TONE = {
  skin0: ['#e6e6e6', '#b6b6b6', '#575757'], suit0: ['#ffffff', '#e4e4e4', '#848484'],
  skin1: ['#adadad', '#7b7b7b', '#303030'], suit1: ['#555555', '#2a2a2a', '#0c0c0c'],
  shoe: ['#626262', '#2b2b2b', '#0a0a0a'], hair: ['#4a4a4a', '#222222', '#070707'],
  shirt: ['#ffffff', '#ececec', '#8c8c8c'], refskin: ['#c6c6c6', '#929292', '#454545'], pants: ['#4c4c4c', '#282828', '#0e0e0e'],
  white: ['#ffffff', '#f2f2f2', '#c8c8c8'], black: ['#1a1a1a', '#0c0c0c', '#050505']
};

function resize() {
  const d = Math.min(2, devicePixelRatio || 1);
  W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
  shade.width = Math.max(1, Math.ceil(W / SOFT)); shade.height = Math.max(1, Math.ceil(H / SOFT));
}
new ResizeObserver(resize).observe(cv);

function setCam(dt) {
  const { f, r } = frame(0), mid = mix(F[0].pos, F[1].pos, .5), side = opts.cam === 'side';
  const low = F.some(P => P.down > 0 || P.slip > 0), flying = F.some(airborne), locked = F.some(P => P.lock > 0);
  let eye = side ? add(add(mid, mul(r, 3.2)), V(0, 1.55, 0)) : add(add(add(F[0].pos, mul(f, -.95)), mul(r, 2.35)), V(0, 2.25, 0));
  // swing round to profile so the arch and the slam read clearly
  if (!side && (locked || F.some(P => P.fx && P.fx.pull))) eye = mix(eye, add(add(mid, mul(r, 3)), V(0, 1.45, 0)), .8);
  if (low && !flying) eye = mix(eye, add(mid, V(0, 1.2, 0)), .14);
  const raised = ref.sig || ref.slam > 2 || (ref.win !== null && over > 0 && !ref.slam);
  const at = add(mid, V(0, flying ? 1.2 : raised ? 1.04 : low ? .6 : .84, 0));
  const zoom = flying ? .83 : locked ? 1.1 : low ? 1.08 : 1;
  const t = Math.min(1, dt * 4.5); cam.eye = mix(cam.eye, eye, t); cam.at = mix(cam.at, at, t); cam.zoom = lerp(cam.zoom, zoom, t);
  const fw = norm(sub(cam.at, cam.eye)), rt = norm(cross(V(0, 1, 0), fw)), up = cross(fw, rt);
  C = { fw, rt, up, foc: Math.min(H * 1.08, W * 1.12) * cam.zoom };
}
const toCam = p => { const d = sub(p, cam.eye); return V(dot(d, C.rt), dot(d, C.up), dot(d, C.fw)); };
const flatten = c => ({ x: W / 2 + c.x * C.foc / c.z, y: H / 2 - c.y * C.foc / c.z, k: C.foc / c.z, z: c.z });
function pr(p) { const c = toCam(p); c.z = Math.max(NEAR, c.z); return flatten(c); }

/* flat shapes on the mat, clipped so nothing wraps around behind the camera */
function trace(points) {
  const c = points.map(toCam), out = [];
  c.forEach((a, i) => {
    const b = c[(i + 1) % c.length], ain = a.z > NEAR, bin = b.z > NEAR;
    if (ain) out.push(a);
    if (ain !== bin) out.push(mix(a, b, (NEAR - a.z) / (b.z - a.z)));
  });
  if (out.length < 3) return;
  out.forEach((p, i) => { const s = flatten(p); i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y); });
  g.closePath();
}
const circle = (r, from = 0, to = Math.PI * 2, n = 72, c = V()) => Array.from({ length: n + 1 }, (_, i) => { const a = from + (to - from) * i / n; return V(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r); });
function disc(r, fill) { g.beginPath(); trace(circle(r)); g.fillStyle = fill; g.fill(); }
function band(r0, r1, fill, from = 0, to = Math.PI * 2, n = 72) { g.beginPath(); trace(circle(r0, from, to, n).concat(circle(r1, from, to, n).reverse())); g.fillStyle = fill; g.fill('evenodd'); }
function quad(x0, z0, x1, z1, fill, y = 0) { g.beginPath(); trace([V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1)]); g.fillStyle = fill; g.fill(); }
function ring(c, rad, style, w) { g.strokeStyle = style; g.lineWidth = w; g.beginPath(); circle(rad, 0, Math.PI * 2, 40, c).forEach((q, i) => { const p = pr(q); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.stroke(); }

/* ---------- the crowd in the dark ---------- */
const CROWD = [];
for (let row = 0; row < 3; row++) for (let i = 0, n = 46 + row * 12; i < n; i++) {
  const a = (i + Math.random() * .6) / n * Math.PI * 2, r = 5.5 + row * 1.15 + Math.random() * .25;
  CROWD.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: .55 + row * .46 + Math.random() * .14, ph: Math.random() * 6.3, row, s: .85 + Math.random() * .3 });
}
const SEAT = [['#1d1d1d', '#303030'], ['#161616', '#242424'], ['#101010', '#191919']];
function drawCrowd() {
  const seen = CROWD.map(p => {
    const bob = calm.matches ? 0 : excite * .16 * Math.max(0, Math.sin(T * 9 + p.ph));
    return { p, c: toCam(V(p.x, p.y + bob, p.z)) };
  }).filter(o => o.c.z > 1.4).sort((a, b) => b.c.z - a.c.z);
  for (const { p, c } of seen) {
    const s = flatten(c), u = s.k * p.s;
    if (s.x < -u || s.x > W + u) continue;
    const [body, rim] = SEAT[p.row];
    g.fillStyle = body; g.beginPath(); g.ellipse(s.x, s.y + .33 * u, .25 * u, .27 * u, 0, Math.PI, 0); g.rect(s.x - .25 * u, s.y + .32 * u, .5 * u, .2 * u); g.fill();
    g.beginPath(); g.arc(s.x, s.y, .115 * u, 0, 7); g.fill();
    g.strokeStyle = rim; g.lineWidth = Math.max(1, .018 * u); g.beginPath(); g.arc(s.x, s.y, .11 * u, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    if (FX.flashes.some(q => q.seat === p)) {
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; const k = .13 * u;
      g.beginPath(); g.moveTo(s.x - k, s.y + .1 * u); g.lineTo(s.x + k, s.y + .1 * u); g.moveTo(s.x, s.y + .1 * u - k); g.lineTo(s.x, s.y + .1 * u + k); g.stroke();
    }
  }
}

function drawMat() {
  quad(-3.9, -3.9, 3.9, 3.9, '#0d0d0d');
  g.beginPath(); trace([V(-3.9, 0, -3.9), V(3.9, 0, -3.9), V(3.9, 0, 3.9), V(-3.9, 0, 3.9)]); g.strokeStyle = '#333333'; g.lineWidth = 1.5; g.stroke();
  const mid = pr(V()), spread_ = Math.max(60, mid.k * 3.4);
  const light = g.createRadialGradient(mid.x, mid.y, spread_ * .05, mid.x, mid.y, spread_);
  light.addColorStop(0, '#303030'); light.addColorStop(.55, '#202020'); light.addColorStop(1, '#131313');
  disc(RING, light);
  band(2.35, 2.95, 'rgba(255,255,255,.035)');
  band(2.33, 2.37, '#565656');
  const near = F.some(P => radius(P) > 2.35);
  band(2.95, 3.06, near ? '#ffffff' : '#cfcfcf');
  // the stretch of line someone is flirting with
  F.forEach(P => {
    const r = radius(P); if (r <= 2.35) return;
    const a = Math.atan2(P.pos.z, P.pos.x), k = clamp((r - 2.35) / .65, 0, 1), beat = calm.matches ? 1 : .75 + .25 * Math.sin(T * 12);
    band(3.06, 3.06 + .2 * k * beat, '#ffffff', a - .45, a + .45, 20);
  });
  band(.52, .565, '#8f8f8f');
  quad(-.26, -.2, .26, -.16, '#a9a9a9'); quad(-.26, .16, .26, .2, '#a9a9a9');
}

/* ---------- bodies ---------- */
const RIM = '#dcdcdc';
// a tapered, shaded limb between two screen circles
function tube(p, q, r1, r2, tone, edge = 1.5) {
  const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), R = Math.max(r1, r2, .5);
  const ball = d <= Math.abs(r1 - r2) + .6, big = r1 >= r2 ? p : q;
  g.beginPath();
  if (ball) g.arc(big.x, big.y, R, 0, Math.PI * 2);
  else {
    const a = Math.atan2(dy, dx), o = Math.acos((r1 - r2) / d);
    g.arc(p.x, p.y, r1, a + o, a - o + Math.PI * 2); g.arc(q.x, q.y, r2, a - o, a + o); g.closePath();
  }
  // no tone: just the rim, painted underneath a whole body
  if (!tone) { g.strokeStyle = RIM; g.lineWidth = edge * 2; g.stroke(); return; }
  if (typeof tone === 'string') g.fillStyle = tone;
  else {
    let grad;
    if (ball) grad = g.createRadialGradient(big.x - R * .38, big.y - R * .48, R * .08, big.x, big.y, R * 1.12);
    else {
      let nx = -dy / d, ny = dx / d;
      if (nx * -.45 + ny * -.89 < 0) { nx = -nx; ny = -ny; }
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      grad = g.createLinearGradient(mx + nx * R, my + ny * R, mx - nx * R, my - ny * R);
    }
    grad.addColorStop(0, tone[0]); grad.addColorStop(.45, tone[1]); grad.addColorStop(1, tone[2]);
    g.fillStyle = grad;
  }
  if (edge) { g.strokeStyle = '#050505'; g.lineWidth = edge * 2; g.stroke(); }
  g.fill();
}
function builder(parts, shadows, rim) {
  const part = (a, b, ra, rb, tone, o = {}) => {
    const p = pr(a), q = pr(b);
    const z = (p.z + q.z) / 2 + (o.bias || 0);
    if (rim) rim.push({ z, p, q, ra: ra * p.k, rb: rb * q.k });
    parts.push({ z, draw: () => { tube(p, q, ra * p.k, rb * q.k, tone, o.edge ?? 1.2); if (o.then) o.then(p, q); } });
    if (o.cast !== false) shadows.push([a, b, (ra + rb) / 2]);
  };
  const ball = (a, r, tone, o) => part(a, a, r, r, tone, o);
  return { part, ball };
}
function drawEyes(head, f, r) {
  const toEye = norm(sub(cam.eye, head)), front = dot(f, toEye);
  if (front < .15) return;
  for (const s of [-1, 1]) {
    const e = pr(add(add(add(head, mul(f, .104)), mul(r, s * .04)), V(0, .012, 0)));
    g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(e.x, e.y, Math.max(1, .012 * e.k), 0, 7); g.fill();
  }
}
function headParts(b, head, f, r, skin, gear) {
  b.ball(head, .118, skin, { then: p => {
    // hair sits on the crown
    const R = .118 * p.k, top = pr(add(head, add(V(0, .085, 0), mul(f, -.035))));
    g.save(); g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.clip();
    g.fillStyle = TONE.hair[1]; g.beginPath(); g.ellipse(top.x, top.y, R * 1.05, R * .72, 0, 0, 7); g.fill(); g.restore();
    drawEyes(head, f, r);
  } });
  if (!gear) return;
  const crown = add(head, V(0, .122, 0));
  for (const s of [-1, 1]) {
    const ear = add(add(head, mul(r, s * .112)), V(0, -.008, 0)), hidden = pr(ear).z > pr(head).z + .045;
    if (hidden) continue;
    b.ball(ear, .048, TONE.shoe, { bias: -.14, cast: false, then: p => { g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(p.x, p.y, Math.max(1, .012 * p.k), 0, 7); g.fill(); } });
    b.part(ear, crown, .016, .012, TONE.shoe, { bias: -.13, cast: false, edge: 0 });
  }
}
function wrestler(b, q, i) {
  const skin = TONE['skin' + i], suit = TONE['suit' + i], trim = i ? TONE.white : TONE.black, f = q.f;
  // the body's own left to right, so trim follows it through a flip
  const r = norm(sub(q.sh[1], q.sh[0]));
  for (let k = 0; k < 2; k++) {
    const s = k ? 1 : -1, hip = q.hip[k], knee = q.knee[k], foot = q.foot[k];
    const hem = mix(hip, knee, .58);
    b.part(hip, hem, .108, .083, suit);
    b.part(hem, knee, .079, .057, skin);
    b.part(add(hip, mul(r, s * .085)), add(hem, mul(r, s * .066)), .009, .008, trim, { bias: -.03, edge: 0, cast: false });
    const calf = mix(knee, foot, .32), shin = mix(knee, foot, .66);
    b.part(knee, calf, .056, .07, skin);
    b.part(calf, shin, .07, .046, skin);
    if (k === i) b.part(mix(hip, knee, .84), mix(knee, foot, .14), .072, .068, TONE.shoe, { bias: -.02, cast: false });
    b.part(shin, foot, .05, .058, TONE.shoe);
    b.part(foot, q.toe[k], .058, .042, TONE.shoe, { then: (p, t) => { g.strokeStyle = '#e8e8e8'; g.lineWidth = Math.max(1, .014 * p.k); g.beginPath(); g.moveTo(p.x, p.y + .046 * p.k); g.lineTo(t.x, t.y + .034 * t.k); g.stroke(); } });
    // the ankle band: green on one wrestler, red on the other
    if (k === (i ? 0 : 1)) b.part(mix(knee, foot, .63), mix(knee, foot, .77), .067, .064, BAND[i], { bias: -.09, edge: 1.6, cast: false });
    const sh = q.sh[k], el = q.el[k], hand = q.hand[k], reach = norm(sub(hand, el));
    b.ball(sh, .096, skin);
    b.part(sh, el, .077, .05, skin);
    b.part(el, hand, .056, .032, skin);
    b.part(hand, add(hand, mul(reach, .075)), .047, .036, skin, { bias: -.02 });
    b.part(mix(sh, q.chest, .42), add(mix(q.chest, q.hipC, .42), mul(r, s * .07)), .036, .05, suit, { bias: -.06, edge: 0, cast: false });
  }
  const waist = mix(q.hipC, q.chest, .46);
  b.part(q.hip[0], q.hip[1], .112, .112, suit);
  b.part(q.hipC, waist, .132, .134, suit);
  b.part(waist, q.chest, .134, .172, suit);
  b.part(q.sh[0], q.sh[1], .082, .082, skin, { bias: .03 });
  for (const s of [-1, 1]) b.part(add(q.hipC, mul(r, s * .1)), add(waist, mul(r, s * .115)), .01, .01, trim, { bias: -.07, edge: 0, cast: false });
  b.part(q.chest, q.head, .072, .056, skin, { bias: .02 });
  headParts(b, q.head, norm(add(f, V(0, 0, 0))), r, skin, true);
}
function official(b, R) {
  const across = norm(cross(sub(R.chest, R.hip), C.fw)), look = norm(V(F[0].pos.x - R.head.x, 0, F[0].pos.z - R.head.z));
  for (let k = 0; k < 2; k++) {
    const s = k ? 1 : -1, sh = add(R.chest, mul(across, s * .17)), hip = add(R.hip, mul(across, s * .095));
    const knee = mix(hip, R.foot[k], .5), el = add(mix(sh, R.hand[k], .5), V(0, -.07, 0));
    b.part(hip, knee, .09, .066, TONE.pants); b.part(knee, R.foot[k], .066, .046, TONE.pants);
    b.part(R.foot[k], add(R.foot[k], mul(look, .13)), .055, .042, TONE.black);
    b.part(sh, el, .075, .05, TONE.shirt); b.part(el, R.hand[k], .046, .032, TONE.refskin); b.ball(R.hand[k], .047, TONE.refskin);
    b.part(mix(el, R.hand[k], .64), mix(el, R.hand[k], .86), .054, .05, BAND[k], { bias: -.09, edge: 1.6, cast: false });
  }
  b.part(R.hip, R.chest, .14, .18, TONE.shirt, { then: (p, q) => {
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = -(q.y - p.y) / d, ny = (q.x - p.x) / d;
    g.strokeStyle = '#0b0b0b'; g.lineCap = 'butt';
    for (const o of [-.56, 0, .56]) { g.lineWidth = .04 * p.k; g.beginPath(); g.moveTo(p.x + nx * .14 * p.k * o, p.y + ny * .14 * p.k * o); g.lineTo(q.x + nx * .18 * q.k * o, q.y + ny * .18 * q.k * o); g.stroke(); }
    g.lineCap = 'round';
  } });
  b.part(R.chest, R.head, .062, .05, TONE.refskin, { bias: .02 });
  headParts(b, R.head, look, across, TONE.refskin, false);
}
function drawShadows(shadows) {
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, shade.width, shade.height);
  sg.setTransform(1 / SOFT, 0, 0, 1 / SOFT, 0, 0); sg.strokeStyle = '#000'; sg.lineCap = 'round';
  const floor = p => V(p.x + p.y * .16, 0, p.z + p.y * .12);
  for (const [a, b, r] of shadows) {
    const p = pr(floor(a)), q = pr(floor(b));
    sg.lineWidth = r * (p.k + q.k) * 1.05; sg.beginPath(); sg.moveTo(p.x, p.y); sg.lineTo(q.x + .01, q.y); sg.stroke();
  }
  g.globalAlpha = .46; g.imageSmoothingQuality = 'high'; g.drawImage(shade, 0, 0, W, H); g.globalAlpha = 1;
}

/* ---------- effects ---------- */
const FX = {
  dust: [], rings: [], sweat: [], trails: [[], []], flashes: [], shake: 0,
  clear() { this.dust = []; this.rings = []; this.sweat = []; this.trails = [[], []]; this.flashes = []; this.shake = 0; },
  burst(at, k) {
    for (let i = 0, n = Math.round(10 + 26 * k); i < n; i++) {
      const a = Math.random() * 6.283, s = .4 + Math.random() * 1.8 * k;
      this.dust.push({ p: V(at.x, .05, at.z), v: V(Math.cos(a) * s, .2 + Math.random() * 1.1 * k, Math.sin(a) * s), t: 0, life: .4 + Math.random() * .5, r: .015 + Math.random() * .035 });
    }
    this.rings.push({ at: V(at.x, .01, at.z), t: 0, k });
    if (k >= .4) this.shake = Math.max(this.shake, k);
  },
  step(dt) {
    this.shake = Math.max(0, this.shake - dt * 2.6);
    for (const list of [this.dust, this.sweat]) for (const d of list) { d.t += dt; d.v.y -= 3.2 * dt; d.p = add(d.p, mul(d.v, dt)); if (d.p.y < .02) { d.p.y = .02; d.v = mul(d.v, .6); d.v.y = 0; } }
    this.dust = this.dust.filter(d => d.t < d.life); this.sweat = this.sweat.filter(d => d.t < d.life);
    this.rings.forEach(r => r.t += dt); this.rings = this.rings.filter(r => r.t < .7);
    this.flashes.forEach(f => f.t -= dt); this.flashes = this.flashes.filter(f => f.t > 0);
    if (!calm.matches && excite > .45 && Math.random() < dt * 3) this.flashes.push({ seat: CROWD[Math.random() * CROWD.length | 0], t: .09 });
    F.forEach((P, i) => {
      const trail = this.trails[i];
      if (airborne(P) && P.pose) trail.push([P.pose.head, P.pose.foot[0], P.pose.foot[1]]); else trail.shift();
      while (trail.length > 12) trail.shift();
      if (P.cond < .35 && P.pose && Math.random() < dt * (1 - P.cond) * 5) this.sweat.push({ p: add(P.pose.head, V((Math.random() - .5) * .2, .05, (Math.random() - .5) * .2)), v: V((Math.random() - .5) * .5, .4, (Math.random() - .5) * .5), t: 0, life: .55 });
    });
  }
};
function drawTrails() {
  if (calm.matches) return;
  for (const trail of FX.trails) for (let j = 0; j < 3; j++) for (let n = 1; n < trail.length; n++) {
    const p = pr(trail[n - 1][j]), q = pr(trail[n][j]);
    g.strokeStyle = 'rgba(255,255,255,' + (n / trail.length * .35).toFixed(3) + ')'; g.lineWidth = .09 * q.k * n / trail.length;
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
}
function drawParticles() {
  for (const r of FX.rings) { const k = r.t / .7; ring(r.at, .25 + k * 1.5 * r.k, 'rgba(236,236,236,' + ((1 - k) * .75).toFixed(3) + ')', 2); }
  for (const d of FX.dust) { const p = pr(d.p); g.fillStyle = 'rgba(210,210,210,' + ((1 - d.t / d.life) * .55).toFixed(3) + ')'; g.beginPath(); g.arc(p.x, p.y, d.r * p.k, 0, 7); g.fill(); }
  for (const d of FX.sweat) { const p = pr(d.p); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(p.x, p.y, Math.max(1, .008 * p.k), Math.max(1.5, .016 * p.k), 0, 0, 7); g.fill(); }
}

function tag(x, y, w, h) { g.fillStyle = '#060606'; g.fillRect(x, y, w, h); g.strokeStyle = '#ececec'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h); g.fillStyle = '#ececec'; }
function draw() {
  const sky = g.createRadialGradient(W / 2, H * .12, 10, W / 2, H * .35, Math.max(W, H) * .8);
  sky.addColorStop(0, '#121212'); sky.addColorStop(1, '#030303');
  g.fillStyle = sky; g.fillRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
  g.save();
  if (!calm.matches && FX.shake > 0) { const k = FX.shake * FX.shake * 11; g.translate(Math.sin(T * 91) * k, Math.cos(T * 73) * k); }
  drawCrowd(); drawMat();
  const parts = [], shadows = [], b = builder(parts, shadows);
  F.forEach((P, i) => {
    if (!P.pose) return;
    if (!i) return wrestler(b, P.pose, i);
    // the dark one gets a light outline: stroke his whole shape first, then paint him over it
    const rim = [];
    wrestler(builder(parts, shadows, rim), P.pose, i);
    parts.push({ z: Math.max(...rim.map(s => s.z)) + .01, draw: () => rim.forEach(s => tube(s.p, s.q, s.ra, s.rb, null, 3.1)) });
  });
  if (ref.now) official(b, ref.now);
  drawShadows(shadows);
  if (opts.mode !== 'watch' && !airborne(F[0])) ring(V(F[0].pos.x, 0, F[0].pos.z), .36, 'rgba(236,236,236,.4)', 1.5);
  drawTrails();
  parts.sort((a, c) => c.z - a.z);
  for (const s of parts) s.draw();
  drawParticles();
  // fingers and the number beside the raised wristband
  const R = ref.now, sig = ref.sig;
  g.font = '600 22px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (R && sig && !ref.slam && over <= 0) {
    const h = pr(R.hand[sig.i]), L = .15 * h.k, n = Math.min(4, sig.n);
    for (let j = 0; j < n; j++) {
      const a = (j - (n - 1) / 2) * .38;
      for (const [col, w] of [['#060606', .04 * h.k + 3], ['#a8a8a8', .04 * h.k]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.sin(a) * L, h.y - Math.cos(a) * L); g.stroke(); }
    }
    const x = h.x + (sig.i ? 1 : -1) * 34, y = h.y - L;
    g.fillStyle = '#060606'; g.fillRect(x - 22, y - 15, 44, 30); g.strokeStyle = BAND[sig.i]; g.lineWidth = 2; g.strokeRect(x - 22, y - 15, 44, 30); g.fillStyle = '#ececec'; g.fillText('+' + sig.n, x, y + 1);
  }
  // hand markers stay on top so they are never lost behind a body
  g.font = '600 11px "IBM Plex Mono", monospace';
  if (opts.mode !== 'watch' && over <= 0 && !F.some(airborne)) F[0].hands.forEach((h, k) => {
    if (!h) return;
    const p = pr(h), on = F[0].grip[k] !== null;
    tag(p.x - 8, p.y - 8, 16, 16); if (on) g.fillRect(p.x - 8, p.y - 8, 16, 16);
    g.fillStyle = on ? '#060606' : '#ececec'; g.fillText(k ? 'R' : 'L', p.x, p.y + 1);
    if (!on && !busy(F[0])) {
      const near = F[1].hands.find(w => w && len(sub(w, h)) < GRAB);
      if (near) { const q = pr(near); g.strokeStyle = '#ececec'; g.setLineDash([4, 4]); g.strokeRect(q.x - 15, q.y - 15, 30, 30); g.setLineDash([]); g.fillStyle = '#ececec'; g.fillText('GRAB', q.x, q.y - 25); }
    }
  });
  F.forEach((P, i) => {
    const caught = P.caught > 0;
    if (over > 0 || airborne(P) || !(P.slip > 0 || P.down > 0 || caught)) return;
    const q = pr(P.pose.head), x = clamp(q.x - 60, 8, W - 134), y = Math.max(62, q.y - 58);
    tag(x - 6, y - 20, 132, 40); g.strokeRect(x, y, 120, 12); g.fillRect(x, y, 120 * P.up, 12);
    const bot = opts.mode === 'watch' || (i && joined === null);
    const left = P.down > 0 ? '  ' + Math.max(0, PIN - P.floor).toFixed(1) : '';
    g.fillText(caught ? (bot ? 'FIGHTING IT' : 'MASH X TO BREAK') : (bot ? (left ? 'PIN' : 'GETTING UP') : 'MASH X') + left, x + 60, y - 9);
  });
  if (opts.mode !== 'watch') F[1].grip.forEach(j => { if (j !== null && F[0].hands[j]) { const q = pr(F[0].hands[j]); g.strokeStyle = '#ececec'; g.lineWidth = 2; g.strokeRect(q.x - 14, q.y - 14, 28, 28); g.fillStyle = '#ececec'; g.fillText('HELD', q.x, q.y - 24); } });
  if (opts.mode !== 'watch' && over <= 0 && radius(F[0]) > 2.45) { const q = pr(V(F[0].pos.x, 0, F[0].pos.z)), y = Math.min(H - 14, q.y + 22); tag(q.x - 52, y - 10, 104, 20); g.fillText('ON THE LINE', q.x, y + 1); }
  g.restore();
}
