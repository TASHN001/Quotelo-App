import { ReactNode, useRef, useState, useEffect } from 'react';
import { Star, Lock, Check } from 'lucide-react';

interface TemplatePreviewCardProps {
  name: string;
  description: string;
  planTier: string;
  preview: ReactNode;
  onClick: () => void;
  isFavorite?: boolean;
  isDefault?: boolean;
  isComingSoon?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onSetDefault?: (e: React.MouseEvent) => void;
}

const INVOICE_WIDTH = 800;
const INVOICE_HEIGHT = 1100;

export function TemplatePreviewCard({
  name,
  description,
  planTier,
  preview,
  onClick,
  isFavorite = false,
  isDefault = false,
  isComingSoon = false,
  onFavoriteToggle,
  onSetDefault
}: TemplatePreviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newScale = containerWidth / INVOICE_WIDTH;
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledHeight = INVOICE_HEIGHT * scale;

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden relative">
      <button
        onClick={isComingSoon ? undefined : onClick}
        className={`w-full text-left ${isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={isComingSoon}
      >
        <div
          ref={containerRef}
          className="relative bg-gray-100 dark:bg-gray-700 overflow-hidden"
          style={{ height: scaledHeight }}
        >
          <div
            className="absolute top-0 left-0 bg-white shadow-sm origin-top-left"
            style={{
              width: INVOICE_WIDTH,
              height: INVOICE_HEIGHT,
              transform: `scale(${scale})`,
            }}
          >
            {preview}
          </div>

          {isComingSoon && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-12 h-12 text-white mx-auto mb-2" strokeWidth={2} />
                <p className="text-white font-bold text-xl">Coming Soon</p>
              </div>
            </div>
          )}

          {!isComingSoon && onFavoriteToggle && (
            <button
              onClick={onFavoriteToggle}
              className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
            >
              <Star
                className={`w-4 h-4 ${isFavorite ? 'fill-orange-500 text-orange-500' : 'text-gray-400'}`}
                strokeWidth={2}
              />
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
              {isDefault && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" strokeWidth={2} />
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {planTier === 'premium' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                  PREMIUM
                </span>
              )}
              {planTier === 'free' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  FREE
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>

          {!isComingSoon && !isDefault && onSetDefault && (
            <button
              onClick={onSetDefault}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold text-sm transition-colors"
            >
              Set as Default
            </button>
          )}
        </div>
      </button>
    </div>
  );
}
