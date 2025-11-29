import React from 'react';
import { NOTES, NOTE_TO_INDEX } from '../constants/music';
import { mod } from '../utils/math';

type FretboardCanvasProps = {
  startFret: number;
  visibleFrets: number[];
  stringsCount: number;
  mode?: 'explore' | 'quiz';
  quizTarget?: string;
  tuning?: number[];
  clicked?: string[]; // "si:f" format
  onCellClick?: (stringIndex: number, fret: number) => void;
};

const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  startFret,
  visibleFrets,
  stringsCount,
  mode = 'explore',
  quizTarget = 'C',
  tuning = [4, 11, 7, 2, 9, 4], // E, B, G, D, A, E (1→6)
  clicked = [],
  onCellClick,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = React.useState<{
    stringIndex: number;
    fret: number;
  } | null>(null);

  /**
   * 레이아웃 정보만 계산 (캔버스를 건드리지 않음)
   * 이벤트 핸들러에서 좌표 계산용으로 사용
   */
  const getLayout = React.useCallback((): {
    boardX: number;
    boardY: number;
    boardW: number;
    boardH: number;
  } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width = Math.max(canvas.clientWidth, 720);
    const height = 260;

    // 프렛보드 영역의 마진 및 크기 계산
    const marginLeft = 48;
    const marginRight = 16;
    const marginTop = 28;
    const marginBottom = 32;
    const boardX = marginLeft;
    const boardY = marginTop;
    const boardW = width - marginLeft - marginRight;
    const boardH = height - marginTop - marginBottom;

    return { boardX, boardY, boardW, boardH };
  }, []);

  /**
   * Canvas 크기 설정 및 고해상도 디스플레이 대응
   * Device Pixel Ratio를 고려하여 선명한 렌더링을 보장합니다.
   * 실제 그리기 준비에서만 사용 (이벤트 핸들러에서는 사용하지 않음)
   */
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
    const width = Math.max(container.clientWidth, 720);
    const height = 260;

    // 고해상도 디스플레이를 위한 실제 픽셀 크기 설정
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    // CSS로 표시되는 크기 설정
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // DPR에 맞게 변환 행렬 설정
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 프렛보드 영역의 마진 및 크기 계산
    const marginLeft = 48;
    const marginRight = 16;
    const marginTop = 28;
    const marginBottom = 32;
    const boardX = marginLeft;
    const boardY = marginTop;
    const boardW = width - marginLeft - marginRight;
    const boardH = height - marginTop - marginBottom;

    return { ctx, width, height, boardX, boardY, boardW, boardH };
  }, []);

  /**
   * 배경 및 프렛보드 영역 그리기
   * 흰색 배경과 그라데이션이 적용된 프렛보드 영역을 그립니다.
   */
  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boardX: number,
    boardY: number,
    boardW: number,
    boardH: number
  ) => {
    // 전체 캔버스를 흰색으로 초기화
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 프렛보드 영역에 그라데이션 적용 (위에서 아래로 밝아짐)
    const g = ctx.createLinearGradient(0, boardY, 0, boardY + boardH);
    g.addColorStop(0, '#f8fafc'); // 상단: 밝은 회색
    g.addColorStop(1, '#eef2f7'); // 하단: 약간 더 밝은 회색
    ctx.fillStyle = g;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    // 프렛보드 영역 테두리
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, boardY, boardW, boardH);
  };

  /**
   * 줄의 Y 위치만 계산 (그리지 않음)
   */
  const calculateStringYs = (
    boardY: number,
    boardH: number,
    stringsCount: number
  ): number[] => {
    const rows = stringsCount - 1;
    const stringYs: number[] = [];

    // 실제 기타처럼 줄 위아래에 여백 추가
    const stringPaddingTop = 12; // 1번 줄 위 여백
    const stringPaddingBottom = 12; // 6번 줄 아래 여백
    const stringAreaHeight = boardH - stringPaddingTop - stringPaddingBottom;
    const stringAreaStart = boardY + stringPaddingTop;

    for (let i = 0; i < stringsCount; i++) {
      // 각 줄의 Y 위치 계산 (여백을 고려하여 균등하게 분배)
      const y = stringAreaStart + (i * stringAreaHeight) / rows;
      stringYs.push(y);
    }

    return stringYs;
  };

  /**
   * 기타 줄(strings) 그리기
   * 각 줄의 Y 위치를 계산하고, 줄의 두께를 위에서 아래로 점진적으로 두껍게 그립니다.
   * 실제 기타처럼 1번 줄 위와 6번 줄 아래에 여백을 둡니다.
   * 줄은 넛 위로 지나가도록 그립니다.
   * @returns 각 줄의 Y 좌표 배열
   */
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

      // 줄의 두께: 위쪽 줄은 얇고, 아래쪽 줄은 두껍게 (실제 기타처럼)
      // 0.8 ~ 2.2 사이의 두께
      const thickness = 0.8 + (i / (stringsCount - 1)) * 1.4;

      // 줄 그리기 (넛 위로 지나가도록 전체 너비로 그리기)
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.strokeStyle = '#94a3b8'; // 회색
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round'; // 둥근 끝
      ctx.stroke();
    }

    return stringYs;
  };

  /**
   * 프렛 위치 계산
   * 기타 프렛은 음악적 비율(12평균율)에 따라 간격이 좁아지지만,
   * 시각적 가독성을 위해 선형 간격과 혼합(blend)하여 계산합니다.
   * 넛(0번 프렛)이 있을 경우 넛 영역의 너비를 고려합니다.
   *
   * @param boardW 프렛보드 너비
   * @param startFret 시작 프렛 번호
   * @param visibleFrets 표시할 프렛 번호 배열
   * @returns 각 프렛의 X 좌표 배열과 넛 너비
   */
  const calculateFretPositions = (
    boardW: number,
    startFret: number,
    visibleFrets: number[]
  ): { fretXs: number[]; nutWidth: number } => {
    const fretXs: number[] = [];
    const endFret = visibleFrets[visibleFrets.length - 1];
    const hasNut = startFret === 0 && visibleFrets.includes(0);
    const nutWidth = hasNut ? 32 : 0; // 넛 너비 (0번 프렛이 있을 때만)
    const L = boardW - nutWidth; // 넛 너비를 제외한 실제 프렛보드 너비

    // 12평균율에 따른 이론적 프렛 위치 계산 함수
    // n번 프렛의 위치 = L - L / 2^(n/12)
    // 프렛이 높아질수록 간격이 좁아지는 실제 기타의 물리적 특성 반영
    const absPos = (n: number) => L - L / Math.pow(2, n / 12);

    // 시작 및 끝 프렛의 이론적 위치
    const xStartAbs = absPos(startFret);
    const xEndAbs = absPos(endFret);
    const denom = xEndAbs - xStartAbs || 1;
    const span = Math.max(1, endFret - startFret);

    // 혼합 비율: 0.35는 선형, 0.65는 비선형(음악적 비율)
    // 이렇게 하면 너무 좁아지는 것을 방지하면서도 자연스러운 느낌 유지
    const flatten = 0.35;

    for (let i = 0; i < visibleFrets.length; i++) {
      const fretNum = visibleFrets[i];

      if (fretNum === 0 && hasNut) {
        // 0번 프렛(넛)은 왼쪽 끝에 위치
        fretXs.push(0);
      } else {
        // 비선형 위치 (음악적 비율 기반)
        const tNon = (absPos(fretNum) - xStartAbs) / denom;
        // 선형 위치 (균등 간격)
        const tLin = (fretNum - startFret) / span;
        // 두 위치를 혼합
        const t = (1 - flatten) * tNon + flatten * tLin;

        // 최종 X 좌표 계산 (넛 너비를 더함)
        const x = Math.min(1, Math.max(0, t)) * L + nutWidth;
        fretXs.push(x);
      }
    }

    return { fretXs, nutWidth };
  };

  /**
   * 넛(nut) 그리기
   * 0번 프렛이 있을 때 넓은 넛 영역을 그립니다.
   */
  const drawNut = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    nutWidth: number
  ) => {
    if (nutWidth === 0) return;

    // 넛 영역 그리기 (검은색 사각형)
    ctx.fillStyle = '#0f172a'; // 검은색
    ctx.fillRect(boardX, boardY, nutWidth, boardH);

    // 넛 오른쪽 경계선 (프렛처럼)
    ctx.beginPath();
    ctx.moveTo(boardX + nutWidth, boardY);
    ctx.lineTo(boardX + nutWidth, boardY + boardH);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  /**
   * 프렛(frets) 그리기
   * 계산된 프렛 위치에 수직선을 그립니다.
   * 넛(nut, 0번 프렛)은 별도로 그리므로 여기서는 제외합니다.
   */
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
      // 넛(0번 프렛)은 별도로 그리므로 건너뛰기
      if (fretNum === 0 && startFret === 0) continue;

      const x = boardX + fretXs[i];

      // 프렛 선 그리기
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);

      // 마지막 프렛은 다른 스타일 적용
      const isLast = i === visibleFrets.length - 1;

      if (isLast) {
        // 마지막 프렛: 연한 회색
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
      } else {
        // 일반 프렛: 중간 회색
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
    ctx.fillStyle = '#0f172a'; // 검은색
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'right'; // 오른쪽 정렬 (줄 번호가 왼쪽에 표시되므로)
    ctx.textBaseline = 'middle'; // 수직 중앙 정렬

    for (let i = 0; i < stringYs.length; i++) {
      const label = `${i + 1}`;
      ctx.fillText(label, boardX - 8, stringYs[i]);
    }
  };

  /**
   * 하단 프렛 번호 표시
   * 두 프렛 사이의 중앙 하단에 다음 프렛 번호를 표시합니다.
   * 예: 0번 프렛과 1번 프렛 사이에 1, 1번 프렛과 2번 프렛 사이에 2
   */
  const drawFretNumbers = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    visibleFrets: number[],
    fretXs: number[]
  ) => {
    ctx.textAlign = 'center'; // 중앙 정렬
    ctx.textBaseline = 'alphabetic'; // 텍스트 기준선
    ctx.fillStyle = '#64748b'; // 회색

    // 두 프렛 사이의 중앙 하단에 다음 프렛 번호 표시
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const nextFretNumber = visibleFrets[i + 1]; // 다음 프렛 번호
      // 두 프렛 사이의 중앙 X 좌표
      const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2;
      ctx.fillText(String(nextFretNumber), x, boardY + boardH + 12);
    }
  };

  /**
   * 포지션 마크(inlay) 표시
   * 기타 프렛보드의 전통적인 인레이 위치(3, 5, 7, 9, 12, 15, 17, 19, 21번 프렛)에
   * 원형 마커를 핑거보드 내부 중앙에 그립니다. 12번 프렛은 특별히 두 개의 원으로 표시됩니다.
   */
  const drawInlays = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardH: number,
    visibleFrets: number[],
    fretXs: number[]
  ) => {
    // 인레이가 표시되는 프렛 번호들
    const inlayFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
    const yInlay = boardY + boardH / 2; // 핑거보드 내부 중앙
    ctx.fillStyle = '#cbd5e1'; // 연한 회색

    // 일반 인레이: 단일 원
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2; // 두 프렛 사이의 중앙

      if (inlayFrets.has(spaceFretNumber)) {
        ctx.beginPath();
        ctx.arc(x, yInlay, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 12번 프렛: 특별히 두 개의 원으로 표시 (옥타브 표시)
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      if (spaceFretNumber === 12) {
        const x = boardX + (fretXs[i] + fretXs[i + 1]) / 2; // 두 프렛 사이의 중앙
        ctx.beginPath();
        ctx.arc(x - 6, yInlay, 4, 0, Math.PI * 2); // 왼쪽 원
        ctx.arc(x + 6, yInlay, 4, 0, Math.PI * 2); // 오른쪽 원
        ctx.fill();
        break;
      }
    }
  };

  /**
   * 퀴즈 모드에서 hover된 셀 영역을 형광색으로 표시
   */
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

    // hover된 셀의 영역 계산
    let leftX: number;
    let rightX: number;
    let topY: number;
    let bottomY: number;

    // 프렛 구간의 X 좌표 계산
    if (fretIndex === 0 && visibleFrets[0] === 0) {
      // 넛 영역
      leftX = boardX;
      rightX = boardX + nutWidth;
    } else if (fretIndex === 1 && visibleFrets[0] === 0) {
      // 넛 다음 프렛
      leftX = boardX + nutWidth;
      rightX = boardX + fretXs[1];
    } else if (fretIndex === 0) {
      // 첫 번째 프렛 (넛이 없는 경우)
      leftX = boardX;
      rightX = boardX + fretXs[0];
    } else {
      // 일반 프렛
      leftX = boardX + fretXs[fretIndex - 1];
      rightX = boardX + fretXs[fretIndex];
    }

    // 줄 구간의 Y 좌표 계산
    if (stringIndex === 0) {
      // 첫 번째 줄
      topY = boardY;
      bottomY =
        stringYs.length > 1 ? (stringYs[0] + stringYs[1]) / 2 : boardY + boardH;
    } else if (stringIndex === stringYs.length - 1) {
      // 마지막 줄
      topY = (stringYs[stringIndex - 1] + stringYs[stringIndex]) / 2;
      bottomY = boardY + boardH;
    } else {
      // 중간 줄
      topY = (stringYs[stringIndex - 1] + stringYs[stringIndex]) / 2;
      bottomY = (stringYs[stringIndex] + stringYs[stringIndex + 1]) / 2;
    }

    // 형광색으로 영역 그리기
    ctx.fillStyle = 'rgba(255, 255, 0, 0.25)'; // 옅은 노란 형광색
    ctx.fillRect(leftX, topY, rightX - leftX, bottomY - topY);
  };

  /**
   * 퀴즈 모드에서 클릭한 위치에 원과 음 표시
   * 정답: 초록색 원, 오답: 빨간색 원
   */
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

    // 각 클릭한 위치에 대해 원 그리기
    clicked.forEach((key) => {
      const [siStr, fStr] = key.split(':');
      const si = parseInt(siStr, 10);
      const f = parseInt(fStr, 10);

      if (si < 0 || si >= stringYs.length || !visibleFrets.includes(f)) return;

      // 프렛 위치 찾기
      const fretIndex = visibleFrets.indexOf(f);
      if (fretIndex === -1) return;

      // 두 프렛 사이의 중앙 위치 계산
      let x: number;
      if (fretIndex === 0 && visibleFrets[0] === 0) {
        // 0번 프렛(넛)의 경우, 넛 영역의 중앙
        x = boardX + nutWidth / 2;
      } else if (fretIndex === 1 && visibleFrets[0] === 0) {
        // 넛 다음 프렛의 경우, 넛 오른쪽 끝과 다음 프렛 사이의 중앙
        x = boardX + nutWidth + (fretXs[1] - nutWidth) / 2;
      } else if (fretIndex === 0) {
        // 첫 번째 프렛이 0번이 아닌 경우
        x = boardX + fretXs[0] / 2;
      } else {
        // 이전 프렛과 현재 프렛 사이의 중앙
        x = boardX + (fretXs[fretIndex - 1] + fretXs[fretIndex]) / 2;
      }

      const y = stringYs[si];

      // 클릭한 위치의 음 계산
      const notePC = mod(tuning[si] + f, 12);
      const noteName = NOTES[notePC];
      const isCorrect = notePC === targetNoteIndex;

      // 원 그리기
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = isCorrect ? '#10b981' : '#ef4444'; // 초록색 또는 빨간색
      ctx.fill();

      // 원 테두리
      ctx.strokeStyle = isCorrect ? '#059669' : '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 음 이름 표시
      ctx.fillStyle = '#ffffff'; // 흰색 텍스트
      ctx.font =
        'bold 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(noteName, x, y);
    });
  };

  /**
   * 클릭 위치를 string index와 fret number로 변환
   * hover 영역 계산 로직과 동일하게 구현
   */
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
    // 프렛보드 영역 내부인지 확인
    if (y < boardY || y > boardY + boardH) return null;
    if (x < boardX) return null;

    // 줄 구간 찾기 (hover 영역 계산과 동일한 로직)
    let stringIndex: number | null = null;

    // 첫 번째 줄 영역 확인
    if (stringYs.length > 0) {
      const firstStringTop = boardY;
      const firstStringBottom =
        stringYs.length > 1 ? (stringYs[0] + stringYs[1]) / 2 : boardY + boardH;
      if (y >= firstStringTop && y < firstStringBottom) {
        stringIndex = 0;
      }
    }

    // 중간 줄 영역 확인
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

    // 마지막 줄 영역 확인
    if (stringIndex === null && stringYs.length > 1) {
      const lastStringTop =
        (stringYs[stringYs.length - 2] + stringYs[stringYs.length - 1]) / 2;
      const lastStringBottom = boardY + boardH;
      if (y >= lastStringTop && y < lastStringBottom) {
        stringIndex = stringYs.length - 1;
      }
    }

    if (stringIndex === null) return null;

    // 프렛 구간 찾기 (hover 영역 계산과 동일한 로직)
    const hasNut = visibleFrets.includes(0) && visibleFrets[0] === 0;

    // 넛 영역 확인
    if (hasNut && nutWidth > 0) {
      if (x >= boardX && x < boardX + nutWidth) {
        return { stringIndex, fret: 0 };
      }
    }

    // 넛 다음 프렛 확인
    if (hasNut && visibleFrets.length > 1) {
      const nutNextLeft = boardX + nutWidth;
      const nutNextRight = boardX + fretXs[1];
      if (x >= nutNextLeft && x < nutNextRight) {
        return { stringIndex, fret: visibleFrets[1] };
      }
    }

    // 첫 번째 프렛 (넛이 없는 경우)
    if (!hasNut && visibleFrets.length > 0) {
      const firstFretLeft = boardX;
      const firstFretRight = boardX + fretXs[0];
      if (x >= firstFretLeft && x < firstFretRight) {
        return { stringIndex, fret: visibleFrets[0] };
      }
    }

    // 일반 프렛 구간 확인
    const startIndex = hasNut ? 2 : 1; // 넛이 있으면 2번째 프렛부터, 없으면 1번째 프렛부터
    for (let i = startIndex; i < visibleFrets.length; i++) {
      const leftX = boardX + fretXs[i - 1];
      const rightX = boardX + fretXs[i];
      if (x >= leftX && x < rightX) {
        return { stringIndex, fret: visibleFrets[i] };
      }
    }

    // 마지막 프렛 이후 영역
    if (fretXs.length > 0) {
      const lastFretX = boardX + fretXs[fretXs.length - 1];
      if (x >= lastFretX) {
        const lastFret = visibleFrets[visibleFrets.length - 1];
        return { stringIndex, fret: lastFret };
      }
    }

    return null;
  };

  /**
   * 메인 그리기 함수
   * 모든 요소를 순서대로 그립니다.
   */
  const draw = React.useCallback(() => {
    const setup = setupCanvas();
    if (!setup) return;

    const { ctx, width, height, boardX, boardY, boardW, boardH } = setup;

    // 1. 배경 그리기
    drawBackground(ctx, width, height, boardX, boardY, boardW, boardH);

    // 2. 프렛 위치 계산 (넛 너비 포함)
    const { fretXs, nutWidth } = calculateFretPositions(
      boardW,
      startFret,
      visibleFrets
    );

    // 3. 넛 그리기 (줄보다 먼저 그려서 배경 역할)
    drawNut(ctx, boardX, boardY, boardH, nutWidth);

    // 4. 줄 그리기 (넛 위로 지나가도록, Y 좌표 배열 반환)
    const stringYs = drawStrings(
      ctx,
      boardX,
      boardY,
      boardW,
      boardH,
      stringsCount,
      nutWidth
    );

    // 5. 프렛 그리기
    drawFrets(ctx, boardX, boardY, boardH, startFret, visibleFrets, fretXs);

    // 6. 왼쪽 줄 번호 표시
    drawStringLabels(ctx, boardX, stringYs);

    // 7. 하단 프렛 번호 표시
    drawFretNumbers(ctx, boardX, boardY, boardH, visibleFrets, fretXs);

    // 8. 하단 인레이 표시
    drawInlays(ctx, boardX, boardY, boardH, visibleFrets, fretXs);

    // 9. 퀴즈 모드 hover 영역 표시
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

    // 10. 퀴즈 모드 클릭 표시
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
    hoveredCell, // hoveredCell을 다시 추가하되, requestAnimationFrame으로 최적화
  ]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  React.useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // 마우스 이동 이벤트 핸들러 (hover 처리)
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

      // 클릭 좌표를 논리적 좌표로 변환
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 프렛 위치 계산 (넛 너비 포함)
      const { fretXs, nutWidth } = calculateFretPositions(
        boardW,
        startFret,
        visibleFrets
      );

      // 줄 위치 계산 (그리지 않음)
      const stringYs = calculateStringYs(boardY, boardH, stringsCount);

      // hover된 셀 찾기
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

      // 셀이 변경된 경우에만 상태 업데이트
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

  // 마우스가 캔버스를 벗어날 때 hover 초기화
  const handleCanvasMouseLeave = React.useCallback(() => {
    setHoveredCell(null);
  }, []);

  // 클릭 이벤트 핸들러
  const handleCanvasClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'quiz' || !onCellClick) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = getLayout();
      if (!layout) return;

      const { boardX, boardY, boardH, boardW } = layout;
      const rect = canvas.getBoundingClientRect();

      // 클릭 좌표를 논리적 좌표로 변환
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 프렛 위치 계산 (넛 너비 포함)
      const { fretXs, nutWidth } = calculateFretPositions(
        boardW,
        startFret,
        visibleFrets
      );

      // 줄 위치 계산 (그리지 않음)
      const stringYs = calculateStringYs(boardY, boardH, stringsCount);

      // 클릭한 셀 찾기
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
