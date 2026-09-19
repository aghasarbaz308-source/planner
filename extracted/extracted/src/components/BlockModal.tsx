import React, { useState, useEffect } from 'react';
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
}

export const BlockModal: React.FC<BlockModalProps> = ({
  block,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onOpenInsertBreak,
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
    }
  }, [block]);

  if (!isOpen || !block) return null;

  // Generate selectable start times in 30-min intervals + ensure current startMinutes is included
  const timeMinutesSet = new Set<number>();
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += SLOT_INTERVAL) {
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
      },
      updateAllMatching,
      block.title
    );
    onClose();
  };

  const currentTheme = CATEGORIES[category] || CATEGORIES.custom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header with live theme accent */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${currentTheme.bgClass} ${currentTheme.borderClass}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: currentTheme.dotColor,
                color: '#ffffff',
              }}
            >
              <CategoryIcon category={category} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                ویرایش بلوک زمانی
              </h3>
              <p className="text-xs text-slate-500">
                {currentTheme.label} • {currentTheme.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان فعالیت
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلا: پایتون پیشرفته یا پروژه کاری"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
          </div>

          {/* Subtitle / Focus tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توضیح کوتاه / برچسب تمرکز
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثلا: Linux Kernel, PyTorch DataLoader, اسپرینت ۲"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
          </div>

          {/* Day & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                روز هفته
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayKey)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameFa} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                ساعت شروع
              </label>
              <select
                value={startMinutes}
                onChange={(e) => setStartMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              >
                {timeOptions.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes}>
                    {toFaDigits(opt.label)}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مدت زمان
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              >
                {durationOptions.map((dur) => (
                  <option key={dur} value={dur}>
                    {formatDurationFa(dur)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Neuro-Color Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
              یادداشت‌های تمرکز و جزئیات (اختیاری)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلا: پیاده‌سازی تست DataLoader در PyTorch، حل باگ حافظه..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
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
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
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
