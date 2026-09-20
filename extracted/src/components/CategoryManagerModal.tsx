import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  RotateCcw,
  Check,
  Tag,
  Palette,
  Layers,
  Brain,
  Coffee,
  Bookmark,
  Briefcase,
  Code2,
  Cpu,
  GraduationCap,
  BookOpen,
  Dumbbell,
  Heart,
  Target,
  Users,
  Compass,
} from 'lucide-react';
import { CategoryTheme } from '../types';
import { categoryService } from '../services/categoryService';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

const COLOR_PRESETS = [
  {
    name: 'آسمانی / کاری',
    bgClass: 'bg-sky-50 hover:bg-sky-100/90',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-950',
    badgeClass: 'bg-sky-200/80 text-sky-800',
    dotColor: '#0284c7',
    printBg: '#e0f2fe',
    printBorder: '#7dd3fc',
    printText: '#0369a1',
  },
  {
    name: 'زمردی / ریکاوری',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/90',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-950',
    badgeClass: 'bg-emerald-200/80 text-emerald-800',
    dotColor: '#10b981',
    printBg: '#dcfce7',
    printBorder: '#86efac',
    printText: '#14532d',
  },
  {
    name: 'ارغوانی / هوش مصنوعی',
    bgClass: 'bg-purple-50 hover:bg-purple-100/90',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-950',
    badgeClass: 'bg-purple-200/80 text-purple-800',
    dotColor: '#a855f7',
    printBg: '#f3e8ff',
    printBorder: '#d8b4fe',
    printText: '#6b21a8',
  },
  {
    name: 'کهربایی / پایتون',
    bgClass: 'bg-amber-50 hover:bg-amber-100/90',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-950',
    badgeClass: 'bg-amber-200/80 text-amber-800',
    dotColor: '#f59e0b',
    printBg: '#fef3c7',
    printBorder: '#fcd34d',
    printText: '#92400e',
  },
  {
    name: 'رز / دانشگاه و تعهد',
    bgClass: 'bg-rose-50 hover:bg-rose-100/90',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-950',
    badgeClass: 'bg-rose-200/80 text-rose-800',
    dotColor: '#f43f5e',
    printBg: '#ffe4e6',
    printBorder: '#fda4af',
    printText: '#881337',
  },
  {
    name: 'فیروزه‌ای / عادت‌ها',
    bgClass: 'bg-teal-50 hover:bg-teal-100/90',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-950',
    badgeClass: 'bg-teal-200/80 text-teal-800',
    dotColor: '#14b8a6',
    printBg: '#ccfbf1',
    printBorder: '#5eead4',
    printText: '#115e59',
  },
  {
    name: 'نیلی / جلسات تیمی',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100/90',
    borderClass: 'border-indigo-300',
    textClass: 'text-indigo-950',
    badgeClass: 'bg-indigo-200/80 text-indigo-800',
    dotColor: '#6366f1',
    printBg: '#e0e7ff',
    printBorder: '#a5b4fc',
    printText: '#3730a3',
  },
  {
    name: 'نارنجی / تفریح و رفرش',
    bgClass: 'bg-orange-50 hover:bg-orange-100/90',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-950',
    badgeClass: 'bg-orange-200/80 text-orange-800',
    dotColor: '#f97316',
    printBg: '#ffedd5',
    printBorder: '#fdba74',
    printText: '#9a3412',
  },
  {
    name: 'خاکستری مدرن / خنثی',
    bgClass: 'bg-slate-50 hover:bg-slate-100/90',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-950',
    badgeClass: 'bg-slate-200 text-slate-800',
    dotColor: '#64748b',
    printBg: '#f1f5f9',
    printBorder: '#cbd5e1',
    printText: '#1e293b',
  },
];

const AVAILABLE_ICONS = [
  'Code2',
  'Cpu',
  'Terminal',
  'GraduationCap',
  'Coffee',
  'Sparkles',
  'Users',
  'Bookmark',
  'BookOpen',
  'Brain',
  'Target',
  'Heart',
  'Briefcase',
  'Dumbbell',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [categories, setCategories] = useState<Record<string, CategoryTheme>>(() =>
    categoryService.getAll()
  );
  const [selectedEnergyFilter, setSelectedEnergyFilter] = useState<string>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for edit / new
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formIcon, setFormIcon] = useState('Bookmark');
  const [formEnergyType, setFormEnergyType] = useState<CategoryTheme['energyType']>('deep_work');
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);

  useEffect(() => {
    const unsub = categoryService.subscribe((updated) => {
      setCategories(updated);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingKey(null);
    const newId = `cat_${Date.now()}`;
    setFormKey(newId);
    setFormLabel('');
    setFormTagline('');
    setFormIcon('Target');
    setFormEnergyType('deep_work');
    setSelectedPresetIdx(0);
  };

  const handleStartEdit = (cat: CategoryTheme) => {
    setEditingKey(cat.key);
    setIsCreatingNew(false);
    setFormKey(cat.key);
    setFormLabel(cat.label);
    setFormTagline(cat.tagline || '');
    setFormIcon(cat.icon || 'Bookmark');
    setFormEnergyType(cat.energyType || 'deep_work');

    // Match preset
    const matchedIdx = COLOR_PRESETS.findIndex((p) => p.dotColor === cat.dotColor);
    setSelectedPresetIdx(matchedIdx >= 0 ? matchedIdx : 0);
  };

  const handleCancelForm = () => {
    setEditingKey(null);
    setIsCreatingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      onShowToast('لطفاً عنوان دسته‌بندی را وارد کنید.', 'warn');
      return;
    }

    const preset = COLOR_PRESETS[selectedPresetIdx];
    const newTheme: CategoryTheme = {
      key: formKey,
      label: formLabel.trim(),
      tagline: formTagline.trim() || 'دسته‌بندی روان‌شناختی',
      icon: formIcon,
      energyType: formEnergyType,
      isCustom: true,
      bgClass: preset.bgClass,
      borderClass: preset.borderClass,
      textClass: preset.textClass,
      badgeClass: preset.badgeClass,
      dotColor: preset.dotColor,
      printBg: preset.printBg,
      printBorder: preset.printBorder,
      printText: preset.printText,
    };

    categoryService.saveCategory(newTheme);
    onShowToast(
      isCreatingNew
        ? `دسته‌بندی جدید «${formLabel}» اضافه شد!`
        : `دسته‌بندی «${formLabel}» به‌روزرسانی شد!`,
      'success'
    );
    handleCancelForm();
  };

  const handleDelete = (key: string, label: string) => {
    if (confirm(`آیا از حذف دسته‌بندی «${label}» اطمینان دارید؟`)) {
      const ok = categoryService.deleteCategory(key);
      if (ok) {
        onShowToast(`دسته‌بندی «${label}» با موفقیت حذف شد.`, 'success');
      } else {
        onShowToast('امکان حذف دسته‌بندی‌های پایه سیستم وجود ندارد.', 'warn');
      }
    }
  };

  const handleResetDefaults = () => {
    if (confirm('آیا مایلید تمام دسته‌بندی‌ها به تنظیمات پیش‌فرض کارخانه بازگردند؟')) {
      categoryService.resetToDefaults();
      onShowToast('دسته‌بندی‌ها به حالت پیش‌فرض بازنشانی شدند.', 'info');
      handleCancelForm();
    }
  };

  const categoryList: CategoryTheme[] = Object.values(categories) as CategoryTheme[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>مدیریت دسته‌بندی‌های روان‌شناختی و انرژی</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                  {categoryList.length} مورد
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ویرایش نام، بار شناختی، رنگ‌بندی و افزودن دسته‌های جدید برای شخصی‌سازی کامل
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
          {/* Top Actions: Add Category & Reset Defaults */}
          {!isCreatingNew && !editingKey && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer hover:shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن دسته‌بندی جدید</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                title="بازنشانی تمام دسته‌ها به حالت کارخانه"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به پیش‌فرض کارخانه</span>
              </button>
            </div>
          )}

          {/* EDIT / CREATE FORM */}
          {(isCreatingNew || editingKey) && (
            <form
              onSubmit={handleSaveForm}
              className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{isCreatingNew ? 'ایجاد دسته‌بندی جدید' : 'ویرایش دسته‌بندی'}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  انصراف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان دسته</label>
                  <input
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="مثلاً: زبان آلمانی، کتابخوانی، ورزش..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توضیح روان‌شناختی / شعار
                  </label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="مثلاً: ۲۰ دقیقه مطالعه با تمرکز بالا"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Energy Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع بار شناختی و انرژی
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'deep_work', label: 'کار عمیق (Deep Focus)', desc: 'بیشترین تمرکز' },
                    { id: 'recovery', label: 'ریکاوری و استراحت', desc: 'شارژ مجدد ذهن' },
                    { id: 'constraint', label: 'تعهد و محدودیت', desc: 'دانشگاه، کلاس، رفت‌وآمد' },
                    { id: 'habit', label: 'عادت خرد / سبک', desc: 'کارهای کوتاه‌مدت' },
                  ].map((eType) => (
                    <button
                      key={eType.id}
                      type="button"
                      onClick={() => setFormEnergyType(eType.id as any)}
                      className={`p-2 rounded-xl text-right border transition-all cursor-pointer ${
                        formEnergyType === eType.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{eType.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{eType.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  پالت رنگ و استایل بصری
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPresetIdx(idx)}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs text-right transition-all cursor-pointer ${
                        selectedPresetIdx === idx
                          ? 'ring-2 ring-indigo-600 border-indigo-500 bg-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: preset.dotColor }}
                      />
                      <span className="truncate text-[11px]">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">آیکون نشانگر</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        formIcon === iconName
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-110'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={iconName}
                    >
                      <CategoryIcon icon={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">پیش‌نمایش کارت:</span>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${COLOR_PRESETS[selectedPresetIdx].bgClass} ${COLOR_PRESETS[selectedPresetIdx].borderClass} ${COLOR_PRESETS[selectedPresetIdx].textClass}`}
                  >
                    <CategoryIcon icon={formIcon} className="w-3.5 h-3.5" />
                    <span>{formLabel || 'عنوان نمونه'}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLOR_PRESETS[selectedPresetIdx].dotColor }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200/70 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List of Categories */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              دسته‌بندی‌های فعال سیستم
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryList.map((cat) => (
                <div
                  key={cat.key}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${cat.bgClass} ${cat.borderClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-white/60"
                      style={{ backgroundColor: `${cat.dotColor}25`, color: cat.dotColor }}
                    >
                      <CategoryIcon category={cat.key as any} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black truncate ${cat.textClass}`}>
                          {cat.label}
                        </span>
                        {cat.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                            سفارشی
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cat.tagline || 'تسک و فعالیت'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white/80 transition-colors cursor-pointer"
                      title="ویرایش دسته‌بندی"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cat.key !== 'custom' && cat.key !== 'work' && cat.key !== 'recovery' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.key, cat.label)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white/80 transition-colors cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
