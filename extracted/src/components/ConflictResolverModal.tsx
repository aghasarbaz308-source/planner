import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ArrowDown,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Minimize2,
  Maximize2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TimeBlock, DayKey } from '../types';
import {
  findAllConflicts,
  findDayConflicts,
  autoResolveDayDomino,
  autoResolveDayCompress,
  autoResolveAllConflicts,
  findNearestFreeSlot,
  ConflictPair,
} from '../utils/conflictResolver';
import {
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
  DAYS,
  CATEGORIES,
  END_HOUR,
} from '../constants/plannerConfig';

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  onApplyResolvedBlocks: (newBlocks: TimeBlock[]) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warn') => void;
  initialSelectedDay?: DayKey;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  onClose,
  blocks,
  onApplyResolvedBlocks,
  onShowToast,
  initialSelectedDay,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayKey | 'all'>(
    initialSelectedDay || 'all'
  );

  if (!isOpen) return null;

  const allConflicts = findAllConflicts(blocks);
  const displayedConflicts =
    selectedDayFilter === 'all'
      ? allConflicts
      : allConflicts.filter((c) => c.day === selectedDayFilter);

  // 1. Domino push for single pair: push block B to end of block A
  const handleResolvePairDomino = (pair: ConflictPair) => {
    const { blockA, blockB } = pair;
    const aEnd = blockA.startMinutes + blockA.durationMinutes;
    const maxMins = END_HOUR * 60;
    const newStart = aEnd;
    const newDuration = Math.min(blockB.durationMinutes, Math.max(15, maxMins - newStart));

    const updated = blocks.map((b) => {
      if (b.id === blockB.id) {
        return { ...b, startMinutes: newStart, durationMinutes: newDuration };
      }
      return b;
    });

    onApplyResolvedBlocks(updated);
    onShowToast(`تداخل با شیفت دادن "${blockB.title}" به بعد از "${blockA.title}" برطرف شد.`, 'success');
  };

  // 2. Compress pair proportionally
  const handleResolvePairCompress = (pair: ConflictPair) => {
    const { blockA, blockB, overlapMinutes } = pair;
    const trimA = Math.min(Math.floor(overlapMinutes / 2), Math.max(0, blockA.durationMinutes - 15));
    const newADuration = blockA.durationMinutes - trimA;
    const newBStart = blockA.startMinutes + newADuration;
    const maxMins = END_HOUR * 60;
    const newBDuration = Math.min(blockB.durationMinutes, Math.max(15, maxMins - newBStart));

    const updated = blocks.map((b) => {
      if (b.id === blockA.id) {
        return { ...b, durationMinutes: newADuration };
      }
      if (b.id === blockB.id) {
        return { ...b, startMinutes: newBStart, durationMinutes: newBDuration };
      }
      return b;
    });

    onApplyResolvedBlocks(updated);
    onShowToast(`مدت زمان دو فعالیت به صورت متناسب تنظیم و تداخل رفع شد.`, 'success');
  };

  // 3. Move block B to nearest free gap in the day
  const handleResolvePairMoveGap = (pair: ConflictPair) => {
    const { blockB, day } = pair;
    const freeSlot = findNearestFreeSlot(day, blockB.durationMinutes, blocks, blockB.id);

    if (freeSlot !== null) {
      const updated = blocks.map((b) => {
        if (b.id === blockB.id) {
          return { ...b, startMinutes: freeSlot };
        }
        return b;
      });
      onApplyResolvedBlocks(updated);
      onShowToast(
        `"${blockB.title}" به اولین جای خالی روز (ساعت ${minutesToTimeString(freeSlot)}) منتقل شد.`,
        'success'
      );
    } else {
      // Fallback to domino shift
      handleResolvePairDomino(pair);
    }
  };

  // Master 1-Click: Resolve whole day
  const handleResolveDayAll = (day: DayKey) => {
    const resolved = autoResolveDayDomino(day, blocks);
    onApplyResolvedBlocks(resolved);
    const dayName = DAYS.find((d) => d.id === day)?.nameFa || day;
    onShowToast(`تمام تداخل‌های روز ${dayName} با الگوریتم زنجیره‌ای برطرف شد.`, 'success');
  };

  // Master 1-Click: Resolve entire week
  const handleResolveEntireWeek = () => {
    const resolved = autoResolveAllConflicts(blocks, 'domino');
    onApplyResolvedBlocks(resolved);
    onShowToast('تمام تداخل‌های هفتگی با موفقیت و بدون حذف تسک‌ها برطرف شدند!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  موتور هوشمند حل تداخل‌های زمانی
                </h2>
                {allConflicts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {toFaDigits(allConflicts.length)} تداخل
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                الگوریتم‌های پیشرفته برای چیدمان روان و بدون هم‌پوشانی کارت‌ها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Master Action */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDayFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              همه روزها ({toFaDigits(allConflicts.length)})
            </button>
            {DAYS.map((d) => {
              const count = findDayConflicts(d.id, blocks).length;
              if (count === 0) return null;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDayFilter(d.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedDayFilter === d.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  <span>{d.nameFa}</span>
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[10px] flex items-center justify-center font-mono">
                    {toFaDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Master 1-Click Button */}
          {allConflicts.length > 0 && (
            <button
              type="button"
              onClick={handleResolveEntireWeek}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-xs transition-all cursor-pointer shrink-0"
              title="رفع خودکار تمام تداخل‌های کل هفته با الگوریتم زنجیره‌ای"
            >
              <Sparkles className="w-4 h-4" />
              <span>رفع هوشمند تمام تداخل‌های هفته (۱ کلیک)</span>
            </button>
          )}
        </div>

        {/* Conflicts List or Clean State */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayedConflicts.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">
                هیچ تداخل زمانی در این بخش وجود ندارد!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                کارت‌ها به صورت کاملاً منظم و ایزوله چیده شده‌اند و هیچ هم‌پوشانی زمانی با یکدیگر ندارند.
              </p>
            </div>
          ) : (
            displayedConflicts.map((pair) => {
              const { blockA, blockB, dayNameFa, overlapMinutes } = pair;
              const catA = CATEGORIES[blockA.category];
              const catB = CATEGORIES[blockB.category];

              return (
                <div
                  key={pair.id}
                  className="bg-white rounded-2xl border border-amber-200/90 shadow-xs p-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Amber Accent Stripe */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400" />

                  {/* Top Day & Overlap Pill */}
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dayNameFa}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{toFaDigits(overlapMinutes)} دقیقه هم‌پوشانی زمانی</span>
                    </span>
                  </div>

                  {/* Conflicting Blocks Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Block A */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: catA?.dotColor || '#6366f1' }}
                          />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {blockA.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{blockA.subtitle || 'بدون توضیح'}</p>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{toFaDigits(minutesToTimeString(blockA.startMinutes))}</span>
                        <span>تا</span>
                        <span>
                          {toFaDigits(minutesToTimeString(blockA.startMinutes + blockA.durationMinutes))}
                        </span>
                        <span className="text-slate-400 text-[10px]">({formatDurationFa(blockA.durationMinutes)})</span>
                      </div>
                    </div>

                    {/* Block B */}
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: catB?.dotColor || '#f59e0b' }}
                          />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {blockB.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{blockB.subtitle || 'بدون توضیح'}</p>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold text-amber-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{toFaDigits(minutesToTimeString(blockB.startMinutes))}</span>
                        <span>تا</span>
                        <span>
                          {toFaDigits(minutesToTimeString(blockB.startMinutes + blockB.durationMinutes))}
                        </span>
                        <span className="text-amber-700 text-[10px]">({formatDurationFa(blockB.durationMinutes)})</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Solution Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleResolvePairDomino(pair)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                      title="انتقال کارت دوم به بلافاصله بعد از اتمام کارت اول"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      <span>شیفت به بعد (دومینو)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolvePairCompress(pair)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200 transition-colors cursor-pointer"
                      title="کوتاه کردن متناسب زمان هر دو فعالیت تا بدون تداخل جا شوند"
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-600" />
                      <span>فشرده‌سازی متناسب هر دو</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolvePairMoveGap(pair)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
                      title="انتقال کارت دوم به اولین تایم خالی آزاد در همان روز"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>انتقال به تایم خالی آزاد</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            نکته ضدشکننده: تغییر ساعت کارت‌ها نظم ذهنی شما را حفظ می‌کند و مانع فرسودگی می‌شود.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
