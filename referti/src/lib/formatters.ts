/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Formatters
 * ============================================================================
 */

const IT_LOCALE = 'it-IT';

/**
 * Format date to Italian locale: "24 febbraio 2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString(IT_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format date with time: "24 feb 2026, 14:30"
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(IT_LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Format file size: 245760 → "240 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${units[i]}`;
}

/**
 * Format report status to Italian label
 */
export function formatReportStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'In lavorazione',
    validated: 'Validato',
    signed: 'Firmato',
    released: 'Disponibile',
    archived: 'Archiviato',
    revoked: 'Revocato',
  };
  return map[status] || status;
}

/**
 * Format phone number: "+393401234567" → "+39 340 123 4567"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('39') && cleaned.length === 12) {
    return `+39 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

/**
 * Format risk level badge color
 */
export function riskColor(level: string): string {
  const map: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };
  return map[level] || '#6b7280';
}

/**
 * Time ago: "2 ore fa", "3 giorni fa"
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'adesso';
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mese' : 'mesi'} fa`;
}
