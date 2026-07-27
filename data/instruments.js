/* Level: Musical Instruments — 16 instruments from around the world */
const INSTRUMENTS = [
  {
    id: 'guitar', name: 'Guitar', say: 'Guitar',
    role: 'Strings', years: 'Strum and pluck',
    fact: 'Pluck or strum the six strings to make a bright twang. The hollow wooden body helps every note ring out loud.',
    color: '#7A4A2A'
  },
  {
    id: 'piano', name: 'Piano', say: 'Piano',
    role: 'Keys', years: 'Press the keys',
    fact: 'Press the black and white keys to make notes go ping and boom. Tiny hammers inside tap long metal strings.',
    color: '#4B5563'
  },
  {
    id: 'violin', name: 'Violin', say: 'Violin',
    role: 'Strings', years: 'Bow and pluck',
    fact: 'Slide a bow across four strings to make a sweet singing sound. A violin can chirp softly or soar very high.',
    color: '#B85C2E'
  },
  {
    id: 'drum-kit', name: 'Drum Kit', say: 'Drum Kit',
    role: 'Percussion', years: 'Hit and tap',
    fact: 'Tap the drums and cymbals with sticks for boom, crash and rat-a-tat. One player can make many sounds at once.',
    color: '#5B7FA3'
  },
  {
    id: 'trumpet', name: 'Trumpet', say: 'Trumpet',
    role: 'Brass', years: 'Blow and buzz',
    fact: 'Buzz your lips and blow to make a bright toot. Pressing three valves changes the notes while the wide bell makes them loud.',
    color: '#D6A83D'
  },
  {
    id: 'pan-flute', name: 'Pan Flute', say: 'Pan Flute',
    role: 'Woodwind', years: 'Blow across tubes',
    fact: 'Blow across the tops of the tubes to make a soft whoo. Each tube has a different length and sings a different note.',
    color: '#E8C45B'
  },
  {
    id: 'saxophone', name: 'Saxophone', say: 'Saxophone',
    role: 'Woodwind', years: 'Blow and press',
    fact: 'Blow through a small reed and press the shiny keys for a jazzy honk. The curved bell sends the sound out.',
    color: '#C8902F'
  },
  {
    id: 'harp', name: 'Harp', say: 'Harp',
    role: 'Strings', years: 'Pluck the strings',
    fact: 'Pluck the many strings with your fingers to make a gentle shimmer. Short strings sound high and long strings sound low.',
    color: '#D9914B'
  },
  {
    id: 'accordion', name: 'Accordion', say: 'Accordion',
    role: 'Keys', years: 'Squeeze and press',
    fact: 'Squeeze the folded middle and press the buttons to make a bouncy wheeze. It breathes air in and out like a bellows.',
    color: '#B3263D'
  },
  {
    id: 'tambourine', name: 'Tambourine', say: 'Tambourine',
    role: 'Percussion', years: 'Shake it',
    fact: 'Shake or tap the round hoop to make the metal discs jingle. A quick wrist wiggle makes a bright shimmering sound.',
    color: '#B35332'
  },
  {
    id: 'xylophone', name: 'Xylophone', say: 'Zy-lo-phone',
    role: 'Percussion', years: 'Hit and tap',
    fact: 'Tap the wooden bars with mallets to make clear pinging notes. Each bar has its own size and its own sound.',
    color: '#6C7A52'
  },
  {
    id: 'maracas', name: 'Maracas', say: 'Maracas',
    role: 'Percussion', years: 'Shake it',
    fact: 'Shake the handles to make a swish and rattle. Little seeds or beads bounce around inside the hollow shells.',
    color: '#9AAE35'
  },
  {
    id: 'djembe', name: 'Djembe', say: 'Jem-bay',
    role: 'Percussion', years: 'Hit and tap',
    fact: 'Tap the drum skin with your hands for a deep boom or sharp slap. This goblet-shaped drum comes from West Africa.',
    color: '#A9602C'
  },
  {
    id: 'sitar', name: 'Sitar', say: 'Sih-tar',
    role: 'Strings', years: 'Pluck the strings',
    fact: 'Pluck the long strings to make a bright twang and hum. Extra strings underneath ring along and make the sound sparkle.',
    color: '#665A52'
  },
  {
    id: 'steel-drum', name: 'Steel Drum', say: 'Steel Drum',
    role: 'Percussion', years: 'Hit and tap',
    fact: 'Tap the shiny metal dents with soft sticks to make warm pinging notes. Steel drums were created in Trinidad and Tobago.',
    color: '#B8A58E'
  },
  {
    id: 'kalimba', name: 'Kalimba', say: 'Kah-lim-bah',
    role: 'Percussion', years: 'Pluck with thumbs',
    fact: 'Pluck the metal strips with your thumbs to make tiny plinks and hums. The wooden box helps the notes sound bigger.',
    color: '#8B4C2F'
  }
];
