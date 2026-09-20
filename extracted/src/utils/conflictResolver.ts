import { TimeBlock, DayKey } from '../types';
import { START_HOUR, END_HOUR, DAYS, minutesToTimeString, formatDurationFa, toFaDigits } from '../constants/plannerConfig';

export interface ConflictPair {
  id: string;
  day: DayKey;
  dayNameFa: string;
  blockA: TimeBlock;
  blockB: TimeBlock;
  overlapMinutes: number;
  overlapStart: number;
  overlapEnd: number;
}

/**
 * Returns all overlapping pairs of blocks in a given day
 */
export function findDayConflicts(day: DayKey, blocks: TimeBlock[]): ConflictPair[] {
  const dayBlocks = blocks
    .filter((b) => b.day === day)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const conflicts: ConflictPair[] = [];
  const dayNameFa = DAYS.find((d) => d.id === day)?.nameFa || day;

  for (let i = 0; i < dayBlocks.length; i++) {
    for (let j = i + 1; j < dayBlocks.length; j++) {
      const a = dayBlocks[i];
      const b = dayBlocks[j];
      const aEnd = a.startMinutes + a.durationMinutes;
      const bEnd = b.startMinutes + b.durationMinutes;

      // Strict overlap: startA < endB && startB < endA
      if (a.startMinutes < bEnd && b.startMinutes < aEnd) {
        const overlapStart = Math.max(a.startMinutes, b.startMinutes);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

        if (overlapMinutes > 0) {
          conflicts.push({
            id: `${a.id}_${b.id}`,
            day,
            dayNameFa,
            blockA: a,
            blockB: b,
            overlapMinutes,
            overlapStart,
            overlapEnd,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Returns all conflicts across all days of the week
 */
export function findAllConflicts(blocks: TimeBlock[]): ConflictPair[] {
  let all: ConflictPair[] = [];
  DAYS.forEach((d) => {
    all = all.concat(findDayConflicts(d.id, blocks));
  });
  return all;
}

/**
 * Smart Cascading Domino Shift for a Day:
 * Sorts all blocks chronologically. If any block overlaps with the previous,
 * it pushes the block to start immediately after the previous one.
 * If pushing exceeds 24:00, it trims duration gracefully (minimum 15 mins).
 */
export function autoResolveDayDomino(day: DayKey, blocks: TimeBlock[]): TimeBlock[] {
  const otherBlocks = blocks.filter((b) => b.day !== day);
  const dayBlocks = [...blocks.filter((b) => b.day === day)].sort(
    (a, b) => a.startMinutes - b.startMinutes
  );

  if (dayBlocks.length <= 1) return blocks;

  const resolved: TimeBlock[] = [];
  const maxMins = END_HOUR * 60;

  for (let i = 0; i < dayBlocks.length; i++) {
    const current = { ...dayBlocks[i] };
    if (resolved.length === 0) {
      // Ensure first block starts at or after START_HOUR
      current.startMinutes = Math.max(START_HOUR * 60, current.startMinutes);
      resolved.push(current);
      continue;
    }

    const prev = resolved[resolved.length - 1];
    const prevEnd = prev.startMinutes + prev.durationMinutes;

    if (current.startMinutes < prevEnd) {
      // Push current to start at prevEnd
      current.startMinutes = prevEnd;
    }

    // Check if within bounds
    if (current.startMinutes + current.durationMinutes > maxMins) {
      const fitDuration = Math.max(15, maxMins - current.startMinutes);
      current.durationMinutes = fitDuration;
    }

    resolved.push(current);
  }

  return [...otherBlocks, ...resolved];
}

/**
 * Smart Proportional Fit / Compress:
 * If two blocks overlap, trims durations proportionally so both fit back-to-back
 * in the span from the earliest start to the latest end.
 */
export function autoResolveDayCompress(day: DayKey, blocks: TimeBlock[]): TimeBlock[] {
  const otherBlocks = blocks.filter((b) => b.day !== day);
  const dayBlocks = [...blocks.filter((b) => b.day === day)].sort(
    (a, b) => a.startMinutes - b.startMinutes
  );

  if (dayBlocks.length <= 1) return blocks;

  // Resolve pairwise overlaps by trimming
  for (let i = 0; i < dayBlocks.length - 1; i++) {
    const a = dayBlocks[i];
    const b = dayBlocks[i + 1];
    const aEnd = a.startMinutes + a.durationMinutes;

    if (b.startMinutes < aEnd) {
      const overlap = aEnd - b.startMinutes;
      // Reduce half from a, shift b forward by remaining
      const trimA = Math.min(Math.floor(overlap / 2), Math.max(0, a.durationMinutes - 15));
      a.durationMinutes -= trimA;
      b.startMinutes = a.startMinutes + a.durationMinutes;
      const bMaxEnd = END_HOUR * 60;
      if (b.startMinutes + b.durationMinutes > bMaxEnd) {
        b.durationMinutes = Math.max(15, bMaxEnd - b.startMinutes);
      }
    }
  }

  return [...otherBlocks, ...dayBlocks];
}

/**
 * Automatically resolve ALL conflicts across all days in the week
 */
export function autoResolveAllConflicts(
  blocks: TimeBlock[],
  strategy: 'domino' | 'compress' = 'domino'
): TimeBlock[] {
  let result = [...blocks];
  DAYS.forEach((d) => {
    if (findDayConflicts(d.id, result).length > 0) {
      if (strategy === 'domino') {
        result = autoResolveDayDomino(d.id, result);
      } else {
        result = autoResolveDayCompress(d.id, result);
      }
    }
  });
  return result;
}

/**
 * Find the earliest available free slot of length `neededMinutes` on a day
 */
export function findNearestFreeSlot(
  day: DayKey,
  neededMinutes: number,
  allBlocks: TimeBlock[],
  excludeBlockId?: string
): number | null {
  const dayBlocks = allBlocks
    .filter((b) => b.day === day && b.id !== excludeBlockId)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let currentPointer = START_HOUR * 60;
  const maxMins = END_HOUR * 60;

  for (const b of dayBlocks) {
    if (b.startMinutes >= currentPointer + neededMinutes) {
      return currentPointer;
    }
    currentPointer = Math.max(currentPointer, b.startMinutes + b.durationMinutes);
  }

  if (currentPointer + neededMinutes <= maxMins) {
    return currentPointer;
  }

  return null;
}
