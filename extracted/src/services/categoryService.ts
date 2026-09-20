import { CategoryKey, CategoryTheme } from '../types';
import { CATEGORIES as DEFAULT_STATIC_CATEGORIES } from '../constants/plannerConfig';

const CATEGORIES_STORAGE_KEY = 'anti_fragile_categories_registry_v2';

class CategoryManager {
  private categories: Record<string, CategoryTheme> = {};
  private listeners: Array<(categories: Record<string, CategoryTheme>) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    // Start with default static categories
    this.categories = { ...DEFAULT_STATIC_CATEGORIES };

    // Merge with persisted categories
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            this.categories = {
              ...this.categories,
              ...parsed,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to load custom categories', err);
      }
    }

    // Also mirror to global CATEGORIES reference for backwards compatibility
    Object.assign(DEFAULT_STATIC_CATEGORIES, this.categories);
  }

  public getAll(): Record<string, CategoryTheme> {
    return { ...this.categories };
  }

  public getCategory(key: string): CategoryTheme {
    return this.categories[key] || this.categories.custom || {
      key,
      label: key,
      tagline: 'دسته‌بندی سفارشی',
      bgClass: 'bg-slate-50 hover:bg-slate-100/90',
      borderClass: 'border-slate-300',
      textClass: 'text-slate-950',
      badgeClass: 'bg-slate-200 text-slate-800',
      dotColor: '#64748b',
      printBg: '#f1f5f9',
      printBorder: '#cbd5e1',
      printText: '#1e293b',
      icon: 'Bookmark',
    };
  }

  public saveCategory(theme: CategoryTheme): void {
    this.categories[theme.key] = {
      ...theme,
      isCustom: true,
    };
    Object.assign(DEFAULT_STATIC_CATEGORIES, this.categories);
    this.persist();
    this.notify();
  }

  public deleteCategory(key: string): boolean {
    // Protect core fallback
    if (key === 'custom' || key === 'work' || key === 'recovery') {
      return false;
    }
    if (this.categories[key]) {
      delete this.categories[key];
      delete DEFAULT_STATIC_CATEGORIES[key];
      this.persist();
      this.notify();
      return true;
    }
    return false;
  }

  public resetToDefaults(): void {
    this.categories = { ...DEFAULT_STATIC_CATEGORIES };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    }
    this.notify();
  }

  public subscribe(listener: (categories: Record<string, CategoryTheme>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private persist(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
      } catch (err) {
        console.warn('Failed to persist categories', err);
      }
    }
  }

  private notify(): void {
    const clone = this.getAll();
    this.listeners.forEach((fn) => {
      try {
        fn(clone);
      } catch (e) {
        console.warn(e);
      }
    });
  }
}

export const categoryService = new CategoryManager();
