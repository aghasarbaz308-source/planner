import React, { useState, useMemo } from 'react';
import {
  DayKey,
  TimeBlock,
  EmergencyRecoveryPlan,
  CategoryKey,
} from '../types';
import {
  DAYS,
  CATEGORIES,
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
  START_HOUR,
  END_HOUR,
  SLOT_INTERVAL,
} from '../constants/plannerConfig';
import {
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Smartphone,
  BatteryLow,
  BedDouble,
  Hourglass,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Flame,
  ShieldAlert,
  ArrowDownRight,
  TrendingUp,
  X,
} from 'lucide-react';

interface EmergencyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  onApplyPlan: (newBlocks: TimeBlock[], message: string) => void;
  currentDay?: DayKey;
}

type CrisisCause = 'phone_scrolling' | 'extreme_fatigue' | 'overslept' | 'unexpected_task' | 'procrastination';

interface CauseOption {
  id: CrisisCause;
  label: string;
  icon: React.ReactNode;
  penaltyTitle: string;
  penaltyAction: string;
  coachingMessage: string;
  badgeColor: string;
}

const CRISIS_CAUSES: CauseOption[] = [
  {
    id: 'phone_scrolling',
    label: 'اسکرول و پرش حواس در تلفن همراه',
    icon: <Smartphone className="w-4 h-4 text-rose-500" />,
    penaltyTitle: 'تعهد انضباطی: قطع اعلان‌ها و تمرکز مجدد',
    penaltyAction: 'قرار دادن تلفن همراه در حالت بی‌صدا تا پایان زمان کار + آغاز یک بلوک تمرکز ۳۰ دقیقه‌ای.',
    coachingMessage: 'از دست رفتن بخشی از روز به معنای ناموفق بودن کل برنامه نیست. تلفن همراه را کنار بگذارید و کار را با اولویت اول امروز ادامه دهید.',
    badgeColor: 'bg-rose-50 border-rose-200 text-rose-800',
  },
  {
    id: 'extreme_fatigue',
    label: 'خستگی، افت انرژی یا احساس مه مغزی',
    icon: <BatteryLow className="w-4 h-4 text-amber-500" />,
    penaltyTitle: 'اقدام بازیابی: استراحت کوتاه و احیای انرژی',
    penaltyAction: 'نوشیدن یک لیوان آب، ۵ دقیقه تنفس و کشش بدنی + کاهش کارهای جانبی برای حفظ تمرکز روی اصل برنامه.',
    coachingMessage: 'خستگی یک پیام طبیعی از سوی بدن است. به جای سرزنش، برنامه امروز را واقع‌بینانه کوتاه‌تر می‌کنیم تا کارهای اصلی انجام شوند.',
    badgeColor: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    id: 'overslept',
    label: 'خواب طولانی یا شروع با تاخیر',
    icon: <BedDouble className="w-4 h-4 text-indigo-500" />,
    penaltyTitle: 'اقدام اصلاحی: شروع مستقیم از زمان حاضر',
    penaltyAction: 'حذف کارهای غیرضروری و آغاز مستقیم مهم‌ترین تسک کاری از همین ساعت.',
    coachingMessage: 'خواب کافی خستگی روزهای گذشته را جبران کرده است. اکنون انرژی لازم را دارید؛ روز کاری خود را با انگیزه از همین لحظه آغاز کنید.',
    badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
  {
    id: 'unexpected_task',
    label: 'تداخل کاری پیش‌بینی‌نشده یا تماس فوری',
    icon: <Hourglass className="w-4 h-4 text-teal-500" />,
    penaltyTitle: 'مدیریت برنامه: اولویت‌بندی منعطف',
    penaltyAction: 'اختصاص زمان جبرانی در روزهای پنج‌شنبه و جمعه بدون ایجاد فشار روانی اضافه برای امشب.',
    coachingMessage: 'تداخل‌های غیرمنتظره بخشی از روال زندگی هستند. برنامه شما بازآرایی می‌شود تا کارهای کلیدی حفظ شوند و بقیه بدون نگرانی انتقال یابند.',
    badgeColor: 'bg-teal-50 border-teal-200 text-teal-800',
  },
  {
    id: 'procrastination',
    label: 'سختی شروع، تردید یا اهمال‌کاری',
    icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    penaltyTitle: 'قانون ۵ دقیقه: برداشتن گام اول',
    penaltyAction: 'تعهد به انجام ۵ دقیقه اول از تسک اصلی بدون نگرانی در مورد حجم کل کار.',
    coachingMessage: 'سخت‌ترین مرحله در هر کاری همان لحظه شروع است. وقتی ۵ دقیقه اول را پیش ببرید، تمرکز و جریان ذهنی به صورت طبیعی شکل می‌گیرد.',
    badgeColor: 'bg-orange-50 border-orange-200 text-orange-800',
  },
];

export const EmergencyRecoveryModal: React.FC<EmergencyRecoveryModalProps> = ({
  isOpen,
  onClose,
  blocks,
  onApplyPlan,
  currentDay,
}) => {
  // Determine current day of week (Persian: Sat=0, Sun=1... Fri=6)
  const defaultDayKey = useMemo<DayKey>(() => {
    if (currentDay) return currentDay;
    const dayIndex = new Date().getDay(); // Sun=0, Mon=1, ..., Sat=6
    const dayMap: Record<number, DayKey> = {
      6: 'sat',
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
    };
    return dayMap[dayIndex] || 'sat';
  }, [currentDay]);

  const [selectedDay, setSelectedDay] = useState<DayKey>(defaultDayKey);
  const [selectedCause, setSelectedCause] = useState<CrisisCause>('phone_scrolling');
  const [lostMinutes, setLostMinutes] = useState<number>(120); // 2 hours default
  
  // Real-time current clock minutes, rounded to nearest 15/30 min
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const now = new Date();
    const raw = now.getHours() * 60 + now.getMinutes();
    // Clamp to planner boundaries (07:00 to 23:00)
    const clamped = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, raw));
    // Round to nearest 30 mins
    return Math.floor(clamped / 30) * 30;
  });

  const [strategy, setStrategy] = useState<'compress' | 'shift' | 'offload'>('compress');
  const [copied, setCopied] = useState(false);
  const [acceptedDiscipline, setAcceptedDiscipline] = useState(true);

  // Day's existing blocks
  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.day === selectedDay)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [blocks, selectedDay]);

  // Productive blocks vs recovery
  const productiveBlocks = useMemo(() => {
    return dayBlocks.filter(
      (b) => b.category !== 'recovery' && b.category !== 'gaming'
    );
  }, [dayBlocks]);

  const totalPlannedProductiveMinutes = useMemo(() => {
    return productiveBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  }, [productiveBlocks]);

  // Available window from currentMinutes to END_HOUR (24:00)
  const availableRemainingMinutes = Math.max(0, END_HOUR * 60 - currentMinutes);

  // Calculate new proposed blocks for that day based on chosen strategy
  const { reScheduledBlocks, offloadedBlocks, debtHours, timeSummary } = useMemo(() => {
    const activeCause = CRISIS_CAUSES.find((c) => c.id === selectedCause)!;
    
    // Remaining blocks from current hour onward or uncompleted
    const uncompletedOrFuture = dayBlocks.filter(
      (b) => !b.completed || b.startMinutes >= currentMinutes
    );

    let adjusted: TimeBlock[] = [];
    let offloaded: TimeBlock[] = [];

    // Keep blocks that were ALREADY completed in the past as-is
    const completedPastBlocks = dayBlocks.filter(
      (b) => b.completed && b.startMinutes < currentMinutes
    );

    let cursor = Math.max(currentMinutes, START_HOUR * 60);

    if (strategy === 'compress') {
      // Compress future productive blocks by ~25-30% to fit them into available time
      uncompletedOrFuture.forEach((b) => {
        if (cursor >= END_HOUR * 60 - 30) {
          // No more time today, offload
          offloaded.push({ ...b, day: 'thu' });
          return;
        }

        let newDuration = b.durationMinutes;
        if (b.durationMinutes >= 120) {
          newDuration = Math.round((b.durationMinutes * 0.75) / 15) * 15; // 2h -> 90m
        } else if (b.durationMinutes >= 60) {
          newDuration = Math.max(45, Math.round((b.durationMinutes * 0.8) / 15) * 15);
        }

        // Clamp duration if exceeds 24:00
        if (cursor + newDuration > END_HOUR * 60) {
          newDuration = Math.max(30, END_HOUR * 60 - cursor);
        }

        adjusted.push({
          ...b,
          startMinutes: cursor,
          durationMinutes: newDuration,
          note: (b.note ? b.note + ' | ' : '') + `⚡ بازآرایی اضطراری (فشرده‌شده از ${toFaDigits(b.durationMinutes)} به ${toFaDigits(newDuration)} دقیقه)`,
        });

        cursor += newDuration;
      });
    } else if (strategy === 'shift') {
      // Linear shift from current time sequentially
      uncompletedOrFuture.forEach((b) => {
        if (cursor >= END_HOUR * 60) {
          offloaded.push({ ...b, day: 'thu' });
          return;
        }

        const fitDuration = Math.min(b.durationMinutes, END_HOUR * 60 - cursor);
        if (fitDuration >= 30) {
          adjusted.push({
            ...b,
            startMinutes: cursor,
            durationMinutes: fitDuration,
            note: (b.note ? b.note + ' | ' : '') + `⚡ شیفت زمانی از ساعت ${minutesToTimeString(currentMinutes)}`,
          });
          cursor += fitDuration;
        } else {
          offloaded.push({ ...b, day: 'thu' });
        }
      });
    } else {
      // Offload secondary tasks to Thursday/Friday, keep only top 2 priority tasks today
      const sortedByDuration = [...uncompletedOrFuture].sort((a, b) => b.durationMinutes - a.durationMinutes);
      const topTasks = sortedByDuration.slice(0, 2);
      const secondaryTasks = sortedByDuration.slice(2);

      topTasks.forEach((b) => {
        if (cursor < END_HOUR * 60) {
          const fitDuration = Math.min(b.durationMinutes, END_HOUR * 60 - cursor);
          adjusted.push({
            ...b,
            startMinutes: cursor,
            durationMinutes: fitDuration,
            note: (b.note ? b.note + ' | ' : '') + '⚡ اولویت قطعی امروز',
          });
          cursor += fitDuration;
        } else {
          offloaded.push({ ...b, day: 'thu' });
        }
      });

      secondaryTasks.forEach((b) => {
        offloaded.push({
          ...b,
          day: 'thu',
          startMinutes: 17 * 60,
          note: (b.note ? b.note + ' | ' : '') + '⚡ منتقل‌شده برای جبران مهربانانه',
        });
      });
    }

    const finalDayBlocks = [...completedPastBlocks, ...adjusted];
    const totalScheduledMins = finalDayBlocks
      .filter((b) => b.category !== 'recovery' && b.category !== 'gaming')
      .reduce((a, b) => a + b.durationMinutes, 0);

    const debtMins = Math.max(0, totalPlannedProductiveMinutes - totalScheduledMins);

    return {
      reScheduledBlocks: finalDayBlocks,
      offloadedBlocks: offloaded,
      debtHours: Number((debtMins / 60).toFixed(1)),
      timeSummary: {
        planned: Number((totalPlannedProductiveMinutes / 60).toFixed(1)),
        newScheduled: Number((totalScheduledMins / 60).toFixed(1)),
        debt: Number((debtMins / 60).toFixed(1)),
      },
    };
  }, [dayBlocks, currentMinutes, strategy, totalPlannedProductiveMinutes, selectedCause]);

  const activeCause = CRISIS_CAUSES.find((c) => c.id === selectedCause)!;

  const handleApply = () => {
    // Replace current day's blocks with reScheduledBlocks, and append any offloaded blocks to Thursday
    const otherDaysBlocks = blocks.filter(
      (b) => b.day !== selectedDay && !offloadedBlocks.some((o) => o.id === b.id)
    );

    const mergedBlocks = [...otherDaysBlocks, ...reScheduledBlocks, ...offloadedBlocks];
    
    const message = `⚡ برنامه روز ${DAYS.find((d) => d.id === selectedDay)?.nameFa} با موفقیت از ساعت ${minutesToTimeString(currentMinutes)} بازآرایی شد.`;
    onApplyPlan(mergedBlocks, message);
    onClose();
  };

  const handleCopyReport = () => {
    const dayName = DAYS.find((d) => d.id === selectedDay)?.nameFa || '';
    const text = `🌱 گزارش بازتنظیم و بازیابی برنامه
روز: ${dayName}
علت رخداد: ${activeCause.label}
زمان تاخیر: ${toFaDigits(lostMinutes)} دقیقه
ساعت آغاز مجدد: ${toFaDigits(minutesToTimeString(currentMinutes))}
ساعات کار برنامه‌ریزی‌شده: ${toFaDigits(timeSummary.planned)} ساعت
ساعات بازتنظیم‌شده امروز: ${toFaDigits(timeSummary.newScheduled)} ساعت
ساعات منتقل‌شده برای جبران: ${toFaDigits(timeSummary.debt)} ساعت

⚡ اقدام پیشنهادی برای بازگشت به تمرکز:
${activeCause.penaltyTitle}
${activeCause.penaltyAction}

💡 راهنمایی اجرایی:
${activeCause.coachingMessage}

«پایداری و تداوم رمز موفقیت است — شروع مجدد از همین لحظه ارزشمندترین تصمیم است.»`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  تنظیم مجدد و جبران هوشمند زمان
                </h2>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Adaptive Recovery
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                در صورت بروز تاخیر، خستگی یا تداخل کاری، برنامه امروز را بدون دغدغه از زمان فعلی بازتنظیم کنید.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Step 1: Day & Cause Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                انتخاب روز مورد نظر:
              </span>

              {/* Day chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {DAYS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDay(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedDay === d.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.nameFa}
                  </button>
                ))}
              </div>
            </div>

            {/* Cause Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                علت عقب‌ماندگی یا شرایط به وجود آمده چیست؟
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CRISIS_CAUSES.map((cause) => {
                  const isSelected = selectedCause === cause.id;
                  return (
                    <button
                      key={cause.id}
                      type="button"
                      onClick={() => setSelectedCause(cause.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-200'
                          : 'border-slate-200 bg-white hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-white shadow-2xs shrink-0">
                        {cause.icon}
                      </div>
                      <span className="text-xs font-bold leading-snug">
                        {cause.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Time Reality Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Clock Time to Start Re-schedule */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  ساعت شروع بازآرایی:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {toFaDigits(minutesToTimeString(currentMinutes))}
                </span>
              </label>

              {/* 1-Click Quick Preset Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const raw = now.getHours() * 60 + now.getMinutes();
                    setCurrentMinutes(Math.max(START_HOUR * 60, Math.min(22 * 60, Math.floor(raw / 15) * 15)));
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                  title="تنظیم خودکار بر اساس ساعت سیستم"
                >
                  ⚡ همین الان
                </button>
                {[
                  { label: 'ساعت ۱۰', m: 10 * 60 },
                  { label: 'ساعت ۱۲', m: 12 * 60 },
                  { label: 'ساعت ۱۴', m: 14 * 60 },
                  { label: 'ساعت ۱۶', m: 16 * 60 },
                  { label: 'ساعت ۱۸', m: 18 * 60 },
                  { label: 'ساعت ۲۰', m: 20 * 60 },
                ].map((preset) => (
                  <button
                    key={preset.m}
                    type="button"
                    onClick={() => setCurrentMinutes(preset.m)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-colors ${
                      currentMinutes === preset.m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={START_HOUR * 60}
                  max={22 * 60}
                  step={15}
                  value={currentMinutes}
                  onChange={(e) => setCurrentMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>۰۷:۰۰ صبح</span>
                <span>۱۴:۰۰ ظهر</span>
                <span>۲۲:۰۰ شب</span>
              </div>
            </div>

            {/* Time Lost Input */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hourglass className="w-4 h-4 text-rose-500" />
                  میزان زمان سوخته / از دست رفته:
                </span>
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {toFaDigits(lostMinutes)} دقیقه ({toFaDigits((lostMinutes / 60).toFixed(1))}س)
                </span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLostMinutes(m)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                      lostMinutes === m
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {formatDurationFa(m)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>کنترل سریع مقدار:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLostMinutes((prev) => Math.max(15, prev - 15))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md"
                  >
                    ۱۵-
                  </button>
                  <button
                    type="button"
                    onClick={() => setLostMinutes((prev) => Math.min(360, prev + 15))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md"
                  >
                    ۱۵+
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Time Balance Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                تراز ریاضی زمان امروز:
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                فرصت باقیمانده تا پایان شب: <b className="text-white font-mono">{toFaDigits((availableRemainingMinutes / 60).toFixed(1))} ساعت</b>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-lg p-2 border border-white/5">
                <span className="text-[10px] text-slate-300 block">برنامه اولیه</span>
                <span className="text-sm font-black font-mono text-white">
                  {toFaDigits(timeSummary.planned)}س
                </span>
              </div>
              <div className="bg-emerald-500/20 rounded-lg p-2 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block">برنامه جدید امروز</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {toFaDigits(timeSummary.newScheduled)}س
                </span>
              </div>
              <div className="bg-rose-500/20 rounded-lg p-2 border border-rose-500/30">
                <span className="text-[10px] text-rose-300 block">بدهی زمانی / انتقال</span>
                <span className="text-sm font-black font-mono text-rose-400">
                  {toFaDigits(timeSummary.debt)}س
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Coach Feedback & Anti-Fragile Penalty Protocol */}
          <div className={`p-4 rounded-xl border ${activeCause.badgeColor} space-y-2.5`}>
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-white/80 shadow-2xs shrink-0 text-amber-600">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-sm">{activeCause.penaltyTitle}</h4>
                <p className="font-semibold text-slate-800 leading-relaxed">
                  📌 <span className="font-bold">دستور اقدام تنبیهی/جبرانی:</span> {activeCause.penaltyAction}
                </p>
                <p className="text-slate-600 italic leading-relaxed pt-1">
                  💬 <span className="font-bold">پیام مربی ضدشکننده:</span> {activeCause.coachingMessage}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={acceptedDiscipline}
                  onChange={(e) => setAcceptedDiscipline(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                این تعهد انضباطی را پذیرفتم و تلفن همراه را بلافاصله سایلنت می‌کنم.
              </label>

              <button
                type="button"
                onClick={handleCopyReport}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-md border border-black/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'کپی شد!' : 'کپی تعهدنامه'}
              </button>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              استراتژی بازچینی هوشمند جدول:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStrategy('compress')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  strategy === 'compress'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xs font-extrabold block mb-1">
                  ۱. فشرده‌سازی اولویت‌دار (پیشنهادی)
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  کاهش ۲۵٪ از مدت تسک‌ها برای اتمام تمام کارهای اصلی تا پایان شب.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('shift')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  strategy === 'shift'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xs font-extrabold block mb-1">
                  ۲. شیفت زنجیره‌ای از ساعت فعلی
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  قرار دادن تسک‌ها دقیقاً با همان مدت زمان به ترتیب از همین لحظه به بعد.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('offload')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  strategy === 'offload'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xs font-extrabold block mb-1">
                  ۳. نجات هسته و انتقال بدهی
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  تمرکز روی ۲ تسک کلیدی و انتقال تسک‌های فرعی به پنجشنبه/جمعه.
                </span>
              </button>
            </div>
          </div>

          {/* Live Preview of Re-scheduled Blocks */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                پیش‌نمایش بلوک‌های بازآرایی‌شده امروز:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {toFaDigits(reScheduledBlocks.length)} بلوک
              </span>
            </div>

            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
              {reScheduledBlocks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  هیچ بلوکی برای امروز ثبت نشده است.
                </div>
              ) : (
                reScheduledBlocks.map((b) => {
                  const cat = CATEGORIES[b.category] || CATEGORIES.work;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.dotColor }}
                        />
                        <span className="font-bold text-slate-800 truncate">
                          {b.title}
                        </span>
                        {b.subtitle && (
                          <span className="text-[10px] text-slate-400 truncate">
                            ({b.subtitle})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        <span className="text-slate-600">
                          {toFaDigits(minutesToTimeString(b.startMinutes))} تا{' '}
                          {toFaDigits(minutesToTimeString(b.startMinutes + b.durationMinutes))}
                        </span>
                        <span className="bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-700">
                          {toFaDigits(b.durationMinutes)}د
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {offloadedBlocks.length > 0 && (
              <div className="bg-amber-50/70 p-2.5 border-t border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                <span>
                  ⚠️ <span className="font-bold">{toFaDigits(offloadedBlocks.length)} تسک</span> به دلیل کمبود زمان تا نیمه‌شب، به اسلات جبرانی پنجشنبه منتقل شدند.
                </span>
                <span className="font-mono font-bold text-amber-800">
                  +{toFaDigits(offloadedBlocks.reduce((a, b) => a + b.durationMinutes, 0))} دقیقه
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            انصراف
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              اعمال بازآرایی زنده در جدول تقویم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
