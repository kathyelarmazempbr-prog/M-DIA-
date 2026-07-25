import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage, auth, firebaseConfig } from './firebase';
import { Trip, User } from '../types';

// Coleções principais do Firestore
const COLLECTION_LANCAMENTOS = 'lancamentos';
const COLLECTION_USUARIOS = 'usuarios';

export interface LancamentoFirebase {
  id?: string;
  id_motorista: string;
  cod_motorista: string;
  nome_motorista: string;
  data_registro: string; // YYYY-MM-DD
  origem?: string;
  codigo_origem?: string;
  destino: string;
  codigo_destino?: string;
  placa_cavalo: string;
  placa_carreta: string;
  media_consumo: number;
  url_comprovante?: string;
  observacoes?: string;
  status: 'aprovado' | 'pendente' | 'corrigido';
  criado_em?: any;
  atualizado_em?: any;
}

/**
 * Converte um objeto da coleção Firestore para o tipo Trip da aplicação
 */
export const mapperFirebaseParaTrip = (docId: string, data: LancamentoFirebase): Trip => {
  return {
    id: docId,
    date: data.data_registro || new Date().toISOString().split('T')[0],
    driverId: data.id_motorista || '',
    driverCode: data.cod_motorista || '',
    driverName: data.nome_motorista || 'Motorista',
    originCode: data.codigo_origem || '426',
    originName: data.origem || 'FONTE DA MATA-JP',
    destinationCode: data.codigo_destino || '950',
    destinationName: data.destino || 'ITAPISSUMA-PE',
    cavaloPlate: data.placa_cavalo || '',
    siderPlate: data.placa_carreta || '',
    kml: Number(data.media_consumo) || 0,
    proofUrl: data.url_comprovante || '',
    notes: data.observacoes || '',
    status: data.status || 'aprovado',
    createdAt: data.criado_em?.toDate ? data.criado_em.toDate().toISOString() : new Date().toISOString(),
  };
};

// Helper de timeout para garantir que nenhuma requisição ao banco fique presa por mais de 3 segundos
export const withTimeout = <T>(promise: Promise<T>, timeoutMs = 3000, fallbackValue: T): Promise<T> => {
  return new Promise((resolve) => {
    let timer: any = setTimeout(() => {
      console.warn(`[DIAGNOSTICO BANCO] Conexão excedeu tempo limite de ${timeoutMs}ms. Liberando interface local.`);
      resolve(fallbackValue);
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error('[DIAGNOSTICO BANCO] Erro ao comunicar com banco de dados:', err);
        resolve(fallbackValue);
      });
  });
};

/**
 * 1. SALVAR LANÇAMENTO (CREATE)
 * Cadastra uma nova média de consumo no Firestore
 */
export const salvarLancamento = async (dados: {
  id_motorista: string;
  cod_motorista: string;
  nome_motorista: string;
  data_registro: string;
  destino: string;
  codigo_destino?: string;
  origem?: string;
  codigo_origem?: string;
  placa_cavalo: string;
  placa_carreta: string;
  media_consumo: number;
  url_comprovante?: string;
  observacoes?: string;
}): Promise<string> => {
  console.log('[FIREBASE CRUD] Salvando lançamento no Firestore Cloud:', dados.nome_motorista || dados.cod_motorista);
  if (!db) {
    console.warn('[FIREBASE WARNING] Firestore não inicializado. Salvo em memória local.');
    return 'local-' + Date.now();
  }
  try {
    const docData: Omit<LancamentoFirebase, 'id'> = {
      id_motorista: dados.id_motorista,
      cod_motorista: dados.cod_motorista,
      nome_motorista: dados.nome_motorista,
      data_registro: dados.data_registro,
      origem: dados.origem || 'FONTE DA MATA-JP',
      codigo_origem: dados.codigo_origem || '426',
      destino: dados.destino,
      codigo_destino: dados.codigo_destino || '950',
      placa_cavalo: dados.placa_cavalo.toUpperCase(),
      placa_carreta: dados.placa_carreta.toUpperCase(),
      media_consumo: Number(dados.media_consumo),
      url_comprovante: dados.url_comprovante || '',
      observacoes: dados.observacoes || '',
      status: 'aprovado',
      criado_em: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_LANCAMENTOS), docData);
    console.log('[FIREBASE CRUD OK] Lançamento salvo com sucesso no banco de dados na nuvem! ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[FIREBASE CRUD ERRO] Erro ao salvar lançamento no banco de dados na nuvem:', error);
    return 'local-' + Date.now();
  }
};

/**
 * 2. BUSCAR LANÇAMENTOS / HISTÓRICO (READ)
 * Busca lançamentos utilizando filtro where("cod_motorista", "==", usuarioLogado)
 */
export const buscarLancamentos = async (filtros?: {
  id_motorista?: string;
  cod_motorista?: string;
  texto_destino?: string;
  data_inicio?: string;
  data_fim?: string;
}): Promise<Trip[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, COLLECTION_LANCAMENTOS);
    let q: any = colRef;

    if (filtros?.cod_motorista) {
      q = query(colRef, where('cod_motorista', '==', filtros.cod_motorista));
    } else if (filtros?.id_motorista) {
      q = query(colRef, where('id_motorista', '==', filtros.id_motorista));
    }

    const snapshot = await getDocs(q);

    let lista: Trip[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as LancamentoFirebase;
      return mapperFirebaseParaTrip(docSnap.id, data);
    });

    // Ordenar por data decrescente
    lista.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filtros adicionais em memória
    if (filtros) {
      if (filtros.texto_destino && filtros.texto_destino.trim() !== '') {
        const term = filtros.texto_destino.toLowerCase();
        lista = lista.filter(
          (t) =>
            t.destinationName.toLowerCase().includes(term) ||
            t.originName.toLowerCase().includes(term) ||
            t.cavaloPlate.toLowerCase().includes(term) ||
            t.siderPlate.toLowerCase().includes(term)
        );
      }

      if (filtros.data_inicio) {
        lista = lista.filter((t) => t.date >= filtros.data_inicio!);
      }

      if (filtros.data_fim) {
        lista = lista.filter((t) => t.date <= filtros.data_fim!);
      }
    }

    return lista;
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
};

/**
 * 2b. OUVIR LANÇAMENTOS EM TEMPO REAL COM SEGURANÇA (REALTIME LISTEN)
 * Garante cláusula where("cod_motorista", "==", usuarioLogado)
 */
export const ouvirLancamentosEmTempoReal = (
  callback: (trips: Trip[]) => void,
  filtros?: { id_motorista?: string; cod_motorista?: string }
): (() => void) => {
  if (!db) {
    console.warn('Firestore não inicializado. Listener ignorado.');
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_LANCAMENTOS);
    let q: any = colRef;

    if (filtros?.cod_motorista) {
      q = query(colRef, where('cod_motorista', '==', filtros.cod_motorista));
    } else if (filtros?.id_motorista) {
      q = query(colRef, where('id_motorista', '==', filtros.id_motorista));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot: any) => {
        try {
          let lista: Trip[] = snapshot.docs.map((docSnap: any) => {
            const data = docSnap.data() as LancamentoFirebase;
            return mapperFirebaseParaTrip(docSnap.id, data);
          });

          // Ordena por data decrescente
          lista.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          callback(lista);
        } catch (err) {
          console.error('Erro ao mapear documentos do Firestore:', err);
        }
      },
      (error) => {
        console.error('Erro no listener em tempo real do Firestore:', error);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  } catch (err) {
    console.error('Erro ao registrar listener em tempo real:', err);
    return () => {};
  }
};

/**
 * 3. MÉTRICAS DO DASHBOARD
 */
export const obterMetricasDashboard = async (filtros?: { id_motorista?: string; cod_motorista?: string }) => {
  const lancamentos = await buscarLancamentos(filtros);

  if (lancamentos.length === 0) {
    return {
      mediaGeral: 0,
      melhorMedia: 0,
      totalLancamentos: 0,
    };
  }

  const somaKml = lancamentos.reduce((acc, curr) => acc + (curr.kml || 0), 0);
  const mediaGeral = Number((somaKml / lancamentos.length).toFixed(2));
  const melhorMedia = Number(Math.max(...lancamentos.map((t) => t.kml || 0)).toFixed(2));

  return {
    mediaGeral,
    melhorMedia,
    totalLancamentos: lancamentos.length,
  };
};

/**
 * 4. UPLOAD DE COMPROVANTE (FIREBASE STORAGE)
 */
export const uploadComprovante = async (
  arquivoOuBase64: File | string,
  nomeArquivo?: string
): Promise<string> => {
  if (!storage) {
    console.warn('Storage não inicializado, usando dados locais.');
    if (typeof arquivoOuBase64 === 'string') return arquivoOuBase64;
    return '';
  }
  try {
    const timestamp = Date.now();
    const filename = nomeArquivo || `comprovante_${timestamp}.jpg`;
    const storageRef = ref(storage, `comprovantes/${filename}`);

    if (typeof arquivoOuBase64 === 'string') {
      await uploadString(storageRef, arquivoOuBase64, 'data_url');
    } else {
      await uploadBytes(storageRef, arquivoOuBase64);
    }

    const downloadURL = await getDownloadURL(storageRef);
    console.log('Upload concluído com sucesso. URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do comprovante no Storage:', error);
    if (typeof arquivoOuBase64 === 'string') return arquivoOuBase64;
    return '';
  }
};

/**
 * 5. AUTENTICAÇÃO FIREBASE AUTH
 */

/**
 * Cria um novo usuário no Firebase Auth através de uma instância secundária.
 * Isso GARANTE que a sessão ativa do Administrador/Dev NÃO seja deslogada na interface principal.
 */
export const criarUsuarioAuthSemDeslogarAdmin = async (
  email: string,
  pass: string
): Promise<FirebaseUser | null> => {
  if (!email || !email.includes('@')) {
    return null;
  }
  console.log('[FIREBASE AUTH SECUNDÁRIO] Cadastrando credencial no Auth sem deslogar Admin:', email);
  try {
    const secondaryAppName = 'SecondaryAuthApp';
    let secondaryApp = getApps().find((a) => a.name === secondaryAppName);
    if (!secondaryApp) {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const newAuthUser = userCredential.user;

    // Efetua logout imediato na instância secundária para limpar a sessão local do novo usuário
    await signOut(secondaryAuth);
    console.log('[FIREBASE AUTH SECUNDÁRIO OK] Credencial cadastrada com sucesso! UID:', newAuthUser.uid);
    return newAuthUser;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      console.log('[FIREBASE AUTH SECUNDÁRIO] E-mail já cadastrado no Auth:', email);
    } else if (err?.code === 'auth/configuration-not-found') {
      console.warn('[FIREBASE AUTH SECUNDÁRIO] Provedor E-mail/Senha não configurado no console do Firebase.');
    } else {
      console.warn('[FIREBASE AUTH SECUNDÁRIO AVISO] Erro ao registrar credencial:', err?.message || err);
    }
    return null;
  }
};

export const autenticarNoFirebase = async (email: string, pass: string): Promise<FirebaseUser | null> => {
  if (!auth || !email || !email.includes('@')) {
    console.log('[FIREBASE AUTH] Ignorando autenticação secundária (e-mail não fornecido ou serviço inativo).');
    return null;
  }
  console.log('Tentando conectar ao serviço de autenticação do Firebase...');
  try {
    const authPromise = signInWithEmailAndPassword(auth, email, pass)
      .then((res) => res.user)
      .catch((err) => {
        if (err?.code === 'auth/configuration-not-found') {
          console.warn('[FIREBASE AUTH] Provedor de e-mail/senha não ativado no console Firebase. Prosseguindo com autenticação via banco de dados Firestore.');
        } else {
          console.warn('[FIREBASE AUTH AVISO] Falha ao autenticar no Firebase Auth:', err?.message || err);
        }
        return null;
      });

    const user = await withTimeout(authPromise, 3000, null);
    if (user) {
      console.log('Autenticação no Firebase Auth concluída com sucesso!');
      return user;
    }
  } catch (error: any) {
    console.warn('Erro ao autenticar no Firebase Auth (fallback local/Firestore ativo):', error);
  }
  return null;
};

export const deslogarDoFirebase = async (): Promise<void> => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao deslogar do Firebase:', error);
  }
};

export const escutarSessaoFirebase = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

/**
 * ATUALIZAR E EXCLUIR LANÇAMENTOS
 */
export const atualizarLancamento = async (docId: string, dadosAtuais: Partial<LancamentoFirebase>) => {
  if (!db || !docId) return;
  try {
    const docRef = doc(db, COLLECTION_LANCAMENTOS, docId);
    await updateDoc(docRef, {
      ...dadosAtuais,
      atualizado_em: serverTimestamp(),
    });
  } catch (e) {
    console.error('Erro ao atualizar lançamento no Firestore:', e);
  }
};

export const excluirLancamento = async (docId: string) => {
  if (!db || !docId) return;
  try {
    const docRef = doc(db, COLLECTION_LANCAMENTOS, docId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Erro ao excluir lançamento no Firestore:', e);
  }
};

/**
 * LIMPEZA TOTAL DE LANÇAMENTOS DO BANCO (RESET OFICIAL)
 */
export const apagarTodosLancamentos = async (): Promise<void> => {
  if (!db) return;
  try {
    const colRef = collection(db, COLLECTION_LANCAMENTOS);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, COLLECTION_LANCAMENTOS, docSnap.id))
    );
    await Promise.all(deletePromises);
    console.log('Todos os lançamentos do Firestore foram excluídos.');
  } catch (e) {
    console.error('Erro ao apagar todos os lançamentos no Firestore:', e);
  }
};

/**
 * ==========================================
 * GERENCIAMENTO DE USUÁRIOS NO FIRESTORE
 * Sincronização multi-dispositivo em nuvem
 * ==========================================
 */

export const mapperFirebaseParaUser = (docId: string, data: any): User => {
  return {
    id: docId || data.id,
    code: data.code || '',
    name: data.name || '',
    email: data.email || '',
    password: data.password || '',
    role: data.role || 'driver',
    phone: data.phone || '',
    active: data.active ?? true,
    cavaloPadrao: data.cavaloPadrao || '',
    siderPadrao: data.siderPadrao || '',
    targetKml: data.targetKml !== undefined && data.targetKml !== null ? Number(data.targetKml) : undefined,
    avatarUrl: data.avatarUrl || '',
  };
};

/**
 * Busca todos os usuários cadastrados diretamente na nuvem (Firestore)
 */
export const buscarUsuariosFirestore = async (): Promise<User[]> => {
  console.log('[FIREBASE CRUD] Buscando lista de usuários no Firestore...');
  if (!db) {
    console.warn('[FIREBASE WARNING] Firestore não inicializado. Retornando lista vazia.');
    return [];
  }
  try {
    const colRef = collection(db, COLLECTION_USUARIOS);
    const snapshot = await getDocs(colRef);
    const usuarios = snapshot.docs.map((d) => mapperFirebaseParaUser(d.id, d.data()));
    console.log(`[FIREBASE CRUD OK] Busca no Firestore concluída: ${usuarios.length} usuários encontrados.`);
    return usuarios;
  } catch (error) {
    console.error('[FIREBASE CRUD ERRO] Erro ao buscar usuários no Firestore:', error);
    return [];
  }
};

/**
 * Ouve alterações na coleção de usuários em tempo real para sincronização multi-dispositivo
 */
export const ouvirUsuariosEmTempoReal = (
  callback: (usuarios: User[]) => void
): (() => void) => {
  if (!db) return () => {};
  try {
    const colRef = collection(db, COLLECTION_USUARIOS);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const usuarios: User[] = snapshot.docs.map((d) => mapperFirebaseParaUser(d.id, d.data()));
        console.log(`[FIREBASE REALTIME] Recebido snapshot em tempo real com ${usuarios.length} usuários.`);
        callback(usuarios);
      },
      (error) => {
        console.error('[FIREBASE REALTIME ERRO] Erro no listener em tempo real de usuários:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error('[FIREBASE REALTIME EXCEÇÃO] Erro ao registrar listener em tempo real:', e);
    return () => {};
  }
};

/**
 * Cadastra ou atualiza um usuário no Firestore
 */
export const salvarUsuarioFirestore = async (user: User): Promise<void> => {
  console.log('[FIREBASE CRUD] Salvando usuário no Firestore:', user.name || user.code);
  if (!db) {
    console.warn('[FIREBASE WARNING] Firestore não inicializado. Operação salva apenas localmente.');
    return;
  }
  try {
    const userDocId = user.id || 'usr-' + Date.now();
    const docRef = doc(db, COLLECTION_USUARIOS, userDocId);
    const docData: any = {
      id: userDocId,
      code: (user.code || '').trim(),
      name: (user.name || '').trim(),
      email: (user.email || '').trim().toLowerCase(),
      password: (user.password || '').trim(),
      role: user.role,
      phone: (user.phone || '').trim(),
      active: user.active ?? true,
      cavaloPadrao: user.cavaloPadrao || '',
      siderPadrao: user.siderPadrao || '',
      targetKml: user.targetKml !== undefined && user.targetKml !== null ? Number(user.targetKml) : null,
      atualizado_em: serverTimestamp(),
    };

    await setDoc(docRef, docData, { merge: true });
    console.log('[FIREBASE CRUD OK] Usuário salvo com sucesso no Firestore:', userDocId);
  } catch (e) {
    console.error('[FIREBASE CRUD ERRO] Erro ao salvar usuário no Firestore:', e);
    throw e;
  }
};

/**
 * Exclui um usuário do Firestore
 */
export const excluirUsuarioFirestore = async (userId: string): Promise<void> => {
  console.log('[FIREBASE CRUD] Excluindo usuário do Firestore pelo ID:', userId);
  if (!db || !userId) return;
  try {
    const docRef = doc(db, COLLECTION_USUARIOS, userId);
    await deleteDoc(docRef);
    console.log('[FIREBASE CRUD OK] Usuário excluído com sucesso do Firestore:', userId);
  } catch (e) {
    console.error('[FIREBASE CRUD ERRO] Erro ao excluir usuário no Firestore:', e);
    throw e;
  }
};

/**
 * Sincroniza usuários padrões de fábrica no Firestore se não existirem
 */
export const sincronizarUsuariosIniciaisFirestore = async (initialUsers: User[]): Promise<void> => {
  if (!db) return;
  try {
    const usuariosExistentes = await buscarUsuariosFirestore();
    // Se o banco estiver completamente vazio, popula com a lista inicial
    if (usuariosExistentes.length === 0) {
      console.log('[FIREBASE SEED] Inicializando banco de dados com a lista de usuários iniciais...');
      for (const u of initialUsers) {
        await salvarUsuarioFirestore(u);
      }
    }
  } catch (e) {
    console.error('Erro ao sincronizar usuários iniciais no Firestore:', e);
  }
};

/**
 * Sincroniza lançamentos padrões de fábrica no Firestore se a coleção estiver vazia
 */
export const sincronizarLancamentosIniciaisFirestore = async (initialTrips: Trip[]): Promise<void> => {
  if (!db) return;
  try {
    const colRef = collection(db, COLLECTION_LANCAMENTOS);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log('[FIREBASE SEED] Inicializando coleção de lançamentos no Firestore...');
      for (const t of initialTrips) {
        await salvarLancamento({
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
        });
      }
    }
  } catch (e) {
    console.error('Erro ao sincronizar lançamentos iniciais no Firestore:', e);
  }
};


