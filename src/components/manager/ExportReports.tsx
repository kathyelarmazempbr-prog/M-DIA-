import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportTripsToExcel, exportTripsToCSV, formatDateBR, formatTripForExport } from '../../utils/exportUtils';
import { FileSpreadsheet, Download, Filter, Calendar, Check, RefreshCw } from 'lucide-react';

export const ExportReports: React.FC = () => {
  const { trips, users } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const driversList = useMemo(() => users.filter((u) => u.role === 'driver'), [users]);

  // Filtered trips for export
  const exportTrips = useMemo(() => {
    return trips.filter((t) => {
      if (selectedDriverId && t.driverId !== selectedDriverId) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [trips, selectedDriverId, startDate, endDate]);

  const exportRows = useMemo(() => {
    return exportTrips.map(formatTripForExport);
  }, [exportTrips]);

  const handleExportExcel = () => {
    const filename = `media_plus_relatorio_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportTripsToExcel(exportTrips, filename);
  };

  const handleExportCSV = () => {
    const filename = `media_plus_relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    exportTripsToCSV(exportTrips, filename);
  };

  return (
    <div className="space-y-6">
      {/* Export Action Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              <span>Exportação de Relatórios Gerenciais (Excel / CSV)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere planilhas oficiais de consumo com as colunas padronizadas da frota.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={exportTrips.length === 0}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exportTrips.length === 0}
              className="rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold px-4 py-2.5 text-xs sm:text-sm transition-all border border-slate-200 flex items-center gap-2"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>CSV (Excel BR)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filtrar por Motorista</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Info Column Structure Banner */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-emerald-700 flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            <span>Colunas Exatas Exportadas no Arquivo:</span>
          </p>
          <p className="font-mono text-[11px] text-slate-500 leading-relaxed">
            Data da Puxada • Cód Motorista • Motorista • Cód Destino • Destino • Carreta (Cavalo) • Sider • Média
          </p>
        </div>
      </div>

      {/* Excel Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Pré-visualização da Planilha ({exportRows.length} linhas)
          </h3>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
            Pronto para exportação
          </span>
        </div>

        {exportRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum registro selecionado para exportação.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-50 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-100 font-sans font-bold">
                <tr>
                  <th className="py-3 px-4">Data da Puxada</th>
                  <th className="py-3 px-4">Cód Motorista</th>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4">Cód Destino</th>
                  <th className="py-3 px-4">Destino</th>
                  <th className="py-3 px-4">Carreta (Cavalo)</th>
                  <th className="py-3 px-4">Sider</th>
                  <th className="py-3 px-4 text-right">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row['Data da Puxada']}</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{row['Cód Motorista']}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">{row['Motorista']}</td>
                    <td className="py-3 px-4 text-slate-500">{row['Cód Destino']}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">{row['Destino']}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{row['Carreta (Cavalo)']}</td>
                    <td className="py-3 px-4 text-slate-600">{row['Sider']}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">{row['Média']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
