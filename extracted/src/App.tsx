import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TimeBlock, BlockTemplate, DayKey, PlannerData } from './types';
import {
  INITIAL_TEMPLATES,
  INITIAL_SAMPLE_BLOCKS,
  START_HOUR,
  END_HOUR,
  SLOT_INTERVAL,
} from './constants/plannerConfig';
import { Header } from './components/Header';
import { SidebarBank } from './components/SidebarBank';
import { TimeGrid } from './components/TimeGrid';
import { BlockModal } from './components/BlockModal';
import { LateShiftModal } from './components/LateShiftModal';
import { WeekStats } from './components/WeekStats';
import { TemplateModal } from './components/TemplateModal';
import { PrintModal } from './components/PrintModal';
import { JsonModal } from './components/JsonModal';
import { DailyReportModal } from './components/DailyReportModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { OfflineExportModal } from './components/OfflineExportModal';
import { SpecialWeeklyReportModal } from './components/SpecialWeeklyReportModal';
import { InsertBreakModal } from './components/InsertBreakModal';
import { EmergencyRecoveryModal } from './components/EmergencyRecoveryModal';
import { JalaliCalendarModal } from './components/JalaliCalendarModal';
import { CreateNewWeekModal } from './components/CreateNewWeekModal';
import { TutorialModal } from './components/TutorialModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { DailyAuditHistoryModal } from './components/DailyAuditHistoryModal';
import { QuickAddSlotModal } from './components/QuickAddSlotModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { FocusModeModal } from './components/FocusModeModal';
import { ConflictResolverModal } from './components/ConflictResolverModal';
import { AiPlannerModal, AiAction } from './components/AiPlannerModal';
import { normalizeAction } from './utils/aiActionNormalizer';
import { findAllConflicts } from './utils/conflictResolver';
import { getLiveScheduleStatus } from './utils/liveScheduleEngine';
import { reminderService } from './services/reminderService';
import { PlannerStorageService } from './services/plannerStorage';
import { formatWeekRangeFa, getWeekId, getSaturdayOfWeek, formatJalaliDateFa } from './utils/jalaliCalendar';
import { DailyLifecycleGates } from './components/DailyLifecycleGates';
import { isAnchorBlock, smartCollapseGapsForDay } from './utils/timeCollisionEngine';
import { DAYS, toFaDigits } from './constants/plannerConfig';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'anti_fragile_timeboxing_planner_v2';

export default function App() {
  // Shamsi Week & Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isCreateWeekModalOpen, setIsCreateWeekModalOpen] = useState(false);
  const [targetCreateDate, setTargetCreateDate] = useState<Date>(() => new Date());

  // Current active Persian day key based on real-time clock
  const currentDayKey = useMemo<DayKey>(() => {
    const dayMap: Record<number, DayKey> = {
      6: 'sat',
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
    };
    return dayMap[new Date().getDay()] || 'sat';
  }, []);

  // State
  const [plannerTitle, setPlannerTitle] = useState<string>(
    'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)'
  );
  const [weekRange, setWeekRange] = useState<string>(
    formatWeekRangeFa(new Date())
  );
  const [templates, setTemplates] = useState<BlockTemplate[]>(INITIAL_TEMPLATES);
  const [blocks, setBlocks] = useState<TimeBlock[]>(INITIAL_SAMPLE_BLOCKS);

  // Undo / Redo State Stack (Professional Anti-Fragile History Engine)
  const [history, setHistory] = useState<TimeBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<TimeBlock[][]>([]);

  // Modals & Drawers
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<BlockTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLateShiftOpen, setIsLateShiftOpen] = useState(false);
  const [isEmergencyRecoveryOpen, setIsEmergencyRecoveryOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [isSpecialReportOpen, setIsSpecialReportOpen] = useState(false);
  const [isInsertBreakOpen, setIsInsertBreakOpen] = useState(false);
  const [breakTargetBlock, setBreakTargetBlock] = useState<TimeBlock | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [isFullscreenGrid, setIsFullscreenGrid] = useState(false);

  // New Requested Feature States
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isAuditHistoryOpen, setIsAuditHistoryOpen] = useState(false);
  const [isDatabaseSettingsOpen, setIsDatabaseSettingsOpen] = useState(false);
  const [quickAddSlotInfo, setQuickAddSlotInfo] = useState<{ day: DayKey; startMinutes: number } | null>(null);

  // Focus Mode & Smart Conflict Resolver State
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isConflictResolverOpen, setIsConflictResolverOpen] = useState(false);
  const [isAiPlannerOpen, setIsAiPlannerOpen] = useState(false);
  const [conflictDayFilter, setConflictDayFilter] = useState<DayKey | undefined>(undefined);

  // Daily Lifecycle Rituals
  const [isOpenMorningBriefing, setIsOpenMorningBriefing] = useState(false);
  const [isOpenEveningRitual, setIsOpenEveningRitual] = useState(false);

  // Smart Gap-Collapse & Auto-Shift Prompt
  const [gapCollapsePrompt, setGapCollapsePrompt] = useState<{
    day: DayKey;
    dayNameFa: string;
    gapStartMinutes: number;
    freedDurationMinutes: number;
    affectedCount: number;
  } | null>(null);

  // Live Schedule & Conflicts Tracking (Real-time reactive calculation)
  const conflicts = useMemo(() => findAllConflicts(blocks), [blocks]);
  const liveStatus = useMemo(() => getLiveScheduleStatus(blocks), [blocks]);

  const [slotInterval, setSlotInterval] = useState<number>(() => {
    try {
      const s = localStorage.getItem('timegrid_slot_interval');
      return s ? Number(s) : 30;
    } catch {
      return 30;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('planner_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('planner_theme', next);
      } catch {}
      return next;
    });
  }, []);

  const handleToggleSlotInterval = useCallback(() => {
    setSlotInterval((prev) => {
      const next = prev === 30 ? 15 : 30;
      try {
        localStorage.setItem('timegrid_slot_interval', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 3500);
    },
    []
  );

  // Push Snapshot to Undo History Stack (Max 35 states)
  const pushHistory = useCallback((currentBlocks: TimeBlock[]) => {
    setHistory((prev) => {
      const next = [...prev, currentBlocks];
      if (next.length > 35) return next.slice(next.length - 35);
      return next;
    });
    setRedoStack([]); // Clear redo upon new user mutation
  }, []);

  // Database Management Actions
  const handleClearDatabase = useCallback(() => {
    PlannerStorageService.clear();
    setBlocks([]);
    setTemplates(INITIAL_TEMPLATES);
    showToast('کل پایگاه داده پاک‌سازی شد و به وضعیت اولیه برگشت.', 'warn');
  }, [showToast]);

  const handleClearCurrentWeek = useCallback(() => {
    pushHistory(blocks);
    setBlocks([]);
    PlannerStorageService.saveBlocks([]);
    showToast('بلوک‌های هفته جاری با موفقیت پاک شدند.', 'info');
  }, [blocks, pushHistory, showToast]);

  const handleLoadWeekFromDB = useCallback(
    (targetWeekId: string) => {
      const newState = PlannerStorageService.switchActiveWeek(targetWeekId);
      setBlocks(newState.blocks || []);
      setPlannerTitle(newState.title);
      setWeekRange(newState.weekRange);
      const activeWeek = (newState.weeks || {})[targetWeekId];
      if (activeWeek?.saturdayDate) {
        setCurrentDate(new Date(activeWeek.saturdayDate));
      }
      showToast(`هفته «${newState.title}» با موفقیت فعال شد.`, 'success');
    },
    [showToast]
  );

  const handleDeleteWeekFromDB = useCallback(
    (targetWeekId: string) => {
      const success = PlannerStorageService.deleteSavedWeek(targetWeekId);
      if (success) {
        const state = PlannerStorageService.loadSync();
        setBlocks(state.blocks || []);
        setPlannerTitle(state.title);
        setWeekRange(state.weekRange);
        showToast('هفته مورد نظر با موفقیت از پایگاه داده حذف شد.', 'info');
      }
    },
    [showToast]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (history.length === 0) {
      showToast('عملی برای بازگشت (Undo) وجود ندارد.', 'info');
      return;
    }
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, blocks]);
    setBlocks(previous);
    PlannerStorageService.saveBlocks(previous);
    showToast('آخرین تغییر با موفقیت بازگردانده شد (Undo).', 'info');
  }, [history, blocks, showToast]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) {
      showToast('عملی برای پیش‌روی (Redo) وجود ندارد.', 'info');
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistory((prev) => [...prev, blocks]);
    setBlocks(next);
    PlannerStorageService.saveBlocks(next);
    showToast('تغییر مجدداً اعمال شد (Redo).', 'info');
  }, [redoStack, blocks, showToast]);

  // Emergency Recovery Plan Application
  const handleApplyEmergencyRecovery = useCallback(
    (newBlocks: TimeBlock[], message: string) => {
      pushHistory(blocks);
      setBlocks(newBlocks);
      PlannerStorageService.saveBlocks(newBlocks);
      showToast(message, 'success');
      setIsEmergencyRecoveryOpen(false);
    },
    [blocks, pushHistory, showToast]
  );

  // Load from LocalStorage on mount (with automatic sanitation of old gaming/ps4 references)
  useEffect(() => {
    const sanitizeBlock = (b: TimeBlock): TimeBlock => {
      if (b.title.includes('بازی') || b.title.toLowerCase().includes('ps4')) {
        return {
          ...b,
          title: 'استراحت و رفرش ذهن',
          subtitle: 'پیاده‌روی، چای و استراحت چشم',
          category: 'gaming',
        };
      }
      return b;
    };

    const sanitizeTemplate = (t: BlockTemplate): BlockTemplate => {
      if (t.title.includes('بازی') || t.title.toLowerCase().includes('ps4')) {
        return {
          ...t,
          title: 'استراحت و رفرش ذهن',
          subtitle: 'پیاده‌روی، چای، استراحت چشم و کشش بدنی',
          description: 'آرامش و رهایی از خستگی بعد از بلوک کاری عمیق',
          category: 'gaming',
        };
      }
      return t;
    };

    try {
      // First try robust PlannerStorageService (v3 with multi-week & IndexedDB)
      const fullState = PlannerStorageService.loadSync();
      if (fullState && fullState.blocks && Array.isArray(fullState.blocks)) {
        setBlocks(fullState.blocks.map(sanitizeBlock));
        if (fullState.title) setPlannerTitle(fullState.title);
        if (fullState.weekRange) setWeekRange(fullState.weekRange);
        if (fullState.templates && Array.isArray(fullState.templates)) {
          setTemplates(fullState.templates.map(sanitizeTemplate));
        }
        return;
      }

      // Fallback: check legacy v2 storage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          setBlocks(parsed.blocks.map(sanitizeBlock));
        }
        if (parsed.title) {
          setPlannerTitle(parsed.title);
        }
        if (parsed.weekRange) {
          setWeekRange(parsed.weekRange);
        }
        if (parsed.templates && Array.isArray(parsed.templates)) {
          setTemplates(parsed.templates.map(sanitizeTemplate));
        } else if (parsed.customTemplates && Array.isArray(parsed.customTemplates)) {
          const customIds = new Set(parsed.customTemplates.map((t: BlockTemplate) => t.id));
          const merged = [
            ...INITIAL_TEMPLATES.filter((t) => !customIds.has(t.id)),
            ...parsed.customTemplates,
          ];
          setTemplates(merged.map(sanitizeTemplate));
        }
      }
    } catch (e) {
      console.warn('Could not parse saved planner data from localStorage', e);
    }
  }, []);

  // Save to Storage on changes (Both multi-week V3 and legacy V2 fallback)
  useEffect(() => {
    try {
      PlannerStorageService.saveCurrentWeekState({
        title: plannerTitle,
        weekRange,
        blocks,
        templates,
        date: currentDate,
      });

      const dataToSave = {
        version: '2.0.0',
        title: plannerTitle,
        weekRange,
        updatedAt: new Date().toISOString(),
        blocks,
        templates,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save planner state', e);
    }
  }, [plannerTitle, weekRange, blocks, templates, currentDate]);

  // Audio Reminders Synchronization
  useEffect(() => {
    reminderService.init(blocks, (alert) => {
      showToast(`🔔 ${alert.title} (${alert.timeString})`, 'info');
    });
    return () => reminderService.destroy();
  }, [blocks, showToast]);

  // Fail-Safe Sleep/Wake & Visibility Recalibration
  useEffect(() => {
    const handleWakeAndSync = () => {
      setCurrentDate(new Date());
    };

    document.addEventListener('visibilitychange', handleWakeAndSync);
    window.addEventListener('pageshow', handleWakeAndSync);
    window.addEventListener('focus', handleWakeAndSync);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeAndSync);
      window.removeEventListener('pageshow', handleWakeAndSync);
      window.removeEventListener('focus', handleWakeAndSync);
    };
  }, []);

  // Handle switching active week via Jalali Calendar
  const handleSelectWeekDate = useCallback((date: Date) => {
    setCurrentDate(date);
    const newState = PlannerStorageService.switchActiveWeek(date);
    setBlocks(newState.blocks);
    setPlannerTitle(newState.title);
    setWeekRange(newState.weekRange);
    showToast(`برنامه هفته «${newState.weekRange}» با موفقیت بارگذاری شد.`, 'success');
  }, [showToast]);

  // Handle previous week navigation (-7 days)
  const handlePrevWeek = useCallback(() => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 7);
    handleSelectWeekDate(prevDate);
  }, [currentDate, handleSelectWeekDate]);

  // Handle next week navigation (+7 days)
  const handleNextWeek = useCallback(() => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 7);
    handleSelectWeekDate(nextDate);
  }, [currentDate, handleSelectWeekDate]);

  // Handle opening create week modal
  const handleOpenCreateWeek = useCallback((date?: Date) => {
    const target = date || new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    setTargetCreateDate(target);
    setIsCreateWeekModalOpen(true);
  }, [currentDate]);

  // Handle confirming new week creation
  const handleConfirmCreateWeek = useCallback((params: {
    targetDate: Date;
    title: string;
    weekRange: string;
    copyRoutineFromCurrent: boolean;
  }) => {
    pushHistory(blocks);
    const newState = PlannerStorageService.createNewWeek(params);
    setCurrentDate(params.targetDate);
    setBlocks(newState.blocks);
    setPlannerTitle(newState.title);
    setWeekRange(newState.weekRange);
    showToast(
      params.copyRoutineFromCurrent
        ? 'هفته جدید با شبیه‌سازی هوشمند روتین هفتگی ایجاد شد.'
        : 'هفته کاری جدید با برگه خالی ایجاد شد.',
      'success'
    );
  }, [blocks, pushHistory, showToast]);

  // Dragging template from sidebar bank
  const handleDragStartTemplate = (
    e: React.DragEvent,
    template: BlockTemplate
  ) => {
    e.dataTransfer.setData('text/template-data', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Dropping template into grid
  const handleDropNewBlock = (
    day: DayKey,
    startMinutes: number,
    template: BlockTemplate
  ) => {
    const snappedMinutes =
      Math.round(startMinutes / SLOT_INTERVAL) * SLOT_INTERVAL;
    const maxAvailableMinutes = END_HOUR * 60 - snappedMinutes;
    const durationMinutes = Math.min(
      template.defaultDuration,
      Math.max(30, maxAvailableMinutes)
    );

    const newBlock: TimeBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      day,
      startMinutes: snappedMinutes,
      durationMinutes,
      title: template.title,
      subtitle: template.subtitle,
      category: template.category,
      note: template.description,
      completed: false,
    };

    pushHistory(blocks);
    setBlocks((prev) => [...prev, newBlock]);
    showToast(`«${template.title}» با موفقیت به جدول اضافه شد.`);
  };

  // Moving existing block
  const handleMoveBlock = (
    blockId: string,
    targetDay: DayKey,
    newStartMinutes: number
  ) => {
    pushHistory(blocks);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const maxAvailable = END_HOUR * 60 - newStartMinutes;
        const safeDuration = Math.min(b.durationMinutes, Math.max(30, maxAvailable));
        return {
          ...b,
          day: targetDay,
          startMinutes: newStartMinutes,
          durationMinutes: safeDuration,
        };
      })
    );
    showToast('زمان بلوک با موفقیت تغییر یافت.');
  };

  // Resizing block
  const handleResizeBlock = (blockId: string, newDurationMinutes: number) => {
    pushHistory(blocks);
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, durationMinutes: newDurationMinutes } : b
      )
    );
  };

  // Updating block from edit modal (with optional synchronization to all matching blocks)
  const handleUpdateBlock = (
    updatedBlock: TimeBlock,
    updateAllMatching = false,
    originalTitle?: string
  ) => {
    pushHistory(blocks);
    setBlocks((prev) => {
      if (!updateAllMatching) {
        return prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
      }
      const matchTitle = originalTitle || updatedBlock.title;
      return prev.map((b) => {
        if (b.id === updatedBlock.id) return updatedBlock;
        if (b.title === matchTitle) {
          return {
            ...b,
            title: updatedBlock.title,
            subtitle: updatedBlock.subtitle,
            category: updatedBlock.category,
          };
        }
        return b;
      });
    });
    showToast(
      updateAllMatching
        ? `تغییرات روی تمامی بلوک‌های مشابه «${updatedBlock.title}» اعمال گردید.`
        : `تغییرات «${updatedBlock.title}» با موفقیت ذخیره شد.`
    );
  };

  // Toggle completion status of a block
  const handleToggleBlockComplete = (blockId: string) => {
    pushHistory(blocks);
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, completed: !b.completed } : b))
    );
  };

  // Deleting block with intelligent gap-collapse detection
  const handleDeleteBlock = (blockId: string) => {
    const targetBlock = blocks.find((b) => b.id === blockId);
    pushHistory(blocks);
    const updated = blocks.filter((b) => b.id !== blockId);
    setBlocks(updated);
    showToast('بلوک زمانی حذف گردید.', 'info');

    if (targetBlock) {
      const subsequentMovable = updated.filter(
        (b) =>
          b.day === targetBlock.day &&
          b.startMinutes > targetBlock.startMinutes &&
          !isAnchorBlock(b)
      );
      if (subsequentMovable.length > 0) {
        const dObj = DAYS.find((d) => d.id === targetBlock.day);
        setGapCollapsePrompt({
          day: targetBlock.day,
          dayNameFa: dObj?.nameFa || targetBlock.day,
          gapStartMinutes: targetBlock.startMinutes,
          freedDurationMinutes: targetBlock.durationMinutes,
          affectedCount: subsequentMovable.length,
        });
      }
    }
  };

  // 1-Click Gap Collapse & Auto-Shift Execution
  const handleExecuteGapCollapse = () => {
    if (!gapCollapsePrompt) return;
    pushHistory(blocks);
    const { updatedBlocks, shiftedCount } = smartCollapseGapsForDay(
      blocks,
      gapCollapsePrompt.day,
      gapCollapsePrompt.gapStartMinutes,
      gapCollapsePrompt.freedDurationMinutes
    );
    setBlocks(updatedBlocks);
    setGapCollapsePrompt(null);
    showToast(`${toFaDigits(shiftedCount)} تسک به سمت بالا شیفت پیدا کرده و جای خالی پر شد.`);
  };

  // Duplicate block to another day
  const handleDuplicateBlock = (sourceBlock: TimeBlock, targetDay: DayKey) => {
    pushHistory(blocks);
    const duplicated: TimeBlock = {
      ...sourceBlock,
      id: `block-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      day: targetDay,
      completed: false,
    };
    setBlocks((prev) => [...prev, duplicated]);
    showToast(`بلوک با موفقیت در روز جدید کپی شد.`);
  };

  // Quick Add from sidebar to target day with smart empty-gap search
  const handleQuickAdd = (template: BlockTemplate, targetDay?: DayKey) => {
    const day = targetDay || 'sat';
    const dayBlocks = blocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Look for first suitable gap of >= template.defaultDuration
    let candidateStart = 8 * 60; // start looking from 08:00
    for (const b of dayBlocks) {
      if (b.startMinutes >= candidateStart + template.defaultDuration) {
        break; // found gap before this block!
      }
      if (b.startMinutes + b.durationMinutes > candidateStart) {
        candidateStart = b.startMinutes + b.durationMinutes;
      }
    }

    const maxAllowedStart = 24 * 60 - template.defaultDuration;
    const finalStart = Math.min(
      maxAllowedStart,
      Math.max(7 * 60, Math.round(candidateStart / 30) * 30)
    );

    handleDropNewBlock(day, finalStart, template);
  };

  // Swap two blocks with mode selection ('keep_durations' | 'fit_durations')
  const handleSwapBlocks = (
    blockA: TimeBlock,
    blockB: TimeBlock,
    mode: 'keep_durations' | 'fit_durations'
  ) => {
    pushHistory(blocks);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockA.id) {
          return {
            ...b,
            day: blockB.day,
            startMinutes: blockB.startMinutes,
            durationMinutes:
              mode === 'fit_durations' ? blockB.durationMinutes : blockA.durationMinutes,
          };
        }
        if (b.id === blockB.id) {
          return {
            ...b,
            day: blockA.day,
            startMinutes: blockA.startMinutes,
            durationMinutes:
              mode === 'fit_durations' ? blockA.durationMinutes : blockB.durationMinutes,
          };
        }
        return b;
      })
    );
    showToast(
      `بلوک «${blockA.title}» با بلوک «${blockB.title}» با موفقیت جابه‌جا شد.`,
      'success'
    );
  };

  // Apply AI Generated Actions (with Full Undo Stack Protection & Local Persistence)
  const handleApplyAiActions = (actions: AiAction[]) => {
    if (!actions || actions.length === 0) return;
    pushHistory(blocks);
    setBlocks((prev) => {
      let nextBlocks = [...prev];
      let appliedCount = 0;
      for (const rawAct of actions) {
        const act = normalizeAction(rawAct, currentDayKey || 'sat', nextBlocks);
        if (!act) continue;

        if (act.type === 'add_block' && act.day && act.title) {
          const newBlock: TimeBlock = {
            id: act.id || `b_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            day: act.day,
            title: act.title,
            subtitle: act.subtitle || '',
            startMinutes: act.startMinutes ?? 480,
            durationMinutes: act.durationMinutes ?? 60,
            category: act.category || 'work',
            note: act.notes || '',
            completed: false,
          };
          nextBlocks.push(newBlock);
          appliedCount++;
        } else if (act.type === 'update_block' && act.id) {
          nextBlocks = nextBlocks.map((b) => {
            if (b.id === act.id) {
              appliedCount++;
              return {
                ...b,
                day: act.day || b.day,
                title: act.title || b.title,
                subtitle: act.subtitle !== undefined ? act.subtitle : b.subtitle,
                startMinutes:
                  act.startMinutes !== undefined ? act.startMinutes : b.startMinutes,
                durationMinutes:
                  act.durationMinutes !== undefined ? act.durationMinutes : b.durationMinutes,
                category: act.category || b.category,
                note: act.notes !== undefined ? act.notes : b.note,
              };
            }
            return b;
          });
        } else if (act.type === 'delete_block' && act.id) {
          nextBlocks = nextBlocks.filter((b) => b.id !== act.id);
          appliedCount++;
        } else if (act.type === 'clear_day' && act.day) {
          nextBlocks = nextBlocks.filter((b) => b.day !== act.day);
          appliedCount++;
        }
      }
      PlannerStorageService.saveBlocks(nextBlocks);
      if (appliedCount > 0) {
        showToast(`✅ ${appliedCount} تغییر با موفقیت روی جدول زمانی اعمال گردید.`, 'success');
      }
      return nextBlocks;
    });
  };

  // TEMPLATES BANK EDITING CAPABILITIES:
  // 1. Create or Save Template (with optional synchronization to existing schedule blocks)
  const handleSaveTemplate = (
    savedTemplate: BlockTemplate,
    updateMatchingBlocks = false,
    oldTitle?: string
  ) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === savedTemplate.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t));
      }
      return [...prev, savedTemplate];
    });

    if (updateMatchingBlocks) {
      const searchTitle = oldTitle || savedTemplate.title;
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.title === searchTitle) {
            return {
              ...b,
              title: savedTemplate.title,
              subtitle: savedTemplate.subtitle,
              category: savedTemplate.category,
            };
          }
          return b;
        })
      );
      showToast(
        `الگو و تمامی بلوک‌های «${searchTitle}» در جدول با موفقیت به‌روزرسانی شدند.`
      );
    } else {
      showToast(`الگوی «${savedTemplate.title}» در بانک ذخیره شد.`);
    }
  };

  // 2. Open edit modal for a template
  const handleOpenEditTemplate = (template: BlockTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  // 3. Open create new template modal
  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  // 4. Duplicate template in bank
  const handleDuplicateTemplate = (template: BlockTemplate) => {
    const duplicated: BlockTemplate = {
      ...template,
      id: `tmpl-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${template.title} (کپی)`,
    };
    setTemplates((prev) => [...prev, duplicated]);
    showToast(`الگوی «${duplicated.title}» تکثیر شد.`);
  };

  // 5. Delete template from bank
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    showToast('الگو از بانک حذف شد.', 'info');
  };

  // 6. Reset templates to default
  const handleResetDefaultTemplates = () => {
    setTemplates(INITIAL_TEMPLATES);
    showToast('بانک الگوها به وضعیت اولیه بازنشانی شد.');
  };

  // Apply JSON State from JsonModal (AI / Editor / Import)
  const handleApplyJsonState = (newState: {
    title?: string;
    weekRange?: string;
    blocks: TimeBlock[];
    templates?: BlockTemplate[];
  }) => {
    pushHistory(blocks);
    if (newState.title) setPlannerTitle(newState.title);
    if (newState.weekRange) setWeekRange(newState.weekRange);
    setBlocks(newState.blocks);
    if (newState.templates) setTemplates(newState.templates);
  };

  // Late Wake-up Shift Engine (Crucial Anti-Fragile Requirement)
  const handleApplyLateShift = (
    day: DayKey,
    shiftMinutes: number,
    afterMinutes: number
  ) => {
    pushHistory(blocks);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.day !== day || b.startMinutes < afterMinutes) return b;
        const newStart = b.startMinutes + shiftMinutes;
        if (newStart >= END_HOUR * 60) {
          return {
            ...b,
            startMinutes: (END_HOUR - 1) * 60,
            durationMinutes: 30,
          };
        }
        const maxDuration = END_HOUR * 60 - newStart;
        const safeDuration = Math.min(b.durationMinutes, maxDuration);
        return {
          ...b,
          startMinutes: newStart,
          durationMinutes: safeDuration,
        };
      })
    );
    showToast(
      'روز شما با موفقیت شیفت داده شد! به خودت سخت نگیر: ۱ همیشه از ۰ بزرگ‌تره.',
      'success'
    );
  };

  // Reset to sample AI/Software student schedule
  const handleResetSample = () => {
    if (confirm('آیا می‌خواهید برنامه نمونه پیش‌فرض را بارگذاری کنید؟')) {
      pushHistory(blocks);
      setBlocks(INITIAL_SAMPLE_BLOCKS);
      setTemplates(INITIAL_TEMPLATES);
      setPlannerTitle('برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)');
      setWeekRange('اسپرینت لینوکس و مدل‌سازی یادگیری عمیق');
      showToast('برنامه نمونه مهندس هوش مصنوعی با موفقیت بارگذاری شد.');
    }
  };

  // Clear all (Two-step confirmation with mandatory JSON backup safeguard)
  const handleClearAll = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = () => {
    pushHistory(blocks);
    setBlocks([]);
    setIsClearModalOpen(false);
    showToast('تمامی بلوک‌های هفته پاک شدند. پشتیبان JSON در سیستم شما ذخیره گردید.', 'info');
  };

  // Insert smart break into a block (with guaranteed mathematical non-overlapping logic)
  const handleConfirmInsertBreak = (params: {
    originalBlockId: string;
    breakDurationMinutes: number;
    breakPositionMinutes: number;
    breakTitle: string;
    breakSubtitle: string;
    mode: 'split' | 'shift';
  }) => {
    const target = blocks.find((b) => b.id === params.originalBlockId);
    if (!target) return;
    pushHistory(blocks);

    const breakBlock: TimeBlock = {
      id: `break-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      day: target.day,
      startMinutes: target.startMinutes + params.breakPositionMinutes,
      durationMinutes: params.breakDurationMinutes,
      title: params.breakTitle,
      subtitle: params.breakSubtitle,
      category: 'gaming',
      completed: false,
      note: 'استراحت و بازیابی تمرکز ذهنی',
    };

    if (params.mode === 'split') {
      const part1Duration = params.breakPositionMinutes;
      const part2Duration = target.durationMinutes - part1Duration - params.breakDurationMinutes;

      const part1: TimeBlock = {
        ...target,
        id: target.id,
        durationMinutes: part1Duration,
      };

      const newBlocksList: TimeBlock[] = [];
      blocks.forEach((b) => {
        if (b.id === target.id) {
          newBlocksList.push(part1);
          newBlocksList.push(breakBlock);
          if (part2Duration > 0) {
            const part2: TimeBlock = {
              ...target,
              id: `block-part2-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              startMinutes: breakBlock.startMinutes + breakBlock.durationMinutes,
              durationMinutes: part2Duration,
              completed: false,
              subtitle: target.subtitle ? `${target.subtitle} (بخش دوم)` : 'بخش دوم',
            };
            newBlocksList.push(part2);
          }
        } else {
          newBlocksList.push(b);
        }
      });

      setBlocks(newBlocksList);
      showToast(`استراحت ${params.breakDurationMinutes} دقیقه‌ای با حفظ دقیق ساعات در جدول درج شد.`);
    } else {
      // shift mode
      const breakStart = target.startMinutes + target.durationMinutes;
      breakBlock.startMinutes = breakStart;

      const updatedBlocks = blocks.map((b) => {
        if (b.day === target.day && b.id !== target.id && b.startMinutes >= breakStart) {
          return {
            ...b,
            startMinutes: b.startMinutes + params.breakDurationMinutes,
          };
        }
        return b;
      });

      setBlocks([...updatedBlocks, breakBlock]);
      showToast(`استراحت ${params.breakDurationMinutes} دقیقه‌ای درج و برنامه‌های پس از آن به جلو شیفت داده شدند.`);
    }
  };

  // Intercept keyboard shortcuts: Ctrl+P (Print), Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo), F/Esc (Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // Undo / Redo Shortcuts (Works globally)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (!isInputActive) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        if (!isInputActive) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
        return;
      }

      if (!isInputActive) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setIsFullscreenGrid((prev) => !prev);
        } else if (e.key === 'Escape') {
          setIsFullscreenGrid(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 text-slate-900 font-['Vazirmatn',sans-serif]">
      {/* Dedicated Fullscreen Grid Mode (User requested: ONLY the schedule table occupying the entire screen) */}
      {isFullscreenGrid && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden">
          <TimeGrid
            blocks={blocks}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onSelectBlock={(b) => setSelectedBlock(b)}
            onDropNewBlock={handleDropNewBlock}
            onMoveBlock={handleMoveBlock}
            onResizeBlock={handleResizeBlock}
            plannerTitle={plannerTitle}
            weekRange={weekRange}
            isFullscreen={true}
            onToggleFullscreen={() => setIsFullscreenGrid(false)}
            onOpenInsertBreak={(b) => {
              setBreakTargetBlock(b);
              setIsInsertBreakOpen(true);
            }}
            currentDate={currentDate}
            onOpenCalendar={() => setIsCalendarModalOpen(true)}
          />
        </div>
      )}

      {/* Top Header with Daily Report, Special Weekly Report & AI JSON buttons */}
      <Header
        plannerTitle={plannerTitle}
        onUpdateTitle={setPlannerTitle}
        weekRange={weekRange}
        onUpdateWeekRange={setWeekRange}
        onSaveJSON={() => {
          const dataToSave = {
            version: '3.0.0',
            title: plannerTitle,
            weekRange,
            updatedAt: new Date().toISOString(),
            blocks,
            templates,
          };
          const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `anti-fragile-planner-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('فایل برنامه با موفقیت دانلود شد.', 'success');
        }}
        onLoadJSON={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = e.target?.result as string;
              const parsed = JSON.parse(content);
              handleApplyJsonState(parsed);
              showToast('فایل برنامه با موفقیت بارگذاری شد.', 'success');
            } catch {
              showToast('خطا در خواندن فایل JSON', 'warn');
            }
          };
          reader.readAsText(file);
        }}
        onPrint={() => setIsPrintModalOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
        onOpenSpecialReport={() => setIsSpecialReportOpen(true)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenOfflineExport={() => setIsOfflineModalOpen(true)}
        onResetSample={handleResetSample}
        onClearAll={handleClearAll}
        onOpenLateShift={() => setIsLateShiftOpen(true)}
        onOpenEmergencyRecovery={() => setIsEmergencyRecoveryOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenReminderSettings={() => setIsReminderSettingsOpen(true)}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onOpenAuditHistory={() => setIsAuditHistoryOpen(true)}
        onOpenDatabaseSettings={() => setIsDatabaseSettingsOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
        onOpenConflictResolver={() => {
          setConflictDayFilter(undefined);
          setIsConflictResolverOpen(true);
        }}
        conflictsCount={conflicts.length}
        activeBlockTitle={liveStatus.activeBlock?.title}
        totalBlocksCount={blocks.length}
        slotInterval={slotInterval}
        onToggleSlotInterval={handleToggleSlotInterval}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onToggleStats={() => setShowStats(!showStats)}
        showStats={showStats}
        isFullscreen={isFullscreenGrid}
        onToggleFullscreen={() => setIsFullscreenGrid((prev) => !prev)}
        currentDate={currentDate}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenCreateWeek={() => handleOpenCreateWeek()}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        savedWeeksCount={PlannerStorageService.getAllSavedWeekIds().length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenMorningBriefing={() => setIsOpenMorningBriefing(true)}
        onOpenEveningRitual={() => setIsOpenEveningRitual(true)}
      />

      {/* Week Balance Neuro Dashboard (Collapsible) */}
      <WeekStats
        blocks={blocks}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        theme={theme}
      />

      {/* Main Workspace: Sidebar Bank + Time Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar Bank of Blocks (Fully Editable) */}
        <SidebarBank
          templates={templates}
          onOpenCreateTemplate={handleOpenCreateTemplate}
          onEditTemplate={handleOpenEditTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onResetDefaultTemplates={handleResetDefaultTemplates}
          onQuickAdd={handleQuickAdd}
          onDragStartTemplate={handleDragStartTemplate}
        />

        {/* 7-Day Timeboxing Grid Canvas */}
        <TimeGrid
          blocks={blocks}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onSelectBlock={(b) => setSelectedBlock(b)}
          onDropNewBlock={handleDropNewBlock}
          onMoveBlock={handleMoveBlock}
          onResizeBlock={handleResizeBlock}
          onSwapBlocks={handleSwapBlocks}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          isFullscreen={isFullscreenGrid}
          onToggleFullscreen={() => setIsFullscreenGrid(!isFullscreenGrid)}
          onOpenInsertBreak={(b) => {
            setBreakTargetBlock(b);
            setIsInsertBreakOpen(true);
          }}
          currentDate={currentDate}
          onOpenCalendar={() => setIsCalendarModalOpen(true)}
          slotInterval={slotInterval}
          onSlotClick={(day, startMinutes) => {
            setQuickAddSlotInfo({ day, startMinutes });
          }}
          onOpenConflictResolver={(day) => {
            setConflictDayFilter(day);
            setIsConflictResolverOpen(true);
          }}
          onOpenFocusMode={() => setIsFocusModeOpen(true)}
          activeBlockId={liveStatus.activeBlock?.id}
          currentDayKey={liveStatus.currentDayKey}
          onShowToast={showToast}
        />
      </div>

      {/* Block Edit Modal */}
      {selectedBlock && (
        <BlockModal
          key={selectedBlock.id}
          block={selectedBlock}
          isOpen={true}
          onClose={() => setSelectedBlock(null)}
          onSave={handleUpdateBlock}
          onDelete={handleDeleteBlock}
          onDuplicate={handleDuplicateBlock}
          onOpenInsertBreak={(b) => {
            setBreakTargetBlock(b);
            setIsInsertBreakOpen(true);
          }}
          allBlocks={blocks}
        />
      )}

      {/* Late Wake-up / Forgiving Shift Modal */}
      {isLateShiftOpen && (
        <LateShiftModal
          isOpen={true}
          onClose={() => setIsLateShiftOpen(false)}
          blocks={blocks}
          onApplyShift={handleApplyLateShift}
        />
      )}

      {/* Emergency Recovery & Anti-Fragile Re-scheduler Modal (Scrolled on phone, fatigue, crisis days) */}
      {isEmergencyRecoveryOpen && (
        <EmergencyRecoveryModal
          isOpen={true}
          onClose={() => setIsEmergencyRecoveryOpen(false)}
          blocks={blocks}
          onApplyPlan={handleApplyEmergencyRecovery}
        />
      )}

      {/* Comprehensive Template Modal (Create, Edit, Delete, Duplicate) */}
      {isTemplateModalOpen && (
        <TemplateModal
          isOpen={true}
          templateToEdit={editingTemplate}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSaveTemplate={handleSaveTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
        />
      )}

      {/* Daily Report Modal (Structured Text Briefing + High-DPI PNG Card + At-a-Glance) */}
      {isDailyReportOpen && (
        <DailyReportModal
          isOpen={true}
          onClose={() => setIsDailyReportOpen(false)}
          blocks={blocks}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          onShowToast={showToast}
          onToggleComplete={handleToggleBlockComplete}
        />
      )}

      {/* 2-Step Clear All & Mandatory JSON Backup Safeguard Modal */}
      {isClearModalOpen && (
        <ClearConfirmModal
          isOpen={true}
          onClose={() => setIsClearModalOpen(false)}
          onConfirmClear={handleConfirmClear}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          blocks={blocks}
          templates={templates}
          onShowToast={showToast}
        />
      )}

      {/* Run on Personal Computer / Standalone HTML & Scripts Modal */}
      {isOfflineModalOpen && (
        <OfflineExportModal
          isOpen={true}
          onClose={() => setIsOfflineModalOpen(false)}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          blocks={blocks}
          templates={templates}
          onShowToast={showToast}
        />
      )}

      {/* AI & JSON Architecture Modal (AI Prompts, Live Editor, Validation, Import/Export) */}
      {isJsonModalOpen && (
        <JsonModal
          isOpen={true}
          onClose={() => setIsJsonModalOpen(false)}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          blocks={blocks}
          templates={templates}
          onApplyJsonState={handleApplyJsonState}
          onShowToast={showToast}
        />
      )}

      {/* Professional Print & PDF Export Modal */}
      {isPrintModalOpen && (
        <PrintModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          blocks={blocks}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
        />
      )}

      {/* Special Weekly Activity Intelligence & Card Report Modal */}
      {isSpecialReportOpen && (
        <SpecialWeeklyReportModal
          isOpen={true}
          onClose={() => setIsSpecialReportOpen(false)}
          blocks={blocks}
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          onShowToast={showToast}
          onToggleComplete={handleToggleBlockComplete}
        />
      )}

      {/* Smart Break Insertion Modal (With guaranteed non-overlapping math) */}
      {isInsertBreakOpen && breakTargetBlock && (
        <InsertBreakModal
          isOpen={true}
          block={breakTargetBlock}
          onClose={() => {
            setIsInsertBreakOpen(false);
            setBreakTargetBlock(null);
          }}
          onConfirmBreak={handleConfirmInsertBreak}
        />
      )}

      {/* Persian / Jalali Calendar & Week Selector Modal */}
      <JalaliCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDate={currentDate}
        onSelectWeekDate={handleSelectWeekDate}
        onOpenCreateWeekModal={(targetDate) => {
          setIsCalendarModalOpen(false);
          handleOpenCreateWeek(targetDate);
        }}
        savedWeekIds={PlannerStorageService.getAllSavedWeekIds()}
      />

      {/* Automated Create New Week Modal (Machine Learning Routine Synthesis & Clean Canvas) */}
      <CreateNewWeekModal
        isOpen={isCreateWeekModalOpen}
        onClose={() => setIsCreateWeekModalOpen(false)}
        targetDate={targetCreateDate}
        onConfirmCreate={handleConfirmCreateWeek}
      />

      {/* Interactive Step-by-Step Tutorial & Onboarding Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onShowToast={showToast}
      />

      {/* Audio Chime & Reminder Settings Modal */}
      <ReminderSettingsModal
        isOpen={isReminderSettingsOpen}
        onClose={() => setIsReminderSettingsOpen(false)}
        onShowToast={showToast}
      />

      {/* Custom Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onShowToast={showToast}
      />

      {/* Advanced Daily Audit Reports Database Modal */}
      <DailyAuditHistoryModal
        isOpen={isAuditHistoryOpen}
        onClose={() => setIsAuditHistoryOpen(false)}
        onOpenDailyReportForDay={(day) => {
          setIsDailyReportOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Super Strong Database & Storage Manager Modal */}
      <DatabaseSettingsModal
        isOpen={isDatabaseSettingsOpen}
        onClose={() => setIsDatabaseSettingsOpen(false)}
        totalBlocks={blocks.length}
        totalTemplates={templates.length}
        totalNotes={0}
        onClearDatabase={handleClearDatabase}
        onClearCurrentWeek={handleClearCurrentWeek}
        onLoadWeek={handleLoadWeekFromDB}
        onDeleteWeek={handleDeleteWeekFromDB}
        activeWeekId={getWeekId(currentDate)}
        onDownloadBackup={() => {
          const dataToSave: PlannerData = {
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            plannerTitle,
            weekRange,
            blocks,
            templates,
          };
          const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `anti-fragile-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('فایل پشتیبان کامل با موفقیت دانلود شد.', 'success');
        }}
        onRestoreBackup={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = e.target?.result as string;
              const parsed = JSON.parse(content);
              handleApplyJsonState(parsed);
              showToast('فایل پشتیبان با موفقیت بازیابی شد.', 'success');
            } catch {
              showToast('خطا در خواندن فایل پشتیبان JSON', 'warn');
            }
          };
          reader.readAsText(file);
        }}
        onShowToast={showToast}
        customCategoryColors={{}}
        onUpdateCategoryColor={() => {}}
        onResetCategoryColors={() => {}}
      />

      {/* 1-Click Quick Add Slot Modal */}
      {quickAddSlotInfo && (
        <QuickAddSlotModal
          isOpen={true}
          onClose={() => setQuickAddSlotInfo(null)}
          day={quickAddSlotInfo.day}
          startMinutes={quickAddSlotInfo.startMinutes}
          templates={templates}
          onAddBlock={(newBlock) => {
            const id = 'block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
            const fullBlock: TimeBlock = { ...newBlock, id };
            pushHistory(blocks);
            const updated = [...blocks, fullBlock];
            setBlocks(updated);
            PlannerStorageService.saveBlocks(updated);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Deep Focus Mode Modal (Fullscreen, Live Timer, Voice Guidance, Ambient Sound) */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        blocks={blocks}
        onToggleCompleteBlock={handleToggleBlockComplete}
        onUpdateBlock={handleUpdateBlock}
        onShowToast={showToast}
      />

      {/* Smart Conflict Resolver Modal (Auto 1-Click, Domino Shift, Proportional Compression) */}
      <ConflictResolverModal
        isOpen={isConflictResolverOpen}
        onClose={() => {
          setIsConflictResolverOpen(false);
          setConflictDayFilter(undefined);
        }}
        blocks={blocks}
        onApplyResolvedBlocks={(newBlocks) => {
          pushHistory(blocks);
          setBlocks(newBlocks);
          PlannerStorageService.saveBlocks(newBlocks);
        }}
        onShowToast={showToast}
        initialSelectedDay={conflictDayFilter}
      />

      {/* AI Planner Assistant Modal (Gemini 3.8 Flash, Persistent Memory, One-Click Actions) */}
      <AiPlannerModal
        isOpen={isAiPlannerOpen}
        onClose={() => setIsAiPlannerOpen(false)}
        blocks={blocks}
        onApplyActions={handleApplyAiActions}
        onShowToast={showToast}
        currentDayKey={currentDayKey}
      />

      {/* Daily Lifecycle Gates: Morning Horizon Briefing & Evening Accountability Review */}
      <DailyLifecycleGates
        isOpenMorning={isOpenMorningBriefing}
        isOpenEvening={isOpenEveningRitual}
        onCloseMorning={() => setIsOpenMorningBriefing(false)}
        onCloseEvening={() => setIsOpenEveningRitual(false)}
        todayKey={currentDayKey}
        todayDateFa={formatJalaliDateFa(currentDate)}
        blocks={blocks}
        theme={theme}
        onOpenFocusMode={(b) => {
          setSelectedBlock(b);
          setIsFocusModeOpen(true);
        }}
        onOpenDailyReport={() => {
          setIsDailyReportOpen(true);
        }}
      />

      {/* Floating Smart Gap-Collapse & Auto-Shift Prompt */}
      {gapCollapsePrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-black text-slate-100">
                فضای خالی در روز {gapCollapsePrompt.dayNameFa} ایجاد شد
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                آیا مایلید {toFaDigits(gapCollapsePrompt.affectedCount)} تسک بعدی به بالا شیفت پیدا کنند؟ (برنامه‌های ثابت حفظ می‌شوند)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExecuteGapCollapse}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
            >
              شیفت خودکار
            </button>
            <button
              onClick={() => setGapCollapsePrompt(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="صرف‌نظر"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Reassuring Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 no-print animate-bounce-subtle">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : toast.type === 'warn'
                ? 'bg-amber-900/90 text-white border-amber-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : toast.type === 'warn' ? (
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
