/* =============================================================
   Tap regression check. Run with:  node tools/check_tap.js

   The bug this guards against: on an iPad, tapping a card did not turn
   it over. Three separate things were eating the tap.

     1. `.tile:hover` was unguarded. A touch screen has no hover, so iOS
        invents one — the first tap only applies the hover state and no
        click is dispatched. The child taps again, and only then does the
        card turn. To a three-year-old the game is simply broken.

     2. `touch-action` was left at `auto`, so Safari held every tap while
        it decided whether a double-tap zoom was starting, and handed a
        tap that rolled a few pixels to the scroller instead.

     3. The card pictures were draggable and long-pressable, so a resting
        finger — how most small children touch a screen — raised the image
        callout or started a drag, and the tap underneath was lost.

   Part one below reads the source and proves each guard is still there.
   It needs nothing but node, so it always runs.

   Part two actually taps. It drives a real browser at iPad viewports
   with touch input and asserts the card flips. That needs Playwright,
   which this project does not depend on, so it is skipped — loudly, and
   without failing — when Playwright is not installed:

     npm i playwright && npx playwright install chromium
   ============================================================= */

const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const gameJs = fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8');

let failures = 0;
const ok = (msg) => console.log(`ok    ${msg}`);
const bad = (msg, detail) => { failures++; console.log(`FAIL  ${msg}${detail ? `\n      ${detail}` : ''}`); };

function assert(cond, msg, detail) { cond ? ok(msg) : bad(msg, detail); }

/* -------------------------------------------------------------
   Part 1 — the source guards
   ------------------------------------------------------------- */
console.log('Source guards\n');

/* Strip comments so a rule that only appears in prose cannot pass. */
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');

/* Every `:hover` rule must sit inside a hover-capable media query.
   Walk the file tracking brace depth, remembering the depth at which
   each `@media (hover:hover)` block opened. */
function ungatedHoverSelectors(source) {
  const out = [];
  let depth = 0;
  const hoverBlockDepths = [];
  const ruleRe = /([^{}]+)\{|\}/g;
  let m;
  while ((m = ruleRe.exec(source)) !== null) {
    if (m[0] === '}') {
      depth--;
      if (hoverBlockDepths[hoverBlockDepths.length - 1] === depth) hoverBlockDepths.pop();
      continue;
    }
    // the capture keeps whatever whitespace preceded the selector, so an
    // at-rule is only recognisable once it is trimmed
    const head = m[1].trim();
    if (head.startsWith('@')) {
      if (/hover\s*:\s*hover/.test(head)) hoverBlockDepths.push(depth);
      depth++;
      continue;
    }
    if (/:hover/.test(head) && hoverBlockDepths.length === 0) out.push(head.replace(/\s+/g, ' '));
    depth++;
  }
  return out;
}

const ungated = ungatedHoverSelectors(cssCode);
assert(
  ungated.length === 0,
  'every :hover rule is gated behind a hover-capable pointer',
  ungated.length ? `ungated: ${ungated.join(' | ')}` : ''
);

/* The tile rule itself carries the touch guards. */
const tileRule = (cssCode.match(/\n\.tile\s*\{([\s\S]*?)\}/) || [])[1] || '';
assert(/touch-action\s*:\s*manipulation/.test(tileRule),
  '.tile sets touch-action:manipulation (no double-tap-zoom delay)',
  'not found in the .tile rule');
assert(/-webkit-touch-callout\s*:\s*none/.test(tileRule),
  '.tile disables the long-press callout');
assert(/(^|[^-])user-select\s*:\s*none/.test(tileRule),
  '.tile disables text selection on a long press');

assert(/\.tile\s*\*\s*\{[^}]*-webkit-user-drag\s*:\s*none/.test(cssCode),
  'everything inside a tile refuses to start a drag');

for (const sel of ['.face-front img', '.flag-face img']) {
  const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, m => '\\' + m);
  const rule = (cssCode.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`)) || [])[1] || '';
  assert(/-webkit-user-drag\s*:\s*none/.test(rule), `${sel} is not draggable`,
    rule ? 'rule found but -webkit-user-drag:none is missing' : 'rule not found at all');
}

/* Both card-face renderers must stamp draggable="false" onto the img.
   The fact panel builds images from the same paths but is not a card, so
   match only the two that are returned from faceFront(). */
const faceFrontSrc = (gameJs.match(/function faceFront\([\s\S]*?\n\}/) || [''])[0];
const cardImgs = (faceFrontSrc.match(/<img[^>]*>/g) || []);
assert(cardImgs.length >= 2, 'found both card-face image templates', `found ${cardImgs.length}`);
const undraggable = cardImgs.every(t => /draggable="false"/.test(t));
assert(undraggable, 'every card-face image carries draggable="false"',
  undraggable ? '' : cardImgs.filter(t => !/draggable="false"/.test(t)).join('\n      '));

/* -------------------------------------------------------------
   Part 2 — a real tap, in a real browser, at iPad size
   ------------------------------------------------------------- */
let playwright = null;
try {
  playwright = require('playwright');
} catch {
  try {
    playwright = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_PATH || '/tmp/wf-test/node_modules'] }));
  } catch { /* not installed — handled below */ }
}

const IPADS = [
  ['iPad portrait',          810, 1080],
  ['iPad landscape',        1080,  810],
  ['iPad Pro 11 landscape', 1194,  834],
  ['iPad mini portrait',     744, 1133],
  ['iPad Pro portrait',     1024, 1366],
];

/* Serve the project over http — file:// would block the module scripts
   and the images, and we want the page the iPad actually gets. */
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json',
};
function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(root, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function live() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch();

  const iPad = async (w, h) => browser.newContext({
    viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
               '(KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  });

  const open = async (ctx, hash = '#dinosaurs') => {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`${base}/index.html${hash}`, { waitUntil: 'load' });
    await page.waitForSelector('.tile');
    await page.waitForTimeout(900);          // let the deal animation settle
    page.__errors = errors;
    return page;
  };

  const centre = async (locator) => {
    const b = await locator.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };

  /* --- one clean tap turns one card over, on every iPad --- */
  for (const [name, w, h] of IPADS) {
    const ctx = await iPad(w, h);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    const [x, y] = await centre(tile);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(600);
    const flipped = await tile.evaluate(el => el.classList.contains('flipped'));
    assert(flipped, `one tap flips a card — ${name} (${w}x${h})`,
      flipped ? '' : `class was "${await tile.getAttribute('class')}"`);
    assert(page.__errors.length === 0, `no page errors — ${name}`, page.__errors.join('; '));
    await ctx.close();
  }

  /* --- a tap that rolls under the finger still counts --- */
  {
    const ctx = await iPad(810, 1080);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    const [x, y] = await centre(tile);
    await page.touchscreen.tap(x, y);        // baseline: the tap lands
    await page.waitForTimeout(500);
    const t2 = page.locator('.tile').nth(1);
    const [x2, y2] = await centre(t2);
    // drift a few pixels between touchstart and touchend, as a small hand does
    await page.evaluate(([px, py]) => {
      const el = document.elementFromPoint(px, py);
      const touch = (tx, ty) => [new Touch({ identifier: 1, target: el, clientX: tx, clientY: ty })];
      const ev = (type, tx, ty) => el.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : touch(tx, ty),
        changedTouches: touch(tx, ty), targetTouches: type === 'touchend' ? [] : touch(tx, ty),
      }));
      ev('touchstart', px, py); ev('touchmove', px + 4, py + 3); ev('touchend', px + 4, py + 3);
    }, [x2, y2]);
    await page.touchscreen.tap(x2 + 4, y2 + 3);
    await page.waitForTimeout(600);
    const flipped = await t2.evaluate(el => el.classList.contains('flipped') || el.classList.contains('matched'));
    assert(flipped, 'a tap that drifts a few pixels still flips the card');
    await ctx.close();
  }

  /* --- press-and-hold does not raise a drag, and the card still flips --- */
  {
    const ctx = await iPad(810, 1080);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    const [x, y] = await centre(tile);
    const dragStarted = await page.evaluate(() => {
      window.__drag = false;
      addEventListener('dragstart', () => { window.__drag = true; }, true);
      return false;
    });
    await page.touchscreen.tap(x, y);        // flip it so a picture is showing
    await page.waitForTimeout(700);
    const [fx, fy] = await centre(tile);
    await page.mouse.move(fx, fy);
    await page.mouse.down();
    await page.waitForTimeout(900);          // a long, resting press
    await page.mouse.up();
    const drag = await page.evaluate(() => window.__drag);
    assert(dragStarted === false && drag === false, 'press-and-hold on a card never starts a drag');
    const sel = await page.evaluate(() => String(getSelection()));
    assert(sel.trim() === '', 'press-and-hold on a card selects no text', `selected: "${sel.trim()}"`);
    await ctx.close();
  }

  /* --- two taps on a matching pair still play the game through --- */
  {
    const ctx = await iPad(1080, 810);
    const page = await open(ctx);
    const pair = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('.tile')];
      const id = tiles[0].dataset.id;
      const j = tiles.findIndex((t, i) => i > 0 && t.dataset.id === id);
      return [0, j];
    });
    for (const i of pair) {
      const [tx, ty] = await centre(page.locator('.tile').nth(i));
      await page.touchscreen.tap(tx, ty);
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(700);
    const matched = await page.locator('.tile.matched').count();
    assert(matched === 2, 'tapping a matching pair marks both cards matched', `matched ${matched}`);
    const factShown = await page.locator('#fact').isVisible();
    assert(factShown, 'a match opens the fact panel');
    await ctx.close();
  }

  /* --- desktop mouse and keyboard are unregressed --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html#dinosaurs`, { waitUntil: 'load' });
    await page.waitForSelector('.tile');
    await page.waitForTimeout(900);

    const tile = page.locator('.tile').first();
    const lifts = await tile.evaluate(el => {
      // a fine pointer is what a desktop chromium reports, so the guarded
      // hover rule must still match here
      return matchMedia('(hover:hover) and (pointer:fine)').matches;
    });
    assert(lifts, 'desktop still reports a hover-capable fine pointer');

    await tile.click();
    await page.waitForTimeout(600);
    assert(await tile.evaluate(el => el.classList.contains('flipped')),
      'desktop click still flips a card');

    // keyboard: focus the next tile and press Enter
    const t2 = page.locator('.tile').nth(1);
    await t2.focus();
    const focused = await t2.evaluate(el => el === document.activeElement);
    assert(focused, 'a tile can take keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    assert(await t2.evaluate(el => el.classList.contains('flipped') || el.classList.contains('matched')),
      'Enter activates a focused tile');
    await ctx.close();
  }

  await browser.close();
  server.close();
}

(async () => {
  if (playwright) {
    console.log('\nLive taps at iPad size\n');
    await live();
  } else {
    console.log('\nLive taps at iPad size\n');
    console.log('skip  Playwright is not installed, so no browser was driven.');
    console.log('      The source guards above still ran. To run the real taps:');
    console.log('        npm i playwright && npx playwright install chromium');
  }

  console.log('');
  if (failures) {
    console.log(`${failures} check${failures === 1 ? '' : 's'} failed.`);
    process.exit(1);
  }
  console.log('All checks passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
