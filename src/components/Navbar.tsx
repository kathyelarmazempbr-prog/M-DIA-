import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, ShieldCheck, UserCheck, LogOut, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, users, loginAsUser, logout, resetToDefaultData } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  const isManager = currentUser.role === 'admin';

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
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all border border-slate-200/80 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  {isManager ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-amber-600" />
                  )}
                  <div className="text-left hidden xs:block">
                    <span className="block font-bold leading-tight text-slate-900">{currentUser.name.split(' ')[0]}</span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {isManager ? 'Gestor de Frota' : `Motorista ${currentUser.code}`}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Selector Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2 text-slate-800 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trocar de Usuário (Demonstração)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Alterne entre perfis de motoristas e gestor instantaneamente:</p>
                  </div>

                  <div className="mt-1 max-h-60 overflow-y-auto space-y-1 py-1">
                    {users.map((usr) => {
                      const isSel = usr.id === currentUser.id;
                      return (
                        <button
                          key={usr.id}
                          onClick={() => {
                            loginAsUser(usr);
                            setShowUserMenu(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                            isSel
                              ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-800">{usr.name}</div>
                            <div className="text-[10px] text-slate-500">{usr.role === 'admin' ? 'Gestor de Frota' : `Cód: ${usr.code}`}</div>
                          </div>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              usr.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {usr.role === 'admin' ? 'GESTOR' : 'MOTORISTA'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                    <button
                      onClick={() => {
                        resetToDefaultData();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors py-1 px-2 rounded-lg hover:bg-amber-50 font-medium"
                      title="Restaurar dados originais de fábrica"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Resetar Dados</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50 font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
