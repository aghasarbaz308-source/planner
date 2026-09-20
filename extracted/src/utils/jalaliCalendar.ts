import { DayKey } from '../types';

/**
 * High-precision astronomical Jalaali (Shamsi) conversion algorithms
 * Zero external dependencies, pure TypeScript, completely deterministic.
 */

export interface JalaliDate {
  jy: number; // Jalali year (e.g. 1405)
  jm: number; // Jalali month (1-12)
  jd: number; // Jalali day (1-31)
}

export interface GregorianDate {
  gy: number;
  gm: number; // 1-12
  gd: number; // 1-31
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const JALALI_SEASONS = [
  { name: 'بهار', months: [1, 2, 3] },
  { name: 'تابستان', months: [4, 5, 6] },
  { name: 'پاییز', months: [7, 8, 9] },
  { name: 'زمستان', months: [10, 11, 12] },
];

/**
 * Converts Gregorian date to Jalali
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Converts Jalali date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return { gy, gm, gd };
}

/**
 * Check if a Jalali year is leap (کبیسه)
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let jp = breaks[0];
  let jm: number;
  let jump: number;
  let leap: number;
  let n: number;
  let i: number;

  if (jy < jp || jy >= breaks[breaks.length - 1]) {
    return false;
  }

  for (i = 1; i < breaks.length; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  n = jy - jp;
  if (jump! - n < 6) n = n - jump! + Math.floor((jump! + 4) / 33) * 33;
  leap = ((((n + 1) % 33) - 1) % 4);
  if (leap === -1) leap = 4;
  return leap === 0;
}

/**
 * Get number of days in a Jalali month
 */
export function getJalaliDaysInMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

/**
 * Converts a JavaScript Date to Jalali
 */
export function dateToJalali(date: Date): JalaliDate {
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Converts a Jalali date to JavaScript Date object
 */
export function jalaliToDate(jy: number, jm: number, jd: number): Date {
  const g = jalaliToGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0); // Noon to prevent timezone boundary bugs
}

/**
 * Finds the Saturday (start of Persian week) for any given Date
 */
export function getSaturdayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const dayOfWeek = d.getDay(); // Sunday=0, Monday=1, ..., Saturday=6
  // Days to subtract to get to Saturday
  // Sat(6) => 0 days back
  // Sun(0) => 1 day back
  // Mon(1) => 2 days back
  // Tue(2) => 3 days back
  // Wed(3) => 4 days back
  // Thu(4) => 5 days back
  // Fri(5) => 6 days back
  const daysBack = (dayOfWeek + 1) % 7;
  d.setDate(d.getDate() - daysBack);
  return d;
}

export interface PersianWeekDayInfo {
  dayKey: DayKey;
  nameFa: string;
  nameEn: string;
  date: Date;
  jalali: JalaliDate;
  dateStringFa: string; // e.g. "۲۸ شهریور"
  fullDateStringFa: string; // e.g. "شنبه ۲۸ شهریور ۱۴۰۵"
  dayOfMonthFa: string; // e.g. "۲۸"
  monthNameFa: string; // e.g. "شهریور"
  isToday: boolean;
}

const DAY_KEYS: DayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_NAMES_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
const DAY_NAMES_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Convert English number to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => faDigits[+w]);
}

/**
 * Returns full information for all 7 days of the Persian week containing the given date
 */
export function getWeekDaysInfo(date: Date): PersianWeekDayInfo[] {
  const saturday = getSaturdayOfWeek(date);
  const today = new Date();
  const todayJalali = dateToJalali(today);

  return DAY_KEYS.map((key, index) => {
    const dayDate = new Date(saturday);
    dayDate.setDate(saturday.getDate() + index);
    const jalali = dateToJalali(dayDate);
    const monthNameFa = JALALI_MONTH_NAMES[jalali.jm - 1];
    const isToday =
      jalali.jy === todayJalali.jy &&
      jalali.jm === todayJalali.jm &&
      jalali.jd === todayJalali.jd;

    return {
      dayKey: key,
      nameFa: DAY_NAMES_FA[index],
      nameEn: DAY_NAMES_EN[index],
      date: dayDate,
      jalali,
      dateStringFa: `${toPersianDigits(jalali.jd)} ${monthNameFa}`,
      fullDateStringFa: `${DAY_NAMES_FA[index]} ${toPersianDigits(jalali.jd)} ${monthNameFa} ${toPersianDigits(jalali.jy)}`,
      dayOfMonthFa: toPersianDigits(jalali.jd),
      monthNameFa,
      isToday,
    };
  });
}

/**
 * Unique identifier for a week based on its Saturday Jalali date
 * e.g. "1405-06-28"
 */
export function getWeekId(date: Date): string {
  const sat = getSaturdayOfWeek(date);
  const j = dateToJalali(sat);
  const mm = String(j.jm).padStart(2, '0');
  const dd = String(j.jd).padStart(2, '0');
  return `${j.jy}-${mm}-${dd}`;
}

/**
 * Human-readable week range label in Persian
 * e.g. "شنبه ۲۸ شهریور تا جمعه ۳ مهر ۱۴۰۵"
 */
export function formatWeekRangeFa(date: Date): string {
  const days = getWeekDaysInfo(date);
  const sat = days[0];
  const fri = days[6];

  if (sat.jalali.jm === fri.jalali.jm) {
    return `شنبه ${sat.dayOfMonthFa} تا جمعه ${fri.dayOfMonthFa} ${sat.monthNameFa} ${toPersianDigits(sat.jalali.jy)}`;
  }
  return `شنبه ${sat.dayOfMonthFa} ${sat.monthNameFa} تا جمعه ${fri.dayOfMonthFa} ${fri.monthNameFa} ${toPersianDigits(fri.jalali.jy)}`;
}
