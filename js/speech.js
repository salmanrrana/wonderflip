/* =============================================================
   Voice — the read-aloud engine.

   Two things make the default Web Speech output sound wrong to a
   small child, and both are fixed here:

   1. THE VOICE.  If you never set `utterance.voice`, you get the
      platform default, which on Linux/Chrome is usually eSpeak —
      the buzzy robot. Every platform ships something far better;
      it just has to be asked for by name. PREFERRED is an ordered
      list of the good ones across Windows, macOS/iOS, Android,
      ChromeOS and Linux. First match wins.

   2. THE PROSODY.  The old settings (rate .82, pitch 1.15) are the
      classic "kids' app" mistake: slowing a synthetic voice down
      stretches its artefacts and pitching it up makes it thin and
      squeaky — uncanny, not friendly. Child-directed speech in the
      research is slower than adult speech but *higher in pitch
      variation*, not higher in flat pitch, and TTS engines cannot
      fake variation via `pitch`. So: a mild slowdown and a
      completely neutral pitch, letting the good voice do the work.

   Also handled: Chrome loads voices asynchronously (empty on first
   call), Chrome cuts long utterances at ~15s, Chrome can drop a
   speak() issued immediately after cancel(), and Safari/iOS refuse
   to speak at all until the first user gesture.
   ============================================================= */

const Voice = (() => {
  const supported = typeof speechSynthesis !== 'undefined';

  /* Voice *names* are display labels, not identifiers — the spec never
     promised they'd be stable, and in practice they drift with OS
     language, downloaded voice packs and browser version ("Ava" vs
     "AvaMultilingual", "English (Hongkong)" vs "English (Hong Kong
     SAR)"). So match on shape rather than on exact strings: the quality
     markers below are far more durable than any list of names.
     Ordered best-first; first match wins. */
  const PREFERRED = [
    /\bonline \(natural\)/i,          // Edge/Windows neural — the best there is
    /\(premium\)/i,                   // Apple's top download tier
    /\(enhanced\)/i,                  // Apple's middle tier, still good
    /^google (us|uk) english/i,       // Chrome desktop + Android
    /^microsoft (aria|jenny|ava|emma|sonia)\b/i,   // local Windows neural
    /\b(samantha|ava|allison|susan|karen|serena|moira)\b/i,  // Apple defaults
    /^microsoft (zira|david|mark)\b/i,             // older Windows, last resort
  ];

  /* Legacy formant/diphone engines. These are what make a kids' app sound
     like a haunted robot, so they never win — even as a fallback. */
  const LEGACY = /espeak|speech[- ]?dispatch|\bspeechd\b|festival|flite|mbrola|\bpico\b/i;

  /* Slower than adult conversation, but not dragged out.
     Pitch stays neutral — see the note above. */
  const RATE  = 0.90;
  const PITCH = 1.0;

  let voice = null;
  let picked = false;
  let unlocked = false;
  let queue = [];        // things said before voices finished loading
  let demoted = false;   // gave up on the network voice, see onerror below

  /* Always check the language too. "Ava" and "Emma" exist in several
     languages, and a French Ava reading an English fact is worse than
     no voice at all. */
  const isEnglish = v => /^en(-|_|$)/i.test(v.lang || '');

  function best(voices) {
    const usable = voices.filter(v => isEnglish(v) && !LEGACY.test(v.name));
    for (const re of PREFERRED) {
      const hit = usable.find(v => re.test(v.name));
      if (hit) return hit;
    }
    return usable[0] || null;
  }

  /* Best voice that needs no network. The rest of the game works
     offline, so a child on a plane should still get a voice. */
  function bestLocal(voices) {
    return best(voices.filter(v => v.localService));
  }

  function pick() {
    if (!supported) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;          // Chrome: not ready yet

    // May legitimately stay null: if the only thing installed is eSpeak,
    // we say nothing. A silent card a grown-up can read beats a robot
    // voice that unsettles the child — which is the whole point here.
    voice = best(voices);

    picked = true;
    const pending = queue; queue = [];
    pending.forEach(say);
  }

  if (supported) {
    pick();
    // Chrome fires this once the list is actually populated
    speechSynthesis.addEventListener('voiceschanged', pick);
    // ...and occasionally never fires it, so poll briefly as a backstop
    let tries = 0;
    const t = setInterval(() => {
      if (picked || ++tries > 20) return clearInterval(t);
      pick();
    }, 250);
  }

  /* Chrome silently stops around 15 seconds. Splitting on sentence
     boundaries keeps each utterance short and, as a bonus, gives a
     natural breath between sentences — easier for a 3-year-old. */
  function chunk(text) {
    const parts = [];
    let buf = '';
    for (const piece of String(text).split(/(?<=[.!?])\s+/)) {
      if ((buf + ' ' + piece).trim().length > 140) {
        if (buf) parts.push(buf.trim());
        buf = piece;
      } else {
        buf = (buf + ' ' + piece).trim();
      }
    }
    if (buf) parts.push(buf.trim());
    return parts.length ? parts : [String(text)];
  }

  function utter(text, delay) {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = RATE;
    u.pitch = PITCH;
    u.volume = 1;

    /* The Windows "Online (Natural)" voices are synthesized in the
       cloud. They are the best-sounding option by a wide margin, so we
       still ask for them first — but the rest of this game works with
       no network, and a child offline would otherwise get silence. On
       the first failure, drop to the best local voice permanently and
       say the line again. */
    u.onerror = e => {
      if (demoted || e.error === 'canceled' || e.error === 'interrupted') return;
      const local = bestLocal(speechSynthesis.getVoices());
      if (!local || local === voice) return;
      demoted = true;
      voice = local;
      say(text);
    };

    // Chrome can drop a speak() that lands too soon after cancel()
    setTimeout(() => speechSynthesis.speak(u), delay);
  }

  function say(text) {
    if (!supported || !text) return;
    if (!picked) {                       // voices still loading
      queue = [text];                    // only the newest matters
      return;
    }
    if (!voice) return;                  // nothing acceptable installed
    speechSynthesis.cancel();
    chunk(text).forEach((part, i) => utter(part, 60 + i * 20));
  }

  function stop() {
    queue = [];
    if (supported) speechSynthesis.cancel();
  }

  /* Safari and iOS will not speak until speech has been started once
     from inside a real user gesture. Burn a silent utterance on the
     first tap so the first real sentence is not swallowed. */
  function unlock() {
    if (!supported || unlocked) return;
    unlocked = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    try { speechSynthesis.speak(u); } catch (_) { /* not fatal */ }
    if (!picked) pick();
  }

  return { say, stop, unlock, get voice() { return voice; } };
})();
