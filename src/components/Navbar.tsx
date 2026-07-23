import React from 'react';
import { useApp } from '../context/AppContext';
import { Truck, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  const isManager = currentUser.role !== 'driver';

  const roleLabel =
    currentUser.role === 'developer'
      ? 'DESENVOLVEDOR'
      : isManager
      ? 'SUPERVISOR'
      : `Cód. Motorista: ${currentUser.code}`;

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 shadow-xs border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-slate-900">MÉDIA</span>
                <span className="text-xl font-bold text-emerald-600">+</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isManager ? 'Painel Gerencial de Frota' : 'Controle do Motorista'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fixed Static User Indicator */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                {isManager ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <div className="text-left">
                  <span className="block font-bold leading-tight text-slate-900">{currentUser.name}</span>
                  <span className="block text-[10px] text-slate-500 font-medium">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-3 py-2 text-xs font-bold transition-all border border-slate-200/80 hover:border-rose-200 shadow-xs"
              title="Sair da Conta"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
