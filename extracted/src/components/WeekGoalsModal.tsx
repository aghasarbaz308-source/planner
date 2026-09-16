import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Award,
  GraduationCap,
  Heart,
  Check,
  RotateCcw,
} from 'lucide-react';
import { WeeklyPillarsGoals } from '../types';
import { DEFAULT_WEEKLY_GOALS } from '../constants/defaultPlannerRules';
import { toFaDigits } from '../constants/plannerConfig';

interface WeekGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: WeeklyPillarsGoals;
  onSaveGoals: (newGoals: WeeklyPillarsGoals) => void;
}

export const WeekGoalsModal: React.FC<WeekGoalsModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSaveGoals,
}) => {
  const [localGoals, setLocalGoals] = useState<WeeklyPillarsGoals>({ ...goals });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals(localGoals);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleResetDefaults = () => {
    setLocalGoals({ ...DEFAULT_WEEKLY_GOALS });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-l from-indigo-900 via-slate-900 to-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>تنظیم و ویرایش اهداف هفتگی ۴ رکن</span>
              </h2>
              <p className="text-[11.5px] text-slate-300 mt-0.5 font-medium">
                شخصی‌سازی اهداف ساعتی و عناوین ستون‌های تعادل عصبی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Pillar 1: Deep Work */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>رکن ۱: کار عمیق (Deep Work)</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[11px] text-purple-800 font-medium">هدف ساعت در هفته:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={localGoals.deepWorkTargetHours}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({
                      ...prev,
                      deepWorkTargetHours: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-400 outline-hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-purple-900 mb-0.5 font-medium">عنوان نمایشی:</label>
                <input
                  type="text"
                  value={localGoals.deepWorkTitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, deepWorkTitle: e.target.value }))
                  }
                  placeholder="کار عمیق (AI & Python)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-purple-200 focus:border-purple-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-purple-900 mb-0.5 font-medium">توضیح کوتاه:</label>
                <input
                  type="text"
                  value={localGoals.deepWorkSubtitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, deepWorkSubtitle: e.target.value }))
                  }
                  placeholder="پایتون پیشرفته + مدل‌سازی PyTorch"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-purple-200 focus:border-purple-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pillar 2: Work Project */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-xs">
                <Award className="w-4 h-4 text-sky-600" />
                <span>رکن ۲: پروژه‌های کاری (Work)</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[11px] text-sky-800 font-medium">هدف ساعت در هفته:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={localGoals.workTargetHours}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({
                      ...prev,
                      workTargetHours: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white rounded-lg border border-sky-300 focus:ring-2 focus:ring-sky-400 outline-hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-sky-900 mb-0.5 font-medium">عنوان نمایشی:</label>
                <input
                  type="text"
                  value={localGoals.workTitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, workTitle: e.target.value }))
                  }
                  placeholder="پروژه کاری (Linux/Git)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-sky-200 focus:border-sky-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-sky-900 mb-0.5 font-medium">توضیح کوتاه:</label>
                <input
                  type="text"
                  value={localGoals.workSubtitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, workSubtitle: e.target.value }))
                  }
                  placeholder="تسک‌های فریلنس و جلسات سینک"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-sky-200 focus:border-sky-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pillar 3: University */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-950 font-bold text-xs">
                <GraduationCap className="w-4 h-4 text-rose-600" />
                <span>رکن ۳: دانشگاه و مسیر (University)</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[11px] text-rose-800 font-medium">هدف ساعت در هفته:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={localGoals.universityTargetHours}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({
                      ...prev,
                      universityTargetHours: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-400 outline-hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-rose-900 mb-0.5 font-medium">عنوان نمایشی:</label>
                <input
                  type="text"
                  value={localGoals.universityTitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, universityTitle: e.target.value }))
                  }
                  placeholder="دانشگاه و مسیر"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-rose-900 mb-0.5 font-medium">توضیح کوتاه:</label>
                <input
                  type="text"
                  value={localGoals.universitySubtitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, universitySubtitle: e.target.value }))
                  }
                  placeholder="کلاس‌ها و محدودیت‌های قطعی"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pillar 4: Recovery & Dopamine */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>رکن ۴: ریکاوری و دوپامین (Recovery & Dopamine)</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[11px] text-emerald-800 font-medium">هدف ساعت در هفته:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={localGoals.recoveryTargetHours}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({
                      ...prev,
                      recoveryTargetHours: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-400 outline-hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-emerald-900 mb-0.5 font-medium">عنوان نمایشی:</label>
                <input
                  type="text"
                  value={localGoals.recoveryTitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, recoveryTitle: e.target.value }))
                  }
                  placeholder="ریکاوری و دوپامین"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-emerald-200 focus:border-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-emerald-900 mb-0.5 font-medium">توضیح کوتاه:</label>
                <input
                  type="text"
                  value={localGoals.recoverySubtitle || ''}
                  onChange={(e) =>
                    setLocalGoals((prev) => ({ ...prev, recoverySubtitle: e.target.value }))
                  }
                  placeholder="ناهار، تنفس، قدم زدن و استراحت کامل"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-emerald-200 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به پیش‌فرض‌ها</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ذخیره شد!</span>
                  </>
                ) : (
                  <span>ذخیره اهداف</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
