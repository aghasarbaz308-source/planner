import React, { useRef } from 'react';
import {
  Clock,
  Printer,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Trash2,
  HeartHandshake,
  FileText,
  Code2,
  Laptop,
  Maximize2,
  Minimize2,
  BrainCircuit,
} from 'lucide-react';
import { MOTIVATIONAL_QUOTES } from '../constants/plannerConfig';

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
  onToggleStats: () => void;
  showStats: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  onToggleStats,
  showStats,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print transition-all">
      {/* Psychological Reassurance Banner */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/80 border-b border-teal-100 px-4 py-1.5 text-xs text-teal-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 max-w-4xl min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-200/70 text-teal-800 shadow-2xs">
            <HeartHandshake className="w-3.5 h-3.5" />
          </span>
          <p className="font-medium leading-relaxed truncate md:whitespace-normal text-[11px] sm:text-xs">
            <span className="font-black text-teal-950">قانون ضد شکنندگی: </span>
            {MOTIVATIONAL_QUOTES[0]}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenLateShift}
            id="quick-shift-btn"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
            title="هل دادن سریع بلوک‌ها به بعد در صورت بیدار شدن دیروقت"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>دیر بیدار شدم! (شیفت روز)</span>
          </button>
        </div>
      </div>

      {/* Main Topbar */}
      <div className="max-w-[1850px] mx-auto px-4 py-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Title & Week descriptor */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-2xl">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-slate-100">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={plannerTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                aria-label="عنوان برنامه‌ریز"
                className="font-black text-slate-900 text-base md:text-lg bg-transparent hover:bg-slate-100/70 focus:bg-white px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-300 focus:outline-hidden transition-colors w-full sm:max-w-md md:max-w-lg truncate focus:overflow-visible leading-normal"
                title="برای ویرایش عنوان کلیک کنید"
              />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shrink-0">
                Anti-Fragile v2
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={weekRange}
                onChange={(e) => onUpdateWeekRange(e.target.value)}
                placeholder="مثلا: هفته اول اسپرینت | تمرکز روی پایتورچ و لینوکس"
                aria-label="بازه زمانی هفته"
                className="text-xs text-slate-600 bg-transparent hover:bg-slate-100/70 focus:bg-white px-2 py-0.5 rounded-md border border-transparent focus:border-slate-300 focus:outline-hidden w-full sm:max-w-md truncate focus:overflow-visible leading-normal font-medium"
                title="برای ویرایش بازه زمانی کلیک کنید"
              />
            </div>
          </div>
        </div>

        {/* Organized Functional Action Groups */}
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          {/* GROUP 1: Primary Intelligence & Views */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            {/* SPECIAL WEEKLY REPORT (NEW & USER REQUESTED) */}
            <button
              onClick={onOpenSpecialReport}
              id="special-weekly-report-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer hover:shadow-indigo-500/25"
              title="گزارش ویژه از هر کارت، ساعات پایتون/پایتورچ، درصد سهم و هوش تحلیلی هفتگی"
            >
              <BrainCircuit className="w-4 h-4 stroke-[2.2]" />
              <span>گزارش ویژه هفتگی</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-mono font-bold">
                تحلیلی
              </span>
            </button>

            {/* Daily Report */}
            <button
              onClick={onOpenDailyReport}
              id="daily-report-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200/80 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer"
              title="گزارش روزانه متنی و صدور کارت تصویری باکیفیت بالا (PNG)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>گزارش روزانه</span>
            </button>

            {/* Dedicated Monitor Fullscreen */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                id="header-fullscreen-btn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isFullscreen
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                }`}
                title="مشاهده تمام‌صفحه اختصاصی جدول برنامه متناسب با مانیتور بدون سایدبار (کلید F)"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-white" />
                    <span>خروج تمام‌صفحه</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>تمام‌صفحه مانیتور</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* GROUP 2: Exports & Print */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            {/* Print A4 / PDF */}
            <button
              onClick={onPrint}
              id="print-a4-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all cursor-pointer"
              title="چاپ هفتگی A4 و A3 یا دانلود مستقیم PDF با کیفیت بالا"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>چاپ و PDF</span>
            </button>

            {/* Offline Computer Run */}
            <button
              onClick={onOpenOfflineExport}
              id="offline-export-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-slate-200/80 hover:border-amber-300 shadow-2xs transition-all cursor-pointer"
              title="اجرای مستقیم در کامپیوتر شخصی و دانلود فایل تکی HTML آفلاین"
            >
              <Laptop className="w-3.5 h-3.5 text-amber-600" />
              <span>آفلاین (HTML)</span>
            </button>
          </div>

          {/* GROUP 3: Utilities & Architecture */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            {/* AI & JSON Architecture */}
            <button
              onClick={onOpenJsonModal}
              id="ai-json-btn"
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-700 hover:bg-white transition-all cursor-pointer"
              title="معماری JSON برای اتصال به هوش مصنوعی (Gemini/ChatGPT/Claude) و ویرایش زنده کدها"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Toggle Stats Dashboard */}
            <button
              onClick={onToggleStats}
              id="toggle-stats-btn"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showStats
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="نمایش یا پنهان‌سازی داشبورد تعادل هفتگی"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Reset to Sample */}
            <button
              onClick={onResetSample}
              id="reset-sample-btn"
              className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-white transition-all cursor-pointer"
              title="بارگذاری برنامه نمونه پیشنهادی مهندس هوش مصنوعی"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            {/* Clear Week */}
            <button
              onClick={onClearAll}
              id="clear-all-btn"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition-all cursor-pointer"
              title="پاک‌سازی هفته با محافظت ۲مرحله‌ای"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
            id="json-file-input"
          />
        </div>
      </div>
    </header>
  );
};
