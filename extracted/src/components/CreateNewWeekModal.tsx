import React, { useState } from 'react';
import { formatWeekRangeFa, toPersianDigits, dateToJalali } from '../utils/jalaliCalendar';
import {
  CalendarDays,
  Copy,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface CreateNewWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: Date;
  onConfirmCreate: (params: {
    targetDate: Date;
    title: string;
    weekRange: string;
    copyRoutineFromCurrent: boolean;
  }) => void;
}

export const CreateNewWeekModal: React.FC<CreateNewWeekModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  onConfirmCreate,
}) => {
  const weekRangeFormatted = formatWeekRangeFa(targetDate);
  const j = dateToJalali(targetDate);

  const [title, setTitle] = useState<string>(`اسپرینت هفته ${toPersianDigits(j.jd)} ${formatWeekRangeFa(targetDate).split(' ')[1] || ''}`);
  const [copyRoutine, setCopyRoutine] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleCreate = () => {
    onConfirmCreate({
      targetDate,
      title: title.trim() || 'برنامه هفتگی تایم‌باکسینگ',
      weekRange: weekRangeFormatted,
      copyRoutineFromCurrent: copyRoutine,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                ایجاد و تنظیم هفته جدید
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                بازه زمانی: {weekRangeFormatted}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Target Week Banner */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/70 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-indigo-900 block">
                هفته انتخابی در تقویم شمسی:
              </span>
              <span className="text-xs font-black text-indigo-700">
                {weekRangeFormatted}
              </span>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              عنوان اسپرینت یا هدف هفته:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: اسپرینت یادگیری عمیق، مدلسازی شبکه عصبی و هماهنگی"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-hidden text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Strategy Selection: Copy vs Blank Canvas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              نحوه چیدمان بلوک‌های هفته جدید:
            </label>
            <div className="space-y-2.5">
              {/* Option 1: Smart Transfer */}
              <div
                onClick={() => setCopyRoutine(true)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  copyRoutine
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  checked={copyRoutine}
                  onChange={() => setCopyRoutine(true)}
                  className="mt-1 text-indigo-600 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">
                      الگوبرداری هوشمند از روتین‌های هفته جاری
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold">
                      پیشنهادی
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    ساختار روتین‌ها (ساعات پایتون، کار، مطالعه و استراحت) از هفته قبل منتقل می‌شود، تیک انجام تمام تسک‌ها ریست می‌گردد تا آماده اجرای دوباره در این هفته باشد.
                  </p>
                </div>
              </div>

              {/* Option 2: Blank Canvas */}
              <div
                onClick={() => setCopyRoutine(false)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !copyRoutine
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  checked={!copyRoutine}
                  onChange={() => setCopyRoutine(false)}
                  className="mt-1 text-indigo-600 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-black text-slate-900">
                      شروع با جدول خالی (تخته سفید)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    جدول این هفته کاملاً سفید و بدون بلوک خواهد بود تا بتوانید از ابتدا برنامه متفاوتی را بچینید. اطلاعات هفته‌های قبلی در دیتابیس محفوظ باقی می‌ماند.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>ایجاد و بارگذاری هفته جدید</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
