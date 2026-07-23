import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KmlBadge } from '../common/KmlBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Trophy, Award, Truck, User, Fuel, Shield, Medal } from 'lucide-react';

export const RankingsView: React.FC = () => {
  const { trips } = useApp();
  const [rankingType, setRankingType] = useState<'driver' | 'carreta'>('driver');

  // 1. Driver Rankings
  const driverRankings = useMemo(() => {
    const driverStatsMap: {
      [id: string]: {
        driverId: string;
        driverCode: string;
        driverName: string;
        tripsCount: number;
        totalKml: number;
        bestKml: number;
      };
    } = {};

    trips.forEach((t) => {
      if (!driverStatsMap[t.driverId]) {
        driverStatsMap[t.driverId] = {
          driverId: t.driverId,
          driverCode: t.driverCode,
          driverName: t.driverName,
          tripsCount: 0,
          totalKml: 0,
          bestKml: 0,
        };
      }
      const item = driverStatsMap[t.driverId];
      item.tripsCount += 1;
      item.totalKml += t.kml;
      if (t.kml > item.bestKml) item.bestKml = t.kml;
    });

    return Object.values(driverStatsMap)
      .map((item) => ({
        ...item,
        avgKml: item.tripsCount > 0 ? item.totalKml / item.tripsCount : 0,
      }))
      .sort((a, b) => b.avgKml - a.avgKml);
  }, [trips]);

  // 2. Carretas / Cavalos Rankings
  const carretaRankings = useMemo(() => {
    const cavaloMap: {
      [plate: string]: {
        plate: string;
        tripsCount: number;
        totalKml: number;
        bestKml: number;
      };
    } = {};

    trips.forEach((t) => {
      const plate = t.cavaloPlate.toUpperCase();
      if (!cavaloMap[plate]) {
        cavaloMap[plate] = { plate, tripsCount: 0, totalKml: 0, bestKml: 0 };
      }
      const item = cavaloMap[plate];
      item.tripsCount += 1;
      item.totalKml += t.kml;
      if (t.kml > item.bestKml) item.bestKml = t.kml;
    });

    return Object.values(cavaloMap)
      .map((item) => ({
        ...item,
        avgKml: item.tripsCount > 0 ? item.totalKml / item.tripsCount : 0,
      }))
      .sort((a, b) => b.avgKml - a.avgKml);
  }, [trips]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (rankingType === 'driver') {
      return driverRankings.slice(0, 8).map((d) => ({
        name: d.driverName.split(' ')[0],
        fullName: d.driverName,
        avgKml: parseFloat(d.avgKml.toFixed(2)),
      }));
    } else {
      return carretaRankings.slice(0, 8).map((c) => ({
        name: c.plate,
        fullName: `Carreta ${c.plate}`,
        avgKml: parseFloat(c.avgKml.toFixed(2)),
      }));
    }
  }, [rankingType, driverRankings, carretaRankings]);

  // Podium 1st, 2nd, 3rd drivers
  const top1 = driverRankings[0];
  const top2 = driverRankings[1];
  const top3 = driverRankings[2];

  return (
    <div className="space-y-6">
      {/* Driver Podium Header */}
      <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="text-center max-w-xl mx-auto mb-6 relative z-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-2 border border-amber-200/80 shadow-xs">
            <Trophy className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">RANKING DE EFICIÊNCIA DO TIME</h2>
          <p className="text-xs text-slate-500 mt-1">
            Classificação baseada na média acumulada (km/l) por Motorista e Equipamento
          </p>
        </div>

        {/* Podium Top 3 Drivers Cards */}
        {driverRankings.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
            {/* 2nd Place */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-center flex flex-col justify-between order-2 sm:order-1 transform sm:translate-y-2 shadow-xs">
              <div>
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold text-sm mb-2">
                  🥈 2º
                </span>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{top2?.driverName}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{top2?.driverCode}</p>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-slate-900">{top2?.avgKml.toFixed(2)}</span>
                <span className="text-xs text-slate-500 ml-1">km/l</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="rounded-2xl bg-emerald-50/50 p-5 border-2 border-emerald-500 text-center flex flex-col justify-between order-1 sm:order-2 shadow-sm transform sm:-translate-y-2">
              <div>
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-white font-black text-base mb-2 shadow-md shadow-emerald-500/20">
                  🥇 1º
                </span>
                <h4 className="font-bold text-emerald-950 text-base line-clamp-1">{top1?.driverName}</h4>
                <p className="text-[10px] text-emerald-700 font-semibold">{top1?.driverCode}</p>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-emerald-700">{top1?.avgKml.toFixed(2)}</span>
                <span className="text-xs text-emerald-800 ml-1">km/l</span>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wider">Destaque da Frota</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-center flex flex-col justify-between order-3 sm:order-3 transform sm:translate-y-2 shadow-xs">
              <div>
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm mb-2">
                  🥉 3º
                </span>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{top3?.driverName}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{top3?.driverCode}</p>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-slate-900">{top3?.avgKml.toFixed(2)}</span>
                <span className="text-xs text-slate-500 ml-1">km/l</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Selector for Ranking Type */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 border border-slate-200/80 max-w-sm w-full">
          <button
            onClick={() => setRankingType('driver')}
            className={`flex-1 py-2.5 px-3 text-xs font-black tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase ${
              rankingType === 'driver'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>MOTORISTAS</span>
          </button>

          <button
            onClick={() => setRankingType('carreta')}
            className={`flex-1 py-2.5 px-3 text-xs font-black tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase ${
              rankingType === 'carreta'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>CARRETAS</span>
          </button>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Fuel className="h-4 w-4 text-emerald-600" />
          <span>
            Gráfico Comparativo - {rankingType === 'driver' ? 'MOTORISTAS' : 'CARRETAS'}
          </span>
        </h3>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[1.5, 3.5]} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900 p-2.5 text-xs shadow-xl text-white">
                        <p className="font-bold">{data.fullName}</p>
                        <p className="text-emerald-400 font-black mt-0.5">
                          Média: {data.avgKml} km/l
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgKml" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#059669' : index === 1 ? '#10b981' : index === 2 ? '#34d399' : '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Ranking List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Tabela Detalhada de Desempenho (Média km/l)
          </h3>
        </div>

        <div className="overflow-x-auto">
          {rankingType === 'driver' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4 text-center">Puxadas</th>
                  <th className="py-3 px-4 text-center">Melhor Média</th>
                  <th className="py-3 px-4 text-right">Média Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {driverRankings.map((item, idx) => (
                  <tr key={item.driverId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-500">
                      {idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : idx === 2 ? '🥉 3º' : `${idx + 1}º`}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{item.driverName}</div>
                      <div className="text-[10px] text-slate-400">{item.driverCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                      {item.tripsCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                      {item.bestKml.toFixed(2)} km/l
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <KmlBadge kml={item.avgKml} size="md" showLabel />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rankingType === 'carreta' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Placa Carreta</th>
                  <th className="py-3 px-4 text-center">Total de Viagens</th>
                  <th className="py-3 px-4 text-center">Recorde Registrado</th>
                  <th className="py-3 px-4 text-right">Média Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {carretaRankings.map((item, idx) => (
                  <tr key={item.plate} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-500">{idx + 1}º</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.plate}</td>
                    <td className="py-3.5 px-4 text-center">{item.tripsCount}</td>
                    <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                      {item.bestKml.toFixed(2)} km/l
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <KmlBadge kml={item.avgKml} size="md" showLabel />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
