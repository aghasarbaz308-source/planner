import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { BlockTemplate, CategoryKey } from '../types';
import { CATEGORIES, formatDurationFa } from '../constants/plannerConfig';

interface CustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (newTemplate: BlockTemplate) => void;
}

export const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({
  isOpen,
  onClose,
  onAddTemplate,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('work');
  const [defaultDuration, setDefaultDuration] = useState(60);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTemplate: BlockTemplate = {
      id: `tmpl-custom-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'بلوک اختصاصی',
      description: description.trim() || 'بلوک ساخته‌شده توسط کاربر',
      category,
      defaultDuration,
    };

    onAddTemplate(newTemplate);
    onClose();
  };

  const durations = [30, 45, 60, 90, 120, 150, 180];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Plus className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              افزودن بلوک جدید به بانک الگوها
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان بلوک
            </label>
            <input
              type="text"
              required
              placeholder="مثلا: پادکست هوش مصنوعی یا کدنویسی پروژه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توضیح کوتاه / برچسب زیرین
            </label>
            <input
              type="text"
              placeholder="مثلا: مرور مقالات Arxiv یا بازبینی گیت"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              مدت زمان پیش‌فرض
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
              رنگ و دسته‌بندی عصبی
            </label>
            <div className="grid grid-cols-2 gap-1.5">
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
                        ? `ring-2 ring-indigo-500 font-bold border-indigo-400`
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

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن به بانک الگوها</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
