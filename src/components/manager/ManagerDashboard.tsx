import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FleetOverview } from './FleetOverview';
import { RankingsView } from './RankingsView';
import { UserManagement } from './UserManagement';
import { ExportReports } from './ExportReports';
import { LayoutDashboard, Trophy, Users, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'users' | 'export'>('overview');

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Manager Welcome Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl shadow-lg shadow-emerald-950">
              <ShieldCheck className="h-8 w-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h1>
                <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800/60 uppercase">
                  {currentUser.role === 'developer' ? 'DESENVOLVEDOR' : 'SUPERVISOR'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Painel Administrativo para controle de médias de combustível, rankings e exportações.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <nav className="inline-flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 shadow-lg w-full max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'rankings'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Rankings</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'export'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'overview' && <FleetOverview />}
        {activeTab === 'rankings' && <RankingsView />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'export' && <ExportReports />}
      </div>
    </div>
  );
};
