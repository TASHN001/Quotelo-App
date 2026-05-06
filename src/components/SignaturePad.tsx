import { useRef, useEffect, useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

interface SignaturePadProps {
  onSave?: (dataUrl: string, setAsDefault: boolean, includeAutomatically: boolean) => void;
  initialSignature?: string;
  initialSetAsDefault?: boolean;
  initialIncludeAutomatically?: boolean;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSave,
  initialSignature,
  initialSetAsDefault = false,
  initialIncludeAutomatically = false,
  width,
  height
}: SignaturePadProps) {
  const { t } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 340, height: 200 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [setAsDefault, setSetAsDefault] = useState(initialSetAsDefault);
  const [includeAutomatically, setIncludeAutomatically] = useState(initialIncludeAutomatically);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedWidth = width || Math.min(containerWidth - 32, 340);
        const calculatedHeight = height || Math.round(calculatedWidth * 0.59);
        setDimensions({ width: calculatedWidth, height: calculatedHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature && history.length === 0) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        setIsEmpty(false);
        saveToHistory();
      };
      img.src = initialSignature;
    }
  }, [dimensions.width, dimensions.height, initialSignature]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataUrl);
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    setIsDrawing(true);
    setIsEmpty(false);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setHistory([]);
    setHistoryStep(-1);
  };

  const undo = () => {
    if (historyStep <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);

    if (newStep === -1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    } else {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        setIsEmpty(false);
      };
      img.src = history[newStep];
    }
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      setIsEmpty(false);
    };
    img.src = history[newStep];
  };

  const exportAsPngDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return null;

    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    const dataUrl = exportAsPngDataUrl();
    if (dataUrl && onSave) {
      onSave(dataUrl, setAsDefault, includeAutomatically);
    }
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border-2 border-gray-300 rounded-xl bg-white touch-none cursor-crosshair mx-auto"
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
      />

      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Undo2 className="w-4 h-4" strokeWidth={2} />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Redo2 className="w-4 h-4" strokeWidth={2} />
          Redo
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Save as default signature</div>
            <div className="text-xs text-gray-600">Use this signature for all future invoices</div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeAutomatically}
            onChange={(e) => setIncludeAutomatically(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Include signature automatically</div>
            <div className="text-xs text-gray-600">Add signature to all generated invoices</div>
          </div>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={isEmpty}
        className={`w-full ${ds.btnPrimary} py-3 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Save Signature
      </button>
    </div>
  );
}
