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
  thumbEl.innerHTML = `<img src="${imgSrc(p)}" alt="${p.name}" draggable="false" />`;
  carouselEl.appendChild(thumbEl);
  thumbEls.push(thumbEl);
}

// --- State ----------------------------------------------------
let pos = 0;                          // unbounded position counter
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
}

function render() {
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
    pos += dir;
    render();
  },
});

window.addEventListener("resize", () => {
  measure();
  render();
});
