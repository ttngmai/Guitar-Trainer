// Music theory constants and helpers

export const NOTES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const NOTE_TO_INDEX: Record<string, number> = Object.fromEntries(
  NOTES.map((n, i) => [n, i])
) as Record<string, number>;

// Standard tuning (6→1): E2 A2 D3 G3 B3 E4 → pitch classes (C=0)
// Using pitch classes only; absolute octaves are not required for this trainer
export const STD_TUNING_PC = [4, 9, 2, 7, 11, 4];
export const STD_TUNING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E']; // 6→1


