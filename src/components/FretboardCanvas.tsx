import React from 'react';
import {
  NOTES,
  NOTE_TO_INDEX,
  NOTE_FLAT_NAMES,
  NOTE_DEGREE_NAMES,
  NOTE_DEGREE_FLAT_NAMES,
  isNoteWithAccidental,
} from '../constants/music';
import { FRETBOARD } from '../constants/fretboard';
import { getTextColor } from '../utils/color';
import { mod } from '../utils/math';

type FretboardCanvasProps = {
  startFret: number;
  visibleFrets: number[];
  stringsCount: number;
  mode?: 'explore' | 'quiz';
  quizTarget?: string;
  tuning?: number[];
  clicked?: string[];
  onCellClick?: (stringIndex: number, fret: number) => void;
  selectedNotes?: Set<string>;
  noteColors?: Record<string, string>;
  noteNotations?: Record<string, 'sharp' | 'flat'>;
  notationMode?: 'letter' | 'degree';
};

const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  startFret,
  visibleFrets,
  stringsCount,
  mode = 'explore',
  quizTarget = 'C',
  tuning = [4, 11, 7, 2, 9, 4],
  clicked = [],
  onCellClick,
  selectedNotes,
  noteColors,
  noteNotations,
  notationMode = 'letter',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = React.useState<{
    stringIndex: number;
    fret: number;
  } | null>(null);

  const getNoteDisplayName = (
    noteName: string,
    notationMode: 'letter' | 'degree',
    noteNotations?: Record<string, 'sharp' | 'flat'>
  ): string => {
    if (notationMode === 'degree') {
      if (noteNotations && isNoteWithAccidental(noteName)) {
        const notation = noteNotations[noteName] || 'sharp';
        return (
          (notation === 'flat'
            ? NOTE_DEGREE_FLAT_NAMES[noteName] || NOTE_DEGREE_NAMES[noteName]
            : NOTE_DEGREE_NAMES[noteName]) || noteName
        );
      } else {
        return NOTE_DEGREE_NAMES[noteName] || noteName;
      }
    } else {
      if (noteNotations && isNoteWithAccidental(noteName)) {
        const notation = noteNotations[noteName] || 'sharp';
        if (notation === 'flat') {
          return NOTE_FLAT_NAMES[noteName] || noteName;
        }
      }
      return noteName;
    }
  };

  const getNoteXPosition = (
    fretIndex: number,
    visibleFrets: number[],
    fretXs: number[],
    boardX: number,
    nutWidth: number
  ): number => {
    if (fretIndex === 0 && visibleFrets[0] === 0) {
      return boardX + nutWidth / 2;
    } else if (fretIndex === 1 && visibleFrets[0] === 0) {
      return boardX + nutWidth + (fretXs[1] - nutWidth) / 2;
    } else if (fretIndex === 0) {
      return boardX + fretXs[0] / 2;
    } else {
      return boardX + (fretXs[fretIndex - 1] + fretXs[fretIndex]) / 2;
    }
  };

  const drawLiquidGlassCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    noteColor: string,
    textColor: string,
    displayText: string,
    borderColor?: string,
    shadowColors?: { light: string; medium: string; dark: string },
    mainColors?: { light: string; medium: string; dark: string }
  ) => {
    const radius = FRETBOARD.NOTE_RADIUS;

    const shadowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius + 8);
    if (shadowColors) {
      shadowGradient.addColorStop(0, shadowColors.light);
      shadowGradient.addColorStop(0.5, shadowColors.medium);
      shadowGradient.addColorStop(1, shadowColors.dark);
    } else {
      shadowGradient.addColorStop(0, `${noteColor}40`);
      shadowGradient.addColorStop(0.5, `${noteColor}20`);
      shadowGradient.addColorStop(1, `${noteColor}00`);
    }
    ctx.beginPath();
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = shadowGradient;
    ctx.fill();

    const mainGradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    if (mainColors) {
      mainGradient.addColorStop(0, mainColors.light);
      mainGradient.addColorStop(0.5, mainColors.medium);
      mainGradient.addColorStop(1, mainColors.dark);
    } else {
      mainGradient.addColorStop(0, `${noteColor}CC`);
      mainGradient.addColorStop(0.5, `${noteColor}99`);
      mainGradient.addColorStop(1, `${noteColor}66`);
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = mainGradient;
    ctx.fill();

    const highlightGradient = ctx.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      0,
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = highlightGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor || `${noteColor}80`;
    ctx.lineWidth = borderColor ? 1.5 : 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = textColor;
    ctx.font =
      'bold 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, x, y);
    ctx.restore();
  };

  const getLayout = React.useCallback((): {
    boardX: number;
    boardY: number;
    boardW: number;
    boardH: number;
  } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width = Math.max(canvas.clientWidth, FRETBOARD.CANVAS_MIN_WIDTH);
    const height = FRETBOARD.CANVAS_HEIGHT;

    const marginLeft = FRETBOARD.MARGIN.LEFT;
    const marginRight = FRETBOARD.MARGIN.RIGHT;
    const marginTop = FRETBOARD.MARGIN.TOP;
    const marginBottom = FRETBOARD.MARGIN.BOTTOM;
    const boardX = marginLeft;
    const boardY = marginTop;
    const boardW = width - marginLeft - marginRight;
    const boardH = height - marginTop - marginBottom;

    return { boardX, boardY, boardW, boardH };
  }, []);

  const setupCanvas = React.useCallback((): {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    boardX: number;
    boardY: number;
    boardW: number;
    boardH: number;
  } | null => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(container.clientWidth, FRETBOARD.CANVAS_MIN_WIDTH);
    const height = FRETBOARD.CANVAS_HEIGHT;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const marginLeft = FRETBOARD.MARGIN.LEFT;
    const marginRight = FRETBOARD.MARGIN.RIGHT;
    const marginTop = FRETBOARD.MARGIN.TOP;
    const marginBottom = FRETBOARD.MARGIN.BOTTOM;
    const boardX = marginLeft;
    const boardY = marginTop;
    const boardW = width - marginLeft - marginRight;
    const boardH = height - marginTop - marginBottom;

    return { ctx, width, height, boardX, boardY, boardW, boardH };
  }, []);

  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boardX: number,
    boardY: number,
    boardW: number,
    boardH: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const g = ctx.createLinearGradient(0, boardY, 0, boardY + boardH);
    g.addColorStop(0, '#f8fafc');
    g.addColorStop(1, '#eef2f7');
    ctx.fillStyle = g;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, boardY, boardW, boardH);
  };

  const calculateStringYs = (
    boardY: number,
    boardH: number,
    stringsCount: number
  ): number[] => {
    const rows = stringsCount - 1;
    const stringYs: number[] = [];

    const stringPaddingTop = FRETBOARD.STRING_PADDING.TOP;
    const stringPaddingBottom = FRETBOARD.STRING_PADDING.BOTTOM;
    const stringAreaHeight = boardH - stringPaddingTop - stringPaddingBottom;
    const stringAreaStart = boardY + stringPaddingTop;

    for (let i = 0; i < stringsCount; i++) {
      const y = stringAreaStart + (i * stringAreaHeight) / rows;
      stringYs.push(y);
    }

    return stringYs;
  };

  const drawStrings = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardW: number,
    boardH: number,
    stringsCount: number,
    nutWidth: number = 0
  ): number[] => {
    const stringYs = calculateStringYs(boardY, boardH, stringsCount);

    for (let i = 0; i < stringsCount; i++) {
      const y = stringYs[i];

      const thickness =
        FRETBOARD.STRING_THICKNESS.MIN +
        (i / (stringsCount - 1)) *
          (FRETBOARD.STRING_THICKNESS.MAX - FRETBOARD.STRING_THICKNESS.MIN);

      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    return stringYs;
  };

  const calculateFretPositions = (
    boardW: number,
    startFret: number,
    visibleFrets: number[]
  ): { fretXs: number[]; nutWidth: number } => {
    const fretXs: number[] = [];
    const endFret = visibleFrets[visibleFrets.length - 1];
    const hasNut = startFret === 0 && visibleFrets.includes(0);
    const nutWidth = hasNut ? FRETBOARD.NUT_WIDTH : 0;
    const L = boardW - nutWidth;

    const absPos = (n: number) => L - L / Math.pow(2, n / 12);

    const xStartAbs = absPos(startFret);
    const xEndAbs = absPos(endFret);
    const denom = xEndAbs - xStartAbs || 1;
    const span = Math.max(1, endFret - startFret);

    const flatten = 0.35;

    for (let i = 0; i < visibleFrets.length; i++) {
      const fretNum = visibleFrets[i];

      if (fretNum === 0 && hasNut) {
        fretXs.push(0);
      } else {
        const tNon = (absPos(fretNum) - xStartAbs) / denom;
        const tLin = (fretNum - startFret) / span;
        const t = (1 - flatten) * tNon + flatten * tLin;

        const x = Math.min(1, Math.max(0, t)) * L + nutWidth;
        fretXs.push(x);
      }
    }

    return { fretXs, nutWidth };
  };

  const drawNut = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    nutWidth: number
  ) => {
    if (nutWidth === 0) return;

    const nutGradient = ctx.createLinearGradient(0, boardY, 0, boardY + boardH);
    nutGradient.addColorStop(0, '#d1d5db');
    nutGradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = nutGradient;
    ctx.fillRect(boardX, boardY, nutWidth, boardH);

    ctx.beginPath();
    ctx.moveTo(boardX + nutWidth, boardY);
    ctx.lineTo(boardX + nutWidth, boardY + boardH);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawFrets = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    startFret: number,
    visibleFrets: number[],
    fretXs: number[]
  ) => {
    for (let i = 0; i < visibleFrets.length; i++) {
      const fretNum = visibleFrets[i];
      if (fretNum === 0 && startFret === 0) continue;

      const x = boardX + fretXs[i];

      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);

      const isLast = i === visibleFrets.length - 1;

      if (isLast) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#9aa7b8';
        ctx.lineWidth = 1.5;
      }

      ctx.stroke();
    }
  };

  /**
   * 왼쪽 줄 번호 표시
   * 각 줄의 왼쪽에 1부터 시작하는 번호를 표시합니다.
   */
  const drawStringLabels = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    stringYs: number[]
  ) => {
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < stringYs.length; i++) {
      const label = `${i + 1}`;
      ctx.fillText(label, boardX - 8, stringYs[i]);
    }
  };

  const drawFretNumbers = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    visibleFrets: number[],
    fretXs: number[]
  ) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#64748b';

    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const nextFretNumber = visibleFrets[i + 1];
      const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2;
      ctx.fillText(String(nextFretNumber), x, boardY + boardH + 20);
    }
  };

  const drawInlays = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    visibleFrets: number[],
    fretXs: number[]
  ) => {
    const inlayFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
    const yInlay = boardY + boardH / 2;
    ctx.fillStyle = '#cbd5e1';

    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2;

      if (inlayFrets.has(spaceFretNumber)) {
        ctx.beginPath();
        ctx.arc(x, yInlay, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      if (spaceFretNumber === 12) {
        const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2;
        ctx.beginPath();
        ctx.arc(x - 6, yInlay, 4, 0, Math.PI * 2);
        ctx.arc(x + 6, yInlay, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  };

  const drawHoveredCell = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    stringYs: number[],
    visibleFrets: number[],
    fretXs: number[],
    nutWidth: number,
    hoveredCell: { stringIndex: number; fret: number } | null
  ) => {
    if (mode !== 'quiz' || !hoveredCell) return;

    const { stringIndex, fret } = hoveredCell;

    if (
      stringIndex < 0 ||
      stringIndex >= stringYs.length ||
      !visibleFrets.includes(fret)
    ) {
      return;
    }

    const fretIndex = visibleFrets.indexOf(fret);
    if (fretIndex === -1) return;

    let leftX: number;
    let rightX: number;
    let topY: number;
    let bottomY: number;

    if (fretIndex === 0 && visibleFrets[0] === 0) {
      leftX = boardX;
      rightX = boardX + nutWidth;
    } else if (fretIndex === 1 && visibleFrets[0] === 0) {
      leftX = boardX + nutWidth;
      rightX = boardX + fretXs[1];
    } else if (fretIndex === 0) {
      leftX = boardX;
      rightX = boardX + fretXs[0];
    } else {
      leftX = boardX + fretXs[fretIndex - 1];
      rightX = boardX + fretXs[fretIndex];
    }

    if (stringIndex === 0) {
      topY = boardY;
      bottomY =
        stringYs.length > 1 ? (stringYs[0] + stringYs[1]) / 2 : boardY + boardH;
    } else if (stringIndex === stringYs.length - 1) {
      topY = (stringYs[stringIndex - 1] + stringYs[stringIndex]) / 2;
      bottomY = boardY + boardH;
    } else {
      topY = (stringYs[stringIndex - 1] + stringYs[stringIndex]) / 2;
      bottomY = (stringYs[stringIndex] + stringYs[stringIndex + 1]) / 2;
    }

    ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
    ctx.fillRect(leftX, topY, rightX - leftX, bottomY - topY);
  };

  const drawExploreNotes = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    stringYs: number[],
    visibleFrets: number[],
    fretXs: number[],
    nutWidth: number
  ) => {
    if (mode !== 'explore' || !selectedNotes || selectedNotes.size === 0)
      return;

    const selectedNoteIndices = new Set<number>();
    selectedNotes.forEach((note) => {
      const index = NOTE_TO_INDEX[note];
      if (index !== undefined) {
        selectedNoteIndices.add(index);
      }
    });

    for (let si = 0; si < stringYs.length; si++) {
      const sPC = tuning[si];
      for (let i = 0; i < visibleFrets.length; i++) {
        const fret = visibleFrets[i];
        const notePC = mod(sPC + fret, 12);

        if (!selectedNoteIndices.has(notePC)) continue;

        const x = getNoteXPosition(i, visibleFrets, fretXs, boardX, nutWidth);
        const y = stringYs[si];
        const noteName = NOTES[notePC];
        const noteColor = noteColors?.[noteName] || '#94a3b8';
        const displayNoteName = getNoteDisplayName(
          noteName,
          notationMode,
          noteNotations
        );

        const textColor = getTextColor(noteColor);
        drawLiquidGlassCircle(
          ctx,
          x,
          y,
          noteColor,
          textColor,
          displayNoteName
        );
      }
    }
  };

  const drawQuizClicks = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    stringYs: number[],
    visibleFrets: number[],
    fretXs: number[],
    nutWidth: number
  ) => {
    if (mode !== 'quiz') return;

    const targetNoteIndex = NOTE_TO_INDEX[quizTarget];

    clicked.forEach((key) => {
      const [siStr, fStr] = key.split(':');
      const si = parseInt(siStr, 10);
      const f = parseInt(fStr, 10);

      if (si < 0 || si >= stringYs.length || !visibleFrets.includes(f)) return;

      const fretIndex = visibleFrets.indexOf(f);
      if (fretIndex === -1) return;

      const x = getNoteXPosition(
        fretIndex,
        visibleFrets,
        fretXs,
        boardX,
        nutWidth
      );
      const y = stringYs[si];

      const notePC = mod(tuning[si] + f, 12);
      const noteName = NOTES[notePC];
      const isCorrect = notePC === targetNoteIndex;
      const displayNoteName = getNoteDisplayName(
        noteName,
        notationMode,
        noteNotations
      );

      const baseColor = isCorrect
        ? 'rgba(16, 185, 129,'
        : 'rgba(239, 68, 68,';
      const borderColor = isCorrect
        ? 'rgba(5, 150, 105, 0.8)'
        : 'rgba(220, 38, 38, 0.8)';
      drawLiquidGlassCircle(
        ctx,
        x,
        y,
        baseColor,
        '#ffffff',
        displayNoteName,
        borderColor,
        {
          light: `${baseColor}0.4)`,
          medium: `${baseColor}0.2)`,
          dark: `${baseColor}0)`,
        },
        {
          light: `${baseColor}0.9)`,
          medium: `${baseColor}0.7)`,
          dark: `${baseColor}0.5)`,
        }
      );
    });
  };

  const getCellFromClick = (
    x: number,
    y: number,
    boardX: number,
    boardY: number,
    boardH: number,
    stringYs: number[],
    visibleFrets: number[],
    fretXs: number[],
    nutWidth: number
  ): { stringIndex: number; fret: number } | null => {
    if (y < boardY || y > boardY + boardH) return null;
    if (x < boardX) return null;

    let stringIndex: number | null = null;

    if (stringYs.length > 0) {
      const firstStringTop = boardY;
      const firstStringBottom =
        stringYs.length > 1 ? (stringYs[0] + stringYs[1]) / 2 : boardY + boardH;
      if (y >= firstStringTop && y < firstStringBottom) {
        stringIndex = 0;
      }
    }

    if (stringIndex === null) {
      for (let i = 1; i < stringYs.length - 1; i++) {
        const topY = (stringYs[i - 1] + stringYs[i]) / 2;
        const bottomY = (stringYs[i] + stringYs[i + 1]) / 2;
        if (y >= topY && y < bottomY) {
          stringIndex = i;
          break;
        }
      }
    }

    if (stringIndex === null && stringYs.length > 1) {
      const lastStringTop =
        (stringYs[stringYs.length - 2] + stringYs[stringYs.length - 1]) / 2;
      const lastStringBottom = boardY + boardH;
      if (y >= lastStringTop && y < lastStringBottom) {
        stringIndex = stringYs.length - 1;
      }
    }

    if (stringIndex === null) return null;

    const hasNut = visibleFrets.includes(0) && visibleFrets[0] === 0;

    if (hasNut && nutWidth > 0) {
      if (x >= boardX && x < boardX + nutWidth) {
        return { stringIndex, fret: 0 };
      }
    }

    if (hasNut && visibleFrets.length > 1) {
      const nutNextLeft = boardX + nutWidth;
      const nutNextRight = boardX + fretXs[1];
      if (x >= nutNextLeft && x < nutNextRight) {
        return { stringIndex, fret: visibleFrets[1] };
      }
    }

    if (!hasNut && visibleFrets.length > 0) {
      const firstFretLeft = boardX;
      const firstFretRight = boardX + fretXs[0];
      if (x >= firstFretLeft && x < firstFretRight) {
        return { stringIndex, fret: visibleFrets[0] };
      }
    }

    const startIndex = hasNut ? 2 : 1;
    for (let i = startIndex; i < visibleFrets.length; i++) {
      const leftX = boardX + fretXs[i - 1];
      const rightX = boardX + fretXs[i];
      if (x >= leftX && x < rightX) {
        return { stringIndex, fret: visibleFrets[i] };
      }
    }

    if (fretXs.length > 0) {
      const lastFretX = boardX + fretXs[fretXs.length - 1];
      if (x >= lastFretX) {
        const lastFret = visibleFrets[visibleFrets.length - 1];
        return { stringIndex, fret: lastFret };
      }
    }

    return null;
  };

  const draw = React.useCallback(() => {
    const setup = setupCanvas();
    if (!setup) return;

    const { ctx, width, height, boardX, boardY, boardW, boardH } = setup;

    drawBackground(ctx, width, height, boardX, boardY, boardW, boardH);

    const { fretXs, nutWidth } = calculateFretPositions(
      boardW,
      startFret,
      visibleFrets
    );

    drawNut(ctx, boardX, boardY, boardH, nutWidth);

    const stringYs = drawStrings(
      ctx,
      boardX,
      boardY,
      boardW,
      boardH,
      stringsCount,
      nutWidth
    );

    drawFrets(ctx, boardX, boardY, boardH, startFret, visibleFrets, fretXs);

    drawStringLabels(ctx, boardX, stringYs);

    drawFretNumbers(ctx, boardX, boardY, boardH, visibleFrets, fretXs);

    drawInlays(ctx, boardX, boardY, boardH, visibleFrets, fretXs);

    if (mode === 'explore') {
      drawExploreNotes(
        ctx,
        boardX,
        boardY,
        boardH,
        stringYs,
        visibleFrets,
        fretXs,
        nutWidth
      );
    }

    if (mode === 'quiz' && hoveredCell) {
      drawHoveredCell(
        ctx,
        boardX,
        boardY,
        boardH,
        stringYs,
        visibleFrets,
        fretXs,
        nutWidth,
        hoveredCell
      );
    }

    drawQuizClicks(
      ctx,
      boardX,
      boardY,
      boardH,
      stringYs,
      visibleFrets,
      fretXs,
      nutWidth
    );
  }, [
    visibleFrets,
    stringsCount,
    startFret,
    setupCanvas,
    mode,
    quizTarget,
    tuning,
    clicked,
    hoveredCell,
    selectedNotes,
    noteColors,
    noteNotations,
    notationMode,
  ]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  React.useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const handleCanvasMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'quiz') {
        setHoveredCell(null);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = getLayout();
      if (!layout) return;

      const { boardX, boardY, boardH, boardW } = layout;
      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { fretXs, nutWidth } = calculateFretPositions(
        boardW,
        startFret,
        visibleFrets
      );

      const stringYs = calculateStringYs(boardY, boardH, stringsCount);

      const cell = getCellFromClick(
        x,
        y,
        boardX,
        boardY,
        boardH,
        stringYs,
        visibleFrets,
        fretXs,
        nutWidth
      );

      if (
        !cell ||
        !hoveredCell ||
        cell.stringIndex !== hoveredCell.stringIndex ||
        cell.fret !== hoveredCell.fret
      ) {
        setHoveredCell(cell);
      }
    },
    [mode, getLayout, stringsCount, startFret, visibleFrets, hoveredCell]
  );

  const handleCanvasMouseLeave = React.useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleCanvasClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'quiz' || !onCellClick) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = getLayout();
      if (!layout) return;

      const { boardX, boardY, boardH, boardW } = layout;
      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { fretXs, nutWidth } = calculateFretPositions(
        boardW,
        startFret,
        visibleFrets
      );

      const stringYs = calculateStringYs(boardY, boardH, stringsCount);

      const cell = getCellFromClick(
        x,
        y,
        boardX,
        boardY,
        boardH,
        stringYs,
        visibleFrets,
        fretXs,
        nutWidth
      );

      if (cell) {
        onCellClick(cell.stringIndex, cell.fret);
      }
    },
    [mode, onCellClick, getLayout, stringsCount, startFret, visibleFrets]
  );

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ cursor: mode === 'quiz' ? 'pointer' : 'default' }}
      />
    </div>
  );
};

export default FretboardCanvas;
