import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Check,
  Clock,
  Palette,
  Info,
  Sliders,
} from 'lucide-react';
import { TimePhaseInfo } from '../types';
import { toFaDigits } from '../constants/plannerConfig';

interface CircadianModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: TimePhaseInfo[];
  onSavePhases: (updatedPhases: TimePhaseInfo[]) => void;
  onResetDefaultPhases: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

const PRESET_COLORS = [
  '#d97706', // Amber
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#475569', // Slate
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#16a34a', // Green
  '#ea580c', // Orange
  '#0891b2', // Cyan
];

export const CircadianModal: React.FC<CircadianModalProps> = ({
  isOpen,
  onClose,
  phases,
  onSavePhases,
  onResetDefaultPhases,
  onShowToast,
}) => {
  const [localPhases, setLocalPhases] = useState<TimePhaseInfo[]>(phases);
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalPhases(phases);
  }, [phases, isOpen]);

  if (!isOpen) return null;

  const handleUpdatePhase = (id: string, updates: Partial<TimePhaseInfo>) => {
    setLocalPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleAddNewPhase = () => {
    const newId = `phase-custom-${Date.now()}`;
    const newPhase: TimePhaseInfo = {
      id: newId,
      nameFa: 'فاز جدید تمرکز',
      nameEn: 'Custom Phase',
      startHour: 14,
      endHour: 16,
      description: 'فعالیت هدفمند و بار شناختی مشخص',
      color: '#0d9488',
      bgLight: 'bg-teal-50/60',
      borderLight: 'border-teal-200/80',
      textDark: 'text-teal-900',
      accentBar: 'bg-teal-500',
    };
    setLocalPhases((prev) => [...prev, newPhase]);
    setEditingId(newId);
    onShowToast('فاز زیستی جدید اضافه شد. مشخصات آن را ویرایش کنید.', 'info');
  };

  const handleDeletePhase = (id: string) => {
    if (localPhases.length <= 1) {
      onShowToast('حداقل یک فاز زمانی باید در سیستم باقی بماند.', 'warn');
      return;
    }
    setLocalPhases((prev) => prev.filter((p) => p.id !== id));
    onShowToast('فاز زمانی حذف شد.', 'info');
  };

  const handleSaveAll = () => {
    // Sort chronologically by startHour
    const sorted = [...localPhases].sort((a, b) => a.startHour - b.startHour);
    onSavePhases(sorted);
    onShowToast('ریتم روان‌شناختی روزانه با موفقیت ذخیره و در تمام سیستم اعمال شد!');
    onClose();
  };

  const handleReset = () => {
    if (confirm('آیا مایلید فازهای روان‌شناختی به ریتم بیولوژیک پیش‌فرض (۵ فاز طلایی) بازنشانی شوند؟')) {
      onResetDefaultPhases();
      onShowToast('ریتم‌های روان‌شناختی به حالت استاندارد بازنشانی شدند.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>ویرایش ریتم روان‌شناختی شبانه‌روز</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                  کاملاً پویا و قابل تنظیم
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                فازهای بیولوژیکی مغز و انرژی شبانه‌روزی را متناسب با سبک زندگی شخصی خود سفارشی کنید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            این فازها در نوار بالای تقویم، ستون ساعات و همچنین در خروجی هوش مصنوعی (JSON) منعکس می‌شوند تا توزیع کار عمیق و ریکاوری دقیقاً با بیولوژی شما هماهنگ باشد.
          </p>
        </div>

        {/* Phase List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              فازهای ثبت‌شده ({toFaDigits(localPhases.length)} فاز):
            </span>
            <button
              type="button"
              onClick={handleAddNewPhase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>افزودن فاز زمانی جدید</span>
            </button>
          </div>

          <div className="space-y-3">
            {localPhases.map((phase, idx) => (
              <div
                key={phase.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                      style={{ backgroundColor: phase.color }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        #{toFaDigits(idx + 1)}
                      </span>
                      <input
                        type="text"
                        value={phase.nameFa}
                        onChange={(e) => handleUpdatePhase(phase.id, { nameFa: e.target.value })}
                        className="font-extrabold text-sm text-slate-900 bg-slate-50 hover:bg-slate-100 focus:bg-white px-2.5 py-1 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-hidden transition-colors w-40 sm:w-48"
                        placeholder="نام فارسی فاز"
                      />
                      <input
                        type="text"
                        value={phase.nameEn || ''}
                        onChange={(e) => handleUpdatePhase(phase.id, { nameEn: e.target.value })}
                        className="text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-hidden transition-colors w-28 hidden md:block"
                        placeholder="English Name"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {/* Time Window Inputs */}
                    <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-500 font-medium">از:</span>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={phase.startHour}
                        onChange={(e) =>
                          handleUpdatePhase(phase.id, { startHour: Number(e.target.value) })
                        }
                        className="w-12 text-center font-mono font-black text-slate-900 bg-white rounded-md border border-slate-200 py-0.5 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">تا:</span>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={phase.endHour}
                        onChange={(e) =>
                          handleUpdatePhase(phase.id, { endHour: Number(e.target.value) })
                        }
                        className="w-12 text-center font-mono font-black text-slate-900 bg-white rounded-md border border-slate-200 py-0.5 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="حذف این فاز"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description & Color Picker */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={phase.description}
                      onChange={(e) =>
                        handleUpdatePhase(phase.id, { description: e.target.value })
                      }
                      className="w-full text-xs text-slate-700 bg-slate-50/70 hover:bg-slate-100/70 focus:bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-hidden transition-colors"
                      placeholder="توضیحات و هدف این فاز روان‌شناختی..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdatePhase(phase.id, { color: c })}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer shrink-0 ${
                          phase.color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : 'hover:scale-110 opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <input
                      type="color"
                      value={phase.color}
                      onChange={(e) => handleUpdatePhase(phase.id, { color: e.target.value })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                      title="انتخاب رنگ دلخواه"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>ذخیره تغییرات ریتم</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
