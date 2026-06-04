// Project data. Each entry maps to a folder in ./Visuals/.
// `cover` is the thumbnail shown in the home-page carousel.
export const projects = [
  { name: "Northlight", category: "Portrait",    folder: "project-05", cover: "01.jpg" },
  { name: "Aperture",  category: "Photography", folder: "project-01", cover: "01.jpg" },
  { name: "Monolith",  category: "Architecture", folder: "project-02", cover: "01.jpg" },
  { name: "Still Life", category: "Editorial",   folder: "project-03", cover: "01.jpg" },
  { name: "Daylight",  category: "Interiors",    folder: "project-04", cover: "01.jpg" },
];

// Cache-busting token, regenerated on every page load, so replacing an
// image file in-place (same path/name) shows the new version on refresh
// instead of the browser serving a stale cached copy.
const CACHE_BUST = Date.now();

export const imgSrc = (p) => `Visuals/${p.folder}/${p.cover}?v=${CACHE_BUST}`;
