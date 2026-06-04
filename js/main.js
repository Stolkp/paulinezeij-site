// ============================================================
// Home page — project browser (infinite loop).
// Left: vertical list of names. Right: vertical thumbnail carousel.
// The two tracks move in OPPOSITE directions but always centre the
// same project. Scrolling never ends — past the last project it
// loops back to the first, and vice-versa.
// ============================================================
import { projects, imgSrc } from "./projects.js";
import { StepScroll } from "./stepscroll.js";

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
    if (isOpen) return;           // freeze the carousel on the project page
    pos += dir;
    render();
  },
});

window.addEventListener("resize", () => {
  measure();
  render();
});

// ============================================================
// Home -> Project page transition (shared-element)
// ============================================================
const projectPage = document.getElementById("projectPage");
const sectionEls = [...projectPage.querySelectorAll(".proj-section")];
const brandEl = document.querySelector(".brand");

let heroEl = null;                // the thumbnail currently expanded
const sectionTimers = [];

// Transition string used while the shared image expands / contracts.
const HERO_TRANSITION =
  ["top", "left", "width", "height", "transform"]
    .map((p) => `${p} var(--hero-dur) var(--ease)`)
    .join(", ");

function open(thumbEl) {
  if (isOpen) return;
  isOpen = true;
  heroEl = thumbEl;
  document.body.classList.add("project-open");
  projectPage.setAttribute("aria-hidden", "false");

  // Reuse the very same image node: expand its container to fill the
  // right half. No second image is ever created or loaded.
  heroEl.classList.remove("is-current");   // stop hover state
  heroEl.style.zIndex = "12";
  heroEl.style.transition = HERO_TRANSITION;
  heroEl.style.top = "0";
  heroEl.style.left = "0";
  heroEl.style.width = "50vw";
  heroEl.style.height = "100vh";
  heroEl.style.transform = "none";

  // Fade the other thumbnails away so nothing peeks behind the hero.
  thumbEls.forEach((el) => {
    if (el !== heroEl) el.style.opacity = "0";
  });

  // Once the white block has settled, fade the sections in one by one.
  sectionEls.forEach((el) => el.classList.remove("is-in"));
  const revealMs = cssMs("--reveal-dur");
  sectionEls.forEach((el, i) => {
    sectionTimers.push(
      setTimeout(() => el.classList.add("is-in"), revealMs + i * 220)
    );
  });
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  document.body.classList.remove("project-open");
  projectPage.setAttribute("aria-hidden", "true");

  sectionTimers.forEach(clearTimeout);
  sectionTimers.length = 0;
  sectionEls.forEach((el) => el.classList.remove("is-in"));

  // Contract the shared image back into its carousel slot.
  const el = heroEl;
  el.style.transition = HERO_TRANSITION;
  el.style.top = "50%";
  el.style.left = "50%";
  el.style.width = "var(--thumb-w)";
  el.style.height = "var(--thumb-h)";
  el.style.transform = "translate(-50%, -50%) scale(1)";

  const done = (e) => {
    if (e.propertyName !== "width") return;
    el.removeEventListener("transitionend", done);
    // Hand control back to the carousel renderer.
    el.style.transition = "";
    el.style.top = "";
    el.style.left = "";
    el.style.width = "";
    el.style.height = "";
    el.style.zIndex = "";
    heroEl = null;
    render();
  };
  el.addEventListener("transitionend", done);

  // Restore the other thumbnails.
  render();
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

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isOpen) close();
});
