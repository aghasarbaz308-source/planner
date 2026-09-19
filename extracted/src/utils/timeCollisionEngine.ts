import { TimeBlock, DayKey, PlannerRulesConfig } from '../types';
import { START_HOUR, END_HOUR } from '../constants/plannerConfig';

export interface RuleViolationWarning {
  id: string;
  type: 'overlap' | 'deep_work_limit' | 'ultradian_fatigue' | 'night_shield' | 'duration_limit';
  title: string;
  message: string;
  day: DayKey;
  blockIds?: string[];
}

/**
 * Mathematically non-overlapping cascade insertion.
 * When a block is placed (or moved), if strictNonOverlap is enabled,
 * any conflicting subsequent block is pushed forward smoothly.
 */
export function cascadeInsertBlock(
  allBlocks: TimeBlock[],
  newBlock: TimeBlock,
  rulesOrBuffer?: PlannerRulesConfig | number
): { updatedBlocks: TimeBlock[]; pushedCount: number } {
  const dayBlocks = allBlocks.filter((b) => b.day === newBlock.day && b.id !== newBlock.id);
  const otherDayBlocks = allBlocks.filter((b) => b.day !== newBlock.day);

  const buffer =
    typeof rulesOrBuffer === 'number'
      ? Math.max(0, rulesOrBuffer)
      : rulesOrBuffer && typeof rulesOrBuffer.bufferMinutesBetweenTasks === 'number'
      ? Math.max(0, rulesOrBuffer.bufferMinutesBetweenTasks)
      : 0;

  const newStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 15, newBlock.startMinutes));
  const maxAvail = END_HOUR * 60 - newStart;
  const safeDuration = Math.min(newBlock.durationMinutes, Math.max(15, maxAvail));
  const newEnd = newStart + safeDuration;

  const adjustedNewBlock: TimeBlock = {
    ...newBlock,
    startMinutes: newStart,
    durationMinutes: safeDuration,
  };

  // Divide existing day blocks into two groups:
  // 1. Blocks that strictly finish at or before newStart (remain untouched)
  // 2. Blocks that overlap with or start after newStart (must be cascaded)
  const strictlyBefore: TimeBlock[] = [];
  const conflictingOrAfter: TimeBlock[] = [];

  for (const b of dayBlocks) {
    const bEnd = b.startMinutes + b.durationMinutes;
    if (bEnd <= newStart) {
      strictlyBefore.push(b);
    } else {
      conflictingOrAfter.push(b);
    }
  }

  strictlyBefore.sort((a, b) => a.startMinutes - b.startMinutes);
  conflictingOrAfter.sort((a, b) => a.startMinutes - b.startMinutes);

  const cascadedAfter: TimeBlock[] = [];
  let currentPointer = newEnd + buffer;
  let pushedCount = 0;

  for (const b of conflictingOrAfter) {
    // If the block originally started after currentPointer, it keeps its start time;
    // otherwise it gets pushed forward to currentPointer.
    const adjStart = Math.max(b.startMinutes, currentPointer);
    if (adjStart !== b.startMinutes) {
      pushedCount++;
    }
    const avail = END_HOUR * 60 - adjStart;
    if (avail < 15) {
      // Exceeds day boundary; truncate or cap to remaining
      continue;
    }
    const dur = Math.min(b.durationMinutes, avail);
    cascadedAfter.push({
      ...b,
      startMinutes: adjStart,
      durationMinutes: dur,
    });
    currentPointer = adjStart + dur + buffer;
  }

  return {
    updatedBlocks: [...otherDayBlocks, ...strictlyBefore, adjustedNewBlock, ...cascadedAfter],
    pushedCount,
  };
}

/**
 * Cascading block move
 */
export function cascadeMoveBlock(
  allBlocks: TimeBlock[],
  blockId: string,
  targetDay: DayKey,
  newStartMinutes: number,
  rulesOrBuffer?: PlannerRulesConfig | number
): { updatedBlocks: TimeBlock[]; pushedCount: number } {
  const target = allBlocks.find((b) => b.id === blockId);
  if (!target) return { updatedBlocks: allBlocks, pushedCount: 0 };

  const movedBlock: TimeBlock = {
    ...target,
    day: targetDay,
    startMinutes: newStartMinutes,
  };

  const blocksWithoutTarget = allBlocks.filter((b) => b.id !== blockId);
  return cascadeInsertBlock(blocksWithoutTarget, movedBlock, rulesOrBuffer);
}

/**
 * Checks whether any block in the given day overlaps with another
 */
export function hasOverlapInDay(allBlocks: TimeBlock[], dayKey: DayKey): boolean {
  const dayBlocks = allBlocks
    .filter((b) => b.day === dayKey)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (let i = 0; i < dayBlocks.length - 1; i++) {
    const curr = dayBlocks[i];
    const next = dayBlocks[i + 1];
    if (curr.startMinutes + curr.durationMinutes > next.startMinutes) {
      return true;
    }
  }
  return false;
}

/**
 * Counts the total number of overlapping block pairs across all 7 days of the week
 */
export function countWeeklyCollisions(allBlocks: TimeBlock[]): number {
  const days: DayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  let count = 0;
  for (const day of days) {
    const dayBlocks = allBlocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    for (let i = 0; i < dayBlocks.length - 1; i++) {
      if (dayBlocks[i].startMinutes + dayBlocks[i].durationMinutes > dayBlocks[i + 1].startMinutes) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Resolves all collisions across all 7 days of the week sequentially
 */
export function resolveAllWeeklyCollisions(
  allBlocks: TimeBlock[],
  bufferMinutes = 0
): TimeBlock[] {
  const days: DayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  let current = [...allBlocks];
  for (const day of days) {
    current = resolveDayCollisions(current, day, bufferMinutes);
  }
  return current;
}

/**
 * Resolves all overlaps in a day sequentially and returns the whole updated blocks array
 */
export function resolveDayCollisions(
  allBlocks: TimeBlock[],
  dayKey: DayKey,
  bufferMinutes = 0
): TimeBlock[] {
  const dayBlocks = allBlocks.filter((b) => b.day === dayKey);
  const otherBlocks = allBlocks.filter((b) => b.day !== dayKey);

  const resolved = alignDayBlocksSequential(dayBlocks, bufferMinutes);
  return [...otherBlocks, ...resolved];
}

/**
 * Clean cascading alignment for an entire day to remove all collisions
 */
export function alignDayBlocksSequential(
  dayBlocks: TimeBlock[],
  bufferMinutes = 0
): TimeBlock[] {
  if (dayBlocks.length <= 1) return dayBlocks;

  const sorted = [...dayBlocks].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return b.durationMinutes - a.durationMinutes;
  });

  let currentPointer = START_HOUR * 60;
  const result: TimeBlock[] = [];

  for (const block of sorted) {
    const newStart = Math.max(block.startMinutes, currentPointer);
    const maxAvail = END_HOUR * 60 - newStart;
    if (maxAvail < 15) continue;
    const safeDuration = Math.min(block.durationMinutes, maxAvail);

    result.push({
      ...block,
      startMinutes: newStart,
      durationMinutes: safeDuration,
    });
    currentPointer = newStart + safeDuration + bufferMinutes;
  }

  return result;
}

/**
 * Evaluates cognitive & biological planner rules and returns actionable insights.
 */
export function evaluatePlannerRules(
  allBlocks: TimeBlock[],
  rules: PlannerRulesConfig
): RuleViolationWarning[] {
  const warnings: RuleViolationWarning[] = [];
  const days: DayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

  for (const day of days) {
    const dayBlocks = allBlocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // 1. Check for overlapping blocks
    for (let i = 0; i < dayBlocks.length - 1; i++) {
      const curr = dayBlocks[i];
      const next = dayBlocks[i + 1];
      if (curr.startMinutes + curr.durationMinutes > next.startMinutes) {
        warnings.push({
          id: `warn-overlap-${day}-${curr.id}-${next.id}`,
          type: 'overlap',
          day,
          title: 'تداخل زمانی هم‌زمان',
          message: `دو تسک «${curr.title}» و «${next.title}» در یک زمان قرار دارند و نیاز به مرتب‌سازی دارند.`,
          blockIds: [curr.id, next.id],
        });
      }
    }

    // 2. Daily Deep Work Hours Limit
    if (rules.warnDeepWorkOverLimit) {
      const deepWorkMins = dayBlocks
        .filter((b) => b.category === 'python' || b.category === 'pytorch')
        .reduce((sum, b) => sum + b.durationMinutes, 0);

      const maxMins = rules.maxDailyDeepWorkHours * 60;
      if (deepWorkMins > maxMins) {
        warnings.push({
          id: `warn-deepwork-${day}`,
          type: 'deep_work_limit',
          day,
          title: 'بار شناختی بیش از حد مجاز',
          message: `مجموع کار عمیق امروز ${(deepWorkMins / 60).toFixed(1)} ساعت است (بیشتر از سقف مجاز ${rules.maxDailyDeepWorkHours} ساعت). احتمال خستگی مفرط مغز وجود دارد.`,
        });
      }
    }

    // 3. Ultradian Rhythm (Consecutive focus > maxConsecutiveFocusMinutes without recovery)
    if (rules.warnUltradianBreakNeeded) {
      let focusStreak = 0;
      let streakBlockIds: string[] = [];

      for (let i = 0; i < dayBlocks.length; i++) {
        const b = dayBlocks[i];
        const isDeep = b.category === 'python' || b.category === 'pytorch' || b.category === 'work';
        const isRecovery = b.category === 'recovery' || b.category === 'gaming';

        if (isRecovery) {
          focusStreak = 0;
          streakBlockIds = [];
        } else if (isDeep) {
          focusStreak += b.durationMinutes;
          streakBlockIds.push(b.id);

          if (focusStreak > rules.maxConsecutiveFocusMinutes) {
            warnings.push({
              id: `warn-ultradian-${day}-${b.id}`,
              type: 'ultradian_fatigue',
              day,
              title: 'نیاز به استراحت اولترادین',
              message: `تمرکز مداوم بدون وقفه به ${focusStreak} دقیقه رسیده است. برای جلوگیری از افت راندمان عصبی، ۱۵ دقیقه ریکاوری درج کنید.`,
              blockIds: [...streakBlockIds],
            });
            focusStreak = 0;
            streakBlockIds = [];
          }
        }
      }
    }

    // 4. Circadian Night Shield Check
    if (rules.warnNightShieldViolations) {
      const nightThresholdMins = Math.round(rules.nightShieldStartHour * 60);
      for (const b of dayBlocks) {
        const isHeavy = b.category === 'pytorch' || b.category === 'python' || b.category === 'work';
        if (isHeavy && b.startMinutes >= nightThresholdMins) {
          warnings.push({
            id: `warn-night-${day}-${b.id}`,
            type: 'night_shield',
            day,
            title: 'تداخل با محدوده خواب و بازسازی شبانه',
            message: `تسک سنگین «${b.title}» پس از ساعت ${rules.nightShieldStartHour}:00 شب چیده شده است که به چرخه خواب و ترشح ملاتونین آسیب می‌زند.`,
            blockIds: [b.id],
          });
        }
      }
    }
  }

  return warnings;
}
