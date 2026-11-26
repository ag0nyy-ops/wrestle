/* folkstyle · © 2026 Jay · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Rules, input, dummies, referee and the page controls. */
const { find: findMove, lands, level } = HFM;
const STORE = 'folkstyle';

const opts = { mode: 'fight', lh: 'stick', cam: 'behind', coach: 'on', sound: 'on' };
let fresh = true;
try { const s = localStorage.getItem(STORE); if (s) { Object.assign(opts, JSON.parse(s)); fresh = false; } } catch (e) {}
// phones can't play without a pad, so open on something to watch
if (fresh && matchMedia('(pointer: coarse)').matches) { opts.mode = 'watch'; opts.cam = 'side'; }
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(opts)); } catch (e) {} };

const blankIn = () => ({ h: [{ x: 0, y: 0 }, { x: 0, y: 0 }], drop: [0, 0], grip: [false, false], mash: 0, sq: 0, ci: 0, tri: 0 });
function fighter(z) {
  return { pos: V(0, 0, z), drop: [0, 0], bal: 0, gas: 1, cond: 1, cap: 1, tank: 1, score: 0, lean: V(), shove: V(), input: blankIn(),
    up: 0, floor: 0, tried: false, gcd: 0, guard: 0, gm: null, move: null, slip: 0, sprawl: 0, shot: 0, down: 0, top: 0, lock: 0, caught: 0,
    rest: 0, single: -1, setup: false, wasUp: false, wasDown: false, armed: true, downed: false, walked: 0,
    lunge: 0, flat: 0, ride: 0, fall: 0, over: 0, arch: 0, lift: 0, breath: Math.random() * 6, effort: [0, 0],
    hands: [null, null], intent: [null, null], grip: [null, null], prevGrip: [false, false], strain: [0, 0], body: null, pose: null, fx: null };
}
let F = [fighter(-.68), fighter(.68)], msgT = 0, callT = 0, clock = 120, live = false, over = 0, slow = 0, excite = 0, joined = null;

const busy = P => !!P.move || P.slip > 0 || P.sprawl > 0 || P.shot > 0 || P.down > 0 || P.top > 0 || P.lock > 0 || P.caught > 0;
const grounded = P => P.slip > 0 || P.sprawl > 0 || P.down > 0 || P.top > 0;
const spread = () => Math.hypot(F[1].pos.x - F[0].pos.x, F[1].pos.z - F[0].pos.z);
const grips = P => P.grip.filter(x => x !== null).length;
const power = P => .55 + .45 * P.cond;
const radius = P => Math.hypot(P.pos.x, P.pos.z);
const airborne = P => !!(P.fx && !P.fx.archOnly && P.fx.h > .5);

function nm(i) { return opts.mode === 'watch' ? 'dummy ' + 'ab'[i] : joined !== null ? 'player ' + (i + 1) : i ? 'dummy' : 'you'; }
const is = (i, one, many) => nm(i) + ' ' + (nm(i) === 'you' ? many : one);
function say(t, d = 1.6) { $('msg').textContent = t; $('msg').hidden = false; msgT = d; }
function call(name, sub = '', d = 1.5) {
  const el = $('call');
  el.querySelector('b').textContent = name; el.querySelector('span').textContent = sub;
  el.hidden = true; void el.offsetWidth; el.hidden = false; callT = d;
}

/* conditioning: everything costs something, and the ceiling sinks the more you burn */
function spend(P, amount) {
  const a = amount * P.tank;
  P.cond = Math.max(0, P.cond - a);
  P.cap = Math.max(.5, P.cap - a * .055);
}

/* ---------- what you can do right now ---------- */
function context(P, O) {
  if (P.lock > 0) return 'lock';
  if (P.sprawl > 0 && O.slip > 0) return 'top';
  if (P.top > 0 && O.down > 0) return 'pin';
  if (P.slip > 0 && O.sprawl > 0) return 'bottom';
  if (P.down > 0 && O.top > 0) return 'back';
  if (P.caught > 0) return 'locked';
  if (O.shot > .1 && !busy(P)) return 'counter';
  if (!busy(P) && !busy(O)) return 'stand';
  return null;
}
// which way the hands are leaning: n resting, f forward, b back, s sideways
function dirOf(In) {
  if (In.dir) return In.dir;
  const x = (In.h[0].x + In.h[1].x) / 2, y = (In.h[0].y + In.h[1].y) / 2;
  if (Math.abs(y) > .4 && Math.abs(y) >= Math.abs(x)) return y > 0 ? 'f' : 'b';
  return Math.abs(x) > .4 ? 's' : 'n';
}
const slot = (P, b, dir) => ({ g: grips(P), lvl: level(P) >= .45 ? 'low' : 'tall', b, dir });
function pickMove(P, O, b) { const pos = context(P, O); return pos && pos !== 'locked' ? findMove(pos, slot(P, b, dirOf(P.input))) : null; }

/* ---------- input ---------- */
const keys = new Set(), used = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyQ', 'KeyO', 'KeyE', 'KeyU', 'ShiftLeft', 'ShiftRight', 'Space'];
let taps = 0, face = { sq: 0, ci: 0, tri: 0 }, resetHeld = false;
addEventListener('keydown', e => {
  SFX.unlock();
  const onControl = e.target.closest && e.target.closest('button,summary,a,input');
  if (e.code === 'Space') { if (onControl) return; if (!e.repeat) taps++; }
  const fk = { Digit1: 'sq', Digit2: 'ci', Digit3: 'tri' }[e.code];
  if (fk && !e.repeat && !e.ctrlKey && !e.metaKey) { face[fk] = 1; e.preventDefault(); }
  if (used.includes(e.code) && !e.ctrlKey && !e.metaKey) { keys.add(e.code); e.preventDefault(); }
});
addEventListener('pointerdown', () => SFX.unlock());
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const padState = {};
function pads() { try { return [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(p => p && p.connected); } catch (e) { return []; } }
function stick(x, y) { const m = Math.hypot(x, y), dz = .14; if (m < dz) return { x: 0, y: 0 }; const k = Math.min(1, (m - dz) / (.95 - dz)) / m; return { x: x * k, y: y * k }; }
const trig = v => clamp((v - .15) / .83, 0, 1);
function unit(x, y) { const m = Math.hypot(x, y); return m > 1 ? { x: x / m, y: y / m } : { x, y }; }
function readPad(p, dt, isP1) {
  const b = i => p.buttons[i] ? p.buttons[i].value : 0, a = i => p.axes[i] || 0;
  let s = padState[p.index];
  if (!s) s = padState[p.index] = { age: 0, stuckFor: 0, stuck: false };
  // a stick pinned from the moment the pad shows up is treated as broken
  s.age += dt;
  if (s.age < 2) {
    s.stuckFor = Math.hypot(a(0), a(1)) > .6 ? s.stuckFor + dt : 0;
    if (s.stuckFor > 1 && !s.stuck) { s.stuck = true; if (isP1) { opts.lh = 'dpad'; sync(); say('left stick stuck: using d-pad', 3.5); } }
  }
  const useD = isP1 ? opts.lh === 'dpad' : s.stuck;
  const edge = (i, n) => { const on = b(i) > .5, hit = on && !s[n] ? 1 : 0; s[n] = on; return hit; };
  const mash = edge(0, 'x'), sq = edge(2, 'sq'), ci = edge(1, 'ci'), tri = edge(3, 'tri');
  const L = useD ? unit(b(15) - b(14), b(12) - b(13)) : stick(a(0), -a(1));
  return { h: [L, stick(a(2), -a(3))], drop: [trig(b(6)), trig(b(7))], grip: [b(4) > .5, b(5) > .5], mash, sq, ci, tri, reset: b(9) > .5 };
}
function readKeys() {
  const mash = taps; taps = 0; const fc = face; face = { sq: 0, ci: 0, tri: 0 };
  const k = c => keys.has(c) ? 1 : 0, deep = k('ShiftLeft') || k('ShiftRight') ? 1 : .8;
  return { h: [unit(k('KeyD') - k('KeyA'), k('KeyW') - k('KeyS')), unit(k('KeyL') - k('KeyJ'), k('KeyI') - k('KeyK'))], drop: [k('KeyQ') * deep, k('KeyO') * deep], grip: [!!k('KeyE'), !!k('KeyU')], mash, ...fc };
}
function gather(dt) {
  const all = pads(), kb = readKeys();
  if (all[1] && all[1].buttons[9] && all[1].buttons[9].value > .5) joined = all[1].index;
  const P = all.filter((p, i) => i === 0 || p.index === joined);
  let a = kb;
  if (P[0]) {
    const p = readPad(P[0], dt, true);
    a = { h: [0, 1].map(i => unit(p.h[i].x + kb.h[i].x, p.h[i].y + kb.h[i].y)), drop: [0, 1].map(i => Math.max(p.drop[i], kb.drop[i])), grip: [0, 1].map(i => p.grip[i] || kb.grip[i]), mash: p.mash + kb.mash, sq: p.sq || kb.sq, ci: p.ci || kb.ci, tri: p.tri || kb.tri };
    if (p.reset && !resetHeld) reset(); resetHeld = p.reset;
  }
  const watch = opts.mode === 'watch';
  F[0].input = watch ? dummy(0, dt) : a;
  F[1].input = P[1] && !watch ? readPad(P[1], dt, false) : dummy(1, dt);
  $('pad').textContent = P.length ? (P.length > 1 ? '2 controllers: player two is live' : 'controller connected') : 'no controller seen. press a button, or use the keyboard';
}

/* ---------- dummies: each one is rolled from a seed, so no two wrestle alike ---------- */
function rng(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function newSeed() { try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch (e) { return Math.random() * 4294967296 >>> 0; } }
function makeBot(seed) {
  const R = rng(seed), rand = (a, b) => a + (b - a) * R();
  const p = { pace: rand(2.4, 6), grab: rand(0, 1), counter: rand(.2, .65), sprawl: rand(.3, .75), stance: rand(.12, .45), amp: rand(.15, .35), mash: rand(6, 8.6), think: rand(.9, 2.2), gap: rand(1.08, 1.35), react: rand(.35, .6), depth: rand(.68, .88),
    arch: rand(.2, 1), gamble: rand(.08, .3), tank: rand(.82, 1.18), edge: rand(1.9, 2.55), push: rand(.1, .8),
    f: [rand(.6, 2.1), rand(.6, 2.1), rand(.6, 2.1), rand(.6, 2.1), rand(.4, 1.1), rand(.4, 1.1), rand(.35, .9)] };
  const style = p.arch > .75 ? 'slammer' : p.push > .62 ? 'pusher' : p.pace < 3.4 ? 'shooter' : p.grab > .65 ? 'hand fighter' : p.sprawl > .58 ? 'counter wrestler' : 'all rounder';
  return { seed, R, rand, p, style, tag: seed.toString(16).toUpperCase().padStart(8, '0').slice(0, 4), t: rand(0, 100), atk: rand(1, p.pace), cool: [rand(.2, .9), rand(.2, 1.1)], grab: [0, 0], react: 0, slip: rand(14, 34), mv: rand(.6, p.think * 2), counter: null, stance: null, guard: null, rate: 0, press: 0, hit: 0, gas: false, dir: R() < .5 ? 1 : -1, shape: null };
}
let bots = [makeBot(newSeed()), makeBot(newSeed())];
const DIRS = ['n', 'f', 'b', 's'], BUTTONS = ['sq', 'ci', 'tri'];
const HAND = { n: [0, 0], f: [0, .6], b: [0, -.6], s: [.6, 0] };
// every move reachable from where this wrestler stands, with whether it would work right now
function choices(me, you, pos) {
  const list = [];
  for (const b of BUTTONS) for (const dir of DIRS) {
    const m = findMove(pos, slot(me, b, dir));
    if (!m || list.some(c => c.m === m)) continue;
    let ok;
    if (m.fx) { const meter = pos === 'bottom' || pos === 'back' ? me.up : you.up; ok = meter >= m.min && meter <= m.max; }
    else ok = lands(m, me, you);
    list.push({ b, dir, m, ok });
  }
  return list;
}
const press = (o, c) => { o[c.b] = 1; o.dir = c.dir; };
// a stance that stops the move coming at you, if one exists
function answer(m, them, me) {
  for (const [d, y] of [[.75, 0], [0, 0], [0, .6], [0, -.6], [.75, .6], [.75, -.6]]) {
    const ghost = { ...me, drop: [d, d], input: { h: [{ x: 0, y }, { x: 0, y }] } };
    if (!lands(m, them, ghost)) return { d, y };
  }
  return null;
}
function dummy(i, dt) {
  const ai = bots[i], p = ai.p, R = ai.R, me = F[i], you = F[1 - i], fight = opts.mode === 'watch' || opts.mode === 'fight', o = blankIn(), w = Math.sin;
  const t = ai.t += dt;
  const ctx = context(me, you), pickOne = l => l[Math.floor(R() * l.length)];
  me.tank = p.tank;
  if (me.slip > 0 || me.down > 0 || me.caught > 0) {
    if (!ai.rate) ai.rate = opts.mode === 'still' ? 3.4 : p.mash * ai.rand(.8, 1.2) * (me.caught > 0 ? .7 : 1);
    if ((ai.press += ai.rate * (me.down > 0 ? 1.3 : 1) * dt) >= 1) { ai.press -= 1; o.mash = 1; }
  } else { ai.rate = 0; ai.press = 0; }
  // the mat
  if (ctx === 'top' || ctx === 'pin' || ctx === 'bottom' || ctx === 'back') {
    if (fight && me.gcd <= 0 && !me.gm && R() < dt * (ctx === 'pin' ? .4 : ctx === 'top' ? .6 : .55)) {
      const all = choices(me, you, ctx), good = all.filter(c => c.ok);
      if (good.length) press(o, pickOne(good));
    }
    return o;
  }
  if (me.top > 0 || me.sprawl > 0 || me.slip > 0 || me.down > 0) return o;
  // body lock: arch and throw, or fight it off
  if (ctx === 'lock') {
    o.drop = [.35, .35];
    if (!me.gm && (ai.hit += dt) > p.react + .15) {
      const all = choices(me, you, 'lock'), big = all.filter(c => c.ok && c.m.pts >= 4), good = all.filter(c => c.ok);
      const c = big.length && R() < p.arch ? pickOne(big) : good.length ? pickOne(good) : pickOne(all);
      if (c) { press(o, c); ai.hit = 0; }
    }
    return o;
  }
  ai.hit = 0;
  if (me.move || me.gm) { o.grip = me.grip.map(x => x !== null); o.drop = me.drop.slice(); return o; }
  const coming = you.move?.m || (you.lock > 0 && you.gm?.m);
  if (coming) {
    if (ai.counter === null) { ai.counter = fight && R() < p.counter; ai.stance = ai.counter ? answer(coming, you, me) : null; }
    if (ai.stance) { o.drop = [ai.stance.d, ai.stance.d]; o.h = [{ x: 0, y: ai.stance.y }, { x: 0, y: ai.stance.y }]; }
    return o;
  }
  ai.counter = null; ai.stance = null;
  if (me.caught > 0) { o.drop = [.2, .2]; return o; }
  if (you.shot > 0) {
    if (ai.guard === null) { const chance = fight ? p.sprawl : opts.mode === 'move' ? .25 : 0; ai.guard = R() < chance ? (fight && R() < .4 ? 'counter' : 'sprawl') : 'none'; }
    if (ai.guard === 'sprawl' && you.shot < .38 && !busy(me)) { o.h = [{ x: 0, y: -1 }, { x: 0, y: -1 }]; return o; }
    if (ai.guard === 'counter' && you.shot < .5 && you.shot > .22 && ctx === 'counter') {
      const good = choices(me, you, 'counter').filter(c => c.ok);
      if (good.length) { press(o, pickOne(good)); ai.guard = 'none'; return o; }
    }
  } else ai.guard = null;
  if (you.slip > 0 && !you.downed && me.slip <= 0) { ai.react += dt; if (ai.react > p.react) o.h = [{ x: 0, y: -1 }, { x: 0, y: -1 }]; return o; }
  ai.react = 0;
  if (opts.mode === 'still') return o;
  const q = p.f;
  // blown: stand up, back off, breathe
  if (me.cond < .22) ai.gas = true; else if (me.cond > Math.min(.45, me.cap - .08)) ai.gas = false;
  const stance = ai.gas ? .08 : p.stance;
  o.drop = [clamp(stance + .3 * w(t * q[4]) * (ai.gas ? .2 : 1), 0, .9), clamp(stance + .3 * w(t * q[5] + 2) * (ai.gas ? .2 : 1), 0, .9)];
  o.h = [{ x: p.amp * w(t * q[0]), y: p.amp * w(t * q[1] + 1) }, { x: p.amp * w(t * q[2] + 3), y: p.amp * w(t * q[3]) }];
  if (!fight || !me.body || !you.body) return o;
  if (me.shot > 0) { o.drop = [p.depth, p.depth]; return o; }
  if (busy(me) || busy(you)) return o;
  if (!ai.gas && (ai.slip -= dt) < 0) { if (ai.slip < -.6) ai.slip = ai.rand(18, 40); if (me.cond < .6) { o.drop = [1, 1]; return o; } }
  // footwork: close in when far, give ground when jammed, circle in bursts, stay off the line
  const gap = spread();
  o.walk = gap > p.gap ? 1 : gap < p.gap - .28 ? -1 : 0;
  o.circle = w(t * q[6]) > .5 ? ai.dir : w(t * q[6]) < -.65 ? -ai.dir : 0;
  if (R() < dt * .15) ai.dir *= -1;
  if (ai.gas) { o.walk = gap < 1.5 ? -1 : 0; }
  // some of them like to walk you out
  if (!ai.gas && (radius(you) > 1.5 && w(t * 1.3 + p.push * 9) < p.push * 1.7 - .6 || w(t * .8 + p.push * 5) < p.push - .85)) o.walk = 1;
  // tired legs lose track of the line
  const r = radius(me);
  if (r > p.edge + (1 - me.cond) * .45) {
    const d = norm(sub(you.pos, me.pos)), right = V(d.z, 0, -d.x), out = norm(me.pos), ahead = dot(d, out), side = dot(right, out);
    o.walk = ahead < -.3 ? 1 : ahead > .3 ? -1 : o.walk;
    o.circle = Math.abs(side) > .3 ? -Math.sign(side) : ai.dir;
  }
  if (!ai.gas && (ai.atk -= dt) < 0 && gap < 1.6) {
    if (!ai.shape) { const k = R(); ai.shape = k < .5 ? [p.depth, p.depth] : k < .75 ? [.95, .5] : [.5, .95]; }
    o.drop = ai.shape; const go = ai.atk < -.35; o.h = [{ x: 0, y: go ? 1 : 0 }, { x: 0, y: go ? 1 : 0 }];
    if (ai.atk < -.6) { ai.atk = p.pace * ai.rand(.7, 1.9); ai.shape = null; }
    return o;
  }
  for (let k = 0; k < 2; k++) {
    ai.cool[k] -= dt;
    const j = 1 - k, target = you.hands[j];
    if (me.grip[k] !== null) {
      ai.grab[k] -= dt; o.grip[k] = ai.grab[k] > 0; o.h[k] = { x: (k ? .5 : -.5) * w(t * 2.2), y: -.8 };
      if (!o.grip[k]) ai.cool[k] = ai.rand(.3, 1.8 - p.grab);
    } else if (ai.cool[k] < 0 && target && !ai.gas) {
      const d = sub(target, me.body.sh[k]);
      o.h[k] = unit(clamp(dot(d, me.body.r) / .45, -1, 1) * .8, clamp((dot(d, me.body.f) - .32) / .35, -1, .8));
      // tap the grip off and on so every attempt is a fresh grab
      if (len(sub(me.hands[k], target)) < GRAB && !me.prevGrip[k]) { o.grip[k] = true; ai.grab[k] = ai.rand(.6, 1.4 + p.grab); }
      if (ai.cool[k] < -1.8) ai.cool[k] = ai.rand(.3, .9);
    }
    // yank free when held
    if (you.grip.some(gr => gr === k)) o.h[k] = { x: w(t * 9 + k) * .9, y: -.7 };
  }
  // pick a move: mostly one that would land, sometimes a gamble, locks first if this one likes to throw
  if (!ai.gas && (ai.mv -= dt) < 0 && gap < 1.55) {
    const all = choices(me, you, 'stand').filter(c => me.cond > c.m.cost), good = all.filter(c => c.ok);
    const locks = good.filter(c => c.m.to === 'lock'), shoves = (radius(you) > 1.25 ? all : []).filter(c => c.m.shove);
    const c = shoves.length && R() < .25 + p.push * .7 ? pickOne(shoves) : locks.length && R() < .35 + p.arch * .6 ? pickOne(locks) : R() < p.gamble ? pickOne(all) : good.length ? pickOne(good) : null;
    if (c) { press(o, c); o.grip = me.grip.map(x => x !== null); ai.mv = p.think * ai.rand(1.1, 2.4); } else ai.mv = .3;
  }
  return o;
}

/* ---------- state changes ---------- */
function clearGround() { F.forEach(P => { P.slip = P.down = P.sprawl = P.top = P.shot = P.up = P.floor = P.gcd = P.guard = P.bal = P.lock = P.caught = 0; P.move = P.gm = null; P.grip = [null, null]; P.tried = false; }); }
function toStomach(a, d) { clearGround(); d.slip = a.sprawl = 1; d.downed = true; d.armed = false; }
function toBack(a, d) { clearGround(); d.down = a.top = 1; d.downed = true; d.armed = false; }
function startLock(a, d) { clearGround(); a.lock = d.caught = 2.1; d.shove = V(); SFX.arch(); call('back arch', nm(F.indexOf(a)) + ' locked up', .9); }

/* ---------- animation of a landed move ---------- */
// h: how high they fly, turns: full rotations, axis: end over end (flip), sideways (roll) or along the body (log)
const ANIM = {
  slam: { dur: .8, h: 1.08, turns: 1, axis: 'flip', pull: 1, arch: 1, k: 1 },
  flip: { dur: .68, h: .95, turns: -1, axis: 'flip', pull: .6, arch: .5, k: .85 },
  throw: { dur: .6, h: .8, turns: 1, axis: 'roll', pull: .5, arch: .3, k: .75 },
  carry: { dur: .72, h: .95, turns: 1, axis: 'roll', pull: .9, arch: .2, k: .8 },
  trip: { dur: .32, h: .18, turns: 0, axis: 'roll', pull: 0, arch: 0, k: .35 },
  drag: { dur: .26, h: .02, turns: 0, axis: 'roll', pull: 0, arch: 0, k: .2 },
  roll: { dur: .55, h: .24, turns: 1, axis: 'log', pull: 0, arch: 0, k: .45 }
};
function animate(d, a, kind, from) {
  const A = ANIM[kind] || ANIM.drag;
  if (from) d.fx = { ...A, t: 0, from, partner: a, quiet: false };
  if (a && A.arch && a.pose) a.fx = { dur: A.dur, t: 0, archOnly: A.arch, from: a.pose };
  if (A.h > .5) { SFX.whoosh(); SFX.grunt(); if (A.k >= .8 && !calm.matches) slow = .62; }
}
function impact(P, k) {
  const c = P.body ? P.body.chest : P.pos;
  if (k >= .7) { SFX.slam(k); FX.burst(V(c.x, 0, c.z), k); excite = 1; }
  else if (k >= .3) { SFX.thud(); FX.burst(V(c.x, 0, c.z), k); excite = Math.max(excite, .55); }
  else SFX.thud();
}

function finish(winner, text, kind) {
  if (over > 0) return;
  over = 4.2; live = false; ref.win = winner; excite = 1;
  say(text, 4.2);
  if (kind === 'pin') { ref.slam = .001; call('pin', is(winner, 'wins', 'win') + ' by fall', 3); }
  else if (kind === 'out') { SFX.whistle(2); SFX.crowd(.8); call('out of the circle', is(winner, 'wins', 'win'), 3); }
  else { SFX.buzzer(); call(kind === 'time' ? 'time' : 'tech fall', winner === null ? 'tie' : is(winner, 'wins', 'win'), 3); }
}

// a standing move, a lock slam or a counter has just worked
function land(P, O, i, m) {
  if (m.to === 'lock') { startLock(P, O); say(nm(i) + ': ' + m.name, 1); return; }
  P.score += m.pts;
  const tag = m.pts ? '+' + m.pts : '';
  if (m.to === 'stuff') {
    O.shot = 0; O.rest = 1.1; O.bal = Math.min(.95, O.bal + (m.bal || 0)); P.rest = .12; SFX.thud();
    say(nm(i) + ': ' + m.name, 1.1); return;
  }
  if (m.to === 'stand') {
    if (P.lock > 0) { P.lock = O.caught = 0; P.gm = null; }
    O.bal = Math.min(.95, O.bal + (m.bal || 0));
    if (m.drain) spend(O, m.drain);
    if (m.strip) O.grip = [null, null];
    if (m.shove) { const d = norm(sub(O.pos, P.pos)); O.shove = mul(d, m.shove * 5 * power(P)); P.grip = [null, null]; O.grip = [null, null]; SFX.thud(); SFX.grunt(); } else SFX.grab();
    P.rest = .3; say(nm(i) + ': ' + m.name, 1);
    return;
  }
  const from = O.pose;
  (m.to === 'back' ? toBack : toStomach)(P, O);
  animate(O, P, m.anim, from);
  say(nm(i) + ': ' + m.name + ' ' + tag, 1.4);
  if (m.pts >= 3) call(m.name, nm(i) + ' ' + tag);
}

function escape(P, O, i, name) {
  const held = O.sprawl > 0 || O.top > 0, near = held && P.down > 0 && P.floor >= 1.4;
  if (near) O.score += 2;
  if (held) P.score += 1;
  clearGround(); P.rest = O.rest = .35;
  say(held ? nm(i) + ': ' + name + ' +1' + (near ? ', near fall +2 for ' + nm(1 - i) : '') : nm(i) + ': back up', 1.2);
  SFX.grunt();
}

// a mat move resolving after its windup
function ground(P, O, i, gm) {
  const m = gm.m;
  if (context(P, O) !== m.pos) return;
  const mine = m.pos === 'bottom' || m.pos === 'back';
  // on the bottom it is your timing that counts, on top it is how much they have left
  const meter = mine ? gm.meter : O.up;
  if (meter < m.min || meter > m.max || (!mine && O.guard > 0)) {
    if (m.risk) P.up = Math.max(0, P.up - m.risk);
    say(nm(i) + ': ' + m.name + ' stopped', .8); SFX.grab(); return;
  }
  const lead = nm(i) + ': ' + m.name;
  switch (m.fx) {
    case 'drain': O.up = Math.max(0, O.up - m.amt); spend(O, .02); say(lead, .7); SFX.grab(); break;
    case 'clock': O.floor += m.amt; say(lead, .7); SFX.grab(); break;
    case 'boost': P.up = Math.min(1, P.up + m.amt); if (m.delay) P.floor = Math.max(0, P.floor - m.delay); say(lead, .6); SFX.grunt(); break;
    case 'guard': P.guard = 1.5; say(lead, .8); SFX.grab(); break;
    case 'turn': { const from = O.pose; toBack(P, O); animate(O, null, 'trip', from); say(lead, 1.2); call(m.name, is(i, 'turns', 'turn') + ' them', 1); break; }
    case 'score': { P.score += m.pts; O.up = Math.max(0, O.up - .2); animate(O, null, 'roll', O.pose); animate(P, null, 'roll', P.pose); say(lead + ' +' + m.pts, 1.2); call(m.name, nm(i) + ' +' + m.pts, 1); break; }
    case 'escape': escape(P, O, i, m.name); break;
    case 'reverse': { const a = P.pose, b = O.pose; toStomach(P, O); P.score += 2; animate(O, null, 'roll', b); animate(P, null, 'drag', a); say(lead + ' +2', 1.3); call(m.name, nm(i) + ' +2', 1.1); break; }
    case 'rollover': { const a = P.pose, b = O.pose; toBack(P, O); P.score += m.pts; animate(O, null, 'roll', b); animate(P, null, 'roll', a); say(lead + ' +' + m.pts, 1.3); call(m.name, nm(i) + ' +' + m.pts, 1.1); break; }
    case 'belly': {
      if (P.floor >= 1.4) O.score += 2;
      const keep = P.up, a = P.pose; toStomach(O, P); P.up = keep * .5; animate(P, null, 'roll', a); say(lead, 1); break;
    }
  }
}

/* ---------- simulation ---------- */
function frame(i) { const d = norm(sub(F[1 - i].pos, F[i].pos)); return { f: d, r: V(d.z, 0, -d.x) }; }
function skeleton(P, i) {
  const { f, r } = frame(i), up = V(0, 1, 0), [dl, dr] = P.drop, sink = (dl + dr) / 2;
  const tired = 1 - P.cond, heave = Math.sin(P.breath) * .022 * tired;
  const base = add(P.pos, P.lean);
  const hipC = add(base, V(0, .96 - .42 * sink, 0));
  const hip = [-1, 1].map((s, k) => add(add(hipC, mul(r, s * .15)), V(0, -(P.drop[k] - sink) * .2, 0)));
  const chest = add(add(base, V(0, .96 - .42 * sink + .48 - .06 * sink + heave - tired * tired * .05, 0)), mul(f, .14 + .2 * sink + tired * tired * .07));
  const sh = [-1, 1].map((s, k) => add(add(chest, mul(r, s * .22)), V(0, -(P.drop[k] - sink) * .34 + heave * .6, 0)));
  const head = add(add(chest, V(0, .2 - tired * tired * .06, 0)), mul(f, .08));
  const foot = [-1, 1].map((s, k) => {
    const lead = (P.drop[k] - P.drop[1 - k]) * .28;
    const step = Math.max(0, Math.sin(P.walked * 9 + k * Math.PI)) * .06;
    return add(add(add(P.pos, mul(r, s * (.24 + .1 * sink))), mul(f, lead + (k ? -.1 : .1))), V(0, grounded(P) ? 0 : step, 0));
  });
  // blend toward the face-down slip pose or the legs-back sprawl pose
  const pose = (p, t, fwd, y, side = 0) => mix(p, add(add(add(P.pos, mul(f, fwd)), mul(r, side)), V(0, y, 0)), t);
  let hc = hipC, ch = chest, hd = head;
  const lead = P.single === 1 ? [-.6, .38] : [.38, -.6];
  for (const [t, q] of [[P.lunge, { hip: [0, .4], chest: [.34, .66], head: [.52, .82], foot: lead }], [P.flat, { hip: [-.05, .2], chest: [-.48, .18], head: [-.74, .2], foot: .46 }], [P.ride, { hip: [.2, .42], chest: [.62, .46], head: [.82, .6], foot: -.45 }], [P.fall, { hip: [-.08, .43], chest: [.38, .46], head: [.62, .46], foot: -.46 }], [P.over, { hip: [-.3, .5], chest: [.28, .84], head: [.5, .94], foot: -1.08 }]]) {
    if (t < .001) continue;
    hc = pose(hc, t, q.hip[0], q.hip[1]); ch = pose(ch, t, ...q.chest); hd = pose(hd, t, ...q.head);
    [-1, 1].forEach((s, k) => {
      hip[k] = pose(hip[k], t, q.hip[0], q.hip[1], s * .15);
      sh[k] = pose(sh[k], t, q.chest[0], q.chest[1], s * .22);
      foot[k] = pose(foot[k], t, Array.isArray(q.foot) ? q.foot[k] : q.foot, .04, s * .28);
    });
  }
  // the back arch: hips drive in, chest and head go back over the heels
  if (P.arch > .001) {
    const a = P.arch, shift = (p, fwd, y) => add(add(p, mul(f, fwd * a)), V(0, y * a, 0));
    hc = shift(hc, .17, -.07); ch = shift(ch, -.34, -.1); hd = shift(hd, -.62, -.3);
    [0, 1].forEach(k => { hip[k] = shift(hip[k], .17, -.07); sh[k] = shift(sh[k], -.34, -.1); });
  }
  // hoisted off the mat
  if (P.lift > .001) { const u = V(0, .34 * P.lift, 0); hc = add(hc, u); ch = add(ch, u); hd = add(hd, u);[0, 1].forEach(k => { hip[k] = add(hip[k], u); sh[k] = add(sh[k], u); foot[k] = add(foot[k], u); }); }
  return { f, r, up, hip, hipC: hc, chest: ch, sh, head: hd, foot };
}
function reachClamp(S, T) { const d = sub(T, S), m = len(d), max = ARM * 2 - .015; return m > max ? add(S, mul(d, max / m)) : T; }

// all the joints as drawn, including any throw in progress
function figure(P) {
  const B = P.body;
  const knee = [0, 1].map(k => ik(B.hip[k], B.foot[k], LEG, add(B.f, mul(B.r, (k ? 1 : -1) * .35))));
  const el = [0, 1].map(k => ik(B.sh[k], P.hands[k] || B.sh[k], ARM, add(add(mul(B.r, (k ? 1 : -1) * .8), V(0, -1, 0)), mul(B.f, -.4))));
  const q = { f: B.f, r: B.r, hipC: B.hipC, chest: B.chest, head: B.head, hip: B.hip, sh: B.sh, knee, el, foot: B.foot, toe: B.foot.map(x => add(x, mul(B.f, .14))), hand: [0, 1].map(k => P.hands[k] || B.sh[k]) };
  return P.fx ? throwPose(P, q) : q;
}
const JOINTS = ['hipC', 'chest', 'head'], PAIRS = ['hip', 'sh', 'knee', 'el', 'foot', 'toe', 'hand'];
const eachJoint = (q, fn) => { const o = { f: q.f, r: q.r }; for (const j of JOINTS) o[j] = fn(q[j], j); for (const j of PAIRS) o[j] = [0, 1].map(k => fn(q[j][k], j, k)); return o; };
function throwPose(P, q) {
  const fx = P.fx, k = clamp(fx.t / fx.dur, 0, 1), swell = Math.sin(Math.PI * k);
  if (fx.archOnly) {
    // the thrower bridges back as the other one goes over
    // stay on the feet and bridge back as they go over, then follow them down
    const a = Math.sin(Math.PI * Math.min(1, k / .82)) * fx.archOnly, f = fx.from.f, bend = { head: [-.7, -.62], chest: [-.46, -.36], sh: [-.46, -.36], el: [-.4, -.2], hand: [-.5, -.1], hipC: [.12, -.14], hip: [.12, -.14], knee: [.1, -.05] };
    const bridged = eachJoint(fx.from, (p, j) => { const b = bend[j]; if (!b) return p; const n = add(add(p, mul(f, b[0] * a)), V(0, b[1] * a, 0)); n.y = Math.max(.07, n.y); return n; });
    const s = clamp((k - .55) / .45, 0, 1), down = s * s * (3 - 2 * s);
    return eachJoint(bridged, (p, j, n) => mix(p, n === undefined ? q[j] : q[j][n], down));
  }
  const e = k * k * (3 - 2 * k);
  const blend = eachJoint(q, (p, j, n) => mix(n === undefined ? fx.from[j] : fx.from[j][n], p, e));
  const mid = mix(blend.hipC, blend.chest, .5);
  const axis = fx.axis === 'flip' ? q.r : fx.axis === 'roll' ? q.f : norm(sub(blend.head, blend.hipC));
  const ang = fx.turns * Math.PI * 2 * e;
  // slams pass over the thrower on the way down
  const toward = fx.partner && fx.pull ? mul(sub(V(fx.partner.pos.x, 0, fx.partner.pos.z), V(P.pos.x, 0, P.pos.z)), swell * fx.pull * .7) : V();
  return eachJoint(blend, p => { const v = add(add(mid, spin(sub(p, mid), axis, ang)), add(toward, V(0, fx.h * swell, 0))); v.y = Math.max(.05, v.y); return v; });
}

function step(dt) {
  // conditioning, hips and footwork
  F.forEach((P, i) => {
    const In = P.input, O = F[1 - i], zip = .55 + .45 * P.cond;
    P.breath += dt * (2.2 + (1 - P.cond) * 7);
    for (let k = 0; k < 2; k++) P.drop[k] += clamp(In.drop[k] - P.drop[k], -dt * 3.2 * zip, dt * 3.2 * zip);
    if (!busy(P) && Math.min(...In.drop) < .85 && Math.min(...P.drop) < .85) P.armed = true;
    if (P.armed && !busy(P) && Math.min(...P.drop) > .96) {
      P.armed = false; P.slip = 1; P.up = P.floor = 0; P.downed = false;
      F.forEach(Q => Q.grip = [null, null]);
      say(nm(i) + ' slipped', 1.2); SFX.thud();
    }
    const [a, b] = In.h, { f, r } = frame(i), spd = .68 * (1 - .4 * level(P)) * (.6 + .4 * P.cond);
    let mz = 0, mx = 0;
    if (a.y > .82 && b.y > .82) mz = 1; if (a.y < -.82 && b.y < -.82) mz = -1;
    if (a.x > .82 && b.x > .82) mx = 1; if (a.x < -.82 && b.x < -.82) mx = -1;
    if (In.walk) mz = In.walk; if (In.circle) mx = In.circle * .5;
    P.drive = 0;
    if (!busy(P)) {
      P.pos = add(P.pos, add(mul(f, mz * spd * dt), mul(r, mx * spd * dt)));
      if (mz || mx) { P.walked += dt; spend(P, .008 * dt); }
      if (mz > 0) P.drive = power(P) * (.45 + level(P));
    }
    P.pos = add(P.pos, mul(P.shove, dt)); P.shove = mul(P.shove, Math.exp(-5 * dt));
    // getting it back: only really happens standing easy with no ties
    const holding = grips(P), easy = !busy(P) && !holding && level(P) < .5 && !mz && !mx;
    if (holding) spend(P, .012 * holding * dt);
    if (level(P) > .6 && !grounded(P)) spend(P, .015 * dt);
    if (live) P.cap = Math.max(.5, P.cap - dt * .0009);
    const gain = easy ? .12 : busy(P) ? .012 : .055;
    P.cond = Math.min(P.cap, P.cond + gain * dt);
  });
  F.forEach((P, i) => {
    const O = F[1 - i], down = P.input.h.every(h => h.y < -.8);
    if (down && !P.wasDown && !busy(P) && (O.shot > 0 || (O.slip > 0 && !O.downed))) {
      toStomach(P, O); P.score++; spend(P, .05);
      say(nm(i) + ': sprawl +1', 1.5); SFX.thud(); excite = Math.max(excite, .4);
    }
    P.wasDown = down;
  });
  // button moves: a windup, then it lands or gets countered
  F.forEach((P, i) => {
    const O = F[1 - i];
    P.rest = Math.max(0, P.rest - dt);
    if (P.move) {
      const m = P.move.m;
      if ((P.move.t -= dt * (.65 + .35 * P.cond)) > 0) return;
      P.move = null;
      if (m.pos === 'counter') {
        if (O.shot <= 0) return;
        if (lands(m, P, O)) land(P, O, i, m); else { P.rest = .5; say(nm(i) + ': ' + m.name + ' missed', .8); }
        return;
      }
      const open = !grounded(O) && !(O.lock > 0 || O.caught > 0) && O.shot <= 0;
      if (open && spread() < 1.65 && grips(P) >= (m.g || 0) && lands(m, P, O)) land(P, O, i, m);
      else if (m.pts >= 4 && open) {
        // miss something big and you end up underneath it
        const from = P.pose; toStomach(O, P); O.score += 1; animate(P, null, 'trip', from);
        say(nm(i) + ': ' + m.name + ' countered, +1 ' + nm(1 - i), 1.4); impact(P, .4);
      } else { P.rest = m.pts ? .7 : .4; say(nm(i) + ': ' + m.name + ' countered', .9); SFX.grab(); }
      return;
    }
    if (P.rest > 0 || spread() >= 1.75) return;
    const ctx = context(P, O);
    if (ctx !== 'stand' && ctx !== 'counter') return;
    for (const b of BUTTONS) if (P.input[b]) {
      const m = pickMove(P, O, b);
      if (!m) continue;
      if (P.cond < m.cost * .6) { say(nm(i) + ': too gassed', .8); break; }
      spend(P, m.cost); P.move = { m, t: m.wind };
      if (ctx === 'stand') say(is(i, 'tries', 'try') + ': ' + m.name, .6);
      break;
    }
  });
  // shots: low hips plus both hands thrown forward
  F.forEach((P, i) => {
    const O = F[1 - i], fwd = P.input.h.every(h => h.y > .8);
    const open = !grounded(O) && !(O.lock > 0 || O.caught > 0) && O.shot <= 0;
    if (fwd && !P.wasUp && !busy(P) && open && P.rest <= 0 && level(P) >= .45 && spread() < 1.75 && P.cond > .08) {
      const tilt = P.drop[0] - P.drop[1];
      P.single = tilt > .25 ? 0 : tilt < -.25 ? 1 : -1;
      P.setup = P.grip.some(x => x !== null);
      P.shot = .6; P.downed = false; F.forEach(Q => Q.grip = [null, null]); spend(P, .09);
      say(is(i, 'shoots', 'shoot') + ': ' + (P.single < 0 ? 'double leg' : 'single leg'), .7); SFX.whoosh();
    }
    P.wasUp = fwd;
  });
  F.forEach((P, i) => {
    const O = F[1 - i];
    if (P.shot <= 0) return;
    if (spread() > .68) { const { f } = frame(i); P.pos = add(P.pos, mul(f, 1.7 * (.65 + .35 * P.cond) * dt)); }
    if (P.shot > .1 && P.shot - dt <= .1) {
      // level, their balance, a wrist setup and who is fresher decide it
      const edge = level(P) - level(O) + O.bal * .6 + (P.setup ? .2 : 0) + (P.cond - O.cond) * .3;
      const open = !grounded(O) && !(O.lock > 0 || O.caught > 0) && O.shot <= 0;
      if (spread() < 1.15 && open && edge > .15) {
        const from = O.pose, name = P.single < 0 ? 'double leg' : 'single leg';
        toBack(P, O); P.score += 3; animate(O, P, 'trip', from); say(nm(i) + ': ' + name + ' +3', 1.6); call(name, nm(i) + ' +3');
      } else { P.rest = .9; say(spread() < 1.15 ? 'shot stuffed' : 'shot came up short', .9); SFX.grab(); }
    }
  });
  F.forEach(P => {
    const was = busy(P);
    P.shot = Math.max(0, P.shot - dt);
    if (was && !busy(P)) P.bal = 0;
    P.lunge = lerp(P.lunge, P.shot > 0 || (P.move && P.move.m.pos === 'stand' && P.move.m.lvl === 'low') ? 1 : 0, Math.min(1, dt * 12));
    P.flat = lerp(P.flat, P.down > 0 ? 1 : 0, Math.min(1, dt * 9));
    P.ride = lerp(P.ride, P.top > 0 ? 1 : 0, Math.min(1, dt * 9));
    P.fall = lerp(P.fall, P.slip > 0 ? 1 : 0, Math.min(1, dt * 9));
    P.over = lerp(P.over, P.sprawl > 0 ? 1 : 0, Math.min(1, dt * 9));
    P.arch = lerp(P.arch, P.lock > 0 ? (P.gm ? .95 : .5) : 0, Math.min(1, dt * 7));
    P.lift = lerp(P.lift, P.caught > 0 && F.find(Q => Q !== P).gm ? 1 : 0, Math.min(1, dt * 7));
  });
  // the body lock
  F.forEach((P, i) => {
    if (!(P.lock > 0) || over > 0) return;
    const O = F[1 - i];
    if (!P.gm) {
      P.lock -= dt; O.caught = P.lock;
      O.up = clamp(O.up + O.input.mash * .1 * (.7 + .3 * O.cond) - .12 * dt, 0, 1);
      if (O.input.mash) spend(O, .005 * O.input.mash);
      spend(P, .018 * dt);
      if (O.up >= 1) { P.lock = O.caught = O.up = 0; P.rest = .6; O.rest = .2; say(nm(1 - i) + ': broke the lock', 1.1); SFX.grunt(); return; }
      if (P.lock <= 0) { O.caught = O.up = 0; P.lock = 0; P.rest = .6; O.rest = .3; say('the lock slipped', .9); return; }
      for (const b of BUTTONS) if (P.input[b]) {
        const m = pickMove(P, O, b);
        if (!m) continue;
        if (P.cond < m.cost * .6) { say(nm(i) + ': too gassed to lift', .8); break; }
        spend(P, m.cost); P.gm = { m, t: m.wind }; say(is(i, 'arches', 'arch') + ': ' + m.name, .7); SFX.arch();
        break;
      }
    } else if ((P.gm.t -= dt * (.65 + .35 * P.cond)) <= 0) {
      const m = P.gm.m; P.gm = null;
      if (lands(m, P, O)) { if (m.to === 'stand') { P.lock = O.caught = 0; } land(P, O, i, m); }
      else { P.lock = O.caught = O.up = 0; P.rest = .7; O.rest = .15; say(nm(i) + ': ' + m.name + ' blocked', 1); SFX.thud(); }
    }
  });
  // the mat: bottom mashes and moves, top rides, drains and turns
  F.forEach((P, i) => {
    const O = F[1 - i];
    P.gcd = Math.max(0, P.gcd - dt); P.guard = Math.max(0, P.guard - dt);
    if (over > 0 || P.lock > 0 || F.some(airborne)) return;
    if (P.gm) {
      if ((P.gm.t -= dt) <= 0) { const gm = P.gm; P.gm = null; ground(P, O, i, gm); }
      return;
    }
    const ctx = context(P, O);
    if (!['top', 'pin', 'bottom', 'back'].includes(ctx) || P.gcd > 0) return;
    for (const b of BUTTONS) if (P.input[b]) {
      const m = pickMove(P, O, b);
      if (!m) continue;
      if (P.cond < m.cost * .5) { say(nm(i) + ': too gassed', .8); break; }
      spend(P, m.cost); P.gcd = m.cd; P.gm = { m, t: m.wind, meter: P.up };
      break;
    }
  });
  F.forEach((P, i) => {
    // the clock on the mat starts when they hit it, not while they are still in the air
    if (!(P.slip > 0 || P.down > 0) || over > 0 || airborne(P)) return;
    const O = F[1 - i], held = O.sprawl > 0 || O.top > 0;
    P.floor += dt;
    P.up = clamp(P.up + P.input.mash * (P.down > 0 ? .135 : .105) * (.78 + .22 * P.cond) - .2 * dt, 0, 1);
    if (P.input.mash) spend(P, .0028 * P.input.mash);
    // stop mashing after a sprawl and they turn you
    if (held && P.slip > 0 && !P.tried && P.floor >= 1.4) { P.tried = true; if (P.up < .5 && P.guard <= 0) { const from = P.pose; toBack(O, P); animate(P, null, 'trip', from); say(nm(1 - i) + ': half nelson', 1.4); return; } }
    if (P.up >= 1 && P.floor >= .6) escape(P, O, i, 'escape');
    // two seconds on the blades ends the match
    else if (P.down > 0 && P.floor >= PIN) finish(1 - i, 'pin: ' + is(1 - i, 'wins', 'win') + ' by fall', 'pin');
  });
  // spacing: whoever is driving harder walks the other one back
  const d = sub(F[1].pos, F[0].pos), m = len(d) || 1;
  const close = F.some(P => P.lock > 0) ? .58 : F.some(P => P.shot > 0 || P.down > 0 || (P.move && P.move.m.lvl === 'low')) ? .62 : .9;
  const want = clamp(m, close, F.some(P => P.down > 0) ? .75 : F.some(P => P.lock > 0) ? .62 : 2.8);
  if (want !== m) {
    const gap = clamp(m - want, -dt * 1.6, dt * 1.6), dir = mul(d, gap / m);
    const total = F[0].drive + F[1].drive, w0 = gap < 0 && total ? F[1].drive / total : .5;
    F[0].pos = add(F[0].pos, mul(dir, w0)); F[1].pos = sub(F[1].pos, mul(dir, 1 - w0));
    if (gap < 0 && total) F.forEach(P => spend(P, .02 * dt));
  }
  // over the line loses
  if (over <= 0) {
    const [a, b] = F.map(radius);
    if (Math.max(a, b) > RING) { const loser = a > b ? 0 : 1; finish(1 - loser, nm(loser) + ' stepped out. ' + is(1 - loser, 'wins', 'win'), 'out'); }
  }
  F.forEach((P, i) => P.body = skeleton(P, i));
  // where each player wants each hand
  F.forEach((P, i) => {
    const B = P.body, O = F[1 - i], mv = P.move?.m, droop = (1 - P.cond) ** 2 * .17;
    for (let k = 0; k < 2; k++) {
      const s = k ? 1 : -1, h = P.input.h[k], y = h.y;
      const reach = y > 0 ? lerp(.32, .72, y) : lerp(.32, .06, -y);
      const high = (y > 0 ? lerp(-.2, -.06, y) : lerp(-.2, -.3, -y)) - (P.grip[k] === null ? droop : 0);
      let T = add(add(add(B.sh[k], mul(B.r, s * .02 + h.x * .45)), mul(B.f, reach)), V(0, high, 0));
      // magnet toward the nearest wrist
      if (P.grip[k] === null && O.hands[0] && y > .1) {
        let best = null, bd = .34;
        for (const w of O.hands) { const q = len(sub(w, T)); if (q < bd) { bd = q; best = w; } }
        if (best) T = mix(T, best, clamp((.34 - bd) / .2, 0, .85));
      }
      if (P.slip > 0) { T = add(B.sh[k], add(mul(B.f, .3), mul(B.r, s * .08))); T.y = .08; }
      if (P.sprawl > 0) T = add(O.body.sh[1 - k], V(0, .08, 0));
      if (P.shot > 0) { const leg = P.single < 0 ? 1 - k : 1 - P.single; T = add(O.body.foot[leg], V(0, .38, 0)); if (P.single >= 0) T.y += k ? .1 : -.05; }
      if (P.top > 0) T = add(O.body.sh[1 - k], V(0, .06, 0));
      if (mv && P.grip[k] === null) {
        T = /snap|headlock|collar|nelson/i.test(mv.name) ? add(O.body.head, V(0, -.2, 0)) : mv.lvl === 'low' || mv.anim === 'trip' ? add(O.body.foot[1 - k], V(0, mv.lvl === 'low' ? .25 : .5, 0)) : add(O.body.chest, mul(B.r, s * .15));
      }
      // arms wrapped around the back in a lock, hands on shoulders when caught
      if (P.lock > 0) T = add(add(O.body.chest, mul(O.body.f, -.17)), add(mul(B.r, s * .05), V(0, -.14, 0)));
      if (P.caught > 0) T = add(O.body.sh[1 - k], V(0, .05, 0));
      if (P.down > 0) { T = add(B.sh[k], mul(B.r, s * .45)); T.y = .1; }
      P.intent[k] = reachClamp(B.sh[k], T);
      if (!P.hands[k]) P.hands[k] = P.intent[k];
      const to = sub(P.intent[k], P.hands[k]), n = len(to), maxStep = 2.6 * (.45 + .55 * P.cond) * (P.lock > 0 || P.caught > 0 ? 2 : 1) * dt;
      P.hands[k] = add(P.hands[k], n > maxStep ? mul(to, maxStep / n) : mul(to, Math.min(1, dt * 18)));
      P.hands[k] = reachClamp(B.sh[k], P.hands[k]);
    }
  });
  // new grips
  F.forEach((P, i) => {
    for (let k = 0; k < 2; k++) {
      const held = P.input.grip[k], O = F[1 - i];
      if (!held) P.grip[k] = null;
      else if (!P.prevGrip[k] && P.gas > .12 && !F.some(busy)) {
        let pick = null, bd = GRAB;
        O.hands.forEach((w, j) => { const q = len(sub(w, P.hands[k])); if (q < bd && P.grip.indexOf(j) < 0 && O.grip[j] !== k) { bd = q; pick = j; } });
        if (pick !== null) { P.grip[k] = pick; P.strain[k] = 0; P.gas -= .05; SFX.grab(); }
      }
      P.prevGrip[k] = held;
    }
  });
  // resolve grips: tug of war between both intents
  const pull = [V(), V()], pressure = [0, 0], moving = F.some(P => P.move);
  F.forEach((P, i) => {
    const O = F[1 - i];
    for (let k = 0; k < 2; k++) {
      const j = P.grip[k]; if (j === null) continue;
      const mine = level(P), theirs = level(O);
      const w = clamp(.66 + .25 * (mine - theirs) + .2 * (P.cond - O.cond), .3, .9);
      let pt = mix(O.intent[j], P.intent[k], w);
      pt = reachClamp(O.body.sh[j], reachClamp(P.body.sh[k], pt));
      const gap = len(sub(pt, P.body.sh[k]));
      P.hands[k] = pt; O.hands[j] = pt;
      // fast, opposite yanking breaks the grip
      const fight = len(sub(O.intent[j], P.intent[k]));
      const jerk = O.last ? len(sub(O.intent[j], O.last[j])) / dt : 0;
      P.strain[k] = Math.max(0, P.strain[k] + (fight > .3 ? Math.min(jerk, 4) * .28 * dt : 0) - .35 * dt);
      if (P.strain[k] > 1 || (!moving && (gap > ARM * 2 || len(sub(O.body.sh[j], pt)) > ARM * 2 + .02))) { P.grip[k] = null; P.strain[k] = 0; say('grip broken', .9); continue; }
      // pulling: dragging their wrist away from where they want it, toward you or down
      const drag = sub(P.intent[k], O.intent[j]);
      const back = Math.max(0, -dot(sub(P.intent[k], P.body.sh[k]), P.body.f) + .34);
      const side = Math.abs(P.input.h[k].x) * .12, downward = Math.max(0, -drag.y) * .4;
      const force = Math.max(0, back * 1.6 + side + downward - .06) * (1 + .7 * (mine - theirs)) * (1 - .45 * theirs) * (.6 + .4 * P.cond);
      pressure[1 - i] += Math.max(0, force);
      pull[1 - i] = add(pull[1 - i], mul(V(drag.x, 0, drag.z), .3));
    }
  });
  F.forEach((P, i) => {
    P.last = P.intent.slice();
    const n = grips(P);
    P.gas = clamp(P.gas + (n ? -.09 * n : .22 * (.4 + .6 * P.cond)) * dt, 0, 1);
    if (P.gas <= 0) P.grip = [null, null];
    P.bal = clamp(P.bal + (pressure[i] > .04 ? pressure[i] * .75 : -.3) * dt, 0, 1);
    const L = pull[i], q = len(L), cap = q > .22 ? .22 / q : 1;
    P.lean = mix(P.lean, mul(L, cap * (.4 + P.bal)), Math.min(1, dt * 6));
  });
  for (let i = 0; i < 2; i++) if (F[i].bal >= 1) {
    F[1 - i].score++; say(nm(1 - i) + ': balance break +1');
    F.forEach(P => { P.bal = 0; P.grip = [null, null]; P.gas = 1; });
  }
  // joints for drawing, then move any throw along
  F.forEach(P => {
    P.pose = figure(P);
    const fx = P.fx;
    if (!fx) return;
    fx.t += dt;
    if (fx.t >= fx.dur) { if (!fx.archOnly) impact(P, fx.k); P.fx = null; }
  });
}

/* ---------- referee ---------- */
const newRef = () => ({ at: null, low: 0, slam: 0, pose: null, seen: [0, 0], queue: [], sig: null, win: null, beats: 0 });
let ref = newRef();
// joints as [along, side, height]; hands and feet list left then right
const REF = {
  stand: { hip: [0, 0, .95], chest: [.02, 0, 1.4], head: [.04, 0, 1.7], hand: [[.05, -.34, .93], [.05, .34, .93]], foot: [[0, -.18, .04], [0, .18, .04]] },
  crouch: { hip: [-.18, 0, .5], chest: [.14, 0, .8], head: [.34, 0, .98], hand: [[.36, -.34, .4], [.44, .3, .62]], foot: [[-.1, -.36, .04], [.05, .36, .04]] },
  leap: { hip: [-.1, 0, 1.0], chest: [.3, 0, 1.18], head: [.58, 0, 1.3], hand: [[.7, -.45, 1.55], [.75, .45, 1.6]], foot: [[-.8, -.35, .85], [-.85, .35, .7]] },
  flat: { hip: [-.3, 0, .15], chest: [.18, 0, .18], head: [.52, 0, .27], hand: [[.55, -.45, .08], [.8, .38, .08]], foot: [[-1.15, -.3, .07], [-1.15, .3, .07]] }
};
function refWorld(p, base, u, v) { const w = a => add(add(add(base, mul(u, a[0])), mul(v, a[1])), V(0, a[2], 0)); return { hip: w(p.hip), chest: w(p.chest), head: w(p.head), hand: p.hand.map(w), foot: p.foot.map(w) }; }
function refMix(a, b, t) { return { hip: mix(a.hip, b.hip, t), chest: mix(a.chest, b.chest, t), head: mix(a.head, b.head, t), hand: [0, 1].map(k => mix(a.hand[k], b.hand[k], t)), foot: [0, 1].map(k => mix(a.foot[k], b.foot[k], t)) }; }
function stepRef(dt) {
  const { f, r } = frame(0), mid = mix(F[0].pos, F[1].pos, .5), down = F.some(P => P.down > 0);
  const home = add(add(mid, mul(r, down ? -1.15 : -1.5)), mul(f, .35));
  if (!ref.slam) ref.at = ref.at ? mix(ref.at, home, Math.min(1, dt * 3)) : home;
  ref.low = lerp(ref.low, down ? 1 : 0, Math.min(1, dt * 7));
  let p = refMix(refWorld(REF.stand, ref.at, r, f), refWorld(REF.crouch, ref.at, r, f), ref.low);
  F.forEach((P, i) => { if (P.score > ref.seen[i]) ref.queue.push({ i, n: P.score - ref.seen[i], t: 0 }); ref.seen[i] = P.score; });
  // he waits for them to come down before signalling
  if (!ref.sig && ref.queue.length && !F.some(airborne)) ref.sig = ref.queue.shift();
  if (ref.sig && (ref.sig.t += dt) > .95) ref.sig = null;
  const raised = (i, base) => { const q = refWorld(REF.stand, base, r, f); q.hand[i] = add(add(add(base, mul(r, .16)), mul(f, i ? .5 : -.5)), V(0, 2.12, 0)); return q; };
  if (!ref.slam) {
    if (ref.sig && over <= 0) p = raised(ref.sig.i, ref.at);
    else if (ref.win !== null && over > 0) p = raised(ref.win, ref.at);
  }
  if (ref.slam) {
    // hop, belly flop beside the pin, then slap the mat three times
    const t = ref.slam += dt, flat = a => norm(V(a.x, 0, a.z)), side = flat(C.rt), deep = flat(C.fw), narrow = W < H;
    const spot = add(add(mid, mul(side, narrow ? .35 : 1.15)), mul(deep, narrow ? -.85 : -.25));
    const from = ref.pose || p, air = refWorld(REF.leap, mix(ref.at, spot, .65), mul(side, -1), deep), land_ = refWorld(REF.flat, spot, mul(side, -1), deep);
    if (t < .28) p = refMix(from.start || (from.start = p), air, Math.sin(t / .28 * Math.PI / 2));
    else if (t < .46) p = refMix(air, land_, ((t - .28) / .18) ** 2);
    else { p = land_; if (t < 1.5) { const lift = Math.abs(Math.sin((t - .46) / 1.04 * Math.PI * 3)); p.hand[1] = add(p.hand[1], V(0, .7 * lift, 0)); } }
    ref.pose = from;
    // one thud for the flop, three slaps, then the whistle
    const beats = [.46, .807, 1.153, 1.5, 1.8];
    while (ref.beats < beats.length && t >= beats[ref.beats]) {
      if (ref.beats === 0) { SFX.slam(.8); FX.burst(V(spot.x, 0, spot.z), .8); }
      else if (ref.beats < 4) SFX.slap(); else SFX.whistle(3);
      ref.beats++;
    }
    // back to the feet and raise the winner
    if (t > 2 && ref.win !== null) p = refMix(land_, raised(ref.win, add(add(mid, mul(side, narrow ? .6 : 1.25)), mul(deep, .2))), Math.min(1, (t - 2) / .45));
  }
  ref.now = p;
}

/* ---------- loop and ui ---------- */
function reset() {
  ref = newRef(); bots = [makeBot(newSeed()), makeBot(newSeed())]; clock = 120; live = false; over = 0; slow = 0;
  const s = F.map(P => P.input); F = [fighter(-.68), fighter(.68)]; F.forEach((P, i) => P.input = s[i]); F.forEach((P, i) => { P.body = skeleton(P, i); }); F.forEach(P => P.pose = figure(P));
  FX.clear(); $('call').hidden = true; say('reset', .8);
}
const SEGMENTS = [['mode', 'mode'], ['lh', 'lh'], ['cam', 'cam'], ['coach', 'coach'], ['sound', 'sound']];
function sync() { for (const [id, key] of SEGMENTS) $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === opts[key])); SFX.enabled = opts.sound === 'on'; save(); }
for (const [id] of SEGMENTS) $(id).addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const was = opts.mode; opts[id] = b.dataset.v;
  if (id === 'mode' && was !== opts.mode) { if (opts.mode === 'watch') opts.cam = 'side'; else if (was === 'watch') opts.cam = 'behind'; reset(); }
  sync(); b.blur();
});
$('reset').addEventListener('click', e => { reset(); e.target.blur(); });
addEventListener('gamepaddisconnected', e => delete padState[e.gamepad.index]);

const GLYPH = { sq: '□', ci: '○', tri: '△' };
const WHERE = { stand: 'standing', counter: 'they are shooting', lock: 'body lock', top: 'on top', pin: 'pinning', bottom: 'underneath', back: 'on your back', locked: 'caught' };
const DIRNAME = { n: 'hands resting', f: 'hands forward', b: 'hands back', s: 'hands sideways' };
function hint() {
  if (opts.mode === 'watch') return '<em>watching</em> ' + bots.map((b, i) => '<span>' + nm(i) + ': ' + b.style + ', seed ' + b.tag + '</span>').join('');
  const [P, O] = F, pos = context(P, O);
  if (!pos) return '<em>' + (P.shot > 0 ? 'shooting' : 'busy') + '</em>';
  if (pos === 'locked') return '<em>caught</em><span>mash x / space to break the lock</span><span>drop your hips to stop the lift</span>';
  let head = '<em>' + WHERE[pos] + '</em>';
  if (pos === 'stand') head += '<small>' + ['no tie', 'one wrist', 'both wrists'][grips(P)] + ' · hips ' + (level(P) >= .45 ? 'low' : 'high') + ' · ' + DIRNAME[dirOf(P.input)] + '</small>';
  else head += '<small>' + DIRNAME[dirOf(P.input)] + (pos === 'bottom' || pos === 'back' ? ' · mash x' : '') + '</small>';
  const chips = BUTTONS.map(b => {
    const m = pickMove(P, O, b);
    if (!m) return '';
    let open = false;
    if (opts.coach === 'on') open = m.fx ? (() => { const v = pos === 'bottom' || pos === 'back' ? P.up : O.up; return P.gcd <= 0 && v >= m.min && v <= m.max; })() : lands(m, P, O);
    return '<span class="' + (open ? 'open' : '') + '"><b aria-hidden="true">' + GLYPH[b] + '</b> ' + m.name + (m.pts ? ' +' + m.pts : '') + '</span>';
  }).join('');
  return head + (chips || '<span>grab a wrist or change your hips to open moves</span>');
}
let shown = '';
function hud() {
  F.forEach((P, i) => {
    $('sw' + i).textContent = nm(i); $('sc' + i).textContent = P.score;
    $('c' + i).style.width = P.cond * 100 + '%'; $('cap' + i).style.width = (1 - P.cap) * 100 + '%';
    $('cn' + i).textContent = Math.round(P.cond * 100) + (P.cond < .22 ? ' gassed' : '');
    const bot = opts.mode === 'watch' || (i && joined === null);
    $('n' + i).textContent = nm(i) + (bot ? ' / seed ' + bots[i].tag : '');
    $('b' + i).style.width = P.bal * 100 + '%'; $('s' + i).style.width = P.gas * 100 + '%'; $('l' + i).style.width = P.drop[0] * 100 + '%'; $('r' + i).style.width = P.drop[1] * 100 + '%';
  });
  const h = hint(); if (h !== shown) $('moves').innerHTML = shown = h;
  $('hear').hidden = !(opts.sound === 'on' && !SFX.running);
}
let last = performance.now(), T = 0;
function match(dt) {
  if (over > 0) { if ((over -= dt) <= 0) reset(); return; }
  if (!live && (opts.mode === 'watch' || F[0].input.h.some(h => Math.hypot(h.x, h.y) > .5) || F[0].input.drop.some(d => d > .3))) { live = true; SFX.whistle(1); }
  if (live) clock = Math.max(0, clock - dt);
  const [a, b] = [F[0].score, F[1].score];
  const tech = Math.abs(a - b) >= 15;
  if (clock <= 0 || tech) {
    const win = a === b ? null : a > b ? 0 : 1;
    finish(win, (win === null ? 'tie' : is(win, 'wins', 'win')) + '  ' + a + ' - ' + b + (tech ? '  tech fall' : ''), tech ? 'tech' : 'time');
  }
}
function clockFace() { const c = Math.ceil(clock); $('clock').textContent = Math.floor(c / 60) + ':' + String(c % 60).padStart(2, '0'); }
function tick(dt) {
  T += dt;
  gather(dt); match(dt); clockFace();
  const sim = slow > 0 ? dt * .45 : dt; slow = Math.max(0, slow - dt);
  if (over <= 0) step(sim);
  else F.forEach(P => { if (!P.fx) return; P.pose = figure(P); if ((P.fx.t += sim) >= P.fx.dur) { if (!P.fx.archOnly) impact(P, P.fx.k); P.fx = null; P.pose = figure(P); } });
  excite = Math.max(0, excite - dt * .45);
  stepRef(dt); setCam(dt); FX.step(sim);
}
function loop(now) {
  const dt = clamp((now - last) / 1000, .001, .04); last = now;
  tick(dt);
  if (W && H) draw(); hud();
  if (msgT > 0 && (msgT -= dt) <= 0) $('msg').hidden = true;
  if (callT > 0 && (callT -= dt) <= 0) $('call').hidden = true;
  requestAnimationFrame(loop);
}
function boot() {
  sync(); resize(); F.forEach((P, i) => P.body = skeleton(P, i)); F.forEach(P => P.pose = figure(P)); requestAnimationFrame(loop);
}
window.__hf = { get F() { return F; }, get bots() { return bots; }, get over() { return over; }, get ref() { return ref; }, opts, tick, reset, context: i => context(F[i], F[1 - i]), startLock: i => startLock(F[i], F[1 - i]), set clock(v) { clock = v; live = true; } };
boot();
