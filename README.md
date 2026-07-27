# 🧩 Wonderflip

**Flip a card, find a friend, learn a thing.**

A memory matching game for **ages 3–5**, with eleven levels — real scientists,
dinosaurs, planets, animals, bugs, tools, vehicles, weather, numbers, letters
and colors.

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

Each level plays three rounds that grow gently: 3 pairs (3 × 2), then
4 pairs (4 × 2), then 6 pairs (4 × 3). Cards are drawn from a shuffled pool,
so nothing repeats until everything has appeared.

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
js/levels.js      the level registry
js/game.js        routing, board, sound, confetti
data/*.js         card data, one file per level
img/<level>/      photos, 640×640
CREDITS.md        full photo attribution
netlify.toml      static deploy config (no build step)
```

## Adding a level

1. Write `data/mylevel.js` exporting a `const MYLEVEL = [...]` array.
2. Add a `<script>` tag for it in `index.html`, before `js/levels.js`.
3. Append an entry to `LEVELS` in `js/levels.js`:

```js
{
  id: 'mylevel', title: 'My Level', emoji: '🌟',
  blurb: 'One short line',
  theme: ['#2E9E5B', '#8FD14F'],   // tints the whole level
  kind: 'photo',                   // 'photo' | 'glyph' | 'swatch'
  items: MYLEVEL
}
```

4. For `kind: 'photo'`, drop square images at `img/mylevel/<id>.jpg`.

Keep facts to one or two short sentences with a concrete image a preschooler
can picture. `color` tints that card's back.

Image credits are in [CREDITS.md](CREDITS.md).
