import { User, Trip, RouteOption, PerformanceThresholds } from '../types';

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  excellentMin: 2.60,
  regularMin: 2.40,
};

// 1. Cadastro Oficial dos 5 Motoristas + Gestor Admin
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-9013',
    code: '9013',
    name: 'ALUISIO ALVES DE ALMEIDA JUNIOR',
    email: 'aluisio.almeida@mediaplus.com.br',
    password: '123',
    role: 'driver',
    cavaloPadrao: 'RLK-4A21',
    siderPadrao: 'SDR-1010',
    targetKml: 2.60,
    phone: '(81) 99821-3341',
    active: true,
  },
  {
    id: 'usr-g1060',
    code: 'G1060',
    name: 'HILDO STEFANI AQUINO MELO',
    email: 'hildo.melo@mediaplus.com.br',
    password: '123',
    role: 'driver',
    cavaloPadrao: 'SPO-8B33',
    siderPadrao: 'SDR-2020',
    targetKml: 2.60,
    phone: '(83) 99762-1102',
    active: true,
  },
  {
    id: 'usr-g1021',
    code: 'G1021',
    name: 'JOSE EDUARDO DA SILVA CAVALCANTI',
    email: 'jose.cavalcanti@mediaplus.com.br',
    password: '123',
    role: 'driver',
    cavaloPadrao: 'MTZ-1C99',
    siderPadrao: 'SDR-3030',
    targetKml: 2.60,
    phone: '(81) 99120-4490',
    active: true,
  },
  {
    id: 'usr-g1110',
    code: 'G1110',
    name: 'LUCAS GOMES TORQUATO',
    email: 'lucas.torquato@mediaplus.com.br',
    password: '123',
    role: 'driver',
    cavaloPadrao: 'PRT-7D44',
    siderPadrao: 'SDR-4040',
    targetKml: 2.60,
    phone: '(85) 98831-2299',
    active: true,
  },
  {
    id: 'usr-g1044',
    code: 'G1044',
    name: 'MANOEL MESSIAS VITORINO DA SILVA',
    email: 'manoel.vitorino@mediaplus.com.br',
    password: '123',
    role: 'driver',
    cavaloPadrao: 'SDR-3F11',
    siderPadrao: 'SDR-5050',
    targetKml: 2.60,
    phone: '(79) 99654-8871',
    active: true,
  },
  {
    id: 'usr-admin',
    code: 'G1073',
    name: 'KATHYEL ROCHA',
    email: 'admin@mediaplus.com.br',
    password: '0000',
    role: 'developer',
    phone: '(66) 99999-8888',
    active: true,
  },
];

// 2. Destinos e Fábricas Oficiais
export const POPULAR_ROUTES: RouteOption[] = [
  { code: '950', name: 'ITAPISSUMA-PE', cityState: 'ITAPISSUMA - PE' },
  { code: '426', name: 'FONTE DA MATA-JP', cityState: 'FONTE DA MATA - JP' },
  { code: '3006', name: 'ESTÂNCIA-SE', cityState: 'ESTÂNCIA - SE' },
  { code: '436', name: 'AQUIRAZ-CE', cityState: 'AQUIRAZ - CE' },
  { code: '421', name: 'CAMAÇARI-BA', cityState: 'CAMAÇARI - BA' },
];

// 3. Viagens Oficiais (Iniciado limpo para publicação)
export const INITIAL_TRIPS: Trip[] = [];

