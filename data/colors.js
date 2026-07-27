/* Colors — drawn cards (kind: 'swatch').
   The card face is the colour itself, but colour is never the ONLY cue:
   every card also carries its written name and an object emoji, so the
   level still works for a colourblind child.
   `ink` is the text colour that passes WCAG AA on that swatch.
   Hues are also separated by lightness (red vs green, blue vs orange). */

const COLORS = [
  {
    id: 'c_red', name: 'Red', say: 'Red',
    role: 'Color detective', years: 'Like a strawberry',
    fact: 'Red is the color of strawberries and fire trucks. Can you spot something red?',
    color: '#C62828', ink: '#FFFFFF', emoji: '🍓'
  },
  {
    id: 'c_blue', name: 'Blue', say: 'Blue',
    role: 'Color detective', years: 'Like the sky',
    fact: 'Blue is the color of the sky and deep water. Can you find something blue?',
    color: '#0086C9', ink: '#FFFFFF', emoji: '🐋'
  },
  {
    id: 'c_yellow', name: 'Yellow', say: 'Yellow',
    role: 'Color detective', years: 'Like sunshine',
    fact: 'Yellow is bright like sunshine and bananas. Point to something yellow.',
    color: '#F7E35F', ink: '#3A2E00', emoji: '☀️'
  },
  {
    id: 'c_green', name: 'Green', say: 'Green',
    role: 'Color detective', years: 'Like a frog',
    fact: 'Green is the color of frogs and fresh leaves. Can you spot something green?',
    color: '#3FA34D', ink: '#FFFFFF', emoji: '🐸'
  },
  {
    id: 'c_orange', name: 'Orange', say: 'Orange',
    role: 'Color detective', years: 'Like an orange',
    fact: 'Orange is the color of oranges and pumpkins. Can you find something orange?',
    color: '#F28E2B', ink: '#3A2000', emoji: '🍊'
  },
  {
    id: 'c_purple', name: 'Purple', say: 'Purple',
    role: 'Color detective', years: 'Like grapes',
    fact: 'Purple is the color of grapes and violets. Can you spot something purple?',
    color: '#5B2A8C', ink: '#FFFFFF', emoji: '🍇'
  },
  {
    id: 'c_pink', name: 'Pink', say: 'Pink',
    role: 'Color detective', years: 'Like a flamingo',
    fact: 'Pink is the color of flamingos and some flowers. Can you find something pink?',
    color: '#F4A6C8', ink: '#4A1330', emoji: '🦩'
  },
  {
    id: 'c_white', name: 'White', say: 'White',
    role: 'Color detective', years: 'Like a cloud',
    fact: 'White is the color of clouds and fresh snow. Can you spot something white?',
    color: '#FFFFFF', ink: '#2B2350', emoji: '☁️'
  }
];
