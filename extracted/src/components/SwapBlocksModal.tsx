import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Info,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TimeBlock, DayKey } from '../types';
import {
  DAYS,
  CATEGORIES,
  formatDurationFa,
  toFaDigits,
  minutesToTimeString,
  TIME_PHASES,
  getTimePhase,
} from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

export interface SwapAnalysisResult {
  hasDurationDifference: boolean;
  durationDiffMinutes: number;
  blockAOverlapWithOthers: TimeBlock[];
  blockBOverlapWithOthers: TimeBlock[];
  blockAExceedsDay: boolean;
  blockBExceedsDay: boolean;
  blockACircadianWarning?: string;
  blockBCircadianWarning?: string;
  isPerfectFit: boolean;
  warnings: { id: string; type: 'info' | 'warning' | 'danger'; text: string }[];
}

interface SwapBlocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockA: TimeBlock;
  blockB: TimeBlock;
  allBlocks: TimeBlock[];
  onConfirmSwap: (params: {
    blockAId: string;
    blockBId: string;
    mode: 'keep_durations' | 'fit_durations';
  }) => void;
}

export const SwapBlocksModal: React.FC<SwapBlocksModalProps> = ({
  isOpen,
  onClose,
  blockA,
  blockB,
  allBlocks,
  onConfirmSwap,
}) => {
  const [swapMode, setSwapMode] = useState<'keep_durations' | 'fit_durations'>('keep_durations');

  const dayA = DAYS.find((d) => d.id === blockA.day);
  const dayB = DAYS.find((d) => d.id === blockB.day);

  const themeA = CATEGORIES[blockA.category] || CATEGORIES.custom;
  const themeB = CATEGORIES[blockB.category] || CATEGORIES.custom;

  const phaseAOriginal = getTimePhase(Math.floor(blockA.startMinutes / 60));
  const phaseBOriginal = getTimePhase(Math.floor(blockB.startMinutes / 60));

  const phaseANew = getTimePhase(Math.floor(blockB.startMinutes / 60));
  const phaseBNew = getTimePhase(Math.floor(blockA.startMinutes / 60));

  // Compute analysis & predictions
  const analysis = useMemo<SwapAnalysisResult>(() => {
    const warnings: { id: string; type: 'info' | 'warning' | 'danger'; text: string }[] = [];

    // 1. Duration check
    const diff = blockA.durationMinutes - blockB.durationMinutes;
    const hasDurationDifference = diff !== 0;

    if (hasDurationDifference) {
      warnings.push({
        id: 'dur_diff',
        type: 'warning',
        text: `اختلاف مدت زمان: «${blockA.title}» (${formatDurationFa(
          blockA.durationMinutes
        )}) با «${blockB.title}» (${formatDurationFa(
          blockB.durationMinutes
        )}) یکسان نیستند.`,
      });
    } else {
      warnings.push({
        id: 'dur_match',
        type: 'info',
        text: `مدت زمان هر دو بلوک کاملاً برابر است (${formatDurationFa(
          blockA.durationMinutes
        )}). اسلات‌ها با تقارن ۱۰۰٪ جابه‌جا می‌شوند.`,
      });
    }

    // 2. Day boundary check (24:00 = 1440 min)
    const effectiveDurA =
      swapMode === 'keep_durations' ? blockA.durationMinutes : blockB.durationMinutes;
    const effectiveDurB =
      swapMode === 'keep_durations' ? blockB.durationMinutes : blockA.durationMinutes;

    const blockAExceedsDay = blockB.startMinutes + effectiveDurA > 24 * 60;
    const blockBExceedsDay = blockA.startMinutes + effectiveDurB > 24 * 60;

    if (blockAExceedsDay) {
      warnings.push({
        id: 'exceed_a',
        type: 'danger',
        text: `هشدار مرز شب: بلوک «${blockA.title}» با زمان مقصد از ساعت ۲۴:۰۰ فراتر می‌رود.`,
      });
    }

    if (blockBExceedsDay) {
      warnings.push({
        id: 'exceed_b',
        type: 'danger',
        text: `هشدار مرز شب: بلوک «${blockB.title}» با زمان مقصد از ساعت ۲۴:۰۰ فراتر می‌رود.`,
      });
    }

    // 3. Collision / Overlap check with other blocks on target days
    const otherBlocksOnDayB = allBlocks.filter(
      (b) => b.day === blockB.day && b.id !== blockA.id && b.id !== blockB.id
    );
    const newStartA = blockB.startMinutes;
    const newEndA = newStartA + effectiveDurA;

    const blockAOverlapWithOthers = otherBlocksOnDayB.filter((other) => {
      const otherEnd = other.startMinutes + other.durationMinutes;
      return Math.max(newStartA, other.startMinutes) < Math.min(newEndA, otherEnd);
    });

    if (blockAOverlapWithOthers.length > 0) {
      warnings.push({
        id: 'overlap_a',
        type: 'danger',
        text: `تداخل زمانی در روز ${dayB?.nameFa}: قرارگیری «${blockA.title}» با «${
          blockAOverlapWithOthers.map((b) => b.title).join('، ')
        }» همپوشانی دارد.`,
      });
    }

    const otherBlocksOnDayA = allBlocks.filter(
      (b) => b.day === blockA.day && b.id !== blockA.id && b.id !== blockB.id
    );
    const newStartB = blockA.startMinutes;
    const newEndB = newStartB + effectiveDurB;

    const blockBOverlapWithOthers = otherBlocksOnDayA.filter((other) => {
      const otherEnd = other.startMinutes + other.durationMinutes;
      return Math.max(newStartB, other.startMinutes) < Math.min(newEndB, otherEnd);
    });

    if (blockBOverlapWithOthers.length > 0) {
      warnings.push({
        id: 'overlap_b',
        type: 'danger',
        text: `تداخل زمانی در روز ${dayA?.nameFa}: قرارگیری «${blockB.title}» با «${
          blockBOverlapWithOthers.map((b) => b.title).join('، ')
        }» همپوشانی دارد.`,
      });
    }

    // 4. Circadian rhythm and biological energy check
    let blockACircadianWarning: string | undefined;
    let blockBCircadianWarning: string | undefined;

    const heavyCategories = ['work', 'pytorch', 'python', 'university'];
    const restCategories = ['recovery', 'gaming', 'habit'];

    if (heavyCategories.includes(blockA.category) && phaseANew.id === 'evening_recovery') {
      blockACircadianWarning = `انتقال تسک سنگین «${blockA.title}» به فاز ریکاوری و خستگی شبانه (${phaseANew.nameFa}) ممکن است کارایی ذهنی شما را کاهش دهد.`;
      warnings.push({
        id: 'circadian_a',
        type: 'warning',
        text: blockACircadianWarning,
      });
    }

    if (heavyCategories.includes(blockB.category) && phaseBNew.id === 'evening_recovery') {
      blockBCircadianWarning = `انتقال تسک سنگین «${blockB.title}» به فاز پایانی شب (${phaseBNew.nameFa}) با ریتم زیستی بهینه سازگار نیست.`;
      warnings.push({
        id: 'circadian_b',
        type: 'warning',
        text: blockBCircadianWarning,
      });
    }

    if (restCategories.includes(blockA.category) && phaseANew.id === 'deep_focus') {
      warnings.push({
        id: 'circadian_rest_a',
        type: 'info',
        text: `«${blockA.title}» به فاز تمرکز طلایی صبحگاهی منتقل می‌شود؛ از خالی شدن زمان اصلی یادگیری مطمئن شوید.`,
      });
    }

    const hasCritical =
      blockAOverlapWithOthers.length > 0 ||
      blockBOverlapWithOthers.length > 0 ||
      blockAExceedsDay ||
      blockBExceedsDay;

    return {
      hasDurationDifference,
      durationDiffMinutes: Math.abs(diff),
      blockAOverlapWithOthers,
      blockBOverlapWithOthers,
      blockAExceedsDay,
      blockBExceedsDay,
      blockACircadianWarning,
      blockBCircadianWarning,
      isPerfectFit: !hasCritical && !hasDurationDifference,
      warnings,
    };
  }, [
    blockA,
    blockB,
    allBlocks,
    swapMode,
    dayA?.nameFa,
    dayB?.nameFa,
    phaseANew,
    phaseBNew,
  ]);

  if (!isOpen) return null;

  const handleApply = () => {
    onConfirmSwap({
      blockAId: blockA.id,
      blockBId: blockB.id,
      mode: swapMode,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">
                  موتور پیش‌بینی و تبادل هوشمند دو بلوک
                </h3>
                <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Anti-Fragile Swap
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                تحلیل منطقی تداخل‌ها، مدت‌زمان‌ها و هماهنگی با ریتم شبانه‌روزی انرژی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Comparison Cards: Block A <--> Block B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative">
            {/* Swap indicator badge between cards */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>

            {/* Card A */}
            <div className={`p-4 rounded-2xl border ${themeA.bgClass} ${themeA.borderClass} relative`}>
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-[10px] font-bold text-slate-500">بلوک اول (مبدا):</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
                  {dayA?.nameFa}
                </span>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${themeA.dotColor}25`, color: themeA.dotColor }}
                >
                  <CategoryIcon category={blockA.category} className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-black truncate ${themeA.textClass}`}>{blockA.title}</h4>
                  {blockA.subtitle && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{blockA.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {toFaDigits(minutesToTimeString(blockA.startMinutes))} تا{' '}
                    {toFaDigits(minutesToTimeString(blockA.startMinutes + blockA.durationMinutes))}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {formatDurationFa(blockA.durationMinutes)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <span>فاز انرژی فعلی:</span>
                <span className="font-bold" style={{ color: phaseAOriginal.color }}>
                  {phaseAOriginal.nameFa}
                </span>
              </div>
            </div>

            {/* Card B */}
            <div className={`p-4 rounded-2xl border ${themeB.bgClass} ${themeB.borderClass} relative`}>
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-[10px] font-bold text-slate-500">بلوک دوم (مقصد تبادل):</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
                  {dayB?.nameFa}
                </span>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${themeB.dotColor}25`, color: themeB.dotColor }}
                >
                  <CategoryIcon category={blockB.category} className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-black truncate ${themeB.textClass}`}>{blockB.title}</h4>
                  {blockB.subtitle && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{blockB.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {toFaDigits(minutesToTimeString(blockB.startMinutes))} تا{' '}
                    {toFaDigits(minutesToTimeString(blockB.startMinutes + blockB.durationMinutes))}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {formatDurationFa(blockB.durationMinutes)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <span>فاز انرژی فعلی:</span>
                <span className="font-bold" style={{ color: phaseBOriginal.color }}>
                  {phaseBOriginal.nameFa}
                </span>
              </div>
            </div>
          </div>

          {/* Swap Duration Strategy Choice (If durations differ) */}
          {analysis.hasDurationDifference && (
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>استراتژی انطباق مدت‌زمان در تبادل:</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                  اختلاف: {toFaDigits(analysis.durationDiffMinutes)} دقیقه
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSwapMode('keep_durations')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    swapMode === 'keep_durations'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950 font-bold'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>حفظ مدت‌زمان اصلی هر بلوک</span>
                    {swapMode === 'keep_durations' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1 font-normal leading-relaxed">
                    «{blockA.title}» همان {formatDurationFa(blockA.durationMinutes)} و «{blockB.title}» همان{' '}
                    {formatDurationFa(blockB.durationMinutes)} باقی می‌ماند.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSwapMode('fit_durations')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    swapMode === 'fit_durations'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950 font-bold'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>انطباق کامل با اسلات مقصد (Fit)</span>
                    {swapMode === 'fit_durations' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1 font-normal leading-relaxed">
                    هر بلوک اندازه اسلاتی را می‌گیرد که به آن منتقل می‌شود تا جدول هیچ تغییری نکند.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Logical Predictions & Warnings Panel */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>پیش‌بینی‌های منطقی و اعتبارسنجی:</span>
            </h4>

            <div className="space-y-1.5">
              {analysis.warnings.map((w) => (
                <div
                  key={w.id}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                    w.type === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                      : w.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  {w.type === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : w.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1">{w.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 stroke-[2.3]" />
            <span>تأیید و تبادل هوشمند دو بلوک</span>
          </button>
        </div>
      </div>
    </div>
  );
};
