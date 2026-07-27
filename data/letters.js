/* Letters — drawn cards (kind: 'glyph').
   S A T P I N M D is a common early phonics order: frequent, mostly
   distinct sounds that quickly build words like sat, pin, map and dip.
   Each card pairs the capital with its lowercase partner, and the
   spoken line gives the letter NAME and its SOUND together. */

const LETTERS = [
  {
    id: 'l_s', name: 'S', say: 'The letter S. S says sss, like sun.',
    role: 'Say and sound', years: 'S is for Sun',
    fact: 'S is for Sun! Say sss and trace a curvy S in the air.',
    color: '#FF6B6B', glyph: 'S', lower: 's', emoji: '☀️'
  },
  {
    id: 'l_a', name: 'A', say: 'The letter A. A says ah, like apple.',
    role: 'Say and sound', years: 'A is for Apple',
    fact: 'A is for Apple! Say ah and listen for the first sound in apple.',
    color: '#4D96FF', glyph: 'A', lower: 'a', emoji: '🍎'
  },
  {
    id: 'l_t', name: 'T', say: 'The letter T. T says tuh, like tiger.',
    role: 'Say and sound', years: 'T is for Tiger',
    fact: 'T is for Tiger! Tap the table while you say tuh, tuh, tuh.',
    color: '#E0A800', glyph: 'T', lower: 't', emoji: '🐯'
  },
  {
    id: 'l_p', name: 'P', say: 'The letter P. P says puh, like pig.',
    role: 'Say and sound', years: 'P is for Pig',
    fact: 'P is for Pig! Press your lips together, then pop out puh.',
    color: '#3EA556', glyph: 'P', lower: 'p', emoji: '🐷'
  },
  {
    id: 'l_i', name: 'I', say: 'The letter I. I says ih, like insect.',
    role: 'Say and sound', years: 'I is for Insect',
    fact: 'I is for Insect! Say ih, the short sound at the start of insect.',
    color: '#FF8C42', glyph: 'I', lower: 'i', emoji: '🐛'
  },
  {
    id: 'l_n', name: 'N', say: 'The letter N. N says nnn, like nest.',
    role: 'Say and sound', years: 'N is for Nest',
    fact: 'N is for Nest! Hum nnn and point to your nose.',
    color: '#9B5DE5', glyph: 'N', lower: 'n', emoji: '🪺'
  },
  {
    id: 'l_m', name: 'M', say: 'The letter M. M says mmm, like moon.',
    role: 'Say and sound', years: 'M is for Moon',
    fact: 'M is for Moon! Close your lips and hum mmm.',
    color: '#E14C9B', glyph: 'M', lower: 'm', emoji: '🌙'
  },
  {
    id: 'l_d', name: 'D', say: 'The letter D. D says duh, like dog.',
    role: 'Say and sound', years: 'D is for Dog',
    fact: 'D is for Dog! Tap your tongue behind your teeth and say duh.',
    color: '#009688', glyph: 'D', lower: 'd', emoji: '🐶'
  }
];
