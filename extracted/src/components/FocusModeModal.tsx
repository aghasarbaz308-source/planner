import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Plus,
  Flame,
  Coffee,
  Sparkles,
  Maximize2,
  Minimize2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Brain,
  Headphones,
  CloudRain,
  Radio,
  Zap,
  Wind,
  ListTodo,
  ChevronDown,
  Sparkle,
} from 'lucide-react';
import { TimeBlock } from '../types';
import {
  getLiveScheduleStatus,
  ambientSound,
  LiveScheduleStatus,
} from '../utils/liveScheduleEngine';
import {
  formatDurationFa,
  minutesToTimeString,
  toFaDigits,
  CATEGORIES,
} from '../constants/plannerConfig';
import { chimeEngine } from '../services/reminderService';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  onToggleCompleteBlock: (id: string) => void;
  onUpdateBlock: (block: TimeBlock) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warn') => void;
}

interface MicroStep {
  id: string;
  text: string;
  completed: boolean;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  blocks,
  onToggleCompleteBlock,
  onUpdateBlock,
  onShowToast,
}) => {
  // Live current wall clock
  const [wallClock, setWallClock] = useState<Date>(new Date());

  // Ambient sound state
  const [ambientMode, setAmbientMode] = useState<'none' | 'rain' | 'alpha432' | 'whitenoise'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  // Psychological Breathing Guide state (4-7-8 protocol)
  const [breathingGuideActive, setBreathingGuideActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(4);

  // Micro-steps checklist
  const [microSteps, setMicroSteps] = useState<MicroStep[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [showMicroSteps, setShowMicroSteps] = useState(false);

  // Selected Block ID for focus (can be current active or user-chosen from schedule)
  const [selectedBlockId, setSelectedBlockId] = useState<string | 'custom'>('custom');
  const [customPresetMinutes, setCustomPresetMinutes] = useState<number>(25);

  // ISOLATED ROBUST TIMER CORE (Anti-Bug, Monotonic, Jitter-Free)
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);

  // Timestamp of last tick to prevent drift during tab throttling
  const lastTickTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const hasAlertedCompletionRef = useRef<string | null>(null);

  // Derive live status
  const liveStatus: LiveScheduleStatus = useMemo(() => {
    return getLiveScheduleStatus(blocks, wallClock);
  }, [blocks, wallClock]);

  // Sync wall clock every 2 seconds (for header time)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setWallClock(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Initial sync when modal opens: If there's an active block, attach to it!
  useEffect(() => {
    if (!isOpen) return;

    if (liveStatus.activeBlock) {
      setSelectedBlockId(liveStatus.activeBlock.id);
      const remainingSecs = Math.max(
        60,
        liveStatus.remainingMinutesInActive * 60 + liveStatus.remainingSecondsInActive
      );
      setTotalSessionSeconds(liveStatus.activeBlock.durationMinutes * 60);
      setSecondsRemaining(remainingSecs);
      setIsRunning(true);
    } else {
      // Default to 25m Pomodoro or next block if available
      if (liveStatus.nextBlock) {
        setSelectedBlockId(liveStatus.nextBlock.id);
        const durationSecs = liveStatus.nextBlock.durationMinutes * 60;
        setTotalSessionSeconds(durationSecs);
        setSecondsRemaining(durationSecs);
      } else {
        setSelectedBlockId('custom');
        setTotalSessionSeconds(25 * 60);
        setSecondsRemaining(25 * 60);
      }
      setIsRunning(true);
    }
    lastTickTimestampRef.current = Date.now();
  }, [isOpen]);

  // Target Block resolution
  const currentTargetBlock: TimeBlock | null = useMemo(() => {
    if (selectedBlockId === 'custom') return null;
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Category theme
  const categoryTheme = currentTargetBlock ? CATEGORIES[currentTargetBlock.category] : null;
  const accentColor = categoryTheme?.dotColor || '#6366f1';

  // Handle Target Block Change
  const handleSelectTarget = (targetId: string | 'custom', customMinutes = 25) => {
    setSelectedBlockId(targetId);
    if (targetId === 'custom') {
      setCustomPresetMinutes(customMinutes);
      setTotalSessionSeconds(customMinutes * 60);
      setSecondsRemaining(customMinutes * 60);
    } else {
      const b = blocks.find((item) => item.id === targetId);
      if (b) {
        const secs = b.durationMinutes * 60;
        setTotalSessionSeconds(secs);
        setSecondsRemaining(secs);
      }
    }
    setIsRunning(true);
    hasAlertedCompletionRef.current = null;
    lastTickTimestampRef.current = Date.now();
    chimeEngine.play('pop', 0.6);
  };

  // ROBUST ANTI-JITTER TICK ENGINE
  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    lastTickTimestampRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTickTimestampRef.current) / 1000);

      if (elapsedSeconds >= 1) {
        lastTickTimestampRef.current = now;
        setSecondsRemaining((prev) => {
          const nextVal = Math.max(0, prev - elapsedSeconds);
          if (nextVal === 0 && prev > 0) {
            handleSessionCompleted();
          }
          return nextVal;
        });
      }
    }, 500); // 500ms check ensures crisp 1-second cadence without skipping

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, isRunning]);

  // Sound chime & announcement on completion
  const handleSessionCompleted = () => {
    setIsRunning(false);
    chimeEngine.play('zen', 0.9);

    if (voiceSpeechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = currentTargetBlock
          ? `زمان فعالیت ${currentTargetBlock.title} به پایان رسید. آفرین بر تمرکز شما!`
          : 'جلسه تمرکز عمیق با موفقیت تکمیل شد. وقت استراحت و ریکاوری ذهن است.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        window.speechSynthesis.speak(utterance);
      } catch {}
    }

    onShowToast('جلسه تمرکز با موفقیت به پایان رسید! خسته نباشید.', 'success');
  };

  // Ambient sound management
  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  const handleToggleAmbient = (mode: 'none' | 'rain' | 'alpha432' | 'whitenoise') => {
    if (mode === 'none' || mode === ambientMode) {
      setAmbientMode('none');
      ambientSound.stop();
    } else {
      setAmbientMode(mode);
      ambientSound.play(mode, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    ambientSound.setVolume(vol);
  };

  // Add +5 Minutes
  const handleAddMinutes = (mins: number) => {
    setSecondsRemaining((prev) => prev + mins * 60);
    setTotalSessionSeconds((prev) => prev + mins * 60);
    if (!isRunning) setIsRunning(true);
    chimeEngine.play('tap', 0.5);
    onShowToast(`${toFaDigits(mins)} دقیقه زمان اضافه به تایمر افزوده شد.`, 'info');
  };

  // Reset current session
  const handleResetSession = () => {
    setSecondsRemaining(totalSessionSeconds);
    setIsRunning(false);
    lastTickTimestampRef.current = Date.now();
    chimeEngine.play('pop', 0.5);
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isRunning) {
      setIsRunning(false);
      chimeEngine.play('pop', 0.4);
    } else {
      lastTickTimestampRef.current = Date.now();
      setIsRunning(true);
      chimeEngine.play('tap', 0.5);
    }
  };

  // Mark block complete
  const handleMarkComplete = () => {
    if (currentTargetBlock) {
      onToggleCompleteBlock(currentTargetBlock.id);
      chimeEngine.play('bell', 0.85);
      onShowToast(`فعالیت «${currentTargetBlock.title}» با موفقیت تکمیل شد!`, 'success');
    } else {
      chimeEngine.play('bell', 0.85);
      onShowToast('جلسه تمرکز ثبت شد.', 'success');
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts (Space: pause/resume, Esc: exit, F: fullscreen)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning]);

  // Psychological 4-7-8 Breathing Loop
  useEffect(() => {
    if (!isOpen || !breathingGuideActive) return;

    const interval = setInterval(() => {
      setBreathingSecondsLeft((prev) => {
        if (prev <= 1) {
          if (breathingPhase === 'inhale') {
            setBreathingPhase('hold');
            return 7;
          } else if (breathingPhase === 'hold') {
            setBreathingPhase('exhale');
            return 8;
          } else {
            setBreathingPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, breathingGuideActive, breathingPhase]);

  // Add Micro-Step
  const handleAddMicroStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    setMicroSteps((prev) => [
      ...prev,
      { id: 'ms_' + Date.now(), text: newStepText.trim(), completed: false },
    ]);
    setNewStepText('');
    chimeEngine.play('tap', 0.5);
  };

  // Toggle Micro-Step
  const handleToggleMicroStep = (id: string) => {
    setMicroSteps((prev) =>
      prev.map((step) => {
        if (step.id === id) {
          const nextState = !step.completed;
          if (nextState) chimeEngine.play('bell', 0.6);
          return { ...step, completed: nextState };
        }
        return step;
      })
    );
  };

  if (!isOpen) return null;

  // Visual Math for Circular Countdown Ring
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const progressRatio =
    totalSessionSeconds > 0
      ? Math.max(0, Math.min(1, (totalSessionSeconds - secondsRemaining) / totalSessionSeconds))
      : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const displayHours = Math.floor(secondsRemaining / 3600);
  const displayMinutes = Math.floor((secondsRemaining % 3600) / 60);
  const displaySeconds = secondsRemaining % 60;

  // Dynamic Neuro-Motivational Phrase
  const neuroPhrase = (() => {
    if (secondsRemaining === 0) return 'پایان موفق دوره تمرکز • زمان ریکاوری و تنفس';
    if (!isRunning) return 'جلسه در حالت مکث • آماده برای بازگشت به جریان عمیق';
    if (progressRatio < 0.2) return 'فاز خروج از اصطکاک اولیه • تمرکز روی تک‌تسکینگ';
    if (progressRatio < 0.7) return 'جریان تمرکز عمیق (Flow State) • راندمان شناختی بالا';
    return 'مرحله نهایی تثبیت دوپامین • اتمام مقتدرانه تسک';
  })();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-y-auto backdrop-blur-2xl animate-fade-in font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Ambient Aura */}
      <div
        className="fixed inset-0 opacity-25 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${accentColor} 0%, transparent 65%)`,
        }}
      />

      {/* TOP BAR */}
      <header className="relative z-10 max-w-6xl w-full mx-auto p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-white/10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
            <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                حالت تمرکز عمیق (Deep Focus)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                سیستم ضد باگ ایزوله
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {liveStatus.currentDayFa} • ساعت سیستم: {toFaDigits(minutesToTimeString(wallClock.getHours() * 60 + wallClock.getMinutes()))}
            </p>
          </div>
        </div>

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Breathing Guide Button */}
          <button
            type="button"
            onClick={() => setBreathingGuideActive(!breathingGuideActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              breathingGuideActive
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="راهنمای تنفس آرام‌بخش ۴-۷-۸ جهت تنظیم امواج مغزی"
          >
            <Wind className={`w-3.5 h-3.5 ${breathingGuideActive ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تنفس ۴-۷-۸</span>
          </button>

          {/* Micro-Steps Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowMicroSteps(!showMicroSteps)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              showMicroSteps
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="فهرست گام‌های خرد تسک جاری"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">گام‌های خرد</span>
            {microSteps.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-white/20">
                {toFaDigits(microSteps.filter((s) => s.completed).length)}/
                {toFaDigits(microSteps.length)}
              </span>
            )}
          </button>

          {/* Ambient Sound Bar */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => handleToggleAmbient('rain')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                ambientMode === 'rain'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="صدای باران آرامش‌بخش"
            >
              <CloudRain className="w-3 h-3" />
              <span>باران</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAmbient('alpha432')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                ambientMode === 'alpha432'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="امواج آلفا ۴۳۲ هرتز تمرکز"
            >
              <Radio className="w-3 h-3" />
              <span>امواج ۴۳۲</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAmbient('whitenoise')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                ambientMode === 'whitenoise'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="نویز سفید ضد حواس‌پرتی"
            >
              <Headphones className="w-3 h-3" />
              <span>نویز سفید</span>
            </button>
            {ambientMode !== 'none' && (
              <button
                type="button"
                onClick={() => handleToggleAmbient('none')}
                className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20"
                title="قطع صدا"
              >
                <VolumeX className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'خروج از تمام‌صفحه (F)' : 'حالت تمام‌صفحه بدون حواس‌پرتی (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="خروج از حالت تمرکز (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col items-center justify-center my-auto">
        {/* TASK SELECTOR STRIP: Switch seamlessly between active block, any task from schedule, or custom pomodoros */}
        <div className="w-full max-w-xl mb-6 flex flex-wrap items-center justify-center gap-2 select-none">
          <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex items-center gap-1.5 flex-wrap justify-center">
            {liveStatus.activeBlock && (
              <button
                type="button"
                onClick={() => handleSelectTarget(liveStatus.activeBlock!.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBlockId === liveStatus.activeBlock.id
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>تسک جاری ({liveStatus.activeBlock.title})</span>
              </button>
            )}

            {[
              { label: '۲۵ دقیقه (استاندارد)', mins: 25 },
              { label: '۵۰ دقیقه (عمیق)', mins: 50 },
              { label: '۹۰ دقیقه (چرخه اولترادین)', mins: 90 },
            ].map((p) => (
              <button
                key={p.mins}
                type="button"
                onClick={() => handleSelectTarget('custom', p.mins)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBlockId === 'custom' && customPresetMinutes === p.mins
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* TASK BANNER (If targeting a scheduled block) */}
        {currentTargetBlock && (
          <div className="mb-4 text-center animate-fade-in max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-slate-200 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <span>{categoryTheme?.label.split('(')[0]}</span>
              <span>•</span>
              <span>
                {toFaDigits(minutesToTimeString(currentTargetBlock.startMinutes))} تا{' '}
                {toFaDigits(minutesToTimeString(currentTargetBlock.startMinutes + currentTargetBlock.durationMinutes))}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentTargetBlock.title}
            </h1>
            {currentTargetBlock.subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                {currentTargetBlock.subtitle}
              </p>
            )}
          </div>
        )}

        {/* 4-7-8 BREATHING COACH OVERLAY (If active) */}
        {breathingGuideActive && (
          <div className="mb-6 flex flex-col items-center animate-fade-in">
            <div
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-1000 ${
                breathingPhase === 'inhale'
                  ? 'scale-110 bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-500/30'
                  : breathingPhase === 'hold'
                  ? 'scale-110 bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'scale-90 bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/20'
              }`}
            >
              <Wind className="w-6 h-6 text-teal-300 mb-1 animate-pulse" />
              <span className="text-xs font-black text-white">
                {breathingPhase === 'inhale'
                  ? 'دم آرام'
                  : breathingPhase === 'hold'
                  ? 'حبس نفس'
                  : 'بازدم عمیق'}
              </span>
              <span className="text-xs font-mono font-bold text-teal-200">
                {toFaDigits(breathingSecondsLeft)}
              </span>
            </div>
          </div>
        )}

        {/* THE MASTER CLOCK: Jitter-Free Circular Countdown with Neon Aura */}
        <div className="relative flex items-center justify-center my-2 select-none">
          {/* Animated SVG Ring */}
          <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform drop-shadow-2xl">
            {/* Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-white/10"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Smooth Dynamic Progress Indicator */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={accentColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 12px ${accentColor}80)`,
              }}
            />
          </svg>

          {/* Central Clock Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>زمان باقی‌مانده</span>
            </span>

            {/* Huge Time Digits - Strictly LTR (Hours:Minutes:Seconds) so minutes are on left and seconds on right */}
            <div
              dir="ltr"
              className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white inline-flex flex-row items-center justify-center select-none"
            >
              {displayHours > 0 && (
                <>
                  <span>{toFaDigits(String(displayHours).padStart(2, '0'))}</span>
                  <span className="animate-pulse text-indigo-400 mx-0.5">:</span>
                </>
              )}
              <span>{toFaDigits(String(displayMinutes).padStart(2, '0'))}</span>
              <span className={`mx-0.5 text-indigo-400 ${isRunning ? 'animate-pulse' : ''}`}>:</span>
              <span>{toFaDigits(String(displaySeconds).padStart(2, '0'))}</span>
            </div>

            {/* Percentage Badge */}
            <div className="mt-2.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}
              />
              <span>{toFaDigits(Math.round(progressRatio * 100))}٪ سپری شده</span>
            </div>
          </div>
        </div>

        {/* Motivational Neuro-Phrase Pill */}
        <p className="mt-3 text-xs sm:text-sm font-medium text-slate-300 text-center max-w-md bg-white/5 border border-white/10 px-4 py-1.5 rounded-2xl">
          {neuroPhrase}
        </p>

        {/* MAIN CONTROLS ROW */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 select-none">
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black shadow-xl transition-all cursor-pointer active:scale-95 ${
              !isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            {!isRunning ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{!isRunning ? 'ادامه تایمر (Space)' : 'مکث کوتاه (Space)'}</span>
          </button>

          {/* +5 Minutes Extension */}
          <button
            type="button"
            onClick={() => handleAddMinutes(5)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            title="افزودن ۵ دقیقه زمان به این جلسه"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+۵ دقیقه وقت</span>
          </button>

          {/* Reset Session */}
          <button
            type="button"
            onClick={handleResetSession}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="شروع مجدد همین جلسه"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mark Block Completed */}
          <button
            type="button"
            onClick={handleMarkComplete}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            title="ثبت موفقیت‌آمیز اتمام تسک"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>تکمیل موفق تسک</span>
          </button>
        </div>

        {/* MICRO-STEPS CHECKLIST DRAWER */}
        {showMicroSteps && (
          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 animate-fade-in text-right">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-amber-400" />
                <span>گام‌های خرد تسک جاری (غالب بر اهمال‌کاری)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {toFaDigits(microSteps.filter((s) => s.completed).length)} /{' '}
                {toFaDigits(microSteps.length)}
              </span>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
              {microSteps.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  هنوز گام خردی ثبت نشده. تسک خود را به ۲ یا ۳ خرده‌اقدام ساده بشکنید.
                </p>
              )}
              {microSteps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => handleToggleMicroStep(step.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    step.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => {}}
                    className="rounded accent-emerald-500"
                  />
                  <span className="flex-1 truncate">{step.text}</span>
                </div>
              ))}
            </div>

            {/* Add Input */}
            <form onSubmit={handleAddMicroStep} className="flex items-center gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="گام بعدی (مثلاً: مطالعه ۵ صفحه اول)..."
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ثبت
              </button>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER BAR: Quick Next Block Preview & Audio Volume */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/10 select-none">
        {/* Next Block Info */}
        <div className="flex items-center gap-2">
          {liveStatus.nextBlock ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">فعالیت بعدی:</span>
              <span className="font-bold text-slate-200">{liveStatus.nextBlock.title}</span>
              <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-indigo-300">
                {toFaDigits(minutesToTimeString(liveStatus.nextBlock.startMinutes))}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>تمام برنامه‌های امروز با ریتم بهینه چیده شده‌اند.</span>
            </div>
          )}
        </div>

        {/* Audio Volume Slider */}
        {ambientMode !== 'none' && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
              title="میزان صدای محیطی"
            />
          </div>
        )}

        {/* Keyboard hints */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
          <span>کلید Space: مکث/ادامه</span>
          <span>•</span>
          <span>کلید F: تمام‌صفحه</span>
          <span>•</span>
          <span>کلید Esc: خروج</span>
        </div>
      </footer>
    </div>
  );
};
