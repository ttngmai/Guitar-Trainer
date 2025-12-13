import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { FaPalette } from 'react-icons/fa';
import {
  NOTES,
  NOTE_FLAT_NAMES,
  NOTE_DEGREE_NAMES,
  NOTE_DEGREE_FLAT_NAMES,
  isNoteWithAccidental,
} from '../constants/music';
import { getLiquidGlassButtonStyle } from '../constants/styles';
import { getTextColor } from '../utils/color';

type NoteToggleProps = {
  selectedNotes: Set<string>;
  onToggle: (note: string) => void;
  noteColors: Record<string, string>;
  onColorChange: (note: string, color: string) => void;
  noteNotations: Record<string, 'sharp' | 'flat'>;
  onToggleAllNotations: () => void;
  notationMode: 'letter' | 'degree';
  onNotationModeChange: (mode: 'letter' | 'degree') => void;
};

export const NoteToggle: React.FC<NoteToggleProps> = ({
  selectedNotes,
  onToggle,
  noteColors,
  onColorChange,
  noteNotations,
  onToggleAllNotations,
  notationMode,
  onNotationModeChange,
}) => {
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const colorPickerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openColorPicker) {
        const ref = colorPickerRefs.current[openColorPicker];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenColorPicker(null);
        }
      }
    };

    if (openColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openColorPicker]);

  const handleColorChange = (note: string, color: ColorResult) => {
    onColorChange(note, color.hex);
  };

  const toggleColorPicker = (note: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setOpenColorPicker(openColorPicker === note ? null : note);
  };

  const getDisplayName = (note: string): string => {
    if (notationMode === 'degree') {
      if (isNoteWithAccidental(note)) {
        const notation = noteNotations[note] || 'sharp';
        return notation === 'flat'
          ? NOTE_DEGREE_FLAT_NAMES[note] || NOTE_DEGREE_NAMES[note]
          : NOTE_DEGREE_NAMES[note] || note;
      } else {
        return NOTE_DEGREE_NAMES[note] || note;
      }
    } else {
      if (isNoteWithAccidental(note)) {
        const notation = noteNotations[note] || 'sharp';
        if (notation === 'flat') {
          return NOTE_FLAT_NAMES[note] || note;
        }
        return note;
      }
      return note;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 font-medium drop-shadow-sm">
          표기법:
        </span>
        <button
          onClick={() =>
            onNotationModeChange(
              notationMode === 'letter' ? 'degree' : 'letter'
            )
          }
          style={getLiquidGlassButtonStyle(false)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          title={`현재: ${
            notationMode === 'letter' ? '문자' : '도수'
          } 표기법 (클릭하여 전환)`}
        >
          문자/도수
        </button>
        <button
          onClick={onToggleAllNotations}
          style={getLiquidGlassButtonStyle(false)}
          className="px-3 py-1.5 rounded-lg text-slate-700 text-sm font-medium transition-all hover:opacity-90"
        >
          #/♭
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {NOTES.map((note) => {
          const isSelected = selectedNotes.has(note);
          const color = noteColors[note] || '#94a3b8';
          const textColor = getTextColor(color);
          const displayName = getDisplayName(note);

          return (
            <div key={note} className="relative inline-block">
              <div
                className="flex flex-col items-stretch rounded-lg overflow-hidden transition-all"
                style={{
                  width: '100px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: isSelected
                    ? `0 8px 32px ${color}30, 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                    : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <button
                  onClick={() => onToggle(note)}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${color}CC 0%, ${color}99 100%)`
                      : 'linear-gradient(135deg, rgba(241, 245, 249, 0.6), rgba(226, 232, 240, 0.4))',
                    backdropFilter: 'blur(10px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(150%)',
                    color: isSelected ? textColor : '#475569',
                    boxShadow: isSelected
                      ? `0 8px 32px ${color}40, 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                      : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    border: isSelected
                      ? `1px solid ${color}80`
                      : '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  className="h-14 w-full transition-all hover:opacity-90 flex items-center justify-center rounded-lg"
                  title={`${displayName} ${isSelected ? '숨기기' : '표시하기'}`}
                >
                  <span className="text-sm font-semibold drop-shadow-sm">
                    {displayName}
                  </span>
                </button>

                <div
                  className="p-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <button
                    onClick={(e) => toggleColorPicker(note, e)}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(241, 245, 249, 0.6), rgba(226, 232, 240, 0.4))',
                      backdropFilter: 'blur(10px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow:
                        '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    }}
                    className="w-full h-6 rounded transition-all hover:opacity-80 flex items-center justify-center"
                    title={`${note} 색상 변경`}
                  >
                    <FaPalette className="text-slate-700 text-xs drop-shadow-sm" />
                  </button>
                </div>
              </div>
              {openColorPicker === note && (
                <div
                  ref={(el) => {
                    colorPickerRefs.current[note] = el;
                  }}
                  className="absolute z-50 mt-1 shadow-2xl"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: '100%',
                  }}
                >
                  <div className="relative">
                    <SketchPicker
                      color={color}
                      onChange={(color: ColorResult) =>
                        handleColorChange(note, color)
                      }
                      disableAlpha
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
