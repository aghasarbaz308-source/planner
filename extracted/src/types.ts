export type DayKey = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type StandardCategoryKey = 
  | 'university'
  | 'work'
  | 'python'
  | 'pytorch'
  | 'recovery'
  | 'gaming'
  | 'habit'
  | 'meeting'
  | 'custom';

export type CategoryKey = StandardCategoryKey | string;

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
  isCustom?: boolean;
  energyType?: 'deep_work' | 'shallow_work' | 'recovery' | 'constraint' | 'habit';
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
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
  isFixed?: boolean; // Anchor block: protected against automatic cascading and shifting
  checklist?: ChecklistItem[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  energyLevel?: 'deep_work' | 'shallow_work' | 'recovery' | 'habit';
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
  title?: string;
  plannerTitle?: string;
  weekRange: string;
  updatedAt?: string;
  exportedAt?: string;
  blocks: TimeBlock[];
  templates?: BlockTemplate[];
  customTemplates?: BlockTemplate[];
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

export interface WeeklyTaskItem {
  id: string;
  order: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'normal';
  category: CategoryKey;
  note?: string;
  createdAt: string;
}

export interface PlannerRulesConfig {
  strictNonOverlap: boolean;
  bufferMinutesBetweenTasks: number;
  maxDailyDeepWorkHours: number;
  warnDeepWorkOverLimit: boolean;
  maxConsecutiveFocusMinutes: number;
  warnUltradianBreakNeeded: boolean;
  nightShieldStartHour: number;
  warnNightShieldViolations: boolean;
  minTaskDurationMinutes: number;
  maxTaskDurationMinutes: number;
}

export interface WeeklyPillarsGoals {
  deepWorkTargetHours: number;
  workTargetHours: number;
  universityTargetHours: number;
  recoveryTargetHours: number;
  deepWorkTitle: string;
  deepWorkSubtitle: string;
  workTitle: string;
  workSubtitle: string;
  universityTitle: string;
  universitySubtitle: string;
  recoveryTitle: string;
  recoverySubtitle: string;
}

export interface DailyAuditItem {
  blockId: string;
  title: string;
  category: CategoryKey;
  plannedMinutes: number;
  actualMinutes: number;
  completionStatus: 'full' | 'partial_75' | 'half_50' | 'none';
  focusQuality: 'deep' | 'average' | 'distracted';
  note?: string;
}

export interface DailyReportCard {
  id?: string;
  weekId?: string;
  createdAt?: string;
  jalaliDateFa?: string;
  date: string;
  dayKey: DayKey;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  timeDeltaMinutes: number; // positive = saved time, negative = debt
  disciplineScore: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  completedTasksCount: number;
  totalTasksCount: number;
  deepWorkHours: number;
  insights: string[];
  items: DailyAuditItem[];
  lessonsLearned?: string;
  overallMood?: 'great' | 'good' | 'average' | 'exhausted';
}

export interface ReminderConfig {
  enabled: boolean;
  soundEnabled: boolean;
  volume: number; // 0 to 1
  soundType: 'zen' | 'marimba' | 'bell' | 'evening';
  blockAlertLeadMinutes: number; // 0, 2, 5, 10
  dailyAuditReminderEnabled: boolean;
  dailyAuditReminderTime: string; // e.g. "22:00"
  movieSleepReminderEnabled: boolean;
  movieSleepReminderTime: string; // e.g. "23:15"
  browserNotificationEnabled: boolean;
}

export type GridResolution = 15 | 30 | 60;

export interface EmergencyRecoveryPlan {
  day: DayKey;
  cause: string;
  lostMinutes: number;
  currentMinutes: number;
  debtMinutes: number;
  plannedWorkMinutes: number;
  penaltyRule: string;
  actionStrategy: 'compress' | 'shift' | 'offload';
  adjustedBlocks: TimeBlock[];
  summary: string;
}

