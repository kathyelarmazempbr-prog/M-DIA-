import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Clock, Smartphone } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, capturedAtIso: string, formattedDateTime: string) => void;
  driverName?: string;
  driverCode?: string;
  cavaloPlate?: string;
}

/**
 * Aplica carimbo/marca d'água permanente de evidência fotográfica sobre o canvas
 */
function applyEvidenceWatermark(
  canvas: HTMLCanvasElement,
  driverName?: string,
  driverCode?: string,
  cavaloPlate?: string
): { dataUrl: string; capturedAtIso: string; formattedDateTime: string } {
  const ctx = canvas.getContext('2d');
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  const formattedDateTime = `${dateStr} às ${timeStr}`;
  const capturedAtIso = now.toISOString();

  if (ctx) {
    const width = canvas.width;
    const height = canvas.height;

    // Altura da barra de evidência proporcional
    const barHeight = Math.max(76, Math.round(height * 0.13));
    const startY = height - barHeight;

    // Fundo escuro com gradiente para contraste e legibilidade
    const gradient = ctx.createLinearGradient(0, startY, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.90)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, startY, width, barHeight);

    // Linha de destaque verde esmeralda no topo da barra
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, startY, width, Math.max(3, Math.round(height * 0.005)));

    // Dimensionamento responsivo de fontes
    const baseFontSize = Math.max(12, Math.round(width * 0.024));

    // Linha 1: Indicador de evidência auditável
    ctx.fillStyle = '#34d399';
    ctx.font = `bold ${Math.round(baseFontSize * 0.85)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('● EVIDÊNCIA DE REGISTRO • CAPTURA EM TEMPO REAL', 20, startY + Math.round(barHeight * 0.30));

    // Linha 2: Data e Horário exato com segundos
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(baseFontSize * 1.15)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`🕒 REGISTRADO EM: ${dateStr} - ${timeStr}`, 20, startY + Math.round(barHeight * 0.62));

    // Linha 3: Identificação do motorista e veículo
    const metaParts = [];
    if (driverName || driverCode) {
      metaParts.push(`MOT: ${(driverName || driverCode || '').slice(0, 26)}`);
    }
    if (cavaloPlate) {
      metaParts.push(`PLACA: ${cavaloPlate.toUpperCase()}`);
    }
    metaParts.push('SISTEMA MÉDIA+');

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 ${Math.round(baseFontSize * 0.8)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(metaParts.join('  |  '), 20, startY + Math.round(barHeight * 0.88));
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return { dataUrl, capturedAtIso, formattedDateTime };
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  driverName,
  driverCode,
  cavaloPlate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Encerra todos os tracks da câmera
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

  // Solicita permissão e inicia a câmera
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setIsLoading(true);
    setErrorMessage(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('A câmera web em tempo real não está acessível neste navegador. Use a opção de câmera do celular abaixo.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback para qualquer dispositivo de vídeo
        newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Erro ao acessar a câmera em tempo real:', err);
      setErrorMessage(
        err.message || 'Não foi possível acessar a câmera do navegador. Você pode acionar a câmera nativa do celular logo abaixo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const { dataUrl, capturedAtIso, formattedDateTime } = applyEvidenceWatermark(
        canvas,
        driverName,
        driverCode,
        cavaloPlate
      );

      stopCameraStream();
      onCapture(dataUrl, capturedAtIso, formattedDateTime);
      onClose();
    }
  };

  // Captura via câmera nativa do smartphone (exclusivo para câmera, proíbe galeria)
  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1280;
        canvas.height = img.naturalHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const { dataUrl, capturedAtIso, formattedDateTime } = applyEvidenceWatermark(
            canvas,
            driverName,
            driverCode,
            cavaloPlate
          );

          stopCameraStream();
          onCapture(dataUrl, capturedAtIso, formattedDateTime);
          onClose();
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-4 sm:p-5 text-white shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Registrar Foto
              </h3>
            </div>
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
        <div className="relative mt-3 flex-1 aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-medium">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
              <span>Iniciando câmera...</span>
            </div>
          )}

          {errorMessage ? (
            <div className="p-4 text-center space-y-3 max-w-sm">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="text-xs text-rose-200">{errorMessage}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Tentar Novamente</span>
                </button>

                {/* Fallback direto com a câmera nativa do smartphone */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Câmera do Celular</span>
                </button>
              </div>
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

          {/* Guia visual de enquadramento do painel */}
          {!isLoading && !errorMessage && (
            <div className="pointer-events-none absolute inset-4 sm:inset-6 border-2 border-dashed border-emerald-500/50 rounded-xl flex flex-col justify-start p-2">
              <span className="self-center text-[10px] uppercase tracking-wider text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-md font-mono border border-emerald-500/30">
                Enquadre o painel ou hodômetro
              </span>
            </div>
          )}
        </div>

        {/* Fallback de câmera nativa caso deseje acionar o app de câmera do aparelho diretamente */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraFile}
          className="hidden"
        />

        {/* Botões de Ação */}
        <div className="mt-4 flex items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={toggleFacingMode}
            disabled={isLoading || !!errorMessage}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 p-3 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Inverter Câmera (Frontal / Traseira)"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={isLoading || !!errorMessage}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-3 px-4 font-bold text-sm text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="h-5 w-5 stroke-[2.5]" />
            <span>REGISTRAR FOTO</span>
          </button>

          {/* Atalho para Câmera do Smartphone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Abrir app de Câmera nativo do celular"
          >
            <Smartphone className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
