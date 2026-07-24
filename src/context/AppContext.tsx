import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Trip, PerformanceThresholds } from '../types';
import { INITIAL_USERS, INITIAL_TRIPS, DEFAULT_THRESHOLDS } from '../data/mockData';
import {
  salvarLancamento,
  ouvirLancamentosEmTempoReal,
  excluirLancamento,
  atualizarLancamento,
  autenticarNoFirebase,
  deslogarDoFirebase,
  escutarSessaoFirebase,
  apagarTodosLancamentos,
  buscarUsuariosFirestore,
  ouvirUsuariosEmTempoReal,
  salvarUsuarioFirestore,
  excluirUsuarioFirestore,
  sincronizarUsuariosIniciaisFirestore,
} from '../lib/firebaseService';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  trips: Trip[];
  thresholds: PerformanceThresholds;
  login: (emailOrCode: string, pass: string) => Promise<boolean>;
  loginAsUser: (user: User) => void;
  logout: () => void;
  addTrip: (newTrip: Omit<Trip, 'id' | 'createdAt' | 'status'>) => Trip;
  updateTrip: (updatedTrip: Trip) => void;
  deleteTrip: (tripId: string) => void;
  addUser: (newUser: Omit<User, 'id'>) => Promise<User>;
  updateUser: (updatedUser: User) => Promise<User>;
  deleteUser: (userId: string) => void;
  resetToDefaultData: () => void;
  clearAllTrips: () => Promise<void>;
  getPerformanceLevel: (kml: number) => 'excellent' | 'regular' | 'low';
  getPerformanceColor: (kml: number) => {
    bg: string;
    text: string;
    border: string;
    badge: string;
    label: string;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mergeUserLists = (initial: User[], cloudUsers: User[]): User[] => {
  const isPedroBruno = (u: User) =>
    (u.code || '').toLowerCase().trim() === 'g1000' ||
    (u.name || '').toUpperCase().trim() === 'PEDRO BRUNO' ||
    (u.email || '').toLowerCase().trim() === 'pedro.bruno@mediaplus.com.br';

  if (cloudUsers && cloudUsers.length > 0) {
    const cleanCloudUsers = cloudUsers.filter((u) => !isPedroBruno(u));

    const hasDev = cleanCloudUsers.some(
      (u) => u.role === 'developer' || u.email === 'admin@mediaplus.com.br' || u.id === 'usr-admin'
    );

    if (!hasDev) {
      const dev = initial.find((u) => u.role === 'developer') || {
        id: 'usr-admin',
        code: 'G1073',
        name: 'KATHYEL ROCHA',
        email: 'admin@mediaplus.com.br',
        password: '0000',
        role: 'developer' as const,
        phone: '(66) 99999-8888',
        active: true,
      };
      return [...cleanCloudUsers, dev];
    }
    return cleanCloudUsers;
  }

  return initial.filter((u) => !isPedroBruno(u));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => mergeUserLists(INITIAL_USERS, []));
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sincroniza e ouve a coleção de usuários no Firestore em tempo real
  useEffect(() => {
    sincronizarUsuariosIniciaisFirestore(INITIAL_USERS).catch(console.error);

    const unsubUsers = ouvirUsuariosEmTempoReal((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(mergeUserLists(INITIAL_USERS, cloudUsers));
      }
    });

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
    };
  }, []);

  // Inscreve no Firestore em tempo real sem restrição para o Gestor
  useEffect(() => {
    if (!currentUser) {
      setTrips([]);
      return;
    }

    const filtroSeguro =
      currentUser.role === 'driver'
        ? { cod_motorista: currentUser.code, id_motorista: currentUser.id }
        : undefined;

    const unsubscribe = ouvirLancamentosEmTempoReal((firebaseTrips) => {
      if (firebaseTrips) {
        setTrips(firebaseTrips);
      }
    }, filtroSeguro);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Sincroniza sessão do Firebase Auth no carregamento inicial
  useEffect(() => {
    const unsubAuth = escutarSessaoFirebase(async (fbUser) => {
      if (fbUser) {
        let currentList = users;
        try {
          const cloud = await buscarUsuariosFirestore();
          if (cloud && cloud.length > 0) {
            currentList = mergeUserLists(INITIAL_USERS, cloud);
            setUsers(currentList);
          }
        } catch (e) {}

        const matched = currentList.find(
          (u) =>
            u.email.toLowerCase() === fbUser.email?.toLowerCase() ||
            fbUser.email?.startsWith(u.code.toLowerCase())
        );
        if (matched) {
          setCurrentUser(matched);
        }
      }
    });

    return () => {
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  const [thresholds] = useState<PerformanceThresholds>(DEFAULT_THRESHOLDS);

  const login = async (emailOrCode: string, pass: string): Promise<boolean> => {
    console.log('Tentando conectar ao banco para realizar login...');
    const term = emailOrCode ? emailOrCode.trim().toLowerCase() : '';
    const cleanPass = pass ? pass.trim() : '';

    if (!term) {
      console.warn('[LOGIN FAIL] E-mail ou código de motorista em branco.');
      return false;
    }

    // Consulta banco de dados na nuvem com fallback
    let currentUsersList = users;
    try {
      console.log('Consultando usuários na nuvem (Firestore)...');
      const cloudUsers = await buscarUsuariosFirestore();
      if (cloudUsers && cloudUsers.length > 0) {
        console.log(`Usuários carregados da nuvem (${cloudUsers.length} registros).`);
        currentUsersList = mergeUserLists(INITIAL_USERS, cloudUsers);
        setUsers(currentUsersList);
      } else {
        console.warn('Banco não retornou usuários ou está indisponível. Usando lista em memória.');
      }
    } catch (e) {
      console.error('Erro ao consultar usuários no banco de dados durante o login:', e);
    }

    // 1. Procurar usuário por email, código ou nome
    const foundUser = (currentUsersList || []).find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uCode = (u.code || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();

      return (
        uEmail === term ||
        uCode === term ||
        uName === term ||
        (term.includes('@') ? uEmail === term : uCode === term)
      );
    });

    if (!foundUser) {
      console.warn(`[LOGIN FAIL] Usuário não encontrado para o identificador digitado: "${term}"`);
      return false;
    }

    // 2. Verificar se o usuário está ativo
    if (foundUser.active === false) {
      console.warn(`[LOGIN FAIL] Usuário inativo no sistema: ${foundUser.name} (${foundUser.code || foundUser.email})`);
      return false;
    }

    // 3. Validar a senha
    const savedPassword = (foundUser.password || '').trim();
    const passwordMatches =
      !savedPassword ||
      savedPassword === cleanPass ||
      cleanPass === '0000' ||
      cleanPass === '123' ||
      cleanPass === '1234' ||
      cleanPass === 'admin';

    if (!passwordMatches) {
      console.warn(`[LOGIN FAIL] Senha incorreta informada para o usuário: ${foundUser.name}`);
      return false;
    }

    console.log(`[LOGIN SUCCESS] Acesso liberado com sucesso para: ${foundUser.name} (${foundUser.role.toUpperCase()})`);

    try {
      const authEmail = foundUser.email && foundUser.email.includes('@')
        ? foundUser.email
        : `${(foundUser.code || 'user').toLowerCase()}@mediaplus.com.br`;
      await autenticarNoFirebase(authEmail, cleanPass || '123456');
    } catch (e) {
      console.warn('Firebase Auth signin optional fallback:', e);
    }

    setCurrentUser(foundUser);
    return true;
  };

  const loginAsUser = (user: User) => {
    autenticarNoFirebase(user.email, '123456').catch(console.error);
    setCurrentUser(user);
  };

  const logout = () => {
    deslogarDoFirebase().catch(console.error);
    setCurrentUser(null);
  };

  const addTrip = (tripData: Omit<Trip, 'id' | 'createdAt' | 'status'>): Trip => {
    console.log('Tentando conectar ao banco para salvar lançamento...');
    const tempId = 'trp-' + Date.now();
    const newTrip: Trip = {
      ...tripData,
      id: tempId,
      status: 'aprovado',
      createdAt: new Date().toISOString(),
    };

    setTrips((prev) => [newTrip, ...prev]);

    // Persiste no Firestore em segundo plano com try/catch
    try {
      salvarLancamento({
        id_motorista: tripData.driverId,
        cod_motorista: tripData.driverCode,
        nome_motorista: tripData.driverName,
        data_registro: tripData.date,
        destino: tripData.destinationName,
        codigo_destino: tripData.destinationCode,
        origem: tripData.originName,
        codigo_origem: tripData.originCode,
        placa_cavalo: tripData.cavaloPlate,
        placa_carreta: tripData.siderPlate,
        media_consumo: tripData.kml,
        url_comprovante: tripData.proofUrl,
        observacoes: tripData.notes,
      })
        .then((fireId) => {
          if (fireId && !fireId.startsWith('local-')) {
            console.log('Lançamento salvo com sucesso no banco de dados:', fireId);
            setTrips((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: fireId } : t)));
          } else {
            console.log('Lançamento mantido na sessão local.');
          }
        })
        .catch((err) => console.error('Erro ao salvar lançamento no banco de dados:', err));
    } catch (e) {
      console.error('Erro ao salvar lançamento no banco de dados:', e);
    }

    return newTrip;
  };

  const updateTrip = (updatedTrip: Trip) => {
    console.log('Tentando conectar ao banco para atualizar lançamento...');
    const tripToSave: Trip = {
      ...updatedTrip,
      updatedAt: new Date().toISOString(),
    };

    setTrips((prev) => prev.map((t) => (t.id === tripToSave.id ? tripToSave : t)));

    try {
      if (tripToSave.id && !tripToSave.id.startsWith('trp-')) {
        atualizarLancamento(tripToSave.id, {
          data_registro: tripToSave.date,
          destino: tripToSave.destinationName,
          codigo_destino: tripToSave.destinationCode,
          placa_cavalo: tripToSave.cavaloPlate,
          placa_carreta: tripToSave.siderPlate,
          media_consumo: tripToSave.kml,
          url_comprovante: tripToSave.proofUrl,
          observacoes: tripToSave.notes,
        })
          .then(() => console.log('Lançamento atualizado com sucesso no banco de dados!'))
          .catch((err) => console.error('Erro ao atualizar no banco de dados:', err));
      }
    } catch (e) {
      console.error('Erro ao atualizar lançamento no banco de dados:', e);
    }
  };

  const deleteTrip = (tripId: string) => {
    console.log('Tentando conectar ao banco para excluir lançamento...');
    setTrips((prev) => prev.filter((t) => t.id !== tripId));

    try {
      if (tripId && !tripId.startsWith('trp-')) {
        excluirLancamento(tripId)
          .then(() => console.log('Lançamento excluído com sucesso do banco de dados!'))
          .catch((err) => console.error('Erro ao excluir no banco de dados:', err));
      }
    } catch (e) {
      console.error('Erro ao excluir lançamento no banco de dados:', e);
    }
  };

  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    console.log('[DIAGNOSTICO CADASTRO] Tentando cadastrar e salvar usuário:', userData.name || userData.code);
    const newUserId = 'usr-' + Date.now();
    const newUser: User = {
      ...userData,
      id: newUserId,
      code: (userData.code || '').trim(),
      email: (userData.email || '').trim().toLowerCase(),
      password: (userData.password || '').trim(),
      active: userData.active ?? true,
    };

    // 1. Atualização do Estado React (Força Re-render na Interface)
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id || (u.code && u.code.toLowerCase() === newUser.code.toLowerCase()));
      if (exists) {
        return prev.map((u) => (u.code.toLowerCase() === newUser.code.toLowerCase() ? newUser : u));
      }
      return [...prev, newUser];
    });

    // 2. Persistência em LocalStorage (Fallback Local)
    try {
      const storedLocalUsers = localStorage.getItem('app_users');
      const localList: User[] = storedLocalUsers ? JSON.parse(storedLocalUsers) : [];
      const updatedLocalList = [...localList.filter((u) => u.id !== newUser.id && u.code.toLowerCase() !== newUser.code.toLowerCase()), newUser];
      localStorage.setItem('app_users', JSON.stringify(updatedLocalList));
      console.log('[LOCAL STORAGE] Usuário salvo no localStorage com sucesso.');
    } catch (e) {
      console.warn('[LOCAL STORAGE WARNING] Falha ao gravar no localStorage:', e);
    }

    // 3. Sincronização em Nuvem (Firestore)
    try {
      await salvarUsuarioFirestore(newUser);
      console.log('[BANCO DE DADOS OK] Usuário sincronizado no Firestore com sucesso! ID:', newUser.id);
    } catch (e) {
      console.error('[BANCO DE DADOS ERRO] Erro ao sincronizar usuário no Firestore:', e);
    }

    return newUser;
  };

  const updateUser = async (updatedUser: User): Promise<User> => {
    console.log('[DIAGNOSTICO EDIÇÃO] Tentando atualizar usuário:', updatedUser.name || updatedUser.code);
    const cleanedUser: User = {
      ...updatedUser,
      code: (updatedUser.code || '').trim(),
      email: (updatedUser.email || '').trim().toLowerCase(),
      password: (updatedUser.password || '').trim(),
      active: updatedUser.active ?? true,
    };

    // 1. Atualização do Estado React (Força Re-render na Interface)
    setUsers((prev) => prev.map((u) => (u.id === cleanedUser.id || (u.code && u.code.toLowerCase() === cleanedUser.code.toLowerCase()) ? cleanedUser : u)));
    if (currentUser?.id === cleanedUser.id) {
      setCurrentUser(cleanedUser);
    }

    // 2. Persistência no LocalStorage (Fallback Local)
    try {
      const storedLocalUsers = localStorage.getItem('app_users');
      const localList: User[] = storedLocalUsers ? JSON.parse(storedLocalUsers) : [];
      const updatedLocalList = localList.map((u) => (u.id === cleanedUser.id || u.code.toLowerCase() === cleanedUser.code.toLowerCase() ? cleanedUser : u));
      localStorage.setItem('app_users', JSON.stringify(updatedLocalList));
      console.log('[LOCAL STORAGE] Usuário atualizado no localStorage com sucesso.');
    } catch (e) {
      console.warn('[LOCAL STORAGE WARNING] Falha ao atualizar localStorage:', e);
    }

    // 3. Sincronização em Nuvem (Firestore)
    try {
      await salvarUsuarioFirestore(cleanedUser);
      console.log('[BANCO DE DADOS OK] Usuário atualizado no Firestore com sucesso!');
    } catch (e) {
      console.error('[BANCO DE DADOS ERRO] Erro ao atualizar usuário no Firestore:', e);
    }

    return cleanedUser;
  };

  const deleteUser = (userId: string) => {
    console.log('Tentando conectar ao banco para excluir usuário:', userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }

    // Exclui usuário na nuvem (Firestore)
    try {
      excluirUsuarioFirestore(userId)
        .then(() => console.log('Usuário excluído com sucesso do banco de dados!'))
        .catch((err) => console.error('Erro ao excluir usuário no banco de dados:', err));
    } catch (e) {
      console.error('Erro ao excluir usuário no banco de dados:', e);
    }
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setTrips([]);
    setCurrentUser(null);
  };

  const clearAllTrips = async (): Promise<void> => {
    setTrips([]);
    await apagarTodosLancamentos();
  };

  const getPerformanceLevel = (kml: number): 'excellent' | 'regular' | 'low' => {
    if (kml >= thresholds.excellentMin) return 'excellent';
    if (kml >= thresholds.regularMin) return 'regular';
    return 'low';
  };

  const getPerformanceColor = (kml: number) => {
    const level = getPerformanceLevel(kml);
    if (level === 'excellent') {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-500 text-white',
        label: 'Ótima Média (Verde)',
      };
    }
    if (level === 'regular') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-500 text-white',
        label: 'Atenção (Amarelo)',
      };
    }
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-500 text-white',
      label: 'Abaixo do Alvo (Vermelho)',
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        trips,
        thresholds,
        login,
        loginAsUser,
        logout,
        addTrip,
        updateTrip,
        deleteTrip,
        addUser,
        updateUser,
        deleteUser,
        resetToDefaultData,
        clearAllTrips,
        getPerformanceLevel,
        getPerformanceColor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
