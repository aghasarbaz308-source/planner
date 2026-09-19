import { DayInfo, CategoryTheme, CategoryKey, BlockTemplate, TimeBlock, TimePhaseInfo } from '../types';

export const START_HOUR = 7;
export const END_HOUR = 24; // up to 24:00
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 17 * 60 = 1020 minutes
export const SLOT_INTERVAL = 30; // 30-minute intervals
export const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_INTERVAL; // 34 intervals

// فازهای بیولوژیکی و روان‌شناختی انرژی شبانه‌روزی (Circadian & Cognitive Energy Phases)
export const TIME_PHASES: TimePhaseInfo[] = [
  {
    id: 'morning',
    nameFa: 'راه‌اندازی ذهن',
    nameEn: 'Ignition',
    startHour: 7,
    endHour: 9,
    description: 'بیداری، برنامه‌ریزی، نرمش و آغاز روز',
    color: '#d97706',
    bgLight: 'bg-amber-50/60',
    borderLight: 'border-amber-200/80',
    textDark: 'text-amber-900',
    accentBar: 'bg-amber-500',
  },
  {
    id: 'deep_focus',
    nameFa: 'اوج تمرکز عمیق',
    nameEn: 'Deep Focus',
    startHour: 9,
    endHour: 13,
    description: 'بالاترین بار شناختی، تفکر عمیق و هوش مصنوعی',
    color: '#4f46e5',
    bgLight: 'bg-indigo-50/60',
    borderLight: 'border-indigo-200/80',
    textDark: 'text-indigo-900',
    accentBar: 'bg-indigo-500',
  },
  {
    id: 'afternoon_momentum',
    nameFa: 'اجرا و تعادل',
    nameEn: 'Execution',
    startHour: 13,
    endHour: 17,
    description: 'کارهای اجرایی، تعاملات، دانشگاه و پیشبرد عملی',
    color: '#0d9488',
    bgLight: 'bg-teal-50/60',
    borderLight: 'border-teal-200/80',
    textDark: 'text-teal-900',
    accentBar: 'bg-teal-500',
  },
  {
    id: 'twilight_synthesis',
    nameFa: 'سنتز و یادگیری',
    nameEn: 'Synthesis',
    startHour: 17,
    endHour: 21,
    description: 'بازخوانی، خلاقیت، مطالعه آزاد و پروژه‌های شخصی',
    color: '#7c3aed',
    bgLight: 'bg-purple-50/60',
    borderLight: 'border-purple-200/80',
    textDark: 'text-purple-900',
    accentBar: 'bg-purple-500',
  },
  {
    id: 'restoration_night',
    nameFa: 'آرامش و ریکاوری',
    nameEn: 'Restoration',
    startHour: 21,
    endHour: 24,
    description: 'کاهش استرس، ریکاوری ذهن و آماده‌سازی خواب عمیق',
    color: '#475569',
    bgLight: 'bg-slate-100/70',
    borderLight: 'border-slate-300/80',
    textDark: 'text-slate-800',
    accentBar: 'bg-slate-500',
  },
];

export function getTimePhase(hour: number): TimePhaseInfo {
  return (
    TIME_PHASES.find((p) => hour >= p.startHour && hour < p.endHour) ||
    TIME_PHASES[TIME_PHASES.length - 1]
  );
}

export const DAYS: DayInfo[] = [
  {
    id: 'sat',
    nameFa: 'شنبه',
    nameEn: 'Saturday',
    shortFa: 'شن',
    mood: 'شروع تازه و پرانرژی',
    bgTint: 'bg-sky-50/40',
    borderTint: 'border-sky-200/70',
    textTint: 'text-sky-900',
    badgeBg: 'bg-sky-100/80',
    badgeText: 'text-sky-800',
    dotColor: '#0284c7',
    printHeaderBg: '#f0f9ff',
    printBorder: '#bae6fd',
  },
  {
    id: 'sun',
    nameFa: 'یکشنبه',
    nameEn: 'Sunday',
    shortFa: 'یک',
    mood: 'تمرکز و کار عمیق',
    bgTint: 'bg-indigo-50/40',
    borderTint: 'border-indigo-200/70',
    textTint: 'text-indigo-900',
    badgeBg: 'bg-indigo-100/80',
    badgeText: 'text-indigo-800',
    dotColor: '#6366f1',
    printHeaderBg: '#eef2ff',
    printBorder: '#c7d2fe',
  },
  {
    id: 'mon',
    nameFa: 'دوشنبه',
    nameEn: 'Monday',
    shortFa: 'دو',
    mood: 'ریتم و ثبات اجرایی',
    bgTint: 'bg-emerald-50/40',
    borderTint: 'border-emerald-200/70',
    textTint: 'text-emerald-900',
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-emerald-800',
    dotColor: '#10b981',
    printHeaderBg: '#ecfdf5',
    printBorder: '#a7f3d0',
  },
  {
    id: 'tue',
    nameFa: 'سه‌شنبه',
    nameEn: 'Tuesday',
    shortFa: 'سه',
    mood: 'انعطاف و استقامت',
    bgTint: 'bg-amber-50/40',
    borderTint: 'border-amber-200/70',
    textTint: 'text-amber-900',
    badgeBg: 'bg-amber-100/80',
    badgeText: 'text-amber-800',
    dotColor: '#f59e0b',
    printHeaderBg: '#fffbeb',
    printBorder: '#fde68a',
  },
  {
    id: 'wed',
    nameFa: 'چهارشنبه',
    nameEn: 'Wednesday',
    shortFa: 'چهار',
    mood: 'خلاقیت و حل مسئله',
    bgTint: 'bg-violet-50/40',
    borderTint: 'border-violet-200/70',
    textTint: 'text-violet-900',
    badgeBg: 'bg-violet-100/80',
    badgeText: 'text-violet-800',
    dotColor: '#8b5cf6',
    printHeaderBg: '#f5f3ff',
    printBorder: '#ddd6fe',
  },
  {
    id: 'thu',
    nameFa: 'پنجشنبه',
    nameEn: 'Thursday',
    shortFa: 'پنج',
    mood: 'جمع‌بندی و ارزیابی',
    bgTint: 'bg-rose-50/40',
    borderTint: 'border-rose-200/70',
    textTint: 'text-rose-900',
    badgeBg: 'bg-rose-100/80',
    badgeText: 'text-rose-800',
    dotColor: '#f43f5e',
    printHeaderBg: '#fff1f2',
    printBorder: '#fecdd3',
  },
  {
    id: 'fri',
    nameFa: 'جمعه',
    nameEn: 'Friday',
    shortFa: 'جمع',
    mood: 'ریکاوری و بازیابی ذهن',
    bgTint: 'bg-teal-50/40',
    borderTint: 'border-teal-200/70',
    textTint: 'text-teal-900',
    badgeBg: 'bg-teal-100/80',
    badgeText: 'text-teal-800',
    dotColor: '#14b8a6',
    printHeaderBg: '#f0fdfa',
    printBorder: '#99f6e4',
  },
];

export const CATEGORIES: Record<CategoryKey, CategoryTheme> = {
  university: {
    key: 'university',
    label: 'دانشگاه و رفت‌وآمد',
    tagline: 'محدودیت‌های قطعی / فشار تحصیلی',
    bgClass: 'bg-rose-50 hover:bg-rose-100/90',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-950',
    badgeClass: 'bg-rose-200/80 text-rose-800',
    dotColor: '#f43f5e',
    printBg: '#ffe4e6',
    printBorder: '#fda4af',
    printText: '#881337',
    icon: 'GraduationCap',
  },
  work: {
    key: 'work',
    label: 'پروژه کاری (Linux / Git)',
    tagline: 'کار حرفه‌ای و درآمدی / منطق سیستم',
    bgClass: 'bg-sky-50 hover:bg-sky-100/90',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-950',
    badgeClass: 'bg-sky-200/80 text-sky-800',
    dotColor: '#0284c7',
    printBg: '#e0f2fe',
    printBorder: '#7dd3fc',
    printText: '#0369a1',
    icon: 'Terminal',
  },
  python: {
    key: 'python',
    label: 'پایتون پیشرفته',
    tagline: 'پایه‌های عمیق / الگوها و فریم‌ورک‌ها',
    bgClass: 'bg-amber-50 hover:bg-amber-100/90',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-950',
    badgeClass: 'bg-amber-200/80 text-amber-800',
    dotColor: '#f59e0b',
    printBg: '#fef3c7',
    printBorder: '#fcd34d',
    printText: '#92400e',
    icon: 'Code2',
  },
  pytorch: {
    key: 'pytorch',
    label: 'پایتورچ و یادگیری عمیق',
    tagline: 'مدل‌سازی هوش مصنوعی و تنسورها',
    bgClass: 'bg-purple-50 hover:bg-purple-100/90',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-950',
    badgeClass: 'bg-purple-200/80 text-purple-800',
    dotColor: '#a855f7',
    printBg: '#f3e8ff',
    printBorder: '#d8b4fe',
    printText: '#6b21a8',
    icon: 'Cpu',
  },
  recovery: {
    key: 'recovery',
    label: 'ریکاوری، ناهار و تنفس',
    tagline: 'اکسیژن مغز / بازسازی قوای ذهنی',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/90',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-950',
    badgeClass: 'bg-emerald-200/80 text-emerald-800',
    dotColor: '#10b981',
    printBg: '#dcfce7',
    printBorder: '#86efac',
    printText: '#14532d',
    icon: 'Coffee',
  },
  gaming: {
    key: 'gaming',
    label: 'استراحت و رفرش ذهن',
    tagline: 'آرامش، رهایی از تنش و تجدید انرژی',
    bgClass: 'bg-orange-50 hover:bg-orange-100/90',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-950',
    badgeClass: 'bg-orange-200/80 text-orange-800',
    dotColor: '#f97316',
    printBg: '#ffedd5',
    printBorder: '#fdba74',
    printText: '#9a3412',
    icon: 'Coffee',
  },
  habit: {
    key: 'habit',
    label: 'عادت خرد (زبان انگلیسی)',
    tagline: '۲۰ دقیقه واژگان و مکالمه سبک',
    bgClass: 'bg-teal-50 hover:bg-teal-100/90',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-950',
    badgeClass: 'bg-teal-200/80 text-teal-800',
    dotColor: '#14b8a6',
    printBg: '#ccfbf1',
    printBorder: '#5eead4',
    printText: '#115e59',
    icon: 'Sparkles',
  },
  meeting: {
    key: 'meeting',
    label: 'جلسه کاری و سینک روزانه',
    tagline: 'ارتباط تیمی و برنامه‌ریزی اسپرینت',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100/90',
    borderClass: 'border-indigo-300',
    textClass: 'text-indigo-950',
    badgeClass: 'bg-indigo-200/80 text-indigo-800',
    dotColor: '#6366f1',
    printBg: '#e0e7ff',
    printBorder: '#a5b4fc',
    printText: '#3730a3',
    icon: 'Users',
  },
  custom: {
    key: 'custom',
    label: 'سفارشی / عمومی',
    tagline: 'تسک‌ها و امور شخصی آزاد',
    bgClass: 'bg-slate-50 hover:bg-slate-100/90',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-950',
    badgeClass: 'bg-slate-200 text-slate-800',
    dotColor: '#64748b',
    printBg: '#f1f5f9',
    printBorder: '#cbd5e1',
    printText: '#1e293b',
    icon: 'Bookmark',
  },
};

export const INITIAL_TEMPLATES: BlockTemplate[] = [
  {
    id: 'tmpl-uni',
    title: 'دانشگاه و مسیر',
    category: 'university',
    defaultDuration: 180,
    subtitle: 'کلاس‌ها، رفت‌وآمد و تعهدات دانشکده',
    description: 'تعهد زمانی ثابت - بدون استرس و با تمرکز در کلاس',
  },
  {
    id: 'tmpl-work',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    defaultDuration: 120,
    subtitle: 'حل تسک‌ها، پول‌ریکوئست و تست روی سرور',
    description: 'تمرکز عمیق روی تسک‌های فریلنس و توسعه سیستم',
  },
  {
    id: 'tmpl-python',
    title: 'پایتون پیشرفته',
    category: 'python',
    defaultDuration: 90,
    subtitle: 'Concurrency, OOP, Meta-programming',
    description: 'جلسه یادگیری عمیق و پایه‌ای زبان پایتون',
  },
  {
    id: 'tmpl-pytorch',
    title: 'پایتورچ و ماشین‌لرنینگ',
    category: 'pytorch',
    defaultDuration: 90,
    subtitle: 'Tensors, Autograd, Model Training & Loss',
    description: 'پیاده‌سازی شبکه‌های عصبی و تحلیل داده',
  },
  {
    id: 'tmpl-recovery',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    defaultDuration: 60,
    subtitle: 'تغذیه، چای، استراحت چشم و قدم زدن',
    description: 'اکسیژن‌گیری مغز جهت جلوگیری از فرسودگی ذهنی',
  },
  {
    id: 'tmpl-gaming',
    title: 'استراحت و رفرش ذهن',
    category: 'gaming',
    defaultDuration: 30,
    subtitle: 'پیاده‌روی، چای، استراحت چشم و کشش بدنی',
    description: 'آرامش و رهایی از خستگی بعد از بلوک کاری عمیق',
  },
  {
    id: 'tmpl-habit',
    title: 'زبان انگلیسی (اپلیکیشن ۲۰ دقیقه)',
    category: 'habit',
    defaultDuration: 30,
    subtitle: 'فلش‌کارت، اخبار تک و لیسنینگ',
    description: 'قانون اثر مرکب: مداومت روزانه بدون فشار روانی',
  },
  {
    id: 'tmpl-meeting',
    title: 'جلسه کاری (Daily Sync)',
    category: 'meeting',
    defaultDuration: 30,
    subtitle: 'هماهنگی تسک‌ها و رفع بلاکرها',
    description: 'سینک سریع ۱۵ الی ۳۰ دقیقه‌ای با تیم پروژه',
  },
];

export const INITIAL_SAMPLE_BLOCKS: TimeBlock[] = [
  // شنبه (Saturday)
  {
    id: 'b-sat-1',
    day: 'sat',
    title: 'دانشگاه و مسیر',
    category: 'university',
    startMinutes: 8 * 60, // 08:00
    durationMinutes: 210, // 3.5 hrs -> 11:30
    subtitle: 'کلاس‌های صبح و رفت‌وآمد',
    note: 'مرور جزوه در مسیر رفت',
  },
  {
    id: 'b-sat-2',
    day: 'sat',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 12 * 60, // 12:00
    durationMinutes: 60, // 13:00
    subtitle: 'تغذیه و استراحت کوتاه',
  },
  {
    id: 'b-sat-3',
    day: 'sat',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 13 * 60 + 30, // 13:30
    durationMinutes: 120, // 15:30
    subtitle: 'کانفیگ محیط CI/CD و حل باگ',
  },
  {
    id: 'b-sat-4',
    day: 'sat',
    title: 'پایتورچ و ماشین‌لرنینگ',
    category: 'pytorch',
    startMinutes: 16 * 60, // 16:00
    durationMinutes: 90, // 17:30
    subtitle: 'آموزش DataLoader و Custom Datasets',
  },
  {
    id: 'b-sat-5',
    day: 'sat',
    title: 'زبان انگلیسی (اپلیکیشن)',
    category: 'habit',
    startMinutes: 18 * 60, // 18:00
    durationMinutes: 30, // 18:30
    subtitle: 'واژگان تخصصی AI',
  },
  {
    id: 'b-sat-6',
    day: 'sat',
    title: 'استراحت و رفرش ذهن',
    category: 'gaming',
    startMinutes: 19 * 60, // 19:00
    durationMinutes: 60, // 20:00
    subtitle: 'آرامش و تجدید انرژی پایان روز کاری',
  },

  // یکشنبه (Sunday)
  {
    id: 'b-sun-1',
    day: 'sun',
    title: 'پایتون پیشرفته',
    category: 'python',
    startMinutes: 8 * 60 + 30, // 08:30
    durationMinutes: 90, // 10:00
    subtitle: 'Asyncio & Generators',
  },
  {
    id: 'b-sun-2',
    day: 'sun',
    title: 'جلسه کاری (Daily Sync)',
    category: 'meeting',
    startMinutes: 10 * 60 + 30, // 10:30
    durationMinutes: 30, // 11:00
    subtitle: 'گزارش تسک‌های Git به مدیر فنی',
  },
  {
    id: 'b-sun-3',
    day: 'sun',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 11 * 60, // 11:00
    durationMinutes: 120, // 13:00
    subtitle: 'اسکریپت‌نویسی Bash و داکرایز کردن',
  },
  {
    id: 'b-sun-4',
    day: 'sun',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 13 * 60, // 13:00
    durationMinutes: 60, // 14:00
    subtitle: 'ناهار و ۳۰ دقیقه پیاده‌روی',
  },
  {
    id: 'b-sun-5',
    day: 'sun',
    title: 'دانشگاه و مسیر',
    category: 'university',
    startMinutes: 14 * 60 + 30, // 14:30
    durationMinutes: 180, // 17:30
    subtitle: 'آزمایشگاه و سمینار ارشد',
  },
  {
    id: 'b-sun-6',
    day: 'sun',
    title: 'پایتورچ و ماشین‌لرنینگ',
    category: 'pytorch',
    startMinutes: 18 * 60 + 30, // 18:30
    durationMinutes: 90, // 20:00
    subtitle: 'تست معماری ResNet با PyTorch',
  },

  // دوشنبه (Monday)
  {
    id: 'b-mon-1',
    day: 'mon',
    title: 'دانشگاه و مسیر',
    category: 'university',
    startMinutes: 8 * 60, // 08:00
    durationMinutes: 180, // 11:00
    subtitle: 'کلاس‌های تئوری هوش مصنوعی',
  },
  {
    id: 'b-mon-2',
    day: 'mon',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 12 * 60, // 12:00
    durationMinutes: 60,
    subtitle: 'استراحت و قهوه',
  },
  {
    id: 'b-mon-3',
    day: 'mon',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 13 * 60 + 30, // 13:30
    durationMinutes: 150, // 16:00
    subtitle: 'مدیریت برنچ‌های Git و مرج تست‌ها',
  },
  {
    id: 'b-mon-4',
    day: 'mon',
    title: 'پایتون پیشرفته',
    category: 'python',
    startMinutes: 16 * 60 + 30, // 16:30
    durationMinutes: 90, // 18:00
    subtitle: 'تست‌نویسی با pytest و mypy',
  },
  {
    id: 'b-mon-5',
    day: 'mon',
    title: 'استراحت و رفرش ذهن',
    category: 'gaming',
    startMinutes: 19 * 60, // 19:00
    durationMinutes: 60,
    subtitle: 'پیاده‌روی و استراحت برای تمدد اعصاب',
  },

  // سه‌شنبه (Tuesday)
  {
    id: 'b-tue-1',
    day: 'tue',
    title: 'پایتورچ و ماشین‌لرنینگ',
    category: 'pytorch',
    startMinutes: 9 * 60, // 09:00
    durationMinutes: 120, // 11:00
    subtitle: 'Deep Learning: Fine-tuning Transformers',
  },
  {
    id: 'b-tue-2',
    day: 'tue',
    title: 'جلسه کاری (Daily Sync)',
    category: 'meeting',
    startMinutes: 11 * 60 + 30, // 11:30
    durationMinutes: 30,
    subtitle: 'دموی فیچرهای هفته برای کارفرما',
  },
  {
    id: 'b-tue-3',
    day: 'tue',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 12 * 60 + 30,
    durationMinutes: 60,
    subtitle: 'ناهار سبک و استراحت',
  },
  {
    id: 'b-tue-4',
    day: 'tue',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 14 * 60, // 14:00
    durationMinutes: 150, // 16:30
    subtitle: 'پیاده‌سازی لاگینگ و بهینه‌سازی کوئری',
  },
  {
    id: 'b-tue-5',
    day: 'tue',
    title: 'زبان انگلیسی (اپلیکیشن)',
    category: 'habit',
    startMinutes: 17 * 60 + 30,
    durationMinutes: 30,
    subtitle: '۲۰ دقیقه واژگان تخصصی',
  },

  // چهارشنبه (Wednesday)
  {
    id: 'b-wed-1',
    day: 'wed',
    title: 'دانشگاه و مسیر',
    category: 'university',
    startMinutes: 8 * 60,
    durationMinutes: 240, // 12:00
    subtitle: 'کلاس‌های پایانی و آزمایشگاه',
  },
  {
    id: 'b-wed-2',
    day: 'wed',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 12 * 60 + 30,
    durationMinutes: 60,
    subtitle: 'ناهار و آرامش',
  },
  {
    id: 'b-wed-3',
    day: 'wed',
    title: 'پایتون پیشرفته',
    category: 'python',
    startMinutes: 14 * 60,
    durationMinutes: 90,
    subtitle: 'طراحی سیستم ماژولار و پکیجینگ',
  },
  {
    id: 'b-wed-4',
    day: 'wed',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 16 * 60,
    durationMinutes: 120,
    subtitle: 'بررسی PRهای همکاران و ریلیز',
  },

  // پنجشنبه (Thursday)
  {
    id: 'b-thu-1',
    day: 'thu',
    title: 'پایتورچ و ماشین‌لرنینگ',
    category: 'pytorch',
    startMinutes: 9 * 60 + 30,
    durationMinutes: 120,
    subtitle: 'آزمایش و لاگ آزمایش‌ها با W&B',
  },
  {
    id: 'b-thu-2',
    day: 'thu',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 12 * 60,
    durationMinutes: 60,
    subtitle: 'استراحت',
  },
  {
    id: 'b-thu-3',
    day: 'thu',
    title: 'پروژه کاری (Linux/Git)',
    category: 'work',
    startMinutes: 13 * 60 + 30,
    durationMinutes: 120,
    subtitle: 'جمع‌بندی تسک‌های اسپرینت جاری',
  },
  {
    id: 'b-thu-4',
    day: 'thu',
    title: 'استراحت و رفرش ذهن',
    category: 'gaming',
    startMinutes: 18 * 60,
    durationMinutes: 90,
    subtitle: 'آرامش، رهایی از تنش کاری و ریلکس کامل',
  },

  // جمعه (Friday)
  {
    id: 'b-fri-1',
    day: 'fri',
    title: 'ریکاوری و ناهار',
    category: 'recovery',
    startMinutes: 9 * 60,
    durationMinutes: 90,
    subtitle: 'صبحانه مفصل، استراحت و خواب کافی',
  },
  {
    id: 'b-fri-2',
    day: 'fri',
    title: 'زبان انگلیسی (اپلیکیشن)',
    category: 'habit',
    startMinutes: 11 * 60,
    durationMinutes: 30,
    subtitle: 'مرور هفتگی لغات',
  },
  {
    id: 'b-fri-3',
    day: 'fri',
    title: 'پایتون پیشرفته',
    category: 'python',
    startMinutes: 14 * 60,
    durationMinutes: 90,
    subtitle: 'مطالعه مقالات تک و کد تفریحی',
  },
  {
    id: 'b-fri-4',
    day: 'fri',
    title: 'استراحت و رفرش ذهن',
    category: 'gaming',
    startMinutes: 17 * 60,
    durationMinutes: 90,
    subtitle: 'استراحت و تفریح آرام آخر هفته',
  },
];

// Helper to format minutes (e.g. 450) to "07:30"
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Convert "07:30" string to minutes
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Format duration into readable Persian string (e.g. "۱ ساعت و ۳۰ دقیقه")
export function formatDurationFa(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return `${h} ساعت و ${m} دقیقه`;
  } else if (h > 0) {
    return `${h} ساعت`;
  }
  return `${m} دقیقه`;
}

// Convert English numbers to Persian digits
export function toFaDigits(num: number | string): string {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (w) => faDigits[+w]);
}

// Anti-fragile reassuring quotes for negative perfectionism
export const MOTIVATIONAL_QUOTES = [
  "اگر دیر بیدار شدی، فقط بلوک‌ها رو بکش پایین. زنجیره رو نشکن: ۱ همیشه از ۰ بزرگ‌تره!",
  "انعطاف‌پذیری قدرت است نه ضعف؛ یک ساعت کدنویسی متمرکز از یک روز برنامه‌ریزی بی‌عمل باارزش‌تره.",
  "کمال‌گرایی منفی دشمن تحویل کار است. با تغییر برنامه، روزت رو نجات بده!",
  "برنامه برای خدمت به تمرکز توست، نه تو برای بردگی برنامه. هر موقع خواستی شیفتش بده.",
  "حتی نیم‌ساعت مطالعه پایتورچ یا کار روی گیت در یک روز شلوغ، پیروزی حساب میشه.",
];
