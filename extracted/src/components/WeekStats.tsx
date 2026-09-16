import React from 'react';
import { X, Sparkles, Brain, CheckCircle2, Award } from 'lucide-react';
import { TimeBlock, CategoryKey } from '../types';
import { CATEGORIES, formatDurationFa, toFaDigits } from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface WeekStatsProps {
  blocks: TimeBlock[];
  isOpen: boolean;
  onClose: () => void;
}

export const WeekStats: React.FC<WeekStatsProps> = ({ blocks, isOpen, onClose }) => {
  if (!isOpen) return null;

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

  const completionRate = totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  return (
    <div className="bg-white/95 border-b border-slate-200/80 px-4 py-3.5 no-print shadow-xs transition-all animate-fade-in">
      <div className="max-w-[1700px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Brain className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              تحلیل بار شناختی و تعادل هفتگی (Neuro-Balance Dashboard)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {toFaDigits(completionRate)}٪ انجام‌شده ({formatDurationFa(completedMinutes)})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pillars Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          {/* Deep Work */}
          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80">
            <div className="flex items-center justify-between text-xs text-purple-900 font-bold mb-1">
              <span>کار عمیق (AI & Python)</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-base font-extrabold text-purple-950 font-mono">
              {formatDurationFa(deepWorkMinutes)}
            </div>
            <p className="text-[10px] text-purple-700 mt-0.5">
              پایتون پیشرفته + مدل‌سازی PyTorch
            </p>
          </div>

          {/* Work Project */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <div className="flex items-center justify-between text-xs text-sky-900 font-bold mb-1">
              <span>پروژه کاری (Linux/Git)</span>
              <Award className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-base font-extrabold text-sky-950 font-mono">
              {formatDurationFa(workMinutes)}
            </div>
            <p className="text-[10px] text-sky-700 mt-0.5">
              تسک‌های فریلنس و جلسات سینک
            </p>
          </div>

          {/* University */}
          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <div className="flex items-center justify-between text-xs text-rose-900 font-bold mb-1">
              <span>دانشگاه و مسیر</span>
              <CategoryIcon category="university" className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-base font-extrabold text-rose-950 font-mono">
              {formatDurationFa(universityMinutes)}
            </div>
            <p className="text-[10px] text-rose-700 mt-0.5">
              کلاس‌ها و محدودیت‌های قطعی
            </p>
          </div>

          {/* Rest & Dopamine */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
              <span>ریکاوری و دوپامین</span>
              <CategoryIcon category="recovery" className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-base font-extrabold text-emerald-950 font-mono">
              {formatDurationFa(restMinutes)}
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              ناهار، تنفس، قدم زدن و استراحت کامل
            </p>
          </div>
        </div>

        {/* Visual Progress Breakdown Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>توزیع زمان در هفته (مجموع: {formatDurationFa(totalPlannedMinutes)})</span>
            <span className="font-semibold text-teal-700">
              {restMinutes >= 360 ? 'تعادل عصبی عالی' : 'نیاز به اضافه کردن زمان استراحت'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            {totalPlannedMinutes > 0 && (
              <>
                <div
                  style={{ width: `${(deepWorkMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-purple-400"
                  title={`کار عمیق: ${formatDurationFa(deepWorkMinutes)}`}
                />
                <div
                  style={{ width: `${(workMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-sky-400"
                  title={`پروژه کاری: ${formatDurationFa(workMinutes)}`}
                />
                <div
                  style={{ width: `${(universityMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-rose-400"
                  title={`دانشگاه: ${formatDurationFa(universityMinutes)}`}
                />
                <div
                  style={{ width: `${(restMinutes / totalPlannedMinutes) * 100}%` }}
                  className="bg-emerald-400"
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
