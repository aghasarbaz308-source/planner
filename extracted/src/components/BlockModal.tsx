import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  Copy,
  Clock,
  Calendar,
  Sparkles,
  Tag,
  AlignLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Scissors,
  Search,
  Check,
  Zap,
} from 'lucide-react';
import { TimeBlock, DayKey, CategoryKey } from '../types';
import {
  DAYS,
  CATEGORIES,
  START_HOUR,
  END_HOUR,
  SLOT_INTERVAL,
  minutesToTimeString,
  timeStringToMinutes,
  formatDurationFa,
  toFaDigits,
} from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';
import { Coffee } from 'lucide-react';
import { InteractiveTimePicker } from './InteractiveTimePicker';

interface BlockModalProps {
  block: TimeBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    updatedBlock: TimeBlock,
    updateAllMatching?: boolean,
    originalTitle?: string
  ) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (sourceBlock: TimeBlock, targetDay: DayKey) => void;
  onOpenInsertBreak?: (block: TimeBlock) => void;
  allBlocks?: TimeBlock[];
}

export const BlockModal: React.FC<BlockModalProps> = ({
  block,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onOpenInsertBreak,
  allBlocks = [],
}) => {
  const [title, setTitle] = useState(block?.title || '');
  const [subtitle, setSubtitle] = useState(block?.subtitle || '');
  const [note, setNote] = useState(block?.note || '');
  const [day, setDay] = useState<DayKey>(block?.day || 'sat');
  const [startMinutes, setStartMinutes] = useState(block?.startMinutes || 420);
  const [durationMinutes, setDurationMinutes] = useState(block?.durationMinutes || 60);
  const [category, setCategory] = useState<CategoryKey>(block?.category || 'work');
  const [duplicateTargetDay, setDuplicateTargetDay] = useState<DayKey>(block?.day || 'sat');
  const [updateAllMatching, setUpdateAllMatching] = useState(false);
  const [isFixed, setIsFixed] = useState(block?.isFixed || false);
  const [showClockDial, setShowClockDial] = useState(true);

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setSubtitle(block.subtitle || '');
      setNote(block.note || '');
      setDay(block.day);
      setStartMinutes(block.startMinutes);
      setDurationMinutes(block.durationMinutes);
      setCategory(block.category);
      setDuplicateTargetDay(block.day);
      setUpdateAllMatching(false);
      setIsFixed(block.isFixed || false);
    }
  }, [block]);

  // Mathematical Collision Detection Engine
  const collidingBlocks = useMemo(() => {
    if (!block || !allBlocks || allBlocks.length === 0) return [];
    const blockEnd = Number(startMinutes) + Number(durationMinutes);

    return allBlocks
      .filter((b) => {
        if (b.id === block.id) return false;
        if (b.day !== day) return false;
        const bEnd = b.startMinutes + b.durationMinutes;
        // Strict overlap condition: (startA < endB && startB < endA)
        return startMinutes < bEnd && b.startMinutes < blockEnd;
      })
      .map((b) => {
        const bEnd = b.startMinutes + b.durationMinutes;
        const overlapStart = Math.max(startMinutes, b.startMinutes);
        const overlapEnd = Math.min(blockEnd, bEnd);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
        return {
          block: b,
          overlapMinutes,
          overlapStart,
          overlapEnd,
        };
      });
  }, [allBlocks, block, day, startMinutes, durationMinutes]);

  const hasCollisions = collidingBlocks.length > 0;

  // 1-Click Automated Mathematical Conflict Resolutions
  // 1. Shift to directly after the conflicting block
  const handleShiftAfter = (conflictingBlock: TimeBlock) => {
    const newStart = conflictingBlock.startMinutes + conflictingBlock.durationMinutes;
    if (newStart + durationMinutes <= END_HOUR * 60) {
      setStartMinutes(newStart);
    } else {
      const maxStart = END_HOUR * 60 - durationMinutes;
      setStartMinutes(Math.max(START_HOUR * 60, maxStart));
    }
  };

  // 2. Shift to directly before the conflicting block
  const handleShiftBefore = (conflictingBlock: TimeBlock) => {
    const newStart = conflictingBlock.startMinutes - durationMinutes;
    setStartMinutes(Math.max(START_HOUR * 60, newStart));
  };

  // 3. Truncate / Fit duration to stop right when the next block begins
  const handleFitDuration = (conflictingBlock: TimeBlock) => {
    if (conflictingBlock.startMinutes > startMinutes) {
      const availableDuration = conflictingBlock.startMinutes - startMinutes;
      if (availableDuration >= 15) {
        setDurationMinutes(availableDuration);
      }
    }
  };

  // 4. Mathematical search for nearest free gap on this day
  const handleFindNearestGap = () => {
    const dayOtherBlocks = allBlocks
      .filter((b) => b.day === day && b.id !== block?.id)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    let candidateStart = START_HOUR * 60;
    for (const b of dayOtherBlocks) {
      if (b.startMinutes >= candidateStart + durationMinutes) {
        // Gap found!
        setStartMinutes(candidateStart);
        return;
      }
      if (b.startMinutes + b.durationMinutes > candidateStart) {
        candidateStart = b.startMinutes + b.durationMinutes;
      }
    }

    if (candidateStart + durationMinutes <= END_HOUR * 60) {
      setStartMinutes(candidateStart);
    }
  };

  if (!isOpen || !block) return null;

  // Generate selectable start times in 15-min intervals (07:00, 07:15, 07:30, 07:45, 08:00, ...)
  const timeMinutesSet = new Set<number>();
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += 15) {
    timeMinutesSet.add(m);
  }
  timeMinutesSet.add(startMinutes);
  if (block) timeMinutesSet.add(block.startMinutes);

  const timeOptions = Array.from(timeMinutesSet)
    .sort((a, b) => a - b)
    .map((m) => ({
      label: minutesToTimeString(m),
      minutes: m,
    }));

  const standardDurations = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240];
  const durationOptions = Array.from(
    new Set([...standardDurations, durationMinutes, block.durationMinutes])
  ).sort((a, b) => a - b);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...block,
        title: title.trim() || 'بلوک زمانی',
        subtitle: subtitle.trim(),
        note: note.trim(),
        day,
        startMinutes: Number(startMinutes),
        durationMinutes: Number(durationMinutes),
        category,
        isFixed,
      },
      updateAllMatching,
      block.title
    );
    onClose();
  };

  const currentTheme = CATEGORIES[category] || CATEGORIES.custom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs no-print animate-fade-in font-['Vazirmatn',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header with live theme accent */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${currentTheme.bgClass} ${currentTheme.borderClass}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: currentTheme.dotColor,
                color: '#ffffff',
              }}
            >
              <CategoryIcon category={category} className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                ویرایش بلوک زمانی
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentTheme.label} • {currentTheme.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان فعالیت
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلا: پایتون پیشرفته یا پروژه کاری"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all bg-white font-medium"
            />
          </div>

          {/* Subtitle / Focus tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              توضیح کوتاه / برچسب تمرکز
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثلا: Linux Kernel, PyTorch DataLoader, اسپرینت ۲"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all bg-white"
            />
          </div>

          {/* Day & Quick Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Day */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                روز هفته
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayKey)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-medium"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameFa} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time Select (15-min precision fallback) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  ساعت شروع
                </label>
                <button
                  type="button"
                  onClick={() => setShowClockDial(!showClockDial)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {showClockDial ? 'بستن ساعت گرافیکی' : 'ساعت عقربه‌ای'}
                </button>
              </div>
              <select
                dir="ltr"
                value={startMinutes}
                onChange={(e) => setStartMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-mono font-bold text-indigo-700 text-center"
              >
                {timeOptions.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes} dir="ltr" className="font-mono">
                    {toFaDigits(opt.label)}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  مدت زمان
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDurationMinutes((prev) => Math.max(15, prev - 15))}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                    title="کاهش ۱۵ دقیقه"
                  >
                    ۱۵-
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMinutes((prev) => Math.min(480, prev + 15))}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                    title="افزایش ۱۵ دقیقه"
                  >
                    ۱۵+
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMinutes((prev) => Math.max(15, prev - 30))}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                    title="کاهش ۳۰ دقیقه"
                  >
                    ۳۰-
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMinutes((prev) => Math.min(480, prev + 30))}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                    title="افزایش ۳۰ دقیقه"
                  >
                    ۳۰+
                  </button>
                </div>
              </div>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-medium"
              >
                {durationOptions.map((dur) => (
                  <option key={dur} value={dur}>
                    {formatDurationFa(dur)}
                  </option>
                ))}
              </select>

              {/* Quick Select Chips */}
              <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
                {[30, 45, 60, 90, 120, 150, 180, 210, 240].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDurationMinutes(dur)}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all shrink-0 cursor-pointer ${
                      durationMinutes === dur
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dur >= 60 ? `${toFaDigits(dur / 60)}س` : `${toFaDigits(dur)}د`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Animated Time Picker (Clock Face, Steppers, & Timeline Bar) */}
          {showClockDial && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <InteractiveTimePicker
                valueMinutes={startMinutes}
                durationMinutes={durationMinutes}
                onChange={(newM) => setStartMinutes(newM)}
                day={day}
                existingBlocks={allBlocks}
                currentBlockId={block.id}
              />
            </div>
          )}

          {/* Real-Time Collision Warning & Smart Mathematical Solutions */}
          {hasCollisions && (
            <div className="p-3.5 bg-rose-50/90 border border-rose-300 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-rose-950">
                    تداخل زمانی در {DAYS.find((d) => d.id === day)?.nameFa}:
                  </h4>
                  <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                    این فعالیت با {toFaDigits(collidingBlocks.length)} برنامه دیگر هم‌پوشانی دارد. لطفاً از راهکارهای اصلاح ریاضی خودکار زیر استفاده کنید:
                  </p>
                </div>
              </div>

              {/* List of Colliding Blocks */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {collidingBlocks.map(({ block: cb, overlapMinutes, overlapStart, overlapEnd }) => (
                  <div
                    key={cb.id}
                    className="p-2 bg-white/90 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={cb.category} className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{cb.title}</span>
                      </div>
                      <span className="text-[10px] text-rose-700 font-mono font-medium block mt-0.5">
                        هم‌پوشانی {toFaDigits(overlapMinutes)} دقیقه (از {toFaDigits(minutesToTimeString(overlapStart))} تا {toFaDigits(minutesToTimeString(overlapEnd))})
                      </span>
                    </div>

                    {/* Quick 1-Click Fix Buttons */}
                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleShiftAfter(cb)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                        title="انتقال خودکار شروع این بلوک به بعد از پایان بلوک متداخل"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>شیفت به بعد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShiftBefore(cb)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                        title="انتقال خودکار به قبل از این بلوک"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>شیفت به قبل</span>
                      </button>

                      {cb.startMinutes > startMinutes && (
                        <button
                          type="button"
                          onClick={() => handleFitDuration(cb)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                          title="کوتاه کردن مدت زمان برای پایان دقیق قبل از شروع بلوک بعدی"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>تنظیم مدت زمان</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Global Gap Finder Button */}
              <div className="pt-1 border-t border-rose-200/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-rose-800 font-medium">یا نزدیک‌ترین جای خالی را پیدا کنید:</span>
                <button
                  type="button"
                  onClick={handleFindNearestGap}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>انتقال به نزدیک‌ترین تایم آزاد</span>
                </button>
              </div>
            </div>
          )}

          {/* Neuro-Color Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              پالت عصبی / دسته‌بندی شناختی
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => setCategory(catKey)}
                    className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                      cat.bgClass
                    } ${
                      isSelected
                        ? `ring-2 ring-indigo-500 font-bold border-indigo-400 shadow-xs`
                        : `${cat.borderClass} opacity-80 hover:opacity-100`
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.dotColor }}
                    />
                    <span className="text-[11px] truncate text-slate-800">
                      {cat.label.split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Private Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
              یادداشت‌های تمرکز و جزئیات (اختیاری)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلا: پیاده‌سازی تست DataLoader در PyTorch، حل باگ حافظه..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white"
            />
          </div>

          {/* Duplicate to another day section */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Copy className="w-4 h-4 text-slate-400" />
              <span>تکثیر این بلوک به:</span>
              <select
                value={duplicateTargetDay}
                onChange={(e) => setDuplicateTargetDay(e.target.value as DayKey)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameFa}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                onDuplicate(block, duplicateTargetDay);
                onClose();
              }}
              className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              کپی کن
            </button>
          </div>

          {/* Anchor Block Protection Toggle */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/90 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="anchor-block-toggle"
              checked={isFixed}
              onChange={(e) => setIsFixed(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 mt-0.5 cursor-pointer accent-indigo-600"
            />
            <label
              htmlFor="anchor-block-toggle"
              className="text-xs font-bold text-indigo-950 cursor-pointer leading-relaxed"
            >
              <span>برنامه ثابت و بدون جابه‌جایی (Anchor)</span>
              <span className="block text-[11px] text-indigo-700/80 font-normal mt-0.5">
                محافظت کامل در برابر فشرده‌سازی خودکار و شیفت زمان‌بندی (مناسب کلاس‌های دانشگاه و جلسات قطعی).
              </span>
            </label>
          </div>

          {/* Sync all matching blocks checkbox */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="sync-all-matching-blocks"
              checked={updateAllMatching}
              onChange={(e) => setUpdateAllMatching(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 mt-0.5 cursor-pointer"
            />
            <label
              htmlFor="sync-all-matching-blocks"
              className="text-xs font-bold text-amber-950 cursor-pointer leading-relaxed"
            >
              همچنین عنوان و دسته‌بندی روی تمام بلوک‌های مشابه («{block.title}») در تمام روزهای این هفته اعمال شود.
            </label>
          </div>

          {/* Smart Break Insertion Shortcut */}
          {onOpenInsertBreak && durationMinutes >= 30 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInsertBreak(block);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/90 border border-orange-300 text-orange-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="درج ۱۵ یا ۳۰ دقیقه استراحت در میان این جلسه بدون برهم خوردن زمان‌بندی"
            >
              <Coffee className="w-4 h-4 text-orange-600 stroke-[2.2]" />
              <span>درج هوشمند استراحت در این بلوک (تقسیم ۱۵ یا ۳۰ دقیقه)</span>
            </button>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (confirm('آیا از حذف این بلوک اطمینان دارید؟')) {
                  onDelete(block.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف بلوک</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
