import React from 'react';

type FretboardCanvasProps = {
  startFret: number;
  visibleFrets: number[];
  stringsCount: number;
};

const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  startFret,
  visibleFrets,
  stringsCount,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  /**
   * Canvas 크기 설정 및 고해상도 디스플레이 대응
   * Device Pixel Ratio를 고려하여 선명한 렌더링을 보장합니다.
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
   * 기타 줄(strings) 그리기
   * 각 줄의 Y 위치를 계산하고, 줄의 두께를 위에서 아래로 점진적으로 두껍게 그립니다.
   * @returns 각 줄의 Y 좌표 배열
   */
  const drawStrings = (
    ctx: CanvasRenderingContext2D,
    boardX: number,
    boardY: number,
    boardW: number,
    boardH: number,
    stringsCount: number
  ): number[] => {
    const rows = stringsCount - 1;
    const stringYs: number[] = [];

    for (let i = 0; i < stringsCount; i++) {
      // 각 줄의 Y 위치 계산 (균등하게 분배)
      const y = boardY + (i * boardH) / rows;
      stringYs.push(y);

      // 줄의 두께: 위쪽 줄은 얇고, 아래쪽 줄은 두껍게 (실제 기타처럼)
      // 0.8 ~ 2.2 사이의 두께
      const thickness = 0.8 + (i / (stringsCount - 1)) * 1.4;

      // 줄 그리기
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
   *
   * @param boardW 프렛보드 너비
   * @param startFret 시작 프렛 번호
   * @param visibleFrets 표시할 프렛 번호 배열
   * @returns 각 프렛의 X 좌표 배열
   */
  const calculateFretPositions = (
    boardW: number,
    startFret: number,
    visibleFrets: number[]
  ): number[] => {
    const fretXs: number[] = [];
    const endFret = visibleFrets[visibleFrets.length - 1];
    const L = boardW;

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

      // 비선형 위치 (음악적 비율 기반)
      const tNon = (absPos(fretNum) - xStartAbs) / denom;
      // 선형 위치 (균등 간격)
      const tLin = (fretNum - startFret) / span;
      // 두 위치를 혼합
      const t = (1 - flatten) * tNon + flatten * tLin;

      // 최종 X 좌표 계산 (0~1 사이로 클램핑)
      const x = Math.min(1, Math.max(0, t)) * boardW;
      fretXs.push(x);
    }

    return fretXs;
  };

  /**
   * 프렛(frets) 그리기
   * 계산된 프렛 위치에 수직선을 그립니다.
   * 넛(nut, 0번 프렛)은 더 두껍고 어둡게, 마지막 프렛은 약간 다르게 표시합니다.
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
      const x = boardX + fretXs[i];

      // 프렛 선 그리기
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);

      // 넛(nut, 0번 프렛)과 마지막 프렛은 다른 스타일 적용
      const isNut = i === 0 && startFret === 0;
      const isLast = i === visibleFrets.length - 1;

      if (isNut) {
        // 넛: 검은색, 두꺼운 선
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
      } else if (isLast) {
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
   * 메인 그리기 함수
   * 모든 요소를 순서대로 그립니다.
   */
  const draw = React.useCallback(() => {
    const setup = setupCanvas();
    if (!setup) return;

    const { ctx, width, height, boardX, boardY, boardW, boardH } = setup;

    // 1. 배경 그리기
    drawBackground(ctx, width, height, boardX, boardY, boardW, boardH);

    // 2. 줄 그리기 (Y 좌표 배열 반환)
    const stringYs = drawStrings(
      ctx,
      boardX,
      boardY,
      boardW,
      boardH,
      stringsCount
    );

    // 3. 프렛 위치 계산
    const fretXs = calculateFretPositions(boardW, startFret, visibleFrets);

    // 4. 프렛 그리기
    drawFrets(ctx, boardX, boardY, boardH, startFret, visibleFrets, fretXs);

    // 5. 왼쪽 줄 번호 표시
    drawStringLabels(ctx, boardX, stringYs);

    // 6. 하단 프렛 번호 표시
    drawFretNumbers(ctx, boardX, boardY, boardH, visibleFrets, fretXs);

    // 7. 하단 인레이 표시
    drawInlays(ctx, boardX, boardY, boardH, visibleFrets, fretXs);
  }, [visibleFrets, stringsCount, startFret, setupCanvas]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  React.useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FretboardCanvas;
