import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Trash2, Check, Copy } from 'lucide-react';
import { BlockTemplate, CategoryKey } from '../types';
import { CATEGORIES, formatDurationFa } from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: BlockTemplate | null;
  onSaveTemplate: (
    template: BlockTemplate,
    updateMatchingBlocks?: boolean,
    oldTitle?: string
  ) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: BlockTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaveTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}) => {
  const isEditing = Boolean(templateToEdit);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('work');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [updateMatchingBlocks, setUpdateMatchingBlocks] = useState(true);

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setSubtitle(templateToEdit.subtitle || '');
      setDescription(templateToEdit.description || '');
      setCategory(templateToEdit.category);
      setDefaultDuration(templateToEdit.defaultDuration || 60);
      setUpdateMatchingBlocks(true);
    } else {
      setTitle('');
      setSubtitle('');
      setDescription('');
      setCategory('work');
      setDefaultDuration(60);
      setUpdateMatchingBlocks(false);
    }
  }, [templateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const savedTemplate: BlockTemplate = {
      id: templateToEdit ? templateToEdit.id : `tmpl-custom-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'بلوک اختصاصی',
      description: description.trim() || 'الگوی بانک زمانی',
      category,
      defaultDuration,
    };

    onSaveTemplate(savedTemplate, updateMatchingBlocks, templateToEdit?.title);
    onClose();
  };

  const durations = [30, 45, 60, 90, 120, 150, 180, 240];
  const currentTheme = CATEGORIES[category] || CATEGORIES.custom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between transition-colors ${currentTheme.bgClass} ${currentTheme.borderClass}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: currentTheme.dotColor, color: '#ffffff' }}
            >
              <CategoryIcon category={category} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isEditing ? 'ویرایش الگوی بانک زمانی' : 'افزودن الگوی جدید به بانک'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing
                  ? 'تغییر عنوان، مدت، دسته‌بندی و توضیحات الگو'
                  : 'ساخت بلوک تکرارپذیر جدید برای درگ در جدول'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان الگو *
            </label>
            <input
              type="text"
              required
              placeholder="مثلا: پایتورچ پیشرفته یا بازبینی گیت"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توضیح کوتاه / برچسب زیرین
            </label>
            <input
              type="text"
              placeholder="مثلا: Tensors, Loss Function یا PR Reviews"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توضیح تفصیلی یا راهنمای کار
            </label>
            <textarea
              rows={2}
              placeholder="یادداشت پیش‌فرض برای زمان قرارگیری در جدول..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-colors resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              مدت زمان پیش‌فرض در جدول
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {durations.map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setDefaultDuration(dur)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                    defaultDuration === dur
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {formatDurationFa(dur)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              رنگ و دسته‌بندی روان‌شناختی
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
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
                        ? `ring-2 ring-indigo-500 font-bold border-indigo-400 shadow-2xs`
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

          {/* Sync existing blocks in schedule checkbox */}
          {isEditing && templateToEdit && (
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/90 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="sync-blocks-check"
                checked={updateMatchingBlocks}
                onChange={(e) => setUpdateMatchingBlocks(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 mt-0.5 cursor-pointer"
              />
              <label htmlFor="sync-blocks-check" className="text-xs font-bold text-indigo-950 cursor-pointer leading-relaxed">
                همچنین تمامی بلوک‌های موجود در جدول این هفته («{templateToEdit.title}») با این تغییرات (عنوان، دسته‌بندی و...) به‌روزرسانی شوند.
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            {/* Delete or Duplicate if editing */}
            {isEditing && templateToEdit ? (
              <div className="flex items-center gap-1.5">
                {onDeleteTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`آیا از حذف الگوی «${templateToEdit.title}» مطمئن هستید؟`)) {
                        onDeleteTemplate(templateToEdit.id);
                        onClose();
                      }
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="حذف الگو از بانک"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {onDuplicateTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicateTemplate(templateToEdit);
                      onClose();
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="تکثیر / کپی این الگو"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

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
                {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isEditing ? 'ذخیره تغییرات' : 'افزودن به بانک الگوها'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
