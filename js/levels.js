/* =============================================================
   Level registry.

   Every level is one object:
     id       folder name under img/ and the URL hash
     title    shown on the home screen and in the header
     blurb    one line for the home card
     emoji    home-card icon
     theme    two colours that tint the whole level
     kind     'photo'  → card face is img/<id>/<item>.jpg
              'glyph'  → card face is drawn (numbers / letters)
              'swatch' → card face is a solid colour (colors)
     items    the cards (see data/*.js)
   ============================================================= */

const LEVELS = [
  {
    id: 'scientists', title: 'Star Scientists', emoji: '🔬',
    blurb: 'Meet real science heroes',
    theme: ['#6C4CE0', '#B57BFF'], kind: 'photo', items: SCIENTISTS
  },
  {
    id: 'dinosaurs', title: 'Dinosaurs', emoji: '🦕',
    blurb: 'Giants from long ago',
    theme: ['#2E9E5B', '#8FD14F'], kind: 'photo', items: DINOSAURS
  },
  {
    id: 'planets', title: 'Planets', emoji: '🪐',
    blurb: 'Worlds in our sky',
    theme: ['#3B31A8', '#7B6FE8'], kind: 'photo', items: PLANETS
  },
  {
    id: 'animals', title: 'Animals', emoji: '🐘',
    blurb: 'Friends big and small',
    theme: ['#C4741C', '#F5B342'], kind: 'photo', items: ANIMALS
  },
  {
    id: 'insects', title: 'Bugs', emoji: '🐞',
    blurb: 'Tiny garden creatures',
    theme: ['#B03A5B', '#FF8FA8'], kind: 'photo', items: INSECTS
  },
  {
    id: 'tools', title: 'Tools', emoji: '🔨',
    blurb: 'Things that help us build',
    theme: ['#4A6B8A', '#7FB3D5'], kind: 'photo', items: TOOLS
  },
  {
    id: 'vehicles', title: 'Vehicles', emoji: '🚒',
    blurb: 'Go, go, go!',
    theme: ['#C9392B', '#FF8A6B'], kind: 'photo', items: VEHICLES
  },
  {
    id: 'weather', title: 'Weather', emoji: '🌈',
    blurb: 'Look up at the sky',
    theme: ['#2E86AB', '#7FD8F0'], kind: 'photo', items: WEATHER
  },
  {
    id: 'numbers', title: 'Numbers', emoji: '🔢',
    blurb: 'Count from 1 to 8',
    theme: ['#D4761E', '#FFC93C'], kind: 'glyph', items: NUMBERS
  },
  {
    id: 'letters', title: 'Letters', emoji: '🔤',
    blurb: 'Your first letters',
    theme: ['#7B2D8E', '#D68FE8'], kind: 'glyph', items: LETTERS
  },
  {
    id: 'colors', title: 'Colors', emoji: '🎨',
    blurb: 'Every color of the rainbow',
    theme: ['#0E7C7B', '#5FD9C8'], kind: 'swatch', items: COLORS
  }
];

const LEVEL_BY_ID = Object.fromEntries(LEVELS.map(l => [l.id, l]));
