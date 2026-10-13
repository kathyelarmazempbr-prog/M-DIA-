import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { formatDateTimeBR } from '../../utils/exportUtils';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  timestamp?: string; // Data e horário em que a foto foi registrada
  metadataInfo?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  title = 'Comprovante / Foto do Painel',
  timestamp,
  metadataInfo,
  onClose,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialScaleOnTouchRef = useRef<number>(1);

  // Reseta o zoom e a posição sempre que a imagem ou modal abrir/fechar
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [imageUrl]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (imageUrl === null) return null;

  const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom via roda do mouse (scroll)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(Math.max(1, prev + zoomFactor), 5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return Number(next.toFixed(2));
    });
  };

  // Arrastar com o mouse quando houver zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Duplo clique: alterna entre 1x e 2.5x
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Suporte a gestos touch (pinça e arraste em celulares)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialScaleOnTouchRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newScale = Math.min(Math.max(1, initialScaleOnTouchRef.current * factor), 5);
      setScale(Number(newScale.toFixed(2)));
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  const formattedTimeLabel = timestamp ? formatDateTimeBR(timestamp) : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[92vh] max-w-4xl transition-all duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate flex items-center gap-2">
                <span>{title}</span>
                {scale > 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono cursor-pointer transition-colors"
                    title="Clique para redefinir zoom"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Zoom {Math.round(scale * 100)}%</span>
                  </button>
                )}
              </h3>
              {metadataInfo && (
                <p className="text-[11px] text-slate-400 truncate">{metadataInfo}</p>
              )}
            </div>
          </div>

          {/* Apenas o botão de fechar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Fechar visualizador"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horário de Registro */}
        {formattedTimeLabel && (
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Horário da foto:</span>
              <strong className="text-white font-mono">{formattedTimeLabel}</strong>
            </span>
          </div>
        )}

        {/* Viewport da Imagem */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          className={`relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[320px] select-none ${
            scale > 1
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
          }`}
        >
          {hasImage ? (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="will-change-transform max-w-full max-h-full flex items-center justify-center p-2"
            >
              <img
                src={imageUrl}
                alt={title || 'Foto do Comprovante'}
                draggable={false}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.img-error-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 max-w-md">
              <div className="p-3 bg-slate-800/80 rounded-2xl mb-3 text-emerald-400 border border-slate-700">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-200">Nenhum comprovante anexado</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Este registro foi cadastrado sem foto do painel ou comprovante.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
