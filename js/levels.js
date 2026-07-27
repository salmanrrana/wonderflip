/* =============================================================
   Level registry.

   Every level is one object:
     id       folder name under img/ and the URL hash
     title    shown on the home screen and in the header
     blurb    one line for the home card
     emoji    home-card icon
     theme    two colours that tint the whole level
     kind     'photo'  → card face is img/<id>/<item>.jpg
              'flag'   → card face is img/<id>/<item>.svg, shown whole
              'glyph'  → card face is drawn (numbers / letters)
              'swatch' → card face is a solid colour (colors)
     items    the cards (see data/*.js)
     tier     'little' (default) or 'big' — which shelf on the home
              screen, and which round ladder below
     rounds   optional override of the three rounds
   ============================================================= */

/* Three rounds, growing a little each time.

   The little ladder tops out at 6 pairs on a 4x3 board — about as much
   as a three-year-old can hold in their head at once. The big ladder
   goes to 10 pairs on 5x4 for the older levels (flags, landmarks), where
   the whole point is that it takes real remembering. */
const ROUNDS_LITTLE = [
  { pairs: 3, cols: 3, rows: 2 },
  { pairs: 4, cols: 4, rows: 2 },
  { pairs: 6, cols: 4, rows: 3 }
];

/* Read a level's card list without letting one bad file sink the rest.

   Each data/<level>.js declares a top-level const. If one fails to load,
   naming it here throws a ReferenceError while LEVELS is still being
   built — so LEVELS never exists and the home screen comes up completely
   empty. Passing the reference as a thunk lets that throw be caught per
   level: the broken one is dropped below, every other one still plays. */
const cards = (get) => {
  try {
    return get() || [];
  } catch (err) {
    return [];
  }
};

const ROUNDS_BIG = [
  { pairs: 6,  cols: 4, rows: 3 },
  { pairs: 8,  cols: 4, rows: 4 },
  { pairs: 10, cols: 5, rows: 4 }
];

const LEVELS = [
  {
    id: 'scientists', title: 'Star Scientists', emoji: '🔬',
    blurb: 'Meet real science heroes',
    theme: ['#6C4CE0', '#B57BFF'], kind: 'photo', items: cards(() => SCIENTISTS)
  },
  {
    id: 'dinosaurs', title: 'Dinosaurs', emoji: '🦕',
    blurb: 'Giants from long ago',
    theme: ['#2E9E5B', '#8FD14F'], kind: 'photo', items: cards(() => DINOSAURS)
  },
  {
    id: 'planets', title: 'Planets', emoji: '🪐',
    blurb: 'Worlds in our sky',
    theme: ['#3B31A8', '#7B6FE8'], kind: 'photo', items: cards(() => PLANETS)
  },
  {
    id: 'animals', title: 'Animals', emoji: '🐘',
    blurb: 'Friends big and small',
    theme: ['#C4741C', '#F5B342'], kind: 'photo', items: cards(() => ANIMALS)
  },
  {
    id: 'insects', title: 'Bugs', emoji: '🐞',
    blurb: 'Tiny garden creatures',
    theme: ['#B03A5B', '#FF8FA8'], kind: 'photo', items: cards(() => INSECTS)
  },
  {
    id: 'tools', title: 'Tools', emoji: '🔨',
    blurb: 'Things that help us build',
    theme: ['#4A6B8A', '#7FB3D5'], kind: 'photo', items: cards(() => TOOLS)
  },
  {
    id: 'vehicles', title: 'Vehicles', emoji: '🚒',
    blurb: 'Go, go, go!',
    theme: ['#C9392B', '#FF8A6B'], kind: 'photo', items: cards(() => VEHICLES)
  },
  {
    id: 'weather', title: 'Weather', emoji: '🌈',
    blurb: 'Look up at the sky',
    theme: ['#2E86AB', '#7FD8F0'], kind: 'photo', items: cards(() => WEATHER)
  },
  {
    id: 'numbers', title: 'Numbers', emoji: '🔢',
    blurb: 'Count from 1 to 8',
    theme: ['#D4761E', '#FFC93C'], kind: 'glyph', items: cards(() => NUMBERS)
  },
  {
    id: 'letters', title: 'Letters', emoji: '🔤',
    blurb: 'Your first letters',
    theme: ['#7B2D8E', '#D68FE8'], kind: 'glyph', items: cards(() => LETTERS)
  },
  {
    id: 'colors', title: 'Colors', emoji: '🎨',
    blurb: 'Every color of the rainbow',
    theme: ['#0E7C7B', '#5FD9C8'], kind: 'swatch', items: cards(() => COLORS)
  },

  /* ---- big-kid shelf: more cards, bigger boards ---- */
  {
    id: 'flags-world', title: 'World Flags', emoji: '🌍',
    blurb: 'Flags from every continent',
    idleTitle: 'Where will you go?',
    theme: ['#1F6FB2', '#5FC9F0'], kind: 'flag', items: cards(() => FLAGS_WORLD),
    tier: 'big'
  },
  {
    id: 'flags-usa', title: 'State Flags', emoji: '🦅',
    blurb: 'Bold flags of the states',
    idleTitle: 'Which state will you find?',
    theme: ['#9B2335', '#F07A6B'], kind: 'flag', items: cards(() => FLAGS_USA),
    tier: 'big'
  },
  {
    id: 'landmarks', title: 'World Landmarks', emoji: '🗼',
    blurb: 'Famous places to visit',
    idleTitle: 'Where will you go?',
    theme: ['#7A5C2E', '#E0B06A'], kind: 'photo', items: cards(() => LANDMARKS),
    tier: 'big'
  },
  {
    id: 'instruments', title: 'Instruments', emoji: '🎺',
    blurb: 'Music from around the world',
    idleTitle: 'What will you hear?',
    theme: ['#8E3B8E', '#E88FD8'], kind: 'photo', items: cards(() => INSTRUMENTS),
    tier: 'big'
  },
  {
    id: 'explorers', title: 'Explorers', emoji: '🧭',
    blurb: 'Brave people who went first',
    idleTitle: 'Who will you meet?',
    theme: ['#1A6B6B', '#5FD0C0'], kind: 'photo', items: cards(() => EXPLORERS),
    tier: 'big'
  }
];

/* fill in the defaults so the engine never has to ask */
LEVELS.forEach(lv => {
  lv.tier ||= 'little';
  lv.rounds ||= lv.tier === 'big' ? ROUNDS_BIG : ROUNDS_LITTLE;
});

/* Drop any level whose data file failed to load.

   Without this, one missing data/<level>.js throws while this array is
   being built, LEVELS never exists, and the home screen renders no levels
   at all — every other level goes dark because of one bad file. A child
   losing one adventure is a small problem; losing all of them is not. */
for (let i = LEVELS.length - 1; i >= 0; i--) {
  const lv = LEVELS[i];
  if (!Array.isArray(lv.items) || !lv.items.length) {
    console.error(`Wonderflip: level "${lv.id}" has no cards — skipping it.`);
    LEVELS.splice(i, 1);
  }
}

const LEVEL_BY_ID = Object.fromEntries(LEVELS.map(l => [l.id, l]));
