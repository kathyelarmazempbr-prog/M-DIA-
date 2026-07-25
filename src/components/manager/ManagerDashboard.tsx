import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FleetOverview } from './FleetOverview';
import { RankingsView } from './RankingsView';
import { UserManagement } from './UserManagement';
import { ExportReports } from './ExportReports';
import { LayoutDashboard, Trophy, Users, FileSpreadsheet, ShieldCheck } from 'lucide-react';

type TabId = 'overview' | 'rankings' | 'users' | 'export';

interface TabItem {
  id: TabId;
  label: string;
  mobileLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  developerOnly?: boolean;
}

export const ManagerDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const isDeveloper = currentUser?.role === 'developer';

  // Array de navegação estritamente filtrado por permissão (RBAC)
  const navTabs = useMemo<TabItem[]>(() => {
    const tabs: TabItem[] = [
      { id: 'overview', label: 'Visão Geral', mobileLabel: 'Visão Geral', icon: LayoutDashboard },
      { id: 'rankings', label: 'Rankings', mobileLabel: 'Rankings', icon: Trophy },
    ];

    // Inclui a aba 'Usuários' EXCLUSIVAMENTE para o perfil Desenvolvedor
    if (isDeveloper) {
      tabs.push({ id: 'users', label: 'Usuários', mobileLabel: 'Usuários', icon: Users, developerOnly: true });
    }

    // A aba 'Exportar Excel' é MANTIDA para TODOS os perfis gerenciais (Supervisor e Desenvolvedor)
    tabs.push({ id: 'export', label: 'Exportar Excel', mobileLabel: 'Exportar', icon: FileSpreadsheet });

    return tabs;
  }, [isDeveloper]);

  // Proteção de rota / estado: Garante que Supervisores nunca permaneçam na aba 'users'
  useEffect(() => {
    if (activeTab === 'users' && !isDeveloper) {
      setActiveTab('overview');
    }
  }, [activeTab, isDeveloper]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Manager Welcome Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl shadow-lg shadow-emerald-950 shrink-0">
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

      {/* Navigation Tabs - Dinâmico e Unificado para Desktop e Mobile */}
      <div className="flex justify-center w-full">
        <nav className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 shadow-lg w-full max-w-3xl no-scrollbar gap-1 sm:gap-1.5 overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 text-[11px] sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
                <span className="inline sm:hidden truncate">{tab.mobileLabel || tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content com dupla verificação de segurança no Front-end */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'overview' && <FleetOverview />}
        {activeTab === 'rankings' && <RankingsView />}
        {activeTab === 'users' && isDeveloper && <UserManagement />}
        {activeTab === 'export' && <ExportReports />}
      </div>
    </div>
  );
};


