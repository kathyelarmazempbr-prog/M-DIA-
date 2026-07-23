import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KmlBadge } from '../common/KmlBadge';
import { formatDateBR } from '../../utils/exportUtils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, Target, Award, Fuel, Route, CheckCircle, AlertTriangle } from 'lucide-react';

export const DriverStats: React.FC = () => {
  const { currentUser, trips } = useApp();

  if (!currentUser) return null;

  // Filter user's trips sorted by date ascending for chart timeline
  const driverTripsAsc = useMemo(() => {
    return trips
      .filter((t) => t.driverId === currentUser.id)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [trips, currentUser.id]);

  // Calculations
  const totalTrips = driverTripsAsc.length;
  const targetKml = currentUser.targetKml || 2.60;

  const averageKml = useMemo(() => {
    if (totalTrips === 0) return 0;
    const sum = driverTripsAsc.reduce((acc, t) => acc + t.kml, 0);
    return sum / totalTrips;
  }, [driverTripsAsc, totalTrips]);

  const bestKml = useMemo(() => {
    if (totalTrips === 0) return 0;
    return Math.max(...driverTripsAsc.map((t) => t.kml));
  }, [driverTripsAsc, totalTrips]);

  const diffTarget = averageKml - targetKml;
  const isAboveTarget = diffTarget >= 0;

  // Prepare chart data
  const chartData = useMemo(() => {
    return driverTripsAsc.map((t) => ({
      date: formatDateBR(t.date).slice(0, 5), // DD/MM
      fullDate: formatDateBR(t.date),
      kml: t.kml,
      target: targetKml,
      destinationName: t.destinationName,
    }));
  }, [driverTripsAsc, targetKml]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Card 1: Média Geral */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Média Geral</span>
            <Fuel className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{averageKml.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">km/l</span>
          </div>
          <KmlBadge kml={averageKml} size="sm" showLabel />
        </div>

        {/* Card 2: Meta Individual */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta Estipulada</span>
            <Target className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{targetKml.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">km/l</span>
          </div>
          <p
            className={`text-[11px] font-bold flex items-center gap-1 ${
              isAboveTarget ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {isAboveTarget ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>+{(diffTarget).toFixed(2)} km/l acima da meta!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                <span>{Math.abs(diffTarget).toFixed(2)} km/l abaixo da meta</span>
              </>
            )}
          </p>
        </div>

        {/* Card 3: Melhor Média */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Melhor Média</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">{bestKml.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">km/l</span>
          </div>
          <p className="text-[11px] text-slate-500">Recorde pessoal no período</p>
        </div>

        {/* Card 4: Total de Viagens */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Lançamentos Registrados</span>
            <Route className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{totalTrips}</span>
            <span className="text-xs text-slate-500 font-medium">registros</span>
          </div>
          <p className="text-[11px] text-slate-500">Histórico de registro</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Evolução do Consumo de Combustível (km/l)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhamento viagem a viagem comparado à meta de {targetKml.toFixed(2)} km/l
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma viagem registrada para gerar o gráfico de desempenho.
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[1.8, 3.8]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs shadow-md">
                          <p className="font-bold text-slate-900">{data.destinationName}</p>
                          <p className="text-slate-500 text-[10px] mb-1">Data: {data.fullDate}</p>
                          <p className="text-emerald-700 font-extrabold">
                            Média: {data.kml.toFixed(2)} km/l
                          </p>
                          <p className="text-slate-500 text-[10px]">
                            Meta: {data.target.toFixed(2)} km/l
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={targetKml}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  label={{
                    value: `Meta (${targetKml.toFixed(2)})`,
                    fill: '#059669',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="kml"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#047857' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Driver Tips Card */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-xs text-slate-700 space-y-2 shadow-xs">
        <h4 className="font-bold text-emerald-900 flex items-center gap-2 text-sm">
          <Award className="h-4 w-4 text-emerald-600" />
          <span>Dicas de Condução Econômica MÉDIA +</span>
        </h4>
        <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
          <li>
            <strong>Mantenha a rotação verde (1100 a 1500 RPM):</strong> Troque de marcha no tempo correto para evitar desperdício de diesel em subidas.
          </li>
          <li>
            <strong>Antecipação no Trânsito:</strong> Evite frenagens bruscas usando a inércia do veículo e o freio motor.
          </li>
          <li>
            <strong>Pressão dos Pneus:</strong> Pneus calibrados corretamente reduzem a resistência ao rolamento e melhoram em até 5% sua média!
          </li>
        </ul>
      </div>
    </div>
  );
};
