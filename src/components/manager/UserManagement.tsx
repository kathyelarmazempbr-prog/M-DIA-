import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { UserPlus, Edit2, Key, ShieldCheck, UserCheck, Trash2, Check, X, Lock, Phone } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const [cavaloPadrao, setCavaloPadrao] = useState('');
  const [siderPadrao, setSiderPadrao] = useState('');
  const [targetKml, setTargetKml] = useState('2.60');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  const openNewUserModal = () => {
    setEditingUser(null);
    setName('');
    setCode(`MOT-${100 + users.length + 1}`);
    setEmail('');
    setPassword('123456');
    setRole('driver');
    setCavaloPadrao('');
    setSiderPadrao('');
    setTargetKml('2.60');
    setPhone('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditUserModal = (usr: User) => {
    setEditingUser(usr);
    setName(usr.name);
    setCode(usr.code);
    setEmail(usr.email);
    setPassword(usr.password || '123456');
    setRole(usr.role);
    setCavaloPadrao(usr.cavaloPadrao || '');
    setSiderPadrao(usr.siderPadrao || '');
    setTargetKml(usr.targetKml ? String(usr.targetKml) : '2.60');
    setPhone(usr.phone || '');
    setActive(usr.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      updateUser({
        ...editingUser,
        name,
        code,
        email,
        password,
        role,
        cavaloPadrao,
        siderPadrao,
        targetKml: parseFloat(targetKml) || 2.60,
        phone,
        active,
      });
    } else {
      addUser({
        name,
        code,
        email,
        password,
        role,
        cavaloPadrao,
        siderPadrao,
        targetKml: parseFloat(targetKml) || 2.80,
        phone,
        active,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span>Gestão de Usuários e Permissões (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre novos motoristas ou gerentes, redefina senhas e gerencie acessos ao sistema.
          </p>
        </div>

        <button
          onClick={openNewUserModal}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4 stroke-[2.5]" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Código / Usuário</th>
                <th className="py-3 px-4">Perfil / Função</th>
                <th className="py-3 px-4">E-mail de Login</th>
                <th className="py-3 px-4">Cavalo / Sider Padrão</th>
                <th className="py-3 px-4 text-center">Meta (km/l)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-sm">{usr.name}</div>
                    <div className="text-[10px] text-emerald-600 font-mono font-semibold">{usr.code}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        usr.role === 'admin'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {usr.role === 'admin' ? (
                        <>
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Supervisor</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3 text-amber-600" />
                          <span>Motorista</span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">{usr.email}</td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {usr.cavaloPadrao ? (
                      <span>
                        Cavalo: <strong className="text-slate-800">{usr.cavaloPadrao}</strong> | Sider:{' '}
                        <strong className="text-slate-800">{usr.siderPadrao || 'N/A'}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                    {usr.targetKml ? `${usr.targetKml.toFixed(2)} km/l` : '—'}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        usr.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {usr.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditUserModal(usr)}
                        className="p-1.5 rounded-lg bg-slate-100 text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Editar Usuário & Alterar Senha"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {currentUser?.id !== usr.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o usuário ${usr.name}?`)) {
                              deleteUser(usr.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full rounded-2xl bg-white p-6 text-slate-800 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <span>{editingUser ? 'Editar Usuário / Alterar Senha' : 'Cadastrar Novo Usuário'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Pedro Henrique Silva"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Código (Cód Motorista) *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="Ex: MOT-106 ou ADM-002"
                    className="w-full uppercase font-mono rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">E-mail de Login *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@mediaplus.com.br"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Senha de Acesso *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Senha do usuário"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Perfil de Acesso (RBAC) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  >
                    <option value="driver">Motorista (Acesso restrito próprio)</option>
                    <option value="admin">Gestor de Frota (Acesso total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(66) 99999-8888"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {role === 'driver' && (
                <>
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Cavalo Padrão</label>
                      <input
                        type="text"
                        value={cavaloPadrao}
                        onChange={(e) => setCavaloPadrao(e.target.value.toUpperCase())}
                        placeholder="Ex: RLK-4A21"
                        className="w-full uppercase font-mono rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Sider Padrão</label>
                      <input
                        type="text"
                        value={siderPadrao}
                        onChange={(e) => setSiderPadrao(e.target.value.toUpperCase())}
                        placeholder="Ex: SDR-1010"
                        className="w-full uppercase font-mono rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Meta (km/l)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={targetKml}
                        onChange={(e) => setTargetKml(e.target.value)}
                        placeholder="2.85"
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-emerald-700 font-bold focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="activeCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Usuário Ativo no Sistema
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
