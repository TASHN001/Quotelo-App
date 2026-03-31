export function getCurrentDate(): Date {
  return new Date();
}

export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimestamp(): number {
  return Date.now();
}

export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

export function addDaysISO(dateISO: string, days: number): string {
  const date = new Date(dateISO);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getDayOfWeek(date: Date | string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return days[dateObj.getDay()];
}

export function getDateContext(): {
  date: Date;
  dateISO: string;
  dayOfWeek: string;
  timestamp: number;
} {
  const date = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    date,
    dateISO: date.toISOString().split('T')[0],
    dayOfWeek: days[date.getDay()],
    timestamp: date.getTime()
  };
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj < today;
}

export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj > today;
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? new Date(date2) : new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
