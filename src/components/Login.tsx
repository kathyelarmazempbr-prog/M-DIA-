import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Lock, User as UserIcon, LogIn, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, users, loginAsUser } = useApp();
  const [identifier, setIdentifier] = useState('9013');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(identifier, password);
    if (!success) {
      setError('Usuário ou senha incorretos. Informe seu e-mail ou código (ex: 9013) com senha "123" ou utilize os atalhos abaixo.');
    }
  };

  const drivers = users.filter((u) => u.role === 'driver');
  const admins = users.filter((u) => u.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-4">
            <Truck className="h-10 w-10 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            <span>MÉDIA</span>
            <span className="text-emerald-600">+</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Controle de consumo de combustível para frotas & motoristas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Acessar o Sistema</h2>
          <p className="text-xs text-slate-500 mb-6">Informe seu login ou código de motorista para entrar.</p>

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                E-mail ou Código de Motorista
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: 9013 ou aluisio.almeida@mediaplus.com.br"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-sm font-bold text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4 stroke-[2.5]" />
              <span>Entrar no Sistema</span>
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Atalhos Rápidos de Acesso (Demo)</span>
              <span className="text-[10px] text-emerald-600 font-normal">Toque para entrar</span>
            </p>

            {/* Admin shortcut */}
            <div className="mb-3">
              <p className="text-[11px] text-slate-500 font-medium mb-1.5">Módulo Gerencial (Admin / Gestor):</p>
              {admins.map((adm) => (
                <button
                  key={adm.id}
                  onClick={() => loginAsUser(adm)}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-50 hover:bg-emerald-50 p-2.5 text-xs text-slate-800 border border-slate-200 hover:border-emerald-200 transition-all text-left mb-1.5 group"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-slate-900">{adm.name}</span>
                      <span className="block text-[10px] text-slate-500">Gestor de Frota</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Drivers shortcut list */}
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1.5">Motoristas Cadastrados (Mobile):</p>
              <div className="grid grid-cols-1 gap-1.5">
                {drivers.map((drv) => (
                  <button
                    key={drv.id}
                    onClick={() => loginAsUser(drv)}
                    className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-2 text-xs text-slate-700 border border-slate-200 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-medium text-slate-800">{drv.name}</span>
                      <span className="text-[10px] text-slate-400">({drv.code})</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Entrar →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© 2026 média+ • Sistema Inteligente de Média de Combustível</p>
        </div>
      </div>
    </div>
  );
};
