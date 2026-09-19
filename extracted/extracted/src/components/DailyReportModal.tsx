import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Calendar,
  Sparkles,
  Clock,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Share2,
  Flame,
  Coffee,
  Brain,
  Info,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Compass,
  CheckSquare,
  Square,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { TimeBlock, DayKey, DayInfo } from '../types';
import {
  DAYS,
  CATEGORIES,
  TIME_PHASES,
  getTimePhase,
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
  MOTIVATIONAL_QUOTES,
  START_HOUR,
  END_HOUR,
} from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  plannerTitle: string;
  weekRange: string;
  initialDay?: DayKey;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
  onToggleComplete?: (blockId: string) => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  blocks,
  plannerTitle,
  weekRange,
  initialDay = 'sat',
  onShowToast,
  onToggleComplete,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayKey>(initialDay);
  const [activeTab, setActiveTab] = useState<'minimal' | 'text' | 'image'>('minimal');
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedOverview, setIsCopiedOverview] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [imageScale, setImageScale] = useState<number>(2.5); // 2.5x Ultra HD

  const cardRef = useRef<HTMLDivElement>(null);
  const minimalCardRef = useRef<HTMLDivElement>(null);

  // Selected Day Information
  const dayInfo = useMemo(() => {
    return DAYS.find((d) => d.id === selectedDay) || DAYS[0];
  }, [selectedDay]);

  // Day's blocks sorted by start time
  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.day === selectedDay)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [blocks, selectedDay]);

  // Day metrics
  const dayMetrics = useMemo(() => {
    let totalMinutes = 0;
    let deepWorkMinutes = 0;
    let recoveryMinutes = 0;
    let completedCount = 0;

    dayBlocks.forEach((b) => {
      totalMinutes += b.durationMinutes;
      if (b.completed) completedCount++;
      if (b.category === 'pytorch' || b.category === 'python' || b.category === 'work') {
        deepWorkMinutes += b.durationMinutes;
      } else if (b.category === 'recovery' || b.category === 'gaming') {
        recoveryMinutes += b.durationMinutes;
      }
    });

    const completionRate =
      dayBlocks.length > 0 ? Math.round((completedCount / dayBlocks.length) * 100) : 0;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      deepWorkHours: (deepWorkMinutes / 60).toFixed(1),
      recoveryHours: (recoveryMinutes / 60).toFixed(1),
      totalMinutes,
      deepWorkMinutes,
      recoveryMinutes,
      totalBlocks: dayBlocks.length,
      completedCount,
      completionRate,
    };
  }, [dayBlocks]);

  // Group blocks by circadian periods
  const circadianGroups = useMemo(() => {
    const morning = dayBlocks.filter((b) => b.startMinutes < 11 * 60);
    const noon = dayBlocks.filter((b) => b.startMinutes >= 11 * 60 && b.startMinutes < 15 * 60);
    const evening = dayBlocks.filter((b) => b.startMinutes >= 15 * 60 && b.startMinutes < 19 * 60);
    const night = dayBlocks.filter((b) => b.startMinutes >= 19 * 60);

    return { morning, noon, evening, night };
  }, [dayBlocks]);

  // Clean, perfectly proportioned text briefing requested by user
  const textBriefing = useMemo(() => {
    const lines: string[] = [];
    lines.push(`🎯 گزارش روزانه: ${dayInfo.nameFa} (${dayInfo.mood})`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`⏱️ مجموع زمان: ${toFaDigits(dayMetrics.totalHours)} ساعت | تمرکز عمیق: ${toFaDigits(dayMetrics.deepWorkHours)} ساعت`);
    lines.push(`📊 انجام شده: ${toFaDigits(dayMetrics.completedCount)} از ${toFaDigits(dayBlocks.length)} فعالیت`);
    lines.push('');
    lines.push('📍 جدول زمانبندی:');

    if (dayBlocks.length === 0) {
      lines.push('▫️ روز آزاد و استراحت (هیچ فعالیتی ثبت نشده است)');
    } else {
      dayBlocks.forEach((b) => {
        const startStr = minutesToTimeString(b.startMinutes);
        const endStr = minutesToTimeString(b.startMinutes + b.durationMinutes);
        const statusMark = b.completed ? '✅' : '▫️';
        const detail = b.subtitle ? ` (${b.subtitle})` : '';
        lines.push(`${statusMark} ${toFaDigits(startStr)} - ${toFaDigits(endStr)} | ${b.title}${detail}`);
      });
    }

    lines.push('');
    lines.push('💡 اصل ضداضطراب: ۱ همیشه بزرگتر از ۰ است.');
    return lines.join('\n');
  }, [dayInfo, dayMetrics, dayBlocks]);

  // At-A-Glance executive summary (در یک نگاه سریع)
  const atAGlanceBriefing = useMemo(() => {
    const lines: string[] = [
      `⚡ نقشه روز ${dayInfo.nameFa} (${dayInfo.nameEn}) در یک نگاه`,
      `🎯 استراتژی: ${dayInfo.mood}`,
      `───────────────────────────────`,
    ];

    if (dayBlocks.length === 0) {
      lines.push('▫️ روز آزاد و استراحت');
    } else {
      dayBlocks.forEach((b) => {
        const startStr = minutesToTimeString(b.startMinutes);
        const endStr = minutesToTimeString(b.startMinutes + b.durationMinutes);
        const status = b.completed ? '✅' : '▫️';
        lines.push(`${status} ${toFaDigits(startStr)}-${toFaDigits(endStr)}: ${b.title}${b.subtitle ? ` (${b.subtitle})` : ''}`);
      });
    }

    lines.push(`───────────────────────────────`);
    lines.push(`📊 ${toFaDigits(dayMetrics.totalHours)}س کل • ${toFaDigits(dayMetrics.deepWorkHours)}س عمیق • پیشرفت: ${toFaDigits(dayMetrics.completionRate)}٪`);
    return lines.join('\n');
  }, [dayInfo, dayBlocks, dayMetrics]);

  if (!isOpen) return null;

  // Copy Clean Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textBriefing);
      setIsCopiedText(true);
      onShowToast(`گزارش متنی روز ${dayInfo.nameFa} در کلیپ‌بورد کپی شد!`);
      setTimeout(() => setIsCopiedText(false), 2500);
    } catch (err) {
      onShowToast('خطا در دسترسی به کلیپ‌بورد', 'warn');
    }
  };

  // Copy At-a-Glance Text
  const handleCopyOverview = async () => {
    try {
      await navigator.clipboard.writeText(atAGlanceBriefing);
      setIsCopiedOverview(true);
      onShowToast(`نقشه «در یک نگاه» روز ${dayInfo.nameFa} در کلیپ‌بورد کپی شد!`);
      setTimeout(() => setIsCopiedOverview(false), 2500);
    } catch (err) {
      onShowToast('خطا در دسترسی به کلیپ‌بورد', 'warn');
    }
  };

  // Resilient High-DPI PNG generation with font safety
  const generatePngBlobFromElement = async (
    targetElement: HTMLElement
  ): Promise<{ blob: Blob; dataUrl: string } | null> => {
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(targetElement, {
        scale: imageScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: targetElement.offsetWidth,
        windowHeight: targetElement.offsetHeight,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              letter-spacing: 0px !important;
              word-spacing: 0px !important;
              font-family: 'Vazirmatn RD', 'Vazirmatn', sans-serif !important;
              font-feature-settings: 'ss01' 1, 'cv01' 1, 'kern' 1, 'liga' 1, 'tnum' 1 !important;
              -webkit-font-smoothing: antialiased !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const dataUrl = canvas.toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, dataUrl };
    } catch (primaryErr) {
      console.warn('html2canvas fallback to html-to-image:', primaryErr);
      const dataUrl = await htmlToImage.toPng(targetElement, {
        pixelRatio: imageScale,
        backgroundColor: '#ffffff',
        style: {
          letterSpacing: '0px',
          fontFamily: "'Vazirmatn RD', 'Vazirmatn', sans-serif",
        },
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, dataUrl };
    }
  };

  // Download daily PNG card (minimal or poster)
  const handleDownloadImage = async (isMinimal: boolean = true) => {
    const target = isMinimal ? minimalCardRef.current : cardRef.current;
    if (!target) return;

    setIsRenderingImage(true);
    try {
      const result = await generatePngBlobFromElement(target);
      if (!result) return;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', result.dataUrl);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute(
        'download',
        `${isMinimal ? 'minimal-roadmap' : 'daily-poster'}-${dayInfo.id}-${dateStr}.png`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast(`تصویر ${isMinimal ? 'مینیمال' : 'پوستر'} روز ${dayInfo.nameFa} دانلود شد!`);
    } catch (err) {
      console.error(err);
      onShowToast('خطا در تولید تصویر', 'warn');
    } finally {
      setIsRenderingImage(false);
    }
  };

  // Copy PNG image directly into clipboard
  const handleCopyImage = async (isMinimal: boolean = true) => {
    const target = isMinimal ? minimalCardRef.current : cardRef.current;
    if (!target) return;

    setIsRenderingImage(true);
    try {
      const result = await generatePngBlobFromElement(target);
      if (!result) return;

      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': result.blob });
        await navigator.clipboard.write([item]);
        setIsCopiedImage(true);
        onShowToast(`تصویر ${isMinimal ? 'مینیمال' : 'پوستر'} در کلیپ‌بورد کپی شد (آماده Paste)!`);
        setTimeout(() => setIsCopiedImage(false), 2500);
      } else {
        handleDownloadImage(isMinimal);
      }
    } catch (err) {
      console.error('Clipboard write error', err);
      handleDownloadImage(isMinimal);
      onShowToast('تصویر دانلود شد (مرورگر از کپی مستقیم تصویر پشتیبانی نکرد).', 'info');
    } finally {
      setIsRenderingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  گزارش روزانه و نقشه اجرایی (Daily Briefing & Roadmap)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-semibold">
                  در یک نگاه
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                درک فوری فعالیت‌های امروز، گزارش متنی زیبا و کارت تصویری باکیفیت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Days Switcher Bar (شنبه تا جمعه) */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto select-none">
          <span className="text-xs font-bold text-slate-600 pl-2 shrink-0">
            انتخاب روز:
          </span>
          {DAYS.map((d) => {
            const count = blocks.filter((b) => b.day === d.id).length;
            const isSelected = selectedDay === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : d.dotColor }}
                />
                <span>{d.nameFa}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-md font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {toFaDigits(count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Selector: 1) Minimalist Graphical Output, 2) Spacious Text, 3) Classic Poster */}
        <div className="flex items-center justify-between px-5 pt-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Tab 1: Minimalist Graphical Output */}
            <button
              onClick={() => setActiveTab('minimal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'minimal'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>خروجی گرافیکی مینیمال (در یک نگاه)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                حرفه‌ای و سبک
              </span>
            </button>

            {/* Tab 2: Clean Text Briefing */}
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'text'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>خروجی متنی با فضای تنفس (تلگرام و نوت)</span>
            </button>

            {/* Tab 3: Visual Poster */}
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'image'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>پوستر رنگی HD (PNG کلاسیک)</span>
            </button>
          </div>

          {/* Quick Metrics preview pill */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold">
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              <span>تمرکز: {toFaDigits(dayMetrics.deepWorkHours)} ساعت</span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{toFaDigits(dayMetrics.completionRate)}٪ انجام شده</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/40">
          {/* TAB 1: MINIMALIST GRAPHICAL OUTPUT (در یک نگاه، بدون بی‌نظمی و شلوغی) */}
          {activeTab === 'minimal' && (
            <div className="space-y-4">
              {/* Minimal Card Top Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">وضوح تصویر:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'عادی (1.5x)', val: 1.5 },
                      { label: 'با کیفیت بالا (2.5x HD)', val: 2.5 },
                      { label: 'فوق شفاف (3.5x Ultra)', val: 3.5 },
                    ].map((q) => (
                      <button
                        key={q.val}
                        onClick={() => setImageScale(q.val)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          imageScale === q.val
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyOverview}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                    title="کپی متن خلاصه در کلیپ‌بورد"
                  >
                    {isCopiedOverview ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedOverview ? 'کپی شد!' : 'کپی خلاصه متنی'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyImage(true)}
                    disabled={isRenderingImage}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCopiedImage ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-slate-300" />}
                    <span>{isCopiedImage ? 'عکس کپی شد!' : 'کپی مستقیم تصویر'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadImage(true)}
                    disabled={isRenderingImage}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRenderingImage ? 'در حال رندر...' : 'دانلود تصویر PNG'}</span>
                  </button>
                </div>
              </div>

              {/* The Minimalist Executive Graphic Card Container */}
              <div className="flex justify-center overflow-x-auto p-2 bg-slate-200/60 rounded-2xl border border-slate-300/80">
                <div
                  ref={minimalCardRef}
                  style={{
                    width: '680px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontFamily: "'Vazirmatn RD', 'Vazirmatn', sans-serif",
                    letterSpacing: '0px',
                  }}
                  className="p-6 rounded-2xl shadow-xl border border-slate-200/90 flex flex-col gap-4 shrink-0 select-none"
                  dir="rtl"
                >
                  {/* Minimal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: dayInfo.dotColor }}
                        />
                        <h2 className="text-xl font-black text-slate-900 leading-normal">
                          برنامه روز {dayInfo.nameFa}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                          {dayInfo.nameEn}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                          {dayInfo.mood}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {weekRange || plannerTitle || 'برنامه‌ریز هفتگی تایم‌باکسینگ'}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-800 block">
                        {new Date().toLocaleDateString('fa-IR')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                        MINIMAL EXECUTIVE ROADMAP
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour Horizon Bar (نوار افق زمانی ۲۴ ساعته - کل روز در یک نگاه) */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold px-0.5">
                      <span>۰۷:۰۰</span>
                      <span>۱۰:۰۰</span>
                      <span>۱۳:۰۰</span>
                      <span>۱۶:۰۰</span>
                      <span>۱۹:۰۰</span>
                      <span>۲۲:۰۰</span>
                      <span>۲۴:۰۰</span>
                    </div>

                    <div className="h-3.5 bg-slate-200/80 rounded-full relative overflow-hidden border border-slate-300/60">
                      {dayBlocks.map((b) => {
                        const startOffset = Math.max(0, b.startMinutes - 7 * 60);
                        const leftPct = (startOffset / (17 * 60)) * 100;
                        const widthPct = Math.max(1.5, (b.durationMinutes / (17 * 60)) * 100);
                        const cat = CATEGORIES[b.category] || CATEGORIES.custom;

                        return (
                          <div
                            key={b.id}
                            title={`${b.title} (${minutesToTimeString(b.startMinutes)} - ${minutesToTimeString(b.startMinutes + b.durationMinutes)})`}
                            style={{
                              right: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: b.completed ? '#94a3b8' : cat.dotColor,
                            }}
                            className="absolute inset-y-0 rounded-xs opacity-90 transition-opacity hover:opacity-100"
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Minimalist Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                      <span className="text-[10px] text-slate-500 font-bold block">
                        کل زمان هدفمند
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {toFaDigits(dayMetrics.totalHours)} ساعت
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-indigo-150 bg-indigo-50/40 text-center">
                      <span className="text-[10px] text-indigo-700 font-bold block">
                        تمرکز عمیق (Deep)
                      </span>
                      <span className="text-sm font-black text-indigo-950 font-mono">
                        {toFaDigits(dayMetrics.deepWorkHours)} ساعت
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-pink-150 bg-pink-50/40 text-center">
                      <span className="text-[10px] text-pink-700 font-bold block">
                        ریکاوری و تنفس
                      </span>
                      <span className="text-sm font-black text-pink-950 font-mono">
                        {toFaDigits(dayMetrics.recoveryHours)} ساعت
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-150 bg-emerald-50/40 text-center">
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        پیشرفت روز
                      </span>
                      <span className="text-sm font-black text-emerald-950 font-mono">
                        {toFaDigits(dayMetrics.completedCount)} / {toFaDigits(dayMetrics.totalBlocks)} ({toFaDigits(dayMetrics.completionRate)}٪)
                      </span>
                    </div>
                  </div>

                  {/* Minimalist Chronological Flow Timeline */}
                  <div className="space-y-2 mt-1">
                    {dayBlocks.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                        <Coffee className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">
                          برای این روز هیچ بلوک زمانی ثبت نشده است.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          روز آزاد و استراحت کامل مغز و جسم.
                        </p>
                      </div>
                    ) : (
                      dayBlocks.map((b) => {
                        const startStr = minutesToTimeString(b.startMinutes);
                        const endStr = minutesToTimeString(b.startMinutes + b.durationMinutes);
                        const cat = CATEGORIES[b.category] || CATEGORIES.custom;

                        return (
                          <div
                            key={b.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              b.completed
                                ? 'bg-slate-50/80 border-slate-200 opacity-80'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Checkbox toggle */}
                              {onToggleComplete && (
                                <button
                                  onClick={() => onToggleComplete(b.id)}
                                  className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                                >
                                  {b.completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Dot indicator */}
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.dotColor }}
                              />

                              {/* Title & Subtitle */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-bold truncate ${
                                      b.completed
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {b.title}
                                  </span>
                                  <span
                                    style={{ color: cat.textColor, backgroundColor: cat.badgeBg }}
                                    className="text-[9px] px-2 py-0.5 rounded-md font-medium shrink-0"
                                  >
                                    {cat.label}
                                  </span>
                                </div>
                                {b.subtitle && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {b.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Time and Duration Badge */}
                            <div className="text-left shrink-0 font-mono">
                              <span className="text-xs font-bold text-slate-900 block">
                                {toFaDigits(startStr)} — {toFaDigits(endStr)}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {toFaDigits(b.durationMinutes)} دقیقه
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Minimalist Footnote (Anti-fragile) */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">
                      «۱ همیشه از ۰ بزرگ‌تر است — در صورت تأخیر، بدون سرزنش شیفت بده!»
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ANTI-FRAGILE TIMEBOXING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPACIOUS STRUCTURED TEXT BRIEFING (با فضای تنفس کافی و خوانایی بالا) */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">
                    گزارش متنی با ساختار بسیار تمیز، منظم و دارای فضای تنفس (مناسب پیام‌رسان‌ها و یادداشت‌ها):
                  </span>
                </div>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isCopiedText ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedText ? 'کپی شد!' : 'کپی کل متن در کلیپ‌بورد'}</span>
                </button>
              </div>

              {/* Textarea presentation with high breathing room */}
              <div className="relative">
                <textarea
                  readOnly
                  value={textBriefing}
                  rows={16}
                  style={{
                    fontFamily: "'Vazirmatn RD', 'Vazirmatn', monospace",
                    lineHeight: '2.1',
                    letterSpacing: '0px',
                  }}
                  className="w-full p-5 text-xs sm:text-sm text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-hidden resize-none shadow-2xs select-all"
                />
              </div>

              {/* Copy suggestion */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                <span>
                  💡 <strong>فضای تنفس و وضوح بالا:</strong> این خروجی با فونت استاندارد، اعداد فارسی هماهنگ و فواصل مشخص قالب‌بندی شده است و بدون هیچ‌گونه بهم‌ریختگی در تلگرام، واتس‌اپ یا برنامه‌های یادداشت باز می‌شود.
                </span>
                <button
                  onClick={handleCopyText}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0 mr-2"
                >
                  کپی سریع متن
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL POSTER CARD (PNG HD) */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* Card Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">کیفیت خروجی:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'عادی (1.5x)', val: 1.5 },
                      { label: 'با کیفیت بالا (2.5x HD)', val: 2.5 },
                      { label: 'فوق شفاف (3.5x Ultra)', val: 3.5 },
                    ].map((q) => (
                      <button
                        key={q.val}
                        onClick={() => setImageScale(q.val)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          imageScale === q.val
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Copy Image Button */}
                  <button
                    onClick={() => handleCopyImage(false)}
                    disabled={isRenderingImage}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="کپی مستقیم پوستر در کلیپ‌بورد سیستم"
                  >
                    {isCopiedImage ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                    <span>{isCopiedImage ? 'عکس کپی شد!' : 'کپی پوستر در کلیپ‌بورد'}</span>
                  </button>

                  {/* Download Image Button */}
                  <button
                    onClick={() => handleDownloadImage(false)}
                    disabled={isRenderingImage}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRenderingImage ? 'در حال رندر...' : 'دانلود پوستر PNG'}</span>
                  </button>
                </div>
              </div>

              {/* Poster Preview Container (Scrollable) */}
              <div className="flex justify-center overflow-x-auto p-2 bg-slate-200/60 rounded-2xl border border-slate-300/80">
                <div
                  ref={cardRef}
                  style={{ width: '680px', backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="p-6 rounded-2xl shadow-xl border border-slate-300 flex flex-col gap-4 font-['Vazirmatn',sans-serif] shrink-0"
                >
                  {/* Card Header */}
                  <div
                    style={{
                      backgroundColor: dayInfo.printHeaderBg || '#f8fafc',
                      borderColor: dayInfo.printBorder || '#e2e8f0',
                      letterSpacing: '0px',
                    }}
                    className="p-4 rounded-xl border flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: dayInfo.dotColor }}
                        />
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-normal">
                          برنامه روز {dayInfo.nameFa}
                        </h1>
                        <span
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            borderColor: '#cbd5e1',
                          }}
                          className="text-xs px-2.5 py-0.5 rounded-full border font-bold font-mono"
                        >
                          {dayInfo.nameEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        استراتژی بیولوژیکی: {dayInfo.mood}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-xs font-bold text-slate-800">
                        {weekRange || plannerTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {new Date().toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2">
                    <div
                      style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
                      className="p-2.5 rounded-xl border text-center"
                    >
                      <span className="text-[10px] text-blue-800 font-bold block">
                        زمان کل برنامه
                      </span>
                      <span className="text-sm font-black text-blue-950 font-mono">
                        {toFaDigits(dayMetrics.totalHours)}h
                      </span>
                    </div>

                    <div
                      style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                      className="p-2.5 rounded-xl border text-center"
                    >
                      <span className="text-[10px] text-emerald-800 font-bold block">
                        تمرکز عمیق (Deep)
                      </span>
                      <span className="text-sm font-black text-emerald-950 font-mono">
                        {toFaDigits(dayMetrics.deepWorkHours)}h
                      </span>
                    </div>

                    <div
                      style={{ backgroundColor: '#fdf2f8', borderColor: '#fbcfe8' }}
                      className="p-2.5 rounded-xl border text-center"
                    >
                      <span className="text-[10px] text-pink-800 font-bold block">
                        ریکاوری و تنفس
                      </span>
                      <span className="text-sm font-black text-pink-950 font-mono">
                        {toFaDigits(dayMetrics.recoveryHours)}h
                      </span>
                    </div>

                    <div
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                      className="p-2.5 rounded-xl border text-center"
                    >
                      <span className="text-[10px] text-slate-700 font-bold block">
                        پیشرفت تسک‌ها
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {toFaDigits(dayMetrics.completionRate)}٪
                      </span>
                    </div>
                  </div>

                  {/* Day Timeline Blocks */}
                  <div className="space-y-2">
                    {dayBlocks.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                        <Coffee className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">
                          برای این روز هیچ بلوک زمانی ثبت نشده است.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          می‌توانید به عنوان روز ریکاوری و بازیابی کامل انرژی استفاده کنید.
                        </p>
                      </div>
                    ) : (
                      dayBlocks.map((b) => {
                        const startStr = minutesToTimeString(b.startMinutes);
                        const endStr = minutesToTimeString(
                          b.startMinutes + b.durationMinutes
                        );
                        const cat = CATEGORIES[b.category] || CATEGORIES.custom;
                        const hour = Math.floor(b.startMinutes / 60);
                        const phase = getTimePhase(hour);

                        return (
                          <div
                            key={b.id}
                            style={{
                              backgroundColor: b.completed ? '#f8fafc' : cat.printBg || '#f8fafc',
                              borderColor: b.completed ? '#cbd5e1' : cat.printBorder || '#e2e8f0',
                            }}
                            className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.dotColor }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={`font-black text-xs sm:text-sm text-slate-900 truncate ${
                                      b.completed ? 'line-through text-slate-400' : ''
                                    }`}
                                  >
                                    {b.title}
                                  </h3>
                                  {b.subtitle && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-300 text-slate-600 font-mono">
                                      {b.subtitle}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                  <span>{cat.label.split('(')[0]}</span>
                                  <span>•</span>
                                  <span>{phase.nameFa}</span>
                                  {b.note && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-xs">{b.note}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              <div className="text-xs font-black text-slate-900 font-mono">
                                {toFaDigits(startStr)} - {toFaDigits(endStr)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {formatDurationFa(b.durationMinutes)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Card Footer with Anti-Fragile Quote */}
                  <div
                    style={{ backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>اصل ضدشکنندگی: «۱ همیشه از ۰ بزرگ‌تره - در صورت تأخیر، با آرامش شیفت بده!»</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Anti-Fragile Timeboxing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
