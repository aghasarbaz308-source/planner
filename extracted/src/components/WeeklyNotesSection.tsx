import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
  Filter,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { WeeklyTaskItem, CategoryKey } from '../types';
import { toFaDigits, CATEGORIES } from '../constants/plannerConfig';

interface WeeklyNotesSectionProps {
  notes: WeeklyTaskItem[];
  onUpdateNotes: (updatedNotes: WeeklyTaskItem[]) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

const PRIORITY_CONFIG = {
  high: {
    label: 'فوری و حیاتی',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: '#e11d48',
  },
  medium: {
    label: 'اولویت متوسط',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: '#d97706',
  },
  normal: {
    label: 'عادی',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: '#64748b',
  },
};

export const WeeklyNotesSection: React.FC<WeeklyNotesSectionProps> = ({
  notes,
  onUpdateNotes,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'normal'>('medium');
  const [newCategory, setNewCategory] = useState<CategoryKey>('work');
  const [newNoteDetail, setNewNoteDetail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const completedCount = notes.filter((n) => n.completed).length;
  const totalCount = notes.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleComplete = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, completed: !n.completed } : n
    );
    onUpdateNotes(updated);
    const target = notes.find((n) => n.id === id);
    if (target && !target.completed) {
      onShowToast(`تسک «${target.text}» انجام شد! ✓`);
    }
  };

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) {
      onShowToast('لطفاً عنوان تسک را وارد کنید.', 'warn');
      return;
    }

    const newTask: WeeklyTaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      order: notes.length + 1,
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      category: newCategory,
      note: newNoteDetail.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdateNotes([...notes, newTask]);
    setNewText('');
    setNewNoteDetail('');
    setShowAddForm(false);
    onShowToast(`تسک شماره ${toFaDigits(notes.length + 1)} با موفقیت افزوده شد.`);
  };

  const handleDeleteTask = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    // Re-index order numbers
    const reindexed = remaining.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateNotes(reindexed);
    onShowToast('تسک حذف شد.', 'info');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= notes.length) return;

    const listCopy = [...notes];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    const reindexed = listCopy.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateNotes(reindexed);
  };

  const handleStartEdit = (task: WeeklyTaskItem) => {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const updated = notes.map((n) =>
      n.id === id ? { ...n, text: editingText.trim() } : n
    );
    onUpdateNotes(updated);
    setEditingId(null);
    onShowToast('عنوان تسک به‌روزرسانی شد.');
  };

  const handleClearCompleted = () => {
    if (completedCount === 0) return;
    if (confirm(`آیا از پاک‌سازی ${toFaDigits(completedCount)} تسک انجام‌شده اطمینان دارید؟`)) {
      const remaining = notes.filter((n) => !n.completed);
      const reindexed = remaining.map((item, idx) => ({ ...item, order: idx + 1 }));
      onUpdateNotes(reindexed);
      onShowToast('تسک‌های انجام‌شده با موفقیت پاک شدند.');
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (filterPriority === 'all') return true;
    return n.priority === filterPriority;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden no-print transition-all">
      {/* Section Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                نوت‌ها و تسک‌های اولویت‌دار این هفته
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-black border border-indigo-200/60">
                {toFaDigits(completedCount)} / {toFaDigits(totalCount)} انجام‌شده
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              کارهای حیاتی این هفته که باید انجام شوند - شماره‌گذاری‌شده با چک‌باکس و اولویت‌بندی
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Progress Mini Bar */}
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-600 font-mono">
              {toFaDigits(progressPercent)}٪
            </span>
            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>افزودن نوت / تسک</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isExpanded ? 'جمع کردن این بخش' : 'باز کردن این بخش'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Quick Add Form Drawer */}
          {showAddForm && (
            <form
              onSubmit={handleAddTask}
              className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="عنوان تسک یا یادداشت مهم این هفته (مثلا: تحویل کد بک‌اند، حل ۵ تست، تماس با استاد)..."
                  className="flex-1 bg-white text-xs sm:text-sm text-slate-800 px-3.5 py-2 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:outline-hidden shadow-2xs font-medium"
                  autoFocus
                />

                {/* Priority Selector */}
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="bg-white text-xs font-bold text-slate-700 px-3 py-2 rounded-xl border border-indigo-200 focus:outline-hidden"
                >
                  <option value="high">🔴 اولویت بالا (فوری)</option>
                  <option value="medium">🟡 اولویت متوسط</option>
                  <option value="normal">⚪ اولویت عادی</option>
                </select>

                {/* Category Tag */}
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-white text-xs font-bold text-slate-700 px-3 py-2 rounded-xl border border-indigo-200 focus:outline-hidden"
                >
                  <option value="work">پروژه کاری / لینوکس</option>
                  <option value="pytorch">پایتورچ / هوش مصنوعی</option>
                  <option value="python">پایتون</option>
                  <option value="university">دانشگاه و درس</option>
                  <option value="habit">عادت و زبان</option>
                  <option value="recovery">سلامتی و ورزش</option>
                  <option value="custom">متفرقه و شخصی</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  ثبت تسک
                </button>
              </div>

              <input
                type="text"
                value={newNoteDetail}
                onChange={(e) => setNewNoteDetail(e.target.value)}
                placeholder="توضیح تکمیلی یا ددلاین (اختیاری)..."
                className="w-full bg-white text-xs text-slate-600 px-3.5 py-1.5 rounded-xl border border-indigo-100 focus:border-indigo-400 focus:outline-hidden"
              />
            </form>
          )}

          {/* Filter & Batch Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-600">فیلتر:</span>
              {[
                { key: 'all', label: 'همه' },
                { key: 'high', label: 'فوری' },
                { key: 'medium', label: 'متوسط' },
                { key: 'normal', label: 'عادی' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterPriority(f.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterPriority === f.key
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
              >
                پاک‌سازی {toFaDigits(completedCount)} مورد انجام‌شده
              </button>
            )}
          </div>

          {/* Notes Task List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                هیچ تسک یا نوت اولویت‌داری برای این فیلتر ثبت نشده است.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                + افزودن اولین تسک هفتگی
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredNotes.map((task, idx) => {
                const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
                const catInfo = (task.category && CATEGORIES[task.category]) || CATEGORIES.work;
                const isEditing = editingId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 group ${
                      task.completed
                        ? 'bg-slate-50/80 border-slate-200/80 opacity-70'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Left: Number + Checkbox + Title */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Priority Number Pill (Swiss Design) */}
                      <span className="font-mono text-xs font-black text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shrink-0 select-none">
                        {toFaDigits(task.order < 10 ? `۰${task.order}` : String(task.order))}
                      </span>

                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task.id)}
                        className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center border transition-all mt-0.5 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                        title={task.completed ? 'علامت‌گذاری به عنوان انجام‌نشده' : 'تیک زدن انجام شد'}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Text & Note */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-indigo-400 focus:outline-hidden"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(task.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleToggleComplete(task.id)}
                            className="cursor-pointer select-none"
                          >
                            <p
                              className={`text-xs sm:text-[13px] font-extrabold leading-tight text-slate-900 break-words ${
                                task.completed ? 'line-through text-slate-400 font-normal' : ''
                              }`}
                            >
                              {task.text}
                            </p>
                            {task.note && (
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                {task.note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${prio.bg}`}
                          >
                            {prio.label}
                          </span>

                          {catInfo && (
                            <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                              {catInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === notes.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(task)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                        title="ویرایش متن"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="حذف تسک"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
