const KANNADA_DAY_LABELS = {
  1: 'ಮೊದಲನೇ ದಿನ',
  2: 'ಎರಡನೇ ದಿನ',
  3: 'ಮೂರನೇ ದಿನ',
  4: 'ನಾಲ್ಕನೇ ದಿನ',
  5: 'ಐದನೇ ದಿನ',
  6: 'ಆರನೇ ದಿನ',
  7: 'ಏಳನೇ ದಿನ',
  8: 'ಎಂಟನೇ ದಿನ',
  9: 'ಒಂಬತ್ತನೇ ದಿನ',
  10: 'ಹತ್ತನೇ ದಿನ',
};

export function getKannadaDayLabel(day) {
  const num = Number(day);
  if (KANNADA_DAY_LABELS[num]) return KANNADA_DAY_LABELS[num];
  if (!Number.isFinite(num) || num < 1) return '-';
  return `${num}ನೇ ದಿನ`;
}
