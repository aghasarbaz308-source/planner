import { PlannerRulesConfig, WeeklyPillarsGoals } from '../types';

export const DEFAULT_PLANNER_RULES: PlannerRulesConfig = {
  strictNonOverlap: true,             // جلوگیری از همپوشانی و جابه‌جایی منظم کارت‌ها (Cascade)
  bufferMinutesBetweenTasks: 0,       // فاصله استراحت پیش‌فرض بین تسک‌های متوالی (0 دقیقه)
  maxDailyDeepWorkHours: 5,           // سقف توصیه شده کار متمرکز روزانه (5 ساعت)
  warnDeepWorkOverLimit: true,        // هشدار هوشمند در صورت تکمیل ظرفیت کاری روزانه
  maxConsecutiveFocusMinutes: 90,     // بازه تمرکز پیوسته استاندارد: ۹۰ دقیقه
  warnUltradianBreakNeeded: true,     // پیشنهاد درج زمان استراحت پس از ۹۰ دقیقه کار مداوم
  nightShieldStartHour: 22.5,         // ساعت ۲۲:۳۰ شب شروع حفاظت استراحت شبانه
  warnNightShieldViolations: true,    // هشدار برنامه‌ریزی کارهای سنگین در ساعات پایانی شب
  minTaskDurationMinutes: 15,         // حداقل طول هر کارت (۱۵ دقیقه)
  maxTaskDurationMinutes: 180,        // حداکثر طول هر کارت (۱۸۰ دقیقه)
};

export const DEFAULT_WEEKLY_GOALS: WeeklyPillarsGoals = {
  deepWorkTargetHours: 14,            // هدف هفتگی کار متمرکز
  workTargetHours: 14,                // هدف هفتگی پروژه‌های کاری
  universityTargetHours: 12,          // هدف هفتگی دانشگاه و مسیر
  recoveryTargetHours: 14,            // هدف هفتگی استراحت و تفریح سالم
  deepWorkTitle: 'کار متمرکز (توسعه و یادگیری)',
  deepWorkSubtitle: 'برنامه‌نویسی، مطالعه تخصصی و هوش مصنوعی',
  workTitle: 'پروژه‌های کاری و اجرایی',
  workSubtitle: 'تسک‌های شغلی، توسعه سیستم و جلسات',
  universityTitle: 'دانشگاه و آموزش',
  universitySubtitle: 'کلاس‌های درس و پروژه‌های آکادمیک',
  recoveryTitle: 'استراحت و بازیابی انرژی',
  recoverySubtitle: 'ورزش، تنفس، تغذیه سالم و تفریح',
};
