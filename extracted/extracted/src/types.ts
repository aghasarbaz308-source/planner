export type DayKey = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type CategoryKey = 
  | 'university'
  | 'work'
  | 'python'
  | 'pytorch'
  | 'recovery'
  | 'gaming'
  | 'habit'
  | 'meeting'
  | 'custom';

export interface DayInfo {
  id: DayKey;
  nameFa: string;
  nameEn: string;
  shortFa: string;
  mood: string;          // روانشناسی روز: مثلاً شروع تازه، تمرکز عمیق، ریتم و تثبیت
  bgTint: string;        // پس‌زمینه خیلی ملایم و آرامش‌بخش
  borderTint: string;    // بوردر ملایم
  textTint: string;      // رنگ متنی خوانا و باوقار
  badgeBg: string;       // کپسول مود روز
  badgeText: string;
  dotColor: string;      // رنگ نشانگر نقطه
  printHeaderBg: string; // رنگ پس‌زمینه دقیق برای نسخه چاپی A4
  printBorder: string;   // رنگ حاشیه چاپی
}

export interface CategoryTheme {
  key: CategoryKey;
  label: string;
  tagline: string;
  // Light mode & print styling
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  dotColor: string;
  printBg: string;
  printBorder: string;
  printText: string;
  icon: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  category: CategoryKey;
  day: DayKey;
  startMinutes: number; // e.g. 07:00 = 420 minutes
  durationMinutes: number; // e.g. 30, 60, 90, 120
  subtitle?: string;
  note?: string;
  completed?: boolean;
}

export interface BlockTemplate {
  id: string;
  title: string;
  category: CategoryKey;
  defaultDuration: number;
  subtitle: string;
  description: string;
}

export interface PlannerData {
  version: string;
  title: string;
  weekRange: string;
  updatedAt: string;
  blocks: TimeBlock[];
  customTemplates: BlockTemplate[];
}

export interface TimePhaseInfo {
  id: string;
  nameFa: string;
  nameEn: string;
  startHour: number;
  endHour: number;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  textDark: string;
  accentBar: string;
}
