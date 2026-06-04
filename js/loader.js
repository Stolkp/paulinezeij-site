// ============================================================
// Loader — first-load intro.
// Two full-bleed images push into the 50/50 split from opposite
// vertical directions (right from the top, left from the bottom),
// while KENDALL breathes outward across the middle. KENDALL then
// fades and the images slide back out, revealing the home page.
// Plays once per page load.
// ============================================================
import { projects, imgAt } from "./projects.js";

// Timing (ms) — calm and deliberate.
const ENTER = 1100;        // images push in
const BREATHE = 2000;      // KENDALL letter-spacing opens out over this
const WORD_FADE = 600;     // KENDALL fade-out
const EXIT = 1100;         // images slide back out
const EXIT_AT = BREATHE + 650;

const el = (cls) => {
  const d = document.createElement("div");
  d.className = cls;
  return d;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const onceLoaded = (img) =>
  img.complete
    ? Promise.resolve()
    : new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

// One random image file (01..05) from a project.
function randomImage(project) {
  const n = 1 + Math.floor(Math.random() * 5);
  return imgAt(project, String(n).padStart(2, "0") + ".jpg");
}

// Two DIFFERENT projects, uniformly at random.
function pickTwoProjects() {
  const i = Math.floor(Math.random() * projects.length);
  let j = Math.floor(Math.random() * (projects.length - 1));
  if (j >= i) j++;                       // guarantees j !== i, still uniform
  return [projects[i], projects[j]];
}

export function runLoader() {
  const [pLeft, pRight] = pickTwoProjects();

  const loader = el("loader");
  const bg = el("loader-bg");
  const left = el("loader-half loader-half--left");
  const right = el("loader-half loader-half--right");

  const leftImg = new Image();
  leftImg.src = randomImage(pLeft);
  leftImg.alt = "";
  leftImg.draggable = false;
  const rightImg = new Image();
  rightImg.src = randomImage(pRight);
  rightImg.alt = "";
  rightImg.draggable = false;
  left.append(leftImg);
  right.append(rightImg);

  const word = el("loader-word");
  word.textContent = "KENDALL";

  loader.append(bg, left, right, word);
  document.body.appendChild(loader);

  // Start positions: right above, left below (no transition yet).
  left.style.transform = "translateY(100%)";
  right.style.transform = "translateY(-100%)";

  // Begin once both images are ready (or shortly after, as a fallback).
  Promise.race([
    Promise.all([onceLoaded(leftImg), onceLoaded(rightImg)]),
    wait(600),
  ]).then(start);

  function start() {
    // Commit the start positions before enabling transitions.
    void left.offsetWidth;

    // --- Images push in -------------------------------------
    left.style.transition = `transform ${ENTER}ms var(--ease)`;
    right.style.transition = `transform ${ENTER}ms var(--ease)`;
    left.style.transform = "translateY(0)";
    right.style.transform = "translateY(0)";

    // --- KENDALL breathes outward ---------------------------
    word.style.transition =
      `letter-spacing ${BREATHE}ms var(--ease), ` +
      `text-indent ${BREATHE}ms var(--ease), ` +
      `opacity ${WORD_FADE}ms var(--ease)`;
    word.style.letterSpacing = "0.5em";
    word.style.textIndent = "0.5em";

    // --- KENDALL fades away before the reveal ---------------
    setTimeout(() => {
      word.style.opacity = "0";
    }, BREATHE);

    // --- Images slide back out, revealing the home page -----
    setTimeout(() => {
      bg.style.opacity = "0";          // invisible: the halves still cover the screen
      left.style.transition = `transform ${EXIT}ms var(--ease)`;
      right.style.transition = `transform ${EXIT}ms var(--ease)`;
      left.style.transform = "translateY(100%)";
      right.style.transform = "translateY(-100%)";
    }, EXIT_AT);

    setTimeout(() => loader.remove(), EXIT_AT + EXIT + 60);
  }
}
