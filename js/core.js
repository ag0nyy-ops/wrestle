/* folkstyle · © 2026 Jay · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Math and constants shared by the game and the renderer. */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const V = (x = 0, y = 0, z = 0) => ({ x, y, z });
const add = (a, b) => V(a.x + b.x, a.y + b.y, a.z + b.z), sub = (a, b) => V(a.x - b.x, a.y - b.y, a.z - b.z), mul = (a, s) => V(a.x * s, a.y * s, a.z * s);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z, len = a => Math.hypot(a.x, a.y, a.z), norm = a => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const mix = (a, b, t) => add(a, mul(sub(b, a), t));
// turn v around a unit axis (Rodrigues)
const spin = (v, axis, ang) => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c)));
};
function ik(a, c, l, pole) {
  const d = sub(c, a), m = Math.min(len(d), l * 2 - .001), u = norm(d), h = Math.sqrt(Math.max(0, l * l - m * m / 4));
  const p = norm(sub(pole, mul(u, dot(pole, u))));
  return add(add(a, mul(u, m / 2)), mul(p, h));
}
// the only two colours in the game: green ankle (first wrestler), red ankle (second)
const BAND = ['#1fb85a', '#e0242f'], ARM = .35, LEG = .53, GRAB = .23, PIN = 2, RING = 3;
const calm = matchMedia('(prefers-reduced-motion: reduce)');
