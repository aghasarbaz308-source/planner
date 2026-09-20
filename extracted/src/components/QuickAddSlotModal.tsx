import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Check,
  PenTool,
  Anchor,
  Flame,
  Search,
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

// Quick Paper-Like 1-Tap Presets
const QUICK_PAPER_PRESETS: Array<{
  label: string;
  title: string;
  category: CategoryKey;
  duration: number;
  emoji: string;
}> = [
  { label: 'کار عمیق', title: 'کار عمیق و متمرکز', category: 'work', duration: 60, emoji: '🎯' },
  { label: 'مطالعه', title: 'مطالعه و پژوهش', category: 'reading', duration: 45, emoji: '📚' },
  { label: 'کدنویسی', title: 'توسعه و کدنویسی', category: 'python', duration: 90, emoji: '💻' },
  { label: 'جلسه کاری', title: 'جلسه هماهنگی', category: 'meeting', duration: 30, emoji: '🤝' },
  { label: 'کلاس درس', title: 'کلاس دانشگاه / وبینار', category: 'university', duration: 90, emoji: '🎓' },
  { label: 'ورزش', title: 'ورزش و پیاده‌روی', category: 'recovery', duration: 30, emoji: '🏃' },
  { label: 'استراحت', title: 'استراحت و بازیابی ذهن', category: 'recovery', duration: 15, emoji: '☕' },
];

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
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customCategory, setCustomCategory] = useState<CategoryKey>('work');
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [isAnchor, setIsAnchor] = useState<boolean>(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeMode, setActiveMode] = useState<'paper' | 'templates'>('paper');

  const inputRef = useRef<HTMLInputElement>(null);
  const categories = categoryService.getAll();

  const dayInfo = useMemo(() => DAYS.find((d) => d.id === day), [day]);
  const timeStr = toFaDigits(minutesToTimeString(startMinutes));

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setCustomTitle('');
      setCustomSubtitle('');
      setCustomCategory('work');
      setCustomDuration(60);
      setIsAnchor(false);
      setTemplateSearch('');
    }
  }, [isOpen]);

  // Smart duration detector from natural language typing (e.g., "طراحی فرم ۴۵د" or "جلسه 30m")
  const detectedDuration = useMemo<number | null>(() => {
    if (!customTitle) return null;
    const match = customTitle.match(/(\d+)\s*(دقیقه|د|min|m|ساعت|h)/i);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('ساعت') || unit === 'h') {
      return num * 60;
    }
    return num;
  }, [customTitle]);

  if (!isOpen) return null;

  // 1-Click apply from quick paper preset
  const handleApplyPreset = (preset: typeof QUICK_PAPER_PRESETS[0]) => {
    setCustomTitle(preset.title);
    setCustomCategory(preset.category);
    setCustomDuration(preset.duration);
    inputRef.current?.focus();
  };

  // 1-Click direct submission from templates bank
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

  // Submit Paper-like Jotting
  const handleSubmitJot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = customTitle.trim() || 'تسک جدید';
    const finalDuration = detectedDuration || customDuration;

    onAddBlock({
      title: finalTitle,
      subtitle: customSubtitle.trim(),
      category: customCategory,
      day,
      startMinutes,
      durationMinutes: Math.max(15, Math.min(600, finalDuration)),
      completed: false,
      note: isAnchor ? 'anchor:true' : '',
    });

    onShowToast(`«${finalTitle}» با موفقیت در جدول ثبت گردید.`, 'success');
    onClose();
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    if (!templateSearch.trim()) return true;
    return (
      tpl.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (tpl.subtitle && tpl.subtitle.toLowerCase().includes(templateSearch.toLowerCase()))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header: Pristine Notebook Feel */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm text-white shrink-0"
              style={{ backgroundColor: dayInfo?.dotColor || '#4f46e5' }}
            >
              <PenTool className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>یادداشت سریع در {dayInfo?.nameFa}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center gap-1 shadow-2xs">
                  <Clock className="w-3 h-3" />
                  <span dir="ltr">{timeStr}</span>
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                مثل یادداشت روی دفترچه کاغذی: بنویسید و کلید Enter را بزنید
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="بستن (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/70 px-4 pt-1.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('paper')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'paper'
                ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>نوشتن سریع قلم و کاغذی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('templates')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'templates'
                ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>الگوهای آماده ({toFaDigits(templates.length)})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeMode === 'paper' ? (
            <form onSubmit={handleSubmitJot} className="space-y-4">
              {/* Main Title Input (Paper notepad feel) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>عنوان فعالیت</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {detectedDuration && (
                    <button
                      type="button"
                      onClick={() => setCustomDuration(detectedDuration)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors"
                      title="کلیک برای اعمال مدت زمان تشخیص داده شده"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>تشخیص مدت زمان: {toFaDigits(detectedDuration)} دقیقه</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitJot();
                      }
                    }}
                    placeholder="چه کاری می‌خواهید انجام دهید؟ (مثلاً: طراحی فرم ۳۰د، مطالعه فصل ۲...)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-300 focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-hidden transition-all shadow-inner"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-medium hidden sm:inline-block">
                    Enter ↵
                  </span>
                </div>
              </div>

              {/* 1-Tap Speed Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  پیش‌نهادهای سریع (یک کلیک برای پر کردن):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PAPER_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        ({toFaDigits(p.duration)}د)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Pills */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>مدت زمان فعالیت</span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[15, 30, 45, 60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setCustomDuration(dur)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        customDuration === dur
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/50'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {toFaDigits(dur)}د
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Visual Palette */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-800 block">
                  دسته‌بندی و اولویت بصری
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(categories).map((cat) => {
                    const isSelected = customCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCustomCategory(cat.key as CategoryKey)}
                        className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.dotColor }}
                        />
                        <span className="text-xs font-bold truncate flex-1">{cat.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Subtitle & Anchor Lock */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="توضیح تکمیلی یا هدف خرد (اختیاری)..."
                    className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 shrink-0 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200/70 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={isAnchor}
                    onChange={(e) => setIsAnchor(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <Anchor className="w-3.5 h-3.5 text-amber-600" />
                  <span>برنامه ثابت (Anchor)</span>
                </label>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-900/30 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ثبت فوری در جدول (Enter ↵)</span>
                </button>
              </div>
            </form>
          ) : (
            /* Templates Bank Tab */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="جستجو در میان الگوهای آماده..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredTemplates.map((tpl) => {
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
                          style={{
                            backgroundColor: `${catTheme.dotColor}25`,
                            color: catTheme.dotColor,
                          }}
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

              {filteredTemplates.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  الگویی با این عنوان یافت نشد.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
