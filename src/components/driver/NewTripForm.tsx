import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KmlBadge } from '../common/KmlBadge';
import { Send, Camera, Upload, CheckCircle, Fuel, Truck, Calendar, FileText, UserCheck } from 'lucide-react';
import { uploadComprovante } from '../../lib/firebaseService';

// 1. Destinos/Fábricas Oficiais do Sistema
export const OFFICIAL_DESTINATIONS = [
  { code: '950', name: 'ITAPISSUMA-PE' },
  { code: '426', name: 'FONTE DA MATA-JP' },
  { code: '3006', name: 'ESTÂNCIA-SE' },
  { code: '436', name: 'AQUIRAZ-CE' },
  { code: '421', name: 'CAMAÇARI-BA' },
];

// 2. Cadastro Oficial dos 5 Motoristas
export const DRIVERS_LIST = [
  { code: '9013', name: 'ALUISIO ALVES DE ALMEIDA JUNIOR' },
  { code: 'G1060', name: 'HILDO STEFANI AQUINO MELO' },
  { code: 'G1021', name: 'JOSE EDUARDO DA SILVA CAVALCANTI' },
  { code: 'G1110', name: 'LUCAS GOMES TORQUATO' },
  { code: 'G1044', name: 'MANOEL MESSIAS VITORINO DA SILVA' },
];

interface NewTripFormProps {
  onSuccess?: () => void;
}

export const NewTripForm: React.FC<NewTripFormProps> = ({ onSuccess }) => {
  const { currentUser, addTrip, getPerformanceColor } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Identifica se o usuário atual bate com algum da lista oficial
  const initialDriverCode = DRIVERS_LIST.find(
    (d) => d.code === currentUser?.code || d.name === currentUser?.name
  )?.code || DRIVERS_LIST[0].code;

  const [date, setDate] = useState(todayStr);
  const [selectedDriverCode, setSelectedDriverCode] = useState(initialDriverCode);

  // Destino da viagem (fábricas)
  const [destinationCode, setDestinationCode] = useState('950');
  const [destinationCustom, setDestinationCustom] = useState('ITAPISSUMA-PE');

  // Equipamentos - em branco por padrão conforme solicitado
  const [cavaloPlate, setCavaloPlate] = useState('');
  const [siderPlate, setSiderPlate] = useState('');

  // Dados da Média - parâmetro base 2,60 km/l
  const [kml, setKml] = useState<string>('2.60');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!currentUser) return null;

  const kmlNum = parseFloat(kml) || 0;
  const colors = getPerformanceColor(kmlNum);

  // Busca objeto do motorista selecionado
  const activeDriver = DRIVERS_LIST.find((d) => d.code === selectedDriverCode) || DRIVERS_LIST[0];

  const handleDestinationSelect = (code: string) => {
    setDestinationCode(code);
    if (code === 'OUT') {
      setDestinationCustom('');
    } else {
      const dest = OFFICIAL_DESTINATIONS.find((d) => d.code === code);
      if (dest) setDestinationCustom(dest.name);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const publicUrl = await uploadComprovante(file);
        if (publicUrl) {
          setProofImage(publicUrl);
        }
      } catch (err) {
        console.warn('Utilizando imagem local como fallback:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmlNum || kmlNum <= 0) return;

    addTrip({
      date,
      driverId: currentUser.role === 'admin' ? activeDriver.code : currentUser.id,
      driverCode: activeDriver.code,
      driverName: activeDriver.name,
      originCode: 'FAB',
      originName: 'FÁBRICA DE ORIGEM',
      destinationCode: destinationCode || 'OUT',
      destinationName: destinationCustom || 'Destino Diverso',
      cavaloPlate: cavaloPlate.toUpperCase().trim(),
      siderPlate: siderPlate.toUpperCase().trim(),
      kml: kmlNum,
      notes,
      proofUrl: proofImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-xs border border-slate-100 text-slate-800 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Fuel className="h-6 w-6 text-emerald-600" />
            <span>LANÇAR MÉDIA</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registre os dados da viagem e média realizada para acompanhamento.
          </p>
        </div>
        <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 border border-slate-200">
          Cód. Motorista: <strong className="ml-1 text-emerald-700">{activeDriver.code}</strong>
        </span>
      </div>

      {submitted ? (
        <div className="py-12 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Lançamento Salvo com Sucesso!</h3>
          <p className="text-sm text-slate-600 mt-2">
            A média do motorista <strong>{activeDriver.name}</strong> ({kmlNum.toFixed(2)} km/l) foi registrada.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 0: Seleção de Motorista (Se for admin abre select, se for motorista trava no dele) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>Motorista Responsável *</span>
            </label>

            {currentUser.role === 'admin' ? (
              <select
                value={selectedDriverCode}
                onChange={(e) => setSelectedDriverCode(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {DRIVERS_LIST.map((d) => (
                  <option key={d.code} value={d.code}>
                    COD {d.code} - {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center justify-between text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                <span>{activeDriver.name}</span>
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  COD {activeDriver.code}
                </span>
              </div>
            )}
          </div>

          {/* Section 1: Data e Destino da Viagem */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Data & Destino da Viagem</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data do Registro *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Destino (Fábricas) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Destino (Fábrica) *
                </label>
                <select
                  value={destinationCode}
                  onChange={(e) => handleDestinationSelect(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                >
                  {OFFICIAL_DESTINATIONS.map((dest) => (
                    <option key={`dest-${dest.code}`} value={dest.code}>
                      COD {dest.code} - {dest.name}
                    </option>
                  ))}
                  <option value="OUT">Outro Destino...</option>
                </select>
              </div>
            </div>

            {/* Campo de texto livre caso selecione "Outro Destino..." */}
            {destinationCode === 'OUT' && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nome do Destino Personalizado *
                </label>
                <input
                  type="text"
                  value={destinationCustom}
                  onChange={(e) => setDestinationCustom(e.target.value)}
                  placeholder="Ex: Unidade CD Vitória - ES"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 2: Equipamento */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              <span>Placas dos Equipamentos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Placa da Carreta *
                </label>
                <input
                  type="text"
                  value={cavaloPlate}
                  onChange={(e) => setCavaloPlate(e.target.value)}
                  placeholder="Ex: ABC-1D23"
                  required
                  className="w-full uppercase font-mono tracking-wider rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Placa do Sider *
                </label>
                <input
                  type="text"
                  value={siderPlate}
                  onChange={(e) => setSiderPlate(e.target.value)}
                  placeholder="Ex: SDR-1010"
                  required
                  className="w-full uppercase font-mono tracking-wider rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Média Realizada com Indicador Visual */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Fuel className="h-4 w-4 text-emerald-600" />
              <span>Média Realizada (km/l)</span>
            </h3>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Média de Consumo (km/l) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="10.0"
                      value={kml}
                      onChange={(e) => setKml(e.target.value)}
                      required
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-3 text-2xl font-black text-emerald-700 focus:border-emerald-500 focus:outline-none shadow-xs"
                    />
                    <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">
                      km/l
                    </span>
                  </div>
                </div>

                {/* Badge visual em tempo real */}
                <div className={`w-full sm:w-1/2 rounded-xl p-3 border ${colors.bg} ${colors.border} ${colors.text} flex items-center justify-between`}>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
                      Classificação da Média
                    </span>
                    <span className="text-sm font-extrabold block">
                      {colors.label}
                    </span>
                  </div>
                  <KmlBadge kml={kmlNum} size="lg" />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/80">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥ 2.60 (Excelente)
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> 2.40 - 2.59 (Atenção)
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt; 2.40 (Abaixo)
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Anexo do comprovante */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-600" />
              <span>Anexo do Comprovante / Foto do Painel</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-emerald-500 hover:bg-white transition-all text-xs font-semibold text-slate-600">
                <Upload className="h-5 w-5 text-emerald-600" />
                <span>{proofImage ? 'Substituir Imagem do Comprovante' : 'Tirar Foto ou Carregar Arquivo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {proofImage && (
                <div className="relative h-16 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <img src={proofImage} alt="Preview" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 rounded-full bg-emerald-600 p-0.5 text-white">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Observações da Puxada (Opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Trecho com serras fortes, trânsito na chegada ou condições climáticas."
              rows={2}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="w-full mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-4 px-6 text-base font-bold text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Send className="h-5 w-5 stroke-[2.5]" />
            <span>CONFIRMAR E REGISTRAR MÉDIA</span>
          </button>
        </form>
      )}
    </div>
  );
};
