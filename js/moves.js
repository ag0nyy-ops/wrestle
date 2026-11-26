/* hand fight · © 2026 Jay · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Every move in the game. The game and the move index both read this file, so they can't disagree. */
(() => {
  const level = P => (P.drop[0] + P.drop[1]) / 2;
  const handY = P => (P.input.h[0].y + P.input.h[1].y) / 2;

  // [what the index says, test(them, you)]
  const COND = {
    tall: ['their hips are high', O => level(O) < .45],
    low: ['their hips are low', O => level(O) >= .4],
    off: ['their balance bar is a quarter full', O => O.bal >= .25],
    angled: ['one of their hips is dropped', O => Math.abs(O.drop[0] - O.drop[1]) > .3],
    reaching: ['their hands are pushed forward', O => handY(O) > .35],
    pulling: ['their hands are pulled back', O => handY(O) < -.35],
    gripping: ['they hold your wrist', O => O.grip.some(x => x !== null)],
    free: ['they have no grip on you', O => O.grip.every(x => x === null)],
    tired: ['their conditioning is under half', O => O.cond < .5],
    youlow: ['your hips are low', (O, P) => level(P) >= .45],
    youtall: ['your hips are high', (O, P) => level(P) < .45],
    single: ['they shot a single leg', O => O.single >= 0],
    double: ['they shot a double leg', O => O.single < 0],
    any: ['any time', () => true]
  };

  const MOVES = [];
  const add = m => { m.id = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); MOVES.push(m); return m; };

  /* standing: ties held, hips, button, hand direction, name, lands when, points, result, extras */
  const S = (g, lvl, b, dir, name, lands, pts, to, x = {}) => add({ pos: 'stand', g, lvl, b, dir, name, lands, pts, to, ...x });

  S(0, 'tall', 'sq', 'n', 'Collar snap', ['reaching', 'low'], 0, 'stand', { bal: .5 });
  S(0, 'tall', 'sq', 'f', 'Club', ['low', 'tired'], 0, 'stand', { bal: .35, drain: .1 });
  S(0, 'tall', 'sq', 'b', 'Snap and spin', ['reaching'], 3, 'stomach');
  S(0, 'tall', 'sq', 's', 'Shuck by', ['low'], 3, 'stomach');
  S(0, 'tall', 'ci', 'n', 'Front headlock', ['low'], 3, 'stomach');
  S(0, 'tall', 'ci', 'f', 'Two hand shove', ['tall', 'tired'], 0, 'stand', { shove: .8 });
  S(0, 'tall', 'ci', 'b', 'Slide by', ['reaching'], 3, 'stomach');
  S(0, 'tall', 'ci', 's', 'Duck under', ['tall'], 3, 'stomach', { wind: .42 });
  S(0, 'tall', 'tri', 'n', 'Hand clear', ['gripping'], 0, 'stand', { strip: true, bal: .2 });
  S(0, 'tall', 'tri', 'f', 'Body lock', ['free+tall', 'tired'], 0, 'lock', { wind: .34 });
  S(0, 'tall', 'tri', 'b', 'Throw by', ['reaching'], 3, 'stomach');
  S(0, 'tall', 'tri', 's', 'Shrug', ['angled'], 3, 'stomach');

  S(0, 'low', 'sq', 'n', 'Ankle pick', ['off', 'angled'], 3, 'stomach');
  S(0, 'low', 'sq', 'f', 'Snatch single', ['tall'], 3, 'stomach', { wind: .4 });
  S(0, 'low', 'sq', 'b', 'Knee tap', ['off'], 3, 'stomach');
  S(0, 'low', 'sq', 's', 'Sweep single', ['angled', 'tall+reaching'], 3, 'stomach');
  S(0, 'low', 'ci', 'n', 'High crotch', ['tall'], 3, 'stomach', { wind: .42 });
  S(0, 'low', 'ci', 'f', 'Blast double', ['tall'], 4, 'back', { anim: 'carry', wind: .5 });
  S(0, 'low', 'ci', 'b', 'Low single', ['reaching'], 3, 'stomach');
  S(0, 'low', 'ci', 's', 'Knee pull', ['angled'], 3, 'stomach');
  S(0, 'low', 'tri', 'n', 'Fake shot', ['tall', 'reaching'], 0, 'stand', { bal: .35 });
  S(0, 'low', 'tri', 'f', 'Double leg slam', ['tall+tired', 'off'], 4, 'back', { anim: 'slam' });
  S(0, 'low', 'tri', 'b', 'Heel pick', ['pulling'], 3, 'back');
  S(0, 'low', 'tri', 's', 'Crackdown', ['low'], 3, 'stomach');

  S(1, 'tall', 'sq', 'n', 'Snapdown', ['low', 'off'], 1, 'stomach');
  S(1, 'tall', 'sq', 'f', 'Over under lock', ['tall', 'tired'], 0, 'lock', { wind: .32 });
  S(1, 'tall', 'sq', 'b', 'Russian arm drag', ['tall'], 3, 'stomach', { wind: .4 });
  S(1, 'tall', 'sq', 's', 'Wrist shuck', ['reaching'], 3, 'stomach');
  S(1, 'tall', 'ci', 'n', 'Headlock throw', ['tall+reaching', 'off'], 4, 'back', { anim: 'throw' });
  S(1, 'tall', 'ci', 'f', 'Inside trip', ['pulling'], 3, 'stomach', { anim: 'trip' });
  S(1, 'tall', 'ci', 'b', 'Foot sweep', ['angled'], 3, 'stomach', { anim: 'trip' });
  S(1, 'tall', 'ci', 's', 'Arm spin', ['reaching'], 4, 'back', { anim: 'throw' });
  S(1, 'tall', 'tri', 'n', 'Arm drag', ['tall'], 3, 'stomach');
  S(1, 'tall', 'tri', 'f', 'Outside trip', ['off', 'pulling'], 3, 'stomach', { anim: 'trip' });
  S(1, 'tall', 'tri', 'b', 'Drag to single', ['reaching'], 3, 'stomach');
  S(1, 'tall', 'tri', 's', 'Inner thigh throw', ['tall'], 4, 'back', { anim: 'throw', wind: .52 });

  S(1, 'low', 'sq', 'n', 'Low snap', ['low'], 1, 'stomach');
  S(1, 'low', 'sq', 'f', 'Post single', ['tall'], 3, 'stomach');
  S(1, 'low', 'sq', 'b', 'Knee block', ['reaching', 'off'], 3, 'stomach', { anim: 'trip' });
  S(1, 'low', 'ci', 'n', 'Firemans carry', ['tall'], 3, 'back', { anim: 'carry' });
  S(1, 'low', 'ci', 'f', 'Dump', ['pulling'], 3, 'stomach', { anim: 'trip' });
  S(1, 'low', 'ci', 'b', 'Drop shoulder throw', ['reaching'], 4, 'back', { anim: 'flip' });
  S(1, 'low', 'ci', 's', 'Barrel roll', ['angled'], 3, 'back', { anim: 'throw' });
  S(1, 'low', 'tri', 'n', 'Waist lock', ['tall', 'off'], 0, 'lock');
  S(1, 'low', 'tri', 'f', 'Elbow pass', ['reaching'], 3, 'stomach');
  S(1, 'low', 'tri', 'b', 'Wrist peel', ['any'], 0, 'stand', { bal: .25, drain: .06, wind: .4 });
  S(1, 'low', 'tri', 's', 'Super duck', ['tall'], 3, 'stomach', { wind: .42 });

  S(2, 'tall', 'sq', 'n', 'Double wrist snap', ['low', 'off'], 1, 'stomach');
  S(2, 'tall', 'sq', 'f', 'Pancake', ['low'], 4, 'back', { anim: 'throw' });
  S(2, 'tall', 'sq', 'b', 'Pull and sweep', ['pulling', 'angled'], 3, 'stomach', { anim: 'trip' });
  S(2, 'tall', 'sq', 's', 'Cross drag', ['tall'], 3, 'stomach');
  S(2, 'tall', 'ci', 'n', 'Hip toss', ['tall'], 4, 'back', { anim: 'throw' });
  S(2, 'tall', 'ci', 'f', 'Lateral drop', ['reaching', 'pulling'], 4, 'back', { anim: 'throw' });
  S(2, 'tall', 'ci', 'b', 'Sacrifice throw', ['reaching'], 4, 'back', { anim: 'flip' });
  S(2, 'tall', 'ci', 's', 'Arm throw', ['tall'], 4, 'back', { anim: 'throw', wind: .52 });
  S(2, 'tall', 'tri', 'n', 'Hand crush', ['any'], 0, 'stand', { bal: .2, drain: .15, wind: .4 });
  S(2, 'tall', 'tri', 'f', 'Double underhooks', ['tall', 'tired', 'off'], 0, 'lock');
  S(2, 'tall', 'tri', 'b', 'Whip over', ['angled'], 4, 'back', { anim: 'throw' });
  S(2, 'tall', 'tri', 's', 'Bull rush', ['tall', 'tired', 'pulling'], 0, 'stand', { shove: 1.25, wind: .45 });

  S(2, 'low', 'sq', 'n', 'Drag down', ['off', 'pulling'], 1, 'stomach');
  S(2, 'low', 'sq', 'f', 'Wrist ride takedown', ['low'], 3, 'stomach');
  S(2, 'low', 'ci', 'n', 'Two wrist carry', ['tall'], 4, 'back', { anim: 'carry' });
  S(2, 'low', 'ci', 'f', 'Lift and dump', ['pulling'], 4, 'back', { anim: 'slam' });
  S(2, 'low', 'ci', 'b', 'Spin throw', ['reaching'], 4, 'back', { anim: 'throw' });
  S(2, 'low', 'tri', 'n', 'Bear hug', ['any'], 0, 'lock', { wind: .45 });
  S(2, 'low', 'tri', 'f', 'Drive through', ['tall'], 0, 'stand', { shove: 1.05 });

  /* the body lock: your back arches, pick a slam before the lock slips */
  const L = (b, dir, name, lands, pts, to, x = {}) => add({ pos: 'lock', b, dir, name, lands, pts, to, anim: 'slam', wind: .38, ...x });
  L('sq', 'n', 'Belly to belly', ['tall'], 4, 'back');
  L('sq', 'f', 'Bear hug takedown', ['tall', 'tired'], 2, 'back', { anim: 'trip' });
  L('sq', 'b', 'Suplex', ['tall'], 5, 'back', { wind: .46 });
  L('sq', 's', 'Lateral arch', ['angled', 'reaching'], 4, 'back', { anim: 'throw' });
  L('ci', 'n', 'Lift and slam', ['tall', 'tired'], 4, 'back');
  L('ci', 'f', 'Drive and dump', ['pulling', 'low'], 3, 'stomach', { anim: 'trip' });
  L('ci', 'b', 'Grand amplitude', ['tired+tall'], 5, 'back', { wind: .5 });
  L('ci', 's', 'Hip heave', ['angled', 'tall'], 4, 'back', { anim: 'throw' });
  L('tri', 'n', 'Mat return', ['any'], 2, 'stomach', { anim: 'carry', wind: .5 });
  L('tri', 'f', 'Walk them out', ['any'], 0, 'stand', { shove: 1.3, anim: 'drag' });
  L('tri', 'b', 'Souplesse', ['tall+free', 'tired'], 5, 'back', { wind: .46 });
  L('tri', 's', 'Leg lift trip', ['low'], 2, 'back', { anim: 'trip' });

  /* against their shot: press while they are coming in */
  const C = (b, dir, name, lands, pts, to, x = {}) => add({ pos: 'counter', b, dir, name, lands, pts, to, wind: .14, ...x });
  C('sq', 'n', 'Crossface', ['any'], 0, 'stuff');
  C('sq', 'f', 'Hip block', ['youlow'], 0, 'stuff', { bal: .55 });
  C('sq', 'b', 'Snap go behind', ['youtall'], 3, 'stomach');
  C('sq', 's', 'Spin behind', ['single'], 3, 'stomach');
  C('ci', 'n', 'Whizzer', ['single'], 0, 'stuff', { bal: .65 });
  C('ci', 'f', 'Pancake counter', ['double+youlow'], 4, 'back', { anim: 'throw' });
  C('ci', 'b', 'Whizzer throw', ['single+youlow'], 4, 'back', { anim: 'throw' });
  C('ci', 's', 'Cement mixer', ['youlow'], 3, 'back', { anim: 'throw' });
  C('tri', 'n', 'Front headlock catch', ['double'], 2, 'stomach');
  C('tri', 'f', 'Underhook stop', ['any'], 0, 'stuff', { bal: .2 });
  C('tri', 'b', 'Guillotine', ['single'], 4, 'back', { anim: 'throw' });
  C('tri', 's', 'Spladle counter', ['single+youlow', 'tired'], 4, 'back', { anim: 'throw' });

  /* on the mat. min / max: the get-up meter window (yours on bottom, theirs on top) */
  const G = (pos, b, dir, name, fx, x = {}) => add({ pos, b, dir, name, fx, min: 0, max: 1, pts: 0, cd: 1, wind: .22, ...x });

  G('top', 'sq', 'n', 'Half nelson', 'turn', { max: .5 });
  G('top', 'sq', 'f', 'Crossface drive', 'drain', { amt: .25, cd: 1.2 });
  G('top', 'sq', 'b', 'Power half', 'turn', { max: .65, wind: .48, cd: 2 });
  G('top', 'sq', 's', 'Arm bar', 'turn', { max: .35, wind: .16 });
  G('top', 'ci', 'n', 'Near side cradle', 'turn', { max: .45 });
  G('top', 'ci', 'f', 'Three quarter nelson', 'turn', { max: .55, wind: .4, cd: 1.8 });
  G('top', 'ci', 'b', 'Gut wrench', 'score', { pts: 2, max: .4, cd: 2.4, wind: .3 });
  G('top', 'ci', 's', 'Leg ride', 'drain', { amt: .35, max: .7, cd: 2.2 });
  G('top', 'tri', 'n', 'Tight waist', 'drain', { amt: .3, cd: 1.3 });
  G('top', 'tri', 'f', 'Spiral ride', 'drain', { amt: .2, cd: .9 });
  G('top', 'tri', 'b', 'Leg lace', 'score', { pts: 2, max: .3, cd: 2.4, wind: .3 });
  G('top', 'tri', 's', 'Ankle ride', 'drain', { amt: .15, cd: .6, wind: .14 });

  G('pin', 'sq', 'n', 'Reverse half', 'drain', { amt: .22, cd: 1.6 });
  G('pin', 'sq', 'f', 'Chest to chest', 'clock', { amt: .18, max: .35, cd: 2.5 });
  G('pin', 'sq', 'b', 'Headlock squeeze', 'drain', { amt: .2, cd: 1.4 });
  G('pin', 'ci', 'n', 'Cradle', 'drain', { amt: .3, cd: 2.2 });
  G('pin', 'ci', 's', 'Spladle', 'drain', { amt: .36, max: .7, cd: 2.6 });
  G('pin', 'tri', 'n', 'Cross body press', 'drain', { amt: .16, cd: 1.1 });
  G('pin', 'tri', 's', 'Leg grapevine', 'clock', { amt: .12, max: .5, cd: 2 });

  G('bottom', 'sq', 'n', 'Stand up', 'escape', { min: .65 });
  G('bottom', 'sq', 'f', 'Tripod', 'boost', { amt: .22, cd: 1.5 });
  G('bottom', 'sq', 'b', 'Sit out', 'escape', { min: .5, max: .8, risk: .3 });
  G('bottom', 'sq', 's', 'Hip heist', 'escape', { min: .55, max: .75, risk: .25 });
  G('bottom', 'ci', 'n', 'Base up', 'guard', { cd: 3 });
  G('bottom', 'ci', 'f', 'Short drag', 'reverse', { min: .6, max: .8, risk: .35 });
  G('bottom', 'ci', 'b', 'Wing roll', 'reverse', { min: .45, max: .65, risk: .4 });
  G('bottom', 'ci', 's', 'Granby roll', 'reverse', { min: .35, max: .55, risk: .6 });
  G('bottom', 'tri', 'n', 'Switch', 'reverse', { min: .5, max: .9, risk: .2 });
  G('bottom', 'tri', 'f', 'Crawl out', 'boost', { amt: .12, cd: .8, wind: .14 });
  G('bottom', 'tri', 'b', 'Sit out turn in', 'reverse', { min: .65, max: .85, risk: .3 });
  G('bottom', 'tri', 's', 'Peterson roll', 'rollover', { min: .55, max: .68, pts: 4, risk: .5 });

  G('back', 'sq', 'n', 'Bridge', 'boost', { amt: .18, delay: .2, cd: 1.2 });
  G('back', 'sq', 's', 'Belly down', 'belly', { min: .35, risk: .2 });
  G('back', 'ci', 'n', 'Hip out', 'escape', { min: .72 });
  G('back', 'ci', 's', 'Shoulder roll', 'belly', { min: .25, max: .5, risk: .25 });
  G('back', 'tri', 'n', 'Bridge and roll', 'rollover', { min: .62, pts: 2, risk: .35 });
  G('back', 'tri', 's', 'Headlock reversal', 'reverse', { min: .45, max: .65, risk: .4 });

  /* things that happen without picking from the button table */
  const A = (name, how, result) => add({ pos: 'auto', name, how, result });
  A('Double leg', 'Hips low, throw both hands forward', '+3, they hit their back. Lands if you are lower than them');
  A('Single leg', 'Same as the double, one hip dropped more', '+3, they hit their back');
  A('Sprawl', 'Pull both hands down as they shoot or slip', '+1, you end up on top');
  A('Balance break', 'Grab a wrist and pull until their balance bar fills', '+1');
  A('Drive', 'Push both hands forward to walk into them', 'Moves them toward the line. Lower and fresher wins the push');
  A('Out of the circle', 'Step, get shoved or get driven past the white line', 'You lose the match');
  A('Break the lock', 'Caught in a body lock: mash cross / Space', 'Meter fills, you get free');
  A('Escape', 'On the mat: mash cross / Space until the meter fills', '+1 if they were on top');
  A('Near fall', 'They stay on their back 1.4 seconds before getting off it', '+2');
  A('Free half nelson', 'They stop mashing for 1.4 seconds after you sprawl', 'Turns them onto their back');
  A('Pin', 'Hold them on their back for 2 seconds', 'You win the match');
  A('Tech fall', 'Lead by 15 points', 'You win the match');

  // how much conditioning a move burns
  MOVES.forEach(m => {
    if (m.pos === 'auto') return;
    if (m.fx) m.cost = { turn: .055, drain: .022, clock: .035, score: .065, escape: .055, reverse: .075, rollover: .095, belly: .045, boost: .018, guard: .015 }[m.fx];
    else m.cost = [.035, .045, .06, .08, .115, .15][m.pts] + (m.shove ? .025 : 0);
    if (m.pos === 'stand' || m.pos === 'counter') {
      m.wind ??= m.pts >= 4 ? .46 : (m.to === 'stand' && !m.pts) ? .24 : .34;
      m.anim ??= m.to === 'stand' || m.to === 'stuff' || m.to === 'lock' ? null : 'drag';
    }
  });

  const keyOf = m => m.pos === 'stand' ? ['stand', m.g, m.lvl, m.b, m.dir].join() : [m.pos, m.b, m.dir].join();
  const table = new Map(MOVES.filter(m => m.pos !== 'auto').map(m => [keyOf(m), m]));

  // exact slot first, then the same button with resting hands, then one tie fewer
  function find(pos, { g = 0, lvl = 'tall', b, dir }) {
    if (pos !== 'stand') return table.get([pos, b, dir].join()) || table.get([pos, b, 'n'].join()) || null;
    for (let n = g; n >= Math.max(0, g - 1); n--) {
      const m = table.get(['stand', n, lvl, b, dir].join()) || table.get(['stand', n, lvl, b, 'n'].join());
      if (m) return m;
    }
    return null;
  }
  const lands = (m, P, O) => !m.lands || m.lands.some(s => s.split('+').every(c => COND[c][1](O, P)));
  const landsText = m => m.lands.map(s => s.split('+').map(c => COND[c][0]).join(' and ')).join(', or ');

  window.HFM = { MOVES, COND, find, lands, landsText, level };
})();
