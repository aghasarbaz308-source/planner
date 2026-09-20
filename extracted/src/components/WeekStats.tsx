import React from 'react';
import { X, Sparkles, Brain, Award, Activity, HeartHandshake } from 'lucide-react';
import { TimeBlock, CategoryKey } from '../types';
import { formatDurationFa, toFaDigits } from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface WeekStatsProps {
  blocks: TimeBlock[];
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const WeekStats: React.FC<WeekStatsProps> = ({ blocks, isOpen, onClose, theme = 'dark' }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Calculate total minutes per category
  const categoryTotals: Record<CategoryKey, number> = {
    university: 0,
    work: 0,
    python: 0,
    pytorch: 0,
    recovery: 0,
    gaming: 0,
    habit: 0,
    meeting: 0,
    custom: 0,
  };

  let totalPlannedMinutes = 0;
  let completedMinutes = 0;

  blocks.forEach((block) => {
    categoryTotals[block.category] =
      (categoryTotals[block.category] || 0) + block.durationMinutes;
    totalPlannedMinutes += block.durationMinutes;
    if (block.completed) {
      completedMinutes += block.durationMinutes;
    }
  });

  const deepWorkMinutes = categoryTotals.python + categoryTotals.pytorch;
  const workMinutes = categoryTotals.work + categoryTotals.meeting;
  const restMinutes = categoryTotals.recovery + categoryTotals.gaming;
  const universityMinutes = categoryTotals.university;

  const completionRate =
    totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  return (
    <div
      className={`border-b px-3 sm:px-5 py-4 no-print shadow-xl transition-colors animate-in fade-in duration-300 ${
        isDark
          ? 'bg-slate-950/90 backdrop-blur-2xl border-slate-800/90 text-slate-100'
          : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-800 shadow-md'
      }`}
    >
      <div className="max-w-[1920px] mx-auto">
        {/* Top Header Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-2.5 border-b ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 ring-1 ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-teal-500/20 text-indigo-400 border border-indigo-400/30 ring-indigo-500/20'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-indigo-200'
              }`}
            >
              <Brain className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3
                  className={`text-sm sm:text-base font-black tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  داشبورد تعادل و تحلیل زمان‌بندی هفته
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold border flex items-center gap-1.5 shadow-2xs ${
                    isDark
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    {toFaDigits(completionRate)}٪ تحقق برنامه ({formatDurationFa(completedMinutes)})
                  </span>
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 font-medium hidden sm:block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                ارزیابی توزیع ساعات کاری، تمرکز و استراحت در طول هفته
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-90 ${
              isDark
                ? 'text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            title="بستن داشبورد تعادل هفتگی"
            aria-label="بستن داشبورد تعادل هفتگی"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 4 Pillars Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* 1. Deep Work (AI & Python) */}
          <div
            className={`group relative p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
              isDark
                ? 'bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900/90 border-purple-500/30 hover:border-purple-400/60 shadow-purple-950/20'
                : 'bg-purple-50/80 border-purple-200 hover:border-purple-300 shadow-purple-900/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black mb-1.5">
              <span
                className={`flex items-center gap-1.5 ${
                  isDark ? 'text-purple-300' : 'text-purple-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>تمرکز کاری و یادگیری</span>
              </span>
              <div
                className={`p-1.5 rounded-lg ring-1 ${
                  isDark
                    ? 'bg-purple-500/20 text-purple-300 ring-purple-500/30'
                    : 'bg-purple-100 text-purple-700 ring-purple-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight my-0.5 ${
                isDark ? 'text-white' : 'text-purple-950'
              }`}
            >
              {formatDurationFa(deepWorkMinutes)}
            </div>
            <p
              className={`text-[11px] font-medium ${
                isDark ? 'text-purple-300/80' : 'text-purple-700/80'
              }`}
            >
              پایتون پیشرفته و مدل‌سازی هوش مصنوعی
            </p>
          </div>

          {/* 2. Work Project */}
          <div
            className={`group relative p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
              isDark
                ? 'bg-gradient-to-br from-sky-950/40 via-slate-900/80 to-slate-900/90 border-sky-500/30 hover:border-sky-400/60 shadow-sky-950/20'
                : 'bg-sky-50/80 border-sky-200 hover:border-sky-300 shadow-sky-900/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black mb-1.5">
              <span
                className={`flex items-center gap-1.5 ${
                  isDark ? 'text-sky-300' : 'text-sky-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>پروژه‌ها و جلسات کاری</span>
              </span>
              <div
                className={`p-1.5 rounded-lg ring-1 ${
                  isDark
                    ? 'bg-sky-500/20 text-sky-300 ring-sky-500/30'
                    : 'bg-sky-100 text-sky-700 ring-sky-200'
                }`}
              >
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight my-0.5 ${
                isDark ? 'text-white' : 'text-sky-950'
              }`}
            >
              {formatDurationFa(workMinutes)}
            </div>
            <p
              className={`text-[11px] font-medium ${
                isDark ? 'text-sky-300/80' : 'text-sky-700/80'
              }`}
            >
              فعالیت‌های اجرایی و جلسات هماهنگی
            </p>
          </div>

          {/* 3. University & Constraints */}
          <div
            className={`group relative p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
              isDark
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-900/90 border-rose-500/30 hover:border-rose-400/60 shadow-rose-950/20'
                : 'bg-rose-50/80 border-rose-200 hover:border-rose-300 shadow-rose-900/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black mb-1.5">
              <span
                className={`flex items-center gap-1.5 ${
                  isDark ? 'text-rose-300' : 'text-rose-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>دانشگاه و برنامه‌های ثابت</span>
              </span>
              <div
                className={`p-1.5 rounded-lg ring-1 ${
                  isDark
                    ? 'bg-rose-500/20 text-rose-300 ring-rose-500/30'
                    : 'bg-rose-100 text-rose-700 ring-rose-200'
                }`}
              >
                <CategoryIcon category="university" className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight my-0.5 ${
                isDark ? 'text-white' : 'text-rose-950'
              }`}
            >
              {formatDurationFa(universityMinutes)}
            </div>
            <p
              className={`text-[11px] font-medium ${
                isDark ? 'text-rose-300/80' : 'text-rose-700/80'
              }`}
            >
              کلاس‌ها و تعهدات تقویمی ثابت
            </p>
          </div>

          {/* 4. Rest & Recovery */}
          <div
            className={`group relative p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
              isDark
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/90 border-emerald-500/30 hover:border-emerald-400/60 shadow-emerald-950/20'
                : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300 shadow-emerald-900/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black mb-1.5">
              <span
                className={`flex items-center gap-1.5 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>استراحت و بازیابی انرژی</span>
              </span>
              <div
                className={`p-1.5 rounded-lg ring-1 ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                }`}
              >
                <CategoryIcon category="recovery" className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight my-0.5 ${
                isDark ? 'text-white' : 'text-emerald-950'
              }`}
            >
              {formatDurationFa(restMinutes)}
            </div>
            <p
              className={`text-[11px] font-medium ${
                isDark ? 'text-emerald-300/80' : 'text-emerald-700/80'
              }`}
            >
              تغذیه، پیاده‌روی، تنفس و خواب باکیفیت
            </p>
          </div>
        </div>

        {/* Visual Progress Breakdown Bar & Balance Indicator */}
        <div
          className={`p-3 rounded-2xl border space-y-2 ${
            isDark
              ? 'bg-slate-900/70 border-slate-800/90 shadow-inner'
              : 'bg-slate-50 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`font-bold flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>توزیع زمان در هفته (مجموع: {formatDurationFa(totalPlannedMinutes)})</span>
            </span>
            <span
              className={`font-black px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1.5 shadow-2xs ${
                restMinutes >= 360
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>
                {restMinutes >= 360 ? 'توازن زمانی مناسب' : 'پیشنهاد افزایش زمان استراحت'}
              </span>
            </span>
          </div>

          {/* Segmented Multi-Color Progress Bar */}
          <div
            className={`w-full h-3 rounded-full overflow-hidden flex p-0.5 border shadow-inner ${
              isDark
                ? 'bg-slate-950 border-slate-800/80'
                : 'bg-slate-200 border-slate-300'
            }`}
          >
            {totalPlannedMinutes > 0 && (
              <>
                <div
                  style={{ width: `${(deepWorkMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-sm transition-all duration-500 shadow-xs shadow-purple-500/40"
                  title={`کار عمیق: ${formatDurationFa(deepWorkMinutes)}`}
                />
                <div
                  style={{ width: `${(workMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-sm transition-all duration-500 shadow-xs shadow-sky-500/40"
                  title={`پروژه کاری: ${formatDurationFa(workMinutes)}`}
                />
                <div
                  style={{ width: `${(universityMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-sm transition-all duration-500 shadow-xs shadow-rose-500/40"
                  title={`دانشگاه: ${formatDurationFa(universityMinutes)}`}
                />
                <div
                  style={{ width: `${(restMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-sm transition-all duration-500 shadow-xs shadow-emerald-500/40"
                  title={`ریکاوری و تفریح: ${formatDurationFa(restMinutes)}`}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


