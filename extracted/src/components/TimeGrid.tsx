import React, { useState, useRef, useMemo, useEffect } from 'react';
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
} from '../constants/plannerConfig';
import { DayKey, TimeBlock, BlockTemplate } from '../types';
import { PersianWeekDayInfo, getWeekDaysInfo } from '../utils/jalaliCalendar';
import { computeDayBlockLayout, PositionedBlock } from '../utils/calendarLayout';
import { CategoryIcon } from './CategoryIcon';
import { SwapBlocksModal } from './SwapBlocksModal';
import { categoryService } from '../services/categoryService';
import {
  Check,
  Clock,
  GripHorizontal,
  MoreHorizontal,
  Sparkles,
  Activity,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Monitor,
  Coffee,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Plus,
  ChevronUp,
  ChevronDown,
  Flame,
  AlertTriangle,
  Zap,
  FileJson,
  Moon,
  Sun,
  CheckSquare,
} from 'lucide-react';
import { findDayConflicts } from '../utils/conflictResolver';

interface TimeGridProps {
  blocks: TimeBlock[];
  onUpdateBlock: (block: TimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onSelectBlock: (block: TimeBlock) => void;
  onDropNewBlock: (day: DayKey, startMinutes: number, template: BlockTemplate) => void;
  onMoveBlock: (blockId: string, targetDay: DayKey, newStartMinutes: number) => void;
  onResizeBlock: (blockId: string, newDurationMinutes: number) => void;
  onSwapBlocks?: (
    blockA: TimeBlock,
    blockB: TimeBlock,
    mode: 'keep_durations' | 'fit_durations'
  ) => void;
  plannerTitle: string;
  weekRange: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenInsertBreak?: (block: TimeBlock) => void;
  currentDate?: Date;
  onOpenCalendar?: () => void;
  slotInterval?: number;
  onSlotClick?: (day: DayKey, startMinutes: number) => void;
  onOpenConflictResolver?: (day?: DayKey) => void;
  onOpenFocusMode?: () => void;
  activeBlockId?: string | null;
  currentDayKey?: DayKey;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warn') => void;
}

// Default pixel height per 30-minute slot in normal screen view
const DEFAULT_SLOT_HEIGHT_PX = 32;

export const TimeGrid: React.FC<TimeGridProps> = ({
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onSelectBlock,
  onDropNewBlock,
  onMoveBlock,
  onResizeBlock,
  onSwapBlocks,
  plannerTitle,
  weekRange,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenInsertBreak,
  currentDate,
  onOpenCalendar,
  slotInterval = 30,
  onSlotClick,
  onOpenConflictResolver,
  onOpenFocusMode,
  activeBlockId,
  currentDayKey,
  onShowToast,
}) => {
  // Single-day JSON copy handler
  const handleCopyDayJson = (dayId: DayKey) => {
    const dayObj = DAYS.find((d) => d.id === dayId);
    const dayBlocks = blocks
      .filter((b) => b.day === dayId)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    const totalMinutes = dayBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const dayPayload = {
      day: dayId,
      dayNameFa: dayObj?.nameFa || dayId,
      totalBlocks: dayBlocks.length,
      totalMinutes,
      totalHoursFormatted: (totalMinutes / 60).toFixed(1),
      exportedAt: new Date().toISOString(),
      blocks: dayBlocks,
    };
    const jsonStr = JSON.stringify(dayPayload, null, 2);
    navigator.clipboard
      .writeText(jsonStr)
      .then(() => {
        if (onShowToast) {
          onShowToast(`JSON برنامه روز ${dayObj?.nameFa || dayId} در کلیپ‌بورد کپی شد!`, 'success');
        }
      })
      .catch(() => {
        if (onShowToast) {
          onShowToast('خطا در کپی کلیپ‌بورد', 'warn');
        }
      });
  };

  // Compute full Persian week information (dates, today highlight, names)
  const weekDaysInfo = useMemo(() => {
    return getWeekDaysInfo(currentDate || new Date());
  }, [currentDate]);
  // Density Zoom (26px compact, 32px standard, 40px comfortable)
  const [slotHeight, setSlotHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('timegrid_slot_height');
      return saved ? Number(saved) : DEFAULT_SLOT_HEIGHT_PX;
    } catch {
      return DEFAULT_SLOT_HEIGHT_PX;
    }
  });

  // Toggle visibility of live current time crimson indicator line
  const [showLiveTime, setShowLiveTime] = useState<boolean>(true);

  // Executive Dark-Glass Canvas Theme (bg-slate-950, glowing dividers, neon laser)
  const [canvasTheme, setCanvasTheme] = useState<'dark-glass' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('timegrid_canvas_theme');
      return saved === 'dark-glass' ? 'dark-glass' : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleCanvasTheme = () => {
    setCanvasTheme((prev) => {
      const next = prev === 'light' ? 'dark-glass' : 'light';
      try {
        localStorage.setItem('timegrid_canvas_theme', next);
      } catch {}
      return next;
    });
  };

  // Swap Blocks state
  const [swapSourceBlock, setSwapSourceBlock] = useState<TimeBlock | null>(null);
  const [pendingSwapBlocks, setPendingSwapBlocks] = useState<{
    blockA: TimeBlock;
    blockB: TimeBlock;
  } | null>(null);

  // Listen to Escape to cancel swap selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSwapSourceBlock(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSetSlotHeight = (h: number) => {
    setSlotHeight(h);
    try {
      localStorage.setItem('timegrid_slot_height', String(h));
    } catch {}
  };

  const activeSlotInterval = slotInterval || 30;

  // Categories map dynamic state
  const [categoriesMap, setCategoriesMap] = useState(() => categoryService.getAll());
  useEffect(() => {
    return categoryService.subscribe((cats) => {
      setCategoriesMap({ ...cats });
    });
  }, []);

  // Calculate dynamic slot height to fit all hours (07:00 to 24:00) exactly to user's monitor height
  const handleFitToScreen = () => {
    const totalSlots = (END_HOUR - START_HOUR) * (60 / activeSlotInterval);
    const headerOffset = isFullscreen ? 110 : 260;
    const availableHeight = Math.max(380, window.innerHeight - headerOffset);
    const calculated = Math.max(16, Math.min(48, Math.floor(availableHeight / totalSlots)));
    handleSetSlotHeight(calculated);
  };

  // Drag-over tracking state
  const [dragOverInfo, setDragOverInfo] = useState<{
    day: DayKey;
    slotIndex: number;
  } | null>(null);

  // Resize tracking
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const resizeStartYRef = useRef<number>(0);
  const resizeStartDurationRef = useRef<number>(0);

  // Top Resize tracking (pulling block upwards or downwards from the top edge)
  const [resizingTopBlockId, setResizingTopBlockId] = useState<string | null>(null);
  const resizeTopStartYRef = useRef<number>(0);
  const resizeTopStartMinutesRef = useRef<number>(0);
  const resizeTopStartDurationRef = useRef<number>(0);

  // Quick Duration Popover tracking
  const [quickDurationBlockId, setQuickDurationBlockId] = useState<string | null>(null);

  // Pre-calculate per-day total planned time for headers
  const dayStats = useMemo(() => {
    const map: Record<string, { minutes: number; count: number }> = {};
    for (const d of DAYS) {
      map[d.id] = { minutes: 0, count: 0 };
    }
    for (const b of blocks) {
      if (map[b.day]) {
        map[b.day].minutes += b.durationMinutes;
        map[b.day].count += 1;
      }
    }
    return map;
  }, [blocks]);

  // Pre-calculate strictly non-overlapping, mathematically bounded card coordinates per day
  const positionedBlocksByDay = useMemo(() => {
    const map: Record<string, PositionedBlock[]> = {};
    for (const d of DAYS) {
      const dayBlocks = blocks.filter((b) => b.day === d.id);
      map[d.id] = computeDayBlockLayout(dayBlocks, {
        startHour: START_HOUR,
        endHour: END_HOUR,
        slotInterval: activeSlotInterval,
        slotHeight,
        minVisualHeight: 12,
        gapPx: 2,
      });
    }
    return map;
  }, [blocks, activeSlotInterval, slotHeight]);

  // Real-time tracker for live current time indicator line
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Time intervals generation (07:00 to 24:00, activeSlotInterval min each)
  const timeSlots: { label: string; minutes: number; isHour: boolean; isHalf: boolean }[] = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += activeSlotInterval) {
    timeSlots.push({
      label: minutesToTimeString(m),
      minutes: m,
      isHour: m % 60 === 0,
      isHalf: m % 60 === 30,
    });
  }

  // Handle Drag Over column
  const handleDragOver = (e: React.DragEvent, day: DayKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const slotIndex = Math.max(
      0,
      Math.min(timeSlots.length - 1, Math.floor(offsetY / slotHeight))
    );

    if (
      !dragOverInfo ||
      dragOverInfo.day !== day ||
      dragOverInfo.slotIndex !== slotIndex
    ) {
      setDragOverInfo({ day, slotIndex });
    }
  };

  const handleDragLeave = () => {
    setDragOverInfo(null);
  };

  // Handle Drop onto column
  const handleDrop = (e: React.DragEvent, day: DayKey) => {
    e.preventDefault();
    setDragOverInfo(null);

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const slotIndex = Math.max(
      0,
      Math.min(timeSlots.length - 1, Math.floor(offsetY / slotHeight))
    );
    const targetMinutes = START_HOUR * 60 + slotIndex * activeSlotInterval;

    // Check if moving an existing block
    const moveBlockId = e.dataTransfer.getData('text/move-block-id');
    if (moveBlockId) {
      const sourceBlock = blocks.find((b) => b.id === moveBlockId);
      // Check if dropping directly onto an existing block in target day
      const targetBlock = blocks.find(
        (b) =>
          b.day === day &&
          b.id !== moveBlockId &&
          targetMinutes >= b.startMinutes &&
          targetMinutes < b.startMinutes + b.durationMinutes
      );

      if (sourceBlock && targetBlock) {
        // Trigger smart Swap Modal with predictive analytics & warnings
        setPendingSwapBlocks({ blockA: sourceBlock, blockB: targetBlock });
        return;
      }

      onMoveBlock(moveBlockId, day, targetMinutes);
      return;
    }

    // Check if dropping a template from bank
    const templateData = e.dataTransfer.getData('text/template-data');
    if (templateData) {
      try {
        const template: BlockTemplate = JSON.parse(templateData);
        onDropNewBlock(day, targetMinutes, template);
      } catch (err) {
        console.error('Failed to parse dropped template', err);
      }
    }
  };

  // Drag existing block
  const handleBlockDragStart = (e: React.DragEvent, block: TimeBlock) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/move-block-id', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Nudge block up or down by deltaMinutes (e.g. -15 or +15)
  const handleNudgeBlock = (block: TimeBlock, deltaMinutes: number) => {
    const minStart = START_HOUR * 60;
    const maxStart = END_HOUR * 60 - block.durationMinutes;
    const newStart = Math.max(minStart, Math.min(maxStart, block.startMinutes + deltaMinutes));
    if (newStart !== block.startMinutes) {
      onMoveBlock(block.id, block.day, newStart);
    }
  };

  // Start Resizing block from top (pulling upward expands earlier, pulling downward starts later)
  const handleResizeTopPointerDown = (e: React.PointerEvent, block: TimeBlock) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTopBlockId(block.id);
    resizeTopStartYRef.current = e.clientY;
    resizeTopStartMinutesRef.current = block.startMinutes;
    resizeTopStartDurationRef.current = block.durationMinutes;

    const originalEndMinutes = block.startMinutes + block.durationMinutes;
    const step = 15; // 15-minute precision

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - resizeTopStartYRef.current;
      const deltaMinutesRaw = (deltaY / slotHeight) * activeSlotInterval;
      const snappedDelta = Math.round(deltaMinutesRaw / step) * step;

      const newStart = Math.max(
        START_HOUR * 60,
        Math.min(originalEndMinutes - 15, resizeTopStartMinutesRef.current + snappedDelta)
      );
      const newDuration = originalEndMinutes - newStart;

      if (newDuration >= 15) {
        onUpdateBlock({
          ...block,
          startMinutes: newStart,
          durationMinutes: newDuration,
        });
      }
    };

    const handlePointerUp = () => {
      setResizingTopBlockId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Start Resizing block from bottom
  const handleResizePointerDown = (e: React.PointerEvent, block: TimeBlock) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingBlockId(block.id);
    resizeStartYRef.current = e.clientY;
    resizeStartDurationRef.current = block.durationMinutes;

    const step = 15; // 15-minute precision

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - resizeStartYRef.current;
      const deltaMinutesRaw = (deltaY / slotHeight) * activeSlotInterval;
      const snappedDelta = Math.round(deltaMinutesRaw / step) * step;
      const newDuration = Math.max(
        15,
        Math.min(
          (END_HOUR * 60) - block.startMinutes,
          resizeStartDurationRef.current + snappedDelta
        )
      );
      onResizeBlock(block.id, newDuration);
    };

    const handlePointerUp = () => {
      setResizingBlockId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
      {/* Print-only Header */}
      <div className="print-only p-2 mb-2 border-b border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {plannerTitle || 'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)'}
            </h1>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {weekRange || 'برنامه زمانی هفتگی مهندسی نرم‌افزار، یادگیری عمیق و دانشگاه'}
            </p>
          </div>
          <div className="text-left text-[9px] text-slate-500">
            <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
            <div className="font-semibold text-teal-800">
              «۱ همیشه از ۰ بزرگ‌تره - در صورت تأخیر، بلوک‌ها شیفت داده می‌شوند»
            </div>
          </div>
        </div>
      </div>

      {/* Circadian Rhythm & Cognitive Energy Bar + Density Zoom */}
      <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] select-none no-print">
        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-extrabold text-slate-700">ریتم روان‌شناختی شبانه‌روز:</span>
          <span className="text-[9px] text-slate-400 font-normal hidden xl:inline">
            (هدایت ناخودآگاه مغز در ۵ فاز زیستی انرژی)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {TIME_PHASES.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-white border border-slate-200/90 shadow-2xs"
              title={`${p.nameFa}: ${p.description} (${toFaDigits(p.startHour)}:۰۰ تا ${toFaDigits(p.endHour)}:۰۰)`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-bold text-slate-700 text-[10px]">{p.nameFa}</span>
              <span className="text-[9px] text-slate-400 font-mono">
                {toFaDigits(p.startHour)}-{toFaDigits(p.endHour)}
              </span>
            </div>
          ))}

          {/* Density Zoom Selector & Screen Optimization */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs ms-1">
            <span className="text-[9px] text-slate-500 font-bold px-1 hidden sm:inline">
              مقیاس:
            </span>
            <button
              onClick={handleFitToScreen}
              className="px-2 py-0.5 rounded-md text-[9.5px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
              title="محاسبه خودکار ارتفاع هر بلوک جهت جاگیری کامل کل ساعات ۰۷ تا ۲۴ روی مانیتور شما بدون نیاز به اسکرول"
            >
              <Monitor className="w-3 h-3 text-indigo-600" />
              <span>تناسب مانیتور</span>
            </button>

            {[
              { label: 'فشرده', height: 26, title: 'مشاهده کل روز در یک نگاه (۲۶ پیکسل)' },
              { label: 'استاندارد', height: 32, title: 'تعادل بهینه و خوانایی بالا (۳۲ پیکسل)' },
              { label: 'جادار', height: 42, title: 'کارت‌های بزرگ‌تر و بیشترین وضوح (۴۲ پیکسل)' },
            ].map((mode) => (
              <button
                key={mode.height}
                onClick={() => handleSetSlotHeight(mode.height)}
                className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all cursor-pointer ${
                  slotHeight === mode.height
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
                title={mode.title}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Quick Visibility, Dark-Glass Theme & Fullscreen Controls */}
          <div className="flex items-center gap-1 ms-1">
            <button
              type="button"
              onClick={toggleCanvasTheme}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                canvasTheme === 'dark-glass'
                  ? 'bg-slate-900 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={
                canvasTheme === 'dark-glass'
                  ? 'تغییر به تم استاندارد روشن'
                  : 'فعال‌سازی تم دارک‌گلس با خطوط لیزری و تفکیک سایبرنتیک (Dark-Glass)'
              }
            >
              {canvasTheme === 'dark-glass' ? (
                <Moon className="w-3 h-3 text-cyan-300" />
              ) : (
                <Sun className="w-3 h-3 text-amber-500" />
              )}
              <span className="hidden sm:inline">
                {canvasTheme === 'dark-glass' ? 'دارک‌گلس' : 'تم روز'}
              </span>
            </button>

            <button
              onClick={() => setShowLiveTime(!showLiveTime)}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                showLiveTime
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title={showLiveTime ? 'مخفی‌سازی خط قرمز زمان جاری' : 'نمایش خط زمان جاری زنده'}
            >
              {showLiveTime ? <Eye className="w-3 h-3 text-rose-600" /> : <EyeOff className="w-3 h-3" />}
              <span className="hidden sm:inline">زمان زنده</span>
            </button>

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  isFullscreen
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-2xs'
                }`}
                title={isFullscreen ? 'خروج از حالت تمام‌صفحه (کلید Esc)' : 'مشاهده تمام‌صفحه متناسب با اندازه مانیتور (کلید F)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-white" />
                    <span>خروج تمام‌صفحه (Esc)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-indigo-600" />
                    <span>تمام‌صفحه مانیتور</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Swap Active Banner if swapSourceBlock is selected */}
      {swapSourceBlock && (
        <div className="bg-purple-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md text-xs font-bold sticky top-0 z-40 border-b border-purple-700">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-purple-300 animate-pulse shrink-0" />
            <span>
              حالت جابه‌جایی/تبادل دو بلوک فعال است: بلوک مبدا «{swapSourceBlock.title}» انتخاب شد.
              اکنون روی بلوک مقصد کلیک کنید تا تحلیل منطقی و پیش‌بینی‌ها نمایش داده شود.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSwapSourceBlock(null)}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            انصراف (Esc)
          </button>
        </div>
      )}

      {/* Unified Scroll Container with guaranteed column alignment between Header & Canvas */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-auto ${
          isFullscreen ? 'h-full' : 'max-h-[calc(100vh-140px)]'
        } print:overflow-visible print:max-h-none print-grid-container relative select-none transition-colors duration-200 ${
          canvasTheme === 'dark-glass' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        <div className="min-w-[768px]">
          {/* Days Header Row with Soothing Psychological Colors & Orderly Badges - Sticky inside scroll container */}
          <div
            className={`grid grid-cols-[76px_repeat(7,minmax(0,1fr))] sm:grid-cols-[88px_repeat(7,minmax(0,1fr))] border-b sticky top-0 z-30 shadow-2xs select-none transition-colors duration-200 ${
              canvasTheme === 'dark-glass'
                ? 'border-slate-800/90 bg-slate-900/95 backdrop-blur-md'
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* Time column header */}
            <div
              className={`w-[76px] sm:w-[88px] min-w-[76px] sm:min-w-[88px] max-w-[76px] sm:max-w-[88px] p-2 border-l flex flex-col items-center justify-between min-h-[66px] box-border shrink-0 transition-colors ${
                canvasTheme === 'dark-glass'
                  ? 'border-slate-800/90 bg-slate-900/90 text-slate-300'
                  : 'border-slate-200 bg-slate-50/80 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className={`w-3.5 h-3.5 ${canvasTheme === 'dark-glass' ? 'text-cyan-400' : 'text-indigo-600'}`} />
                <span
                  className={`text-[11px] font-black leading-normal ${
                    canvasTheme === 'dark-glass' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  خط زمان
                </span>
              </div>
              <span
                className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border shadow-2xs ${
                  canvasTheme === 'dark-glass'
                    ? 'bg-slate-800 border-slate-700 text-cyan-300'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                ۰۷ تا ۲۴
              </span>
            </div>

            {/* 7 Days Headers */}
            {DAYS.map((day, idx) => {
              const stats = dayStats[day.id] || { minutes: 0, count: 0 };
              const hours = (stats.minutes / 60).toFixed(stats.minutes % 60 === 0 ? 0 : 1);
              const dayInfo = weekDaysInfo[idx];
              const isToday = dayInfo?.isToday;

              return (
                <div
                  key={day.id}
                  className={`min-w-0 w-full overflow-hidden py-2 px-1 text-center border-l last:border-l-0 ${
                    canvasTheme === 'dark-glass'
                      ? isToday
                        ? 'bg-indigo-950/70 border-slate-800 ring-1 ring-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-200'
                      : isToday
                      ? 'bg-indigo-50/70 ring-2 ring-indigo-500/20 ring-inset border-slate-200'
                      : `${day.bgTint} border-slate-200`
                  } transition-colors flex flex-col items-center justify-between min-h-[72px] relative box-border`}
                >
                  {/* Day title, Shamsi Date, EN & Single-day JSON copy button */}
                  <div className="w-full">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: day.dotColor }}
                        />
                        <h3
                          className={`text-xs sm:text-sm font-extrabold leading-normal truncate ${
                            canvasTheme === 'dark-glass' ? 'text-slate-100' : day.textTint
                          }`}
                        >
                          {day.nameFa}
                        </h3>
                        {isToday && (
                          <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-bold leading-normal shadow-2xs animate-pulse shrink-0">
                            امروز
                          </span>
                        )}
                      </div>

                      {/* Single Day JSON Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyDayJson(day.id);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                          canvasTheme === 'dark-glass'
                            ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-white/80'
                        }`}
                        title={`کپی داده‌های JSON برنامه روز ${day.nameFa}`}
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Shamsi Day and Month badge */}
                    {dayInfo && (
                      <button
                        type="button"
                        onClick={onOpenCalendar}
                        className={`mt-0.5 text-[10.5px] font-bold px-2 py-0.5 rounded-md border shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer ${
                          canvasTheme === 'dark-glass'
                            ? 'text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-800 border-slate-700'
                            : 'text-slate-700 hover:text-indigo-700 bg-white/70 hover:bg-white border-slate-200/60'
                        }`}
                        title="مشاهده تقویم شمسی و انتخاب روز یا هفته"
                      >
                        <span>{dayInfo.dateStringFa}</span>
                      </button>
                    )}
                    {!dayInfo && (
                      <div className={`text-[10px] font-medium ${canvasTheme === 'dark-glass' ? 'text-slate-400' : 'text-slate-400'}`}>
                        {day.nameEn}
                      </div>
                    )}
                  </div>

                  {/* Psychological Mood Tag & Workload */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 mt-1 w-full px-0.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium leading-normal ${
                        canvasTheme === 'dark-glass'
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : `${day.badgeBg} ${day.badgeText} border border-black/5`
                      } truncate max-w-full`}
                      title={day.mood}
                    >
                      {day.mood}
                    </span>
                    {stats.minutes > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-sm font-mono font-bold leading-normal border ${
                          canvasTheme === 'dark-glass'
                            ? 'bg-slate-800/90 border-slate-700 text-cyan-300'
                            : 'bg-white/90 border-slate-200 text-slate-600'
                        }`}
                      >
                        {toFaDigits(hours)}س
                      </span>
                    )}
                  </div>

                  {/* Day Conflict Warning & 1-Click Fix Button */}
                  {onOpenConflictResolver && (() => {
                    const dayConflicts = findDayConflicts(day.id, blocks);
                    if (dayConflicts.length === 0) return null;
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConflictResolver(day.id);
                        }}
                        className="mt-1 text-[8.5px] px-1.5 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-black flex items-center gap-1 shadow-2xs animate-pulse cursor-pointer shrink-0"
                        title={`${toFaDigits(dayConflicts.length)} تداخل زمانی در این روز - کلیک برای حل هوشمند`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{toFaDigits(dayConflicts.length)} تداخل (رفع)</span>
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Grid Canvas & Time Slots Container */}
          <div className="relative">
            {/* Live Current Time Laser Marker (Real-time tracking) */}
            {showLiveTime && currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60 && (
              <div
                style={{
                  top: `${((currentMinutes - START_HOUR * 60) / activeSlotInterval) * slotHeight}px`,
                }}
                className="absolute inset-x-0 z-20 pointer-events-none flex items-center -translate-y-1/2 no-print"
              >
                {/* Time pill aligned to time column */}
                <div className="w-[76px] sm:w-[88px] min-w-[76px] sm:min-w-[88px] max-w-[76px] sm:max-w-[88px] flex items-center justify-end pr-1 shrink-0 box-border">
                  <span
                    dir="ltr"
                    className={`bg-rose-600 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full flex flex-row items-center gap-1 ring-2 ring-white select-none ${
                      canvasTheme === 'dark-glass' ? 'shadow-[0_0_12px_rgba(225,29,72,0.95)]' : 'shadow-xs'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {toFaDigits(minutesToTimeString(currentMinutes))}
                  </span>
                </div>
                {/* Crimson laser hairline spanning across all days with glowing aura */}
                <div
                  className={`flex-1 relative ${
                    canvasTheme === 'dark-glass'
                      ? 'h-[2px] bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.95)]'
                      : 'h-[1.5px] bg-rose-500/80 shadow-xs'
                  }`}
                >
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-rose-600 ring-2 ring-white ${
                      canvasTheme === 'dark-glass'
                        ? 'w-2.5 h-2.5 shadow-[0_0_10px_rgba(244,63,94,1)]'
                        : 'w-2 h-2'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Strict 8-Column Grid matching Header 1:1 */}
            <div className="grid grid-cols-[76px_repeat(7,minmax(0,1fr))] sm:grid-cols-[88px_repeat(7,minmax(0,1fr))] relative">
              {/* Calm, High-Clarity Time Column with Circadian Psychology & Architectural Precision */}
              <div
                className={`w-[76px] sm:w-[88px] min-w-[76px] sm:min-w-[88px] max-w-[76px] sm:max-w-[88px] border-l select-none relative box-border shrink-0 transition-colors ${
                  canvasTheme === 'dark-glass'
                    ? 'border-slate-800 bg-slate-900/60'
                    : 'border-slate-200 bg-slate-50/30'
                }`}
              >
            {timeSlots.map((slot) => {
              const hour = Math.floor(slot.minutes / 60);
              const phase = getTimePhase(hour);
              const isPhaseStart = slot.isHour && hour === phase.startHour;

              if (slot.isHour) {
                return (
                  <div
                    key={slot.minutes}
                    style={{ height: `${slotHeight}px` }}
                    className={`print-slot-row relative flex items-center justify-between px-1.5 sm:px-2 border-b group transition-colors ${
                      canvasTheme === 'dark-glass'
                        ? 'border-slate-800/90 hover:bg-slate-800/40 text-slate-200'
                        : 'border-slate-300 hover:bg-slate-100/50 text-slate-800'
                    }`}
                  >
                    {/* Circadian Phase Color Strip on right edge */}
                    <div
                      className="absolute right-0 inset-y-0 w-1 rounded-r-xs transition-opacity"
                      style={{ backgroundColor: phase.color }}
                      title={`${phase.nameFa}: ${phase.description}`}
                    />

                    {/* Phase micro-badge on phase start, or delicate indicator dot */}
                    <div className="flex items-center gap-1 min-w-0 pr-1">
                      {isPhaseStart ? (
                        <span
                          className="text-[8px] font-extrabold px-1 py-0.5 rounded-sm leading-normal truncate max-w-[42px] sm:max-w-[48px] shadow-2xs"
                          style={{
                            backgroundColor: `${phase.color}18`,
                            color: phase.color,
                          }}
                          title={phase.nameFa}
                        >
                          {phase.nameFa}
                        </span>
                      ) : (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: phase.color }}
                        />
                      )}
                    </div>

                    {/* Precision Swiss Typography for Hour - Strictly LTR */}
                    <div dir="ltr" className="flex flex-row items-baseline font-mono select-none">
                      <span
                        className={`text-[11px] sm:text-xs font-black ${
                          canvasTheme === 'dark-glass' ? 'text-slate-100' : 'text-slate-800'
                        }`}
                      >
                        {toFaDigits(hour < 10 ? `۰${hour}` : String(hour))}
                      </span>
                      <span
                        className={`text-[9px] font-semibold ${
                          canvasTheme === 'dark-glass' ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        :۰۰
                      </span>
                    </div>

                    {/* Precision alignment tick mark on left border joining the grid */}
                    <div
                      className={`absolute left-0 top-0 w-1.5 h-[1px] ${
                        canvasTheme === 'dark-glass' ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                );
              }

              // Quarter or Half-hour mark (:15, :30, :45) - calm, muted, unobtrusive
              const minPart = slot.minutes % 60;
              const minStr = minPart < 10 ? `۰${minPart}` : String(minPart);
              const isHalf = minPart === 30;

              return (
                <div
                  key={slot.minutes}
                  style={{ height: `${slotHeight}px` }}
                  className={`print-slot-row relative flex items-center justify-between px-1.5 sm:px-2 ${
                    isHalf
                      ? canvasTheme === 'dark-glass'
                        ? 'border-b border-dashed border-slate-800/80'
                        : 'border-b border-dashed border-slate-200'
                      : canvasTheme === 'dark-glass'
                      ? 'border-b border-dotted border-slate-900'
                      : 'border-b border-dotted border-slate-100'
                  } group ${canvasTheme === 'dark-glass' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/30'} transition-colors`}
                >
                  {/* Subtle circadian line continuation */}
                  <div
                    className="absolute right-0 inset-y-0 w-[2px] opacity-35 group-hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: phase.color }}
                  />

                  {/* Spacer / subtle tick */}
                  <div className="pr-1.5 flex items-center">
                    <span
                      className={`w-1 h-[1px] ${
                        canvasTheme === 'dark-glass'
                          ? 'bg-slate-800 group-hover:bg-slate-700'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      } transition-colors`}
                    />
                  </div>

                  {/* Dynamic Minute text - Strictly LTR */}
                  <span
                    dir="ltr"
                    className={`text-[9px] font-mono ${
                      canvasTheme === 'dark-glass'
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-slate-300 group-hover:text-slate-500'
                    } font-medium transition-colors select-none inline-block`}
                  >
                    :{toFaDigits(minStr)}
                  </span>

                  {/* Alignment tick */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[1px] ${
                      canvasTheme === 'dark-glass' ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* 7 Days Columns */}
          {DAYS.map((day) => {
            const dayBlocks = blocks.filter((b) => b.day === day.id);
            const isColumnHovered = dragOverInfo?.day === day.id;

            return (
              <div
                key={day.id}
                onDragOver={(e) => handleDragOver(e, day.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day.id)}
                className={`min-w-0 w-full overflow-hidden relative border-l last:border-l-0 box-border transition-colors ${
                  canvasTheme === 'dark-glass'
                    ? 'border-slate-800/80 bg-slate-950'
                    : 'border-slate-200 bg-white'
                }`}
                style={{
                  height: `${timeSlots.length * slotHeight}px`,
                }}
              >
                {/* Background Grid Lines with Click to Add */}
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot.minutes}
                    onClick={() => {
                      if (onSlotClick) {
                        onSlotClick(day.id, slot.minutes);
                      }
                    }}
                    style={{ height: `${slotHeight}px` }}
                    className={`group/slot relative print-slot-row transition-colors cursor-pointer ${
                      slot.isHour
                        ? canvasTheme === 'dark-glass'
                          ? 'border-b border-slate-800'
                          : 'border-b border-slate-300'
                        : slot.isHalf
                        ? canvasTheme === 'dark-glass'
                          ? 'border-b border-dashed border-slate-900'
                          : 'border-b border-dashed border-slate-200'
                        : canvasTheme === 'dark-glass'
                        ? 'border-b border-dotted border-slate-900/50'
                        : 'border-b border-dotted border-slate-100'
                    } ${
                      isColumnHovered && dragOverInfo?.slotIndex === idx
                        ? canvasTheme === 'dark-glass'
                          ? 'bg-indigo-950/60 ring-1 ring-cyan-400/60'
                          : 'bg-indigo-50/80 ring-1 ring-indigo-400'
                        : canvasTheme === 'dark-glass'
                        ? 'hover:bg-indigo-950/25'
                        : 'hover:bg-indigo-50/35'
                    }`}
                    title={`کلیک برای افزودن سریع در ساعت ${toFaDigits(minutesToTimeString(slot.minutes))}`}
                  >
                    <span
                      className={`hidden group-hover/slot:flex items-center gap-1.5 absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-xs z-10 pointer-events-none border transition-all ${
                        canvasTheme === 'dark-glass'
                          ? 'text-cyan-300 bg-slate-900/95 border-slate-700 shadow-slate-950'
                          : 'text-indigo-700 bg-white/95 border-indigo-200 shadow-indigo-100'
                      }`}
                    >
                      <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      <span>نوشتن در {toFaDigits(minutesToTimeString(slot.minutes))}</span>
                    </span>
                  </div>
                ))}

                {/* Rendered Time Blocks - Master Multi-Tier Adaptive Architecture with Zero Overlap */}
                {(positionedBlocksByDay[day.id] || []).map((item) => {
                  const { block, topPx, visualHeight, colIndex, totalCols } = item;
                  const theme = categoriesMap[block.category] || CATEGORIES[block.category] || CATEGORIES.custom;

                  // 4 Precise Visual Density Tiers:
                  const isMicro = visualHeight <= 26;
                  const isSmall = visualHeight > 26 && visualHeight < 88;
                  const isMedium = visualHeight >= 88 && visualHeight < 140;
                  const isLarge = visualHeight >= 140;

                  // Formatted Persian Time Strings for crystalline clarity
                  const startStr = toFaDigits(minutesToTimeString(block.startMinutes));
                  const endStr = toFaDigits(minutesToTimeString(block.startMinutes + block.durationMinutes));
                  const timeRangeShort = `${startStr} - ${endStr}`;
                  const timeRangeFull = `${startStr} تا ${endStr}`;

                  // Dynamic multi-column layout for collision handling
                  const isMultiCol = totalCols > 1;
                  const isCurrentActive = Boolean(
                    activeBlockId &&
                      block.id === activeBlockId &&
                      (!currentDayKey || block.day === currentDayKey)
                  );
                  const horizontalStyle = isMultiCol
                    ? {
                        right: `calc(${(colIndex * 100) / totalCols}% + 2px)`,
                        width: `calc(${100 / totalCols}% - 4px)`,
                        left: 'auto',
                        zIndex: 10 + colIndex,
                      }
                    : {
                        right: '3px',
                        left: '3px',
                        width: 'calc(100% - 6px)',
                        zIndex: 10,
                      };

                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleBlockDragStart(e, block)}
                      onClick={() => {
                        if (swapSourceBlock) {
                          if (swapSourceBlock.id === block.id) {
                            setSwapSourceBlock(null);
                          } else {
                            setPendingSwapBlocks({
                              blockA: swapSourceBlock,
                              blockB: block,
                            });
                            setSwapSourceBlock(null);
                          }
                        } else {
                          onSelectBlock(block);
                        }
                      }}
                      style={{
                        top: `${topPx}px`,
                        height: `${visualHeight}px`,
                        ...horizontalStyle,
                      }}
                      className={`group absolute rounded-xl border overflow-hidden shadow-2xs transition-shadow duration-150 cursor-pointer select-none hover:shadow-md hover:ring-2 hover:ring-indigo-400/60 hover:z-30 print:shadow-none box-border ${
                        theme.bgClass
                      } ${theme.borderClass} ${
                        block.completed ? 'opacity-75 saturate-50' : ''
                      } ${
                        isCurrentActive
                          ? 'ring-3 ring-amber-500 ring-offset-2 z-25 shadow-lg shadow-amber-500/30'
                          : ''
                      } ${
                        swapSourceBlock?.id === block.id
                          ? 'ring-3 ring-purple-600 ring-offset-2 z-30 animate-pulse bg-purple-50'
                          : swapSourceBlock
                          ? 'hover:ring-3 hover:ring-purple-400 cursor-pointer'
                          : ''
                      }`}
                      title={`${block.title} (${timeRangeFull})${
                        block.subtitle ? ' • ' + block.subtitle : ''
                      }${block.note ? '\nیادداشت: ' + block.note : ''} (کلیک برای ویرایش | درگ برای جابجایی)`}
                    >
                      {/* Floating Quick Action Pill for Edit, Quick Duration & Break Insertion on Hover */}
                      {!isMicro && (
                        <div className="no-print absolute top-1 left-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-slate-200/90 shadow-xs z-20 transition-opacity">
                          {/* Quick Focus Button */}
                          {onOpenFocusMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenFocusMode();
                              }}
                              className="p-1 rounded-md hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                              title="ورود به حالت فوکوس عمیق"
                            >
                              <Flame className="w-3 h-3 stroke-[2.4]" />
                            </button>
                          )}

                          {/* Quick Nudge Up & Down Buttons (15-min precision shift) */}
                          <div className="flex items-center border-e border-slate-200 pe-0.5 me-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNudgeBlock(block, -15);
                              }}
                              className="p-0.5 rounded hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                              title="جابه‌جایی ۱۵ دقیقه به بالا (زودتر)"
                            >
                              <ChevronUp className="w-3 h-3 stroke-[2.6]" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNudgeBlock(block, 15);
                              }}
                              className="p-0.5 rounded hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                              title="جابه‌جایی ۱۵ دقیقه به پایین (دیرتر)"
                            >
                              <ChevronDown className="w-3 h-3 stroke-[2.6]" />
                            </button>
                          </div>

                          {/* Quick Swap Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSwapSourceBlock(swapSourceBlock?.id === block.id ? null : block);
                            }}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              swapSourceBlock?.id === block.id
                                ? 'bg-purple-600 text-white'
                                : 'hover:bg-purple-100 text-purple-700'
                            }`}
                            title="جابه‌جایی / تبادل هوشمند با بلوک دیگر"
                          >
                            <ArrowLeftRight className="w-3 h-3 stroke-[2.3]" />
                          </button>

                          {/* Quick Duration Preset Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickDurationBlockId(quickDurationBlockId === block.id ? null : block.id);
                            }}
                            className="p-1 rounded-md hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="تغییر سریع مدت زمان (مثلاً تبدیل فوری ۴ ساعت به ۳ ساعت با یک کلیک)"
                          >
                            <Clock className="w-3 h-3 stroke-[2.4]" />
                          </button>

                          {onOpenInsertBreak && block.durationMinutes >= 30 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInsertBreak(block);
                              }}
                              className="p-1 rounded-md hover:bg-orange-100 text-orange-700 transition-colors cursor-pointer"
                              title="درج هوشمند استراحت در این بلوک (تقسیم ۱۵ یا ۳۰ دقیقه)"
                            >
                              <Coffee className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBlock(block);
                            }}
                            className="p-1 rounded-md hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            title="ویرایش مشخصات این بلوک"
                          >
                            <Pencil className="w-3 h-3 stroke-[2.2]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`آیا از حذف «${block.title}» اطمینان دارید؟`)) {
                                onDeleteBlock(block.id);
                              }
                            }}
                            className="p-1 rounded-md hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="حذف این بلوک"
                          >
                            <Trash2 className="w-3 h-3 stroke-[2.2]" />
                          </button>
                        </div>
                      )}

                      {/* Quick Duration Popover (1-click duration adjustment e.g. 4h -> 3h) */}
                      {quickDurationBlockId === block.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="no-print absolute top-8 left-1 z-30 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-slate-300 p-2.5 w-52 space-y-1.5 text-right select-none animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[10px] font-bold text-slate-700">تغییر سریع مدت زمان:</span>
                            <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                              {formatDurationFa(block.durationMinutes)}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {[30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 360].map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => {
                                  onResizeBlock(block.id, dur);
                                  setQuickDurationBlockId(null);
                                }}
                                className={`text-[10px] font-mono font-bold py-1 rounded border transition-all ${
                                  block.durationMinutes === dur
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {dur >= 60 ? `${toFaDigits(dur / 60)}س` : `${toFaDigits(dur)}د`}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                onResizeBlock(block.id, Math.max(15, block.durationMinutes - 30));
                              }}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            >
                              ۳۰د -
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDurationBlockId(null)}
                              className="text-slate-400 hover:text-slate-600 text-[10px]"
                            >
                              بستن
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onResizeBlock(block.id, Math.min(600, block.durationMinutes + 30));
                              }}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            >
                              ۳۰د +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TIER 1: Micro / Ultra-Compact (15m to 25m, visualHeight <= 26px) */}
                      {/* Single Horizontal Flex Line: Checkbox (if height allows) + Dot + Truncated Title + Time Range Pill. Zero vertical overflow! */}
                      {isMicro && (
                        <div className="flex items-center justify-between h-full w-full min-w-0 px-1.5 gap-1 overflow-hidden box-border leading-none">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                            {visualHeight >= 18 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateBlock({
                                    ...block,
                                    completed: !block.completed,
                                  });
                                }}
                                className={`w-3.5 h-3.5 rounded-xs shrink-0 flex items-center justify-center border transition-colors ${
                                  block.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-slate-500 bg-white/90'
                                }`}
                                title={block.completed ? 'علامت‌گذاری به عنوان انجام‌نشده' : 'علامت‌گذاری به عنوان انجام‌شده'}
                              >
                                {block.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>
                            )}

                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: theme.dotColor }}
                            />

                            <span
                              className={`text-[9.5px] sm:text-[10px] font-bold truncate leading-none min-w-0 flex-1 print-block-text ${
                                theme.textClass
                              } ${block.completed ? 'line-through text-slate-400' : ''}`}
                            >
                              {block.title}
                            </span>
                          </div>

                          <span
                            dir="ltr"
                            className={`text-[8px] sm:text-[8.5px] font-mono font-bold shrink-0 px-1 py-0.2 rounded-xs shadow-2xs leading-none ${theme.badgeClass}`}
                          >
                            {timeRangeShort}
                          </span>
                        </div>
                      )}

                      {/* TIER 2: Small Compact (35m to 60m, 36px < visualHeight < 72px) */}
                      {/* Two clean non-colliding rows: Row 1 has Title and Time Range, Row 2 has Subtitle/Category and Duration */}
                      {isSmall && (
                        <div className="flex flex-col justify-between h-full w-full min-w-0 p-1.5 overflow-hidden box-border">
                          <div className="flex items-center justify-between gap-1 w-full min-w-0 shrink-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateBlock({
                                    ...block,
                                    completed: !block.completed,
                                  });
                                }}
                                className={`w-3.5 h-3.5 rounded-xs shrink-0 flex items-center justify-center border transition-colors ${
                                  block.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-slate-500 bg-white/90'
                                }`}
                                title={block.completed ? 'انجام شد' : 'علامت‌گذاری'}
                              >
                                {block.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>

                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: theme.dotColor }}
                              />

                              <h4
                                className={`text-[11px] sm:text-[11.5px] font-black truncate leading-tight min-w-0 flex-1 print-block-text ${
                                  theme.textClass
                                } ${block.completed ? 'line-through text-slate-400' : ''}`}
                              >
                                {block.title}
                              </h4>

                              {isCurrentActive && (
                                <span className="px-1 py-0.2 rounded-xs bg-amber-500 text-slate-950 text-[8px] font-black shrink-0 flex items-center gap-0.5 animate-pulse">
                                  <Flame className="w-2 h-2 fill-current" />
                                  <span>فعال</span>
                                </span>
                              )}

                              {isMultiCol && onOpenConflictResolver && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenConflictResolver(block.day);
                                  }}
                                  className="px-1 py-0.2 rounded-xs bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-black shrink-0 flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                  title="تداخل زمانی با کارت دیگر - کلیک برای رفع خودکار"
                                >
                                  <AlertTriangle className="w-2 h-2" />
                                  <span>تداخل</span>
                                </button>
                              )}
                            </div>

                            <span
                              dir="ltr"
                              className={`text-[8.5px] sm:text-[9px] font-mono font-bold shrink-0 px-1.5 py-0.2 rounded-xs shadow-2xs leading-tight ${theme.badgeClass}`}
                            >
                              {timeRangeShort}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 border-t border-black/5 min-w-0 shrink-0">
                            <span className="truncate min-w-0 font-medium text-slate-600">
                              {block.subtitle || theme.label.split('(')[0]}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ms-1">
                              {block.checklist && block.checklist.length > 0 && (
                                <span
                                  className="text-[8px] font-mono font-bold px-1 py-0.2 rounded-xs flex items-center gap-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  title={`چک‌لیست: ${toFaDigits(block.checklist.filter((c) => c.completed).length)} از ${toFaDigits(block.checklist.length)}`}
                                >
                                  <CheckSquare className="w-2 h-2" />
                                  <span>{toFaDigits(block.checklist.filter((c) => c.completed).length)}/{toFaDigits(block.checklist.length)}</span>
                                </span>
                              )}
                              <span className="font-mono text-slate-600 font-bold shrink-0">
                                {formatDurationFa(block.durationMinutes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TIER 3: Medium (75m to 120m, 72px <= visualHeight < 135px) */}
                      {/* Master non-colliding layout: Header with Category & Time Range, Guaranteed Center Body, Grounded Footer */}
                      {isMedium && (
                        <div className="flex flex-col justify-between h-full w-full min-w-0 p-1.5 sm:p-2 overflow-hidden box-border">
                          {/* Header Row */}
                          <div className="flex items-center justify-between gap-1 w-full min-w-0 shrink-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateBlock({
                                    ...block,
                                    completed: !block.completed,
                                  });
                                }}
                                className={`w-3.5 h-3.5 rounded-xs shrink-0 flex items-center justify-center border transition-colors ${
                                  block.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-slate-500 bg-white/90'
                                }`}
                                title={block.completed ? 'انجام شد' : 'علامت‌گذاری'}
                              >
                                {block.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>

                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: theme.dotColor }}
                              />

                              <span className="text-[9.5px] font-bold text-slate-700 truncate">
                                {theme.label.split('(')[0]}
                              </span>
                            </div>

                            {/* Crisp Persian Time Range Badge */}
                            <span
                              dir="ltr"
                              className={`text-[9px] sm:text-[9.5px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-md shadow-2xs leading-tight ${theme.badgeClass}`}
                            >
                              {timeRangeShort}
                            </span>
                          </div>

                          {/* Body - Truncated and perfectly centered so it NEVER overflows or forces the footer */}
                          <div className="my-auto min-w-0 py-0.5 flex flex-col justify-center gap-0.5 overflow-hidden">
                            <div className="flex items-center gap-1 min-w-0">
                              <h4
                                className={`text-[11.5px] sm:text-xs font-black leading-snug truncate print-block-text ${
                                  theme.textClass
                                } ${block.completed ? 'line-through text-slate-400' : ''}`}
                              >
                                {block.title}
                              </h4>
                              {isCurrentActive && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[8.5px] font-black shrink-0 flex items-center gap-1 shadow-xs animate-pulse">
                                  <Flame className="w-2.5 h-2.5 fill-current" />
                                  <span>هم‌اکنون فعال</span>
                                </span>
                              )}
                              {isMultiCol && onOpenConflictResolver && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenConflictResolver(block.day);
                                  }}
                                  className="px-1.5 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-black shrink-0 flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                  title="تداخل زمانی با کارت دیگر - کلیک برای رفع خودکار"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>تداخل</span>
                                </button>
                              )}
                            </div>
                            {block.subtitle && (
                              <p className="text-[10px] text-slate-600 truncate font-medium">
                                {block.subtitle}
                              </p>
                            )}
                            {block.note && visualHeight >= 105 && (
                              <p className="text-[9px] text-slate-500 truncate italic bg-white/70 px-1 py-0.2 rounded border border-black/5 mt-0.5">
                                {block.note}
                              </p>
                            )}
                          </div>

                          {/* Grounded Footer Row - Locked with shrink-0 */}
                          <div className="flex items-center justify-between text-[9px] text-slate-600 pt-1 border-t border-black/5 shrink-0">
                            <div className="flex items-center gap-1 truncate min-w-0">
                              <CategoryIcon
                                category={block.category}
                                className="w-3 h-3 text-slate-600 shrink-0"
                              />
                              <span className="truncate">{theme.label}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ms-1">
                              {block.checklist && block.checklist.length > 0 && (
                                <span
                                  className="text-[8px] font-mono font-bold px-1 py-0.2 rounded-xs flex items-center gap-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  title={`چک‌لیست: ${toFaDigits(block.checklist.filter((c) => c.completed).length)} از ${toFaDigits(block.checklist.length)} انجام شده`}
                                >
                                  <CheckSquare className="w-2 h-2" />
                                  <span>{toFaDigits(block.checklist.filter((c) => c.completed).length)}/{toFaDigits(block.checklist.length)}</span>
                                </span>
                              )}
                              <span className="font-mono text-slate-700 font-bold px-1.5 py-0.2 rounded bg-white/80 border border-black/5 shadow-2xs">
                                {formatDurationFa(block.durationMinutes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TIER 4: Large / Marathon Session (135px+, 2.5 hours to 5 hours) */}
                      {/* Structured sectional briefing card with Time Range, Highlight Box, Multi-line Note and Grounded Footer */}
                      {isLarge && (
                        <div className="flex flex-col h-full w-full min-w-0 p-2 sm:p-2.5 gap-1.5 overflow-hidden box-border">
                          {/* Header Row */}
                          <div className="flex items-center justify-between gap-1 w-full shrink-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateBlock({
                                    ...block,
                                    completed: !block.completed,
                                  });
                                }}
                                className={`w-4 h-4 rounded-xs shrink-0 flex items-center justify-center border transition-colors ${
                                  block.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-slate-500 bg-white/90 shadow-2xs'
                                }`}
                                title={block.completed ? 'انجام شد' : 'علامت‌گذاری'}
                              >
                                {block.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>

                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: theme.dotColor }}
                              />

                              <span className="text-[10px] font-bold text-slate-700 bg-white/70 px-1.5 py-0.5 rounded border border-black/5 truncate">
                                {theme.label.split('(')[0]}
                              </span>
                            </div>

                            {/* Time Range Badge (Start - End) */}
                            <span
                              className={`text-[9.5px] font-mono font-bold shrink-0 px-2 py-0.5 rounded-md shadow-2xs ${theme.badgeClass}`}
                            >
                              {timeRangeFull}
                            </span>
                          </div>

                          {/* Hero Title with Active & Conflict Badges */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <h4
                              className={`text-xs sm:text-[13px] font-black leading-snug break-words print-block-text ${
                                theme.textClass
                              } ${block.completed ? 'line-through text-slate-400' : ''}`}
                            >
                              {block.title}
                            </h4>
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black shrink-0 flex items-center gap-1 shadow-xs animate-pulse">
                                <Flame className="w-2.5 h-2.5 fill-current" />
                                <span>هم‌اکنون فعال</span>
                              </span>
                            )}
                            {isMultiCol && onOpenConflictResolver && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenConflictResolver(block.day);
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[8.5px] font-black shrink-0 flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                title="تداخل زمانی با کارت دیگر - کلیک برای رفع خودکار"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>تداخل زمانی</span>
                              </button>
                            )}
                          </div>

                          {/* Focus Subtitle Box */}
                          {block.subtitle && (
                            <div className="bg-white/80 rounded-md px-2 py-1 border border-black/5 text-[10px] sm:text-[10.5px] font-medium text-slate-700 leading-normal shrink-0">
                              <span className="font-bold text-slate-900">تمرکز: </span>
                              {block.subtitle}
                            </div>
                          )}

                          {/* Interactive Micro Checklist in Tier 4 */}
                          {block.checklist && block.checklist.length > 0 && (
                            <div className="bg-white/85 rounded-md p-1.5 border border-black/5 text-[9.5px] space-y-1 shrink-0">
                              <div className="flex items-center justify-between text-slate-700 font-bold border-b border-black/5 pb-0.5">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3 text-indigo-600" />
                                  <span>اقدامات فرعی ({toFaDigits(block.checklist.length)}):</span>
                                </span>
                                <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 px-1 rounded font-bold">
                                  {toFaDigits(block.checklist.filter((c) => c.completed).length)}/{toFaDigits(block.checklist.length)}
                                </span>
                              </div>
                              <div className="space-y-0.5 max-h-16 overflow-y-auto">
                                {block.checklist.slice(0, 3).map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updatedList = (block.checklist || []).map((ci) =>
                                        ci.id === item.id ? { ...ci, completed: !ci.completed } : ci
                                      );
                                      onUpdateBlock({ ...block, checklist: updatedList });
                                    }}
                                    className="flex items-center gap-1.5 cursor-pointer hover:bg-black/5 px-1 py-0.5 rounded transition-colors"
                                  >
                                    <div
                                      className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                                        item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {item.completed && <Check className="w-2 h-2 stroke-[3]" />}
                                    </div>
                                    <span className={`truncate text-[9px] ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                                {block.checklist.length > 3 && (
                                  <div className="text-[8px] text-slate-400 font-medium px-1">
                                    + {toFaDigits(block.checklist.length - 3)} اقدام دیگر...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Detailed Note Container */}
                          {block.note && (
                            <div className="bg-white/60 rounded-md p-2 border border-black/5 text-[9.5px] text-slate-600 leading-relaxed overflow-hidden line-clamp-4 flex-1">
                              <span className="font-semibold text-slate-700 block mb-0.5">یادداشت و جزئیات:</span>
                              <p className="whitespace-pre-line">{block.note}</p>
                            </div>
                          )}

                          {/* Grounded Footer Row */}
                          <div className="mt-auto pt-1.5 border-t border-black/10 flex items-center justify-between text-[9.5px] text-slate-600 shrink-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <CategoryIcon category={block.category} className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                              <span className="font-bold truncate">{theme.label}</span>
                            </div>
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-black/5 shadow-2xs">
                              {formatDurationFa(block.durationMinutes)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Top Resize Handle (pull upwards to make earlier/longer, or downwards to make later/shorter) */}
                      {visualHeight >= 24 && (
                        <div
                          onPointerDown={(e) => handleResizeTopPointerDown(e, block)}
                          className="no-print absolute top-0 inset-x-0 h-2.5 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/15 transition-opacity z-20"
                          title="برای گسترش به بالا یا تغییر ساعت شروع بکشید"
                        >
                          <GripHorizontal className="w-3 h-2 text-slate-500" />
                        </div>
                      )}

                      {/* Live Resizing Tooltip Display */}
                      {(resizingBlockId === block.id || resizingTopBlockId === block.id) && (
                        <div className="no-print absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none flex items-center gap-1.5 ring-2 ring-indigo-400">
                          <span>{toFaDigits(minutesToTimeString(block.startMinutes))}</span>
                          <span>تا</span>
                          <span>{toFaDigits(minutesToTimeString(block.startMinutes + block.durationMinutes))}</span>
                          <span className="text-indigo-300">({formatDurationFa(block.durationMinutes)})</span>
                        </div>
                      )}

                      {/* Bottom Resize Handle */}
                      {visualHeight >= 28 && (
                        <div
                          onPointerDown={(e) => handleResizePointerDown(e, block)}
                          className="no-print absolute bottom-0 inset-x-0 h-2.5 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity z-10"
                          title="برای تغییر مدت زمان بکشید"
                        >
                          <GripHorizontal className="w-3 h-2 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Blocks Modal with Predictive Logic & Circadian Warnings */}
      {pendingSwapBlocks && (
        <SwapBlocksModal
          isOpen={true}
          onClose={() => setPendingSwapBlocks(null)}
          blockA={pendingSwapBlocks.blockA}
          blockB={pendingSwapBlocks.blockB}
          allBlocks={blocks}
          onConfirmSwap={({ blockAId, blockBId, mode }) => {
            const bA = blocks.find((b) => b.id === blockAId);
            const bB = blocks.find((b) => b.id === blockBId);
            if (bA && bB && onSwapBlocks) {
              onSwapBlocks(bA, bB, mode);
            }
            setPendingSwapBlocks(null);
          }}
        />
      )}
    </div>
  );
};
