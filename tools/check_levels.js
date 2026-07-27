/* =============================================================
   Sanity check for every level. Run with:  node tools/check_levels.js

   Loads the data files and js/levels.js exactly as the browser would,
   then proves each level would actually play: enough cards for its
   biggest round, every card has its art on disk, no duplicate ids,
   no missing fields, and no board that asks for more tiles than fit.
   ============================================================= */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* Load the scripts in the same order index.html does, so a level that
   forgets its <script> tag fails here rather than in the browser.

   They are concatenated into one script on purpose: the data files
   declare `const SCIENTISTS = …` and a top-level const does NOT become a
   property of the global object, so running each file separately would
   leave levels.js unable to see any of them. Classic <script> tags in a
   browser share one global lexical scope, and joining the sources is how
   that gets reproduced here. */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m => m[1])
  .filter(src => src.startsWith('data/') || src === 'js/levels.js');

const missing = scripts.filter(src => !fs.existsSync(path.join(root, src)));
if (missing.length) {
  for (const src of missing) console.error(`FAIL  index.html loads ${src}, which does not exist`);
  process.exit(1);
}

/* each file is checked for parse errors on its own first, so a syntax
   error names the file it is actually in */
for (const src of scripts) {
  try {
    new vm.Script(fs.readFileSync(path.join(root, src), 'utf8'), { filename: src });
  } catch (err) {
    console.error(`FAIL  ${src} — ${err.message}`);
    process.exit(1);
  }
}

const bundle = scripts
  .map(src => fs.readFileSync(path.join(root, src), 'utf8'))
  .join('\n;\n') + '\n; LEVELS';

let LEVELS;
try {
  LEVELS = vm.runInContext(bundle, vm.createContext({ console }), { filename: 'bundle' });
} catch (err) {
  console.error(`FAIL  loading levels — ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(LEVELS)) {
  console.error('FAIL  js/levels.js did not produce a LEVELS array');
  process.exit(1);
}
const FIELDS = ['id', 'name', 'say', 'role', 'years', 'fact', 'color'];
const EXT = { photo: 'jpg', flag: 'svg' };

let problems = 0;
const bad = (msg) => { console.error(`FAIL  ${msg}`); problems++; };

const seenLevelIds = new Set();

for (const lv of LEVELS) {
  const tag = lv.id;

  if (seenLevelIds.has(lv.id)) bad(`${tag}: duplicate level id`);
  seenLevelIds.add(lv.id);

  for (const key of ['title', 'blurb', 'emoji', 'theme', 'kind', 'items', 'rounds', 'tier']) {
    if (lv[key] == null) bad(`${tag}: level is missing "${key}"`);
  }
  if (!Array.isArray(lv.items) || !lv.items.length) {
    bad(`${tag}: no items`);
    continue;
  }

  /* a round can never need more distinct cards than the level has */
  const biggest = Math.max(...lv.rounds.map(r => r.pairs));
  if (biggest > lv.items.length) {
    bad(`${tag}: biggest round wants ${biggest} pairs but the level only has ${lv.items.length} cards`);
  }
  for (const r of lv.rounds) {
    if (r.cols * r.rows !== r.pairs * 2) {
      bad(`${tag}: a ${r.cols}x${r.rows} board holds ${r.cols * r.rows} tiles, but ${r.pairs} pairs need ${r.pairs * 2}`);
    }
  }

  const seen = new Set();
  for (const item of lv.items) {
    const who = `${tag}/${item.id || '(no id)'}`;

    for (const f of FIELDS) {
      if (!item[f] || !String(item[f]).trim()) bad(`${who}: missing "${f}"`);
    }
    if (seen.has(item.id)) bad(`${who}: duplicate card id`);
    seen.add(item.id);

    /* ids become filenames and URL fragments, so keep them to safe
       characters — underscores included, since the glyph and swatch
       levels have always used them (l_a, c_red). */
    if (item.id && !/^[a-z0-9_-]+$/.test(item.id)) {
      bad(`${who}: id should be lowercase letters, digits, hyphens and underscores only`);
    }
    if (item.color && !/^#[0-9a-f]{6}$/i.test(item.color)) {
      bad(`${who}: color "${item.color}" is not a 6-digit hex`);
    }

    /* the art must actually be on disk — a missing file is an empty card */
    const ext = EXT[lv.kind];
    if (ext) {
      const art = path.join(root, 'img', lv.id, `${item.id}.${ext}`);
      if (!fs.existsSync(art)) bad(`${who}: no art at img/${lv.id}/${item.id}.${ext}`);
      else if (fs.statSync(art).size < 100) bad(`${who}: art file is suspiciously tiny`);
    }
  }

  /* stray art with no card behind it — usually a renamed id */
  const dir = path.join(root, 'img', lv.id);
  if (EXT[lv.kind] && fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(`.${EXT[lv.kind]}`)) continue;
      const id = file.replace(`.${EXT[lv.kind]}`, '');
      if (!seen.has(id)) bad(`${tag}: img/${lv.id}/${file} has no card using it`);
    }
  }

  const ladder = lv.rounds.map(r => `${r.pairs}`).join('→');
  console.log(`ok    ${tag.padEnd(14)} ${String(lv.items.length).padStart(2)} cards  ${lv.kind.padEnd(6)} ${lv.tier.padEnd(6)} rounds ${ladder}`);
}

const total = LEVELS.reduce((n, lv) => n + lv.items.length, 0);
console.log(`\n${LEVELS.length} levels, ${total} cards`);

if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
console.log('All checks passed.');
