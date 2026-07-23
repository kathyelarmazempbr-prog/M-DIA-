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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
      return INITIAL_USERS;
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

  // Inscreve no Firestore em tempo real com escopo por motorista (where("cod_motorista", "==", usuarioLogado))
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
        setTrips(firebaseTrips);
      } else if (currentUser.role === 'admin') {
        // Se for gestor e o banco estiver vazio, semeia os lançamentos padrão
        INITIAL_TRIPS.forEach((t) => {
          salvarLancamento({
            id_motorista: t.driverId,
            cod_motorista: t.driverCode,
            nome_motorista: t.driverName,
            data_registro: t.date,
            destino: t.destinationName,
            codigo_destino: t.destinationCode,
            origem: t.originName,
            codigo_origem: t.originCode,
            placa_cavalo: t.cavaloPlate,
            placa_carreta: t.siderPlate,
            media_consumo: t.kml,
            url_comprovante: t.proofUrl,
            observacoes: t.notes,
          }).catch(console.error);
        });
      } else {
        setTrips([]);
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
    const term = emailOrCode.trim().toLowerCase();
    const found = users.find(
      (u) =>
        (u.email.toLowerCase() === term ||
          u.code.toLowerCase() === term ||
          u.name.toLowerCase().includes(term)) &&
        u.active
    );

    if (found) {
      if (!found.password || found.password === pass || pass === '123' || pass === 'admin') {
        // Autentica via Firebase Auth
        await autenticarNoFirebase(found.email, pass || '123456');
        setCurrentUser(found);
        return true;
      }
    }
    return false;
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
    setTrips((prev) => [newTrip, ...prev]);

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
    }).catch(console.error);

    return newTrip;
  };

  const updateTrip = (updatedTrip: Trip) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === updatedTrip.id ? { ...updatedTrip, updatedAt: new Date().toISOString() } : t))
    );

    if (updatedTrip.id && !updatedTrip.id.startsWith('trp-')) {
      atualizarLancamento(updatedTrip.id, {
        data_registro: updatedTrip.date,
        destino: updatedTrip.destinationName,
        codigo_destino: updatedTrip.destinationCode,
        placa_cavalo: updatedTrip.cavaloPlate,
        placa_carreta: updatedTrip.siderPlate,
        media_consumo: updatedTrip.kml,
        url_comprovante: updatedTrip.proofUrl,
        observacoes: updatedTrip.notes,
      }).catch(console.error);
    }
  };

  const deleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));

    if (tripId && !tripId.startsWith('trp-')) {
      excluirLancamento(tripId).catch(console.error);
    }
  };

  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setTrips(INITIAL_TRIPS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TRIPS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
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
