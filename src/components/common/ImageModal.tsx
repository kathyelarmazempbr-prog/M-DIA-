import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Clock,
  Move,
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialScaleOnTouchRef = useRef<number>(1);

  // Reseta o zoom e a posição sempre que a imagem ou modal abrir/fechar
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [imageUrl]);

  if (imageUrl === null) return null;

  const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const setPresetScale = (newScale: number) => {
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
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

  // Duplo clique: alterna entre 1x e 2.5x para leitura rápida dos detalhes
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Suporte a gestos touch (pinça e arraste em telas de celular)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinça com 2 dedos
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialScaleOnTouchRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // 1 dedo arrastando imagem com zoom
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

  const handleOpenInNewTab = () => {
    if (!imageUrl) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title || 'Comprovante'}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #020617;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
              }
              img {
                max-width: 98vw;
                max-height: 98vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="${title || 'Comprovante'}" />
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  const formattedTimeLabel = timestamp ? formatDateTimeBR(timestamp) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'h-[96vh] max-w-[98vw]'
            : 'max-h-[92vh] max-w-4xl'
        }`}
      >
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
                  <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    Zoom {Math.round(scale * 100)}%
                  </span>
                )}
              </h3>
              {metadataInfo && (
                <p className="text-[11px] text-slate-400 truncate">{metadataInfo}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasImage && (
              <>
                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title={isFullscreen ? 'Restaurar tamanho' : 'Modo tela cheia'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Abrir imagem original em nova aba"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
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

        {/* Viewport da Imagem com Zoom e Pan */}
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
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
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

          {/* Dica flutuante quando em 1x */}
          {hasImage && scale === 1 && (
            <div className="pointer-events-none absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Move className="h-3 w-3 text-emerald-400" />
              <span>Dica: Use a roda do mouse, pinça ou clique duas vezes para dar zoom</span>
            </div>
          )}
        </div>

        {/* Barra de Controles de Zoom Flutuante / Rodapé */}
        {hasImage && (
          <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Controles de Zoom (+, -, 100%, Presets) */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Diminuir Zoom (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              {/* Indicador de Porcentagem */}
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 text-center min-w-[64px]">
                {Math.round(scale * 100)}%
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                disabled={scale === 1 && position.x === 0 && position.y === 0}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Redefinir visualização original (100%)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Redefinir</span>
              </button>

              {/* Presets rápidos de zoom */}
              <div className="hidden md:flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
                {[1, 1.5, 2, 3].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPresetScale(preset)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                      scale === preset
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {Math.round(preset * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Fechar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
