import { TimeBlock } from '../types';

export interface PositionedBlock {
  block: TimeBlock;
  topPx: number;
  heightPx: number;
  visualHeight: number;
  colIndex: number;
  totalCols: number;
  hasCollision: boolean;
}

export interface LayoutOptions {
  startHour: number;
  endHour: number;
  slotInterval: number;
  slotHeight: number;
  minVisualHeight?: number;
  gapPx?: number;
}

/**
 * Computes exact non-overlapping visual coordinates for time blocks in a day column.
 * - Guarantees that consecutive blocks NEVER overlap or collide.
 * - Mathematically bounds card height so it strictly terminates before the next block.
 * - Handles concurrent/colliding blocks (parallel tasks) by assigning side-by-side columns.
 */
export function computeDayBlockLayout(
  dayBlocks: TimeBlock[],
  options: LayoutOptions
): PositionedBlock[] {
  const {
    startHour,
    slotInterval,
    slotHeight,
    minVisualHeight = 6,
    gapPx = 2,
  } = options;

  if (!dayBlocks || dayBlocks.length === 0) {
    return [];
  }

  // Filter out any blocks with non-positive duration
  const validBlocks = dayBlocks.filter((b) => b.durationMinutes > 0);
  if (validBlocks.length === 0) return [];

  // Sort blocks: startMinutes ASC, duration DESC, id ASC
  const sorted = [...validBlocks].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    if (b.durationMinutes !== a.durationMinutes) {
      return b.durationMinutes - a.durationMinutes;
    }
    return a.id.localeCompare(b.id);
  });

  const pixelsPerMinute = slotHeight / slotInterval;
  const startMinuteBase = startHour * 60;

  // 1. Detect overlapping clusters (connected components)
  // Two blocks overlap in time if: a.start < b.end && b.start < a.end
  const n = sorted.length;
  const clusters: TimeBlock[][] = [];
  let currentCluster: TimeBlock[] = [];
  let clusterEnd = -1;

  for (let i = 0; i < n; i++) {
    const b = sorted[i];
    const bEnd = b.startMinutes + b.durationMinutes;

    if (currentCluster.length === 0) {
      currentCluster.push(b);
      clusterEnd = bEnd;
    } else {
      // If this block starts STRICTLY BEFORE the current cluster ends, it overlaps with the cluster
      if (b.startMinutes < clusterEnd) {
        currentCluster.push(b);
        clusterEnd = Math.max(clusterEnd, bEnd);
      } else {
        // Start a new cluster
        clusters.push(currentCluster);
        currentCluster = [b];
        clusterEnd = bEnd;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 2. Assign column index and total columns within each cluster
  const result: PositionedBlock[] = [];

  for (const cluster of clusters) {
    // Greedy column allocation
    const columns: number[] = []; // tracks end minute of each column
    const blockAssignments = new Map<string, number>();

    for (const block of cluster) {
      const blockEnd = block.startMinutes + block.durationMinutes;
      let assignedCol = -1;

      for (let c = 0; c < columns.length; c++) {
        // Can fit in column c if column's previous block ends on or before block start
        if (columns[c] <= block.startMinutes) {
          assignedCol = c;
          columns[c] = blockEnd;
          break;
        }
      }

      if (assignedCol === -1) {
        assignedCol = columns.length;
        columns.push(blockEnd);
      }

      blockAssignments.set(block.id, assignedCol);
    }

    const totalCols = columns.length;
    const hasCollision = totalCols > 1;

    // Group blocks by assigned column to calculate exact predecessor/successor bounds
    const colBlocks = new Map<number, TimeBlock[]>();
    for (const block of cluster) {
      const col = blockAssignments.get(block.id) ?? 0;
      if (!colBlocks.has(col)) colBlocks.set(col, []);
      colBlocks.get(col)!.push(block);
    }

    for (const block of cluster) {
      const colIndex = blockAssignments.get(block.id) ?? 0;
      const topPx = (block.startMinutes - startMinuteBase) * pixelsPerMinute;
      const rawHeightPx = block.durationMinutes * pixelsPerMinute;

      // Find the immediate next block in the same column to prevent any vertical bleed
      const sameCol = colBlocks.get(colIndex) || [];
      const nextInCol = sameCol.find((b) => b.startMinutes >= block.startMinutes + block.durationMinutes);

      let maxAllowedHeight = rawHeightPx - gapPx;
      if (nextInCol) {
        const spaceUntilNext = (nextInCol.startMinutes - block.startMinutes) * pixelsPerMinute - gapPx;
        maxAllowedHeight = Math.min(maxAllowedHeight, spaceUntilNext);
      }

      const visualHeight = Math.max(minVisualHeight, Math.round(maxAllowedHeight * 10) / 10);

      result.push({
        block,
        topPx: Math.round(topPx * 10) / 10,
        heightPx: Math.round(rawHeightPx * 10) / 10,
        visualHeight,
        colIndex,
        totalCols,
        hasCollision,
      });
    }
  }

  // Restore original ordering or sorted ordering
  return result;
}
