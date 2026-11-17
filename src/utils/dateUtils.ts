export const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MESES_CORTOS_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

export const DIAS_SEMANA_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

export function formatShortBadgeDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MESES_CORTOS_ES[m - 1] ?? ''}`;
}

export function formatLongDayTitle(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${MESES_CORTOS_ES[m - 1] ?? ''} ${y}`;
}

export function formatNumericDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function formatHoursBalance(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '+';
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
}

export function formatHoursColon(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '+';
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function getMonthGridDays(year: number, monthIndex: number): Array<{
  iso: string;
  day: number;
  inCurrentMonth: boolean;
}> {
  const firstDay = new Date(year, monthIndex, 1);
  // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{ iso: string; day: number; inCurrentMonth: boolean }> = [];

  for (let i = 0; i < startOffset; i++) {
    const dt = new Date(year, monthIndex, 1 - (startOffset - i));
    cells.push({
      iso: toIsoDate(dt),
      day: dt.getDate(),
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex, d);
    cells.push({
      iso: toIsoDate(dt),
      day: d,
      inCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let i = 1; i <= trailing; i++) {
      const dt = new Date(year, monthIndex + 1, i);
      cells.push({
        iso: toIsoDate(dt),
        day: dt.getDate(),
        inCurrentMonth: false,
      });
    }
  }

  return cells;
}
