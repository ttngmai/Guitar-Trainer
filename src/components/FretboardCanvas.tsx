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

  const draw = React.useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(container.clientWidth, 720);
    const height = 260;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const marginLeft = 48;
    const marginRight = 16;
    const marginTop = 28;
    const marginBottom = 32;
    const boardX = marginLeft;
    const boardY = marginTop;
    const boardW = width - marginLeft - marginRight;
    const boardH = height - marginTop - marginBottom;

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

    const rows = stringsCount - 1;
    const stringYs: number[] = [];
    for (let i = 0; i < stringsCount; i++) {
      const y = boardY + (i * boardH) / rows;
      stringYs.push(y);
      const thickness = 0.8 + (i / (stringsCount - 1)) * 1.4;
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Frets: blended spacing
    const fretXs: number[] = [];
    const endFret = visibleFrets[visibleFrets.length - 1];
    const L = boardW;
    const absPos = (n: number) => L - L / Math.pow(2, n / 12);
    const xStartAbs = absPos(startFret);
    const xEndAbs = absPos(endFret);
    const denom = xEndAbs - xStartAbs || 1;
    const span = Math.max(1, endFret - startFret);
    const flatten = 0.35;
    for (let i = 0; i < visibleFrets.length; i++) {
      const fretNum = visibleFrets[i];
      const tNon = (absPos(fretNum) - xStartAbs) / denom;
      const tLin = (fretNum - startFret) / span;
      const t = (1 - flatten) * tNon + flatten * tLin;
      const x = boardX + Math.min(1, Math.max(0, t)) * boardW;
      fretXs.push(x);
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);
      const isNut = i === 0 && startFret === 0;
      const isLast = i === visibleFrets.length - 1;
      ctx.strokeStyle = isNut ? '#0f172a' : isLast ? '#94a3b8' : '#9aa7b8';
      ctx.lineWidth = isNut ? 4 : 1.5;
      ctx.stroke();
    }

    // Left string numbers
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < stringsCount; i++) {
      const label = `${i + 1}`;
      ctx.fillText(label, boardX - 8, stringYs[i]);
    }

    // Top fret numbers, bottom inlays
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      const x = (fretXs[i] + fretXs[i + 1]) / 2;
      ctx.fillText(String(spaceFretNumber), x, boardY - 8);
    }

    const inlayFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
    const yInlay = boardY + boardH + 12;
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      const x = (fretXs[i] + fretXs[i + 1]) / 2;
      if (inlayFrets.has(spaceFretNumber)) {
        ctx.beginPath();
        ctx.arc(x, yInlay, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < visibleFrets.length - 1; i++) {
      const spaceFretNumber = visibleFrets[i + 1];
      if (spaceFretNumber === 12) {
        const x = (fretXs[i] + fretXs[i + 1]) / 2;
        ctx.beginPath();
        ctx.arc(x - 6, yInlay, 4, 0, Math.PI * 2);
        ctx.arc(x + 6, yInlay, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }, [visibleFrets, stringsCount, startFret]);

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


