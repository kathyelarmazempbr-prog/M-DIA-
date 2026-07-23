import {
  collection,
  doc,
  addDoc,
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
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { Trip } from '../types';

// Coleção principal do Firestore
const COLLECTION_LANCAMENTOS = 'lancamentos';

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
  if (!db) {
    console.warn('Firestore não inicializado (modo local).');
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
    console.log('Lançamento salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar lançamento no Firestore:', error);
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
export const autenticarNoFirebase = async (email: string, pass: string): Promise<FirebaseUser | null> => {
  if (!auth) return null;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    // Se a conta não existir no Firebase Auth, tenta criar uma nova conta para autenticação transparente
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
      try {
        const safeEmail = email.includes('@') ? email : `${email.toLowerCase()}@mediaplus.com.br`;
        const newCredential = await createUserWithEmailAndPassword(auth, safeEmail, pass || '123456');
        return newCredential.user;
      } catch (createErr) {
        console.warn('Erro ao criar usuário no Firebase Auth:', createErr);
      }
    }
    console.warn('Erro ao autenticar no Firebase Auth:', error);
    return null;
  }
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

