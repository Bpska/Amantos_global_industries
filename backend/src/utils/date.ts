const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Returns the day of the week in English (e.g. "Thursday") for a given date in IST.
 */
export function getISTDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to getISTDayOfWeek');
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: TIMEZONE_IST,
  }).format(d);
}

/**
 * Formats a Date to YYYY-MM-DD in IST timezone.
 */
export function formatISTDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs "YYYY-MM-DD"
}

/**
 * Parses a date or date string (YYYY-MM-DD) into a standard Date representing midnight in IST (or ISO date).
 */
export function parseISTDate(dateStr?: string | Date): { date: Date; dayName: string; formatted: string } {
  let d: Date;
  if (!dateStr) {
    d = new Date();
  } else if (typeof dateStr === 'string') {
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Append IST offset +05:30 to interpret exact day
      d = new Date(`${dateStr}T00:00:00+05:30`);
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = dateStr;
  }

  if (isNaN(d.getTime())) {
    throw new Error('Invalid date format');
  }

  const dayName = getISTDayOfWeek(d);
  const formatted = formatISTDate(d);
  // Normalize to pure calendar date for DB @db.Date storage
  const normalizedDate = new Date(`${formatted}T00:00:00.000Z`);

  return {
    date: normalizedDate,
    dayName,
    formatted,
  };
}

/**
 * Returns { startOfDay, endOfDay } in UTC Date objects corresponding to 00:00:00 and 23:59:59.999 IST of today.
 */
export function getTodayISTRange(): { start: Date; end: Date; todayStr: string } {
  const todayStr = formatISTDate(new Date());
  const start = new Date(`${todayStr}T00:00:00+05:30`);
  const end = new Date(`${todayStr}T23:59:59.999+05:30`);
  return { start, end, todayStr };
}

/**
 * Generates an array of the last N days in IST with { dateStr, dayName, start, end }
 */
export function getLastNDaysIST(daysCount = 7): Array<{
  dateStr: string;
  dayName: string;
  start: Date;
  end: Date;
  dbDate: Date;
}> {
  const result = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    // Subtract i days from current time
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = formatISTDate(target);
    const start = new Date(`${dateStr}T00:00:00+05:30`);
    const end = new Date(`${dateStr}T23:59:59.999+05:30`);
    const dayName = getISTDayOfWeek(start);
    const dbDate = new Date(`${dateStr}T00:00:00.000Z`);

    result.push({
      dateStr,
      dayName,
      start,
      end,
      dbDate,
    });
  }

  return result;
}
