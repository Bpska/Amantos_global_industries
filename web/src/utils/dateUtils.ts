/**
 * Date and day formatting utilities for RetailFlow / Amantos Global Industries
 */

/**
 * Safely parses an ISO date or YYYY-MM-DD string into a valid Date object.
 */
export const parseSafeDate = (val?: string | Date | null): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0); // Noon to prevent timezone shifting
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/**
 * Formats a date into: "Day, DD Mon YYYY"
 * Example: "Tue, 20 Oct 2026"
 */
export const formatDayAndDate = (val?: string | Date | null): string => {
  const d = parseSafeDate(val);
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
};

/**
 * Formats a date into full weekday name and full date:
 * Example: "Tuesday, 20 Oct 2026"
 */
export const formatFullDayDate = (val?: string | Date | null): string => {
  const d = parseSafeDate(val);
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
};

/**
 * Formats a date with time:
 * Example: "Tue, 20 Oct 2026 · 10:30 AM"
 */
export const formatDayDateTime = (val?: string | Date | null): string => {
  const d = parseSafeDate(val);
  if (!d) return '—';
  try {
    const dayDate = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const hasTime = d.getHours() !== 12 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
    if (hasTime && typeof val === 'string' && val.includes('T')) {
      const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${dayDate} · ${timeStr}`;
    }
    return dayDate;
  } catch {
    return String(val);
  }
};

