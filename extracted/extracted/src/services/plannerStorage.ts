import { TimeBlock, BlockTemplate, TimePhaseInfo, WeeklyTaskItem, PlannerData, PlannerRulesConfig, WeeklyPillarsGoals } from '../types';
import {
  INITIAL_SAMPLE_BLOCKS,
  INITIAL_TEMPLATES,
  TIME_PHASES as DEFAULT_TIME_PHASES,
} from '../constants/plannerConfig';
import { DEFAULT_PLANNER_RULES, DEFAULT_WEEKLY_GOALS } from '../constants/defaultPlannerRules';

const STORAGE_KEY_V3 = 'anti_fragile_timeboxing_planner_v3';
const STORAGE_KEY_V2 = 'anti_fragile_timeboxing_planner_v2';
const STORAGE_KEY_CONFIG = 'anti_fragile_storage_config_v3';
const IDB_NAME = 'AntiFragileTimeboxDB';
const IDB_VERSION = 1;
const IDB_STORE = 'planner_state';
const IDB_KEY = 'latest_planner';

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
  updatedAt: string;
  version: string;
}

export const DEFAULT_PLANNER_STATE: FullPlannerState = {
  title: 'برنامه‌ریز هفتگی تایم‌باکسینگ (Anti-Fragile)',
  weekRange: 'اسپرینت لینوکس، مدلسازی پایتورچ و هماهنگی کاری',
  blocks: INITIAL_SAMPLE_BLOCKS,
  templates: INITIAL_TEMPLATES,
  timePhases: DEFAULT_TIME_PHASES,
  weeklyNotes: INITIAL_WEEKLY_NOTES,
  customCategoryColors: {},
  plannerRules: DEFAULT_PLANNER_RULES,
  weeklyGoals: DEFAULT_WEEKLY_GOALS,
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

      // 2. Try legacy v2 storage for seamless backward compatibility
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
        // Immediate localStorage sync
        localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(payload));
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
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(doSave, 300);
    }
  }

  public static saveSync(state: FullPlannerState): void {
    this.save(state, true);
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
      updatedAt: data?.updatedAt || new Date().toISOString(),
      version: '3.0.0',
    };
  }
}
