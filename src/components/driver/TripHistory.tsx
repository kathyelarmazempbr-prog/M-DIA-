import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Trip } from '../../types';
import { KmlBadge } from '../common/KmlBadge';
import { ImageModal } from '../common/ImageModal';
import { formatDateBR } from '../../utils/exportUtils';
import { Filter, Search, Calendar, Truck, MapPin, Image as ImageIcon, Fuel, RefreshCw, ChevronRight } from 'lucide-react';

export const TripHistory: React.FC = () => {
  const { currentUser, trips } = useApp();

  const [searchDest, setSearchDest] = useState('');
  const [filterCavalo, setFilterCavalo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  if (!currentUser) return null;

  // Driver sees only their own trips
  const driverTrips = useMemo(() => {
    if (currentUser.role === 'admin') return trips;
    return trips.filter(
      (t) =>
        t.driverId === currentUser.id ||
        t.driverCode === currentUser.code ||
        t.driverId === currentUser.code
    );
  }, [trips, currentUser]);

  // Unique Cavalo plates for filter dropdown
  const cavaloPlates = useMemo(() => {
    const set = new Set<string>();
    driverTrips.forEach((t) => {
      if (t.cavaloPlate) set.add(t.cavaloPlate.toUpperCase());
    });
    return Array.from(set);
  }, [driverTrips]);

  // Filtered list
  const filteredTrips = useMemo(() => {
    return driverTrips.filter((t) => {
      // Destino filter / Text search
      if (searchDest && searchDest.trim() !== '') {
        const destTerm = searchDest.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        const destName = (t.destinationName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const destCode = (t.destinationCode || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const origName = (t.originName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const origCode = (t.originCode || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cavalo = (t.cavaloPlate || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sider = (t.siderPlate || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const driverName = (t.driverName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const driverCode = (t.driverCode || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const notes = (t.notes || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const matchesDest =
          destName.includes(destTerm) ||
          destCode.includes(destTerm) ||
          origName.includes(destTerm) ||
          origCode.includes(destTerm) ||
          cavalo.includes(destTerm) ||
          sider.includes(destTerm) ||
          driverName.includes(destTerm) ||
          driverCode.includes(destTerm) ||
          notes.includes(destTerm);

        if (!matchesDest) return false;
      }

      // Cavalo filter
      if (filterCavalo) {
        if (t.cavaloPlate.toUpperCase() !== filterCavalo.toUpperCase()) return false;
      }

      // Start Date
      if (startDate && t.date < startDate) return false;

      // End Date
      if (endDate && t.date > endDate) return false;

      return true;
    });
  }, [driverTrips, searchDest, filterCavalo, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchDest('');
    setFilterCavalo('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Proof Lightbox Modal */}
      <ImageModal imageUrl={selectedProofUrl} onClose={() => setSelectedProofUrl(null)} />

      {/* Filter Bar Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filtros do Histórico</span>
          </h3>
          {(searchDest || filterCavalo || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Destino search */}
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              placeholder="Buscar Destino..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Cavalo filter */}
          <div>
            <select
              value={filterCavalo}
              onChange={(e) => setFilterCavalo(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="">Todas as Placas Cavalo</option>
              {cavaloPlates.map((p) => (
                <option key={p} value={p}>
                  Cavalo {p}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data Inicial"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Data Final"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Trips Counter & Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-medium">
          Exibindo <strong className="text-slate-800">{filteredTrips.length}</strong> de{' '}
          <strong className="text-slate-600">{driverTrips.length}</strong> registros
        </p>
      </div>

      {/* Trip List */}
      {filteredTrips.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-8 text-center text-slate-400">
          <Fuel className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhum registro encontrado</p>
          <p className="text-xs mt-1 text-slate-400">
            Tente ajustar os filtros acima para visualizar mais puxadas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3"
            >
              {/* Card Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {formatDateBR(trip.date)}
                  </span>
                </div>
                <KmlBadge kml={trip.kml} size="md" showLabel />
              </div>

              {/* Route & Equipment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Route */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Destino
                    </p>
                    <p className="font-bold text-emerald-700 mt-0.5 text-xs">
                      {trip.destinationName}
                    </p>
                  </div>
                </div>

                {/* Equipment */}
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Equipamento Utilizado
                    </p>
                    <p className="font-mono text-slate-700 mt-0.5 font-bold">
                      Cavalo: <span className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{trip.cavaloPlate}</span>
                      <span className="ml-2">Sider:</span>{' '}
                      <span className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{trip.siderPlate}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes & Photo Attachment button */}
              {(trip.notes || trip.proofUrl) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {trip.notes ? (
                    <p className="text-slate-500 italic line-clamp-1 max-w-[70%]">
                      "{trip.notes}"
                    </p>
                  ) : <div />}

                  {trip.proofUrl && (
                    <button
                      onClick={() => setSelectedProofUrl(trip.proofUrl || null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Ver Comprovante</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
