import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NewTripForm } from './NewTripForm';
import { TripHistory } from './TripHistory';
import { DriverStats } from './DriverStats';
import { PlusCircle, History, LineChart } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'novo' | 'historico' | 'desempenho'>('novo');

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-12 pt-2">
      {/* Navigation Tabs (Big touch targets for mobile drivers) */}
      <div className="flex justify-center">
        <nav className="inline-flex rounded-xl bg-white p-1.5 border border-slate-200/80 shadow-xs w-full max-w-xl">
          <button
            onClick={() => setActiveTab('novo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'novo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="h-4 w-4 stroke-[2.2]" />
            <span>Novo Lançamento</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'historico'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="h-4 w-4 stroke-[2.2]" />
            <span>Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('desempenho')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'desempenho'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LineChart className="h-4 w-4 stroke-[2.2]" />
            <span>Desempenho</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'novo' && <NewTripForm onSuccess={() => setActiveTab('historico')} />}
        {activeTab === 'historico' && <TripHistory />}
        {activeTab === 'desempenho' && <DriverStats />}
      </div>
    </div>
  );
};

