import { TimeBlock, BlockTemplate, DayKey, CategoryKey } from '../types';
import {
  DAYS,
  CATEGORIES,
  TIME_PHASES,
  getTimePhase,
  minutesToTimeString,
  formatDurationFa,
  START_HOUR,
  END_HOUR,
  SLOT_INTERVAL,
} from '../constants/plannerConfig';

export interface AiPlannerExport {
  _schema: string;
  generated_at: string;
  app_version: string;
  philosophy_and_methodology: {
    core_framework: string;
    anti_fragility_principles: string[];
    circadian_energy_model: string;
  };
  planner_profile: {
    title: string;
    week_focus_sprint: string;
    operating_hours: string;
    time_slot_interval: string;
  };
  circadian_energy_phases: {
    phase_id: string;
    name_fa: string;
    name_en: string;
    time_window: string;
    description: string;
    recommended_cognitive_load: string;
  }[];
  categories_taxonomy: Record<
    CategoryKey,
    {
      label_fa: string;
      tagline_fa: string;
      cognitive_weight: 'very_high' | 'high' | 'medium' | 'restorative';
      role_description: string;
    }
  >;
  weekly_analytics: {
    total_planned_hours: number;
    total_blocks_count: number;
    completed_blocks_count: number;
    completion_rate_percent: number;
    deep_work_hours: number;
    recovery_and_rest_hours: number;
    work_to_recovery_ratio: string;
    day_by_day_breakdown: Record<
      DayKey,
      {
        day_fa: string;
        day_en: string;
        total_hours: number;
        deep_work_hours: number;
        recovery_hours: number;
        blocks_count: number;
        completed_count: number;
      }
    >;
  };
  weekly_schedule_by_day: Record<
    DayKey,
    {
      day_id: DayKey;
      day_name_fa: string;
      day_name_en: string;
      psychological_mood: string;
      total_hours: number;
      blocks_count: number;
      chronological_blocks: {
        id: string;
        time_slot: string;
        start_time_24h: string;
        end_time_24h: string;
        start_minutes: number;
        duration_minutes: number;
        duration_formatted_fa: string;
        title: string;
        subtitle: string;
        category: CategoryKey;
        category_label_fa: string;
        circadian_phase_fa: string;
        status: 'completed' | 'pending';
        notes: string;
      }[];
      free_buffer_slots: {
        time_slot: string;
        duration_minutes: number;
        phase_fa: string;
      }[];
    }
  >;
  templates_bank: {
    id: string;
    title: string;
    subtitle: string;
    category: CategoryKey;
    category_label_fa: string;
    default_duration_minutes: number;
    description: string;
  }[];
  raw_blocks: TimeBlock[];
  ai_assistant_prompts: {
    system_instruction: string;
    prompt_for_schedule_audit: string;
    prompt_for_daily_briefing: string;
    prompt_for_late_shift_rebalance: string;
  };
}

/**
 * Builds an AI-optimized and human-readable comprehensive JSON structure.
 * Contains both high-level semantic summaries for LLMs (Gemini, ChatGPT, Claude)
 * and raw structured blocks for lossless re-import.
 */
export function buildAiPlannerJson(
  title: string,
  weekRange: string,
  blocks: TimeBlock[],
  templates: BlockTemplate[]
): AiPlannerExport {
  // Sort blocks chronologically
  const sortedBlocks = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);

  // Compute analytics
  let totalMinutes = 0;
  let deepWorkMinutes = 0;
  let recoveryMinutes = 0;
  let completedCount = 0;

  const dayStats: Record<
    DayKey,
    {
      totalMinutes: number;
      deepWorkMinutes: number;
      recoveryMinutes: number;
      blocksCount: number;
      completedCount: number;
    }
  > = {
    sat: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    sun: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    mon: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    tue: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    wed: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    thu: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
    fri: { totalMinutes: 0, deepWorkMinutes: 0, recoveryMinutes: 0, blocksCount: 0, completedCount: 0 },
  };

  sortedBlocks.forEach((b) => {
    totalMinutes += b.durationMinutes;
    if (b.completed) completedCount++;

    const isDeep = b.category === 'pytorch' || b.category === 'python' || b.category === 'work';
    const isRecovery = b.category === 'recovery' || b.category === 'gaming';

    if (isDeep) deepWorkMinutes += b.durationMinutes;
    if (isRecovery) recoveryMinutes += b.durationMinutes;

    if (dayStats[b.day]) {
      dayStats[b.day].totalMinutes += b.durationMinutes;
      dayStats[b.day].blocksCount++;
      if (b.completed) dayStats[b.day].completedCount++;
      if (isDeep) dayStats[b.day].deepWorkMinutes += b.durationMinutes;
      if (isRecovery) dayStats[b.day].recoveryMinutes += b.durationMinutes;
    }
  });

  const completionRate =
    sortedBlocks.length > 0 ? Math.round((completedCount / sortedBlocks.length) * 100) : 0;
  const ratio =
    recoveryMinutes > 0
      ? `${(deepWorkMinutes / recoveryMinutes).toFixed(1)} : 1 (کار عمیق به ریکاوری)`
      : 'بدون ریکاوری ثبت‌شده';

  // Build daily schedule by day
  const weeklyScheduleByDay = {} as AiPlannerExport['weekly_schedule_by_day'];
  const dayBreakdown = {} as AiPlannerExport['weekly_analytics']['day_by_day_breakdown'];

  DAYS.forEach((dayInfo) => {
    const dayBlocks = sortedBlocks.filter((b) => b.day === dayInfo.id);
    const dayTotalMin = dayStats[dayInfo.id].totalMinutes;

    dayBreakdown[dayInfo.id] = {
      day_fa: dayInfo.nameFa,
      day_en: dayInfo.nameEn,
      total_hours: +(dayTotalMin / 60).toFixed(1),
      deep_work_hours: +(dayStats[dayInfo.id].deepWorkMinutes / 60).toFixed(1),
      recovery_hours: +(dayStats[dayInfo.id].recoveryMinutes / 60).toFixed(1),
      blocks_count: dayStats[dayInfo.id].blocksCount,
      completed_count: dayStats[dayInfo.id].completedCount,
    };

    // Formatted blocks
    const chronologicalBlocks = dayBlocks.map((b) => {
      const startStr = minutesToTimeString(b.startMinutes);
      const endStr = minutesToTimeString(b.startMinutes + b.durationMinutes);
      const cat = CATEGORIES[b.category] || CATEGORIES.custom;
      const hour = Math.floor(b.startMinutes / 60);
      const phase = getTimePhase(hour);

      return {
        id: b.id,
        time_slot: `${startStr} - ${endStr}`,
        start_time_24h: startStr,
        end_time_24h: endStr,
        start_minutes: b.startMinutes,
        duration_minutes: b.durationMinutes,
        duration_formatted_fa: formatDurationFa(b.durationMinutes),
        title: b.title,
        subtitle: b.subtitle || '',
        category: b.category,
        category_label_fa: cat.label,
        circadian_phase_fa: phase.nameFa,
        status: (b.completed ? 'completed' : 'pending') as 'completed' | 'pending',
        notes: b.note || '',
      };
    });

    // Detect free buffer intervals (30+ min gaps)
    const freeBuffers: { time_slot: string; duration_minutes: number; phase_fa: string }[] = [];
    let currentMarker = START_HOUR * 60;
    dayBlocks.forEach((b) => {
      if (b.startMinutes > currentMarker) {
        const gap = b.startMinutes - currentMarker;
        if (gap >= 30) {
          const phase = getTimePhase(Math.floor(currentMarker / 60));
          freeBuffers.push({
            time_slot: `${minutesToTimeString(currentMarker)} - ${minutesToTimeString(b.startMinutes)}`,
            duration_minutes: gap,
            phase_fa: phase.nameFa,
          });
        }
      }
      currentMarker = Math.max(currentMarker, b.startMinutes + b.durationMinutes);
    });
    if (currentMarker < END_HOUR * 60) {
      const gap = END_HOUR * 60 - currentMarker;
      if (gap >= 30) {
        const phase = getTimePhase(Math.floor(currentMarker / 60));
        freeBuffers.push({
          time_slot: `${minutesToTimeString(currentMarker)} - ${minutesToTimeString(END_HOUR * 60)}`,
          duration_minutes: gap,
          phase_fa: phase.nameFa,
        });
      }
    }

    weeklyScheduleByDay[dayInfo.id] = {
      day_id: dayInfo.id,
      day_name_fa: dayInfo.nameFa,
      day_name_en: dayInfo.nameEn,
      psychological_mood: dayInfo.mood,
      total_hours: +(dayTotalMin / 60).toFixed(1),
      blocks_count: dayBlocks.length,
      chronological_blocks: chronologicalBlocks,
      free_buffer_slots: freeBuffers,
    };
  });

  return {
    _schema: 'anti-fragile-timebox-ai-v2',
    generated_at: new Date().toISOString(),
    app_version: '2.0.0',
    philosophy_and_methodology: {
      core_framework: 'Anti-Fragile Timeboxing & Circadian Biological Rhythm Alignment',
      anti_fragility_principles: [
        '۱ همیشه از ۰ بزرگ‌تر است: در صورت بروز تاخیر، کل روز را رها نکنید؛ بلوک‌ها را شیفت دهید.',
        'آشتی با بیداری دیرهنگام (Late Shift Grace): انتقال نرم کارها بدون احساس گناه.',
        'تطابق شناختی با فازهای انرژی شبانه‌روز: اختصاص ساعات طلایی (۰۹:۰۰ تا ۱۳:۰۰) به کارهای عمیق مغزی.',
        'ریکاوری محافظت‌شده (Protected Recovery): ایجاد فضاهای تنفس و بازیابی انرژی به عنوان وظیفه حرفه‌ای.',
      ],
      circadian_energy_model:
        'تقسیم شبانه‌روز به ۵ فاز روان‌شناختی جهت تنظیم بهینه بار شناختی با نوسانات دوپامین و کورتیزول.',
    },
    planner_profile: {
      title,
      week_focus_sprint: weekRange,
      operating_hours: `${minutesToTimeString(START_HOUR * 60)} to ${minutesToTimeString(END_HOUR * 60)}`,
      time_slot_interval: `${SLOT_INTERVAL} minutes`,
    },
    circadian_energy_phases: TIME_PHASES.map((p) => ({
      phase_id: p.id,
      name_fa: p.nameFa,
      name_en: p.nameEn,
      time_window: `${String(p.startHour).padStart(2, '0')}:00 - ${String(p.endHour).padStart(2, '0')}:00`,
      description: p.description,
      recommended_cognitive_load:
        p.id === 'deep_focus'
          ? 'Maximum cognitive load (AI models, Deep Math, Systems Architecture)'
          : p.id === 'morning'
          ? 'Moderate, warming up (Routines, light physical exercise, sprint review)'
          : p.id === 'afternoon_momentum'
          ? 'Medium execution (Meetings, university lectures, PR reviews)'
          : p.id === 'twilight_synthesis'
          ? 'Creative & broad learning (Arxiv reading, open-source exploratory)'
          : 'Zero work, mental wind-down & nervous system recovery',
    })),
    categories_taxonomy: {
      pytorch: {
        label_fa: CATEGORIES.pytorch.label,
        tagline_fa: CATEGORIES.pytorch.tagline,
        cognitive_weight: 'very_high',
        role_description: 'توسعه مدل‌های هوش مصنوعی، یادگیری عمیق، پردازش تنسورها و آموزش شبکه‌ها',
      },
      python: {
        label_fa: CATEGORIES.python.label,
        tagline_fa: CATEGORIES.python.tagline,
        cognitive_weight: 'high',
        role_description: 'کدنویسی عمیق پایتون، معماری نرم‌افزار، الگوریتم‌ها و تست',
      },
      work: {
        label_fa: CATEGORIES.work.label,
        tagline_fa: CATEGORIES.work.tagline,
        cognitive_weight: 'high',
        role_description: 'پروژه‌های کاری، لینوکس، تعاملات گیت و توسعه سیستمی',
      },
      university: {
        label_fa: CATEGORIES.university.label,
        tagline_fa: CATEGORIES.university.tagline,
        cognitive_weight: 'medium',
        role_description: 'حضور در دانشگاه، کلاس‌های نظری و عملی، رفت‌وآمد',
      },
      meeting: {
        label_fa: CATEGORIES.meeting.label,
        tagline_fa: CATEGORIES.meeting.tagline,
        cognitive_weight: 'medium',
        role_description: 'جلسات هماهنگی، بازبینی اسپرینت و ارتباطات گروهی',
      },
      habit: {
        label_fa: CATEGORIES.habit.label,
        tagline_fa: CATEGORIES.habit.tagline,
        cognitive_weight: 'medium',
        role_description: 'عادت‌های پیوسته مانند تقویت زبان انگلیسی و مطالعه خرد',
      },
      recovery: {
        label_fa: CATEGORIES.recovery.label,
        tagline_fa: CATEGORIES.recovery.tagline,
        cognitive_weight: 'restorative',
        role_description: 'تغذیه مناسب، تنفس آگاهانه، چای و استراحت مغزی',
      },
      gaming: {
        label_fa: CATEGORIES.gaming.label,
        tagline_fa: CATEGORIES.gaming.tagline,
        cognitive_weight: 'restorative',
        role_description: 'تخلیه هیجان و تفریح کنترل‌شده برای بازگشت دوپامین',
      },
      custom: {
        label_fa: CATEGORIES.custom.label,
        tagline_fa: CATEGORIES.custom.tagline,
        cognitive_weight: 'medium',
        role_description: 'فعالیت‌های آزاد و امور شخصی متفرقه',
      },
    },
    weekly_analytics: {
      total_planned_hours: +(totalMinutes / 60).toFixed(1),
      total_blocks_count: sortedBlocks.length,
      completed_blocks_count: completedCount,
      completion_rate_percent: completionRate,
      deep_work_hours: +(deepWorkMinutes / 60).toFixed(1),
      recovery_and_rest_hours: +(recoveryMinutes / 60).toFixed(1),
      work_to_recovery_ratio: ratio,
      day_by_day_breakdown: dayBreakdown,
    },
    weekly_schedule_by_day: weeklyScheduleByDay,
    templates_bank: templates.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      category: t.category,
      category_label_fa: CATEGORIES[t.category]?.label || 'سفارشی',
      default_duration_minutes: t.defaultDuration,
      description: t.description,
    })),
    raw_blocks: blocks,
    ai_assistant_prompts: {
      system_instruction:
        'You are an elite, compassionate Deep Work and Anti-Fragile Timeboxing productivity coach specialized in AI & Software Engineers. You understand circadian energy phases, work-to-recovery ratios, and the anti-fragile principle that "1 is always greater than 0".',
      prompt_for_schedule_audit: `Analyze my weekly schedule above. Review:
1. Cognitive Load Distribution: Is my heavy Deep Work (PyTorch, Python, Work) aligned with peak biological focus hours (09:00 - 13:00)?
2. Recovery Balance: Do I have enough protected buffer and restorative blocks between deep sessions to avoid burnout?
3. Fragility Vulnerability: Identify any days with back-to-back dense commitments that are at risk of collapsing if delayed.
4. Three concrete, anti-fragile recommendations to optimize my week.`,
      prompt_for_daily_briefing: `Generate an executive, encouraging daily briefing for today based on the schedule provided. Summarize what needs to be accomplished in each energy phase, highlight the single most impactful high-leverage task, and provide one anti-fragile mindset reminder.`,
      prompt_for_late_shift_rebalance: `I woke up 2 hours later than planned today. Based on the anti-fragile schedule for today, re-prioritize and compress my blocks without guilt so that I still complete high-value deep work while preserving necessary rest.`,
    },
  };
}
