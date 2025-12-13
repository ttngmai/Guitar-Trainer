import { STD_TUNING_PC, STD_TUNING_LABELS } from './music';

export type TuningPreset = {
  name: string;
  pitchClasses: number[];
  labels: string[];
};

export const TUNING_PRESETS: Record<string, TuningPreset> = {
  'Standard (EADGBE)': {
    name: 'Standard (EADGBE)',
    pitchClasses: [...STD_TUNING_PC],
    labels: [...STD_TUNING_LABELS],
  },
  'Drop D': {
    name: 'Drop D',
    pitchClasses: [4, 11, 7, 2, 9, 2], // E B G D A D (1→6)
    labels: ['E', 'B', 'G', 'D', 'A', 'D'],
  },
  'Open G': {
    name: 'Open G',
    pitchClasses: [2, 7, 2, 7, 11, 2], // D G D G B D (1→6)
    labels: ['D', 'G', 'D', 'G', 'B', 'D'],
  },
  'Open D': {
    name: 'Open D',
    pitchClasses: [2, 9, 2, 6, 9, 2], // D A D F# A D (1→6)
    labels: ['D', 'A', 'D', 'F#', 'A', 'D'],
  },
};

export const getTuningPreset = (name: string): TuningPreset | null => {
  return TUNING_PRESETS[name] || null;
};

