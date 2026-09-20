import React, { useState } from 'react';
import {
  X,
  Plus,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Check,
} from 'lucide-react';
import { DayKey, CategoryKey, BlockTemplate, TimeBlock } from '../types';
import { DAYS, minutesToTimeString, toFaDigits } from '../constants/plannerConfig';
import { categoryService } from '../services/categoryService';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayKey;
  startMinutes: number;
  templates: BlockTemplate[];
  onAddBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const QuickAddSlotModal: React.FC<QuickAddSlotModalProps> = ({
  isOpen,
  onClose,
  day,
  startMinutes,
  templates,
  onAddBlock,
  onShowToast,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<CategoryKey>('work');
  const [customDuration, setCustomDuration] = useState<number>(60);
  const categories = categoryService.getAll();

  if (!isOpen) return null;

  const dayInfo = DAYS.find((d) => d.id === day);
  const timeStr = toFaDigits(minutesToTimeString(startMinutes));

  const handleSelectTemplate = (tpl: BlockTemplate) => {
    onAddBlock({
      title: tpl.title,
      subtitle: tpl.subtitle || '',
      category: tpl.category,
      day,
      startMinutes,
      durationMinutes: tpl.defaultDuration || 60,
      completed: false,
    });
    onShowToast(`«${tpl.title}» در ${dayInfo?.nameFa} ساعت ${timeStr} قرار گرفت.`, 'success');
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim() || 'تسک جدید';
    onAddBlock({
      title,
      category: customCategory,
      day,
      startMinutes,
      durationMinutes: customDuration,
      completed: false,
    });
    onShowToast(`«${title}» به جدول اضافه شد.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>افزودن سریع به {dayInfo?.nameFa}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                  ساعت {timeStr}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                یک الگو را با یک کلیک انتخاب کنید یا عنوان دلخواه خود را بنویسید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: 1-Click Templates Bank */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>الگوهای آماده با یک کلیک</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">کلیک برای نشاندن در این ساعت</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.slice(0, 8).map((tpl) => {
                const catTheme = categories[tpl.category] || categories.custom;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs hover:scale-[1.01] cursor-pointer ${catTheme.bgClass} ${catTheme.borderClass}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/80"
                        style={{ backgroundColor: `${catTheme.dotColor}25`, color: catTheme.dotColor }}
                      >
                        <CategoryIcon icon={catTheme.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-black truncate ${catTheme.textClass}`}>
                          {tpl.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {toFaDigits(tpl.defaultDuration || 60)} دقیقه • {catTheme.label}
                        </div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-bold text-slate-400">یا تسک سفارشی</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Section 2: Quick Custom Input */}
          <form onSubmit={handleCreateCustom} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان فعالیت</label>
              <input
                type="text"
                autoFocus
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثلاً: طراحی فرم ثبت‌نام، مطالعه فصل ۳..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">دسته‌بندی</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as CategoryKey)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(categories).map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مدت زمان</label>
                <div className="flex flex-wrap gap-1.5">
                  {[15, 30, 45, 60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setCustomDuration(dur)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        customDuration === dur
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {toFaDigits(dur)} دقیقه
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن به جدول</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
