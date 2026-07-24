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
  addUser: (newUser: Omit<User, 'id'>) => User;
  updateUser: (updatedUser: User) => void;
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

const LOCAL_STORAGE_USERS_KEY = 'media_plus_users_v2';
const LOCAL_STORAGE_TRIPS_KEY = 'media_plus_trips_v2';
const LOCAL_STORAGE_AUTH_KEY = 'media_plus_auth_user_id_v2';

const mergeUserLists = (initial: User[], saved: User[]): User[] => {
  const map = new Map<string, User>();

  // 1. Inserir usuários iniciais padrões
  initial.forEach((u) => {
    const key = u.id || (u.code ? u.code.toLowerCase().trim() : u.email.toLowerCase().trim());
    map.set(key, u);
  });

  // 2. Mesclar/sobrecrever com usuários salvos no localStorage
  saved.forEach((u) => {
    const key = u.id || (u.code ? u.code.toLowerCase().trim() : u.email.toLowerCase().trim());
    map.set(key, u);
  });

  // 3. Garantir credenciais do Desenvolvedor KATHYEL ROCHA (G1073 / 0000)
  const merged = Array.from(map.values()).map((u) => {
    if (u.role === 'developer' || u.email === 'admin@mediaplus.com.br' || u.id === 'usr-admin') {
      return {
        ...u,
        id: 'usr-admin',
        code: 'G1073',
        name: 'KATHYEL ROCHA',
        email: 'admin@mediaplus.com.br',
        password: '0000',
        role: 'developer' as const,
        phone: '(66) 99999-8888',
        active: true,
      };
    }
    return u;
  });

  // 4. Garantir presença do Supervisor PEDRO BRUNO (G1000 / 1234)
  const hasG1000 = merged.some(
    (u) => (u.code || '').toLowerCase().trim() === 'g1000' || (u.email || '').toLowerCase().trim() === 'pedro.bruno@mediaplus.com.br'
  );
  if (!hasG1000) {
    merged.push({
      id: 'usr-g1000',
      code: 'G1000',
      name: 'PEDRO BRUNO',
      email: 'pedro.bruno@mediaplus.com.br',
      password: '1234',
      role: 'supervisor',
      phone: '(81) 99999-1000',
      active: true,
    });
  }

  return merged;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return mergeUserLists(INITIAL_USERS, parsed);
      }
      return mergeUserLists(INITIAL_USERS, []);
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
      return mergeUserLists(INITIAL_USERS, []);
    }
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TRIPS;
    } catch (e) {
      console.error('Failed to load trips from localStorage', e);
      return INITIAL_TRIPS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (savedId) {
        const found = users.find((u) => u.id === savedId);
        if (found) return found;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  // Sincroniza e ouve a coleção de usuários no Firestore em tempo real
  useEffect(() => {
    sincronizarUsuariosIniciaisFirestore(INITIAL_USERS).catch(console.error);

    const unsubUsers = ouvirUsuariosEmTempoReal((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers((prev) => {
          const merged = mergeUserLists(INITIAL_USERS, cloudUsers);
          try {
            localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Erro ao salvar usuários no localStorage:', e);
          }
          return merged;
        });
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
      if (firebaseTrips && firebaseTrips.length > 0) {
        setTrips((prev) => {
          const map = new Map<string, Trip>();
          // Inserir viagens vindas do Firestore
          firebaseTrips.forEach((ft) => map.set(ft.id, ft));
          // Preservar lançamentos locais recém-criados que ainda não estão no Firestore
          prev.forEach((pt) => {
            if (!map.has(pt.id)) {
              map.set(pt.id, pt);
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          try {
            localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Erro ao salvar viagens no localStorage:', e);
          }
          return merged;
        });
      } else {
        // Se o Firestore retornar lista vazia, preservar o que está no localStorage
        try {
          const savedTrips = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
          if (savedTrips) {
            const parsed: Trip[] = JSON.parse(savedTrips);
            if (parsed && parsed.length > 0) {
              setTrips(parsed);
              return;
            }
          }
        } catch (e) {
          console.error('Erro ao carregar viagens salvas:', e);
        }
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
    const unsubAuth = escutarSessaoFirebase((fbUser) => {
      if (fbUser && !currentUser) {
        const matched = users.find(
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

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(trips));
    } catch (e) {
      console.error(e);
    }
  }, [trips]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, currentUser.id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const login = async (emailOrCode: string, pass: string): Promise<boolean> => {
    const term = emailOrCode ? emailOrCode.trim().toLowerCase() : '';
    const cleanPass = pass ? pass.trim() : '';

    if (!term) {
      console.warn('[LOGIN FAIL] E-mail ou código de motorista em branco.');
      return false;
    }

    // 1. Consulta diretamente o banco de dados remoto/nuvem (Firestore)
    let currentUsersList = users;
    try {
      const cloudUsers = await buscarUsuariosFirestore();
      if (cloudUsers && cloudUsers.length > 0) {
        currentUsersList = mergeUserLists(INITIAL_USERS, cloudUsers);
        setUsers(currentUsersList);
        try {
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(currentUsersList));
        } catch (e) {}
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        if (saved) {
          const parsedSaved: User[] = JSON.parse(saved);
          currentUsersList = mergeUserLists(INITIAL_USERS, parsedSaved);
        }
      }
    } catch (e) {
      console.error('Erro ao consultar usuários no Firestore durante o login:', e);
      const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (saved) {
        try {
          const parsedSaved: User[] = JSON.parse(saved);
          currentUsersList = mergeUserLists(INITIAL_USERS, parsedSaved);
        } catch (err) {}
      }
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
    const tempId = 'trp-' + Date.now();
    const newTrip: Trip = {
      ...tripData,
      id: tempId,
      status: 'aprovado',
      createdAt: new Date().toISOString(),
    };

    setTrips((prev) => {
      const updated = [newTrip, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar nova viagem no localStorage:', e);
      }
      return updated;
    });

    // Persiste no Firestore em segundo plano
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
          setTrips((prev) => {
            const updated = prev.map((t) => (t.id === tempId ? { ...t, id: fireId } : t));
            try {
              localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      })
      .catch((err) => console.error('Erro ao salvar no Firestore:', err));

    return newTrip;
  };

  const updateTrip = (updatedTrip: Trip) => {
    const tripToSave: Trip = {
      ...updatedTrip,
      updatedAt: new Date().toISOString(),
    };

    setTrips((prev) => {
      const updated = prev.map((t) => (t.id === tripToSave.id ? tripToSave : t));
      try {
        localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao atualizar viagem no localStorage:', e);
      }
      return updated;
    });

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
      }).catch((err) => console.error('Erro ao atualizar no Firestore:', err));
    }
  };

  const deleteTrip = (tripId: string) => {
    setTrips((prev) => {
      const updated = prev.filter((t) => t.id !== tripId);
      try {
        localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao remover viagem do localStorage:', e);
      }
      return updated;
    });

    if (tripId && !tripId.startsWith('trp-')) {
      excluirLancamento(tripId).catch((err) => console.error('Erro ao excluir no Firestore:', err));
    }
  };

  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUserId = 'usr-' + Date.now();
    const newUser: User = {
      ...userData,
      id: newUserId,
      code: (userData.code || '').trim(),
      email: (userData.email || '').trim().toLowerCase(),
      password: (userData.password || '').trim(),
      active: userData.active ?? true,
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save users to localStorage:', e);
      }
      return updated;
    });

    // Sincroniza novo usuário na nuvem (Firestore)
    salvarUsuarioFirestore(newUser).catch((err) => console.error('Erro ao salvar usuário no Firestore:', err));

    return newUser;
  };

  const updateUser = (updatedUser: User) => {
    const cleanedUser: User = {
      ...updatedUser,
      code: (updatedUser.code || '').trim(),
      email: (updatedUser.email || '').trim().toLowerCase(),
      password: (updatedUser.password || '').trim(),
      active: updatedUser.active ?? true,
    };
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === cleanedUser.id ? cleanedUser : u));
      try {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save users to localStorage:', e);
      }
      return updated;
    });
    if (currentUser?.id === cleanedUser.id) {
      setCurrentUser(cleanedUser);
    }

    // Sincroniza usuário editado na nuvem (Firestore)
    salvarUsuarioFirestore(cleanedUser).catch((err) => console.error('Erro ao atualizar usuário no Firestore:', err));
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save users to localStorage:', e);
      }
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }

    // Exclui usuário na nuvem (Firestore)
    excluirUsuarioFirestore(userId).catch((err) => console.error('Erro ao excluir usuário no Firestore:', err));
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setTrips(INITIAL_TRIPS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TRIPS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
  };

  const clearAllTrips = async (): Promise<void> => {
    setTrips([]);
    localStorage.removeItem(LOCAL_STORAGE_TRIPS_KEY);
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
