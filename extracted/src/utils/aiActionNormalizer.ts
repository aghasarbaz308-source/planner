import { DayKey, TimeBlock, CategoryKey } from '../types';
import { DAYS } from '../constants/plannerConfig';

export interface AiAction {
  type: 'add_block' | 'update_block' | 'delete_block' | 'clear_day';
  day?: DayKey;
  id?: string;
  title?: string;
  subtitle?: string;
  startMinutes?: number;
  durationMinutes?: number;
  category?: string;
  priority?: string;
  energyLevel?: string;
  notes?: string;
}

const VALID_DAYS: DayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

/**
 * Normalizes any Persian or English day string to a valid DayKey ('sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri')
 */
export function normalizeDayKey(raw: any, fallbackDay: DayKey = 'sat'): DayKey {
  if (!raw) return fallbackDay;
  const str = String(raw).trim().toLowerCase();

  // Exact matches
  if (VALID_DAYS.includes(str as DayKey)) {
    return str as DayKey;
  }

  // Persian normalization (remove non-standard spaces/half-spaces)
  const cleanFa = str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '');

  if (cleanFa.includes('شنبهها') || cleanFa === 'شنبه' || cleanFa.includes('sat')) return 'sat';
  if (cleanFa.includes('یکشنبه') || cleanFa.includes('یک‌شنبه') || cleanFa.includes('sun')) return 'sun';
  if (cleanFa.includes('دوشنبه') || cleanFa.includes('دو‌شنبه') || cleanFa.includes('mon')) return 'mon';
  if (cleanFa.includes('سهشنبه') || cleanFa.includes('سه‌شنبه') || cleanFa.includes('tue')) return 'tue';
  if (cleanFa.includes('چهارشنبه') || cleanFa.includes('چهار‌شنبه') || cleanFa.includes('wed')) return 'wed';
  if (cleanFa.includes('پنجشنبه') || cleanFa.includes('پنج‌شنبه') || cleanFa.includes('thu')) return 'thu';
  if (cleanFa.includes('جمعه') || cleanFa.includes('آدینه') || cleanFa.includes('fri')) return 'fri';

  return fallbackDay;
}

/**
 * Normalizes Persian or English digits and time expressions (e.g. "14:30", "14", "۱۴:۰۰") to minutes from midnight
 */
export function normalizeTimeMinutes(raw: any, defaultMinutes = 480): number {
  if (raw === undefined || raw === null) return defaultMinutes;

  if (typeof raw === 'number' && !isNaN(raw)) {
    return Math.max(0, Math.min(1439, Math.round(raw)));
  }

  let str = String(raw).trim();

  // Convert Persian/Arabic digits to English digits
  str = str
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');

  // Handle "HH:MM" or "H:MM" or "HH.MM"
  if (str.includes(':') || str.includes('.')) {
    const parts = str.split(/[:.]/);
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    if (!isNaN(h)) {
      return Math.max(0, Math.min(1439, h * 60 + m));
    }
  }

  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    // If user entered hours like "14" or "9"
    if (num <= 24) {
      return num * 60;
    }
    return Math.max(0, Math.min(1439, num));
  }

  return defaultMinutes;
}

/**
 * Normalizes duration to a clean minute number (between 15 and 480)
 */
export function normalizeDurationMinutes(raw: any, defaultDuration = 60): number {
  if (raw === undefined || raw === null) return defaultDuration;

  if (typeof raw === 'number' && !isNaN(raw)) {
    return Math.max(15, Math.min(480, Math.round(raw)));
  }

  let str = String(raw).trim().toLowerCase();
  str = str
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');

  // Handle "2h" or "1.5h"
  if (str.includes('h') || str.includes('ساعت')) {
    const val = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) return Math.max(15, Math.min(480, Math.round(val * 60)));
  }

  // Handle "90m" or "45min"
  const val = parseInt(str.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(val)) {
    if (val <= 8) return Math.max(15, val * 60); // e.g. "2" means 2 hours
    return Math.max(15, Math.min(480, val));
  }

  return defaultDuration;
}

/**
 * Maps categories safely to system taxonomy
 */
export function normalizeCategory(raw: any, title = ''): string {
  const combined = (String(raw || '') + ' ' + title).toLowerCase();

  if (
    combined.includes('pytorch') ||
    combined.includes('deep_learning') ||
    combined.includes('هوش مصنوعی') ||
    combined.includes('تنسور') ||
    combined.includes('یادگیری عمیق') ||
    combined.includes('شبکه عصبی')
  ) {
    return 'pytorch';
  }

  if (
    combined.includes('python') ||
    combined.includes('پایتون') ||
    combined.includes('کدنویسی') ||
    combined.includes('الگوریتم') ||
    combined.includes('برنامه‌نویسی') ||
    combined.includes('برنامه نویسی')
  ) {
    return 'python';
  }

  if (
    combined.includes('university') ||
    combined.includes('دانشگاه') ||
    combined.includes('کلاس') ||
    combined.includes('درس') ||
    combined.includes('تکلیف') ||
    combined.includes('پروژه دانشگاه')
  ) {
    return 'university';
  }

  if (
    combined.includes('recovery') ||
    combined.includes('exercise') ||
    combined.includes('chores') ||
    combined.includes('استراحت') ||
    combined.includes('خواب') ||
    combined.includes('ناهار') ||
    combined.includes('شام') ||
    combined.includes('قهوه') ||
    combined.includes('ورزش') ||
    combined.includes('تنفس') ||
    combined.includes('ریکاوری')
  ) {
    return 'recovery';
  }

  if (
    combined.includes('habit') ||
    combined.includes('reading') ||
    combined.includes('مطالعه') ||
    combined.includes('کتاب') ||
    combined.includes('زبان') ||
    combined.includes('عادت')
  ) {
    return 'habit';
  }

  if (
    combined.includes('gaming') ||
    combined.includes('بازی') ||
    combined.includes('تفریح') ||
    combined.includes('فیلم') ||
    combined.includes('سریال')
  ) {
    return 'gaming';
  }

  if (
    combined.includes('meeting') ||
    combined.includes('جلسه') ||
    combined.includes('میتینگ') ||
    combined.includes('هماهنگی')
  ) {
    return 'meeting';
  }

  return 'work';
}

/**
 * Cleans a block title to 2-3 concise Persian words
 */
export function cleanActionTitle(raw: any, fallback = 'فعالیت جدید'): string {
  if (!raw) return fallback;
  let str = String(raw).replace(/\([^)]*\)/g, '').trim();
  str = str.replace(/\s+/g, ' ').trim();
  const words = str.split(' ').filter(Boolean);
  if (words.length > 4) {
    return words.slice(0, 3).join(' ');
  }
  return str.slice(0, 30) || fallback;
}

/**
 * Validates and normalizes an AI action to guarantee flawless execution
 */
export function normalizeAction(
  raw: any,
  fallbackDay: DayKey = 'sat',
  existingBlocks: TimeBlock[] = []
): AiAction | null {
  if (!raw || typeof raw !== 'object') return null;

  let type: 'add_block' | 'update_block' | 'delete_block' | 'clear_day' = 'add_block';
  const rawType = String(raw.type || '').toLowerCase();

  if (rawType.includes('clear') || rawType.includes('reset')) {
    type = 'clear_day';
  } else if (rawType.includes('delete') || rawType.includes('remove')) {
    type = 'delete_block';
  } else if (rawType.includes('update') || rawType.includes('edit') || rawType.includes('modify')) {
    type = 'update_block';
  } else {
    type = 'add_block';
  }

  const day = normalizeDayKey(raw.day, fallbackDay);

  if (type === 'clear_day') {
    return { type: 'clear_day', day };
  }

  let id = raw.id ? String(raw.id) : undefined;
  const title = cleanActionTitle(raw.title || raw.name || raw.task);

  // If update or delete but no matching ID, try to match by day and title/time
  if ((type === 'update_block' || type === 'delete_block') && (!id || !existingBlocks.some((b) => b.id === id))) {
    const match = existingBlocks.find((b) => {
      if (b.day !== day) return false;
      if (raw.startMinutes !== undefined && Math.abs(b.startMinutes - normalizeTimeMinutes(raw.startMinutes)) <= 30) {
        return true;
      }
      if (title && b.title.includes(title)) return true;
      return false;
    });
    if (match) {
      id = match.id;
    }
  }

  if (type === 'delete_block') {
    if (!id) return null;
    return { type: 'delete_block', id, day, title };
  }

  const startMinutes = normalizeTimeMinutes(raw.startMinutes || raw.start || raw.time, 480);
  const durationMinutes = normalizeDurationMinutes(raw.durationMinutes || raw.duration, 60);
  const category = normalizeCategory(raw.category, title);
  const subtitle = raw.subtitle ? String(raw.subtitle).slice(0, 25) : '';
  const notes = raw.notes || raw.note || '';

  return {
    type,
    id: id || `b_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    day,
    title,
    subtitle,
    startMinutes,
    durationMinutes,
    category,
    priority: raw.priority || 'medium',
    energyLevel: raw.energyLevel || 'deep_work',
    notes,
  };
}

/**
 * Intelligent local Persian natural language intent parser
 * Operates client-side as an immediate fallback or parallel validator.
 */
export function parseLocalUserScheduleIntent(
  text: string,
  currentDayKey: DayKey = 'sat',
  existingBlocks: TimeBlock[] = []
): { reply: string; actions: AiAction[] } | null {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();

  // Detect day
  let day: DayKey = currentDayKey;
  if (t.includes('شنبه') && !t.includes('یک') && !t.includes('دو') && !t.includes('سه') && !t.includes('چهار') && !t.includes('پنج')) {
    day = 'sat';
  } else if (t.includes('یکشنبه') || t.includes('یک‌شنبه')) {
    day = 'sun';
  } else if (t.includes('دوشنبه') || t.includes('دو‌شنبه')) {
    day = 'mon';
  } else if (t.includes('سه‌شنبه') || t.includes('سه شنبه')) {
    day = 'tue';
  } else if (t.includes('چهارشنبه') || t.includes('چهار‌شنبه')) {
    day = 'wed';
  } else if (t.includes('پنجشنبه') || t.includes('پنج‌شنبه')) {
    day = 'thu';
  } else if (t.includes('جمعه')) {
    day = 'fri';
  }

  const dayObj = DAYS.find((d) => d.id === day) || DAYS[0];

  // Check if clear day intent
  if (t.includes('خالی کن') || t.includes('پاک کن') || t.includes('حذف کن تمام')) {
    return {
      reply: `تمام برنامه‌های روز ${dayObj.nameFa} طبق درخواست شما با موفقیت پاکسازی شد.`,
      actions: [{ type: 'clear_day', day }],
    };
  }

  // Detect time range (e.g. "ساعت ۱۵ تا ۱۷" or "از ۸ تا ۱۰" or "15 تا 17")
  const timeRangeMatch = t.match(/(?:ساعت|از)?\s*([۰-۹0-9]{1,2}(?::[۰-۹0-9]{2})?)\s*(?:تا|الی|-)\s*([۰-۹0-9]{1,2}(?::[۰-۹0-9]{2})?)/);
  let startMinutes = 540; // 09:00
  let durationMinutes = 90; // 1.5h

  if (timeRangeMatch) {
    const startM = normalizeTimeMinutes(timeRangeMatch[1], 540);
    const endM = normalizeTimeMinutes(timeRangeMatch[2], startM + 90);
    startMinutes = startM;
    durationMinutes = Math.max(15, endM - startM);
  } else {
    // Single time (e.g. "ساعت ۱۰")
    const singleTimeMatch = t.match(/ساعت\s*([۰-۹0-9]{1,2}(?::[۰-۹0-9]{2})?)/);
    if (singleTimeMatch) {
      startMinutes = normalizeTimeMinutes(singleTimeMatch[1], 540);
    }
    // Duration (e.g. "۲ ساعت" or "۴۵ دقیقه")
    const durationMatch = t.match(/([۰-۹0-9]{1,2})\s*(ساعت|دقیقه)/);
    if (durationMatch) {
      const num = parseInt(
        durationMatch[1]
          .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))),
        10
      );
      if (durationMatch[2] === 'ساعت') {
        durationMinutes = num * 60;
      } else {
        durationMinutes = num;
      }
    }
  }

  // Detect activity title & category
  let title = 'کار عمیق';
  let category = 'work';

  if (t.includes('پایتون') || t.includes('کدنویسی') || t.includes('برنامه‌نویسی')) {
    title = 'برنامه‌نویسی پایتون';
    category = 'python';
  } else if (t.includes('پایتورچ') || t.includes('تنسور') || t.includes('هوش مصنوعی') || t.includes('یادگیری عمیق')) {
    title = 'مدل‌های هوش مصنوعی';
    category = 'pytorch';
  } else if (t.includes('دانشگاه') || t.includes('کلاس') || t.includes('درس')) {
    title = 'کلاس دانشگاه';
    category = 'university';
  } else if (t.includes('استراحت') || t.includes('ورزش') || t.includes('ناهار') || t.includes('پیاده‌روی')) {
    title = t.includes('ورزش') ? 'ورزش و تندرستی' : 'استراحت و ریکاوری';
    category = 'recovery';
  } else if (t.includes('کتاب') || t.includes('مطالعه') || t.includes('زبان')) {
    title = 'مطالعه و یادگیری';
    category = 'habit';
  } else if (t.includes('جلسه') || t.includes('میتینگ')) {
    title = 'جلسه کاری';
    category = 'meeting';
  }

  const action: AiAction = {
    type: 'add_block',
    id: `b_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    day,
    title,
    subtitle: 'برنامه‌ریزی هوشمند',
    startMinutes,
    durationMinutes,
    category,
    priority: 'high',
  };

  return {
    reply: `برنامه «${title}» برای روز ${dayObj.nameFa} تنظیم گردید و مستقیماً روی جدول برنامه‌ریزی اعمال شد.`,
    actions: [action],
  };
}
