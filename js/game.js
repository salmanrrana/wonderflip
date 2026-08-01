/* =============================================================
   Wonderflip — game engine
   Home screen → pick a level → three rounds → trophy.
   Levels come from js/levels.js; cards from data/*.js.
   ============================================================= */

/* Each level brings its own three-round ladder (see js/levels.js): the
   little levels ramp 3 → 4 → 6 pairs, the big-kid ones 6 → 8 → 10. */
const rounds = () => level.rounds;

const CHEERS = ['Yay!', 'Nice one!', 'You found it!', 'Wonderful!', 'Great looking!', 'Super!', 'Hooray!'];

/* ---- elements ---- */
const $ = (id) => document.getElementById(id);

const home = $('home'), levelGrid = $('levelGrid'), gameScreen = $('gameScreen');
const board = $('board'), pips = $('pips'), hint = $('hint');
const levelTitle = $('levelTitle'), levelSub = $('levelSub'), brandMark = $('brandMark');
const panelIdle = $('panelIdle'), fact = $('fact');
const idleEmoji = $('idleEmoji'), idleTitle = $('idleTitle'), idleText = $('idleText'), idleCount = $('idleCount');
const factPhoto = $('factPhoto'), factName = $('factName'), factRole = $('factRole');
const factYears = $('factYears'), factText = $('factText');
const curtain = $('curtain'), curtainTitle = $('curtainTitle'), curtainText = $('curtainText');
const curtainBtn = $('curtainBtn'), curtainHomeBtn = $('curtainHomeBtn');
const curtainStars = $('curtainStars'), trophyEmoji = $('trophyEmoji');
const soundBtn = $('soundBtn'), homeSoundBtn = $('homeSoundBtn'), restartBtn = $('restartBtn');
const sayBtn = $('sayBtn'), backBtn = $('backBtn');

/* ---- state ---- */
let level = null;       // the active level object
let roundIndex = 0;
let deck = [];
let first = null;
let busy = false;
let matched = 0;
let pool = [];          // items not yet used this game
let current = null;     // item shown in the panel
let soundOn = true;

/* =============================================================
   Sound — tiny WebAudio chimes, no files needed
   ============================================================= */
let actx = null;
const audio = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());

function tone(freq, start, dur, type = 'sine', vol = 0.16) {
  if (!soundOn) return;
  const ctx = audio();
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.05);
}

const SFX = {
  flip:  () => tone(620, 0, 0.14, 'triangle', 0.10),
  match: () => [784, 988, 1319].forEach((f, i) => tone(f, i * 0.09, 0.4, 'sine', 0.14)),
  wrong: () => { tone(300, 0, 0.16, 'sine', 0.10); tone(230, 0.13, 0.22, 'sine', 0.09); },
  win:   () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.55, 'triangle', 0.15))
};

const speak = (text) => { if (soundOn) Voice.say(text); };

/* =============================================================
   Helpers
   ============================================================= */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* text that came from our own data files, but escaped anyway so a
   stray quote or ampersand can never break the markup */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* shade a hex colour: t < 0 darkens, t > 0 lightens */
function shade(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v =>
    Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t));
  return `rgb(${ch.join(',')})`;
}

/* =============================================================
   Card faces — one renderer per level kind
   ============================================================= */
/* Pictures inside a card carry draggable="false": dragging one out of the
   card is never what a child meant, and on a touch screen the drag that
   starts eats the tap that was trying to turn the card over. */
function faceFront(item) {
  if (level.kind === 'photo') {
    return `<img src="img/${level.id}/${item.id}.jpg" alt="${esc(item.name)}" loading="eager" decoding="async" draggable="false">
            <span class="tag">${esc(item.name)}</span>`;
  }

  // flags are vector art and every one has its own proportions, so they
  // sit inside the card whole — cropping one to a square would lop the
  // canton off half of them and make two flags look alike.
  if (level.kind === 'flag') {
    return `<span class="flag-face">
              <img src="img/${level.id}/${item.id}.svg" alt="${esc(item.name)}" loading="eager" decoding="async" draggable="false">
            </span>
            <span class="tag">${esc(item.name)}</span>`;
  }

  // glyph and swatch faces already carry their own label, so they get
  // no name tag underneath — it would just say the same thing twice.
  if (level.kind === 'glyph') {
    const extra = item.dots != null
      ? `<span class="glyph-dots">${'<i></i>'.repeat(item.dots)}</span>`
      : `<span class="glyph-lower">${esc(item.lower)}</span>
         <span class="glyph-emoji">${item.emoji}</span>`;
    return `<span class="glyph-face" style="--g:${item.color}">
              <span class="glyph-char">${esc(item.glyph)}</span>${extra}
            </span>`;
  }

  // swatch — colour is never the only cue: emoji + written name too
  return `<span class="swatch-face" style="background:${item.color}; color:${item.ink}">
            <span class="swatch-emoji">${item.emoji}</span>
            <span class="swatch-name">${esc(item.name)}</span>
          </span>`;
}

/* the card back — same atom-ish badge, tinted per item */
function backIcon(color) {
  return `
    <svg class="back-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="9" fill="${color}" opacity=".95"/>
      <ellipse cx="32" cy="32" rx="27" ry="11" stroke="#fff" stroke-width="3.4" opacity=".95"/>
      <ellipse cx="32" cy="32" rx="27" ry="11" stroke="#fff" stroke-width="3.4"
               opacity=".8" transform="rotate(60 32 32)"/>
      <ellipse cx="32" cy="32" rx="27" ry="11" stroke="#fff" stroke-width="3.4"
               opacity=".8" transform="rotate(120 32 32)"/>
    </svg>`;
}

/* the portrait area of the fact card, matching the level kind */
function factFace(item) {
  if (level.kind === 'photo') {
    factPhoto.className = 'fact-photo';
    factPhoto.innerHTML = `<img src="img/${level.id}/${item.id}.jpg" alt="${esc(item.name)}">`;
  } else if (level.kind === 'flag') {
    // a round frame would crop the flag, so this one is a rounded rectangle
    factPhoto.className = 'fact-photo is-flag';
    factPhoto.style.background = '';
    factPhoto.innerHTML = `<img src="img/${level.id}/${item.id}.svg" alt="${esc(item.name)}">`;
  } else if (level.kind === 'glyph') {
    factPhoto.className = 'fact-photo is-glyph';
    factPhoto.style.background = `linear-gradient(150deg, ${item.color}, ${shade(item.color, .35)})`;
    factPhoto.innerHTML = `<span class="fact-glyph">${esc(item.glyph)}</span>`;
  } else {
    factPhoto.className = 'fact-photo is-swatch';
    factPhoto.style.background = item.color;
    factPhoto.innerHTML = `<span class="fact-glyph" style="color:${item.ink}">${item.emoji}</span>`;
  }
}

/* =============================================================
   Home screen
   ============================================================= */
function levelCard(lv, i) {
  const btn = document.createElement('button');
  btn.className = 'level-card';
  btn.style.setProperty('--a', lv.theme[0]);
  btn.style.setProperty('--b', lv.theme[1]);
  btn.style.animationDelay = `${i * 45}ms`;
  btn.innerHTML = `
    <span class="level-emoji" aria-hidden="true">${lv.emoji}</span>
    <span class="level-name">${esc(lv.title)}</span>
    <span class="level-blurb">${esc(lv.blurb)}</span>
    <span class="level-count">${lv.items.length} cards</span>`;
  btn.addEventListener('click', () => openLevel(lv.id));
  return btn;
}

/* Two shelves. The big-kid levels have far more cards on a much wider
   board, so they are kept apart rather than mixed in — a three-year-old
   should not land on twenty flags by tapping the wrong tile. */
function buildHome() {
  levelGrid.innerHTML = '';
  let n = 0;

  const shelf = (tier, title, note) => {
    const levels = LEVELS.filter(lv => lv.tier === tier);
    if (!levels.length) return;

    const head = document.createElement('div');
    head.className = 'shelf-head';
    head.innerHTML = `<h2>${esc(title)}</h2><p>${esc(note)}</p>`;
    levelGrid.appendChild(head);

    const row = document.createElement('div');
    row.className = 'shelf-row';
    levels.forEach(lv => row.appendChild(levelCard(lv, n++)));
    levelGrid.appendChild(row);
  };

  shelf('little', 'First adventures', 'Nice and gentle — 3 to 6 pairs');
  shelf('big', 'Big kid challenges', 'Bigger boards — 6 to 10 pairs');
}

function goHome() {
  level = null;
  curtain.hidden = true;
  gameScreen.hidden = true;
  home.hidden = false;
  Voice.stop();
  if (location.hash) history.replaceState(null, '', location.pathname);
}

function openLevel(id) {
  level = LEVEL_BY_ID[id];
  if (!level) return goHome();

  // theme the whole game screen
  document.documentElement.style.setProperty('--theme-a', level.theme[0]);
  document.documentElement.style.setProperty('--theme-b', level.theme[1]);

  home.hidden = true;
  gameScreen.hidden = false;
  curtain.hidden = true;

  brandMark.textContent = level.emoji;
  levelTitle.textContent = level.title;
  idleEmoji.textContent = level.emoji;
  idleTitle.textContent = level.idleTitle || 'What will you find?';
  idleText.textContent = 'Find two cards that look the same, and something wonderful will pop up right here.';
  idleCount.textContent = `${level.items.length} to discover`;

  fact.hidden = true;
  panelIdle.hidden = false;
  current = null;

  roundIndex = 0;
  pool = [];
  history.replaceState(null, '', '#' + level.id);
  buildRound();
}

/* =============================================================
   Board building
   ============================================================= */
function buildRound() {
  const cfg = rounds()[roundIndex];

  // top up the pool so cards don't repeat until all have appeared
  if (pool.length < cfg.pairs) pool = shuffle(level.items);
  const picks = pool.slice(0, cfg.pairs);
  pool = pool.slice(cfg.pairs);

  deck = shuffle([...picks, ...picks]);
  matched = 0;
  first = null;
  busy = false;

  board.style.setProperty('--cols', cfg.cols);
  board.style.setProperty('--rows', cfg.rows);
  board.innerHTML = '';

  deck.forEach((item, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.style.animationDelay = `${i * 55}ms`;
    tile.dataset.id = item.id;
    tile.setAttribute('aria-label', 'Hidden card. Tap to turn it over.');
    tile.innerHTML = `
      <span class="tile-inner">
        <span class="face face-back">${backIcon(item.color)}</span>
        <span class="face face-front">${faceFront(item)}</span>
      </span>`;
    tile.addEventListener('click', () => onTileClick(tile, item));
    board.appendChild(tile);
  });

  pips.innerHTML = '';
  for (let i = 0; i < cfg.pairs; i++) {
    const p = document.createElement('span');
    p.className = 'pip';
    pips.appendChild(p);
  }

  levelSub.textContent = `Round ${roundIndex + 1} of 3 · find ${cfg.pairs} pairs`;
  hint.textContent = roundIndex === 0
    ? 'Tap a card to see what is hiding!'
    : `Round ${roundIndex + 1} — find ${cfg.pairs} pairs!`;
}

/* =============================================================
   Play
   ============================================================= */
function onTileClick(tile, item) {
  if (busy || tile.classList.contains('flipped') || tile.classList.contains('matched')) return;

  // browsers need a gesture before audio and speech will start
  if (actx && actx.state === 'suspended') actx.resume();
  Voice.unlock();

  tile.classList.add('flipped');
  tile.setAttribute('aria-label', item.name);
  SFX.flip();

  if (!first) {
    first = { tile, item };
    hint.textContent = 'Now find its twin!';
    return;
  }

  if (first.tile === tile) return;   // ignore a double-tap on one card

  busy = true;

  if (first.item.id === item.id) {
    /* ---- MATCH ---- */
    const a = first.tile, b = tile;
    setTimeout(() => {
      a.classList.add('matched'); b.classList.add('matched');
      a.classList.remove('flipped'); b.classList.remove('flipped');
      SFX.match();
      showFact(item);
      matched++;
      pips.children[matched - 1]?.classList.add('on');
      hint.textContent = CHEERS[Math.floor(Math.random() * CHEERS.length)];
      first = null;
      busy = false;

      if (matched === rounds()[roundIndex].pairs) setTimeout(finishRound, 1400);
    }, 420);

  } else {
    /* ---- NO MATCH ---- */
    const a = first.tile, b = tile;
    setTimeout(() => {
      a.classList.add('wrong'); b.classList.add('wrong');
      SFX.wrong();
    }, 500);
    setTimeout(() => {
      [a, b].forEach(t => {
        t.classList.remove('flipped', 'wrong');
        t.setAttribute('aria-label', 'Hidden card. Tap to turn it over.');
      });
      first = null;
      busy = false;
      hint.textContent = 'Try again — you can do it!';
    }, 1250);
  }
}

/* ---- the side panel: what you just found ---- */
function showFact(item) {
  current = item;
  panelIdle.hidden = true;
  fact.hidden = false;

  factFace(item);
  factName.textContent = item.name;
  factRole.textContent = item.role;
  factYears.textContent = item.years;
  factText.textContent = item.fact;

  // replay the entry animation
  fact.style.animation = 'none';
  void fact.offsetWidth;
  fact.style.animation = '';

  speak(item.say);
}

/* =============================================================
   Round + game completion
   ============================================================= */
function finishRound() {
  const last = roundIndex === rounds().length - 1;

  trophyEmoji.textContent = last ? '🏆' : '🎉';
  curtainTitle.textContent = last ? 'You did it!' : 'Round complete!';
  curtainText.textContent = last
    ? `You finished all three rounds of ${level.title}. Amazing work!`
    : 'You found all the pairs. Ready for more?';
  curtainBtn.textContent = last ? 'Play again ↻' : 'Next round →';

  curtainStars.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const st = document.createElement('span');
    st.textContent = i <= roundIndex ? '⭐' : '☆';
    st.style.animationDelay = `${i * 140}ms`;
    curtainStars.appendChild(st);
  }

  curtain.hidden = false;
  SFX.win();
  confetti();
  speak(last ? 'You did it! Well done.' : 'Round complete!');
  curtainBtn.focus();
}

/* =============================================================
   Controls
   ============================================================= */
curtainBtn.addEventListener('click', () => {
  curtain.hidden = true;
  roundIndex = (roundIndex + 1) % rounds().length;
  if (roundIndex === 0) pool = [];         // fresh game → reshuffle everyone
  buildRound();
});

curtainHomeBtn.addEventListener('click', goHome);
backBtn.addEventListener('click', goHome);

restartBtn.addEventListener('click', () => {
  curtain.hidden = true;
  roundIndex = 0;
  pool = [];
  fact.hidden = true;
  panelIdle.hidden = false;
  current = null;
  buildRound();
});

function setSound(on) {
  soundOn = on;
  [soundBtn, homeSoundBtn].forEach(b => b.setAttribute('aria-pressed', String(on)));
  soundBtn.title = on ? 'Sound on' : 'Sound off';
  const label = homeSoundBtn.querySelector('.snd-label');
  if (label) label.textContent = on ? 'Sound on' : 'Sound off';
  if (!on) Voice.stop(); else SFX.flip();
}
[soundBtn, homeSoundBtn].forEach(b => b.addEventListener('click', () => {
  Voice.unlock();
  setSound(!soundOn);
}));

sayBtn.addEventListener('click', () => {
  if (!current) return;
  Voice.unlock();
  speak(`${current.say}. ${current.fact}`);
});

/* Escape backs out to the home screen */
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !gameScreen.hidden) goHome();
});

/* Changing the hash — by hand, or with the browser's back button —
   should move between levels rather than silently do nothing. */
addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (!id) { if (level) goHome(); }
  else if (LEVEL_BY_ID[id] && (!level || level.id !== id)) openLevel(id);
});

/* =============================================================
   Confetti
   ============================================================= */
const cv = $('confetti'), ctx2d = cv.getContext('2d');
let bits = [], raf = null;

function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();
addEventListener('resize', sizeCanvas);

function confetti() {
  const colors = ['#FFC93C', '#FF7BA9', '#6C4CE0', '#3FD9B4', '#57C3F5', '#FF9E4A'];
  bits = Array.from({ length: 130 }, () => ({
    x: innerWidth * (0.15 + Math.random() * 0.7),
    y: -20 - Math.random() * innerHeight * 0.4,
    w: 7 + Math.random() * 9,
    h: 9 + Math.random() * 12,
    vy: 2.2 + Math.random() * 3.4,
    vx: (Math.random() - 0.5) * 2.4,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.22,
    c: colors[(Math.random() * colors.length) | 0],
    round: Math.random() < 0.35
  }));
  cancelAnimationFrame(raf);
  tick();
}

function tick() {
  ctx2d.clearRect(0, 0, innerWidth, innerHeight);
  let alive = false;
  for (const b of bits) {
    b.y += b.vy; b.x += b.vx + Math.sin(b.y / 45) * 0.7; b.rot += b.vr;
    if (b.y < innerHeight + 40) alive = true;
    ctx2d.save();
    ctx2d.translate(b.x, b.y);
    ctx2d.rotate(b.rot);
    ctx2d.fillStyle = b.c;
    if (b.round) {
      ctx2d.beginPath();
      ctx2d.arc(0, 0, b.w / 2, 0, Math.PI * 2);
      ctx2d.fill();
    } else {
      ctx2d.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }
    ctx2d.restore();
  }
  if (alive) raf = requestAnimationFrame(tick);
  else ctx2d.clearRect(0, 0, innerWidth, innerHeight);
}

/* =============================================================
   Go — deep link straight into a level with #dinosaurs, etc.
   ============================================================= */
buildHome();

const startId = location.hash.slice(1);
if (LEVEL_BY_ID[startId]) openLevel(startId); else goHome();
