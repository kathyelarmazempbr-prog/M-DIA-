import * as XLSX from 'xlsx';
import { Trip } from '../types';

/**
 * Format date to BR format DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Exact columns required by user specifications:
 * Data da Puxada | Cód Motorista | Motorista | Cód Destino | Destino | Carreta (Cavalo) | Sider | Média
 */
export interface ExportRow {
  'Data da Puxada': string;
  'Cód Motorista': string;
  'Motorista': string;
  'Cód Destino': string;
  'Destino': string;
  'Carreta (Cavalo)': string;
  'Sider': string;
  'Média': string;
}

export function formatTripForExport(trip: Trip): ExportRow {
  return {
    'Data da Puxada': formatDateBR(trip.date),
    'Cód Motorista': trip.driverCode || 'MOT-000',
    'Motorista': trip.driverName,
    'Cód Destino': trip.destinationCode || 'DEST',
    'Destino': trip.destinationName,
    'Carreta (Cavalo)': trip.cavaloPlate,
    'Sider': trip.siderPlate,
    'Média': `${trip.kml.toFixed(2)} km/l`,
  };
}

export function exportTripsToExcel(trips: Trip[], filename: string = 'media_plus_relatorio.xlsx') {
  const rows = trips.map(formatTripForExport);

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for pretty formatting
  worksheet['!cols'] = [
    { wch: 15 }, // Data da Puxada
    { wch: 15 }, // Cód Motorista
    { wch: 28 }, // Motorista
    { wch: 12 }, // Cód Destino
    { wch: 25 }, // Destino
    { wch: 18 }, // Carreta (Cavalo)
    { wch: 15 }, // Sider
    { wch: 12 }, // Média
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Média Plus - Viagens');

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

export function exportTripsToCSV(trips: Trip[], filename: string = 'media_plus_relatorio.csv') {
  const rows = trips.map(formatTripForExport);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' }); // Semicolon separated for Excel BR

  // Add BOM for Excel UTF-8 recognition
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
