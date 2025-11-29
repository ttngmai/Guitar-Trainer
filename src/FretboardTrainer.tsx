import React, { useMemo, useState, useEffect } from 'react';
import FretboardCanvas from './components/FretboardCanvas';
import {
  NOTES,
  NOTE_TO_INDEX,
  STD_TUNING_PC,
  STD_TUNING_LABELS,
} from './constants/music';
import { mod } from './utils/math';

// --- UI helpers --------------------------------------------------------------
const Chip: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-2 py-1 rounded-full text-xs font-medium shadow ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Canvas 컴포넌트는 분리되어 components/FretboardCanvas.tsx에 있습니다.

// --- Main Component ----------------------------------------------------------
export default function FretboardTrainer() {
  const [maxFrets, setMaxFrets] = useState(12); // show 0..12 by default
  const [startFret, setStartFret] = useState(0);
  const [targetNote, setTargetNote] = useState<string>('C');
  const [tuning, setTuning] = useState<number[]>(STD_TUNING_PC);
  const [tuningLabels, setTuningLabels] = useState<string[]>(STD_TUNING_LABELS);
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [quizTarget, setQuizTarget] = useState<string>('C');
  const [clicked, setClicked] = useState<string[]>([]); // "i:f" keys

  // Derived
  const visibleFrets = useMemo(
    () =>
      Array.from({ length: maxFrets - startFret + 1 }, (_, i) => i + startFret),
    [maxFrets, startFret]
  );
  const strings = useMemo(() => [5, 4, 3, 2, 1, 0], []); // index 0 = string 1 (high E), 5 = string 6 (low E)

  // For quiz mode
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
    // require at least one to avoid trivial empty-set case
    return quizCorrectSet.size > 0;
  }, [mode, quizCorrectSet, clicked]);

  useEffect(() => {
    if (mode === 'quiz') {
      // reset clicks when view changes
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

  // Position helpers
  const isTargetPC = (si: number, f: number, note: string) =>
    mod(tuning[si] + f, 12) === NOTE_TO_INDEX[note];

  const cellKey = (si: number, f: number) => `${si}:${f}`;
  const toggleClick = (si: number, f: number) => {
    const key = cellKey(si, f);
    setClicked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyPreset = (name: string) => {
    switch (name) {
      case 'Standard (EADGBE)':
        setTuning([...STD_TUNING_PC]);
        setTuningLabels([...STD_TUNING_LABELS]);
        break;
      case 'Drop D': // DADGBE
        setTuning([2, 9, 2, 7, 11, 4]);
        setTuningLabels(['D', 'A', 'D', 'G', 'B', 'E']);
        break;
      case 'Open G': // D G D G B D → pitch classes [2,7,2,7,11,2]
        setTuning([2, 7, 2, 7, 11, 2]);
        setTuningLabels(['D', 'G', 'D', 'G', 'B', 'D']);
        break;
      case 'Open D': // D A D F# A D → [2,9,2,6,9,2]
        setTuning([2, 9, 2, 6, 9, 2]);
        setTuningLabels(['D', 'A', 'D', 'F#', 'A', 'D']);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">🎸 기타 지판 트레이너</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Chip className="bg-white">
              모드:
              <span className="ml-2 inline-flex gap-1">
                <button
                  className={`px-2 py-0.5 rounded ${
                    mode === 'explore' ? 'bg-black text-white' : 'bg-slate-100'
                  }`}
                  onClick={() => setMode('explore')}
                >
                  탐색
                </button>
                <button
                  className={`px-2 py-0.5 rounded ${
                    mode === 'quiz' ? 'bg-black text-white' : 'bg-slate-100'
                  }`}
                  onClick={startQuiz}
                >
                  퀴즈
                </button>
              </span>
            </Chip>
            <Chip className="bg-white">
              프렛
              <span className="ml-2">
                <label className="mr-1 text-slate-500">시작</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border rounded"
                  value={startFret}
                  min={0}
                  max={24}
                  onChange={(e) => {
                    const raw = Number(e.target.value) || 0;
                    const v = Math.max(0, Math.min(24, raw));
                    setStartFret(v);
                    setMaxFrets((prev) => Math.max(v, Math.min(24, prev)));
                  }}
                />
              </span>
              <span className="ml-2">
                <label className="mr-1 text-slate-500">끝</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border rounded"
                  value={maxFrets}
                  min={0}
                  max={24}
                  onChange={(e) => {
                    const raw = Number(e.target.value) || 12;
                    const v = Math.max(0, Math.min(24, raw));
                    setMaxFrets(Math.max(startFret, v));
                  }}
                />
              </span>
            </Chip>
            <Chip className="bg-white">
              조율
              <select
                className="ml-2 px-2 py-1 border rounded"
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

        {mode === 'explore' ? (
          <div className="flex flex-wrap items-center gap-3">
            <Chip className="bg-white">
              목표 음
              <select
                className="ml-2 px-2 py-1 border rounded"
                value={targetNote}
                onChange={(e) => setTargetNote(e.target.value)}
              >
                {NOTES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Chip>
            <Chip className="bg-white">
              범례
              <span className="ml-2">🎯 = 목표</span>
            </Chip>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Chip className="bg-white">
              퀴즈 목표: <strong className="ml-2">{quizTarget}</strong>
              <button
                className="ml-3 px-2 py-1 rounded bg-slate-900 text-white"
                onClick={() =>
                  setQuizTarget(NOTES[(NOTE_TO_INDEX[quizTarget] + 1) % 12])
                }
              >
                다음 음
              </button>
            </Chip>
            <Chip
              className={`bg-white ${
                allFound ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              찾음 {clicked.filter((k) => quizCorrectSet.has(k)).length} /{' '}
              {quizCorrectSet.size}
              <button
                className="ml-3 px-2 py-1 rounded bg-slate-100"
                onClick={() => setClicked([])}
              >
                클릭 초기화
              </button>
              <button
                className="ml-2 px-2 py-1 rounded bg-slate-100"
                onClick={startQuiz}
              >
                새 퀴즈
              </button>
              <button
                className="ml-2 px-2 py-1 rounded bg-slate-900 text-white"
                onClick={stopQuiz}
              >
                중지
              </button>
            </Chip>
          </div>
        )}

        {/* Fretboard (Canvas) */}
        <div className="bg-white rounded-2xl shadow p-4">
          <FretboardCanvas
            startFret={startFret}
            visibleFrets={visibleFrets}
            stringsCount={6}
          />
          <div className="mt-4 text-xs text-slate-500">
            <p>
              공식: p ≡ sᵢ + f (mod 12). 상단은 프렛 번호, 좌측은 줄 번호(1→6),
              하단은 포지션 마크를 캔버스로 렌더링합니다.
            </p>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip className="bg-white">
            빠른 범위
            <span className="ml-2 inline-flex gap-1">
              <button
                className="px-2 py-1 rounded bg-slate-100"
                onClick={() => {
                  setStartFret(0);
                  setMaxFrets(12);
                }}
              >
                0–12
              </button>
              <button
                className="px-2 py-1 rounded bg-slate-100"
                onClick={() => {
                  setStartFret(5);
                  setMaxFrets(9);
                }}
              >
                5–9
              </button>
              <button
                className="px-2 py-1 rounded bg-slate-100"
                onClick={() => {
                  setStartFret(12);
                  setMaxFrets(17);
                }}
              >
                12–17
              </button>
            </span>
          </Chip>
          <Chip className="bg-white">
            작동 원리
            <span className="ml-2">f = ((n − sᵢ) mod 12) + 12k</span>
          </Chip>
        </div>
      </div>
    </div>
  );
}
