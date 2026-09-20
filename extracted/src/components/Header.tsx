import React, { useRef, useState } from 'react';
import {
  Calendar,
  Printer,
  Sparkles,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Code2,
  Minimize2,
  Maximize2,
  Trash2,
  Laptop,
  Clock,
  ChevronDown,
  ShieldAlert,
  Zap,
  Undo2,
  Redo2,
  Plus,
  GraduationCap,
  Bell,
  Sliders,
  Palette,
  HeartHandshake,
  Database,
  BrainCircuit,
  Download,
  Upload,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import { MOTIVATIONAL_QUOTES, toFaDigits } from '../constants/plannerConfig';
import {
  dateToJalali,
  JALALI_MONTH_NAMES,
} from '../utils/jalaliCalendar';

interface HeaderProps {
  plannerTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  weekRange: string;
  onUpdateWeekRange: (newRange: string) => void;
  onSaveJSON: () => void;
  onLoadJSON: (file: File) => void;
  onPrint: () => void;
  onOpenDailyReport: () => void;
  onOpenSpecialReport: () => void;
  onOpenJsonModal: () => void;
  onOpenOfflineExport: () => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onOpenLateShift: () => void;
  onOpenEmergencyRecovery: () => void;
  onOpenTutorial: () => void;
  onOpenReminderSettings: () => void;
  onOpenCategoryManager: () => void;
  onOpenAuditHistory: () => void;
  onOpenDatabaseSettings?: () => void;
  onOpenFocusMode?: () => void;
  onOpenConflictResolver?: () => void;
  onOpenAiPlanner?: () => void;
  conflictsCount?: number;
  activeBlockTitle?: string;
  slotInterval: number;
  onToggleSlotInterval: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleStats?: () => void;
  showStats?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  currentDate?: Date;
  onOpenCalendar?: () => void;
  onOpenCreateWeek?: () => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  savedWeeksCount?: number;
  totalBlocksCount?: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenMorningBriefing?: () => void;
  onOpenEveningRitual?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  plannerTitle,
  onUpdateTitle,
  weekRange,
  onUpdateWeekRange,
  onSaveJSON,
  onLoadJSON,
  onPrint,
  onOpenDailyReport,
  onOpenSpecialReport,
  onOpenJsonModal,
  onOpenOfflineExport,
  onResetSample,
  onClearAll,
  onOpenLateShift,
  onOpenEmergencyRecovery,
  onOpenTutorial,
  onOpenReminderSettings,
  onOpenCategoryManager,
  onOpenAuditHistory,
  onOpenDatabaseSettings,
  onOpenFocusMode,
  onOpenConflictResolver,
  onOpenAiPlanner,
  conflictsCount = 0,
  activeBlockTitle,
  slotInterval,
  onToggleSlotInterval,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleStats,
  showStats,
  isFullscreen = false,
  onToggleFullscreen,
  currentDate = new Date(),
  onOpenCalendar,
  onOpenCreateWeek,
  onPrevWeek,
  onNextWeek,
  savedWeeksCount = 1,
  theme = 'dark',
  onToggleTheme,
  onOpenMorningBriefing,
  onOpenEveningRitual,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isDark = theme !== 'light';

  const jDate = dateToJalali(currentDate);
  const jalaliMonthName = JALALI_MONTH_NAMES[jDate.jm - 1];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadJSON(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 no-print transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 shadow-xl'
          : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 text-slate-800 shadow-sm'
      }`}
    >
      {/* 1. TOP EXECUTIVE RIBBON: MOTTO, UNDO/REDO & RECOVERY ACTIONS */}
      <div
        className={`px-3 sm:px-5 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2.5 border-b transition-colors duration-200 ${
          isDark
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800/60 shadow-inner'
            : 'bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        {/* Reassuring Guidance Motto */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-2xl py-0.5">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ring-1 shadow-xs ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                : 'bg-emerald-100 text-emerald-700 ring-emerald-300'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <p className="font-medium truncate text-[11px] sm:text-xs leading-snug">
            <span
              className={`font-black ml-1 ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300'
                  : 'text-emerald-700'
              }`}
            >
              پایداری و انعطاف:
            </span>
            <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
              {MOTIVATIONAL_QUOTES[0]}
            </span>
          </p>
        </div>

        {/* Action Controls: Undo/Redo, Late Shift & Recovery */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* History Undo / Redo */}
          <div
            className={`flex items-center rounded-lg p-0.5 border shadow-xs transition-colors ${
              isDark
                ? 'bg-slate-800/90 border-slate-700/60'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  canUndo
                    ? isDark
                      ? 'bg-slate-700/90 hover:bg-slate-600 text-white shadow-2xs hover:scale-102 active:scale-95'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-2xs active:scale-95'
                    : isDark
                    ? 'text-slate-500 cursor-not-allowed opacity-40'
                    : 'text-slate-400 cursor-not-allowed opacity-40'
                }`}
                title="بازگشت تغییرات قبلی (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden xs:inline">Undo</span>
              </button>
            )}

            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  canRedo
                    ? isDark
                      ? 'bg-slate-700/90 hover:bg-slate-600 text-white shadow-2xs hover:scale-102 active:scale-95'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-2xs active:scale-95'
                    : isDark
                    ? 'text-slate-500 cursor-not-allowed opacity-40'
                    : 'text-slate-400 cursor-not-allowed opacity-40'
                }`}
                title="انجام مجدد (Ctrl+Y)"
              >
                <Redo2 className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden xs:inline">Redo</span>
              </button>
            )}
          </div>

          <div
            className={`h-4 w-px mx-0.5 ${
              isDark ? 'bg-slate-800' : 'bg-slate-300'
            }`}
          />

          {/* Late Shift Button */}
          <button
            type="button"
            onClick={onOpenLateShift}
            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:shadow-xs hover:shadow-amber-500/20'
                : 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-300 shadow-2xs'
            }`}
            title="انتقال سریع برنامه‌ها به ساعات بعدی در صورت تاخیر صبحگاهی"
          >
            <Zap className="w-3 h-3 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>تنظیم تاخیر صبحگاهی</span>
          </button>

          {/* Compassionate Recovery Button */}
          <button
            type="button"
            onClick={onOpenEmergencyRecovery}
            className="group flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-xs shadow-rose-900/30 hover:shadow-rose-700/40 ring-1 ring-rose-400/40 active:scale-95"
            title="تنظیم مجدد منعطف برنامه در مواقع پیش‌بینی‌نشده یا خستگی"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>جبران هوشمند زمان</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE DOCK: BRANDING, TITLE, SHAMSI CALENDAR & STORAGE STATUS */}
      <div
        className={`max-w-[1920px] mx-auto px-3 sm:px-5 py-2.5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3 backdrop-blur-md transition-colors duration-200 ${
          isDark
            ? 'bg-slate-900/60 border-slate-800/80'
            : 'bg-slate-50/70 border-slate-200/90'
        }`}
      >
        {/* Brand & Editable Title Section */}
        <div className="flex items-center gap-3.5 min-w-0 max-w-xl">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0 ring-2 ring-indigo-400/40 group-hover:scale-105 transition-all">
              <Clock className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 ring-1 ring-emerald-400 animate-pulse ${
                isDark ? 'border-slate-900' : 'border-white'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={plannerTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                aria-label="عنوان برنامه‌ریز"
                className={`font-black text-base sm:text-lg bg-transparent px-2 py-0.5 rounded-lg border border-transparent focus:border-indigo-500 focus:outline-hidden transition-all w-full truncate shadow-2xs ${
                  isDark
                    ? 'text-white hover:bg-slate-800/60 focus:bg-slate-800/90 placeholder-slate-500'
                    : 'text-slate-900 hover:bg-slate-200/50 focus:bg-white placeholder-slate-400'
                }`}
                title="برای ویرایش عنوان کلیک کنید"
              />
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shrink-0 shadow-2xs flex items-center gap-1 border ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>برنامه‌ریزی پایدار</span>
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <input
                type="text"
                value={weekRange}
                onChange={(e) => onUpdateWeekRange(e.target.value)}
                placeholder="عنوان یا هدف هفته (مثلاً هفته اول مهر)..."
                aria-label="بازه زمانی هفته"
                className={`text-xs bg-transparent px-2 py-0.5 rounded-md border border-transparent focus:border-indigo-500/70 focus:outline-hidden w-full truncate font-medium transition-all ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800/60 focus:bg-slate-800/90'
                    : 'text-slate-700 hover:bg-slate-200/50 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Center: Interactive Shamsi Calendar Navigator Dock */}
        <div
          className={`flex items-center gap-1.5 p-1 rounded-2xl border shadow-inner shrink-0 self-start lg:self-center ring-1 transition-colors ${
            isDark
              ? 'bg-slate-950/80 border-slate-800 ring-slate-800/60'
              : 'bg-white border-slate-200 shadow-2xs ring-slate-200/60'
          }`}
        >
          {onPrevWeek && (
            <button
              type="button"
              onClick={onPrevWeek}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
                isDark
                  ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title="هفته قبل (کلید تیر راست)"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCalendar}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black border shadow-xs transition-all cursor-pointer hover:border-indigo-500/50 ${
              isDark
                ? 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-100 border-slate-700/60'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title="تقویم شمسی و انتخاب تاریخ دقیق"
          >
            <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span
              className={`hidden sm:inline font-bold ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              تقویم شمسی:
            </span>
            <span
              className={`font-mono px-2.5 py-0.5 rounded-lg text-xs font-black border shrink-0 shadow-2xs ${
                isDark
                  ? 'text-indigo-300 bg-indigo-950/80 border-indigo-500/30'
                  : 'text-indigo-800 bg-indigo-50 border-indigo-200'
              }`}
            >
              {toFaDigits(jDate.jd)} {jalaliMonthName} {toFaDigits(jDate.jy)}
            </span>
          </button>

          {onNextWeek && (
            <button
              type="button"
              onClick={onNextWeek}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
                isDark
                  ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title="هفته بعد (کلید تیر چپ)"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {onOpenCreateWeek && (
            <button
              type="button"
              onClick={onOpenCreateWeek}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-900/30 transition-all cursor-pointer mr-0.5 hover:scale-102 active:scale-95"
              title="ایجاد اسپرینت یا هفته جدید"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>هفته جدید</span>
            </button>
          )}
        </div>

        {/* Left: Durable Storage / Database Live Health Badge */}
        {onOpenDatabaseSettings && (
          <button
            type="button"
            onClick={onOpenDatabaseSettings}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-xs transition-all cursor-pointer shrink-0 self-start lg:self-center active:scale-98 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 hover:from-emerald-900/60 hover:to-slate-850 border-emerald-500/30 hover:border-emerald-400/60'
                : 'bg-white hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-300 shadow-2xs'
            }`}
            title="وضعیت ذخیره‌سازی: داده‌ها به صورت محلی و پایدار ذخیره شده‌اند. کلیک برای مدیریت داده‌ها"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
              <span
                className={`w-2.5 h-2.5 rounded-full bg-emerald-500 relative shrink-0 ring-2 ${
                  isDark ? 'ring-emerald-950' : 'ring-white'
                }`}
              />
            </div>
            <div className="text-right">
              <div
                className={`text-xs font-black flex items-center gap-1.5 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                <span>پایگاه داده محلی متصل</span>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div
                className={`text-[10px] font-mono font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {toFaDigits(savedWeeksCount)} برنامه ذخیره‌شده
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 3. EXECUTIVE POWER TOOLS DOCK & QUICK LAUNCHERS */}
      <div
        className={`max-w-[1920px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs transition-colors duration-200 ${
          isDark
            ? 'bg-slate-950/40 text-slate-200'
            : 'bg-slate-50/90 border-t border-slate-200/80 text-slate-700'
        }`}
      >
        {/* Core Actions: AI Assistant, Focus Mode, Conflict Resolver & Reports */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Planner Assistant Button */}
          {onOpenAiPlanner && (
            <button
              type="button"
              onClick={onOpenAiPlanner}
              className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 shadow-md shadow-indigo-900/30 transition-all cursor-pointer ring-2 ring-indigo-400/40 hover:ring-indigo-300 hover:scale-102 active:scale-95"
              title="دستیار هوشمند برنامه‌ریزی با هوش مصنوعی (Gemini AI)"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-45 transition-transform" />
              <span>دستیار هوش مصنوعی</span>
              <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-md font-mono font-bold tracking-wider">
                AI
              </span>
            </button>
          )}

          {/* Deep Focus Mode Button */}
          {onOpenFocusMode && (
            <button
              type="button"
              onClick={onOpenFocusMode}
              className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 ${
                activeBlockTitle
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white ring-2 ring-amber-300/80 shadow-orange-950/60 animate-pulse'
                  : isDark
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600/70 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
              }`}
              title="ورود به حالت تمام‌صفحه تمرکز بالا با تایمر زنده و راهنمای تسک فعلی"
            >
              <Flame
                className={`w-4 h-4 ${
                  activeBlockTitle
                    ? 'text-amber-200 fill-amber-300 animate-bounce'
                    : 'text-amber-500'
                }`}
              />
              <span>حالت تمرکز بالا</span>
              {activeBlockTitle ? (
                <span className="max-w-[130px] truncate text-[10px] bg-black/40 px-2 py-0.5 rounded-md font-bold text-amber-200 border border-amber-400/30">
                  {activeBlockTitle}
                </span>
              ) : (
                <span
                  className={`text-[10px] font-normal ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  آماده
                </span>
              )}
            </button>
          )}

          {/* Smart Conflict Resolver Button */}
          {onOpenConflictResolver && conflictsCount > 0 && (
            <button
              type="button"
              onClick={onOpenConflictResolver}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-rose-200 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/60 shadow-md shadow-rose-950/50 transition-all cursor-pointer animate-pulse active:scale-95"
              title="شناسایی تداخل‌های هم‌پوشانی کارت‌ها - کلیک برای رفع خودکار"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 stroke-[2.5]" />
              <span>{toFaDigits(conflictsCount)} تداخل</span>
              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold">
                حل تداخل
              </span>
            </button>
          )}

          {/* Reports & Karnameh Dropdown */}
          <div className="relative">
            <div className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md shadow-emerald-950/30 transition-all overflow-hidden ring-1 ring-emerald-400/40">
              <button
                type="button"
                onClick={onOpenDailyReport}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-black cursor-pointer active:bg-emerald-700"
                title="ثبت ارزیابی عملکرد روزانه و بررسی دستاوردها"
              >
                <GraduationCap className="w-4 h-4 text-emerald-200" />
                <span>ارزیابی روزانه</span>
              </button>
              <button
                type="button"
                onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
                className="px-2 py-2 hover:bg-emerald-700 border-r border-emerald-500/50 cursor-pointer"
                title="سایر گزارش‌ها و تاریخچه ارزیابی‌ها"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reports Dropdown Menu */}
            {reportsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setReportsMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 mt-1.5 w-64 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1 text-right border transition-colors ${
                    isDark
                      ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/80 text-slate-100'
                      : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-xl'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenDailyReport();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border border-transparent transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-100 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/30'
                        : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black">ثبت و ارزیابی عملکرد روز</div>
                      <div
                        className={`text-[10px] font-normal ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        بررسی درصد تحقق اهداف و صدور گزارش تصویری
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenAuditHistory();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border border-transparent transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-100 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/30'
                        : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black">تاریخچه ارزیابی‌های روزانه</div>
                      <div
                        className={`text-[10px] font-normal ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        گزارش‌های روزهای گذشته و تحلیل روند پیشرفت
                      </div>
                    </div>
                  </button>

                  {onOpenMorningBriefing && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportsMenuOpen(false);
                        onOpenMorningBriefing();
                      }}
                      className={`w-full text-right flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border border-transparent transition-all cursor-pointer ${
                        isDark
                          ? 'text-slate-100 hover:bg-amber-950/60 hover:text-amber-300 hover:border-amber-500/30'
                          : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black">برنامه اجرایی صبحگاه (Horizon)</div>
                        <div
                          className={`text-[10px] font-normal ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          بررسی تسک‌های امروز و شروع در حالت تمرکز
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenEveningRitual && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportsMenuOpen(false);
                        onOpenEveningRitual();
                      }}
                      className={`w-full text-right flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border border-transparent transition-all cursor-pointer ${
                        isDark
                          ? 'text-slate-100 hover:bg-purple-950/60 hover:text-purple-300 hover:border-purple-500/30'
                          : 'text-slate-800 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isDark
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black">پایان روز و جمع‌بندی کاری (Review)</div>
                        <div
                          className={`text-[10px] font-normal ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          بررسی تحقق اهداف و بستن پرونده روزانه
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenSpecialReport();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border border-transparent transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-100 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-500/30'
                        : 'text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isDark
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black">تحلیل جامع و آماری هفته</div>
                      <div
                        className={`text-[10px] font-normal ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        نمودار توزیع زمان و پیشرفت اهداف کاری
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Secondary Tools: Database, Export, Reminders, Categories & Theme Switch */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Database Manager Button */}
          {onOpenDatabaseSettings && (
            <button
              type="button"
              onClick={onOpenDatabaseSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all cursor-pointer ${
                isDark
                  ? 'text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
              }`}
              title="مدیریت داده‌ها، بررسی هفته‌های ذخیره‌شده و پشتیبان‌گیری"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>مدیریت داده‌ها</span>
            </button>
          )}

          {/* Export & Save Dropdown Menu */}
          <div className="relative">
            <div
              className={`flex items-center rounded-xl border shadow-xs transition-all overflow-hidden ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700/70'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer"
                title="چاپ هفتگی A4 / ذخیره PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>چاپ و ذخیره PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className={`px-1.5 py-1.5 border-r cursor-pointer ${
                  isDark
                    ? 'hover:bg-slate-600 border-slate-700'
                    : 'hover:bg-slate-200 border-slate-200'
                }`}
                title="سایر گزینه‌های ذخیره و خروجی"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Dropdown Menu */}
            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div
                  className={`absolute left-0 mt-1.5 w-60 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1 text-right border ${
                    isDark
                      ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/80'
                      : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-xl'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onSaveJSON();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    <span>پشتیبان‌گیری (فایل JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>بازیابی فایل پشتیبان (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onOpenOfflineExport();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-amber-950/50 hover:text-amber-300'
                        : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-amber-500" />
                    <span>خروجی تک‌فایل مستقل (HTML)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onOpenJsonModal();
                    }}
                    className={`w-full text-right flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-indigo-950/50 hover:text-indigo-300'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-900'
                    }`}
                  >
                    <Code2 className="w-4 h-4 text-indigo-500" />
                    <span>کپی کدهای JSON هوش مصنوعی</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Slot Interval Toggle (15m / 30m) */}
          <button
            type="button"
            onClick={onToggleSlotInterval}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark
                ? 'text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
                : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
            }`}
            title="تغییر گام زمانی جدول بین ۱۵ و ۳۰ دقیقه"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>گام: {slotInterval === 15 ? '۱۵ دقیقه' : '۳۰ دقیقه'}</span>
          </button>

          {/* Categories Manager */}
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all cursor-pointer ${
              isDark
                ? 'text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border-purple-600/40'
                : 'text-purple-800 bg-purple-50 hover:bg-purple-100 border-purple-200 shadow-2xs'
            }`}
            title="مدیریت دسته‌بندی‌ها و رنگ‌ها"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">دسته‌بندی‌ها</span>
          </button>

          {/* Audio Chime Reminders */}
          <button
            type="button"
            onClick={onOpenReminderSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all cursor-pointer ${
              isDark
                ? 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border-amber-600/40'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-2xs'
            }`}
            title="تنظیمات یادآور و هشدارهای صوتی سر وقت"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">یادآور و هشدارها</span>
          </button>

          {/* Interactive Tutorial */}
          <button
            type="button"
            onClick={onOpenTutorial}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark
                ? 'text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
                : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
            }`}
            title="آموزش گام‌به‌گام و راهنمای کاربری برنامه"
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">راهنمای کاربری</span>
          </button>

          {/* Theme Duality Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border-amber-600/40 shadow-xs'
                  : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 shadow-2xs'
              }`}
              title={isDark ? 'تغییر به حالت روز (روشن)' : 'تغییر به حالت شب (تیره)'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">حالت روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">حالت شب</span>
                </>
              )}
            </button>
          )}

          {/* View Utilities: Stats, Fullscreen, Reset Sample, Clear All */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
            }`}
          >
            {/* Stats Dashboard Toggle */}
            <button
              type="button"
              onClick={onToggleStats}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                showStats
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="داشبورد آمار و تعادل هفتگی"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Fullscreen Mode */}
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isFullscreen
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="حالت تمام‌صفحه مانیتور"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            )}

            {/* Reset Sample Blocks */}
            <button
              type="button"
              onClick={onResetSample}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
              title="بارگذاری مجدد نمونه پیش‌فرض"
            >
              <Sparkles className="w-4 h-4 text-amber-500/80" />
            </button>

            {/* Clear Current Week */}
            <button
              type="button"
              onClick={onClearAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="پاک‌سازی هفته جاری"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden File Input for JSON import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
          id="json-file-input"
        />
      </div>
    </header>
  );
};
