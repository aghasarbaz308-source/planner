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
  GraduationCap,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Save,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { TimeBlock, DayKey, DayInfo, DailyReportCard, DailyAuditItem } from '../types';
import { PlannerStorageService } from '../services/plannerStorage';
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
  const [activeTab, setActiveTab] = useState<'audit' | 'minimal' | 'text' | 'image'>('audit');
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedOverview, setIsCopiedOverview] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [imageScale, setImageScale] = useState<number>(2.5); // 2.5x Ultra HD

  // Interactive Audit & Report Card States
  const [auditStep, setAuditStep] = useState<number>(0);
  const [auditViewMode, setAuditViewMode] = useState<'quick' | 'step'>('quick');
  const [isAuditSubmitted, setIsAuditSubmitted] = useState<boolean>(false);
  const [isCopiedAuditText, setIsCopiedAuditText] = useState(false);
  const [auditResponses, setAuditResponses] = useState<
    Record<
      string,
      {
        status: 'full' | 'partial_75' | 'half_50' | 'none';
        actualMinutes: number;
        focus: 'deep' | 'average' | 'distracted';
        note: string;
      }
    >
  >({});

  const cardRef = useRef<HTMLDivElement>(null);
  const minimalCardRef = useRef<HTMLDivElement>(null);
  const auditCardRef = useRef<HTMLDivElement>(null);

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

  // Productive Auditable Blocks (Filter out breaks, sleep, lunch, dinner, gaming)
  const auditableBlocks = useMemo(() => {
    return dayBlocks.filter((b) => {
      if (b.category === 'recovery' || b.category === 'gaming') return false;
      const t = b.title.toLowerCase();
      if (
        t.includes('استراحت') ||
        t.includes('خواب') ||
        t.includes('ناهار') ||
        t.includes('شام') ||
        t.includes('فیلم') ||
        t.includes('صبحانه')
      ) {
        return false;
      }
      return true;
    });
  }, [dayBlocks]);

  // Report Card Calculation
  const reportCard = useMemo<DailyReportCard | null>(() => {
    if (auditableBlocks.length === 0) return null;

    let totalPlannedMins = 0;
    let totalActualMins = 0;
    let totalScoreWeight = 0;
    let earnedScoreWeight = 0;
    let deepWorkHours = 0;

    const items: DailyAuditItem[] = auditableBlocks.map((b) => {
      const resp = auditResponses[b.id] || {
        status: b.completed ? 'full' : 'partial_75',
        actualMinutes: b.durationMinutes,
        focus: 'deep',
        note: '',
      };

      totalPlannedMins += b.durationMinutes;
      totalActualMins += resp.actualMinutes;

      let completionFactor = 1.0;
      if (resp.status === 'full') completionFactor = 1.0;
      else if (resp.status === 'partial_75') completionFactor = 0.75;
      else if (resp.status === 'half_50') completionFactor = 0.5;
      else completionFactor = 0.0;

      let focusBonus = 1.0;
      if (resp.focus === 'deep') focusBonus = 1.05;
      else if (resp.focus === 'distracted') focusBonus = 0.75;

      const taskWeight = b.durationMinutes;
      totalScoreWeight += taskWeight;
      earnedScoreWeight += taskWeight * completionFactor * focusBonus;

      if (b.category === 'python' || b.category === 'pytorch' || b.category === 'work') {
        deepWorkHours += (resp.actualMinutes / 60) * completionFactor;
      }

      return {
        blockId: b.id,
        title: b.title,
        category: b.category,
        plannedMinutes: b.durationMinutes,
        actualMinutes: resp.actualMinutes,
        completionStatus: resp.status,
        focusQuality: resp.focus,
        note: resp.note,
      };
    });

    const rawScore = totalScoreWeight > 0 ? (earnedScoreWeight / totalScoreWeight) * 100 : 80;
    const disciplineScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
    if (disciplineScore >= 93) grade = 'A+';
    else if (disciplineScore >= 83) grade = 'A';
    else if (disciplineScore >= 70) grade = 'B';
    else if (disciplineScore >= 50) grade = 'C';
    else grade = 'D';

    const timeDeltaMinutes = totalPlannedMins - totalActualMins;
    const completedTasksCount = items.filter((i) => i.completionStatus === 'full').length;

    // 3 Smart Anti-Fragile Insights
    const insights: string[] = [];
    if (timeDeltaMinutes > 0) {
      insights.push(
        `⚡ سرعت اجرایی بالا: شما ${toFaDigits((timeDeltaMinutes / 60).toFixed(1))} ساعت زودتر از زمان تخمینی فعالیت‌ها را به سرانجام رساندید (قانون ضدشکنندگی: تراکم کارایی).`
      );
    } else if (timeDeltaMinutes < 0) {
      insights.push(
        `⏳ کسری زمانی: فعالیت‌ها ${toFaDigits((Math.abs(timeDeltaMinutes) / 60).toFixed(1))} ساعت بیشتر از پیش‌بینی زمان بردند. برای روز بعد بافر ۳۰ دقیقه‌ای بین تسک‌ها لحاظ کنید.`
      );
    } else {
      insights.push(
        `🎯 انطباق دقیق ۱۰۰٪: تطابق کامل زمان تخمینی با واقعیت نشان‌دهنده کالیبراسیون عالی ذهن شماست.`
      );
    }

    const distractedItems = items.filter((i) => i.focusQuality === 'distracted');
    if (distractedItems.length > 0) {
      insights.push(
        `📱 هشدار پرش توجه: در تسک «${distractedItems[0].title}» افت تمرکز و پرش ذهن ثبت شد؛ فردا گوشی را در اتاق دیگر بگذارید.`
      );
    } else {
      insights.push(
        `🔥 وضعیت فوکوس عالی: کیفیت تمرکز روی تسک‌های اصلی در بالاترین سطح بدون پرش ذهنی ثبت شد.`
      );
    }

    if (disciplineScore >= 85) {
      insights.push(
        `🏆 پاداش ضدشکنندگی: در برابر خستگی و اصطکاک روز ایستادگی کردید. استراحت امشب بدون عذاب وجدان و با آرامش کامل خواهد بود.`
      );
    } else {
      insights.push(
        `🛡️ قانون ضد اضطراب: ۱ همیشه بزرگتر از ۰ است؛ تسک‌های جامانده به صورت هوشمند در بلوک‌های شناور روز بعد جبران می‌شوند.`
      );
    }

    return {
      date: new Date().toLocaleDateString('fa-IR'),
      dayKey: selectedDay,
      totalPlannedMinutes: totalPlannedMins,
      totalActualMinutes: totalActualMins,
      timeDeltaMinutes,
      disciplineScore,
      grade,
      completedTasksCount,
      totalTasksCount: items.length,
      deepWorkHours: Number(deepWorkHours.toFixed(1)),
      insights,
      items,
    };
  }, [auditableBlocks, auditResponses, selectedDay]);

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

  // Audit Response Change Handler with intelligent zero-time handling for uncompleted tasks
  const handleAuditResponseChange = (
    blockId: string,
    field: 'status' | 'actualMinutes' | 'focus' | 'note',
    value: any
  ) => {
    setAuditResponses((prev) => {
      const targetBlock = blocks.find((b) => b.id === blockId);
      const plannedDuration = targetBlock?.durationMinutes || 60;
      const existing = prev[blockId] || {
        status: targetBlock?.completed ? 'full' : 'full',
        actualMinutes: plannedDuration,
        focus: 'deep',
        note: '',
      };

      // Special rule: If status is 'none', task was NOT done at all!
      // Therefore, actual spent time MUST be 0 and cannot have positive minutes.
      if (field === 'status') {
        if (value === 'none') {
          return {
            ...prev,
            [blockId]: {
              ...existing,
              status: 'none',
              actualMinutes: 0,
              focus: 'distracted',
              note: existing.note || 'فرصت نشد / موکول به بعد',
            },
          };
        } else {
          // If changing from 'none' back to an active completion status, set sensible default minutes
          let nextMinutes = existing.actualMinutes;
          if (nextMinutes === 0) {
            if (value === 'full') nextMinutes = plannedDuration;
            else if (value === 'partial_75') nextMinutes = Math.max(15, Math.round((plannedDuration * 0.75) / 15) * 15);
            else if (value === 'half_50') nextMinutes = Math.max(15, Math.round((plannedDuration * 0.5) / 15) * 15);
          }
          return {
            ...prev,
            [blockId]: {
              ...existing,
              status: value,
              actualMinutes: nextMinutes,
              focus: existing.focus === 'distracted' ? 'deep' : existing.focus,
            },
          };
        }
      }

      return {
        ...prev,
        [blockId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  // 1-Click: Mark all day's tasks as 100% completed
  const handleMarkAllCompleted = () => {
    const newResponses: Record<string, any> = { ...auditResponses };
    auditableBlocks.forEach((b) => {
      newResponses[b.id] = {
        status: 'full',
        actualMinutes: b.durationMinutes,
        focus: 'deep',
        note: 'انجام کامل طبق برنامه',
      };
    });
    setAuditResponses(newResponses);
    onShowToast('تمامی فعالیت‌های امروز به عنوان ۱۰۰٪ انجام‌شده ثبت شدند.', 'success');
  };

  // Copy Official Report Card text
  const handleCopyAuditText = async () => {
    if (!reportCard) return;
    const dayName = dayInfo.nameFa;
    const deltaText =
      reportCard.timeDeltaMinutes >= 0
        ? `+${toFaDigits((reportCard.timeDeltaMinutes / 60).toFixed(1))} ساعت صرفه‌جویی زمان`
        : `-${toFaDigits((Math.abs(reportCard.timeDeltaMinutes) / 60).toFixed(1))} ساعت کسری زمان`;

    const lines = [
      `🎓 کارنامه رسمی و ممیزی پایان روز: ${dayName} (${reportCard.date})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏅 رتبه پایبندی: ${reportCard.grade} | نمره انضباط: ${toFaDigits(reportCard.disciplineScore)} از ۱۰۰`,
      `⏱️ زمان برنامه‌ریزی‌شده: ${toFaDigits((reportCard.totalPlannedMinutes / 60).toFixed(1))}س | زمان واقعی: ${toFaDigits((reportCard.totalActualMinutes / 60).toFixed(1))}س`,
      `⚖️ تراز خالص زمانی: ${deltaText}`,
      `🔥 ساعات کار عمیق موثر: ${toFaDigits(reportCard.deepWorkHours)} ساعت`,
      `✅ تحقق تسک‌ها: ${toFaDigits(reportCard.completedTasksCount)} از ${toFaDigits(reportCard.totalTasksCount)} فعالیت`,
      ``,
      `📋 ریز ممیزی فعالیت‌ها:`,
    ];

    reportCard.items.forEach((item) => {
      const statusFa =
        item.completionStatus === 'full'
          ? '✅ کامل'
          : item.completionStatus === 'partial_75'
          ? '⚡ ۷۵٪'
          : item.completionStatus === 'half_50'
          ? '⏳ ۵۰٪'
          : '❌ انجام نشد';
      const focusFa =
        item.focusQuality === 'deep'
          ? '🔥 فوکوس عمیق'
          : item.focusQuality === 'average'
          ? '😐 معمولی'
          : '📱 پرش و حواس‌پرتی';
      if (item.completionStatus === 'none') {
        lines.push(
          `• ${item.title}: برنامه ${toFaDigits(formatDurationFa(item.plannedMinutes))} -> [❌ انجام نشد (۰ دقیقه)]${
            item.note ? ` | علت: ${item.note}` : ''
          }`
        );
      } else {
        lines.push(
          `• ${item.title}: برنامه ${toFaDigits(formatDurationFa(item.plannedMinutes))} -> واقعی ${toFaDigits(
            formatDurationFa(item.actualMinutes)
          )} [${statusFa} | ${focusFa}]${item.note ? ` | نکته: ${item.note}` : ''}`
        );
      }
    });

    lines.push(``);
    lines.push(`💡 پیشنهادات هوشمند اختصاصی:`);
    reportCard.insights.forEach((ins) => lines.push(`- ${ins}`));
    lines.push(``);
    lines.push(`«ضدشکنندگی یعنی از آشوب و سختی تغذیه کنی و قوی‌تر بازگردی.»`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setIsCopiedAuditText(true);
      onShowToast('کارنامه رسمی پایان روز در کلیپ‌بورد کپی شد!');
      setTimeout(() => setIsCopiedAuditText(false), 2500);
    } catch {
      onShowToast('خطا در دسترسی به کلیپ‌بورد', 'warn');
    }
  };

  // Save Report Card to Durable Storage
  const handleSaveReportCard = () => {
    if (!reportCard) return;
    PlannerStorageService.saveDailyAuditCard(reportCard);
    onShowToast('کارنامه روز با موفقیت در پایگاه داده ماندگار ثبت شد!', 'success');
  };

  // Download Report Card Image
  const handleDownloadAuditCardImage = async () => {
    if (!auditCardRef.current) return;
    setIsRenderingImage(true);
    try {
      const result = await generatePngBlobFromElement(auditCardRef.current);
      if (result) {
        const a = document.createElement('a');
        a.href = result.dataUrl;
        a.download = `anti-fragile-report-card-${selectedDay}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onShowToast('کارنامه تصویری با کیفیت بالا با موفقیت دانلود شد!', 'success');
      }
    } catch {
      onShowToast('خطا در صدور تصویر کارنامه', 'warn');
    } finally {
      setIsRenderingImage(false);
    }
  };

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

        {/* Tab Selector: 0) Audit & Report Card, 1) Minimalist Graphical Output, 2) Spacious Text, 3) Classic Poster */}
        <div className="flex items-center justify-between px-5 pt-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Tab 0: Step-by-Step Audit & Report Card (USER REQUESTED: کارنامه و ممیزی زنده و پویا) */}
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'audit'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>کارنامه و ممیزی پایان روز</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                🔥 زنده و هوشمند
              </span>
            </button>

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
          {/* TAB 0: INTERACTIVE DAILY AUDIT & REPORT CARD (USER REQUESTED: کارنامه پایان روز) */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {auditableBlocks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base mb-1">
                    روز آزاد و استراحت برای {dayInfo.nameFa}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    در این روز هیچ فعالیت کاری یا آموزشی برای ممیزی ثبت نشده است. می‌توانید با کلیک روی روزهای دیگر در نوار بالا، گزارش روزهای کاری را ممیزی کنید.
                  </p>
                </div>
              ) : !isAuditSubmitted ? (
                /* INTERACTIVE AUDIT SECTION (QUICK ALL-IN-ONE + STEP-BY-STEP) */
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Top Control Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                          {toFaDigits(auditableBlocks.length)} فعالیت کاری و آموزشی
                        </span>
                        <h3 className="font-black text-slate-800 text-sm">
                          ممیزی عملکرد روز: {dayInfo.nameFa}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        وضعیت اجرای هر برنامه را با یک کلیک مشخص کنید تا کارنامه و تراز زمانی هوشمند شما صادر شود.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 1-Click: Mark All as 100% Completed */}
                      <button
                        type="button"
                        onClick={handleMarkAllCompleted}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        title="اگر همه برنامه‌ها کامل پیش رفته‌اند با ۱ کلیک تکمیل کنید"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ثبت ۱۰۰٪ همه تسک‌ها</span>
                      </button>

                      {/* View Mode Switcher */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => setAuditViewMode('quick')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            auditViewMode === 'quick'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ⚡ مرور سریع
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditViewMode('step')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            auditViewMode === 'step'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🔍 گام‌به‌گام
                        </button>
                      </div>

                      {/* View Direct Report Card */}
                      <button
                        type="button"
                        onClick={() => setIsAuditSubmitted(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        مشاهده کارنامه ←
                      </button>
                    </div>
                  </div>

                  {/* MODE A: QUICK ALL-IN-ONE AUDIT VIEW */}
                  {auditViewMode === 'quick' && (
                    <div className="space-y-3">
                      {auditableBlocks.map((block) => {
                        const resp = auditResponses[block.id] || {
                          status: block.completed ? 'full' : 'full',
                          actualMinutes: block.durationMinutes,
                          focus: 'deep',
                          note: '',
                        };

                        return (
                          <div
                            key={block.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                          >
                            {/* Block Header Info */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                                  <CategoryIcon category={block.category} className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-black text-sm text-slate-900">
                                    {block.title}
                                  </h4>
                                  {block.subtitle && (
                                    <p className="text-[11px] text-slate-500">{block.subtitle}</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                برنامه: {formatDurationFa(block.durationMinutes)}
                              </span>
                            </div>

                            {/* Status Buttons */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: 'full', label: '✅ کامل (۱۰۰٪)', color: 'emerald' },
                                { id: 'partial_75', label: '⚡ بیشترش (۷۵٪)', color: 'teal' },
                                { id: 'half_50', label: '⏳ نصفه (۵۰٪)', color: 'amber' },
                                { id: 'none', label: '❌ انجام نشد (۰٪)', color: 'rose' },
                              ].map((opt) => {
                                const isSelected = resp.status === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleAuditResponseChange(block.id, 'status', opt.id)}
                                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                      isSelected
                                        ? opt.id === 'none'
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                          : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* CONDITIONAL DETAILS ACCORDING TO USER'S INTENT: */}
                            {resp.status === 'none' ? (
                              /* Case 1: Task was NOT done - ZERO time, never ask for actual time! */
                              <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>علت عدم انجام یا موکول شدن:</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                                    زمان واقعی: ۰ دقیقه
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { id: 'fatigue', label: '💤 خستگی و افت انرژی' },
                                    { id: 'phone', label: '📱 اسکرول و پرش ذهن' },
                                    { id: 'urgent', label: '🚨 کار فوری پیش‌بینی‌نشده' },
                                    { id: 'priority', label: '🔄 تغییر اولویت و انتقال' },
                                  ].map((reason) => (
                                    <button
                                      key={reason.id}
                                      type="button"
                                      onClick={() => handleAuditResponseChange(block.id, 'note', reason.label)}
                                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                        resp.note === reason.label
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                          : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100/60'
                                      }`}
                                    >
                                      {reason.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              /* Case 2: Task was done / partially done - Adjust actual time & focus */
                              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                    <span className="font-bold">زمان واقعی صرف‌شده:</span>
                                    <span className="font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      {formatDurationFa(resp.actualMinutes)}
                                    </span>
                                  </div>

                                  {/* Quick relative adjust chips */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAuditResponseChange(block.id, 'actualMinutes', block.durationMinutes)
                                      }
                                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                      title="برابر با زمان برنامه‌ریزی‌شده"
                                    >
                                      مطابق برنامه
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAuditResponseChange(
                                          block.id,
                                          'actualMinutes',
                                          Math.max(15, resp.actualMinutes - 15)
                                        )
                                      }
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                      title="۱۵ دقیقه کمتر"
                                    >
                                      ۱۵-
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAuditResponseChange(
                                          block.id,
                                          'actualMinutes',
                                          Math.min(480, resp.actualMinutes + 15)
                                        )
                                      }
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                      title="۱۵ دقیقه بیشتر"
                                    >
                                      ۱۵+
                                    </button>
                                  </div>
                                </div>

                                {/* Focus quality mini pills */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                                  <span className="text-[10px] font-bold text-slate-500">کیفیت تمرکز:</span>
                                  {[
                                    { id: 'deep', label: '🔥 عمیق' },
                                    { id: 'average', label: '⚖️ معمولی' },
                                    { id: 'distracted', label: '⚠️ با وقفه' },
                                  ].map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => handleAuditResponseChange(block.id, 'focus', f.id)}
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                        resp.focus === f.id
                                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {f.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Submit All to Report Card */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAuditSubmitted(true)}
                          className="w-full py-3 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>محاسبه و صدور کارنامه نهایی ({dayInfo.nameFa})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE B: FOCUSED STEP-BY-STEP WIZARD */}
                  {auditViewMode === 'step' && (() => {
                    const currentBlock = auditableBlocks[auditStep] || auditableBlocks[0];
                    const currentResp = auditResponses[currentBlock.id] || {
                      status: currentBlock.completed ? 'full' : 'full',
                      actualMinutes: currentBlock.durationMinutes,
                      focus: 'deep',
                      note: '',
                    };

                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                        {/* Step Progress & Title */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                              <CategoryIcon category={currentBlock.category} className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                  گام {toFaDigits(auditStep + 1)} از {toFaDigits(auditableBlocks.length)}
                                </span>
                                <h4 className="font-black text-base text-slate-900">
                                  {currentBlock.title}
                                </h4>
                              </div>
                              {currentBlock.subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {currentBlock.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            برنامه: {formatDurationFa(currentBlock.durationMinutes)}
                          </span>
                        </div>

                        {/* Question 1: Completion Status */}
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-2">
                            ۱. وضعیت اجرای این برنامه چگونه بود؟
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'full', label: '✅ کامل (۱۰۰٪)' },
                              { id: 'partial_75', label: '⚡ بخش عمده (۷۵٪)' },
                              { id: 'half_50', label: '⏳ نصفه (۵۰٪)' },
                              { id: 'none', label: '❌ انجام نشد (۰٪)' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  handleAuditResponseChange(currentBlock.id, 'status', opt.id)
                                }
                                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                  currentResp.status === opt.id
                                    ? opt.id === 'none'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* CONDITIONAL QUESTION 2 & 3 */}
                        {currentResp.status === 'none' ? (
                          /* If task was NOT done: ZERO time, ask reason only */
                          <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-xs font-black text-rose-950">
                                  علت عدم انجام یا موکول شدن:
                                </span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                                زمان صرف‌شده: ۰ دقیقه
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-700">
                              چون این فعالیت انجام نشده، زمانی برای آن منظور نمی‌شود. علت را برای ارزیابی بهتر روز انتخاب کنید:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: 'fatigue', label: '💤 خستگی و افت انرژی' },
                                { id: 'phone', label: '📱 اسکرول و پرش ذهن' },
                                { id: 'urgent', label: '🚨 کار فوری و اضطراری' },
                                { id: 'priority', label: '🔄 تغییر اولویت و انتقال' },
                              ].map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => handleAuditResponseChange(currentBlock.id, 'note', r.label)}
                                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                    currentResp.note === r.label
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100/60'
                                  }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* If task was done / partially done: Show actual time & focus */
                          <>
                            {/* Question 2: Actual Time Spent */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-black text-slate-800">
                                  ۲. زمان واقعی صرف‌شده برای این فعالیت:
                                </label>
                                <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                  {formatDurationFa(currentResp.actualMinutes)}
                                </span>
                              </div>

                              {/* Duration Chips */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {[15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300].map((dur) => (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() =>
                                      handleAuditResponseChange(currentBlock.id, 'actualMinutes', dur)
                                    }
                                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                                      currentResp.actualMinutes === dur
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {dur >= 60 ? `${toFaDigits(dur / 60)}س` : `${toFaDigits(dur)}د`}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAuditResponseChange(
                                      currentBlock.id,
                                      'actualMinutes',
                                      Math.max(15, currentResp.actualMinutes - 30)
                                    )
                                  }
                                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  ۳۰ دقیقه کمتر -
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAuditResponseChange(
                                      currentBlock.id,
                                      'actualMinutes',
                                      Math.min(600, currentResp.actualMinutes + 30)
                                    )
                                  }
                                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  ۳۰ دقیقه بیشتر +
                                </button>
                              </div>
                            </div>

                            {/* Question 3: Focus Quality */}
                            <div>
                              <label className="block text-xs font-black text-slate-800 mb-2">
                                ۳. کیفیت تمرکز در حین انجام کار:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                  {
                                    id: 'deep',
                                    label: '🔥 تمرکز عمیق و پیوسته',
                                    desc: 'بدون وقفه و با درگیری کامل ذهنی',
                                  },
                                  {
                                    id: 'average',
                                    label: '⚖️ معمولی با وقفه کوتاه',
                                    desc: 'کار پیش رفت اما وقفه‌های کوتاه وجود داشت',
                                  },
                                  {
                                    id: 'distracted',
                                    label: '📱 پرش حواس و وقفه مکرر',
                                    desc: 'پیام‌ها یا خستگی مانع پیوستگی کار شد',
                                  },
                                ].map((f) => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() =>
                                      handleAuditResponseChange(currentBlock.id, 'focus', f.id)
                                    }
                                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                                      currentResp.focus === f.id
                                        ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="font-bold text-xs">{f.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Question 4: Note / Achievement */}
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-1.5">
                            ۴. یادداشت یا نکته کلیدی (اختیاری):
                          </label>
                          <input
                            type="text"
                            value={currentResp.note}
                            onChange={(e) =>
                              handleAuditResponseChange(currentBlock.id, 'note', e.target.value)
                            }
                            placeholder="مثلاً: مبحث با موفقیت به پایان رسید یا نیاز به مرور دارد..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={auditStep === 0}
                            onClick={() => setAuditStep((prev) => Math.max(0, prev - 1))}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ← فعالیت قبلی
                          </button>

                          {auditStep < auditableBlocks.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAuditStep((prev) =>
                                  Math.min(auditableBlocks.length - 1, prev + 1)
                                )
                              }
                              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                            >
                              فعالیت بعدی →
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsAuditSubmitted(true)}
                              className="px-6 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Trophy className="w-4 h-4" />
                              <span>محاسبه و صدور کارنامه نهایی 🎯</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* OFFICIAL ANTI-FRAGILE REPORT CARD VIEW */
                reportCard && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsAuditSubmitted(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                          title="ویرایش پاسخ‌های ممیزی فعالیت‌ها"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ویرایش ممیزی</span>
                        </button>

                        <button
                          onClick={handleSaveReportCard}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all cursor-pointer"
                          title="ذخیره ماندگار در دیتابیس لوکال"
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ذخیره در پایگاه داده</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyAuditText}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all cursor-pointer"
                          title="کپی متن کامل ساختاریافته کارنامه برای تلگرام و نوت"
                        >
                          {isCopiedAuditText ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{isCopiedAuditText ? 'کپی شد!' : 'کپی متنی کارنامه'}</span>
                        </button>

                        <button
                          onClick={handleDownloadAuditCardImage}
                          disabled={isRenderingImage}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="دانلود فایل تصویری کارنامه به صورت PNG با کیفیت بالا"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isRenderingImage ? 'در حال رندر...' : 'دانلود تصویر کارنامه (PNG)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Official Report Card Printable/Renderable DOM Element */}
                    <div className="flex justify-center overflow-x-auto p-2 bg-slate-200/60 rounded-2xl border border-slate-300/80">
                      <div
                        ref={auditCardRef}
                        style={{
                          width: '740px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontFamily: "'Vazirmatn RD', 'Vazirmatn', sans-serif",
                          letterSpacing: '0px',
                        }}
                        className="p-6 rounded-2xl shadow-xl border border-slate-200/90 flex flex-col gap-4 shrink-0 select-none"
                        dir="rtl"
                      >
                        {/* Header Banner */}
                        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-xs">
                              <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-slate-950">
                                  کارنامه رسمی ارزیابی و انضباط روزانه
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                  Anti-Fragile Audit
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                روز {dayInfo.nameFa} • تاریخ: {reportCard.date} • {plannerTitle}
                              </p>
                            </div>
                          </div>

                          {/* Grade Stamp */}
                          <div className="text-center px-4 py-1.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border border-slate-700">
                            <span className="text-[10px] text-slate-300 block font-bold">
                              رتبه انضباط
                            </span>
                            <span className="text-2xl font-black font-mono tracking-tight text-amber-300">
                              {reportCard.grade}
                            </span>
                          </div>
                        </div>

                        {/* Executive KPI Matrix */}
                        <div className="grid grid-cols-4 gap-2.5">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              نمره پایبندی
                            </span>
                            <span className="text-xl font-black font-mono text-indigo-700">
                              {toFaDigits(reportCard.disciplineScore)}
                              <span className="text-xs text-slate-500 font-normal"> / ۱۰۰</span>
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              زمان برنامه‌ریزی / واقعی
                            </span>
                            <span className="text-xs font-mono font-black text-slate-800">
                              {toFaDigits((reportCard.totalPlannedMinutes / 60).toFixed(1))}س /{' '}
                              {toFaDigits((reportCard.totalActualMinutes / 60).toFixed(1))}س
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              تراز خالص زمانی
                            </span>
                            <span
                              className={`text-xs font-mono font-black ${
                                reportCard.timeDeltaMinutes >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {reportCard.timeDeltaMinutes >= 0 ? '+' : ''}
                              {toFaDigits((reportCard.timeDeltaMinutes / 60).toFixed(1))} ساعت
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              کار عمیق موثر
                            </span>
                            <span className="text-xl font-black font-mono text-emerald-700">
                              {toFaDigits(reportCard.deepWorkHours)}
                              <span className="text-xs text-slate-500 font-normal"> ساعت</span>
                            </span>
                          </div>
                        </div>

                        {/* Detailed Table of Audited Activities */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 flex items-center justify-between">
                            <span>ریز ممیزی فعالیت‌های ثبت‌شده</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              تحقق: {toFaDigits(reportCard.completedTasksCount)} از{' '}
                              {toFaDigits(reportCard.totalTasksCount)}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {reportCard.items.map((item, idx) => {
                              const statusBadge =
                                item.completionStatus === 'full'
                                  ? { text: '۱۰۰٪ کامل', bg: 'bg-emerald-100 text-emerald-800' }
                                  : item.completionStatus === 'partial_75'
                                  ? { text: '۷۵٪ عمده', bg: 'bg-indigo-100 text-indigo-800' }
                                  : item.completionStatus === 'half_50'
                                  ? { text: '۵۰٪ نصفه', bg: 'bg-amber-100 text-amber-800' }
                                  : { text: '۰٪ انجام نشد', bg: 'bg-rose-100 text-rose-800' };

                              const focusBadge =
                                item.focusQuality === 'deep'
                                  ? '🔥 عمیق'
                                  : item.focusQuality === 'average'
                                  ? '😐 معمولی'
                                  : '📱 پرش حواس';

                              return (
                                <div
                                  key={item.blockId}
                                  className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {toFaDigits(idx + 1)}.
                                    </span>
                                    <span className="font-bold text-slate-800 truncate">
                                      {item.title}
                                    </span>
                                    {item.note && (
                                      <span className="text-[10px] text-slate-500 truncate max-w-xs">
                                        ({item.completionStatus === 'none' ? `علت: ${item.note}` : item.note})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {item.completionStatus === 'none' ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        ❌ انجام نشد (۰ دقیقه)
                                      </span>
                                    ) : (
                                      <>
                                        <span className="text-[10px] font-mono text-slate-500">
                                          {toFaDigits(item.actualMinutes)}د واقعی
                                        </span>
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${statusBadge.bg}`}
                                        >
                                          {statusBadge.text}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                          {focusBadge}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Smart Anti-Fragile Insights Box */}
                        <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/60 to-emerald-50/70 border border-amber-200/70 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-black text-slate-900">
                              راهکارها و بینش هوشمند ضدشکنندگی (Cognitive Coaching):
                            </h4>
                          </div>
                          <ul className="space-y-1 text-xs text-slate-700 leading-relaxed">
                            {reportCard.insights.map((ins, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{ins}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer Motivational Axiom */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                          <span>طراحی‌شده با اصول روانشناسی عملکرد و مدیریت زمان ضدشکننده</span>
                          <span className="font-bold text-slate-600">
                            «۱ همیشه بزرگتر از ۰ است»
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

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
                                    className={`text-[9px] px-2 py-0.5 rounded-md font-medium shrink-0 ${cat.badgeClass}`}
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
