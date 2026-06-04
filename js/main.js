// ============================================================
// Home page — project browser (infinite loop).
// Left: vertical list of names. Right: vertical thumbnail carousel.
// The two tracks move in OPPOSITE directions but always centre the
// same project. Scrolling never ends — past the last project it
// loops back to the first, and vice-versa.
// ============================================================
import { projects, imgSrc, imgAt } from "./projects.js";
import { StepScroll } from "./stepscroll.js";
import { runLoader } from "./loader.js";

// First-load intro overlay (built on top of the home page beneath it).
runLoader();

const namesEl = document.getElementById("names");
const carouselEl = document.getElementById("carousel");

const N = projects.length;
// Two copies of every project so a hidden buffer is always available
// on each side — the seam where a tile wraps stays off-screen.
const M = N * 2;

// --- Build DOM (M tiles, content by modulo) -------------------
const nameEls = [];
const thumbEls = [];
for (let t = 0; t < M; t++) {
  const p = projects[t % N];

  const nameEl = document.createElement("div");
  nameEl.className = "name";
  nameEl.innerHTML = `
    <span class="name__title">${p.name}</span>
    <span class="name__tag">${p.category}</span>`;
  namesEl.appendChild(nameEl);
  nameEls.push(nameEl);

  const thumbEl = document.createElement("div");
  thumbEl.className = "thumb";
  thumbEl.innerHTML =
    `<img src="${imgSrc(p)}" alt="${p.name}" draggable="false" />` +
    `<div class="thumb__overlay"><span class="thumb__plus"></span></div>`;
  carouselEl.appendChild(thumbEl);
  thumbEls.push(thumbEl);
}

// --- State ----------------------------------------------------
let pos = 0;                          // unbounded position counter
let isOpen = false;                   // true while the project page is shown
let menuOpen = false;                 // true while the dropdown menu is shown
let heroEl = null;                    // the thumbnail currently expanded (manual control)
let heroSlot = null;                  // its exact carousel-slot box (px) for a clean return
const prevRel = new Array(M).fill(null);
let nameStep = 0;                     // px between names
let thumbStep = 0;                    // px between thumbnails

function measure() {
  const vh = window.innerHeight;
  nameStep = vh * 0.18;
  thumbStep = vh * 0.67;
}

// Nearest signed distance of tile t to the current position, in (-M/2, M/2].
function relOf(t) {
  let rel = ((t - pos) % M + M) % M;   // 0 .. M-1
  if (rel > M / 2) rel -= M;
  return rel;
}

function applyTile(t, rel) {
  const dist = Math.abs(rel);

  // LEFT name: active enters from the BOTTOM when advancing.
  const nameEl = nameEls[t];
  const nameScale = rel === 0 ? 1 : 0.4;
  nameEl.style.transform =
    `translateY(calc(-50% + ${rel * nameStep}px)) scale(${nameScale})`;
  nameEl.classList.toggle("is-active", rel === 0);
  nameEl.style.opacity = dist <= 1 ? "1" : "0";

  // RIGHT thumbnail: active enters from the TOP (opposite direction).
  const thumbEl = thumbEls[t];
  const scale = rel === 0 ? 1 : 0.86;
  thumbEl.style.transform =
    `translate(-50%, calc(-50% + ${-rel * thumbStep}px)) scale(${scale})`;
  thumbEl.style.opacity = rel === 0 ? "1" : dist === 1 ? "0.5" : "0";
  thumbEl.style.zIndex = rel === 0 ? "2" : "1";
  // Only the centred thumbnail is clickable / shows the hover affordance.
  thumbEl.classList.toggle("is-current", rel === 0);
}

function render() {
  if (isOpen) return;             // carousel is frozen on the project page
  for (let t = 0; t < M; t++) {
    if (thumbEls[t] === heroEl) continue;   // hero is under manual transition control
    const rel = relOf(t);
    // If a tile jumped to the far side of the ring (the wrap seam),
    // move it without animating — it's deep off-screen and hidden.
    const wrapped = prevRel[t] !== null && Math.abs(rel - prevRel[t]) > 1;

    if (wrapped) {
      nameEls[t].style.transition = "none";
      thumbEls[t].style.transition = "none";
      applyTile(t, rel);
      // Commit the snapped position, then restore transitions so
      // future moves animate normally.
      void nameEls[t].offsetWidth;
      nameEls[t].style.transition = "";
      thumbEls[t].style.transition = "";
    } else {
      applyTile(t, rel);
    }

    prevRel[t] = rel;
  }
}

// --- Wire it up -----------------------------------------------
measure();
render();

new StepScroll({
  target: document.querySelector(".shell"),
  onStep: (dir) => {
    if (menuOpen) return;         // menu is open: nothing behind it moves
    if (isOpen) {                 // on the project view: page between project pages
      if (entering) return;
      // One page per gesture: ignore further steps until the slow push
      // has finished, so a small scroll can't skip ahead a page.
      const now = performance.now();
      if (now < pvCooldownUntil) return;
      if (!pvDurMs) pvDurMs = cssMs("--pv-dur");
      pvCooldownUntil = now + pvDurMs;
      pvStep(dir);
      return;
    }
    pos += dir;
    render();
  },
});

window.addEventListener("resize", () => {
  measure();
  render();
});

// ============================================================
// Project view: shared-element entry, then a 3-page push pager.
//
//   page 0  left: text sections (white)   right: hero image
//   page 1  left: full-bleed image        right: small image in white
//   page 2  left: full-bleed image        right: attribution + quote
//
// Entry (home -> page 0) reuses the very same thumbnail image node
// (shared element). Paging between pages 0/1/2 uses the .pv layer,
// whose two tracks push in opposite vertical directions.
// ============================================================
const projectPage = document.getElementById("projectPage");
const sectionEls = [...projectPage.querySelectorAll(".proj-section")];
const brandEl = document.querySelector(".brand");
const pvEl = document.getElementById("pv");

let entering = false;            // true during the entry animation (paging locked)
let pvCooldownUntil = 0;         // gates paging to one page per scroll gesture
let pvDurMs = 0;                  // cached push duration (ms)
let pg = 0;                       // current project page (0..2)
let pvLeft = [];                  // left track panels
let pvRight = [];                 // right track panels
const sectionTimers = [];
let revealTimer = null;

const QUOTE = {
  name: "Jane Doe",
  text: "Some people think design means how it looks. But if you dig deeper, it's really how it works.",
};

// Transition string used while the shared image expands / contracts.
const HERO_TRANSITION =
  ["top", "left", "width", "height", "transform"]
    .map((p) => `${p} var(--hero-dur) var(--ease)`)
    .join(", ");

// ---- Build the paging layer for a given project ----------------
function buildPV(project) {
  // Reuse the page-0 text sections (clone so the page-0 underlay keeps its own).
  const sectionsClone = projectPage
    .querySelector(".project-page__inner")
    .cloneNode(true);
  sectionsClone
    .querySelectorAll(".proj-section")
    .forEach((s) => s.classList.add("is-in"));

  pvEl.innerHTML = "";

  const leftTrack = document.createElement("div");
  leftTrack.className = "pv-track pv-track--left";
  const rightTrack = document.createElement("div");
  rightTrack.className = "pv-track pv-track--right";

  const panel = (cls, inner) => {
    const el = document.createElement("div");
    el.className = `pv-panel ${cls}`;
    if (inner) el.append(inner);
    return el;
  };
  const imgPanel = (file) => {
    const el = panel("pv-image");
    el.innerHTML = `<img src="${imgAt(project, file)}" alt="${project.name}" draggable="false" />`;
    return el;
  };

  // LEFT track: white sections, then two full-bleed images.
  const leftP0 = panel("pv-white");
  leftP0.append(sectionsClone);
  pvLeft = [leftP0, imgPanel("02.jpg"), imgPanel("04.jpg")];
  pvLeft.forEach((el) => leftTrack.append(el));

  // RIGHT track: hero image, small image in white, then quote.
  const rightP0 = imgPanel("01.jpg");
  const rightP1 = panel("pv-white pv-figure");
  rightP1.innerHTML =
    `<img class="pv-figure__img" src="${imgAt(project, "03.jpg")}" alt="${project.name}" draggable="false" />`;
  const rightP2 = panel("pv-white pv-quote");
  rightP2.innerHTML =
    `<span class="pv-quote__name">${QUOTE.name}</span>` +
    `<p class="pv-quote__text">${QUOTE.text}</p>`;
  pvRight = [rightP0, rightP1, rightP2];
  pvRight.forEach((el) => rightTrack.append(el));

  pvEl.append(leftTrack, rightTrack);
}

// Position the panels for the current page (opposite vertical directions).
function renderPV(animate = true) {
  const apply = (el, y) => {
    if (!animate) el.style.transition = "none";
    el.style.transform = `translateY(${y}vh)`;
    if (!animate) {
      void el.offsetWidth;
      el.style.transition = "";
    }
  };
  pvLeft.forEach((el, i) => apply(el, (i - pg) * 100));   // enters from bottom
  pvRight.forEach((el, i) => apply(el, -(i - pg) * 100)); // enters from top
}

function pvStep(dir) {
  const next = pg + dir;
  if (next < 0) {            // scrolling up past the first page -> home
    close();
    return;
  }
  if (next > pvLeft.length - 1) return;   // last page: stay
  pg = next;
  renderPV(true);
}

// ---- Open: shared-element entry ----------------------------------
function open(thumbEl) {
  if (isOpen) return;
  isOpen = true;
  entering = true;
  pg = 0;
  heroEl = thumbEl;
  const project = projects[thumbEls.indexOf(thumbEl) % N];

  document.body.classList.add("project-open");
  projectPage.setAttribute("aria-hidden", "false");

  // Reuse the very same image node: expand its container to fill the
  // right half. No second image is ever created or loaded.
  heroEl.classList.remove("is-current");   // stop hover state

  // Pin the hero to its exact current pixel box first (carousel-relative,
  // with no transform). Animating plain top/left/width/height from here —
  // instead of a percentage translate while the size changes — avoids the
  // subtle jump at the start of the expansion.
  const r = heroEl.getBoundingClientRect();
  const relLeft = r.left - window.innerWidth * 0.5;   // carousel = right half
  heroSlot = { left: relLeft, top: r.top, w: r.width, h: r.height };
  heroEl.style.zIndex = "12";
  heroEl.style.transition = "none";
  heroEl.style.transform = "none";
  heroEl.style.left = `${relLeft}px`;
  heroEl.style.top = `${r.top}px`;
  heroEl.style.width = `${r.width}px`;
  heroEl.style.height = `${r.height}px`;
  void heroEl.offsetWidth;                  // commit the pinned box

  // Now expand to fill the right half (pure rect animation).
  heroEl.style.transition = HERO_TRANSITION;
  heroEl.style.left = "0";
  heroEl.style.top = "0";
  heroEl.style.width = "50vw";
  heroEl.style.height = "100vh";

  // Fade the other thumbnails away so nothing peeks behind the hero.
  thumbEls.forEach((el) => {
    if (el !== heroEl) el.style.opacity = "0";
  });

  // Fade the page-0 sections in one at a time once the white has settled.
  sectionEls.forEach((el) => el.classList.remove("is-in"));
  const revealMs = cssMs("--reveal-dur");
  sectionEls.forEach((el, i) => {
    sectionTimers.push(
      setTimeout(() => el.classList.add("is-in"), revealMs + i * 220)
    );
  });

  // Pre-build the paging layer at page 0 (hidden), then reveal it once the
  // entry has fully assembled. From then on, scrolling pages the project.
  buildPV(project);
  renderPV(false);                         // place panels with no animation
  const entryMs = revealMs + (sectionEls.length - 1) * 220 + 720;
  revealTimer = setTimeout(() => {
    pvEl.classList.add("is-shown");
    entering = false;
  }, entryMs);
}

// ---- Close: back to the home browser ----------------------------
function close() {
  if (!isOpen) return;
  isOpen = false;
  entering = false;
  clearTimeout(revealTimer);

  // Fade the paging layer away (cross-fades inner pages back to page 0),
  // then run the shared-element contract from page 0.
  if (pvEl.classList.contains("is-shown")) {
    pvEl.classList.remove("is-shown");
    setTimeout(() => {
      pg = 0;
      renderPV(false);
      contractHero();
    }, 360);
  } else {
    contractHero();
  }
}

function contractHero() {
  document.body.classList.remove("project-open");
  projectPage.setAttribute("aria-hidden", "true");

  sectionTimers.forEach(clearTimeout);
  sectionTimers.length = 0;
  sectionEls.forEach((el) => el.classList.remove("is-in"));

  // Contract back to the exact pixel box it started from (no transform),
  // mirroring the clean expansion so there is no reverse jump.
  const el = heroEl;
  el.style.transition = HERO_TRANSITION;
  el.style.left = `${heroSlot.left}px`;
  el.style.top = `${heroSlot.top}px`;
  el.style.width = `${heroSlot.w}px`;
  el.style.height = `${heroSlot.h}px`;

  // Clean up on a timer (robust even if the transition is a no-op and
  // fires no transitionend) and hand control back to the carousel.
  setTimeout(() => {
    // Disable the transition during the hand-off so reverting the inline
    // transform back to the carousel's resting transform is INSTANT — otherwise
    // it animates none -> translate(-50%,-50%) and the thumb flicks to the
    // lower-right and back.
    el.style.transition = "none";
    el.style.top = "";
    el.style.left = "";
    el.style.width = "";
    el.style.height = "";
    el.style.transform = "";
    el.style.zIndex = "";
    heroEl = null;
    heroSlot = null;
    pvEl.innerHTML = "";          // tear down the paging layer
    pvLeft = [];
    pvRight = [];
    render();                     // sets the resting transform instantly
    void el.offsetWidth;          // commit before re-enabling transitions
    el.style.transition = "";     // restore for future carousel moves
  }, cssMs("--hero-dur") + 40);

  render();                       // restore the other thumbnails
}

// Read a CSS time custom property (e.g. "820ms") as a number of ms.
function cssMs(name) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000;
}

carouselEl.addEventListener("click", (e) => {
  const thumb = e.target.closest(".thumb.is-current");
  if (thumb && !isOpen) open(thumb);
});

// Clicking the active project title opens the same project (shared image).
namesEl.addEventListener("click", (e) => {
  if (isOpen || !e.target.closest(".name.is-active")) return;
  const hero = document.querySelector(".thumb.is-current");
  if (hero) open(hero);
});

brandEl.addEventListener("click", (e) => {
  e.preventDefault();          // single-page: never reload
  if (isOpen) close();
});

// ============================================================
// MENU — slide-down panel over the right half (independent overlay;
// nothing behind it moves or changes).
// ============================================================
const menuBtn = document.querySelector(".menu");
const menuPanel = document.getElementById("menuPanel");
const menuFadeEls = [...menuPanel.querySelectorAll(".menu-item, .menu-studio")];
const menuTimers = [];

function openMenu() {
  if (menuOpen) return;
  menuOpen = true;
  document.body.classList.add("menu-open");
  menuPanel.setAttribute("aria-hidden", "false");
  menuBtn.textContent = "CLOSE";
  menuBtn.setAttribute("aria-label", "Close menu");
  menuBtn.setAttribute("aria-expanded", "true");

  // Fade the items in one at a time once the panel has settled.
  menuFadeEls.forEach((el) => el.classList.remove("is-in"));
  const start = cssMs("--menu-dur") * 0.55;
  menuFadeEls.forEach((el, i) => {
    menuTimers.push(setTimeout(() => el.classList.add("is-in"), start + i * 110));
  });
}

function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  document.body.classList.remove("menu-open");
  menuPanel.setAttribute("aria-hidden", "true");
  menuBtn.textContent = "MENU";
  menuBtn.setAttribute("aria-label", "Open menu");
  menuBtn.setAttribute("aria-expanded", "false");

  menuTimers.forEach(clearTimeout);
  menuTimers.length = 0;
  menuFadeEls.forEach((el) => el.classList.remove("is-in"));
}

menuBtn.addEventListener("click", () => {
  menuOpen ? closeMenu() : openMenu();
});

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (menuOpen) closeMenu();
  else if (isOpen) close();
});
