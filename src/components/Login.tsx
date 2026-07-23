import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Lock, User as UserIcon, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(identifier, password);
      if (!success) {
        setError('Usuário ou senha incorretos. Informe seu e-mail ou código de motorista.');
      }
    } catch (err) {
      setError('Erro ao realizar login no Firebase Auth.');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-xs text-slate-500 mb-6">Informe seu e-mail ou código de motorista e senha para entrar.</p>

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
                  placeholder="Ex: 9013 ou seu.email@empresa.com.br"
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
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-sm font-bold text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4 stroke-[2.5]" />
              <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© 2026 média+ • Sistema Inteligente de Média de Combustível</p>
        </div>
      </div>
    </div>
  );
};
