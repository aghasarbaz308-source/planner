import { DayInfo, CategoryTheme, CategoryKey, BlockTemplate, TimeBlock, TimePhaseInfo } from '../types';

export const START_HOUR = 7;
export const END_HOUR = 24; // up to 24:00
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 17 * 60 = 1020 minutes
export const SLOT_INTERVAL = 30; // 30-minute intervals
export const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_INTERVAL; // 34 intervals

// بازه‌های زمانی و سطوح انرژی شبانه‌روزی (Circadian & Productivity Phases)
export const TIME_PHASES: TimePhaseInfo[] = [
  {
    id: 'morning',
    nameFa: 'آغاز روز و آماده‌سازی',
    nameEn: 'Ignition',
    startHour: 7,
    endHour: 9,
    description: 'بیداری، برنامه‌ریزی، ورزش صبحگاهی و تنظیم اهداف روز',
    color: '#d97706',
    bgLight: 'bg-amber-50/60',
    borderLight: 'border-amber-200/80',
    textDark: 'text-amber-900',
    accentBar: 'bg-amber-500',
  },
  {
    id: 'deep_focus',
    nameFa: 'اوج تمرکز کاری',
    nameEn: 'Deep Focus',
    startHour: 9,
    endHour: 13,
    description: 'اولویت‌های اصلی، برنامه‌نویسی و کارهای نیازمند تفکر متمرکز',
    color: '#4f46e5',
    bgLight: 'bg-indigo-50/60',
    borderLight: 'border-indigo-200/80',
    textDark: 'text-indigo-900',
    accentBar: 'bg-indigo-500',
  },
  {
    id: 'afternoon_momentum',
    nameFa: 'اجرا و پیگیری',
    nameEn: 'Execution',
    startHour: 13,
    endHour: 17,
    description: 'کارهای اجرایی، جلسات، تعهدات تحصیلی و پیگیری امور جاری',
    color: '#0d9488',
    bgLight: 'bg-teal-50/60',
    borderLight: 'border-teal-200/80',
    textDark: 'text-teal-900',
    accentBar: 'bg-teal-500',
  },
  {
    id: 'twilight_synthesis',
    nameFa: 'مرور و یادگیری',
    nameEn: 'Synthesis',
    startHour: 17,
    endHour: 21,
    description: 'یادگیری مهارت‌های نو، مطالعه، مستندسازی و کارهای فردی',
    color: '#7c3aed',
    bgLight: 'bg-purple-50/60',
    borderLight: 'border-purple-200/80',
    textDark: 'text-purple-900',
    accentBar: 'bg-purple-500',
  },
  {
    id: 'restoration_night',
    nameFa: 'استراحت و بازیابی',
    nameEn: 'Restoration',
    startHour: 21,
    endHour: 24,
    description: 'آرامش شبانگاهی، فراغت، ارتباط با خانواده و آماده‌سازی خواب',
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
    mood: 'تمرکز کاری و پیشبرد اهداف',
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
    label: 'دانشگاه و تعهدات ثابت',
    tagline: 'کلاس‌های درس، رفت‌وآمد و امور آموزشی',
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
    label: 'پروژه‌های کاری و اجرایی',
    tagline: 'توسعه نرم‌افزار، امور فریلنس و وظایف شغلی',
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
    label: 'برنامه‌نویسی پایتون',
    tagline: 'معماری نرم‌افزار، الگوریتم‌ها و پروژه‌ها',
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
    label: 'هوش مصنوعی و یادگیری ماشین',
    tagline: 'یادگیری عمیق، مدل‌ها و تحلیل داده‌ها',
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
    label: 'استراحت و وعده غذایی',
    tagline: 'تغذیه سالم، پیاده‌روی و تجدید قوای ذهنی',
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
    label: 'فراغت و تجدید انرژی',
    tagline: 'استراحت کوتاه، سرگرمی سالم و رفع خستگی',
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
    label: 'عادت‌های روزانه و زبان',
    tagline: 'مطالعه روزانه زبان، ورزش و روتین‌های فردی',
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
    label: 'جلسات و هماهنگی کاری',
    tagline: 'جلسات تیمی، هماهنگی پروژه‌ها و گفتگوها',
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
    label: 'سفارشی و متفرقه',
    tagline: 'برنامه‌ها و فعالیت‌های عمومی',
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
    title: 'دانشگاه و تعهدات ثابت',
    category: 'university',
    defaultDuration: 180,
    subtitle: 'کلاس‌های حضوری، رفت‌وآمد و کارهای آموزشی',
    description: 'زمان‌بندی قطعی برای حضور در کلاس و مطالعه',
  },
  {
    id: 'tmpl-work',
    title: 'پروژه کاری و اجرایی',
    category: 'work',
    defaultDuration: 120,
    subtitle: 'توسعه نرم‌افزار، بررسی کد و تحویل وظایف',
    description: 'پیشبرد وظایف شغلی و تعهدات کاری با تمرکز بالا',
  },
  {
    id: 'tmpl-python',
    title: 'توسعه و برنامه‌نویسی پایتون',
    category: 'python',
    defaultDuration: 90,
    subtitle: 'معماری کد، شیءگرایی و الگوریتم‌های کاربردی',
    description: 'تمرین ساختاریافته کدنویسی و توسعه مهارت',
  },
  {
    id: 'tmpl-pytorch',
    title: 'هوش مصنوعی و یادگیری عمیق',
    category: 'pytorch',
    defaultDuration: 90,
    subtitle: 'آموزش مدل‌ها، تحلیل داده‌ها و ارزیابی نتایج',
    description: 'پیاده‌سازی و اجرای پروژه‌های یادگیری ماشین',
  },
  {
    id: 'tmpl-recovery',
    title: 'استراحت و صرف ناهار',
    category: 'recovery',
    defaultDuration: 60,
    subtitle: 'تغذیه، نوشیدنی، استراحت چشم و قدم زدن کوتاه',
    description: 'بازیابی انرژی برای ادامه روز با نشاط',
  },
  {
    id: 'tmpl-gaming',
    title: 'فراغت و رفع خستگی',
    category: 'gaming',
    defaultDuration: 30,
    subtitle: 'پیاده‌روی سبک، استراحت چشم و کشش بدنی',
    description: 'ایجاد وقفه سالم پس از یک بازه کاری متمرکز',
  },
  {
    id: 'tmpl-habit',
    title: 'مطالعه زبان انگلیسی',
    category: 'habit',
    defaultDuration: 30,
    subtitle: 'مرور واژگان، گوش دادن به پادکست و تمرین روزانه',
    description: 'استمرار روزانه و پیشرفت مداوم بدون فشار مضاعف',
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
// Wrapped in Unicode Left-to-Right Mark (\u200E) to guarantee that hours and minutes
// NEVER mirror or swap in RTL/Persian rendering contexts!
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `\u200E${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}\u200E`;
}

// Convert "07:30" or "۰۷:۳۰" string to minutes, handling Unicode marks and Persian digits
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const faToEn: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  const normalized = String(timeStr).replace(/[۰-۹]/g, (d) => faToEn[d] || d);
  const clean = normalized.replace(/[^\d:]/g, '');
  const [h, m] = clean.split(':').map(Number);
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

// جملات انگیزشی و هدایت‌گر برای حفظ انعطاف‌پذیری و تداوم مسیر
export const MOTIVATIONAL_QUOTES = [
  "پایداری و تداوم رمز موفقیت است: حتی یک گام کوچک، همواره ارزشمندتر از توقف کامل است.",
  "انعطاف‌پذیری هوشمندانه قدرت اجرایی است؛ تمرکز بر اولویت‌های واقعی مهم‌تر از اصرار بر برنامه‌های غیرعملی است.",
  "برنامه‌ریزی ابزاری در خدمت پیشرفت شماست؛ در صورت لزوم برنامه را بازتنظیم کرده و با انگیزه ادامه دهید.",
  "انجام منظم یک ساعت کار باکیفیت و متمرکز، نتایجی بسیار ماندگارتر از ساعت‌ها شتاب‌زدگی به همراه دارد.",
  "در برابر تغییرات روزانه منعطف باشید؛ هنر برنامه‌ریزی حرفه‌ای در انطباق‌پذیری سریع و حفظ آرامش است.",
];
