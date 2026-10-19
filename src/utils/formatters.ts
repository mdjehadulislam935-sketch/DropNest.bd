/**
 * DropNest Bangladesh Currency and DateTime formatters
 */

export function formatBDT(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '৳ 0.00';
  }
  return `৳ ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBangladeshDateTime(dateInput: string | number | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d) + ' BST';
  } catch {
    return String(dateInput);
  }
}

export function formatBangladeshDate(dateInput: string | number | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Normalizes Bangladesh mobile numbers to standard 11-digit (e.g. 017XXXXXXXX)
 * or international format (+88017XXXXXXXX).
 */
export function normalizeBangladeshMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return digits.substring(2); // Convert to 01XXXXXXXXX
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

export function isValidBangladeshMobile(mobile: string): boolean {
  const normalized = normalizeBangladeshMobile(mobile);
  // BD mobile operators: 013, 014, 015, 016, 017, 018, 019
  return /^01[3-9]\d{8}$/.test(normalized);
}
