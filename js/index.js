/* folkstyle: move index · © 2026 Jaymz · https://ag0nyy-ops.github.io/wrestle/ · source viewable, not reusable (LICENSE)
   Builds the page from the same table the game plays with. */
(() => {
  const { MOVES, landsText } = FOLKSTYLE;
  const SECTIONS = [
    ['stand', 'Standing', 'Neither of you is committed to anything. Ties, hip height and hand direction all change the move. If a slot is empty the game uses the resting-hands move, then the move for one tie fewer.'],
    ['lock', 'Body lock and slams', 'You got the lock and your back is arching. You have about two seconds.'],
    ['counter', 'Against their shot', 'Press while they are on the way in. You have about a third of a second.'],
    ['top', 'On top', 'You sprawled or turned them and they are on their stomach.'],
    ['pin', 'Pinning', 'They are on their back and the two second clock is running.'],
    ['bottom', 'Underneath', 'You are on your stomach. Mash to fill your meter, and pick your moment: most of these only work inside a window.'],
    ['back', 'On your back', 'Two seconds. Get off it.'],
    ['auto', 'Rules and everything else', 'Done with the sticks, or they just happen.']
  ];
  const BUTTON = { sq: ['□', 'square', '1'], ci: ['○', 'circle', '2'], tri: ['△', 'triangle', '3'] };
  const HANDS = { n: 'hands resting', f: 'hands forward', b: 'hands back', s: 'hands sideways' };
  const TIES = ['no tie', 'one wrist held', 'both wrists held'];
  const pct = v => Math.round(v * 100) + '%';

  function inputs(m) {
    if (m.pos === 'auto') return [m.how];
    const list = [];
    if (m.pos === 'stand') list.push(TIES[m.g], 'hips ' + (m.lvl === 'low' ? 'low' : 'high'));
    list.push(HANDS[m.dir]);
    return list;
  }
  function when(m) {
    if (m.pos === 'auto') return '';
    if (!m.fx) return landsText(m);
    const whose = m.pos === 'bottom' || m.pos === 'back' ? 'your' : 'their';
    if (m.min <= 0 && m.max >= 1) return 'any time';
    if (m.min <= 0) return whose + ' meter is under ' + pct(m.max);
    if (m.max >= 1) return whose + ' meter is over ' + pct(m.min);
    return whose + ' meter is between ' + pct(m.min) + ' and ' + pct(m.max);
  }
  function result(m) {
    if (m.pos === 'auto') return m.result;
    const pts = m.pts ? '+' + m.pts + ', ' : '';
    if (m.fx) return {
      turn: 'turns them onto their back', score: pts + 'you stay on top', drain: 'knocks ' + pct(m.amt || 0) + ' off their meter', clock: 'runs their pin clock forward',
      escape: '+1, back to your feet', reverse: '+2, you end up on top', rollover: pts + 'they end up on their back', belly: 'back to your stomach',
      boost: 'adds ' + pct(m.amt || 0) + ' to your meter' + (m.delay ? ' and stalls the pin clock' : ''), guard: 'blocks their turns for 1.5 seconds'
    }[m.fx];
    if (m.to === 'back') return pts + 'they land on their back';
    if (m.to === 'stomach') return pts + 'you end up on top';
    if (m.to === 'lock') return 'body lock: opens the slams';
    if (m.to === 'stuff') return 'stops the shot' + (m.bal ? ' and leaves them off balance' : '');
    const bits = [];
    if (m.shove) bits.push('drives them ' + (m.shove > 1 ? 'a long way' : 'back') + ' toward the line');
    if (m.strip) bits.push('breaks their grips');
    if (m.bal) bits.push('fills their balance bar');
    if (m.drain) bits.push('burns their conditioning');
    return 'setup: ' + bits.join(', ');
  }
  const risk = m => m.pos === 'stand' && m.pts >= 4 ? 'Miss it and you end up underneath, +1 to them.' : m.risk ? 'Miss it and your meter drops.' : '';
  const gas = m => m.cost === undefined ? '' : m.cost >= .15 ? 'heavy' : m.cost >= .09 ? 'medium' : 'light';

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const list = document.getElementById('list');
  let number = 0;
  const cards = [];
  for (const [pos, title, blurb] of SECTIONS) {
    const moves = MOVES.filter(m => m.pos === pos);
    const sec = el('section', 'moveset'); sec.dataset.pos = pos;
    sec.append(el('p', 'label', 'file ' + String(SECTIONS.findIndex(s => s[0] === pos) + 1).padStart(2, '0') + ' / ' + moves.length + ' entries'), el('h2', '', title), el('p', 'blurb', blurb));
    const grid = el('ol', 'grid');
    for (const m of moves) {
      const card = el('li', 'move'); card.id = m.id + (pos === 'stand' ? '' : '-' + pos);
      const head = el('div', 'move__head'); head.append(el('span', 'move__no', 'MOVE ' + String(++number).padStart(3, '0')));
      if (m.anim === 'slam' && pos !== 'auto') head.append(el('span', 'stamp', 'slam'));
      card.append(head, el('h3', '', m.name));
      const keys = el('div', 'chips');
      if (m.b) { const [glyph, name, key] = BUTTON[m.b]; const k = el('span', 'chip chip--btn', glyph + ' ' + name); k.append(el('small', '', ' key ' + key)); keys.append(k); }
      inputs(m).forEach(t => keys.append(el('span', 'chip', t)));
      card.append(keys);
      const facts = el('dl');
      const fact = (k, v) => { if (v) facts.append(el('dt', '', k), el('dd', '', v)); };
      fact('lands when', when(m)); fact('result', result(m)); fact('gas', gas(m)); fact('risk', risk(m));
      card.append(facts); grid.append(card);
      cards.push({ card, sec, pos, b: m.b, text: [m.name, title, ...inputs(m), when(m), result(m), m.b ? BUTTON[m.b][1] : '', m.anim === 'slam' ? 'slam' : ''].join(' ').toLowerCase() });
    }
    sec.append(grid); list.append(sec);
  }
  list.append(el('p', 'none', 'Nothing matches that.'));

  let where = 'all', btn = 'all';
  const q = document.getElementById('q');
  function filter() {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    for (const c of cards) {
      const on = (where === 'all' || c.pos === where) && (btn === 'all' || c.b === btn) && words.every(w => c.text.includes(w));
      c.card.hidden = !on; if (on) n++;
    }
    list.querySelectorAll('section').forEach(s => s.hidden = !s.querySelector('.move:not([hidden])'));
    list.querySelector('.none').hidden = n > 0;
    document.getElementById('count').textContent = n + ' of ' + cards.length;
  }
  function segment(id, label, options, pick) {
    const box = document.getElementById(id); box.append(el('em', '', label));
    for (const [value, text] of options) {
      const b = el('button', '', text); b.type = 'button'; b.setAttribute('aria-pressed', value === 'all');
      b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); pick(value); filter(); });
      box.append(b);
    }
  }
  segment('where', 'Position', [['all', 'All'], ...SECTIONS.map(s => [s[0], s[1]])], v => where = v);
  segment('btns', 'Button', [['all', 'All'], ...Object.entries(BUTTON).map(([k, v]) => [k, v[0] + ' ' + v[1]])], v => btn = v);
  q.addEventListener('input', filter);
  document.getElementById('total').textContent = cards.length;
  filter();
})();
