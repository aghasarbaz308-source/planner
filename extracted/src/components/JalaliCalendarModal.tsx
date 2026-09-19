import React, { useState, useMemo, useEffect } from 'react';
import {
  JALALI_MONTH_NAMES,
  getJalaliDaysInMonth,
  jalaliToDate,
  dateToJalali,
  getSaturdayOfWeek,
  getWeekId,
  formatWeekRangeFa,
  toPersianDigits,
  JalaliDate,
} from '../utils/jalaliCalendar';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

interface JalaliCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectWeekDate: (date: Date) => void;
  onOpenCreateWeekModal: (date: Date) => void;
  savedWeekIds: string[];
}

const WEEK_DAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const JalaliCalendarModal: React.FC<JalaliCalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectWeekDate,
  onOpenCreateWeekModal,
  savedWeekIds,
}) => {
  // Current active date in Jalali
  const activeJalali = useMemo(() => dateToJalali(currentDate), [currentDate]);

  // Browsing month & year in the calendar
  const [viewYear, setViewYear] = useState<number>(activeJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(activeJalali.jm);

  // Sync calendar month/year with active date whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setViewYear(activeJalali.jy);
      setViewMonth(activeJalali.jm);
    }
  }, [isOpen, activeJalali.jy, activeJalali.jm]);

  // Next / Previous month handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const j = dateToJalali(today);
    setViewYear(j.jy);
    setViewMonth(j.jm);
    onSelectWeekDate(today);
    onClose();
  };

  // Build grid days for viewYear and viewMonth
  const daysInMonth = getJalaliDaysInMonth(viewYear, viewMonth);
  // Find which weekday the 1st of this Jalali month is:
  const firstOfMonthDate = jalaliToDate(viewYear, viewMonth, 1);
  // In JS: Sun=0, Mon=1, ..., Sat=6
  // In Persian week: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  const jsDay = firstOfMonthDate.getDay();
  const persianFirstDayOffset = (jsDay + 1) % 7;

  const today = new Date();
  const todayJalali = dateToJalali(today);
  const currentWeekSaturday = getSaturdayOfWeek(currentDate);
  const currentWeekId = getWeekId(currentDate);

  // Group days into weeks for Persian calendar
  const calendarWeeks = useMemo(() => {
    const weeks: Array<Array<{
      dayNumber: number;
      date: Date;
      isCurrentMonth: boolean;
      weekId: string;
      isToday: boolean;
      isSelectedWeek: boolean;
      hasSavedData: boolean;
    } | null>> = [];

    let currentWeek: Array<any> = [];

    // Empty padding slots before 1st of month
    for (let i = 0; i < persianFirstDayOffset; i++) {
      currentWeek.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = jalaliToDate(viewYear, viewMonth, d);
      const wId = getWeekId(cellDate);
      const isToday =
        viewYear === todayJalali.jy &&
        viewMonth === todayJalali.jm &&
        d === todayJalali.jd;
      const isSelectedWeek = wId === currentWeekId;
      const hasSavedData = savedWeekIds.includes(wId);

      currentWeek.push({
        dayNumber: d,
        date: cellDate,
        isCurrentMonth: true,
        weekId: wId,
        isToday,
        isSelectedWeek,
        hasSavedData,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Trailing empty slots to complete the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [viewYear, viewMonth, daysInMonth, persianFirstDayOffset, todayJalali, currentWeekId, savedWeekIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>تقویم شمسی و انتخاب هفته</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                جابه‌جایی روان بین هفته‌ها و شروع اسپرینت‌های جدید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month & Year Navigation Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="ماه قبل"
          >
            <ChevronRight className="w-4 h-4" />
            <span>ماه قبل</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-base">
              {JALALI_MONTH_NAMES[viewMonth - 1]}
            </span>
            <span className="font-mono font-black text-indigo-700 text-base">
              {toPersianDigits(viewYear)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="ماه بعد"
          >
            <span>ماه بعد</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Week Banner */}
        <div className="px-5 py-2.5 bg-indigo-50/70 border-b border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-bold">هفته در حال نمایش:</span>
            <span className="font-medium text-slate-700 font-mono">
              {formatWeekRangeFa(currentWeekSaturday)}
            </span>
          </div>
          <button
            onClick={handleJumpToToday}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors cursor-pointer"
          >
            هفته جاری (امروز)
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-5 overflow-y-auto">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEK_DAY_NAMES.map((name, i) => (
              <div
                key={i}
                className={`text-xs font-black py-1 rounded-md ${
                  i === 6 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-600 bg-slate-50'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Weeks and Days */}
          <div className="space-y-1.5">
            {calendarWeeks.map((week, wIdx) => {
              // Find first valid day in this week to represent the week
              const firstDayInWeek = week.find((d) => d !== null);
              const isWeekSelected = week.some((d) => d?.isSelectedWeek);
              const hasWeekData = week.some((d) => d?.hasSavedData);

              return (
                <div
                  key={wIdx}
                  className={`group relative grid grid-cols-7 gap-1 p-1 rounded-2xl transition-all border ${
                    isWeekSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  {week.map((cell, cIdx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${cIdx}`}
                          className="h-10 rounded-xl bg-slate-50/30"
                        />
                      );
                    }

                    const isFriday = cIdx === 6;

                    return (
                      <button
                        key={`day-${cell.dayNumber}`}
                        type="button"
                        onClick={() => {
                          onSelectWeekDate(cell.date);
                          onClose();
                        }}
                        className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          cell.isToday
                            ? 'bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-300'
                            : cell.isSelectedWeek
                            ? 'bg-indigo-600 text-white font-black shadow-2xs'
                            : isFriday
                            ? 'text-rose-600 font-bold hover:bg-rose-50'
                            : 'text-slate-800 font-bold hover:bg-white hover:shadow-2xs'
                        }`}
                        title={`${cell.dayNumber} ${JALALI_MONTH_NAMES[viewMonth - 1]} - انتخاب این هفته`}
                      >
                        <span className="text-xs font-mono">{toPersianDigits(cell.dayNumber)}</span>
                        {/* Dot indicator if saved data exists */}
                        {cell.hasSavedData && !cell.isSelectedWeek && !cell.isToday && (
                          <span className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-1" />
                        )}
                        {cell.isToday && (
                          <span className="text-[8px] font-bold leading-none mt-0.5">امروز</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Quick Select / New Week Bar on hover / selected */}
                  {firstDayInWeek && (
                    <div className="col-span-7 flex items-center justify-between px-2 pt-1 border-t border-slate-100 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectWeekDate(firstDayInWeek.date);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-slate-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>انتخاب هفته</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatWeekRangeFa(firstDayInWeek.date)})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenCreateWeekModal(firstDayInWeek.date);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-200/60 hover:bg-indigo-100 cursor-pointer"
                        title="ایجاد اسپرینت جدید برای این هفته"
                      >
                        <Plus className="w-3 h-3" />
                        <span>اسپرینت جدید</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span>هفته فعال</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>امروز</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              <span>دارای برنامه</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
