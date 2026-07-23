export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  code: string; // e.g., MOT-101
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  cavaloPadrao?: string;
  siderPadrao?: string;
  targetKml?: number; // Target average km/l
  phone?: string;
  active: boolean;
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  date: string; // YYYY-MM-DD
  driverId: string;
  driverCode: string;
  driverName: string;
  originCode: string; // e.g., RNO
  originName: string; // e.g., Rondonópolis - MT
  destinationCode: string; // e.g., STS
  destinationName: string; // e.g., Santos - SP
  cavaloPlate: string; // Placa do Cavalo (Trator)
  siderPlate: string; // Placa do Sider (Carreta)
  kml: number; // Média realizada (km/l)
  liters?: number;
  distanceKm?: number;
  proofUrl?: string; // Image or receipt photo preview
  notes?: string;
  status: 'aprovado' | 'pendente' | 'corrigido';
  createdAt: string;
  updatedAt?: string;
}

export interface RouteOption {
  code: string;
  name: string;
  cityState: string;
}

export interface PerformanceThresholds {
  excellentMin: number; // >= 2.80 km/l
  regularMin: number;   // 2.40 - 2.79 km/l
}
