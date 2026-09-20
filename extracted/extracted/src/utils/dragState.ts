import { BlockTemplate, TimeBlock } from '../types';

/**
 * Global Drag & Drop state holder.
 * Solves cross-browser, iframe, and MIME-type restrictions in HTML5 Drag & Drop.
 */
interface GlobalDragState {
  template: BlockTemplate | null;
  blockId: string | null;
  sourceBlock: TimeBlock | null;
}

export const globalDragState: GlobalDragState = {
  template: null,
  blockId: null,
  sourceBlock: null,
};

export function setDraggingTemplate(template: BlockTemplate | null) {
  globalDragState.template = template;
  globalDragState.blockId = null;
  globalDragState.sourceBlock = null;
  try {
    (window as any).__APP_DRAG_TEMPLATE__ = template;
    (window as any).__APP_DRAG_BLOCK_ID__ = null;
  } catch {}
}

export function setDraggingBlock(blockId: string | null, sourceBlock?: TimeBlock | null) {
  globalDragState.blockId = blockId;
  globalDragState.sourceBlock = sourceBlock || null;
  globalDragState.template = null;
  try {
    (window as any).__APP_DRAG_BLOCK_ID__ = blockId;
    (window as any).__APP_DRAG_TEMPLATE__ = null;
  } catch {}
}

export function getDraggingTemplate(): BlockTemplate | null {
  if (globalDragState.template) return globalDragState.template;
  try {
    return (window as any).__APP_DRAG_TEMPLATE__ || null;
  } catch {
    return null;
  }
}

export function getDraggingBlockId(): string | null {
  if (globalDragState.blockId) return globalDragState.blockId;
  try {
    return (window as any).__APP_DRAG_BLOCK_ID__ || null;
  } catch {
    return null;
  }
}

export function clearGlobalDragState() {
  globalDragState.template = null;
  globalDragState.blockId = null;
  globalDragState.sourceBlock = null;
  try {
    (window as any).__APP_DRAG_TEMPLATE__ = null;
    (window as any).__APP_DRAG_BLOCK_ID__ = null;
  } catch {}
}
