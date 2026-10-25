export const backgrounds = { title: './assets/backgrounds/c01.webp', intro: './assets/backgrounds/c02.webp', office: './assets/backgrounds/c03.webp', map: './assets/backgrounds/c04.webp', precinct: './assets/backgrounds/c05.webp' };

// Photographic details of characters already present in the author's scene art.
// These are display windows into the original files, not newly generated faces.
const frames = {
  P01: ['c02', 510, 22, 300, 390],
  P02: ['c03', 1197, 126, 226, 312],
  P03: ['c06', 352, 701, 118, 155],
  P04: ['c03', 365, 58, 186, 300],
  P05: ['c03', 1510, 145, 156, 280],
  P06: ['c09', 762, 306, 147, 215],
  P07: ['c02', 1193, 156, 265, 242],
  P08: ['c09', 999, 284, 199, 252],
  P09: ['c08', 1359, 446, 75, 132],
  P10: ['c09', 1425, 275, 240, 258],
  P11: ['c10', 389, 187, 194, 285],
  P12: ['c10', 1135, 171, 132, 285]
};

export function portrait(person, size = 'small') {
  const [scene, x, y, w, h] = frames[person.id];
  return `<div class="portrait portrait-${size}" data-person="${person.id}" role="img" aria-label="${person.name}"><svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><image href="./assets/references/${scene}.webp" width="1672" height="941" /></svg></div>`;
}

export const artGallery = Array.from({ length: 10 }, (_, index) => ({
  id: `C${String(index + 1).padStart(2, '0')}`,
  title: ['A cidade em colapso', 'O convite', 'O gabinete', 'Centro de despacho', 'A instituição', 'Operação em andamento', 'Investigação', 'Frota e aquisições', 'Cúpula estadual', 'Cooperação federal'][index],
  url: `./assets/references/c${String(index + 1).padStart(2, '0')}.webp`
}));
