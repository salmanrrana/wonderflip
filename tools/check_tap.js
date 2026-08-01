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

   Part one reads the source and proves each guard is still there. It
   needs nothing but node, so it always runs.

   Part two actually taps: a real browser at five iPad viewports, real
   touch events through CDP, asserting the card turns over.

   What part two cannot do, and why part one is not redundant: the browser
   here is Chromium, and the bug was Safari's. Chromium does not synthesise
   hover on tap and has no image callout, so removing the fixes would leave
   these taps green. The live half proves the game still plays under a
   finger — that nothing here broke the flip, the match, the keyboard or
   the mouse. The source and computed-style assertions are what actually
   pin the three iOS guards in place. Both halves are load-bearing.

   Part two needs Playwright, which this project does not depend on. A
   missing Playwright FAILS rather than skips, because a test that prints
   "All checks passed" while testing nothing is worse than no test:

     npm i playwright && npx playwright install chromium

   To run it against a copy installed elsewhere, or to accept a partial run:

     PLAYWRIGHT_PATH=/path/to/node_modules node tools/check_tap.js
     CHECK_TAP_ALLOW_SKIP=1 node tools/check_tap.js
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

/* A media query only counts as a gate if it *narrows* to a hovering
   pointer. Merely containing the text `hover:hover` is not enough, and
   reading it that loosely is how a guard rots without anyone noticing:

     @media not (hover:hover)              — the exact opposite
     @media (hover:hover), (pointer:coarse) — the comma lets touch back in
     @media (hover:hover)                   — no pointer:fine, so a stylus
                                              or a TV remote still hovers

   So require both features, reject negation, and reject a comma — a
   media query list is an OR, and one hover-capable branch cannot vouch
   for the others. */
function isHoverGate(head) {
  const q = head.replace(/^@media\s*/i, '').trim();
  if (!/^@media\b/i.test(head)) return false;
  if (/\bnot\b/i.test(q)) return false;
  if (q.includes(',')) return false;
  return /\(\s*hover\s*:\s*hover\s*\)/.test(q) && /\(\s*pointer\s*:\s*fine\s*\)/.test(q);
}

/* Every `:hover` rule must sit inside such a gate. Walk the file tracking
   brace depth, remembering the depth at which each gate opened. */
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
      if (isHoverGate(head)) hoverBlockDepths.push(depth);
      depth++;
      continue;
    }
    if (/:hover/.test(head) && hoverBlockDepths.length === 0) out.push(head.replace(/\s+/g, ' '));
    depth++;
  }
  return out;
}

/* The parser is the only part of this file that always runs, so it is
   worth proving it rejects what it claims to reject. */
const PARSER_CASES = [
  ['@media (hover:hover) and (pointer:fine){ .a:hover{color:red} }', 0, 'a real gate passes'],
  ['@media not (hover:hover){ .a:hover{color:red} }', 1, 'negated gate is rejected'],
  ['@media (hover:hover), (pointer:coarse){ .a:hover{color:red} }', 1, 'comma-list gate is rejected'],
  ['@media (hover:hover){ .a:hover{color:red} }', 1, 'gate without pointer:fine is rejected'],
  ['.a:hover{color:red}', 1, 'a bare hover rule is caught'],
  ['@media (min-width:10px){ @media (hover:hover) and (pointer:fine){ .a:hover{c:1} } }', 0, 'a nested gate passes'],
  ['@media (hover:hover) and (pointer:fine){ .a{c:1} } .b:hover{c:1}', 1, 'a rule after a closed gate is caught'],
];
for (const [src, expected, label] of PARSER_CASES) {
  const got = ungatedHoverSelectors(src).length;
  assert(got === expected, `parser self-test: ${label}`, `expected ${expected} ungated, got ${got}`);
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
/* Resolve Playwright from this project or from wherever PLAYWRIGHT_PATH
   points, and nowhere else. An earlier version fell back to a hardcoded
   /tmp directory, which is both non-hermetic and a place any other
   process can write — exactly the wrong thing for a file that decides
   whether the game ships. */
let playwright = null;
let playwrightError = null;
try {
  playwright = require('playwright');
} catch (err) {
  if (process.env.PLAYWRIGHT_PATH) {
    try {
      playwright = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_PATH] }));
    } catch (err2) { playwrightError = err2; }
  } else {
    playwrightError = err;
  }
}

/* Skipping the browser half is allowed for a quick local run, but it must
   never look like success. Unless CHECK_TAP_ALLOW_SKIP is set, a missing
   Playwright is a failure — otherwise this file would print "All checks
   passed" while every behavioural assertion sat untested, which is worse
   than having no test at all. */
const allowSkip = process.env.CHECK_TAP_ALLOW_SKIP === '1';

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

  /* --- a tap that rolls under the finger still counts ---
     Driven through CDP so the touch is a real one the gesture recognizer
     sees, not a synthetic TouchEvent the page merely receives. An earlier
     version dispatched untrusted events and then tapped cleanly at the end
     coordinates, so the clean tap did all the work and a cancelled drift
     would still have passed. */
  {
    const ctx = await iPad(810, 1080);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    const [x, y] = await centre(tile);
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await touch('touchStart', [{ x, y }]);
    await touch('touchMove',  [{ x: x + 3, y: y + 2 }]);
    await touch('touchMove',  [{ x: x + 5, y: y + 4 }]);
    await touch('touchEnd',   []);
    await page.waitForTimeout(700);
    const flipped = await tile.evaluate(el => el.classList.contains('flipped'));
    assert(flipped, 'a real touch that drifts a few pixels still flips the card',
      flipped ? '' : `class was "${await tile.getAttribute('class')}"`);
    await ctx.close();
  }

  /* --- a long press does not raise a drag or a selection, and still flips ---
     Also a real touch: press, hold well past the long-press threshold, lift
     without moving. The earlier version held the *mouse* on a card it had
     already flipped with a separate tap, which tested neither the flip nor
     the long-press behaviour. */
  {
    const ctx = await iPad(810, 1080);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    await page.evaluate(() => {
      window.__drag = false;
      window.__ctx = false;
      addEventListener('dragstart', () => { window.__drag = true; }, true);
      addEventListener('contextmenu', () => { window.__ctx = true; }, true);
    });
    const [x, y] = await centre(tile);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await page.waitForTimeout(1100);         // a long, resting press
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(700);

    const state = await page.evaluate(() => ({
      drag: window.__drag, ctx: window.__ctx, sel: String(getSelection()),
    }));
    assert(state.drag === false, 'a long press on a card never starts a drag');
    assert(state.ctx === false, 'a long press on a card never raises the callout menu');
    assert(state.sel.trim() === '', 'a long press on a card selects no text', `selected: "${state.sel.trim()}"`);
    assert(await tile.evaluate(el => el.classList.contains('flipped')),
      'a card still flips after a long, resting press');
    await ctx.close();
  }

  /* --- the CSS really does refuse the drag, as the computed style sees it ---
     Chromium cannot reproduce Safari's hover synthesis or its image callout,
     so the properties that defend against them are asserted here against the
     live computed style rather than only against the source text. */
  {
    const ctx = await iPad(810, 1080);
    const page = await open(ctx);
    const tile = page.locator('.tile').first();
    await page.touchscreen.tap(...await centre(tile));
    await page.waitForTimeout(700);
    const styles = await tile.evaluate(el => {
      const img = el.querySelector('.face-front img');
      const get = (e, p) => getComputedStyle(e).getPropertyValue(p).trim();
      return {
        touchAction: get(el, 'touch-action'),
        callout: get(el, '-webkit-touch-callout'),
        // -webkit-touch-callout is WebKit-only; Chromium drops the property
        // entirely, so there is nothing to read here and the source
        // assertion above is the only place it can be checked
        calloutSupported: CSS.supports('-webkit-touch-callout', 'none'),
        userSelect: get(el, 'user-select') || get(el, '-webkit-user-select'),
        imgDrag: img ? get(img, '-webkit-user-drag') : 'none',
        imgDraggable: img ? img.draggable : false,
        hoverGated: !matchMedia('(hover:hover) and (pointer:fine)').matches,
      };
    });
    assert(styles.touchAction === 'manipulation', 'computed touch-action is manipulation', styles.touchAction);
    if (styles.calloutSupported) {
      assert(styles.callout === 'none', 'computed -webkit-touch-callout is none', styles.callout);
    } else {
      console.log('note  this engine has no -webkit-touch-callout; only the source guard covers it');
    }
    assert(styles.userSelect === 'none', 'computed user-select is none', styles.userSelect);
    assert(styles.imgDrag === 'none', 'computed -webkit-user-drag on the card image is none', styles.imgDrag);
    assert(styles.imgDraggable === false, 'the card image is not draggable');
    assert(styles.hoverGated, 'a touch device does not match the hover gate');
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

    // the panel must actually carry the discovery, not merely be visible
    const panel = await page.evaluate(() => ({
      shown: !document.getElementById('fact').hidden,
      name: document.getElementById('factName').textContent.trim(),
      text: document.getElementById('factText').textContent.trim(),
      idleHidden: document.getElementById('panelIdle').hidden,
    }));
    assert(panel.shown && panel.idleHidden, 'a match opens the fact panel and closes the idle panel');
    assert(panel.name.length > 0, 'the fact panel shows the name of what was found', `name was "${panel.name}"`);
    assert(panel.text.length > 0, 'the fact panel shows its fact', `text was "${panel.text}"`);
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
    assert(await page.evaluate(() => matchMedia('(hover:hover) and (pointer:fine)').matches),
      'desktop still reports a hover-capable fine pointer');

    /* the lift is what the hover gate is protecting, so measure the card
       actually moving rather than trusting the media query alone */
    const restY = await tile.evaluate(el => el.querySelector('.tile-inner').getBoundingClientRect().top);
    await tile.hover();
    await page.waitForTimeout(400);
    const hoverY = await tile.evaluate(el => el.querySelector('.tile-inner').getBoundingClientRect().top);
    assert(hoverY < restY - 1, 'a mouse hover still lifts the card on desktop',
      `top went ${restY.toFixed(1)} → ${hoverY.toFixed(1)}`);

    await tile.click();
    await page.waitForTimeout(600);
    assert(await tile.evaluate(el => el.classList.contains('flipped')),
      'desktop click still flips a card');

    /* keyboard: Enter on one tile, Space on another, and a real focus ring.
       :focus-visible answers to how focus arrived, so the ring has to be
       reached by tabbing — a scripted focus() does not count as keyboard
       interaction and would report no ring on a page that has one. */
    const t2 = page.locator('.tile').nth(1);
    const tabbedToTile = await (async () => {
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(() => document.activeElement?.classList.contains('tile'))) return true;
      }
      return false;
    })();
    assert(tabbedToTile, 'a tile is reachable by tabbing');
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { matches: el.matches(':focus-visible'), width: cs.outlineWidth, style: cs.outlineStyle };
    });
    assert(ring.matches && ring.style !== 'none' && parseFloat(ring.width) > 0,
      'a keyboard-focused tile renders a visible focus outline',
      `:focus-visible=${ring.matches} outline=${ring.width} ${ring.style}`);

    await t2.focus();
    assert(await t2.evaluate(el => el === document.activeElement), 'a tile can take keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    assert(await t2.evaluate(el => el.classList.contains('flipped') || el.classList.contains('matched')),
      'Enter activates a focused tile');

    /* Space needs a card the game is not already busy with: a wrong pair is
       flipping back for over a second, and during that the board ignores
       input by design. Reload for a clean board rather than racing it. */
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.tile');
    await page.waitForTimeout(900);
    const t3 = page.locator('.tile').first();
    await t3.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);
    assert(await t3.evaluate(el => el.classList.contains('flipped') || el.classList.contains('matched')),
      'Space activates a focused tile');
    await ctx.close();
  }

  await browser.close();
  server.close();
}

(async () => {
  console.log('\nLive taps at iPad size\n');
  if (playwright) {
    await live();
  } else if (allowSkip) {
    console.log('skip  Playwright is not installed, so no browser was driven.');
    console.log('      Only the source guards above ran — this run proves nothing');
    console.log('      about how the game behaves under a real finger.');
  } else {
    bad('the browser half of this check actually ran',
      `Playwright could not be loaded, so none of the tap behaviour was tested.\n` +
      `      ${playwrightError ? String(playwrightError.message).split('\n')[0] : 'not installed'}\n` +
      `      Install it:            npm i playwright && npx playwright install chromium\n` +
      `      Or point at a copy:    PLAYWRIGHT_PATH=/path/to/node_modules node tools/check_tap.js\n` +
      `      Or accept a partial run explicitly: CHECK_TAP_ALLOW_SKIP=1 node tools/check_tap.js`);
  }

  console.log('');
  if (failures) {
    console.log(`${failures} check${failures === 1 ? '' : 's'} failed.`);
    process.exit(1);
  }
  console.log(allowSkip && !playwright
    ? 'Source guards passed. The browser checks were skipped.'
    : 'All checks passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
