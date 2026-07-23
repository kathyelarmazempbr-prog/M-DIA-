import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Trip } from '../../types';
import { KmlBadge } from '../common/KmlBadge';
import { ImageModal } from '../common/ImageModal';
import { formatDateBR } from '../../utils/exportUtils';
import { POPULAR_ROUTES } from '../../data/mockData';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Truck,
  User as UserIcon,
  Fuel,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const FleetOverview: React.FC = () => {
  const { trips, users, updateTrip, deleteTrip, getPerformanceColor } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedCavalo, setSelectedCavalo] = useState('');
  const [selectedSider, setSelectedSider] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const driversList = useMemo(() => users.filter((u) => u.role === 'driver'), [users]);

  // Unique equipment lists for filter
  const cavaloPlates = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => t.cavaloPlate && set.add(t.cavaloPlate.toUpperCase()));
    return Array.from(set);
  }, [trips]);

  const siderPlates = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => t.siderPlate && set.add(t.siderPlate.toUpperCase()));
    return Array.from(set);
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Search term (driver name, code, origin, destination)
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const matches =
          t.driverName.toLowerCase().includes(term) ||
          t.driverCode.toLowerCase().includes(term) ||
          t.originName.toLowerCase().includes(term) ||
          t.destinationName.toLowerCase().includes(term) ||
          t.cavaloPlate.toLowerCase().includes(term);
        if (!matches) return false;
      }

      // Driver
      if (selectedDriverId && t.driverId !== selectedDriverId) return false;

      // Cavalo
      if (selectedCavalo && t.cavaloPlate.toUpperCase() !== selectedCavalo.toUpperCase()) return false;

      // Sider
      if (selectedSider && t.siderPlate.toUpperCase() !== selectedSider.toUpperCase()) return false;

      // Start date
      if (startDate && t.date < startDate) return false;

      // End date
      if (endDate && t.date > endDate) return false;

      return true;
    });
  }, [trips, searchQuery, selectedDriverId, selectedCavalo, selectedSider, startDate, endDate]);

  // Summary KPIs for current filtered view
  const fleetKpis = useMemo(() => {
    if (filteredTrips.length === 0) {
      return { totalTrips: 0, avgKml: 0, totalDistKm: 0, lowCount: 0 };
    }
    const totalTrips = filteredTrips.length;
    const sumKml = filteredTrips.reduce((acc, t) => acc + t.kml, 0);
    const avgKml = sumKml / totalTrips;
    const totalDistKm = filteredTrips.reduce((acc, t) => acc + (t.distanceKm || 1200), 0);
    const lowCount = filteredTrips.filter((t) => t.kml < 2.40).length;

    return { totalTrips, avgKml, totalDistKm, lowCount };
  }, [filteredTrips]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDriverId('');
    setSelectedCavalo('');
    setSelectedSider('');
    setStartDate('');
    setEndDate('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrip) {
      updateTrip(editingTrip);
      setEditingTrip(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proof Modal */}
      <ImageModal imageUrl={selectedProofUrl} onClose={() => setSelectedProofUrl(null)} />

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Média Geral Frota</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold text-slate-900">{fleetKpis.avgKml.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">km/l</span>
          </div>
          <KmlBadge kml={fleetKpis.avgKml} size="sm" showLabel />
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Viagens Filtradas</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold text-emerald-600">{fleetKpis.totalTrips}</span>
            <span className="text-xs text-slate-500 font-medium">puxadas</span>
          </div>
          <p className="text-[11px] text-slate-400">Total no período selecionado</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quilometragem Total</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold text-slate-900">
              {fleetKpis.totalDistKm.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-medium">km</span>
          </div>
          <p className="text-[11px] text-slate-400">Distância percorrida na frota</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Puxadas em Alerta</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold text-rose-500">{fleetKpis.lowCount}</span>
            <span className="text-xs text-slate-500 font-medium">abaixo de 2.40</span>
          </div>
          <p className="text-[11px] text-rose-500/80 font-medium">Requerem atenção do gestor</p>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filtros do Painel Gerencial</span>
          </h3>
          {(searchQuery || selectedDriverId || selectedCavalo || selectedSider || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
          {/* Search Term */}
          <div className="col-span-1 sm:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar Motorista, Origem ou Destino..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Driver filter */}
          <div>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="">Todos os Motoristas</option>
              {driversList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Cavalo Plate filter */}
          <div>
            <select
              value={selectedCavalo}
              onChange={(e) => setSelectedCavalo(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="">Todos os Cavalos</option>
              {cavaloPlates.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date range start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Date range end */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Trips Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <span>Acompanhamento Geral de Lançamentos</span>
          </h3>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">
            {filteredTrips.length} lançamentos
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum lançamento encontrado com os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4">Origem ➔ Destino</th>
                  <th className="py-3 px-4">Cavalo</th>
                  <th className="py-3 px-4">Sider</th>
                  <th className="py-3 px-4 text-center">Média</th>
                  <th className="py-3 px-4 text-center">Comprovante</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-900 font-bold">
                      {formatDateBR(trip.date)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{trip.driverName}</div>
                      <div className="text-[10px] text-slate-400">{trip.driverCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{trip.originName}</span>
                      <span className="mx-1 text-slate-400">➔</span>
                      <span className="text-emerald-700 font-semibold">{trip.destinationName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {trip.cavaloPlate}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {trip.siderPlate}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <KmlBadge kml={trip.kml} size="sm" showLabel />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {trip.proofUrl ? (
                        <button
                          onClick={() => setSelectedProofUrl(trip.proofUrl || null)}
                          className="p-1.5 rounded-lg bg-slate-100 text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex"
                          title="Visualizar Comprovante"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTrip(trip)}
                          className="p-1.5 rounded-lg bg-slate-100 text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Editar/Corrigir Lançamento"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a puxada do motorista ${trip.driverName}?`)) {
                              deleteTrip(trip.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Trip Modal (Manager correction feature) */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full rounded-3xl bg-slate-900 p-6 text-white shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-400" />
                <span>Corrigir / Editar Lançamento</span>
              </h3>
              <button
                onClick={() => setEditingTrip(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motorista: <strong className="text-emerald-400">{editingTrip.driverName}</strong> ({editingTrip.driverCode})
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data da Viagem</label>
                  <input
                    type="date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Média (km/l)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTrip.kml}
                    onChange={(e) => setEditingTrip({ ...editingTrip, kml: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-amber-400 font-black focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Placa Cavalo</label>
                  <input
                    type="text"
                    value={editingTrip.cavaloPlate}
                    onChange={(e) => setEditingTrip({ ...editingTrip, cavaloPlate: e.target.value.toUpperCase() })}
                    required
                    className="w-full uppercase font-mono rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Placa Sider</label>
                  <input
                    type="text"
                    value={editingTrip.siderPlate}
                    onChange={(e) => setEditingTrip({ ...editingTrip, siderPlate: e.target.value.toUpperCase() })}
                    required
                    className="w-full uppercase font-mono rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações / Motivo da Alteração</label>
                <textarea
                  value={editingTrip.notes || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
