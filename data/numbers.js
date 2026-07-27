/* Numbers — drawn cards (kind: 'glyph').
   `glyph` is the numeral shown on the card, `dots` the counting array
   beneath it so the quantity is visible, not just the symbol.
   1–5 are the subitising core; 6–8 extend one-to-one counting. */

const NUMBERS = [
  {
    id: 'n1', name: '1', say: 'One',
    role: 'Count with me', years: 'One apple',
    fact: 'One! Hold up one finger. Can you find one nose on your face?',
    color: '#FF6B6B', glyph: '1', dots: 1
  },
  {
    id: 'n2', name: '2', say: 'Two',
    role: 'Count with me', years: 'Two shoes',
    fact: 'Two! Touch your two shoes, counting each one: one, two.',
    color: '#4D96FF', glyph: '2', dots: 2
  },
  {
    id: 'n3', name: '3', say: 'Three',
    role: 'Count with me', years: 'Three balloons',
    fact: 'Three! Count three balloons slowly. Point once to each balloon.',
    color: '#E0A800', glyph: '3', dots: 3
  },
  {
    id: 'n4', name: '4', say: 'Four',
    role: 'Count with me', years: 'Four wheels',
    fact: 'Four! A car has four wheels. Count them: one, two, three, four.',
    color: '#3EA556', glyph: '4', dots: 4
  },
  {
    id: 'n5', name: '5', say: 'Five',
    role: 'Count with me', years: 'Five fingers',
    fact: 'Five! Spread one hand and count your five fingers, thumb to pinky.',
    color: '#FF8C42', glyph: '5', dots: 5
  },
  {
    id: 'n6', name: '6', say: 'Six',
    role: 'Count with me', years: 'Six crayons',
    fact: 'Six! Line up six crayons and touch each crayon as you count.',
    color: '#9B5DE5', glyph: '6', dots: 6
  },
  {
    id: 'n7', name: '7', say: 'Seven',
    role: 'Count with me', years: 'Seven stars',
    fact: 'Seven! Count seven stars. The last number you say tells how many.',
    color: '#E14C9B', glyph: '7', dots: 7
  },
  {
    id: 'n8', name: '8', say: 'Eight',
    role: 'Count with me', years: 'Eight blocks',
    fact: 'Eight! Build a tower with eight blocks, adding one for each number.',
    color: '#009688', glyph: '8', dots: 8
  }
];
