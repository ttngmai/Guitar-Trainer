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

export const NOTE_FLAT_NAMES: Record<string, string> = {
  'C#': 'D♭',
  'D#': 'E♭',
  'F#': 'G♭',
  'G#': 'A♭',
  'A#': 'B♭',
};

export const NOTES_WITH_ACCIDENTALS = ['C#', 'D#', 'F#', 'G#', 'A#'] as const;

export const NOTE_DEGREE_NAMES: Record<string, string> = {
  C: '1',
  'C#': '1#',
  D: '2',
  'D#': '2#',
  E: '3',
  F: '4',
  'F#': '4#',
  G: '5',
  'G#': '5#',
  A: '6',
  'A#': '6#',
  B: '7',
};

export const NOTE_DEGREE_FLAT_NAMES: Record<string, string> = {
  C: '1',
  'C#': '2♭',
  D: '2',
  'D#': '3♭',
  E: '3',
  F: '4',
  'F#': '5♭',
  G: '5',
  'G#': '6♭',
  A: '6',
  'A#': '7♭',
  B: '7',
};

export const STD_TUNING_PC = [4, 11, 7, 2, 9, 4];
export const STD_TUNING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];
