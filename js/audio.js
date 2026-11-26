/* folkstyle · © 2026 Jay · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Every sound is built in the browser from noise and oscillators. No audio files. */
const SFX = (() => {
  let ac = null, out = null, hiss = null, enabled = true;
  const log = [];   // last few sound names, handy for testing

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !enabled) return;
    if (!ac) {
      ac = new AC();
      const squash = ac.createDynamicsCompressor();
      out = ac.createGain(); out.gain.value = .7;
      out.connect(squash); squash.connect(ac.destination);
      hiss = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = hiss.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  }
  const ready = () => enabled && ac && ac.state === 'running';

  function env(gain, when, attack, dur) {
    const g = ac.createGain(), t = ac.currentTime + when;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    g.connect(out);
    return [g, t];
  }
  function tone(from, to, dur, gain, type = 'sine', when = 0, attack = .005) {
    const [g, t] = env(gain, when, attack, dur), o = ac.createOscillator();
    o.type = type; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, gain, type, from, to, when = 0, attack = .004, q = .8) {
    const [g, t] = env(gain, when, attack, dur), s = ac.createBufferSource(), f = ac.createBiquadFilter();
    s.buffer = hiss; s.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    s.connect(f); f.connect(g); s.start(t, Math.random()); s.stop(t + dur + .05);
  }

  const sounds = {
    // k: 0 light, 1 the biggest slam in the book
    slam(k = 1) {
      tone(150, 32, .35 + .35 * k, .55 + .45 * k);
      tone(80, 28, .5 + .4 * k, .35 + .45 * k, 'triangle', .01);
      noise(.2 + .15 * k, .5 + .35 * k, 'lowpass', 1500, 180);
      noise(.07, .25 + .3 * k, 'highpass', 2600, 1400);
      sounds.crowd(.35 + .65 * k);
    },
    thud() { tone(130, 45, .22, .45); noise(.12, .3, 'lowpass', 800, 160); },
    slap() { noise(.09, .55, 'bandpass', 2100, 900); tone(190, 80, .08, .25, 'triangle'); },
    whoosh() { noise(.45, .22, 'bandpass', 260, 1900, 0, .2, 2.5); },
    grab() { noise(.05, .16, 'bandpass', 1300, 700, 0, .002, 3); },
    grunt() { tone(150, 90, .18, .12, 'sawtooth', 0, .02); noise(.16, .1, 'bandpass', 600, 400, 0, .03, 4); },
    arch() { tone(90, 170, .4, .2, 'sawtooth', 0, .18); },
    whistle(n = 1) {
      for (let i = 0; i < n; i++) {
        tone(2350, 2310, i === n - 1 ? .42 : .17, .14, 'square', i * .24, .012);
        tone(2415, 2390, i === n - 1 ? .42 : .17, .1, 'square', i * .24, .012);
      }
    },
    crowd(k = .5) {
      noise(1.1 + k, .1 + .16 * k, 'bandpass', 480, 760, .06, .28, .9);
      noise(.9 + k, .05 + .08 * k, 'bandpass', 1300, 1000, .1, .35, 1.4);
    },
    buzzer() { tone(220, 218, .9, .25, 'sawtooth', 0, .02); tone(233, 231, .9, .2, 'square', 0, .02); }
  };

  const api = { unlock, log, get running() { return !!ready(); }, set enabled(v) { enabled = v; if (!v) { if (ac) ac.suspend().catch(() => {}); } else if (ac || navigator.userActivation?.hasBeenActive) unlock(); } };
  for (const name of Object.keys(sounds)) api[name] = (...a) => {
    log.push(name); if (log.length > 60) log.shift();
    if (ready()) sounds[name](...a);
  };
  return api;
})();
