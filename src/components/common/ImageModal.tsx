import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title = 'Comprovante da Viagem', onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] max-w-3xl w-full rounded-2xl bg-slate-900 p-4 text-white shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mt-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/60 rounded-xl p-2 min-h-[300px]">
          <img
            src={imageUrl}
            alt="Comprovante de abastecimento/viagem"
            className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
            onError={(e) => {
              // Fallback preview
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
