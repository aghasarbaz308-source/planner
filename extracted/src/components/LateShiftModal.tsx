import React, { useState } from 'react';
import { X, Zap, Clock, Calendar, ShieldCheck, HeartHandshake, ArrowDown } from 'lucide-react';
import { DayKey, TimeBlock } from '../types';
import { DAYS, END_HOUR, formatDurationFa, toFaDigits } from '../constants/plannerConfig';

interface LateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  onApplyShift: (day: DayKey, shiftMinutes: number, afterMinutes: number) => void;
}

export const LateShiftModal: React.FC<LateShiftModalProps> = ({
  isOpen,
  onClose,
  blocks,
  onApplyShift,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayKey>('sat');
  const [shiftMinutes, setShiftMinutes] = useState<number>(60); // default 1 hour
  const [afterHour, setAfterHour] = useState<number>(7); // from 07:00

  if (!isOpen) return null;

  // Quick preset shift buttons
  const shiftPresets = [
    { label: '+۳۰ دقیقه', value: 30 },
    { label: '+۱ ساعت', value: 60 },
    { label: '+۱.۵ ساعت', value: 90 },
    { label: '+۲ ساعت', value: 120 },
    { label: '+۳ ساعت', value: 180 },
  ];

  const dayBlocks = blocks.filter(
    (b) => b.day === selectedDay && b.startMinutes >= afterHour * 60
  );

  const handleShift = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyShift(selectedDay, shiftMinutes, afterHour * 60);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">موتور ضد شکنندگی (نجات روز)</h3>
              <p className="text-xs text-amber-100">
                انتقال روان بلوک‌ها به بعد در صورت بیدار شدن دیرهنگام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Psychological Calming Card */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-start gap-2.5">
          <HeartHandshake className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">کمال‌گرایی منفی را کنار بگذار!</p>
            <p className="leading-relaxed">
              اگر دیر بیدار شدی یا کار غیرمنتظره‌ای پیش آمد، نیازی نیست کل روز را
              رها کنی. با این ابزار، تمام تسک‌ها به‌طور خودکار رو به پایین شیفت
              پیدا می‌کنند تا زنجیره تلاش روزانه‌ات قطع نشود.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleShift} className="p-5 space-y-4">
          {/* Day selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              کدام روز را می‌خواهی شیفت بدهی؟
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    selectedDay === d.id
                      ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {d.nameFa}
                </button>
              ))}
            </div>
          </div>

          {/* Preset shift amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              چقدر تأخیر داشتی؟ (مدت زمان جابجایی رو به جلو)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {shiftPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  onClick={() => setShiftMinutes(preset.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                    shiftMinutes === preset.value
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Affected blocks preview count */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4 text-amber-500" />
              <span>تعداد بلوک‌های تحت تأثیر در این روز:</span>
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {toFaDigits(dayBlocks.length)} بلوک
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={dayBlocks.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>شیفت بده و روزم رو نجات بده</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
