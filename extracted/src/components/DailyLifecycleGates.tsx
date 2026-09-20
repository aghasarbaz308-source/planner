import React from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  Target,
  ArrowLeft,
  X,
  Sparkles,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';
import { TimeBlock, DayKey } from '../types';
import { DAYS, formatDurationFa, toFaDigits } from '../constants/plannerConfig';

interface DailyLifecycleGatesProps {
  isOpenMorning: boolean;
  isOpenEvening: boolean;
  onCloseMorning: () => void;
  onCloseEvening: () => void;
  todayKey: DayKey;
  todayDateFa: string;
  blocks: TimeBlock[];
  onOpenFocusMode?: (block: TimeBlock) => void;
  onOpenDailyReport?: (day: DayKey) => void;
  theme?: 'light' | 'dark';
}

export const DailyLifecycleGates: React.FC<DailyLifecycleGatesProps> = ({
  isOpenMorning,
  isOpenEvening,
  onCloseMorning,
  onCloseEvening,
  todayKey,
  todayDateFa,
  blocks,
  onOpenFocusMode,
  onOpenDailyReport,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const dayInfo = DAYS.find((d) => d.id === todayKey) || DAYS[0];
  const todayBlocks = blocks
    .filter((b) => b.day === todayKey)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const completedToday = todayBlocks.filter((b) => b.completed);
  const totalPlannedMinutes = todayBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const completedMinutes = completedToday.reduce((acc, b) => acc + b.durationMinutes, 0);
  const completionRate =
    totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  // First high-leverage block of the day
  const firstActionableBlock = todayBlocks.find((b) => !b.completed) || todayBlocks[0];

  // Morning Horizon Briefing Modal
  if (isOpenMorning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md no-print animate-in fade-in duration-200">
        <div
          className={`rounded-3xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 text-slate-100 ring-1 ring-slate-700/50'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-lg shrink-0 ring-2 ring-white/30">
                <Sun className="w-6 h-6 text-white stroke-[2.2] animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">صبح بخیر! برنامه اجرایی امروز</h3>
                <p className="text-xs text-amber-100 font-medium mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {dayInfo.nameFa} • {todayDateFa}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMorning}
              className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-amber-50/70 border-amber-200/70'
                }`}
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  تعداد تسک‌های امروز
                </span>
                <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {toFaDigits(todayBlocks.length)}{' '}
                  <span className="text-xs font-normal text-slate-500">مورد</span>
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-indigo-50/70 border-indigo-200/70'
                }`}
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  مجموع زمان برنامه‌ریزی‌شده
                </span>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {formatDurationFa(totalPlannedMinutes)}
                </span>
              </div>
            </div>

            {/* High Leverage Focus Task */}
            {firstActionableBlock ? (
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? 'bg-gradient-to-br from-indigo-950/40 via-slate-800/50 to-slate-800/80 border-indigo-500/30'
                    : 'bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>اولین تسک محوری امروز:</span>
                  </span>
                  <span className="font-mono">
                    {formatDurationFa(firstActionableBlock.durationMinutes)}
                  </span>
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-white mb-1">
                  {firstActionableBlock.title}
                </h4>
                {firstActionableBlock.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {firstActionableBlock.subtitle}
                  </p>
                )}

                {onOpenFocusMode && (
                  <button
                    onClick={() => {
                      onCloseMorning();
                      onOpenFocusMode(firstActionableBlock);
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>ورود مستقیم به حالت تمرکز (Focus Mode)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border text-center text-xs text-slate-400">
                هیچ تسکی برای امروز ثبت نشده است. از منوی کناری بلوک جدید اضافه کنید.
              </div>
            )}

            {/* Motivational Anchor */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed flex items-center gap-2.5 ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                «تمرکز روی تسک‌های کلیدی در ساعات اولیه، احساس تسلط و بازدهی روز را تضمین می‌کند.»
              </span>
            </div>
          </div>

          {/* Footer Action */}
          <div
            className={`px-6 py-4 border-t flex items-center justify-end ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <button
              onClick={onCloseMorning}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              مشاهده تقویم هفتگی و شروع
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Evening Accountability Gate (Closing Ritual)
  if (isOpenEvening) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-200">
        <div
          className={`rounded-3xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 text-slate-100 ring-1 ring-slate-700/50'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-lg shrink-0 ring-2 ring-white/30">
                <Moon className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">پایان ساعات کاری • جمع‌بندی روز</h3>
                <p className="text-xs text-indigo-200 font-medium mt-0.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>
                    خسته نباشید! زمان بستن پرونده امروز فرا رسیده است.
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onCloseEvening}
              className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Completion Rate Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                completionRate >= 70
                  ? isDark
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : isDark
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-lg">
                  {toFaDigits(completionRate)}٪
                </div>
                <div>
                  <h4 className="font-black text-sm">میزان پایبندی به برنامه امروز</h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    {toFaDigits(completedToday.length)} از {toFaDigits(todayBlocks.length)} تسک به اتمام رسید
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            </div>

            {/* Tasks Summary List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                وضعیت وظایف امروز ({dayInfo.nameFa}):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {todayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      b.completed
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300 line-through opacity-75'
                          : 'bg-emerald-50/60 border-emerald-100 text-emerald-800 line-through opacity-75'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-bold truncate">{b.title}</span>
                    <span className="text-[11px] font-mono shrink-0 ml-2">
                      {formatDurationFa(b.durationMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Night Hygiene Notice */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed flex items-center gap-2.5 ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  : 'bg-purple-50/60 border-purple-200/70 text-purple-900'
              }`}
            >
              <Moon className="w-4 h-4 text-purple-500 shrink-0" />
              <span>
                با ثبت دستاوردهای امروز و رهاسازی کار، ذهن خود را برای استراحت عمیق و بازیابی شبانه آماده کنید.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            {onOpenDailyReport && (
              <button
                onClick={() => {
                  onCloseEvening();
                  onOpenDailyReport(todayKey);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>ثبت کارنامه و ارزیابی تفصیلی روز</span>
              </button>
            )}
            <button
              onClick={onCloseEvening}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              پایان روز و استراحت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
