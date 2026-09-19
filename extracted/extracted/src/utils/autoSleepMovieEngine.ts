import { TimeBlock, DayKey } from '../types';
import { START_HOUR, END_HOUR, DAYS } from '../constants/plannerConfig';
import { cascadeInsertBlock, resolveDayCollisions } from './timeCollisionEngine';

export interface AutoSleepMovieConfig {
  // Night Sleep
  enableNightSleep: boolean;
  nightSleepStartMinutes: number; // e.g. 23:00 = 1380
  nightSleepDurationMinutes: number; // e.g. 60
  nightSleepDays: DayKey[];
  nightSleepTitle: string;
  nightSleepSubtitle: string;

  // Afternoon Power Nap
  enablePowerNap: boolean;
  powerNapStartMinutes: number; // e.g. 14:00 = 840
  powerNapDurationMinutes: number; // e.g. 45
  powerNapDays: DayKey[];
  powerNapTitle: string;
  powerNapSubtitle: string;

  // Movie / Cinema
  enableMovieTime: boolean;
  movieDays: DayKey[];
  movieStartMinutes: number; // e.g. 20:30 = 1230
  movieDurationMinutes: number; // e.g. 120
  movieTitle: string;
  movieSubtitle: string;

  // Configuration settings
  strategy: 'strict_cascade' | 'safe_fit';
  clearExistingSleepMovieFirst: boolean;
}

export const DEFAULT_SLEEP_MOVIE_CONFIG: AutoSleepMovieConfig = {
  enableNightSleep: true,
  nightSleepStartMinutes: 23 * 60, // 23:00
  nightSleepDurationMinutes: 60, // 23:00 to 24:00
  nightSleepDays: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],
  nightSleepTitle: 'خواب عمیق و ریکاوری شبانه',
  nightSleepSubtitle: 'خاموشی کامل نمایشگرها، ترشح ملاتونین و تثبیت حافظه زیستی',

  enablePowerNap: true,
  powerNapStartMinutes: 14 * 60, // 14:00
  powerNapDurationMinutes: 45, // 14:00 to 14:45
  powerNapDays: ['sat', 'sun', 'mon', 'tue', 'wed'], // روزهای کاری دانشگاه و اسپرینت
  powerNapTitle: 'چرت نیمروزی (Power Nap)',
  powerNapSubtitle: 'ریست سیستم عصبی و بازیابی تمرکز پس از ناهار',

  enableMovieTime: true,
  movieDays: ['thu', 'fri'], // پنج‌شنبه شب و جمعه شب
  movieStartMinutes: 20 * 60 + 30, // 20:30
  movieDurationMinutes: 120, // 20:30 to 22:30 (قبل از خواب)
  movieTitle: 'سینما و تماشای فیلم (Movie Night)',
  movieSubtitle: 'فیلم منتخب هفته، مینی‌سریال برتر و رهایی از تنش‌های فکری',

  strategy: 'strict_cascade',
  clearExistingSleepMovieFirst: true,
};

/**
 * Checks if a block was generated or represents sleep/cinema
 */
export function isSleepOrMovieBlock(b: TimeBlock): boolean {
  const text = `${b.title} ${b.subtitle || ''} ${b.note || ''}`.toLowerCase();
  const sleepKeywords = ['خواب', 'چرت', 'sleep', 'nap', 'bedtime', 'ملاتونین'];
  const movieKeywords = ['فیلم', 'سینما', 'movie', 'cinema', 'سریال', 'مینی‌سریال', 'film'];

  const isSleep = sleepKeywords.some((k) => text.includes(k));
  const isMovie = movieKeywords.some((k) => text.includes(k));

  return isSleep || isMovie;
}

/**
 * Intelligent and mathematically exact auto-injection of Sleep & Movie blocks
 */
export function injectSleepAndMovieBlocks(
  currentBlocks: TimeBlock[],
  config: AutoSleepMovieConfig
): {
  updatedBlocks: TimeBlock[];
  summary: {
    sleepBlocksAdded: number;
    napBlocksAdded: number;
    movieBlocksAdded: number;
    adjustedTasksCount: number;
  };
} {
  let baseBlocks = [...currentBlocks];

  // Step 1: Clean previous sleep/movie blocks if configured
  if (config.clearExistingSleepMovieFirst) {
    baseBlocks = baseBlocks.filter((b) => !isSleepOrMovieBlock(b));
  }

  let sleepBlocksAdded = 0;
  let napBlocksAdded = 0;
  let movieBlocksAdded = 0;
  let adjustedTasksCount = 0;

  // Process day by day for maximum predictability
  for (const day of DAYS) {
    const dayId = day.id;
    let dayBlocks = baseBlocks.filter((b) => b.day === dayId);
    const otherBlocks = baseBlocks.filter((b) => b.day !== dayId);

    // 1. Afternoon Power Nap
    if (config.enablePowerNap && config.powerNapDays.includes(dayId)) {
      const napStart = config.powerNapStartMinutes;
      const napDur = config.powerNapDurationMinutes;

      const napBlock: TimeBlock = {
        id: `auto-nap-${dayId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        day: dayId,
        title: config.powerNapTitle,
        subtitle: config.powerNapSubtitle,
        category: 'recovery',
        startMinutes: napStart,
        durationMinutes: napDur,
        completed: false,
        note: 'زمان‌بندی هوشمند چرت نیمروزی زیستی برای ریکاوری قوای شناختی',
      };

      if (config.strategy === 'strict_cascade') {
        const { updatedBlocks, pushedCount } = cascadeInsertBlock(dayBlocks, napBlock, 0);
        dayBlocks = updatedBlocks;
        adjustedTasksCount += pushedCount;
        napBlocksAdded++;
      } else {
        // safe_fit: only add if no overlapping block
        const hasOverlap = dayBlocks.some((b) => {
          const bStart = b.startMinutes;
          const bEnd = b.startMinutes + b.durationMinutes;
          return Math.max(napStart, bStart) < Math.min(napStart + napDur, bEnd);
        });
        if (!hasOverlap) {
          dayBlocks.push(napBlock);
          napBlocksAdded++;
        }
      }
    }

    // 2. Cinema & Movie Time
    if (config.enableMovieTime && config.movieDays.includes(dayId)) {
      const movieStart = config.movieStartMinutes;
      const movieDur = config.movieDurationMinutes;

      const movieBlock: TimeBlock = {
        id: `auto-movie-${dayId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        day: dayId,
        title: config.movieTitle,
        subtitle: config.movieSubtitle,
        category: 'gaming',
        startMinutes: movieStart,
        durationMinutes: movieDur,
        completed: false,
        note: 'سانس سینما و تماشای باکیفیت فیلم و سریال جهت ترشح دوپامین سالم',
      };

      if (config.strategy === 'strict_cascade') {
        const { updatedBlocks, pushedCount } = cascadeInsertBlock(dayBlocks, movieBlock, 0);
        dayBlocks = updatedBlocks;
        adjustedTasksCount += pushedCount;
        movieBlocksAdded++;
      } else {
        const hasOverlap = dayBlocks.some((b) => {
          const bStart = b.startMinutes;
          const bEnd = b.startMinutes + b.durationMinutes;
          return Math.max(movieStart, bStart) < Math.min(movieStart + movieDur, bEnd);
        });
        if (!hasOverlap) {
          dayBlocks.push(movieBlock);
          movieBlocksAdded++;
        }
      }
    }

    // 3. Night Sleep (Bedtime wind-down & deep sleep preparation)
    if (config.enableNightSleep && config.nightSleepDays.includes(dayId)) {
      const sleepStart = config.nightSleepStartMinutes;
      const sleepDur = config.nightSleepDurationMinutes;

      const sleepBlock: TimeBlock = {
        id: `auto-sleep-${dayId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        day: dayId,
        title: config.nightSleepTitle,
        subtitle: config.nightSleepSubtitle,
        category: 'recovery',
        startMinutes: sleepStart,
        durationMinutes: sleepDur,
        completed: false,
        note: 'مرز قطعی خواب شبانه - عدم استفاده از نمایشگرها و آماده‌سازی خواب عمیق',
      };

      if (config.strategy === 'strict_cascade') {
        // For night sleep, since it is at the end of the day (e.g. 23:00 to 24:00),
        // we make sure any existing task in dayBlocks that intrudes into [sleepStart, 24:00]
        // is trimmed or capped to finish by sleepStart, protecting the sleep boundary!
        dayBlocks = dayBlocks.map((b) => {
          if (b.startMinutes >= sleepStart) {
            // Task started inside sleep hours; shrink or move
            return null as unknown as TimeBlock;
          }
          if (b.startMinutes + b.durationMinutes > sleepStart) {
            adjustedTasksCount++;
            const safeDuration = Math.max(15, sleepStart - b.startMinutes);
            return {
              ...b,
              durationMinutes: safeDuration,
            };
          }
          return b;
        }).filter(Boolean);

        dayBlocks.push(sleepBlock);
        sleepBlocksAdded++;
      } else {
        const hasOverlap = dayBlocks.some((b) => {
          const bStart = b.startMinutes;
          const bEnd = b.startMinutes + b.durationMinutes;
          return Math.max(sleepStart, bStart) < Math.min(sleepStart + sleepDur, bEnd);
        });
        if (!hasOverlap) {
          dayBlocks.push(sleepBlock);
          sleepBlocksAdded++;
        }
      }
    }

    // Final sorting and collision verification for the day
    dayBlocks.sort((a, b) => a.startMinutes - b.startMinutes);
    dayBlocks = resolveDayCollisions(dayBlocks, dayId, 0);

    baseBlocks = [...otherBlocks, ...dayBlocks];
  }

  return {
    updatedBlocks: baseBlocks,
    summary: {
      sleepBlocksAdded,
      napBlocksAdded,
      movieBlocksAdded,
      adjustedTasksCount,
    },
  };
}
