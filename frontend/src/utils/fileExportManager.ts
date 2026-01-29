/**
 * Simple CSV Export Utility
 * Takes data array and filename, handles the download
 */

/**
 * Generate a unique ID for file naming
 */
export const generateFileId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * Format date for filename (YYYY-MM-DD)
 */
export const formatDateForFilename = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Escape CSV field value
 */
const escapeCSVField = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Convert array of objects to CSV string
 */
const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);
  const csvContent = [headers.map(escapeCSVField).join(',')];
  
  // Create data rows
  data.forEach(row => {
    const values = headers.map(header => escapeCSVField(row[header]));
    csvContent.push(values.join(','));
  });
  
  return csvContent.join('\n');
};

/**
 * Download CSV file
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Main export function - takes data array and filename, handles download
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, filename);
};

/**
 * Generate filename with pattern: {prefix}_{date}_{id}.csv
 */
export const generateFilename = (prefix: string, date?: Date | string, id?: string): string => {
  const dateStr = date ? formatDateForFilename(date) : formatDateForFilename(new Date());
  const fileId = id || generateFileId();
  
  // Clean prefix (remove special characters)
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  return `${cleanPrefix}_${dateStr}_${fileId}.csv`;
};