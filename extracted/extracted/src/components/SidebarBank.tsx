import React, { useState, useMemo } from 'react';
import {
  Plus,
  GripVertical,
  Clock,
  Pencil,
  Copy,
  Trash2,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { BlockTemplate, CategoryKey } from '../types';
import { CATEGORIES, formatDurationFa } from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface SidebarBankProps {
  templates: BlockTemplate[];
  onOpenCreateTemplate: () => void;
  onEditTemplate: (template: BlockTemplate) => void;
  onDuplicateTemplate: (template: BlockTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetDefaultTemplates: () => void;
  onQuickAdd: (template: BlockTemplate) => void;
  onDragStartTemplate: (e: React.DragEvent, template: BlockTemplate) => void;
}

export const SidebarBank: React.FC<SidebarBankProps> = ({
  templates,
  onOpenCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onResetDefaultTemplates,
  onQuickAdd,
  onDragStartTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filtered templates based on search & category
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        !searchQuery.trim() ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategoryFilter === 'all' || tpl.category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategoryFilter]);

  // Quick Category Groups for Filter Tabs
  const categoryGroups = [
    { key: 'all', label: 'همه' },
    { key: 'work', label: 'کد و فرانت' },
    { key: 'pytorch', label: 'پایتورچ' },
    { key: 'python', label: 'پایتون' },
    { key: 'recovery', label: 'استراحت' },
    { key: 'gaming', label: 'رفرش' },
    { key: 'habit', label: 'عادت‌ها' },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-88 shrink-0 bg-white/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-slate-200/90 p-4 flex flex-col gap-3.5 no-print select-none shadow-xs">
      {/* Header with Title & Add Template Button */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
            <span>بانک الگوهای زمانی</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200/70">
              {templates.length}
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            الگوهای آماده با قابلیت درگ، کلیک و ویرایش کامل
          </p>
        </div>
        <button
          onClick={onOpenCreateTemplate}
          id="add-custom-template-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer hover:shadow-indigo-500/20"
          title="ایجاد الگوی جدید در بانک"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>الگوی نو</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در نام یا ساب‌تایتل..."
          className="w-full pr-8.5 pl-3 py-1.5 text-xs rounded-xl bg-slate-100/90 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all text-slate-800 placeholder:text-slate-400 font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-mono p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Pills (Ordered & Clean) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {categoryGroups.map((grp) => {
          const isSelected = selectedCategoryFilter === grp.key;
          const count = grp.key === 'all' ? templates.length : templates.filter((t) => t.category === grp.key).length;
          if (count === 0 && grp.key !== 'all') return null;

          return (
            <button
              key={grp.key}
              onClick={() => setSelectedCategoryFilter(grp.key)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{grp.label}</span>
              <span className="font-mono text-[9px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Templates List with Clear Visual Hierarchy */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-310px)] pr-0.5 min-h-[200px]">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
            الگویی با این مشخصات یافت نشد.
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const theme = CATEGORIES[tpl.category] || CATEGORIES.custom;
            return (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => onDragStartTemplate(e, tpl)}
                onDoubleClick={() => onEditTemplate(tpl)}
                className={`group relative p-3 rounded-2xl border transition-all duration-150 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-sm ${theme.bgClass} ${theme.borderClass}`}
                title="بکشید و در جدول رها کنید • برای ویرایش مشخصات، روی دکمه ویرایش یا دوبار کلیک کنید"
              >
                {/* Top Row: Icon + Title + Duration Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                      style={{ backgroundColor: `${theme.dotColor}25`, color: theme.dotColor }}
                    >
                      <CategoryIcon category={tpl.category} className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-xs font-black leading-snug line-clamp-1 ${theme.textClass}`}
                        title={tpl.title}
                      >
                        {tpl.title}
                      </h3>
                      {tpl.subtitle && (
                        <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5 leading-normal">
                          {tpl.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg ${theme.badgeClass} flex items-center gap-1 font-mono`}
                    >
                      <Clock className="w-3 h-3" />
                      {formatDurationFa(tpl.defaultDuration)}
                    </span>
                    <span className="text-slate-400 group-hover:text-slate-600 transition-colors cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Explicit Action Buttons (Edit, Quick Add, Duplicate, Delete) */}
                <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-1.5">
                  {/* Quick Add into Grid */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(tpl);
                    }}
                    className="flex-1 py-1 px-2 text-[10.5px] font-bold bg-white/95 hover:bg-white text-slate-800 hover:text-indigo-700 rounded-lg shadow-2xs border border-slate-200/90 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="افزودن سریع به روز جاری"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>افزودن</span>
                  </button>

                  {/* PROMINENT EDIT BUTTON (Explicitly Requested) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTemplate(tpl);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-white/95 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 shadow-2xs text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="ویرایش کامل این الگو (عنوان، مدت، دسته‌بندی)"
                  >
                    <Pencil className="w-3 h-3 text-indigo-600" />
                    <span>ویرایش</span>
                  </button>

                  {/* Duplicate Template */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateTemplate(tpl);
                    }}
                    className="p-1 rounded-lg bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/90 transition-colors cursor-pointer"
                    title="کپی این الگو در بانک"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Template */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`آیا از حذف الگوی «${tpl.title}» از بانک اطمینان دارید؟`)) {
                        onDeleteTemplate(tpl.id);
                      }
                    }}
                    className="p-1 rounded-lg bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/90 transition-colors cursor-pointer"
                    title="حذف این الگو از بانک"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info & Reset Action */}
      <div className="mt-auto pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>مدیریت بانک الگوها</span>
          </span>
          <button
            onClick={() => {
              if (
                confirm(
                  'آیا می‌خواهید بانک الگوها به وضعیت پیش‌فرض سیستم بازنشانی شود؟'
                )
              ) {
                onResetDefaultTemplates();
              }
            }}
            className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer underline decoration-dotted"
            title="بازنشانی الگوها به وضعیت اولیه"
          >
            <RotateCcw className="w-3 h-3" />
            <span>بازنشانی پیش‌فرض‌ها</span>
          </button>
        </div>
        <p className="leading-relaxed text-[10px] text-slate-500">
          • دکمه <strong className="text-slate-700">«ویرایش»</strong> روی هر کارت به شما اجازه می‌دهد عنوان، دسته‌بندی و زمان پیش‌فرض را به دلخواه شخصی‌سازی کنید.
        </p>
      </div>
    </aside>
  );
};
