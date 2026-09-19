import { DayKey, TimeBlock } from '../types';
import { DAYS } from '../constants/plannerConfig';

export interface AutoSleepMovieConfig {
  enableNightSleep: boolean;
  nightSleepStartMinutes: number; // e.g. 23 * 60
  nightSleepDurationMinutes: number; // e.g. 60
  nightSleepTitle: string;
  nightSleepDays: DayKey[];

  enablePowerNap: boolean;
  powerNapStartMinutes: number; // e.g. 14 * 60
  powerNapDurationMinutes: number; // e.g. 45
  powerNapTitle: string;
  powerNapDays: DayKey[];

  enableMovieTime: boolean;
  movieStartMinutes: number; // e.g. 20 * 60 + 30
  movieDurationMinutes: number; // e.g. 120
  movieTitle: string;
  movieDays: DayKey[];

  strategy: 'strict_cascade' | 'safe_fit';
}

export const DEFAULT_SLEEP_MOVIE_CONFIG: AutoSleepMovieConfig = {
  enableNightSleep: true,
  nightSleepStartMinutes: 23 * 60,
  nightSleepDurationMinutes: 60,
  nightSleepTitle: 'خواب عمیق و خاموشی شبانه',
  nightSleepDays: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],

  enablePowerNap: true,
  powerNapStartMinutes: 14 * 60,
  powerNapDurationMinutes: 45,
  powerNapTitle: 'چرت زیستی (Power Nap)',
  powerNapDays: ['sat', 'sun', 'mon', 'tue', 'wed'],

  enableMovieTime: true,
  movieStartMinutes: 20 * 60 + 30,
  movieDurationMinutes: 120,
  movieTitle: 'سانس سینما و فیلم هفتگی',
  movieDays: ['thu', 'fri'],

  strategy: 'strict_cascade',
};

/**
 * Merges auto-generated sleep and movie blocks into the existing schedule,
 * resolving any conflicts based on the selected strategy.
 */
export function applySleepMovieConfig(
  currentBlocks: TimeBlock[],
  config: AutoSleepMovieConfig
): { newBlocks: TimeBlock[]; addedCount: number } {
  // Remove existing auto-sleep/movie blocks if already present to avoid duplication
  const existingFiltered = currentBlocks.filter(
    (b) =>
      b.title !== config.nightSleepTitle &&
      b.title !== config.powerNapTitle &&
      b.title !== config.movieTitle &&
      b.category !== 'recovery' &&
      b.category !== 'gaming'
  );

  const generatedBlocks: TimeBlock[] = [];

  // 1. Night Sleep
  if (config.enableNightSleep) {
    config.nightSleepDays.forEach((day) => {
      generatedBlocks.push({
        id: `auto-sleep-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: config.nightSleepTitle,
        category: 'recovery',
        day,
        startMinutes: config.nightSleepStartMinutes,
        durationMinutes: config.nightSleepDurationMinutes,
        subtitle: 'تثبیت ریتم شبانه‌روزی و ملاتونین',
        completed: false,
      });
    });
  }

  // 2. Power Nap
  if (config.enablePowerNap) {
    config.powerNapDays.forEach((day) => {
      generatedBlocks.push({
        id: `auto-nap-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: config.powerNapTitle,
        category: 'recovery',
        day,
        startMinutes: config.powerNapStartMinutes,
        durationMinutes: config.powerNapDurationMinutes,
        subtitle: 'شارژ مجدد قوای شناختی',
        completed: false,
      });
    });
  }

  // 3. Movie Time
  if (config.enableMovieTime) {
    config.movieDays.forEach((day) => {
      generatedBlocks.push({
        id: `auto-movie-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: config.movieTitle,
        category: 'gaming',
        day,
        startMinutes: config.movieStartMinutes,
        durationMinutes: config.movieDurationMinutes,
        subtitle: 'تفریح و دوپامین سالم پایان هفته',
        completed: false,
      });
    });
  }

  return {
    newBlocks: [...existingFiltered, ...generatedBlocks],
    addedCount: generatedBlocks.length,
  };
}
