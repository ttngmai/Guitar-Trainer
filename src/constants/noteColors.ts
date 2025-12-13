import { NOTES } from './music';

export const DEFAULT_NOTE_COLORS: Record<string, string> = {
  C: '#EF4444',
  'C#': '#F97316',
  D: '#FBBF24',
  'D#': '#84CC16',
  E: '#10B981',
  F: '#14B8A6',
  'F#': '#06B6D4',
  G: '#3B82F6',
  'G#': '#8B5CF6',
  A: '#EC4899',
  'A#': '#F472B6',
  B: '#FB923C',
};

export const getDefaultNoteColors = (): Record<string, string> => {
  const colors: Record<string, string> = {};
  NOTES.forEach((note) => {
    colors[note] = DEFAULT_NOTE_COLORS[note] || '#94a3b8';
  });
  return colors;
};
