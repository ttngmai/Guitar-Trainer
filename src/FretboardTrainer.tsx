import { useMemo, useState, useEffect } from 'react';
import FretboardCanvas from './components/FretboardCanvas';
import { Chip } from './components/Chip';
import { NoteToggle } from './components/NoteToggle';
import {
  NOTES,
  NOTE_TO_INDEX,
  STD_TUNING_PC,
  NOTES_WITH_ACCIDENTALS,
} from './constants/music';
import { getTuningPreset } from './constants/tunings';
import { getDefaultNoteColors } from './constants/noteColors';
import { mod } from './utils/math';

export default function FretboardTrainer() {
  const [maxFrets, setMaxFrets] = useState(12);
  const [startFret, setStartFret] = useState(0);
  const [tuning, setTuning] = useState<number[]>(STD_TUNING_PC);
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [quizTarget, setQuizTarget] = useState<string>('C');
  const [clicked, setClicked] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(
    new Set(NOTES)
  );
  const [noteColors, setNoteColors] = useState<Record<string, string>>(
    getDefaultNoteColors()
  );
  const [noteNotations, setNoteNotations] = useState<
    Record<string, 'sharp' | 'flat'>
  >(() => {
    const notations: Record<string, 'sharp' | 'flat'> = {};
    NOTES_WITH_ACCIDENTALS.forEach((note) => {
      notations[note] = 'sharp';
    });
    return notations;
  });
  const [notationMode, setNotationMode] = useState<'letter' | 'degree'>(
    'letter'
  );

  const visibleFrets = useMemo(
    () =>
      Array.from({ length: maxFrets - startFret + 1 }, (_, i) => i + startFret),
    [maxFrets, startFret]
  );
  const strings = useMemo(() => [5, 4, 3, 2, 1, 0], []);

  const quizCorrectSet = useMemo(() => {
    const n = NOTE_TO_INDEX[quizTarget];
    const set = new Set<string>();
    strings.forEach((si) => {
      const sPC = tuning[si];
      visibleFrets.forEach((f) => {
        const p = mod(sPC + f, 12);
        if (p === n) {
          set.add(`${si}:${f}`);
        }
      });
    });
    return set;
  }, [quizTarget, strings, tuning, visibleFrets]);

  const allFound = useMemo(() => {
    if (mode !== 'quiz') return false;
    for (const key of quizCorrectSet) {
      if (!clicked.includes(key)) return false;
    }
    return quizCorrectSet.size > 0;
  }, [mode, quizCorrectSet, clicked]);

  useEffect(() => {
    if (mode === 'quiz') {
      setClicked([]);
    }
  }, [mode, startFret, maxFrets, quizTarget, tuning]);

  const startQuiz = () => {
    const randNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    setQuizTarget(randNote);
    setMode('quiz');
    setClicked([]);
  };

  const stopQuiz = () => {
    setMode('explore');
    setClicked([]);
  };

  const cellKey = (si: number, f: number) => `${si}:${f}`;
  const toggleClick = (si: number, f: number) => {
    const key = cellKey(si, f);
    setClicked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyPreset = (name: string) => {
    const preset = getTuningPreset(name);
    if (preset) {
      setTuning([...preset.pitchClasses]);
    }
  };

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(note)) {
        next.delete(note);
      } else {
        next.add(note);
      }
      return next;
    });
  };

  const updateNoteColor = (note: string, color: string) => {
    setNoteColors((prev) => ({
      ...prev,
      [note]: color,
    }));
  };

  const toggleAllNotations = () => {
    setNoteNotations((prev) => {
      const next = { ...prev };
      let sharpCount = 0;
      NOTES_WITH_ACCIDENTALS.forEach((note) => {
        if ((prev[note] || 'sharp') === 'sharp') {
          sharpCount++;
        }
      });
      const targetNotation =
        sharpCount > NOTES_WITH_ACCIDENTALS.length / 2 ? 'flat' : 'sharp';
      NOTES_WITH_ACCIDENTALS.forEach((note) => {
        next[note] = targetNotation;
      });
      return next;
    });
  };

  return (
    <div className="min-h-screen text-slate-900" style={{
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 25%, #fce7f3 50%, #ffe4e6 75%, #fff1e6 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>기타 지판 트레이너</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              모드:
              <span className="ml-2 inline-flex gap-1">
                <button
                  style={{
                    background: mode === 'explore'
                      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    color: mode === 'explore' ? '#ffffff' : '#475569',
                    boxShadow: mode === 'explore'
                      ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                  onClick={() => setMode('explore')}
                >
                  탐색
                </button>
                <button
                  style={{
                    background: mode === 'quiz'
                      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    color: mode === 'quiz' ? '#ffffff' : '#475569',
                    boxShadow: mode === 'quiz'
                      ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                  onClick={startQuiz}
                >
                  퀴즈
                </button>
              </span>
            </Chip>
            <Chip>
              프렛
              <span className="ml-2">
                <label className="mr-1 text-slate-600 text-xs">시작</label>
                <select
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                  }}
                  className="px-2 py-1 rounded-lg text-xs"
                  value={startFret}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStartFret(v);
                    setMaxFrets((prev) => Math.max(v, Math.min(22, prev)));
                  }}
                >
                  {Array.from({ length: 23 }, (_, i) => i).map((fret) => (
                    <option key={fret} value={fret}>
                      {fret}
                    </option>
                  ))}
                </select>
              </span>
              <span className="ml-2">
                <label className="mr-1 text-slate-600 text-xs">끝</label>
                <select
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                  }}
                  className="px-2 py-1 rounded-lg text-xs"
                  value={maxFrets}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxFrets(Math.max(startFret, v));
                  }}
                >
                  {Array.from({ length: 23 }, (_, i) => i)
                    .filter((fret) => fret >= startFret)
                    .map((fret) => (
                      <option key={fret} value={fret}>
                        {fret}
                      </option>
                    ))}
                </select>
              </span>
            </Chip>
            <Chip>
              조율
              <select
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
                className="ml-2 px-2 py-1 rounded-lg text-xs"
                onChange={(e) => applyPreset(e.target.value)}
              >
                <option>Standard (EADGBE)</option>
                <option>Drop D</option>
                <option>Open G</option>
                <option>Open D</option>
              </select>
            </Chip>
          </div>
        </header>

        {mode === 'quiz' && (
          <div className="flex flex-wrap items-center gap-3">
            <Chip>
              퀴즈 목표: <strong className="ml-2">{quizTarget}</strong>
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                className="ml-3 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={() =>
                  setQuizTarget(NOTES[(NOTE_TO_INDEX[quizTarget] + 1) % 12])
                }
              >
                다음 음
              </button>
            </Chip>
            <Chip
              style={allFound ? {
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              } : {}}
            >
              찾음 {clicked.filter((k) => quizCorrectSet.has(k)).length} /{' '}
              {quizCorrectSet.size}
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                className="ml-3 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={() => setClicked([])}
              >
                클릭 초기화
              </button>
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                className="ml-2 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={startQuiz}
              >
                새 퀴즈
              </button>
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                className="ml-2 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={stopQuiz}
              >
                중지
              </button>
            </Chip>
          </div>
        )}

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
          className="rounded-2xl p-4"
        >
          <FretboardCanvas
            startFret={startFret}
            visibleFrets={visibleFrets}
            stringsCount={6}
            mode={mode}
            quizTarget={quizTarget}
            tuning={tuning}
            clicked={clicked}
            onCellClick={toggleClick}
            selectedNotes={mode === 'explore' ? selectedNotes : undefined}
            noteColors={mode === 'explore' ? noteColors : undefined}
            noteNotations={noteNotations}
            notationMode={notationMode}
          />
        </div>

        {mode === 'explore' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            className="rounded-2xl p-4"
          >
            <div className="mb-3">
              <NoteToggle
                selectedNotes={selectedNotes}
                onToggle={toggleNote}
                noteColors={noteColors}
                onColorChange={updateNoteColor}
                noteNotations={noteNotations}
                onToggleAllNotations={toggleAllNotations}
                notationMode={notationMode}
                onNotationModeChange={setNotationMode}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Chip>
            빠른 범위
            <span className="ml-2 inline-flex gap-1">
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={() => {
                  setStartFret(0);
                  setMaxFrets(12);
                }}
              >
                0–12 프렛
              </button>
              <button
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
                  backdropFilter: 'blur(10px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                onClick={() => {
                  setStartFret(0);
                  setMaxFrets(22);
                }}
              >
                0–22 프렛
              </button>
            </span>
          </Chip>
          <Chip>
            작동 원리
            <span className="ml-2 text-xs">f = ((n − sᵢ) mod 12) + 12k</span>
          </Chip>
        </div>
      </div>
    </div>
  );
}
