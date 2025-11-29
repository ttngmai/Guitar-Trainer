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

// Standard tuning (1→6): E4 B3 G3 D3 A2 E2 → pitch classes (C=0)
// Using pitch classes only; absolute octaves are not required for this trainer
// 배열 인덱스 0 = 1번줄(상단), 인덱스 5 = 6번줄(하단)
export const STD_TUNING_PC = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E
export const STD_TUNING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E']; // 1→6


