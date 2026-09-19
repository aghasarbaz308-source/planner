import React, { useRef, useState } from 'react';
import {
  Calendar,
  Save,
  FileUp,
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
  CheckCircle2,
  Clock,
  ChevronDown,
  ShieldAlert,
  Zap,
  Undo2,
  Redo2,
  Plus,
  BookOpen,
  GraduationCap,
  Bell,
  Sliders,
  Palette,
  HeartHandshake,
  Database,
  BrainCircuit,
  Download,
  Upload,
  HardDrive,
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
  totalBlocksCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print transition-all">
      {/* 1. TOP ANNOUNCEMENT & COMPASSIONATE RECOVERY BAR */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 max-w-xl min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <HeartHandshake className="w-3.5 h-3.5" />
          </span>
          <p className="font-medium truncate md:whitespace-normal text-[11px] sm:text-xs text-slate-300">
            <span className="font-bold text-white">روانشناسی ضدشکننده: </span>
            {MOTIVATIONAL_QUOTES[0]}
          </p>
        </div>

        {/* Compassionate Recovery & History Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                canUndo ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title="بازگشت (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}

          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                canRedo ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title="انجام مجدد (Ctrl+Y)"
            >
              <Redo2 className="w-3 h-3" />
              <span>Redo</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-slate-700 mx-1" />

          {/* Late Shift Button */}
          <button
            onClick={onOpenLateShift}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
            title="هل دادن سریع بلوک‌ها به بعد در صورت بیدار شدن دیروقت"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>دیر بیدار شدم!</span>
          </button>

          {/* Compassionate Catch-up Button (User requested: جاموندن از برنامه اینطوری) */}
          <button
            onClick={onOpenEmergencyRecovery}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md text-[11px] transition-colors cursor-pointer shadow-xs"
            title="جاموندن از برنامه و تنظیم مجدد مهربانانه روز در صورت خستگی یا حواس‌پرتی"
          >
            <ShieldAlert className="w-3 h-3 text-amber-300" />
            <span>جاموندن از برنامه اینطوری (جبران سریع)</span>
          </button>
        </div>
      </div>

      {/* 2. ROW 1: PRIMARY EXECUTIVE BRANDING & CALENDAR NAVIGATOR (Guaranteed Non-Overlapping) */}
      <div className="max-w-[1920px] mx-auto px-4 py-2 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Right Section: Branding & Title Input */}
        <div className="flex items-center gap-3 min-w-0 max-w-md">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-indigo-50">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={plannerTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                aria-label="عنوان برنامه‌ریز"
                className="font-black text-slate-900 text-base sm:text-lg bg-transparent hover:bg-slate-100/80 focus:bg-white px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-300 focus:outline-hidden transition-colors w-full truncate"
                title="برای ویرایش عنوان کلیک کنید"
              />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shrink-0">
                سیستم ضدشکننده
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <input
                type="text"
                value={weekRange}
                onChange={(e) => onUpdateWeekRange(e.target.value)}
                placeholder="توضیح هفته یا اسپرینت جاری..."
                aria-label="بازه زمانی هفته"
                className="text-xs text-slate-600 bg-transparent hover:bg-slate-100/80 focus:bg-white px-2 py-0.5 rounded-md border border-transparent focus:border-slate-300 focus:outline-hidden w-full truncate font-medium"
              />
            </div>
          </div>
        </div>

        {/* Center Section: Shamsi Calendar & Week Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-2xs shrink-0 self-start md:self-center">
          {onPrevWeek && (
            <button
              type="button"
              onClick={onPrevWeek}
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
              title="هفته قبل (کلید تیر راست)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-indigo-50/50 text-slate-900 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
            title="تقویم شمسی و تغییر تاریخ"
          >
            <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>تقویم شمسی:</span>
            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
              {toFaDigits(jDate.jd)} {jalaliMonthName} {toFaDigits(jDate.jy)}
            </span>
          </button>

          {onNextWeek && (
            <button
              type="button"
              onClick={onNextWeek}
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
              title="هفته بعد (کلید تیر چپ)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {onOpenCreateWeek && (
            <button
              type="button"
              onClick={onOpenCreateWeek}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer mr-0.5"
              title="ایجاد هفته جدید"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>هفته جدید</span>
            </button>
          )}
        </div>

        {/* Left Section: Live Database Health Status Pill (Direct Quick Launch) */}
        {onOpenDatabaseSettings && (
          <button
            type="button"
            onClick={onOpenDatabaseSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-all cursor-pointer shrink-0 self-start md:self-center"
            title="وضعیت پایگاه داده: ذخیره پایدار و فعال. کلیک برای مدیریت دیتابیس"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-black text-emerald-950">دیتابیس ابدی فعال</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded-md border border-emerald-300">
              {toFaDigits(savedWeeksCount)} هفته
            </span>
          </button>
        )}
      </div>

      {/* 3. ROW 2: COMPREHENSIVE ACTION TOOLBAR & MODULE CONTROLS */}
      <div className="max-w-[1920px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Group A: Core Database & Storage Operations (USER REQUESTED: دیتابیس فوق العاده قوی در بالا) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenDatabaseSettings && (
            <button
              type="button"
              onClick={onOpenDatabaseSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 shadow-2xs transition-all cursor-pointer"
              title="مدیریت جامع پایگاه داده، بررسی هفته‌های ذخیره‌شده، حذف یا جایگزینی امن"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>مدیریت دیتابیس</span>
            </button>
          )}

          {/* Export & Save Dropdown Menu */}
          <div className="relative">
            <div className="flex items-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs transition-all overflow-hidden">
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer"
                title="چاپ هفتگی A4 / دانلود PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ و PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="px-1.5 py-1.5 hover:bg-slate-700 border-r border-slate-700 cursor-pointer"
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
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fade-in space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onSaveJSON();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>ذخیره فایل برنامه (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>بارگذاری فایل از سیستم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onOpenOfflineExport();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-amber-50 text-amber-950 cursor-pointer"
                  >
                    <Laptop className="w-4 h-4 text-amber-600" />
                    <span>نسخه مستقل آفلاین (HTML)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      onOpenJsonModal();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>اتصال به هوش مصنوعی (AI JSON)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Group B: Reports & Review (Empathetic phrasing: کارنامه و بررسی عملکرد) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <div className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all overflow-hidden">
              <button
                type="button"
                onClick={onOpenDailyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
                title="ثبت کارنامه پایان روز و بررسی دستاوردها"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>کارنامه روز</span>
              </button>
              <button
                type="button"
                onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
                className="px-1.5 py-1.5 hover:bg-emerald-800/60 border-r border-emerald-500 cursor-pointer"
                title="سایر گزارش‌ها"
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
                <div className="absolute right-0 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fade-in space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenDailyReport();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>کارنامه و ثبت عملکرد روزانه</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        نمره‌دهی دوستانه و صدور کارنامه تصویری
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenAuditHistory();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>آرشیو کارنامه‌های ذخیره‌شده</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        تاریخچه گزارش‌های روزهای گذشته و تحلیل رشد
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReportsMenuOpen(false);
                      onOpenSpecialReport();
                    }}
                    className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer"
                  >
                    <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>گزارش ویژه و تحلیلی هفتگی</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        تحلیل سهم پایتون، پایتورچ و کار عمیق
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Slot Interval Toggle (15m / 30m) */}
          <button
            type="button"
            onClick={onToggleSlotInterval}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            title="تغییر گام زمانی جدول بین ۱۵ و ۳۰ دقیقه"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>گام: {slotInterval === 15 ? '۱۵ دقیقه' : '۳۰ دقیقه'}</span>
          </button>

          {/* Categories Manager */}
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 shadow-2xs transition-all cursor-pointer"
            title="مدیریت و ایجاد دسته‌بندی‌های روان‌شناختی"
          >
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            <span>دسته‌بندی‌ها</span>
          </button>

          {/* Audio Chime Reminders */}
          <button
            type="button"
            onClick={onOpenReminderSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
            title="تنظیمات یادآور و هشدارهای صوتی سر وقت"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>یادآور صوتی</span>
          </button>

          {/* Interactive Tutorial */}
          <button
            type="button"
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            title="آموزش گام‌به‌گام و راهنمای ساده کار با برنامه"
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
            <span>آموزش و راهنما</span>
          </button>
        </div>

        {/* Group C: View Options (Stats, Fullscreen, Reset) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          {/* Stats Dashboard Toggle */}
          <button
            type="button"
            onClick={onToggleStats}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showStats ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="داشبورد تعادل هفتگی"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Fullscreen Mode */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFullscreen ? 'bg-amber-500 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="حالت تمام‌صفحه مانیتور"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Reset Sample Blocks */}
          <button
            type="button"
            onClick={onResetSample}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
            title="بارگذاری نمونه پیش‌فرض"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
          </button>

          {/* Clear Current Week */}
          <button
            type="button"
            onClick={onClearAll}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="پاک‌سازی هفته جاری"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
