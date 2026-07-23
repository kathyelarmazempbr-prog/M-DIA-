import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Função para encerrar todos os tracks do fluxo da câmera
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Solicita permissão e inicia a câmera SOMENTE quando acionado
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setIsLoading(true);
    setErrorMessage(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('A câmera não é suportada por este navegador ou ambiente.');
      }

      let constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback para qualquer vídeo
        newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      setErrorMessage(
        err.message || 'Não foi possível acessar a câmera. Verifique as permissões do seu dispositivo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito executado ao abrir/fechar a modal
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Encerra imediatamente a câmera após captura
      stopCameraStream();
      onCapture(dataUrl);
      onClose();
    }
  };

  const handleCloseModal = () => {
    stopCameraStream();
    onClose();
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-4 sm:p-5 text-white shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Tirar Foto do Comprovante</h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Fechar Câmera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport da Câmera */}
        <div className="relative mt-4 flex-1 aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-medium">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
              <span>Iniciando câmera...</span>
            </div>
          )}

          {errorMessage ? (
            <div className="p-4 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="text-xs text-rose-200">{errorMessage}</p>
              <button
                onClick={() => startCamera()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
            />
          )}

          {/* Guia visual de enquadramento do comprovante */}
          {!isLoading && !errorMessage && (
            <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-emerald-500/50 rounded-xl flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 bg-slate-900/80 px-2 py-1 rounded-md font-mono">
                Enquadre o painel ou nota
              </span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 flex items-center justify-between gap-3 pt-2">
          <button
            onClick={toggleFacingMode}
            disabled={isLoading || !!errorMessage}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 p-3 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Inverter Câmera (Frontal / Traseira)"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            onClick={handleCapture}
            disabled={isLoading || !!errorMessage}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-3 px-4 font-bold text-sm text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="h-5 w-5 stroke-[3]" />
            <span>TIRAR FOTO</span>
          </button>

          <button
            onClick={handleCloseModal}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
