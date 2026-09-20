import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Bell,
  Award,
  Flame,
  Palette,
  Layers,
  Zap,
  Copy,
  Check,
  Terminal,
  Server,
  FileCode,
  Brain,
  Anchor,
  Activity,
  Volume2,
  RefreshCw,
  Sliders,
  Maximize2,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { toFaDigits } from '../constants/plannerConfig';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

// Exhaustive Master AI System Prompt for total omniscience
const MASTER_AI_BLUEPRINT_PROMPT = `=== MASTER SYSTEM BLUEPRINT: ANTI-FRAGILE WEEKLY TIMEBOXING PLANNER ===
Identity & Role:
You are the Omniscient AI Assistant and Chief Operating System Engineer for the "Anti-Fragile Weekly Timeboxing Planner".
You have total knowledge of all architectural mechanics, algorithms, user interfaces, mathematical constraints, and behavioral psychology embedded in this application.

1. CORE PHILOSOPHY & METHODOLOGY:
- Anti-Fragility (Nassim Nicholas Taleb): 
  Systems that benefit from shocks and randomness. When plans break due to life events, fatigue, or late wake-up, the system does not fail or shame the user; it dynamically re-equilibrates.
  Golden Axiom: "1 > 0" (Doing 15 minutes of focused work is infinitely superior to zero).
- Timeboxing Paradigm (Harvard / Elon Musk / Cal Newport):
  Tasks are not endless open-ended to-do lists; they are assigned strictly bounded time containers in a 7-day grid (Saturday to Friday).
- Circadian Energy Synchronization:
  * Morning Horizon (07:00 - 11:00): Peak alertness, reserved for Deep Work (وزن سنگین شناختی، برنامه‌نویسی، ریاضیات، مقاله‌نویسی).
  * Noon Peak (11:00 - 15:00): Administrative tasks, meetings, collaborative execution.
  * Evening Horizon (15:00 - 19:00): Secondary focus, creative work, reading, study.
  * Night Horizon (19:00 - 24:00): Active recovery, sports, dinner, family, daily audit & next-day preview.

2. CORE DATA STRUCTURES & SCHEMAS:
- DayKey: 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
- TimeBlock:
  * id: string (unique UUID / timestamp)
  * day: DayKey
  * title: string (Activity title)
  * subtitle?: string (Micro-objective or context)
  * startMinutes: number (0 to 1440, minutes from midnight; default grid 07:00 [420] to 24:00 [1440])
  * durationMinutes: number (min 15, snapped to 15-minute intervals)
  * category: CategoryKey ('work' | 'reading' | 'python' | 'meeting' | 'university' | 'recovery' | 'gaming' | 'custom'...)
  * note?: string (Detailed notes; supports 'anchor:true' for fixed immovable anchors)
  * completed: boolean (Execution status)
  * subtasks?: Array<{ id: string; title: string; completed: boolean }> (Micro-checklists)
- BlockTemplate:
  * id, title, category, defaultDuration, subtitle, icon, color
- DailyReportCard:
  * disciplineScore: 0 to 100
  * grade: 'A+' | 'A' | 'B' | 'C' | 'D'
  * totalPlannedMinutes, totalActualMinutes, timeDeltaMinutes, deepWorkHours
  * items: DailyAuditItem[] with completionStatus ('full' | 'partial_75' | 'half_50' | 'none') and focusQuality ('deep' | 'average' | 'distracted')
  * insights: 3 automated anti-fragile behavioral coaching feedback strings

3. BACKGROUND ENGINES & ALGORITHMS:
- Multi-Column Non-Overlapping Layout Engine (computeDayBlockLayout):
  Calculates temporal collisions per day. When multiple blocks occupy the same time slice, it partitions horizontal column space (colIndex / totalCols) without visual overlap or clipping.
- Smart Gap-Collapse Cascade:
  When a task finishes early or is deleted, subsequent non-anchor tasks on that day can be smoothly cascaded upwards by freedDurationMinutes in 1 click.
- Anchor Block Protection (isAnchorBlock):
  Blocks marked with 'anchor:true' (such as university classes or firm meetings) are mathematically immune to automatic late shifts and emergency gap collapses.
- Web Audio API Focus Synthesizer:
  100% offline acoustic soundscape generator using AudioContext:
  * Pink Noise (-3dB/octave filter) for steady cognitive flow.
  * Brown Noise (-6dB/octave deep rumble) for silencing external speech.
  * Binaural Beats (e.g. 40Hz Gamma for problem solving, 14Hz Beta for alertness).
- Storage & Snapshot Engine (PlannerStorageService):
  Local atomic browser persistence with multi-version snapshot history ('planner_history_snapshots'). Survives browser tab closures, reboots, and network changes with zero server dependency.

4. UI CONTROLS, SHORTCUTS & INTERACTIVE FEATURES:
- Paper-Like Quick Jotting (QuickAddSlotModal):
  Clicking any slot opens an auto-focused pen input with natural language duration detection ("ورزش ۴۵د" -> 45m), 1-tap presets, and instant Enter key submission.
- Density Zoom Controls: 3 visual heights (Compact 26px, Standard 32px, Comfortable 40px).
- Slot Resolution Toggle: 15-minute vs 30-minute grid increments.
- Live Crimson Time Indicator: Real-time laser line marking current minute on today's column.
- 3-Tier Daily Report Modal:
  * Tier A: 7-day selector without horizontal overflow.
  * Tier B: Start-aligned key day metrics + End-aligned format tabs (Audit, Minimal Graphic, Text Briefing, HD Poster).
  * Tier C: Interactive audit cards, discipline grading, and rollover engine.
- Emergency Recovery Modal (Crisis Day Re-scheduler):
  Provides 3 automated rescue strategies when running hours behind:
  1. Cascade Shift (جلو راندن شناورها)
  2. Drop Low-Priority (حذف کارهای غیرضروری و تمرکز روی ۱ کار حیاتی)
  3. Micro-Sprint Compression (فشرده‌سازی در بازه‌های ۳۰ دقیقه‌ای با بافر)
- Late Shift Modal: 1-click recalculation when waking up late.
- Keyboard Shortcuts:
  * Ctrl+Z / Ctrl+Y: Full undo/redo stack.
  * Ctrl+F: Fit-to-screen toggle.
  * Esc: Dismiss any active modal.
  * Enter: Submit quick block.

When the user asks you to help plan their day or week, structure their schedule using these exact principles, categories, and circadian energy intervals!`;

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'academy' | 'blueprint' | 'daemon'>('academy');
  const [activeAcademyChapter, setActiveAcademyChapter] = useState<number>(1);
  const [isCopiedBlueprint, setIsCopiedBlueprint] = useState<boolean>(false);
  const [isCopiedSystemd, setIsCopiedSystemd] = useState<boolean>(false);
  const [isCopiedPm2, setIsCopiedPm2] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyBlueprint = () => {
    navigator.clipboard
      .writeText(MASTER_AI_BLUEPRINT_PROMPT)
      .then(() => {
        setIsCopiedBlueprint(true);
        setTimeout(() => setIsCopiedBlueprint(false), 3000);
        if (onShowToast) {
          onShowToast('پرامپت جامع هوش مصنوعی با موفقیت کپی شد! می‌توانید آن را به هر هوش مصنوعی بدهید.', 'success');
        }
      })
      .catch(() => {
        if (onShowToast) onShowToast('خطا در دسترسی به کلیپ‌بورد', 'warn');
      });
  };

  const handleCopyText = (text: string, setCopied: (v: boolean) => void, msg: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        if (onShowToast) onShowToast(msg, 'success');
      })
      .catch(() => {
        if (onShowToast) onShowToast('خطا در کپی', 'warn');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-950/20 shrink-0">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  دانشنامه، آکادمی و سند مرجع معماری سیستم
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                  Master Academy
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                راهنمای جامع، پرامپت هوش مصنوعی بدون از قلم افتادگی و راهنمای اجرای دائمی پس‌زمینه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="بستن (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Master Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: System Academy */}
          <button
            type="button"
            onClick={() => setActiveTab('academy')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'academy'
                ? 'bg-white text-indigo-700 shadow-xs border-t border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>۱. آکادمی جامع تایم‌باکسینگ ضدشکننده</span>
          </button>

          {/* Tab 2: Master AI Blueprint Prompt */}
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'blueprint'
                ? 'bg-white text-emerald-700 shadow-xs border-t border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>۲. پرامپت جامع هوش مصنوعی (Master Blueprint)</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              DNA کامل
            </span>
          </button>

          {/* Tab 3: Permanent Background Runtime */}
          <button
            type="button"
            onClick={() => setActiveTab('daemon')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'daemon'
                ? 'bg-white text-amber-700 shadow-xs border-t border-x border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-4 h-4 text-amber-600" />
            <span>۳. اجرای دائمی و بدون توقف (Windows & Linux)</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* ========================================================================= */}
          {/* TAB 1: SYSTEM ACADEMY */}
          {/* ========================================================================= */}
          {activeTab === 'academy' && (
            <div className="space-y-6">
              {/* Academy Chapters Navigation Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 1, label: 'فلسفه ۱ > ۰', icon: Flame },
                  { id: 2, label: 'ریتم‌های سیرکادین', icon: Clock },
                  { id: 3, label: 'نوشتن روان مثل کاغذ', icon: Zap },
                  { id: 4, label: 'کارت‌های لنگر (Anchor)', icon: Anchor },
                  { id: 5, label: 'موتور تصادم و خلاء', icon: Sliders },
                  { id: 6, label: 'تمرکز آکوستیک آفلاین', icon: Volume2 },
                  { id: 7, label: 'چرخه صبح و شامگاه', icon: Compass },
                  { id: 8, label: 'کلیدهای میانبر و ابزارها', icon: Terminal },
                ].map((chap) => {
                  const IconComp = chap.icon;
                  return (
                    <button
                      key={chap.id}
                      type="button"
                      onClick={() => setActiveAcademyChapter(chap.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeAcademyChapter === chap.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{chap.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Chapter Content Details */}
              {activeAcademyChapter === 1 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <Flame className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      فلسفه ضدشکنندگی (Anti-Fragility): قانون ۱ همیشه بزرگتر از ۰ است!
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    در مدیریت زمان سنتی، شکستن برنامه با احساس گناه و کمال‌گرایی منفی همراه است. در این سامانه که بر اساس نظریه نسیم نیکلاس طالب طراحی شده است، شوک‌ها، خستگی و اتفاقات ناگهانی زندگی نه تنها سیستم را تخریب نمی‌کنند، بلکه ورودی بازتنظیم هوشمند هستند. اگر برای تسکی ۹۰ دقیقه پیش‌بینی کرده بودید اما تنها ۲۰ دقیقه فرصت شد، همان ۲۰ دقیقه پیشرفت ثبت شده و مابقی به صورت شناور به روز بعد منتقل می‌شود.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                      <h4 className="text-xs font-black text-amber-900">رهایی از لیست‌های بی‌پایان</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        جایگزینی فهرست‌های نامحدود وظایف با بلوک‌های زمانی شفاف و مرزدار.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-1">
                      <h4 className="text-xs font-black text-indigo-900">سرعت بازگشت (Bounce-Back)</h4>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        استفاده از مدال «جبران شرایط اضطراری» برای بازآرایی سریع جدول در روزهای بحرانی.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
                      <h4 className="text-xs font-black text-emerald-900">استراحت بدون احساس گناه</h4>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        بلوک‌های ریکاوری، پیاده‌روی و خواب به عنوان بخش‌های حیاتی موفقیت شناخته می‌شوند.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeAcademyChapter === 2 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Clock className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      ریتم‌های سیرکادین و ۴ افق انرژی در طول روز
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    مغز انسان در طول شبانه‌روز نوسانات هورمونی و انرژی مشخصی دارد. تایم‌باکسینگ واقعی زمانی معجزه می‌کند که سختی تسک با افق انرژی متناسب باشد:
                  </p>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-600 text-white shrink-0">
                        ۰۷:۰۰ تا ۱۱:۰۰
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950">افق صبحگاهی (Deep Work)</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          بالاترین تمرکز شناختی مغز. اختصاص به کارهای بدون حواس‌پرتی، کدنویسی هسته، یادگیری عمیق و حل مسائل ریاضی و فنی.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-600 text-white shrink-0">
                        ۱۱:۰۰ تا ۱۵:۰۰
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-amber-950">افق نیمروزی (جلسات و کارهای اداری)</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          افت جزئی انرژی پس از ناهار؛ مناسب برای جلسات آنلاین، پاسخ‌دهی به ایمیل‌ها، هماهنگی‌های تیمی و کارهای اجرایی روتین.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-600 text-white shrink-0">
                        ۱۵:۰۰ تا ۱۹:۰۰
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-purple-950">افق عصرگاهی (مطالعه و خلاقیت)</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          موج دوم بیداری و هوشیاری؛ زمان طلایی مطالعه مقالات، تحقیق، طراحی و یادگیری پروژه‌های جانبی.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-600 text-white shrink-0">
                        ۱۹:۰۰ تا ۲۴:۰۰
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">افق شبانگاهی (ریکاوری و ارزیابی روز)</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          ورزش، شام، معاشرت با خانواده، اجرای ارزیابی روزانه (Daily Audit) و مرور اجمالی برنامه فردا قبل از خواب آرام.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAcademyChapter === 3 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <Zap className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      ارگونومی نوشتن روان مثل قلم و کاغذ (Paper-Like Ergonomics)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    اصطکاک ابزارهای دیجیتال دلیل اصلی رها کردن برنامه‌ریزی است. در این پلتفرم شما با یک کلیک روی هر خانه، فوراً نام تسک را تایپ کرده و با فشردن کلید Enter آن را ثبت می‌کنید:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>تشخیص هوشمند مدت زمان:</strong> اگر تایپ کنید «مطالعه ۴۵د» یا «جلسه ۱ساعت»، سیستم خودکار زمان را ست می‌کند.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>پیش‌نهادهای ۱-کلیکه:</strong> دکمه‌های آماده کار عمیق، کلاس، ورزش و مطالعه برای افزودن بدون حتی یک کلمه تایپ.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>جابه‌جایی روان:</strong> با کشیدن یک کارت روی کارت دیگر، پنجره تعویض هوشمند (Swap) باز می‌شود تا جای دو تسک با هم عوض شود.</span>
                    </li>
                  </ul>
                </div>
              )}

              {activeAcademyChapter === 4 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <Anchor className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      کارت‌های لنگر و تعهدات غیرقابل جابه‌جایی (Anchor Blocks)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    برخی فعالیت‌ها مانند کلاس‌های دانشگاه، وبینارهای زنده یا جلسات هیئت مدیره در ساعات ثابتی برگزار می‌شوند و نباید با شیفت خودکار روزانه جا‌به‌جا شوند. کافیست گزینه «برنامه ثابت (Anchor)» را در ویرایش تسک فعال کنید. این کارت‌ها با آیکون لنگر زردرنگ قفل شده و در برابر هرگونه شیفت یا فشرده‌سازی خودکار مصون می‌مانند.
                  </p>
                </div>
              )}

              {activeAcademyChapter === 5 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sky-600">
                    <Sliders className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      موتور رفع تداخل زمانی و پر کردن هوشمند خلاءها (Gap Collapse)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    وقتی دو فعالیت روی هم می‌افتند، موتور چندستونه ماتریسی بدون روی هم افتادن متن‌ها آن‌ها را در کنار هم نمایش می‌دهد و دکمه قرمز «تداخل» به شما اجازه می‌دهد با یک کلیک زمان‌بندی را اصلاح کنید. همچنین با حذف یا پایان زودرس یک تسک، بنر شناور «شیفت خودکار تسک‌ها» ظاهر می‌شود تا کارهای بعدی به سمت بالا بیایند و وقت هدر نرود.
                  </p>
                </div>
              )}

              {activeAcademyChapter === 6 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-purple-600">
                    <Volume2 className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      تمرکز عمیق با سنتز صوتی وب‌آدیو کاملاً آفلاین
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    در مدال «حالت تمرکز عمیق (Focus Mode)»، یک موتور صوتی واقعی Web Audio API تعبیه شده است که بدون نیاز به دانلود فایل‌های صوتی سنگین یا اینترنت، فرکانس‌های نویز صورتی (Pink Noise)، نویز قهوه‌ای (Brown Noise) و امواج دوگوشی (Binaural Beats در باند گاما ۴۰ هرتز) را به‌صورت زنده سنتز می‌کند تا صداهای محیطی حذف و امواج مغزی متمرکز شوند.
                  </p>
                </div>
              )}

              {activeAcademyChapter === 7 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Compass className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      مناسک چرخه روزانه: برنامه صبحگاه و ارزیابی شامگاه
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    سیستم دارای دو دروازه آیینی است: صبح‌ها با «برنامه اجرایی صبحگاه» تسک‌های کلیدی امروز را مرور کرده و حالت تمرکز را کلید می‌زنید؛ شب‌ها با «کارنامه و ارزیابی پایان روز» درصد انجام، انطباق زمان تخمینی با واقعیت و بازخورد روان‌شناختی ضدشکنندگی را دریافت می‌کنید. تسک‌های ناقص نیز با ۱ کلیک به بلوک‌های خالی روز بعد منتقل می‌شوند.
                  </p>
                </div>
              )}

              {activeAcademyChapter === 8 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <Terminal className="w-6 h-6 stroke-[2.5]" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      کلیدهای میانبر و ابزارهای سریع هدر
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">بازگشت و انجام مجدد (Undo / Redo)</span>
                      <kbd className="px-2 py-1 bg-white rounded-md border font-mono font-bold shadow-2xs">Ctrl + Z / Y</kbd>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">حالت تمام‌صفحه و فیت مانیتور</span>
                      <kbd className="px-2 py-1 bg-white rounded-md border font-mono font-bold shadow-2xs">Ctrl + F</kbd>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">بستن تمام پنجره‌ها و منوها</span>
                      <kbd className="px-2 py-1 bg-white rounded-md border font-mono font-bold shadow-2xs">Esc</kbd>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">ثبت فوری در یادداشت سریع</span>
                      <kbd className="px-2 py-1 bg-white rounded-md border font-mono font-bold shadow-2xs">Enter ↵</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MASTER AI BLUEPRINT PROMPT */}
          {/* ========================================================================= */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      پرامپت جامع هوش مصنوعی (Master AI Blueprint)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    این سند جامع دربرگیرنده ۱۰۰٪ معماری، انواع داده، هوک‌ها، الگوریتم‌ها و قابلیت‌های پلتفرم است. با کپی کردن این متن و ارائه آن به هر مدل هوش مصنوعی (مانند ChatGPT، Claude یا Gemini)، هوش مصنوعی تسلط مطلق بر کل نرم‌افزار پیدا کرده و می‌تواند در چینش، حل تداخلات و برنامه‌ریزی به شما کمک کند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBlueprint}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  {isCopiedBlueprint ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedBlueprint ? 'کپی گردید!' : 'کپی پرامپت جامع AI'}</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto" dir="ltr">
                <pre className="whitespace-pre-wrap selection:bg-emerald-600 selection:text-white">
                  {MASTER_AI_BLUEPRINT_PROMPT}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PERMANENT BACKGROUND RUNTIME & ZERO-DOWNTIME CONFIGURATION */}
          {/* ========================================================================= */}
          {activeTab === 'daemon' && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200/80 flex items-start gap-3.5">
                <Server className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-amber-950 text-sm sm:text-base">
                    پایداری همیشگی و اجرای دائمی در پس‌زمینه (Zero-Downtime Daemonization)
                  </h3>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    با اجرای دستورات زیر، این نرم‌افزار حتی در صورت بستن ترمینال، خروج از VS Code، تغییر شبکه وای‌فای یا ریبوت شدن سیستم، بدون توقف در پس‌زمینه سیستم شما اجرا خواهد بود و داده‌ها با امنیت کامل ذخیره می‌شوند.
                  </p>
                </div>
              </div>

              {/* Windows Daemonization */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs sm:text-sm">
                    <Terminal className="w-4 h-4" />
                    <span>راهنمای ویندوز (Windows): اجرای دائمی با PM2 یا NSSM</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `npm install -g pm2\npm run build\npm2 start "npm run dev" --name "anti-fragile-planner"\npm2 save\nnpm install -g pm2-windows-startup\npm2-startup install`,
                        setIsCopiedPm2,
                        'دستورات PM2 ویندوز کپی شد!'
                      )
                    }
                    className="text-xs px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedPm2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>کپی دستورات</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  ترمینال PowerShell یا CMD را در حالت Administrator باز کرده و دستورات زیر را وارد نمایید تا برنامه به عنوان سرویس دائمی پس‌زمینه ویندوز ثبت شود:
                </p>

                <div className="bg-slate-950 rounded-2xl p-3 text-slate-200 font-mono text-[11px] overflow-x-auto" dir="ltr">
                  <code>
                    npm install -g pm2<br />
                    npm run build<br />
                    pm2 start "npm run dev" --name "anti-fragile-planner"<br />
                    pm2 save<br />
                    npm install -g pm2-windows-startup<br />
                    pm2-startup install
                  </code>
                </div>
              </div>

              {/* Linux Daemonization */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs sm:text-sm">
                    <Server className="w-4 h-4" />
                    <span>راهنمای لینوکس (Linux): سرویس Systemd دائمی با Auto-Restart</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `[Unit]\nDescription=Anti-Fragile Weekly Timeboxing Planner\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/var/www/planner\nExecStart=/usr/bin/npm run dev\nRestart=always\nRestartSec=5\nEnvironment=NODE_ENV=production PORT=3000\n\n[Install]\nWantedBy=multi-user.target`,
                        setIsCopiedSystemd,
                        'فایل سرویس systemd لینوکس کپی شد!'
                      )
                    }
                    className="text-xs px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedSystemd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>کپی فایل کانفیگ</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  فایل سرویس را در مسیر <code>/etc/systemd/system/planner.service</code> ایجاد کرده و دستورات زیر را اجرا کنید:
                </p>

                <div className="bg-slate-950 rounded-2xl p-3 text-emerald-400 font-mono text-[11px] overflow-x-auto" dir="ltr">
                  <pre>{`[Unit]
Description=Anti-Fragile Weekly Timeboxing Planner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/planner
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target`}</pre>
                </div>

                <div className="bg-slate-900 rounded-2xl p-3 text-slate-200 font-mono text-[11px] overflow-x-auto" dir="ltr">
                  <code>
                    sudo systemctl daemon-reload<br />
                    sudo systemctl enable --now planner.service<br />
                    sudo systemctl status planner.service
                  </code>
                </div>
              </div>

              {/* Zero-Data-Loss Architecture */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs sm:text-sm">
                  <Shield className="w-4 h-4" />
                  <span>معماری مصونیت از پاک‌شدن داده‌ها و ایزولاسیون کامل آفلاین</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تمامی تغییرات جدول به صورت آنی در حافظه محلی پایدار مرورگر (LocalStorage) ذخیره شده و هم‌زمان در کلید <code>planner_history_snapshots</code> تاریخچه چندنسخه‌ای ایجاد می‌گردد. بنابراین تغییر IP، قطع اتصال اینترنت، سوئیچ بین وای‌فای و هات‌اسپات، هیچ‌گونه تاثیری بر پایگاه داده نخواهد داشت. همچنین با استفاده از گزینه «پشتیبان‌گیری و پایگاه داده»، می‌توانید در هر لحظه کل دیتابیس را به عنوان فایل JSON مستقل ذخیره کنید.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            تایم‌باکسینگ ضدشکننده • ویرایش فوق‌حرفه‌ای و پایدار
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            متوجه شدم و بازگشت به برنامه
          </button>
        </div>
      </div>
    </div>
  );
};
