# 🧩 Wonderflip

**Flip a card, find a friend, learn a thing.**

A memory matching game for **ages 3–5** — real scientists, dinosaurs, planets,
animals, bugs, tools, vehicles, weather, numbers, letters and colors — plus a
**big kid shelf for ages 5+** with world flags, state flags, landmarks,
instruments and explorers on much larger boards.

Every time a child finds a pair, a **fact card appears in the side panel** —
deliberately placed away from the play area so it never covers the cards or
interrupts the tapping. The card shows the picture, a short label, and one
warm, concrete fact, read aloud in a natural voice.

## Run it

No build step, no dependencies, no network calls at runtime.

```bash
cd wonderflip
python3 -m http.server 8899
# → http://localhost:8899
```

> Opening `index.html` directly with `file://` mostly works, but a local
> server is recommended so images load without restrictions.

Add a level id to the URL to jump straight in: `…:8899/#dinosaurs`.

## The levels

Two shelves. **First adventures** are the gentle ones; **big kid challenges**
start where those finish and run on a much wider board.

### First adventures — ages 3–5

| Level | Cards | What it's for |
|---|---|---|
| 🔬 Star Scientists | 12 | Real science heroes across eras and fields |
| 🦕 Dinosaurs | 8 | Giants from long ago |
| 🪐 Planets | 8 | The eight planets, in order from the Sun |
| 🐘 Animals | 8 | Familiar animals and one thing each one does |
| 🐞 Bugs | 8 | Tiny garden creatures |
| 🔨 Tools | 8 | Things that help us build |
| 🚒 Vehicles | 8 | Trucks, trains, boats and bikes |
| 🌈 Weather | 8 | Sun, rain, snow and storms |
| 🔢 Numbers | 8 | 1–8, each numeral shown with countable dots |
| 🔤 Letters | 8 | S A T P I N M D, name *and* sound together |
| 🎨 Colors | 8 | Eight colors, each with a name and an object |

Three rounds that grow gently: 3 pairs (3 × 2), 4 pairs (4 × 2), 6 pairs (4 × 3).

### Big kid challenges — ages 5+

| Level | Cards | What it's for |
|---|---|---|
| 🌍 World Flags | 20 | Flags from every continent, with capitals |
| 🦅 State Flags | 16 | The boldest US state flags |
| 🗼 World Landmarks | 16 | Famous places and how old they are |
| 🎺 Instruments | 16 | Instrument families and the sounds they make |
| 🧭 Explorers | 16 | People who went first, by land, sea, ice and space |

Three bigger rounds: 6 pairs (4 × 3), 8 pairs (4 × 4), 10 pairs (5 × 4).

On both shelves cards are drawn from a shuffled pool, so nothing repeats until
everything has appeared.

**Why those flags and not others.** Roughly twenty US state flags are a seal on
a plain blue field, and a good few national flags differ only in stripe order.
At card size those are indistinguishable, which does not make the game *harder* —
it makes it broken, because a child cannot tell a right flip from a wrong one.
Both flag levels are curated down to designs that stay distinct at thumbnail
size, which is also why State Flags has 16 cards rather than 50.

## Designed for small children

- **Big tap targets** — cards fill the screen; no small hit areas.
- **No timer, no score, no losing.** Wrong guesses shake gently, say
  "Try again — you can do it!", and flip back.
- **A real voice, not a robot.** `js/speech.js` picks the best natural voice
  the platform offers (Windows Natural, Google, Apple Samantha/Ava) instead of
  accepting the default, which on many machines is a buzzy eSpeak. Rate is
  slightly slow at 0.90 and pitch is left neutral — pitching a synthetic voice
  up is what makes kids' apps sound uncanny. The Windows Natural voices are
  cloud-synthesized, so if one fails the module drops to the best *local*
  voice and repeats the line, keeping the game usable with no network.
- **Faces stay visible.** Matched cards remain face-up so kids can point and
  name them.
- **Colour is never the only cue.** The Colors level labels every swatch with
  its written name and an object emoji, and the palette separates hues by
  lightness as well, so it works for a colourblind child.
- **Soft feedback everywhere** — chimes made with WebAudio (no audio files),
  confetti, star stamps, progress pips.
- **Sound can be muted** from the home screen or in-game.
- `prefers-reduced-motion` is respected; the layout is responsive down to
  phone width. `Esc` returns to the level picker.

## Pedagogy notes

- **Numbers** show 1–8. 1–5 are the subitising core (a young child can *see*
  those quantities without counting); 6–8 extend one-to-one counting. Every
  numeral is paired with that many dots so the quantity is visible, not just
  the symbol.
- **Letters** use **S A T P I N M D** — a common early phonics order chosen
  because those sounds are frequent, mostly distinct, and quickly build real
  words (*sat*, *pin*, *map*, *dip*). Each card shows the capital with its
  lowercase partner, and the voice gives the letter **name and sound
  together**, which the evidence favours over either alone.

## Files

```
index.html        markup: home screen, game screen, trophy screen
style.css         all styling and animation
js/speech.js      voice selection, chunking, gesture unlock
js/levels.js      the level registry and the two round ladders
js/game.js        routing, board, sound, confetti
data/*.js         card data, one file per level
img/<level>/      photos 640×640, or flag SVGs
CREDITS.md        full image attribution
netlify.toml      static deploy config (no build step)

tools/            build-time only, never shipped to the browser
  fetch_commons.py    download + licence-check art from Wikimedia Commons
  build_credits.py    turn the fetch sidecars into CREDITS.md rows
  check_levels.js     verify every level would actually play
```

### Checking your work

```bash
node tools/check_levels.js
```

Loads the data files exactly as the browser does and proves each level plays:
every card has its art on disk, no duplicate or missing ids, no board that asks
for more tiles than fit, and no round wanting more pairs than the level has.

## Adding a level

1. Write `data/mylevel.js` exporting a `const MYLEVEL = [...]` array.
2. Add a `<script>` tag for it in `index.html`, before `js/levels.js`.
3. Append an entry to `LEVELS` in `js/levels.js`:

```js
{
  id: 'mylevel', title: 'My Level', emoji: '🌟',
  blurb: 'One short line',
  theme: ['#2E9E5B', '#8FD14F'],   // tints the whole level
  kind: 'photo',                   // 'photo' | 'flag' | 'glyph' | 'swatch'
  items: MYLEVEL,
  tier: 'little'                   // 'little' (3→6 pairs) | 'big' (6→10)
}
```

4. For `kind: 'photo'`, drop square images at `img/mylevel/<id>.jpg`; for
   `kind: 'flag'`, drop `img/mylevel/<id>.svg` (shown whole, never cropped).
5. Run `node tools/check_levels.js`.

A `tier` of `'big'` needs at least 10 cards, since its last round deals 10
pairs. To set a level's own ladder, give it `rounds: [{pairs, cols, rows}, …]`
— `cols × rows` must equal `pairs × 2`.

`tools/fetch_commons.py` handles sourcing art:

```bash
echo '[{"id":"japan","file":"Flag of Japan.svg"}]' > /tmp/list.json
python3 tools/fetch_commons.py --level mylevel --mode svg --list /tmp/list.json
```

It refuses anything that is not public domain, CC0, PD-Mark, CC BY or CC BY-SA,
so a card can never ship with art the project cannot reuse. `--mode photo`
centre-crops to 640 × 640; pass `"focus": 0.35` on an item to lift the crop
toward the top of the frame, which portraits usually need.

Keep facts to one or two short sentences with a concrete image a preschooler
can picture. `color` tints that card's back.

Image credits are in [CREDITS.md](CREDITS.md).
