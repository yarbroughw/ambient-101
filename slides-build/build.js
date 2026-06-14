const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.author = "Willem Yarbrough";
pres.title = "Ambient 101";

// ---- design system ------------------------------------------------------
const BG = "1A1A1A";
const FG = "ECECEC";
const MUTE = "8A8A8A";
const GREEN = "8FCB9B";
const RED = "E5413A";
const GOLD = "EEC643";
const BLUE = "7FA8D4";
const BLUE_DK = "3E6FA0";
const LINK = "6FB7C9";
const MONO = "Consolas"; // closest universal monospace to the deck's coding font

const W = 10, H = 5.625;

function slide(opts = {}) {
  const s = pres.addSlide();
  s.background = { color: opts.bg || BG };
  if (opts.notes) s.addNotes(opts.notes);
  return s;
}

// centered single line / stacked lines
function centerTitle(s, text, o = {}) {
  s.addText(text, {
    x: 0.5, y: o.y ?? 2.1, w: 9, h: o.h ?? 1.4,
    fontFace: MONO, fontSize: o.fontSize ?? 40, color: o.color ?? FG,
    bold: o.bold ?? false, align: "center", valign: "middle", margin: 0,
  });
}

function kicker(s, text, color = MUTE) {
  s.addText(text, {
    x: 0.5, y: 0.45, w: 9, h: 0.4, fontFace: MONO, fontSize: 13,
    color, align: "left", margin: 0, charSpacing: 2,
  });
}

// horror-movie style section break (their MATH / MUSIC THEORY look)
function horror(text, notes) {
  const s = slide({ notes });
  s.addText(text, {
    x: 0.5, y: 1.6, w: 9, h: 2.4, fontFace: "Impact", fontSize: 96,
    color: RED, align: "center", valign: "middle", charSpacing: 4, margin: 0,
    shadow: { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.5 },
  });
  return s;
}

// act divider
function actDivider(num, title, sub, notes) {
  const s = slide({ notes });
  s.addText(`ACT ${num}`, {
    x: 0.5, y: 1.5, w: 9, h: 0.6, fontFace: MONO, fontSize: 18, color: MUTE,
    align: "center", charSpacing: 6, margin: 0,
  });
  s.addText(title, {
    x: 0.5, y: 2.1, w: 9, h: 1.2, fontFace: MONO, fontSize: 54, color: FG, bold: true,
    align: "center", margin: 0,
  });
  s.addText(sub, {
    x: 0.5, y: 3.4, w: 9, h: 0.6, fontFace: MONO, fontSize: 16, color: GREEN,
    align: "center", margin: 0,
  });
  return s;
}

// media-placeholder card
function mediaCard(s, label, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: "242424" },
    line: { color: "454545", width: 1, dashType: "dash" },
  });
  s.addText(label, {
    x: x + 0.1, y, w: w - 0.2, h, fontFace: MONO, fontSize: 14, color: MUTE,
    align: "center", valign: "middle", margin: 0,
  });
}

// quote block (Eno)
function quoteSlide(text, notes) {
  const s = slide({ notes });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 0.8, w: 5.7, h: 4.0, fill: { color: "E6E6E6" } });
  s.addText(text, {
    x: 0.95, y: 1.0, w: 5.2, h: 3.6, fontFace: MONO, fontSize: 13.5, color: "1A1A1A",
    align: "left", valign: "middle", margin: 0, lineSpacingMultiple: 1.15,
  });
  mediaCard(s, "[ Eno at the tape machine —\nreuse photo from old deck ]", 6.7, 1.5, 2.7, 2.6);
  return s;
}

// ===========================================================================
// ACT 1 — LISTEN
// ===========================================================================

// 1. Title
{
  const s = slide({ notes: "Welcome. Intro yourself (2 min). One line on last year: we did this in code; this year we skip straight to making sound. Whole class builds to a laptop orchestra finale." });
  s.addText([
    { text: "AMBIENT", options: { bold: true } },
    { text: " 101", options: { color: MUTE } },
  ], { x: 0.6, y: 1.7, w: 8.8, h: 1.1, fontFace: MONO, fontSize: 60, color: FG, align: "center", margin: 0 });
  s.addText("MUSIC FOR USB PORTS", {
    x: 0.5, y: 2.85, w: 9, h: 0.5, fontFace: MONO, fontSize: 20, color: GREEN, align: "center", charSpacing: 3, margin: 0,
  });
  s.addText("making music — without the code", {
    x: 0.5, y: 3.45, w: 9, h: 0.5, fontFace: MONO, fontSize: 15, color: MUTE, align: "center", margin: 0,
  });
  s.addText("ITP Camp 2026", {
    x: 0.5, y: 4.7, w: 9, h: 0.4, fontFace: MONO, fontSize: 12, color: MUTE, align: "center", margin: 0,
  });
}

// 2. Act 1 divider
actDivider("1", "LISTEN", "get your ears open · see where we're going",
  "~15 min. Goal: buy-in and a destination. Don't teach mechanics yet.");

// 3. Music for Airports
{
  const s = slide({ notes: "3 min. What ambient IS — Eno, music as a place, not a song. Plays in airports, you don't have to listen to it, but it rewards listening." });
  kicker(s, "1978 · BRIAN ENO");
  centerTitle(s, "Ambient 1: Music for Airports", { y: 1.0, fontSize: 30, bold: true });
  mediaCard(s, "[ Music for Airports album cover ]", 3.0, 1.9, 4.0, 3.0);
  s.addText("music as a place you're in — not a song you follow", {
    x: 0.5, y: 5.0, w: 9, h: 0.4, fontFace: MONO, fontSize: 14, color: GREEN, align: "center", margin: 0,
  });
}

// 4. Incommensurable quote
quoteSlide(
  '"...One of the notes repeats every 23 1/2 seconds. ' +
  'The next lowest loop repeats every 25 7/8 seconds. ' +
  'The third one every 29 15/16 seconds. What I mean is they all ' +
  'repeat in cycles that are called incommensurable — they are ' +
  'not likely to come back into sync again."',
  "3 min. THIS is the thesis of the whole class. Read it aloud. Underline 'incommensurable' and 'not likely to come back into sync.' Everything in Act 2 explains why that produces music."
);

// 5. DEMO — airports preset
{
  const s = slide({ notes: "5 min. FIRST DEMO, from the projector only. Load the 'airports' ensemble, let the loops drift. Don't explain mechanics — just let them hear it. PLANT THE FLAG: by the end, every laptop here is one of these loops and we'll play the piece together. Do NOT share the URL yet." });
  s.addText("▶", { x: 0.5, y: 0.6, w: 9, h: 1.4, fontFace: MONO, fontSize: 80, color: GREEN, align: "center", margin: 0 });
  centerTitle(s, "DEMO — from the front", { y: 2.0, fontSize: 32, bold: true });
  s.addText("load the airports preset · let the loops drift · just listen", {
    x: 0.5, y: 2.95, w: 9, h: 0.4, fontFace: MONO, fontSize: 15, color: FG, align: "center", margin: 0,
  });
  s.addText('"By the end, every laptop in this room is one of these loops — and we play the piece together."', {
    x: 1.0, y: 3.7, w: 8, h: 0.8, fontFace: MONO, fontSize: 14, color: GOLD, align: "center", italic: true, margin: 0,
  });
}

// 6. "his playing" quote
quoteSlide(
  '"...the result is very, very nice. The interesting thing is ' +
  "that it doesn't sound at all mechanical or mathematical as you " +
  'would imagine. It sounds like some guy is sitting there playing ' +
  'the piano with quite intense feeling..."',
  "2 min. The payoff to set up Act 2: simple mechanical parts produce something that sounds human and intentional. Next we explain HOW."
);

// ===========================================================================
// ACT 2a — RHYTHM / PHASING
// ===========================================================================

horror("MATH", "30 sec. Levity. Yes, there's math — but it's the fun kind, and the app does it for you.");

// 8. Coprime — factor trees
{
  const s = slide({ notes: "4 min. Skip the Fundamental Theorem title — just the intuition. 9 = 3x3, 10 = 2x5. They share NO prime factors -> coprime. Coprime is the whole secret." });
  centerTitle(s, "Coprime", { y: 0.5, fontSize: 36, bold: true });
  s.addText("two numbers are coprime when they share no factors", {
    x: 0.5, y: 1.35, w: 9, h: 0.4, fontFace: MONO, fontSize: 15, color: MUTE, align: "center", margin: 0,
  });
  // factor tree helper
  function node(x, y, n, color) {
    s.addShape(pres.shapes.OVAL, { x: x - 0.35, y: y - 0.35, w: 0.7, h: 0.7, fill: { color: color || "2C2C2C" }, line: { color: FG, width: 1 } });
    s.addText(String(n), { x: x - 0.35, y: y - 0.35, w: 0.7, h: 0.7, fontFace: MONO, fontSize: 18, color: FG, align: "center", valign: "middle", margin: 0, bold: true });
  }
  function branch(x1, y1, x2, y2) {
    s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), line: { color: MUTE, width: 1.5 }, flipH: x2 < x1 });
  }
  // tree for 9
  branch(2.7, 2.6, 2.1, 3.5); branch(2.7, 2.6, 3.3, 3.5);
  node(2.7, 2.5, 9); node(2.1, 3.6, 3, GREEN); node(3.3, 3.6, 3, GREEN);
  s.addText("9 = 3 × 3", { x: 1.5, y: 4.2, w: 2.4, h: 0.4, fontFace: MONO, fontSize: 16, color: FG, align: "center", margin: 0 });
  // tree for 10
  branch(7.0, 2.6, 6.4, 3.5); branch(7.0, 2.6, 7.6, 3.5);
  node(7.0, 2.5, 10); node(6.4, 3.6, 2, BLUE); node(7.6, 3.6, 5, BLUE);
  s.addText("10 = 2 × 5", { x: 5.8, y: 4.2, w: 2.4, h: 0.4, fontFace: MONO, fontSize: 16, color: FG, align: "center", margin: 0 });
  s.addText("nothing in common  →  coprime", {
    x: 0.5, y: 4.85, w: 9, h: 0.4, fontFace: MONO, fontSize: 16, color: GOLD, align: "center", margin: 0,
  });
}

// 9. Coprime cycles — notched ruler
{
  const s = slide({ notes: "4 min. Two tapes of coprime length only realign after length(A) x length(B) beats. Short loops, enormous combined cycle. This is Eno's 'not likely to come back into sync.'" });
  centerTitle(s, "Coprime cycles", { y: 0.45, fontSize: 32, bold: true });
  s.addText("loops of coprime length take forever to line back up", {
    x: 0.5, y: 1.25, w: 9, h: 0.4, fontFace: MONO, fontSize: 14, color: MUTE, align: "center", margin: 0,
  });
  function ruler(y, notches, label, color) {
    const x = 1.5, w = 7.0, h = 0.55;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color } });
    for (let i = 1; i < notches; i++) {
      const nx = x + (w * i) / notches;
      s.addShape(pres.shapes.LINE, { x: nx, y, w: 0, h, line: { color: "1A1A1A", width: 1.5 } });
    }
    s.addText(label, { x: 0.2, y, w: 1.2, h, fontFace: MONO, fontSize: 14, color: FG, align: "right", valign: "middle", margin: 0 });
  }
  ruler(2.1, 9, "9", GOLD);
  ruler(2.95, 10, "10", GOLD);
  s.addText("9 × 10 = 90 beats before they meet again", {
    x: 0.5, y: 4.0, w: 9, h: 0.5, fontFace: MONO, fontSize: 18, color: GREEN, align: "center", margin: 0,
  });
  s.addText("(coprime 23.5s & 25.875s loops? minutes.)", {
    x: 0.5, y: 4.6, w: 9, h: 0.4, fontFace: MONO, fontSize: 13, color: MUTE, align: "center", margin: 0,
  });
}

// 10. PSEUDORANDOMNESS
{
  const s = slide({ notes: "3 min. The combined output never quite repeats within earshot, so it sounds composed / alive even though every part is dead simple and looping. That illusion is the whole genre." });
  s.addText("cycles with coprime ratios create", {
    x: 0.5, y: 1.6, w: 9, h: 0.5, fontFace: MONO, fontSize: 18, color: MUTE, align: "center", margin: 0,
  });
  s.addText("PSEUDO-\nRANDOMNESS", {
    x: 0.5, y: 2.2, w: 9, h: 1.8, fontFace: "Impact", fontSize: 66, color: GREEN, align: "center", valign: "middle", charSpacing: 2, margin: 0,
  });
}

// 11. Enigma / Pepe Silvia (CUTTABLE)
{
  const s = slide({ notes: "2 min — TIMEBOX, and this is the slide you CUT if running long. Quick fun rant on Enigma/codebreaking. Land the payoff: this is literally why we built computers (Turing, Bletchley), and the whole point was pseudorandomness — same as ours." });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 1.6, h: H, fill: { color: GOLD } });
  s.addText("CUTTABLE", { x: -1.9, y: 2.6, w: 5, h: 0.4, fontFace: MONO, fontSize: 12, color: "1A1A1A", align: "center", rotate: 270, charSpacing: 3, margin: 0, bold: true });
  s.addText("Detour: Enigma", { x: 2.0, y: 0.6, w: 7.5, h: 0.7, fontFace: MONO, fontSize: 30, color: FG, bold: true, margin: 0 });
  mediaCard(s, "[ Charlie 'Pepe Silvia' meme ]", 5.9, 1.6, 3.6, 2.2);
  s.addText([
    { text: "pseudorandomness wasn't a gimmick — it was a weapon", options: { color: GREEN, breakLine: true, bullet: true } },
    { text: "breaking it is literally why we built computers", options: { color: FG, breakLine: true, bullet: true } },
    { text: "(Turing · Bletchley Park)", options: { color: MUTE, breakLine: true, bullet: true } },
    { text: "same trick, different goal: complexity from simple cycles", options: { color: FG, bullet: true } },
  ], { x: 2.0, y: 1.7, w: 3.7, h: 2.8, fontFace: MONO, fontSize: 14, align: "left", paraSpaceAfter: 10, margin: 0 });
}

// 12. Moiré + Piano Phase + timeline demo
{
  const s = slide({ notes: "4 min. Moiré images = what phasing PRODUCES. Play the Piano Phase video. Then DEMO phasing in the app's TIMELINE VIEW (from the front) — tapes of different lengths scrolling past one playhead, drifting in/out of alignment. Better visual than moiré for the 'how'." });
  centerTitle(s, "Phasing", { y: 0.45, fontSize: 32, bold: true });
  s.addText("the audible version of a moiré pattern", {
    x: 0.5, y: 1.25, w: 9, h: 0.4, fontFace: MONO, fontSize: 14, color: MUTE, align: "center", margin: 0,
  });
  mediaCard(s, "[ moiré pattern image ]", 0.7, 1.9, 4.2, 2.6);
  mediaCard(s, "[ Steve Reich —\nPiano Phase video ]", 5.1, 1.9, 4.2, 2.6);
  s.addText("▶ DEMO: open the timeline view — tapes of different lengths passing one playhead", {
    x: 0.5, y: 4.75, w: 9, h: 0.5, fontFace: MONO, fontSize: 13.5, color: GREEN, align: "center", margin: 0,
  });
}

// ===========================================================================
// THE HINGE — TIME = SPACE
// ===========================================================================
{
  const s = slide({ notes: "5 min. THE best idea in the deck — use it as the pivot from rhythm to pitch. Everything you just saw about cycles drifting? Pitch is the same phenomenon, just much faster. A rhythm sped up enough becomes a pitch. Rhythm=Pitch, BPM=Hz." });
  s.addText("TIME = SPACE", {
    x: 0.5, y: 0.7, w: 9, h: 1.0, fontFace: MONO, fontSize: 48, color: FG, bold: true, align: "center", margin: 0,
  });
  const rows = [
    ["Rhythm", "Pitch"],
    ["BPM", "Hz"],
    ['"how often?"', '"how often?"'],
  ];
  let y = 2.2;
  rows.forEach(([l, r], i) => {
    const c = i === 2 ? MUTE : FG;
    s.addText(l, { x: 1.0, y, w: 3.3, h: 0.7, fontFace: MONO, fontSize: 26, color: c, align: "right", valign: "middle", margin: 0 });
    s.addText("=", { x: 4.4, y, w: 1.2, h: 0.7, fontFace: MONO, fontSize: 26, color: GREEN, align: "center", valign: "middle", margin: 0 });
    s.addText(r, { x: 5.7, y, w: 3.3, h: 0.7, fontFace: MONO, fontSize: 26, color: c, align: "left", valign: "middle", margin: 0 });
    y += 0.85;
  });
  s.addText("a rhythm, sped up enough, becomes a pitch", {
    x: 0.5, y: 5.0, w: 9, h: 0.4, fontFace: MONO, fontSize: 14, color: GOLD, align: "center", italic: true, margin: 0,
  });
}

// optional-depth marker
{
  const s = slide({ notes: "OPTIONAL / APPENDIX. Only do this block if time AND energy are high. Nothing here maps to a control they'll turn in the app, so it's the safest cut. Waveforms, octave/fifth overlays, 12-TET, 2^(7/12)=1.498. Keep slides from old deck if you want them." });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: "141414" } });
  s.addText("OPTIONAL DEPTH", { x: 0.5, y: 1.4, w: 9, h: 0.5, fontFace: MONO, fontSize: 16, color: GOLD, align: "center", charSpacing: 4, margin: 0 });
  s.addText("tuning · 12-TET · ratios", { x: 0.5, y: 2.1, w: 9, h: 0.9, fontFace: MONO, fontSize: 34, color: FG, bold: true, align: "center", margin: 0 });
  s.addText("only if time & energy are high — no app control maps here, so it's the safe cut\n(reuse the waveform / octave-fifth / 2^(7/12) slides from the old deck)", {
    x: 0.5, y: 3.3, w: 9, h: 0.9, fontFace: MONO, fontSize: 13, color: MUTE, align: "center", margin: 0,
  });
}

// ===========================================================================
// ACT 2b — PITCH / TONALITY
// ===========================================================================

// keyboard helper
function drawKeyboard(s, ox, oy, scaleSet, root, scaleW) {
  const ww = scaleW / 7;        // white key width
  const wh = ww * 2.6;          // white key height
  const whiteSemis = [0, 2, 4, 5, 7, 9, 11];
  const whiteNames = ["C", "D", "E", "F", "G", "A", "B"];
  // white keys
  whiteSemis.forEach((sem, i) => {
    const inScale = scaleSet.includes(sem);
    const isRoot = sem === root;
    const fill = isRoot ? GOLD : (inScale ? BLUE : "FFFFFF");
    s.addShape(pres.shapes.RECTANGLE, { x: ox + i * ww, y: oy, w: ww, h: wh, fill: { color: fill }, line: { color: "1A1A1A", width: 1 } });
    s.addText(whiteNames[i], { x: ox + i * ww, y: oy + wh - 0.32, w: ww, h: 0.3, fontFace: MONO, fontSize: 11, color: "1A1A1A", align: "center", margin: 0 });
  });
  // black keys: after white indices 0,1,3,4,5 -> semis 1,3,6,8,10
  const blackAfter = [0, 1, 3, 4, 5];
  const blackSemis = [1, 3, 6, 8, 10];
  const bw = ww * 0.6, bh = wh * 0.62;
  blackAfter.forEach((wi, k) => {
    const sem = blackSemis[k];
    const inScale = scaleSet.includes(sem);
    const isRoot = sem === root;
    const fill = isRoot ? GOLD : (inScale ? BLUE_DK : "111111");
    s.addShape(pres.shapes.RECTANGLE, { x: ox + (wi + 1) * ww - bw / 2, y: oy, w: bw, h: bh, fill: { color: fill }, line: { color: "000000", width: 1 } });
  });
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const A_MINOR = [9, 11, 0, 2, 4, 5, 7];

// 15. Why scales exist — dissonance demo
{
  const s = slide({ notes: "4 min. The visceral A/B. In the app: set scale = chromatic (all 12 notes available) and paint a few random notes — sounds jarring/random. Then switch to a scale (e.g. minor) — the SAME painting suddenly sounds intentional. This is the entire reason scales exist." });
  centerTitle(s, "Why do scales exist?", { y: 0.5, fontSize: 32, bold: true });
  // chromatic keyboard (all in)
  drawKeyboard(s, 1.0, 1.7, [0,1,2,3,4,5,6,7,8,9,10,11], -1, 3.6);
  s.addText("chromatic: all 12\n→ sounds random", { x: 1.0, y: 3.55, w: 3.6, h: 0.7, fontFace: MONO, fontSize: 13, color: RED, align: "center", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 5.0, y: 1.9, w: 0, h: 1.4, line: { color: MUTE, width: 1 } });
  // scale keyboard
  drawKeyboard(s, 5.4, 1.7, A_MINOR, 9, 3.6);
  s.addText("a scale: pick a few\n→ sounds intentional", { x: 5.4, y: 3.55, w: 3.6, h: 0.7, fontFace: MONO, fontSize: 13, color: GREEN, align: "center", margin: 0 });
  s.addText("▶ DEMO: same notes, chromatic vs. a scale", {
    x: 0.5, y: 4.75, w: 9, h: 0.4, fontFace: MONO, fontSize: 13.5, color: GOLD, align: "center", margin: 0,
  });
}

// 16. Key = tonic + scale
{
  const s = slide({ notes: "4 min. A scale is a recipe of steps; a key is that recipe started on a chosen note (the tonic / home). Major = W W H W W W H. Same shape, slid to any starting note." });
  s.addText("key  =  tonic  +  scale", {
    x: 0.5, y: 0.5, w: 9, h: 0.7, fontFace: MONO, fontSize: 30, color: FG, bold: true, align: "center", margin: 0,
  });
  drawKeyboard(s, 2.0, 1.7, MAJOR, 0, 6.0);
  s.addText("C major", { x: 2.0, y: 1.35, w: 6, h: 0.3, fontFace: MONO, fontSize: 14, color: MUTE, align: "left", margin: 0 });
  s.addText("major scale  =  W  W  H  W  W  W  H", {
    x: 0.5, y: 4.55, w: 9, h: 0.5, fontFace: MONO, fontSize: 18, color: GREEN, align: "center", margin: 0,
  });
  s.addText("(gold = home note · blue = in the scale)", {
    x: 0.5, y: 5.1, w: 9, h: 0.3, fontFace: MONO, fontSize: 11, color: MUTE, align: "center", margin: 0,
  });
}

// 17. Relative keys
{
  const s = slide({ notes: "4 min. C major and A minor use the exact same notes — only the home note differs. Same palette, different mood. (Circle of fifths optional if you want to go further.)" });
  centerTitle(s, "Relative keys", { y: 0.45, fontSize: 30, bold: true });
  s.addText("same notes — different home", {
    x: 0.5, y: 1.2, w: 9, h: 0.4, fontFace: MONO, fontSize: 14, color: MUTE, align: "center", margin: 0,
  });
  drawKeyboard(s, 0.7, 2.0, MAJOR, 0, 4.0);
  s.addText("C major", { x: 0.7, y: 1.7, w: 4, h: 0.3, fontFace: MONO, fontSize: 13, color: BLUE, align: "left", margin: 0 });
  s.addText("⇄", { x: 4.7, y: 2.4, w: 0.6, h: 1.2, fontFace: MONO, fontSize: 30, color: GREEN, align: "center", valign: "middle", margin: 0 });
  drawKeyboard(s, 5.3, 2.0, A_MINOR, 9, 4.0);
  s.addText("A minor", { x: 5.3, y: 1.7, w: 4, h: 0.3, fontFace: MONO, fontSize: 13, color: GOLD, align: "left", margin: 0 });
  s.addText("the gold key is the only thing that moved", {
    x: 0.5, y: 4.8, w: 9, h: 0.4, fontFace: MONO, fontSize: 13, color: MUTE, align: "center", italic: true, margin: 0,
  });
}

// ===========================================================================
// ACT 3 — MAKE
// ===========================================================================

// 18. Act 3 divider + share URL
{
  const s = actDivider("3", "MAKE", "now — open the app",
    "~35 min. NOW share the URL (not before). Put it big on screen. This is where the room takes over.");
  s.addShape(pres.shapes.RECTANGLE, { x: 2.3, y: 4.4, w: 5.4, h: 0.7, fill: { color: "242424" }, line: { color: GREEN, width: 1.5 } });
  s.addText("[ your app URL here ]", { x: 2.3, y: 4.4, w: 5.4, h: 0.7, fontFace: MONO, fontSize: 18, color: LINK, align: "center", valign: "middle", margin: 0 });
}

// 19. Interface tour
{
  const s = slide({ notes: "3 min. Walk the interface from the projector before they wander. One reel row: tape dial (length = the phasing knob), fill, root + scale, the grid. Show start/stop. Keep it to the essentials." });
  centerTitle(s, "The interface, in one row", { y: 0.45, fontSize: 28, bold: true });
  mediaCard(s, "[ screenshot: one TapeLoopRow, expanded editor ]", 1.0, 1.4, 8.0, 2.2);
  s.addText([
    { text: "tape dial — loop length (this is your phasing knob)", options: { bullet: true, breakLine: true, color: GOLD } },
    { text: "fill — how much of the tape is melody vs. silence", options: { bullet: true, breakLine: true, color: FG } },
    { text: "root + scale — the key (everything you just learned)", options: { bullet: true, breakLine: true, color: BLUE } },
    { text: "the grid — paint notes; press play", options: { bullet: true, color: FG } },
  ], { x: 1.4, y: 3.8, w: 7.2, h: 1.6, fontFace: MONO, fontSize: 13.5, align: "left", paraSpaceAfter: 6, margin: 0 });
}

// 20. Hands-on: build a loop
function handsOn(title, mins, lines, notes) {
  const s = slide({ notes: notes });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.25, h: H, fill: { color: GREEN } });
  s.addText("HANDS-ON", { x: 0.6, y: 0.55, w: 6, h: 0.4, fontFace: MONO, fontSize: 13, color: GREEN, charSpacing: 4, margin: 0 });
  s.addText(title, { x: 0.6, y: 1.05, w: 7.5, h: 0.9, fontFace: MONO, fontSize: 34, color: FG, bold: true, margin: 0 });
  s.addText(mins, { x: 7.0, y: 0.55, w: 2.4, h: 0.4, fontFace: MONO, fontSize: 14, color: MUTE, align: "right", margin: 0 });
  s.addText(lines.map((t, i) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < lines.length - 1, color: FG } })),
    { x: 0.9, y: 2.3, w: 8.2, h: 2.8, fontFace: MONO, fontSize: 17, align: "left", paraSpaceAfter: 12, margin: 0 });
  return s;
}

handsOn("Build a loop", "~10 min", [
  "pick a scale and a root you like",
  "paint a few notes on the grid",
  "press play — adjust fill until it breathes",
  "try a different instrument",
], "Everyone makes one loop. You float and help. Encourage sparse — fewer notes sound more 'ambient'.");

// 21. Phasing in practice
handsOn("Make it phase", "~7 min", [
  "duplicate your loop (or add a second)",
  "give it a DIFFERENT length on the tape dial",
  "play both — listen to them drift apart",
  "coprime lengths drift the longest",
], "Now they hear Act 2a with their own ears. Two loops, different lengths, drifting. Call back to the airports demo.");

// 22. Pick a favorite
handsOn("Pick your one", "~5 min", [
  "mute everything except your best loop",
  "tune its key to taste",
  "we're about to play them all together",
], "Narrow each laptop to ONE loop for the finale. One audible loop per laptop so the room reads as N voices, not N x layers.");

// 23. THE FINALE
{
  const s = slide({ notes: "8 min. THE moment. One loop per laptop, all playing. You conduct from the front: set a shared global root + scale so the room is in one key, nudge global pace, let it drift. This is the laptop orchestra. End the class on this high." });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: "0E0E0E" } });
  s.addText("THE FINALE", {
    x: 0.5, y: 1.5, w: 9, h: 1.2, fontFace: MONO, fontSize: 58, color: GREEN, bold: true, align: "center", margin: 0,
  });
  s.addText("one loop per laptop · the room is the orchestra", {
    x: 0.5, y: 2.8, w: 9, h: 0.5, fontFace: MONO, fontSize: 18, color: FG, align: "center", margin: 0,
  });
  s.addText("you conduct: shared key from the toolbar · nudge the pace · let it drift",
    { x: 0.5, y: 3.6, w: 9, h: 0.5, fontFace: MONO, fontSize: 14, color: GOLD, align: "center", margin: 0 });
}

// 24. Closing
quoteSlide(
  '"I think that the system is as right as you judge it to be. ' +
  "If for some reason you don't like a bit of it you must trust " +
  'your intuition on that. I don\'t take a doctrinaire approach ' +
  'to systems."',
  "2 min. Close on Eno: the math sets it up, but YOUR ear is the final judge. Thank them. Put the app URL + your contact on screen (edit the placeholder)."
);
// add closing footer to that last slide is tricky since quoteSlide returns; do a final outro slide instead
{
  const s = slide({ notes: "Outro / contact. Fill in real links." });
  s.addText("thanks for making noise with me", {
    x: 0.5, y: 1.8, w: 9, h: 0.8, fontFace: MONO, fontSize: 30, color: FG, bold: true, align: "center", margin: 0,
  });
  s.addText("[ app URL ]   ·   [ your contact / @handle ]", {
    x: 0.5, y: 2.9, w: 9, h: 0.5, fontFace: MONO, fontSize: 16, color: LINK, align: "center", margin: 0,
  });
  s.addText("Ambient 101 · ITP Camp 2026", {
    x: 0.5, y: 4.8, w: 9, h: 0.4, fontFace: MONO, fontSize: 12, color: MUTE, align: "center", margin: 0,
  });
}

pres.writeFile({ fileName: "Ambient_101_2026.pptx" }).then((f) => console.log("wrote", f));
