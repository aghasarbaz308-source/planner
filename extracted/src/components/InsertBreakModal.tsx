import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee, Sparkles, Check, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { TimeBlock } from '../types';
import {
  CATEGORIES,
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
} from '../constants/plannerConfig';

interface InsertBreakModalProps {
  isOpen: boolean;
  block: TimeBlock | null;
  onClose: () => void;
  onConfirmBreak: (params: {
    originalBlockId: string;
    breakDurationMinutes: number;
    breakPositionMinutes: number;
    breakTitle: string;
    breakSubtitle: string;
    mode: 'split' | 'shift';
  }) => void;
}

export const InsertBreakModal: React.FC<InsertBreakModalProps> = ({
  isOpen,
  block,
  onClose,
  onConfirmBreak,
}) => {
  if (!isOpen || !block) return null;

  const totalDuration = block.durationMinutes;

  // Recommended break durations
  const breakDurations = [
    { value: 15, label: '۱۵ دقیقه', desc: 'استاندارد پومودورو / رفرش چشم' },
    { value: 20, label: '۲۰ دقیقه', desc: 'پیاده‌روی و نوشیدن آب/چای' },
    { value: 30, label: '۳۰ دقیقه', desc: 'استراحت کامل / ناهار سبک' },
  ];

  const [selectedBreakDuration, setSelectedBreakDuration] = useState<number>(
    totalDuration >= 180 ? 20 : 15
  );

  // Position presets:
  // 1. Middle (50%)
  // 2. After 60 min (1 hr)
  // 3. After 90 min (Ultradian cycle)
  // 4. After 120 min (2 hr)
  const calculateDefaultPosition = (breakDur: number) => {
    if (totalDuration <= breakDur + 15) {
      return 15;
    }
    // Halfway rounded to nearest 5 or 15
    const rawHalf = Math.floor((totalDuration - breakDur) / 2);
    return Math.max(15, Math.round(rawHalf / 5) * 5);
  };

  const [positionMode, setPositionMode] = useState<'middle' | '60' | '90' | '120'>('middle');
  const [breakMode, setBreakMode] = useState<'split' | 'shift'>('split');
  const [breakTitle, setBreakTitle] = useState('استراحت و رفرش ذهن');
  const [breakSubtitle, setBreakSubtitle] = useState('تنفس عمیق، نوشیدن آب و کشش عضلات');

  // Compute exact position in minutes from block start
  const getPart1Duration = () => {
    if (positionMode === '60' && totalDuration > 60 + selectedBreakDuration) return 60;
    if (positionMode === '90' && totalDuration > 90 + selectedBreakDuration) return 90;
    if (positionMode === '120' && totalDuration > 120 + selectedBreakDuration) return 120;
    return calculateDefaultPosition(selectedBreakDuration);
  };

  const part1Minutes = getPart1Duration();
  const part2Minutes = Math.max(15, totalDuration - part1Minutes - selectedBreakDuration);

  // Time calculations
  const origStartStr = minutesToTimeString(block.startMinutes);
  const origEndStr = minutesToTimeString(block.startMinutes + block.durationMinutes);

  const part1EndMinutes = block.startMinutes + part1Minutes;
  const part1EndStr = minutesToTimeString(part1EndMinutes);

  const breakStartMinutes = part1EndMinutes;
  const breakEndMinutes = breakStartMinutes + selectedBreakDuration;
  const breakStartStr = minutesToTimeString(breakStartMinutes);
  const breakEndStr = minutesToTimeString(breakEndMinutes);

  const part2StartMinutes = breakEndMinutes;
  const part2EndMinutes = breakMode === 'split' ? block.startMinutes + block.durationMinutes : part2StartMinutes + (totalDuration - part1Minutes);
  const part2StartStr = minutesToTimeString(part2StartMinutes);
  const part2EndStr = minutesToTimeString(part2EndMinutes);

  const handleConfirm = () => {
    onConfirmBreak({
      originalBlockId: block.id,
      breakDurationMinutes: selectedBreakDuration,
      breakPositionMinutes: part1Minutes,
      breakTitle: breakTitle.trim() || 'استراحت و رفرش ذهن',
      breakSubtitle: breakSubtitle.trim() || 'تنفس عمیق و رفرش',
      mode: breakMode,
    });
    onClose();
  };

  const theme = CATEGORIES[block.category] || CATEGORIES.custom;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4.5 bg-gradient-to-l from-orange-50/80 via-amber-50/40 to-white border-b border-orange-200/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
                <Coffee className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>درج هوشمند استراحت در برنامه</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                    ضد تداخل و ریاضی دقیق
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  کاهش بار شناختی مغز بدون به‌هم‌ریختگی ساعات جدول
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Target Block Overview */}
            <div className={`p-3 rounded-2xl border ${theme.bgClass} ${theme.borderClass} flex items-center justify-between`}>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-bold block">بلوک کاری انتخاب‌شده:</span>
                <h4 className={`text-sm font-black truncate mt-0.5 ${theme.textClass}`}>
                  {block.title}
                </h4>
                {block.subtitle && (
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{block.subtitle}</p>
                )}
              </div>
              <div className="text-left shrink-0 ms-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-800 block">
                  {toFaDigits(origStartStr)} تا {toFaDigits(origEndStr)}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block text-center mt-1">
                  مجموع: {formatDurationFa(totalDuration)}
                </span>
              </div>
            </div>

            {/* Choose Duration */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                ۱. مدت زمان استراحت را انتخاب کنید:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {breakDurations.map((bd) => {
                  const isSelected = selectedBreakDuration === bd.value;
                  return (
                    <button
                      key={bd.value}
                      type="button"
                      onClick={() => setSelectedBreakDuration(bd.value)}
                      className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50/90 border-orange-400 ring-2 ring-orange-200 text-orange-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black">{bd.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{bd.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choose Placement */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                ۲. زمان درج استراحت در کجای بلوک باشد؟
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPositionMode('middle')}
                  className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                    positionMode === 'middle'
                      ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  وسط جلسه (۵۰٪)
                </button>

                {totalDuration > 60 + selectedBreakDuration && (
                  <button
                    type="button"
                    onClick={() => setPositionMode('60')}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                      positionMode === '60'
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    بعد از ۱ ساعت
                  </button>
                )}

                {totalDuration > 90 + selectedBreakDuration && (
                  <button
                    type="button"
                    onClick={() => setPositionMode('90')}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                      positionMode === '90'
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    بعد از ۹۰ دقیقه
                  </button>
                )}

                {totalDuration > 120 + selectedBreakDuration && (
                  <button
                    type="button"
                    onClick={() => setPositionMode('120')}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                      positionMode === '120'
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    بعد از ۲ ساعت
                  </button>
                )}
              </div>
            </div>

            {/* Split Mode Choice */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>روش اعمال در جدول زمانی:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBreakMode('split')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    breakMode === 'split'
                      ? 'bg-white border-emerald-400 ring-2 ring-emerald-200 shadow-2xs font-bold text-slate-900'
                      : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black text-emerald-800 mb-0.5">
                    <span>تقسیم هوشمند (توصیه‌شده)</span>
                    {breakMode === 'split' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    زمان کل جلسه ثابت می‌ماند؛ استراحت درون همین بازه قرار گرفته و هیچ کارت دیگری تکان نمی‌خورد.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBreakMode('shift')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    breakMode === 'shift'
                      ? 'bg-white border-indigo-400 ring-2 ring-indigo-200 shadow-2xs font-bold text-slate-900'
                      : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black text-indigo-800 mb-0.5">
                    <span>افزودن و شیفت برنامه‌ها</span>
                    {breakMode === 'shift' && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    کل کار حفظ شده و برنامه‌های پس از آن به اندازه {formatDurationFa(selectedBreakDuration)} به جلو جابجا می‌شوند.
                  </p>
                </button>
              </div>
            </div>

            {/* Live Visual Timeline Preview */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>پیش‌نمایش زنده چیدمان جدید:</span>
              </span>

              <div className="space-y-1.5">
                {/* Part 1 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">
                      {block.title} (بخش ۱)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {formatDurationFa(part1Minutes)}
                    </span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                      {toFaDigits(origStartStr)} - {toFaDigits(part1EndStr)}
                    </span>
                  </div>
                </div>

                {/* The Break */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50 border border-orange-300 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Coffee className="w-3.5 h-3.5 text-orange-600 shrink-0 stroke-[2.5]" />
                    <span className="font-black text-orange-950 truncate">
                      {breakTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-orange-700 text-[11px] font-bold">
                      {formatDurationFa(selectedBreakDuration)}
                    </span>
                    <span className="font-mono font-bold text-orange-900 bg-orange-200/70 px-2 py-0.5 rounded-md text-[11px] border border-orange-300">
                      {toFaDigits(breakStartStr)} - {toFaDigits(breakEndStr)}
                    </span>
                  </div>
                </div>

                {/* Part 2 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">
                      {block.title} (بخش ۲)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {formatDurationFa(part2Minutes)}
                    </span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                      {toFaDigits(part2StartStr)} - {toFaDigits(part2EndStr)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all cursor-pointer hover:shadow-lg"
            >
              <Coffee className="w-4 h-4 stroke-[2.5]" />
              <span>تأیید و درج هوشمند استراحت در جدول</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
