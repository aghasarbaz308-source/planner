import { PlannerRulesConfig, WeeklyPillarsGoals } from '../types';

export const DEFAULT_PLANNER_RULES: PlannerRulesConfig = {
  strictNonOverlap: true,             // جلوگیری قطعی از همپوشانی و هل دادن هوشمند خودکار کارت‌ها (Cascade)
  bufferMinutesBetweenTasks: 0,       // فاصله استراحت پیش‌فرض بین تسک‌های پشت‌سرهم (0 دقیقه، مماس دقیق)
  maxDailyDeepWorkHours: 5,           // سقف توصیه شده کار عمیق روزانه (5 ساعت)
  warnDeepWorkOverLimit: true,        // هشدار هوشمند در صورت پر شدن ظرفیت شناختی
  maxConsecutiveFocusMinutes: 90,     // ریتم اولترادین: 90 دقیقه تمرکز پیوسته
  warnUltradianBreakNeeded: true,     // پیشنهاد درج استراحت بعد از 90 دقیقه کار مداوم
  nightShieldStartHour: 22.5,         // ساعت 22:30 شب شروع حفاظت خواب و منع کارهای پرفشار
  warnNightShieldViolations: true,    // هشدار برنامه‌ریزی کار سنگین در ساعات شبانه
  minTaskDurationMinutes: 15,         // حداقل طول هر کارت (15 دقیقه)
  maxTaskDurationMinutes: 180,        // حداکثر طول هر کارت (180 دقیقه)
};

export const DEFAULT_WEEKLY_GOALS: WeeklyPillarsGoals = {
  deepWorkTargetHours: 14,            // هدف هفتگی کار عمیق
  workTargetHours: 14,                // هدف هفتگی پروژه‌های کاری
  universityTargetHours: 12,          // هدف هفتگی دانشگاه و مسیر
  recoveryTargetHours: 14,            // هدف هفتگی ریکاوری و دوپامین
  deepWorkTitle: 'کار عمیق (AI & Python)',
  deepWorkSubtitle: 'پایتون پیشرفته + مدل‌سازی PyTorch',
  workTitle: 'پروژه کاری (Linux/Git)',
  workSubtitle: 'تسک‌های فریلنس و توسعه سیستم',
  universityTitle: 'دانشگاه و آموزش',
  universitySubtitle: 'کلاس‌ها و پروژه‌های آکادمیک',
  recoveryTitle: 'ریکاوری و تعادل دوپامین',
  recoverySubtitle: 'ورزش، تنفس، تغذیه و تفریح سالم',
};
