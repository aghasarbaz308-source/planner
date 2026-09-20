import { TimeBlock, BlockTemplate, TimePhaseInfo, WeeklyTaskItem, PlannerData, PlannerRulesConfig, WeeklyPillarsGoals, DailyReportCard } from '../types';
import {
  INITIAL_SAMPLE_BLOCKS,
  INITIAL_TEMPLATES,
  TIME_PHASES as DEFAULT_TIME_PHASES,
} from '../constants/plannerConfig';
import { DEFAULT_PLANNER_RULES, DEFAULT_WEEKLY_GOALS } from '../constants/defaultPlannerRules';
import { getWeekId, formatWeekRangeFa, getSaturdayOfWeek } from '../utils/jalaliCalendar';

const STORAGE_KEY_V3 = 'anti_fragile_timeboxing_planner_v3';
const STORAGE_KEY_V2 = 'anti_fragile_timeboxing_planner_v2';
const STORAGE_KEY_BACKUP = 'anti_fragile_backup_snapshot_v3';
const STORAGE_KEY_CONFIG = 'anti_fragile_storage_config_v3';
const STORAGE_KEY_AUDIT = 'anti_fragile_daily_audit_cards_v1';
const IDB_NAME = 'AntiFragileTimeboxDB';
const IDB_VERSION = 1;
const IDB_STORE = 'planner_state';
const IDB_KEY = 'latest_planner';
const IDB_BACKUP_KEY = 'backup_planner_snapshot';

export interface WeekRecord {
  weekId: string;
  title: string;
  weekRange: string;
  saturdayDate: string; // ISO string
  blocks: TimeBlock[];
  weeklyNotes: WeeklyTaskItem[];
  updatedAt: string;
}

export interface StorageConfig {
  enabled: boolean;
  autoSave: boolean;
  lastSavedAt?: string;
}

export const INITIAL_WEEKLY_NOTES: WeeklyTaskItem[] = [
  {
    id: 'note-1',
    order: 1,
    text: 'تکمیل داکرایز کردن پروژه و کانفیگ CI/CD گیت‌لب',
    completed: false,
    priority: 'high',
    category: 'work',
    note: 'قبل از چهارشنبه باید روی سرور دمو بیاد بالا',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    order: 2,
    text: 'مطالعه و پیاده‌سازی Loss Function سفارشی در پایتورچ',
    completed: false,
    priority: 'high',
    category: 'pytorch',
    note: 'فصل ۳ کتاب Deep Learning with PyTorch',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'note-3',
    order: 3,
    text: 'مرور ۴۰ فلش‌کارت زبان انگلیسی و یادداشت لغات جدید',
    completed: true,
    priority: 'medium',
    category: 'habit',
    note: 'اپلیکیشن لغات تخصصی مهندسی کامپیوتر',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'note-4',
    order: 4,
    text: 'تحویل تمرین هفتگی دانشگاه و هماهنگی با هم‌تیمی‌ها',
    completed: false,
    priority: 'normal',
    category: 'university',
    note: 'ایمیل به استاد تا جمعه ساعت ۲۰:۰۰',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CURRENT_WEEK_ID = getWeekId(new Date());

export interface FullPlannerState {
  title: string;
  weekRange: string;
  blocks: TimeBlock[];
  templates: BlockTemplate[];
  timePhases: TimePhaseInfo[];
  weeklyNotes: WeeklyTaskItem[];
  customCategoryColors: Record<string, string>;
  plannerRules: PlannerRulesConfig;
  weeklyGoals: WeeklyPillarsGoals;
  activeWeekId: string;
  weeks: Record<string, WeekRecord>;
  updatedAt: string;
  version: string;
}

export const DEFAULT_PLANNER_STATE: FullPlannerState = {
  title: 'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)',
  weekRange: formatWeekRangeFa(new Date()),
  blocks: INITIAL_SAMPLE_BLOCKS,
  templates: INITIAL_TEMPLATES,
  timePhases: DEFAULT_TIME_PHASES,
  weeklyNotes: INITIAL_WEEKLY_NOTES,
  customCategoryColors: {},
  plannerRules: DEFAULT_PLANNER_RULES,
  weeklyGoals: DEFAULT_WEEKLY_GOALS,
  activeWeekId: INITIAL_CURRENT_WEEK_ID,
  weeks: {
    [INITIAL_CURRENT_WEEK_ID]: {
      weekId: INITIAL_CURRENT_WEEK_ID,
      title: 'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)',
      weekRange: formatWeekRangeFa(new Date()),
      saturdayDate: getSaturdayOfWeek(new Date()).toISOString(),
      blocks: INITIAL_SAMPLE_BLOCKS,
      weeklyNotes: INITIAL_WEEKLY_NOTES,
      updatedAt: new Date().toISOString(),
    },
  },
  updatedAt: new Date().toISOString(),
  version: '3.0.0',
};

// IndexedDB Helper with native Promises
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDB(data: FullPlannerState): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readwrite');
      const store = transaction.objectStore(IDB_STORE);
      const req = store.put(data, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning (fallback to localStorage is active):', err);
  }
}

async function loadFromIndexedDB(): Promise<FullPlannerState | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
    return null;
  }
}

export class PlannerStorageService {
  private static config: StorageConfig = {
    enabled: true,
    autoSave: true,
  };

  private static debounceTimer: any = null;

  /**
   * Load storage configuration
   */
  public static getConfig(): StorageConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {}
    return this.config;
  }

  public static setConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {}
  }

  /**
   * Synchronous load on initial mount: ensures 0ms render latency and no flash of sample data!
   */
  public static loadSync(): FullPlannerState {
    const cfg = this.getConfig();
    if (!cfg.enabled) {
      return DEFAULT_PLANNER_STATE;
    }

    try {
      // 1. Try v3 storage first
      const rawV3 = localStorage.getItem(STORAGE_KEY_V3);
      if (rawV3) {
        const parsed = JSON.parse(rawV3);
        return this.sanitizeState(parsed);
      }

      // 2. Try durable backup snapshot in localStorage
      const rawBackup = localStorage.getItem(STORAGE_KEY_BACKUP);
      if (rawBackup) {
        const parsed = JSON.parse(rawBackup);
        const restored = this.sanitizeState(parsed);
        // Persist immediately to v3
        this.saveSync(restored);
        return restored;
      }

      // 3. Try legacy v2 storage for seamless backward compatibility
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        const migrated = this.sanitizeState({
          ...DEFAULT_PLANNER_STATE,
          ...parsed,
          blocks: parsed.blocks || DEFAULT_PLANNER_STATE.blocks,
          templates: parsed.templates || parsed.customTemplates || DEFAULT_PLANNER_STATE.templates,
        });
        // Save to v3 immediately
        this.saveSync(migrated);
        return migrated;
      }
    } catch (err) {
      console.error('Failed to load synchronous state from localStorage', err);
    }

    return DEFAULT_PLANNER_STATE;
  }

  /**
   * Asynchronous load from IndexedDB (ideal for checking background updates or secondary verification)
   */
  public static async loadAsync(): Promise<FullPlannerState | null> {
    const fromIdb = await loadFromIndexedDB();
    if (fromIdb) {
      return this.sanitizeState(fromIdb);
    }
    return null;
  }

  /**
   * Save synchronously to localStorage and asynchronously to IndexedDB
   */
  public static save(state: FullPlannerState | PlannerData, immediate = false): void {
    const cfg = this.getConfig();
    if (!cfg.enabled || !cfg.autoSave) return;

    const sanitized = this.sanitizeState(state);
    const payload = {
      ...sanitized,
      updatedAt: new Date().toISOString(),
      version: '3.0.0',
    };

    const doSave = () => {
      try {
        const jsonStr = JSON.stringify(payload);
        // Immediate localStorage sync
        localStorage.setItem(STORAGE_KEY_V3, jsonStr);
        // Duplicate to secondary backup snapshot so data is NEVER lost
        localStorage.setItem(STORAGE_KEY_BACKUP, jsonStr);
        this.setConfig({ lastSavedAt: payload.updatedAt });
      } catch (err) {
        console.error('LocalStorage write error', err);
      }

      // Asynchronous IndexedDB durable commit
      saveToIndexedDB(payload).catch((err) => {
        console.warn('IndexedDB persistence error', err);
      });
    };

    if (immediate) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      doSave();
    } else {
      // Immediate localStorage write for 100% data safety on refresh
      try {
        const jsonStr = JSON.stringify(payload);
        localStorage.setItem(STORAGE_KEY_V3, jsonStr);
        localStorage.setItem(STORAGE_KEY_BACKUP, jsonStr);
      } catch {}
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(doSave, 250);
    }
  }

  public static saveSync(state: FullPlannerState): void {
    this.save(state, true);
  }

  /**
   * Save only blocks into storage while preserving existing state
   */
  public static saveBlocks(blocks: TimeBlock[]): void {
    const currentState = this.loadSync();
    const activeWeekId = currentState.activeWeekId || getWeekId(new Date());
    const updatedWeeks = {
      ...currentState.weeks,
      [activeWeekId]: {
        ...(currentState.weeks[activeWeekId] || {
          weekId: activeWeekId,
          title: currentState.title,
          weekRange: currentState.weekRange,
          saturdayDate: getSaturdayOfWeek(new Date()).toISOString(),
          weeklyNotes: currentState.weeklyNotes,
          updatedAt: new Date().toISOString(),
        }),
        blocks,
        updatedAt: new Date().toISOString(),
      },
    };

    this.save(
      {
        ...currentState,
        blocks,
        weeks: updatedWeeks,
      },
      true
    );
  }

  public static switchActiveWeek(target: Date | string): FullPlannerState {
    if (typeof target === 'string') {
      const state = this.loadSync();
      const targetWeek = state.weeks?.[target];
      if (targetWeek?.saturdayDate) {
        return this.switchWeek(new Date(targetWeek.saturdayDate));
      }
      return this.switchWeek(new Date());
    }
    return this.switchWeek(target);
  }

  public static clear(): void {
    this.clearDatabase();
  }

  /**
   * Save current active week data with title, weekRange, blocks and templates
   */
  public static saveCurrentWeekState(params: {
    title: string;
    weekRange: string;
    blocks: TimeBlock[];
    templates: BlockTemplate[];
    date: Date;
  }): void {
    const currentState = this.loadSync();
    const currentWeekId = getWeekId(params.date);
    const targetSat = getSaturdayOfWeek(params.date);

    const updatedWeeks: Record<string, WeekRecord> = {
      ...currentState.weeks,
      [currentWeekId]: {
        weekId: currentWeekId,
        title: params.title,
        weekRange: params.weekRange,
        saturdayDate: targetSat.toISOString(),
        blocks: params.blocks,
        weeklyNotes: currentState.weeks[currentWeekId]?.weeklyNotes || currentState.weeklyNotes,
        updatedAt: new Date().toISOString(),
      },
    };

    this.save(
      {
        ...currentState,
        title: params.title,
        weekRange: params.weekRange,
        blocks: params.blocks,
        templates: params.templates,
        activeWeekId: currentWeekId,
        weeks: updatedWeeks,
        updatedAt: new Date().toISOString(),
      },
      false
    );
  }

  /**
   * Switch active week: saves current week, then loads or initializes target week
   */
  public static switchWeek(targetDate: Date): FullPlannerState {
    const currentState = this.loadSync();
    const currentWeekId = currentState.activeWeekId || getWeekId(new Date());

    // Sync current active week before leaving
    const updatedWeeks: Record<string, WeekRecord> = {
      ...currentState.weeks,
      [currentWeekId]: {
        weekId: currentWeekId,
        title: currentState.title,
        weekRange: currentState.weekRange,
        saturdayDate: currentState.weeks[currentWeekId]?.saturdayDate || getSaturdayOfWeek(new Date()).toISOString(),
        blocks: currentState.blocks,
        weeklyNotes: currentState.weeklyNotes,
        updatedAt: new Date().toISOString(),
      },
    };

    const targetWeekId = getWeekId(targetDate);
    const targetSat = getSaturdayOfWeek(targetDate);
    const existingTargetWeek = updatedWeeks[targetWeekId];

    let newState: FullPlannerState;

    if (existingTargetWeek) {
      // Week exists in database: load it seamlessly
      newState = {
        ...currentState,
        activeWeekId: targetWeekId,
        title: existingTargetWeek.title,
        weekRange: existingTargetWeek.weekRange || formatWeekRangeFa(targetSat),
        blocks: existingTargetWeek.blocks,
        weeklyNotes: existingTargetWeek.weeklyNotes || currentState.weeklyNotes,
        weeks: updatedWeeks,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Week does not exist yet: create default entry for it
      const newWeekRecord: WeekRecord = {
        weekId: targetWeekId,
        title: `برنامه هفته ${formatWeekRangeFa(targetSat)}`,
        weekRange: formatWeekRangeFa(targetSat),
        saturdayDate: targetSat.toISOString(),
        blocks: [],
        weeklyNotes: [],
        updatedAt: new Date().toISOString(),
      };
      updatedWeeks[targetWeekId] = newWeekRecord;

      newState = {
        ...currentState,
        activeWeekId: targetWeekId,
        title: newWeekRecord.title,
        weekRange: newWeekRecord.weekRange,
        blocks: [],
        weeklyNotes: [],
        weeks: updatedWeeks,
        updatedAt: new Date().toISOString(),
      };
    }

    this.save(newState, true);
    return newState;
  }

  /**
   * Create a new week with custom parameters (Copy routines vs Blank canvas)
   */
  public static createNewWeek(params: {
    targetDate: Date;
    title: string;
    weekRange: string;
    copyRoutineFromCurrent: boolean;
  }): FullPlannerState {
    const currentState = this.loadSync();
    const currentWeekId = currentState.activeWeekId || getWeekId(new Date());

    // 1. Sync current week first
    const updatedWeeks: Record<string, WeekRecord> = {
      ...currentState.weeks,
      [currentWeekId]: {
        weekId: currentWeekId,
        title: currentState.title,
        weekRange: currentState.weekRange,
        saturdayDate: currentState.weeks[currentWeekId]?.saturdayDate || getSaturdayOfWeek(new Date()).toISOString(),
        blocks: currentState.blocks,
        weeklyNotes: currentState.weeklyNotes,
        updatedAt: new Date().toISOString(),
      },
    };

    const targetWeekId = getWeekId(params.targetDate);
    const targetSat = getSaturdayOfWeek(params.targetDate);

    // Prepare blocks for new week
    let newBlocks: TimeBlock[] = [];
    if (params.copyRoutineFromCurrent) {
      // Smart routine transfer: copy blocks, reset completion, assign unique IDs
      newBlocks = currentState.blocks.map((b) => ({
        ...b,
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        completed: false,
      }));
    }

    const newWeekRecord: WeekRecord = {
      weekId: targetWeekId,
      title: params.title,
      weekRange: params.weekRange,
      saturdayDate: targetSat.toISOString(),
      blocks: newBlocks,
      weeklyNotes: currentState.weeklyNotes.map((n) => ({
        ...n,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        completed: false,
      })),
      updatedAt: new Date().toISOString(),
    };

    updatedWeeks[targetWeekId] = newWeekRecord;

    const newState: FullPlannerState = {
      ...currentState,
      activeWeekId: targetWeekId,
      title: newWeekRecord.title,
      weekRange: newWeekRecord.weekRange,
      blocks: newBlocks,
      weeklyNotes: newWeekRecord.weeklyNotes,
      weeks: updatedWeeks,
      updatedAt: new Date().toISOString(),
    };

    this.save(newState, true);
    return newState;
  }

  /**
   * Get all registered week IDs in database
   */
  public static getAllSavedWeekIds(): string[] {
    const state = this.loadSync();
    return Object.keys(state.weeks || {});
  }

  /**
   * Get all registered week records in database
   */
  public static getAllSavedWeeks(): Record<string, WeekRecord> {
    const state = this.loadSync();
    return state.weeks || {};
  }

  /**
   * Delete a specific saved week from database
   */
  public static deleteSavedWeek(weekId: string): boolean {
    const state = this.loadSync();
    if (!state.weeks || !state.weeks[weekId]) return false;
    
    const updatedWeeks = { ...state.weeks };
    delete updatedWeeks[weekId];

    // If deleting currently active week, switch to remaining or default
    let nextActiveId = state.activeWeekId;
    let nextBlocks = state.blocks;
    let nextTitle = state.title;
    let nextWeekRange = state.weekRange;

    if (state.activeWeekId === weekId) {
      const remainingIds = Object.keys(updatedWeeks);
      if (remainingIds.length > 0) {
        nextActiveId = remainingIds[0];
        const nextWeek = updatedWeeks[nextActiveId];
        nextBlocks = nextWeek.blocks;
        nextTitle = nextWeek.title;
        nextWeekRange = nextWeek.weekRange;
      } else {
        const fallbackId = getWeekId(new Date());
        nextActiveId = fallbackId;
        updatedWeeks[fallbackId] = {
          weekId: fallbackId,
          title: 'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)',
          weekRange: formatWeekRangeFa(new Date()),
          saturdayDate: getSaturdayOfWeek(new Date()).toISOString(),
          blocks: [],
          weeklyNotes: [],
          updatedAt: new Date().toISOString(),
        };
        nextBlocks = [];
      }
    }

    const newState: FullPlannerState = {
      ...state,
      activeWeekId: nextActiveId,
      blocks: nextBlocks,
      title: nextTitle,
      weekRange: nextWeekRange,
      weeks: updatedWeeks,
      updatedAt: new Date().toISOString(),
    };

    this.save(newState, true);
    return true;
  }

  /**
   * Save a completed daily audit report card to durable persistent database
   */
  public static saveDailyAuditCard(card: DailyReportCard): string {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_AUDIT);
      const map: Record<string, DailyReportCard> = existingStr ? JSON.parse(existingStr) : {};
      
      const recordId = card.id || `audit_${card.date || new Date().toISOString().split('T')[0]}_${card.dayKey}`;
      const enrichedCard: DailyReportCard = {
        ...card,
        id: recordId,
        createdAt: card.createdAt || new Date().toISOString(),
      };

      map[recordId] = enrichedCard;
      // Also keep by dayKey for quick lookup of active day
      map[`latest_${card.dayKey}`] = enrichedCard;

      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(map));

      // Also persist to IndexedDB asynchronously
      openDatabase().then((db) => {
        try {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(enrichedCard, `audit_record_${recordId}`);
        } catch {}
      }).catch(() => {});

      return recordId;
    } catch (e) {
      console.warn('Failed to save audit card', e);
      return '';
    }
  }

  /**
   * Retrieve all saved daily audit report cards
   */
  public static getDailyAuditCards(): Record<string, DailyReportCard> {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (!existingStr) return {};
      const parsed: Record<string, DailyReportCard> = JSON.parse(existingStr);
      // Filter out alias keys like 'latest_sat' to return only primary records
      const cleanMap: Record<string, DailyReportCard> = {};
      Object.entries(parsed).forEach(([key, card]) => {
        if (!key.startsWith('latest_') && card && typeof card === 'object') {
          cleanMap[key] = card;
        }
      });
      return cleanMap;
    } catch {
      return {};
    }
  }

  /**
   * Delete a specific daily audit report card by ID
   */
  public static deleteDailyAuditCard(cardId: string): boolean {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (!existingStr) return false;
      const map: Record<string, DailyReportCard> = JSON.parse(existingStr);
      if (map[cardId]) {
        delete map[cardId];
        localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(map));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Clear all audit report records
   */
  public static clearAllDailyAuditCards(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_AUDIT);
    } catch {}
  }

  /**
   * Export all daily audit reports as a downloadable JSON file
   */
  public static exportAuditDatabase(): void {
    try {
      const cards = this.getDailyAuditCards();
      const payload = JSON.stringify(cards, null, 2);
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-audit-database-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export audit database:', err);
    }
  }

  /**
   * Import daily audit cards from backup
   */
  public static importAuditDatabase(importedMap: Record<string, DailyReportCard>): number {
    try {
      const existing = this.getDailyAuditCards();
      let importedCount = 0;
      Object.entries(importedMap).forEach(([key, card]) => {
        if (card && card.date && card.dayKey) {
          existing[key] = card;
          importedCount++;
        }
      });
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(existing));
      return importedCount;
    } catch {
      return 0;
    }
  }


  /**
   * Export full backup as downloadable JSON file
   */
  public static exportBackupFile(state: FullPlannerState | PlannerData): void {
    try {
      const payload = JSON.stringify(this.sanitizeState(state), null, 2);
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anti-fragile-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup file:', err);
    }
  }

  /**
   * Import backup from user file and sanitize
   */
  public static async importBackupFile(file: File): Promise<FullPlannerState> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return this.sanitizeState(parsed);
  }

  /**
   * Reset and completely clear database
   */
  public static async clearDatabase(): Promise<FullPlannerState> {
    try {
      localStorage.removeItem(STORAGE_KEY_V3);
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem('timegrid_slot_height');

      const db = await openDatabase();
      const transaction = db.transaction(IDB_STORE, 'readwrite');
      transaction.objectStore(IDB_STORE).clear();
    } catch (err) {
      console.warn('Error clearing database', err);
    }

    return DEFAULT_PLANNER_STATE;
  }

  /**
   * Check storage stats (approximate bytes and record counts)
   */
  public static getStorageStats(): {
    isIndexedDBSupported: boolean;
    storageUsedBytes: number;
    lastSaved: string | null;
    isAutoSaveActive: boolean;
  } {
    let bytes = 0;
    try {
      const v3 = localStorage.getItem(STORAGE_KEY_V3) || '';
      bytes = new Blob([v3]).size;
    } catch {}

    const cfg = this.getConfig();

    return {
      isIndexedDBSupported: typeof window !== 'undefined' && 'indexedDB' in window,
      storageUsedBytes: bytes,
      lastSaved: cfg.lastSavedAt || null,
      isAutoSaveActive: cfg.enabled && cfg.autoSave,
    };
  }

  /**
   * Helper to sanitize and validate any state object
   */
  public static sanitizeState(data: any): FullPlannerState {
    const sanitizeBlock = (b: any): TimeBlock => {
      let title = b.title || 'بلوک کاری';
      let subtitle = b.subtitle || '';
      let category = b.category || 'work';

      // Sanitize old gaming/ps4
      if (title.includes('بازی') || title.toLowerCase().includes('ps4')) {
        title = 'استراحت و رفرش ذهن';
        subtitle = subtitle || 'پیاده‌روی، چای و استراحت چشم';
        category = 'gaming';
      }

      return {
        id: b.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        subtitle,
        category,
        day: b.day || 'sat',
        startMinutes: typeof b.startMinutes === 'number' ? b.startMinutes : 480,
        durationMinutes: typeof b.durationMinutes === 'number' ? b.durationMinutes : 60,
        note: b.note || '',
        completed: Boolean(b.completed),
      };
    };

    const sanitizeTemplate = (t: any): BlockTemplate => {
      let title = t.title || 'الگو';
      let subtitle = t.subtitle || '';
      let category = t.category || 'work';

      if (title.includes('بازی') || title.toLowerCase().includes('ps4')) {
        title = 'استراحت و رفرش ذهن';
        subtitle = 'پیاده‌روی، چای، استراحت چشم و کشش بدنی';
        category = 'gaming';
      }

      return {
        id: t.id || `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        subtitle,
        category,
        defaultDuration: typeof t.defaultDuration === 'number' ? t.defaultDuration : 60,
        description: t.description || '',
      };
    };

    const blocks = Array.isArray(data?.blocks)
      ? data.blocks.map(sanitizeBlock)
      : DEFAULT_PLANNER_STATE.blocks;

    const templates = Array.isArray(data?.templates)
      ? data.templates.map(sanitizeTemplate)
      : Array.isArray(data?.customTemplates)
      ? data.customTemplates.map(sanitizeTemplate)
      : DEFAULT_PLANNER_STATE.templates;

    const timePhases = Array.isArray(data?.timePhases) && data.timePhases.length > 0
      ? data.timePhases
      : DEFAULT_PLANNER_STATE.timePhases;

    const weeklyNotes = Array.isArray(data?.weeklyNotes)
      ? data.weeklyNotes
      : DEFAULT_PLANNER_STATE.weeklyNotes;

    const customCategoryColors = typeof data?.customCategoryColors === 'object' && data.customCategoryColors !== null
      ? data.customCategoryColors
      : {};

    const plannerRules: PlannerRulesConfig = {
      ...DEFAULT_PLANNER_RULES,
      ...(typeof data?.plannerRules === 'object' && data.plannerRules !== null ? data.plannerRules : {}),
    };

    const weeklyGoals: WeeklyPillarsGoals = {
      ...DEFAULT_WEEKLY_GOALS,
      ...(typeof data?.weeklyGoals === 'object' && data.weeklyGoals !== null ? data.weeklyGoals : {}),
    };

    const activeWeekId = data?.activeWeekId || getWeekId(new Date());

    let weeks: Record<string, WeekRecord> = {};
    if (typeof data?.weeks === 'object' && data.weeks !== null) {
      Object.entries(data.weeks).forEach(([wId, wRecord]: [string, any]) => {
        if (wRecord && typeof wRecord === 'object') {
          weeks[wId] = {
            weekId: wId,
            title: wRecord.title || `اسپرینت هفته ${wId}`,
            weekRange: wRecord.weekRange || '',
            saturdayDate: wRecord.saturdayDate || new Date().toISOString(),
            blocks: Array.isArray(wRecord.blocks) ? wRecord.blocks.map(sanitizeBlock) : [],
            weeklyNotes: Array.isArray(wRecord.weeklyNotes) ? wRecord.weeklyNotes : [],
            updatedAt: wRecord.updatedAt || new Date().toISOString(),
          };
        }
      });
    }

    // Ensure active week exists in weeks dictionary
    if (!weeks[activeWeekId]) {
      weeks[activeWeekId] = {
        weekId: activeWeekId,
        title: data?.title || DEFAULT_PLANNER_STATE.title,
        weekRange: data?.weekRange || DEFAULT_PLANNER_STATE.weekRange,
        saturdayDate: getSaturdayOfWeek(new Date()).toISOString(),
        blocks,
        weeklyNotes,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      title: data?.title || DEFAULT_PLANNER_STATE.title,
      weekRange: data?.weekRange || DEFAULT_PLANNER_STATE.weekRange,
      blocks,
      templates,
      timePhases,
      weeklyNotes,
      customCategoryColors,
      plannerRules,
      weeklyGoals,
      activeWeekId,
      weeks,
      updatedAt: data?.updatedAt || new Date().toISOString(),
      version: '3.0.0',
    };
  }
}
