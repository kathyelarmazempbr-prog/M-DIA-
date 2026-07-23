import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NewTripForm } from './NewTripForm';
import { TripHistory } from './TripHistory';
import { DriverStats } from './DriverStats';
import { PlusCircle, History, LineChart, Truck, Fuel } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'novo' | 'historico' | 'desempenho'>('novo');

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Driver Welcome Header Card */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md shadow-emerald-600/20">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{currentUser.name}</h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                {currentUser.code}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Big touch targets for mobile drivers) */}
      <div className="flex justify-center">
        <nav className="inline-flex rounded-xl bg-white p-1.5 border border-slate-100 shadow-xs w-full max-w-xl">
          <button
            onClick={() => setActiveTab('novo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'novo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
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
            <History className="h-4 w-4" />
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
            <LineChart className="h-4 w-4" />
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
