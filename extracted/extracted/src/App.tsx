import React, { useState, useEffect, useCallback } from 'react';
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
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'anti_fragile_timeboxing_planner_v2';

export default function App() {
  // State
  const [plannerTitle, setPlannerTitle] = useState<string>(
    'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)'
  );
  const [weekRange, setWeekRange] = useState<string>(
    'اسپرینت لینوکس و مدل‌سازی یادگیری عمیق'
  );
  const [templates, setTemplates] = useState<BlockTemplate[]>(INITIAL_TEMPLATES);
  const [blocks, setBlocks] = useState<TimeBlock[]>(INITIAL_SAMPLE_BLOCKS);

  // Modals & Drawers
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<BlockTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLateShiftOpen, setIsLateShiftOpen] = useState(false);
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

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
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
      console.error('Failed to save to localStorage', e);
    }
  }, [plannerTitle, weekRange, blocks, templates]);

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

    setBlocks((prev) => [...prev, newBlock]);
    showToast(`«${template.title}» با موفقیت به جدول اضافه شد.`);
  };

  // Moving existing block
  const handleMoveBlock = (
    blockId: string,
    targetDay: DayKey,
    newStartMinutes: number
  ) => {
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
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, completed: !b.completed } : b))
    );
  };

  // Deleting block
  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    showToast('بلوک زمانی حذف گردید.', 'info');
  };

  // Duplicate block to another day
  const handleDuplicateBlock = (sourceBlock: TimeBlock, targetDay: DayKey) => {
    const duplicated: TimeBlock = {
      ...sourceBlock,
      id: `block-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      day: targetDay,
      completed: false,
    };
    setBlocks((prev) => [...prev, duplicated]);
    showToast(`بلوک با موفقیت در روز جدید کپی شد.`);
  };

  // Quick Add from sidebar to Saturday 09:00 or current
  const handleQuickAdd = (template: BlockTemplate) => {
    handleDropNewBlock('sat', 9 * 60, template);
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

  // Intercept Ctrl+P / Cmd+P to open the Print Modal, and F/Esc to toggle fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
        return;
      }

      // Check if user is typing in an input or textarea
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

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
  }, []);

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
          />
        </div>
      )}

      {/* Top Header with Daily Report, Special Weekly Report & AI JSON buttons */}
      <Header
        plannerTitle={plannerTitle}
        onUpdateTitle={setPlannerTitle}
        weekRange={weekRange}
        onUpdateWeekRange={setWeekRange}
        onSaveJSON={() => setIsJsonModalOpen(true)}
        onLoadJSON={() => setIsJsonModalOpen(true)}
        onPrint={() => setIsPrintModalOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
        onOpenSpecialReport={() => setIsSpecialReportOpen(true)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenOfflineExport={() => setIsOfflineModalOpen(true)}
        onResetSample={handleResetSample}
        onClearAll={handleClearAll}
        onOpenLateShift={() => setIsLateShiftOpen(true)}
        onToggleStats={() => setShowStats(!showStats)}
        showStats={showStats}
        isFullscreen={isFullscreenGrid}
        onToggleFullscreen={() => setIsFullscreenGrid((prev) => !prev)}
      />

      {/* Week Balance Neuro Dashboard (Collapsible) */}
      <WeekStats
        blocks={blocks}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
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
          plannerTitle={plannerTitle}
          weekRange={weekRange}
          isFullscreen={false}
          onToggleFullscreen={() => setIsFullscreenGrid(true)}
          onOpenInsertBreak={(b) => {
            setBreakTargetBlock(b);
            setIsInsertBreakOpen(true);
          }}
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
