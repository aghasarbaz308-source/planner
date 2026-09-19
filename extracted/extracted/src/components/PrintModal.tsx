import React, { useState, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import {
  Printer,
  Download,
  FileText,
  Image,
  Check,
  X,
  Loader2,
  Sparkles,
  Layers,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Clock,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import {
  START_HOUR,
  END_HOUR,
  SLOT_INTERVAL,
  DAYS,
  CATEGORIES,
  TIME_PHASES,
  getTimePhase,
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
  MOTIVATIONAL_QUOTES,
} from '../constants/plannerConfig';
import { TimeBlock, DayKey, CategoryKey } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  plannerTitle: string;
  weekRange: string;
}

type PaperSize = 'a4' | 'a3' | 'letter';
type PaperOrientation = 'landscape' | 'portrait';
type RenderQuality = 'ultra' | 'high' | 'standard';

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  blocks,
  plannerTitle,
  weekRange,
}) => {
  // Config states
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');
  const [quality, setQuality] = useState<RenderQuality>('ultra');
  const [showLegend, setShowLegend] = useState(true);
  const [showNotesBox, setShowNotesBox] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Status states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Time slots for grid
  const timeSlots = useMemo(() => {
    const slots: { label: string; minutes: number; isHour: boolean }[] = [];
    for (let m = START_HOUR * 60; m < END_HOUR * 60; m += SLOT_INTERVAL) {
      slots.push({
        label: minutesToTimeString(m),
        minutes: m,
        isHour: m % 60 === 0,
      });
    }
    return slots;
  }, []);

  // Summary statistics for printable header
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let deepWorkMinutes = 0;
    let recoveryMinutes = 0;
    let uniMinutes = 0;

    blocks.forEach((b) => {
      totalMinutes += b.durationMinutes;
      if (b.category === 'work' || b.category === 'python' || b.category === 'pytorch') {
        deepWorkMinutes += b.durationMinutes;
      } else if (b.category === 'recovery' || b.category === 'gaming') {
        recoveryMinutes += b.durationMinutes;
      } else if (b.category === 'university') {
        uniMinutes += b.durationMinutes;
      }
    });

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      deepWorkHours: (deepWorkMinutes / 60).toFixed(1),
      recoveryHours: (recoveryMinutes / 60).toFixed(1),
      uniHours: (uniMinutes / 60).toFixed(1),
      blocksCount: blocks.length,
    };
  }, [blocks]);

  // Dimension calculations for chosen paper size and orientation
  const sheetDimensions = useMemo(() => {
    if (orientation === 'landscape') {
      if (paperSize === 'a3') return { width: 1550, height: 1096, mmW: 420, mmH: 297 };
      if (paperSize === 'letter') return { width: 1400, height: 1082, mmW: 279.4, mmH: 215.9 };
      // Default A4 Landscape: aspect ratio 1.4142
      return { width: 1400, height: 990, mmW: 297, mmH: 210 };
    } else {
      // Portrait
      if (paperSize === 'a3') return { width: 1096, height: 1550, mmW: 297, mmH: 420 };
      if (paperSize === 'letter') return { width: 1082, height: 1400, mmW: 215.9, mmH: 279.4 };
      // Default A4 Portrait
      return { width: 1000, height: 1414, mmW: 210, mmH: 297 };
    }
  }, [paperSize, orientation]);

  // Dynamic slot height to exactly fill the available grid height without scrolling
  const slotHeightPx = useMemo(() => {
    // Total height minus header, footer, day-headers and paddings
    const headerHeight = showStats ? 72 : 54;
    const dayHeaderHeight = 32;
    const footerHeight = showNotesBox ? (showLegend ? 84 : 54) : (showLegend ? 44 : 20);
    const paddingTotal = 32;

    const availableGridHeight = sheetDimensions.height - (headerHeight + dayHeaderHeight + footerHeight + paddingTotal);
    const calculatedSlot = Math.floor(availableGridHeight / timeSlots.length);
    return Math.max(calculatedSlot, orientation === 'portrait' ? 32 : 20);
  }, [sheetDimensions.height, showStats, showNotesBox, showLegend, timeSlots.length, orientation]);

  if (!isOpen) return null;

  // Scale multiplier based on chosen quality
  const getScaleMultiplier = () => {
    if (quality === 'ultra') return 3.5; // ~350 DPI ultra crisp print
    if (quality === 'high') return 2.8;  // ~280 DPI crisp print
    return 2.2;                         // ~220 DPI balanced
  };

  // High-fidelity PNG render helper that ensures zero blur or JPEG compression artifacts on Persian typography
  const renderElementToDataUrl = async (
    element: HTMLElement,
    scaleMultiplier: number
  ): Promise<string> => {
    try {
      const canvas = await html2canvas(element, {
        scale: scaleMultiplier,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              letter-spacing: 0px !important;
              word-spacing: 0px !important;
              font-family: 'Vazirmatn RD', 'Vazirmatn', sans-serif !important;
              font-feature-settings: 'ss01' 1, 'cv01' 1, 'kern' 1, 'liga' 1, 'tnum' 1 !important;
              -webkit-font-smoothing: antialiased !important;
              text-rendering: geometricPrecision !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });
      return canvas.toDataURL('image/png');
    } catch (primaryErr) {
      console.warn('html2canvas-pro fallback engaged:', primaryErr);
      return await htmlToImage.toPng(element, {
        pixelRatio: scaleMultiplier,
        backgroundColor: '#ffffff',
        style: {
          letterSpacing: '0px',
          fontFamily: "'Vazirmatn RD', 'Vazirmatn', sans-serif",
        },
      });
    }
  };

  const renderElementToPngUrl = async (
    element: HTMLElement,
    scaleMultiplier: number
  ): Promise<string> => {
    return renderElementToDataUrl(element, scaleMultiplier);
  };

  // 1. HIGH-QUALITY PDF GENERATION
  const handleExportPDF = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPdf(true);
    setErrorMessage(null);
    setGenerationProgress('در حال آماده‌سازی فونت‌ها و رندر عناصر برگه...');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Small delay to ensure all DOM styles are painted
      await new Promise((resolve) => setTimeout(resolve, 150));

      setGenerationProgress('در حال تبدیل برگه با کیفیت فوق‌العاده بالا...');
      const element = printSheetRef.current;
      const scaleMultiplier = getScaleMultiplier();

      const imgData = await renderElementToDataUrl(element, scaleMultiplier);

      setGenerationProgress('در حال ساخت سند PDF در ابعاد دقیق...');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: paperSize,
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Use lossless PNG embedding with no lossy re-compression
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');

      const fileSafeTitle = (plannerTitle || 'Timebox-Planner')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim();
      const filename = `${fileSafeTitle}-${paperSize.toUpperCase()}-${orientation}.pdf`;

      setGenerationProgress('دانلود فایل...');
      pdf.save(filename);
      setGenerationProgress('تکمیل شد!');
      setTimeout(() => setGenerationProgress(''), 2000);
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      setErrorMessage(`خطا در تولید فایل PDF: ${err?.message || 'مشکل در خواندن رنگ‌ها یا ابعاد'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. HIGH-RES PNG EXPORT
  const handleExportPNG = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPng(true);
    setErrorMessage(null);
    setGenerationProgress('در حال رندر تصویر با رزولوشن بالا...');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = printSheetRef.current;
      const scaleMultiplier = getScaleMultiplier();

      const imageURL = await renderElementToPngUrl(element, scaleMultiplier);

      setGenerationProgress('در حال ذخیره فایل تصویر...');
      const link = document.createElement('a');
      const fileSafeTitle = (plannerTitle || 'Timebox-Planner')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim();
      link.download = `${fileSafeTitle}-${paperSize.toUpperCase()}-${orientation}.png`;
      link.href = imageURL;
      link.click();

      setGenerationProgress('تکمیل شد!');
      setTimeout(() => setGenerationProgress(''), 2000);
    } catch (err: any) {
      console.error('PNG Generation failed:', err);
      setErrorMessage(`خطا در تولید تصویر: ${err?.message || 'مشکل در رندر'}`);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // 3. SAFE BROWSER PRINT TRIGGER
  const handleBrowserPrint = () => {
    setErrorMessage(null);
    try {
      if (printSheetRef.current) {
        const htmlContent = printSheetRef.current.outerHTML;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
              <meta charset="utf-8" />
              <title>${plannerTitle || 'برنامه‌ریز هفتگی تایم‌باکسینگ'}</title>
              <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
              <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-RD-font-face.css" rel="stylesheet" type="text/css" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: ${paperSize.toUpperCase()} ${orientation};
                  margin: 4mm;
                }
                body {
                  font-family: 'Vazirmatn RD', 'Vazirmatn', system-ui, -apple-system, sans-serif;
                  font-feature-settings: 'ss01' 1, 'cv01' 1, 'kern' 1, 'liga' 1, 'tnum' 1;
                  margin: 0;
                  padding: 0;
                  background: #ffffff;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              </style>
            </head>
            <body>
              ${htmlContent}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 300);
                };
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
          return;
        }
      }
      window.print();
    } catch (e) {
      console.warn('Direct window.print() restricted in sandbox:', e);
      setErrorMessage('در این محیط پنجره چاپ مسدود شده است. لطفاً از دکمه «دانلود مستقیم PDF (کیفیت چاپی عالی)» استفاده کنید که فایل را مستقیماً دانلود می‌کند.');
    }
  };

  return (
    <div
      id="print-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  تنظیمات چاپ حرفه‌ای و خروجی باکیفیت PDF
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium">
                  رزولوشن بالا ۳۰۰ DPI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تولید دقیق و پرکننده کامل برگه در سایز‌های A4 و A3 افقی (Landscape) بدون اسکرول و بدون به‌هم‌ریختگی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Configuration Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Controls: Paper Size & Orientation */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Paper Size selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 px-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                سایز:
              </span>
              {(['a4', 'a3', 'letter'] as PaperSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPaperSize(size)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    paperSize === size
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {size.toUpperCase()}
                  {size === 'a4' && ' (استاندارد)'}
                  {size === 'a3' && ' (پوستر بزرگ)'}
                </button>
              ))}
            </div>

            {/* Orientation selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 px-1.5">جهت:</span>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="حالت افقی (پیش‌فرض مناسب جدول هفته)"
              >
                افقی (Landscape)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="حالت عمودی"
              >
                عمودی (Portrait)
              </button>
            </div>

            {/* Quality selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 px-1.5 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                کیفیت:
              </span>
              <button
                type="button"
                onClick={() => setQuality('ultra')}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  quality === 'ultra'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="رزولوشن فوق‌العاده بالا ۳۰۰ DPI مخصوص چاپ پرینتر"
              >
                فوق‌العاده (300 DPI)
              </button>
              <button
                type="button"
                onClick={() => setQuality('high')}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  quality === 'high'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                استاندارد (200 DPI)
              </button>
            </div>
          </div>

          {/* Right Controls: Content Toggles & Preview Zoom */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggles */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 shadow-2xs select-none">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
              />
              <span>راهنمای رنگ‌ها</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 shadow-2xs select-none">
              <input
                type="checkbox"
                checked={showNotesBox}
                onChange={(e) => setShowNotesBox(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
              />
              <span>کادر یادداشت و بازبینی</span>
            </label>

            {/* Preview Zoom Controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(z - 15, 40))}
                className="p-1 hover:bg-slate-100 rounded-md cursor-pointer"
                title="کوچک‌نمایی پیش‌نمایش"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-11 text-center font-mono font-semibold">
                {previewZoom}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(z + 15, 150))}
                className="p-1 hover:bg-slate-100 rounded-md cursor-pointer"
                title="بزرگ‌نمایی پیش‌نمایش"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer"
                title="تنظیم مجدد به ۱۰۰٪"
              >
                ریست
              </button>
            </div>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Printable Canvas Area (Visual Interactive Preview) */}
        <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 overflow-auto flex justify-center items-start">
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shrink-0 shadow-2xl rounded-sm overflow-hidden"
          >
            {/* The Actual Printable Sheet Component captured by html2canvas-pro / html-to-image */}
            <div
              ref={printSheetRef}
              style={{
                width: `${sheetDimensions.width}px`,
                height: `${sheetDimensions.height}px`,
                letterSpacing: '0px',
                fontFamily: "'Vazirmatn RD', 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                fontFeatureSettings: "'ss01' 1, 'cv01' 1, 'kern' 1, 'liga' 1, 'tnum' 1",
                backgroundColor: '#ffffff',
              }}
              className="bg-white text-slate-900 border border-slate-300 flex flex-col p-4 box-border overflow-hidden select-none"
              dir="rtl"
            >
              {/* Printable Sheet Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2 shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[62%]">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1
                        style={{ letterSpacing: '0px' }}
                        className="text-base sm:text-lg font-extrabold text-slate-950 leading-normal truncate"
                      >
                        {plannerTitle || 'برنامه‌ریز هفتگی تایم‌باکسینگ'}
                      </h1>
                      <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-900 text-white font-mono font-bold shrink-0">
                        ANTI-FRAGILE
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold shrink-0">
                        {paperSize.toUpperCase()} {orientation === 'landscape' ? 'افقی' : 'عمودی'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">
                        {weekRange || 'برنامه هفتگی کار عمیق، یادگیری، دانشگاه و ریکاوری'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Header: Psychological Tagline & Stats */}
                <div className="flex flex-col items-end gap-1 shrink-0 max-w-[38%]">
                  <div className="flex items-center gap-1 text-[11px] bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 rounded-lg">
                    <HeartHandshake className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="font-semibold truncate">
                      «۱ همیشه از ۰ بزرگ‌تره - در صورت تأخیر، بدون سرزنش شیفت بده!»
                    </span>
                  </div>

                  {showStats && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap justify-end">
                      <span>
                        کل زمان:{' '}
                        <strong className="text-slate-800 font-mono">
                          {toFaDigits(stats.totalHours)}س
                        </strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        تمرکز عمیق:{' '}
                        <strong className="text-sky-700 font-mono">
                          {toFaDigits(stats.deepWorkHours)}س
                        </strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        ریکاوری:{' '}
                        <strong className="text-emerald-700 font-mono">
                          {toFaDigits(stats.recoveryHours)}س
                        </strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        چاپ:{' '}
                        <strong className="text-slate-700 font-mono">
                          {new Date().toLocaleDateString('fa-IR')}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Days Header Row (Fixed 8 columns with Psychological Calming Tints) */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border border-slate-300 shrink-0 text-center select-none">
                <div className="py-1 px-1 border-l border-slate-300 text-[10px] font-black text-slate-700 bg-slate-100 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>خط زمان</span>
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day.id}
                    style={{ backgroundColor: day.printHeaderBg }}
                    className="py-1 px-1 border-l last:border-l-0 border-slate-300 flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: day.dotColor }}
                      />
                      <span className="text-xs font-black text-slate-900 leading-normal">
                        {day.nameFa}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        ({day.nameEn})
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 mt-0.5 leading-normal">
                      {day.mood}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Canvas & Time Slots & Blocks (Fills available space) */}
              <div
                style={{
                  height: `${timeSlots.length * slotHeightPx}px`,
                }}
                className="grid grid-cols-[70px_repeat(7,1fr)] border-x border-b border-slate-300 relative bg-white shrink-0 overflow-hidden"
              >
                {/* Time labels column without repetitive number clutter */}
                <div className="border-l border-slate-300 bg-slate-50/50 select-none">
                  {timeSlots.map((slot) => {
                    const hour = Math.floor(slot.minutes / 60);
                    const phase = getTimePhase(hour);

                    if (slot.isHour) {
                      return (
                        <div
                          key={slot.minutes}
                          style={{ height: `${slotHeightPx}px` }}
                          className="relative flex items-center justify-between px-1.5 font-mono border-b border-slate-300 bg-slate-100/60"
                        >
                          {/* Circadian strip */}
                          <div
                            className="absolute right-0 inset-y-0 w-[3px]"
                            style={{ backgroundColor: phase.color }}
                          />
                          <span
                            className="text-[7px] font-bold px-0.5 rounded leading-normal truncate max-w-[28px]"
                            style={{ color: phase.color }}
                          >
                            {hour === phase.startHour ? phase.nameFa.slice(0, 6) : ''}
                          </span>
                          <span className="font-bold text-[10px] text-slate-900">
                            {toFaDigits(slot.label)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slot.minutes}
                        style={{ height: `${slotHeightPx}px` }}
                        className="relative flex items-center justify-end pr-2 font-mono border-b border-slate-150 text-[9px] text-slate-400"
                      >
                        <div
                          className="absolute right-0 inset-y-0 w-[1.5px] opacity-40"
                          style={{ backgroundColor: phase.color }}
                        />
                        ۳۰:
                      </div>
                    );
                  })}
                </div>

                {/* 7 Days Columns with rendered blocks */}
                {DAYS.map((day) => {
                  const dayBlocks = blocks.filter((b) => b.day === day.id);

                  return (
                    <div
                      key={day.id}
                      className="relative border-l last:border-l-0 border-slate-300 bg-white"
                      style={{
                        height: `${timeSlots.length * slotHeightPx}px`,
                      }}
                    >
                      {/* Grid background lines */}
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.minutes}
                          style={{ height: `${slotHeightPx}px` }}
                          className={`border-b ${
                            slot.isHour ? 'border-slate-200' : 'border-slate-100'
                          }`}
                        />
                      ))}

                      {/* Rendered Time Blocks with crisp print styling */}
                      {dayBlocks.map((block) => {
                        const theme = CATEGORIES[block.category] || CATEGORIES.custom;
                        const startOffsetSlots =
                          (block.startMinutes - START_HOUR * 60) / SLOT_INTERVAL;
                        const durationSlots = block.durationMinutes / SLOT_INTERVAL;

                        const topPx = startOffsetSlots * slotHeightPx;
                        const heightPx = durationSlots * slotHeightPx;
                        const visualHeight = Math.max(heightPx - 2, 20);
                        const isCompact = visualHeight <= 34;

                        const startStr = minutesToTimeString(block.startMinutes);
                        const endStr = minutesToTimeString(block.startMinutes + block.durationMinutes);
                        const timeRange = `${toFaDigits(startStr)} - ${toFaDigits(endStr)}`;

                        return (
                          <div
                            key={block.id}
                            style={{
                              top: `${topPx}px`,
                              height: `${visualHeight}px`,
                              backgroundColor: theme.printBg,
                              borderColor: theme.printBorder,
                              color: theme.printText,
                            }}
                            className="absolute inset-x-0.5 rounded-sm border overflow-hidden shadow-2xs box-border"
                          >
                            {isCompact ? (
                              <div className="flex items-center justify-between h-full px-1 gap-1 overflow-hidden box-border">
                                <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                                  {block.completed ? (
                                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-2 h-2 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: theme.dotColor }}
                                    />
                                  )}
                                  <h4
                                    className={`text-[8.5px] font-bold truncate leading-none min-w-0 flex-1 ${
                                      block.completed ? 'line-through opacity-70' : ''
                                    }`}
                                    style={{ color: theme.printText, letterSpacing: '0px' }}
                                  >
                                    {block.title}
                                  </h4>
                                </div>
                                <span
                                  className="text-[7.5px] px-1 py-0.2 rounded-xs font-mono font-bold shrink-0 bg-white/90"
                                  style={{ color: theme.printText }}
                                >
                                  {timeRange}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col justify-between h-full p-1 overflow-hidden box-border">
                                {/* Block Header */}
                                <div className="flex items-center justify-between gap-1 w-full min-w-0 shrink-0">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    {block.completed ? (
                                      <span className="w-3 h-3 rounded-xs bg-emerald-700 text-white flex items-center justify-center shrink-0">
                                        <Check className="w-2 h-2 stroke-[3]" />
                                      </span>
                                    ) : (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: theme.dotColor }}
                                      />
                                    )}
                                    <h4
                                      className={`text-[9px] font-bold leading-snug truncate min-w-0 flex-1 ${
                                        block.completed ? 'line-through opacity-70' : ''
                                      }`}
                                      style={{ color: theme.printText, letterSpacing: '0px' }}
                                    >
                                      {block.title}
                                    </h4>
                                  </div>

                                  <span
                                    className="text-[7.5px] px-1 py-0.2 rounded-xs font-mono font-bold shrink-0 bg-white/90"
                                    style={{ color: theme.printText }}
                                  >
                                    {timeRange}
                                  </span>
                                </div>

                                {/* Subtitle if height permits */}
                                {visualHeight >= 48 && block.subtitle && (
                                  <div className="my-auto min-w-0 overflow-hidden">
                                    <p
                                      className="text-[8px] opacity-90 truncate leading-snug"
                                      style={{ letterSpacing: '0px' }}
                                    >
                                      {block.subtitle}
                                    </p>
                                  </div>
                                )}

                                {/* Bottom row: duration and category tag */}
                                {visualHeight >= 42 && (
                                  <div className="flex items-center justify-between text-[8px] opacity-80 pt-0.5 border-t border-black/10 mt-auto shrink-0">
                                    <span className="truncate">{theme.label}</span>
                                    <span className="font-mono font-bold shrink-0">
                                      {formatDurationFa(block.durationMinutes)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Printable Footer Section */}
              <div className="mt-2 pt-2 border-t border-slate-300 flex flex-col gap-1.5 shrink-0">
                {/* Category Legend Bar */}
                {showLegend && (
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[9px]">
                    <span className="font-bold text-slate-700 shrink-0">
                      راهنمای رنگ‌ها:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.values(CATEGORIES).map((cat) => (
                        <div key={cat.key} className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-xs border shrink-0"
                            style={{
                              backgroundColor: cat.printBg,
                              borderColor: cat.printBorder,
                            }}
                          />
                          <span className="text-slate-700 font-medium">
                            {cat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reflection & Notes Box for handwritten tracking */}
                {showNotesBox && (
                  <div className="grid grid-cols-3 gap-2 px-2 py-1.5 bg-slate-50/70 border border-dashed border-slate-300 rounded-md text-[9.5px]">
                    <div className="border-l border-slate-200 pl-2">
                      <span className="font-bold text-slate-800">
                        ۳ اولویت اصلی هفته (MITs):
                      </span>
                      <div className="mt-1 space-y-1 text-slate-400 font-mono">
                        <div>۱. ................................................................</div>
                        <div>۲. ................................................................</div>
                      </div>
                    </div>

                    <div className="border-l border-slate-200 pl-2">
                      <span className="font-bold text-slate-800">
                        یادداشت ضد شکنندگی و تطبیق:
                      </span>
                      <p className="text-[8.5px] text-slate-600 mt-1 leading-relaxed">
                        اگر بخشی از زمان به تعویق افتاد، به جای سرزنش خود، بلوک بعدی را با آرامش آغاز کنید. پیروزی در تداوم است!
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800">
                        ارزیابی پایان هفته:
                      </span>
                      <div className="mt-1 space-y-1 text-slate-400 font-mono">
                        <div>میزان پایبندی: [ ] عالی [ ] خوب [ ] نیاز به تنظیم</div>
                        <div>بزرگ‌ترین موفقیت: .......................................</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Watermark and Page Footer */}
                <div className="flex items-center justify-between text-[8px] text-slate-400 px-1 font-mono">
                  <span>
                    سیستم برنامه‌ریزی ضد شکنندگی تایم‌باکسینگ (Anti-Fragile Timeboxing)
                  </span>
                  <span>
                    اندازه برگه: {paperSize.toUpperCase()} {orientation === 'landscape' ? 'افقی' : 'عمودی'} | نسبت ۱۰۰٪ پرشده بدون اسکرول
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {generationProgress ? (
              <div className="flex items-center gap-2 text-indigo-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationProgress}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  برگه خروجی کاملاً در سایز {paperSize.toUpperCase()} {orientation === 'landscape' ? 'افقی' : 'عمودی'} تنظیم شده و بدون حاشیه اضافی یا اسکرول دانلود می‌شود.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Browser Print button */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              id="browser-print-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="ارسال مستقیم به پرینتر یا چاپگر متصل به سیستم"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>چاپ با مرورگر</span>
            </button>

            {/* High-res PNG button */}
            <button
              type="button"
              onClick={handleExportPNG}
              disabled={isGeneratingPng || isGeneratingPdf}
              id="export-png-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="دانلود تصویر با کیفیت ۳۰۰ DPI برای نمایش در تبلت یا ارسال در پیام‌رسان"
            >
              {isGeneratingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <Image className="w-4 h-4 text-slate-600" />
              )}
              <span>دانلود عکس (PNG)</span>
            </button>

            {/* HIGH-RES PDF DOWNLOAD (PRIMARY) */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGeneratingPdf || isGeneratingPng}
              id="download-pdf-btn"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              title="دانلود فایل استاندارد و باکیفیت PDF آماده برای چاپ"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>در حال ساخت PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>دانلود فایل PDF (کیفیت چاپی عالی)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
