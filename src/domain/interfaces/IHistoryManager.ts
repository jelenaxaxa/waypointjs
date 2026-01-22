import type { HistoryEntry, HistoryAction, Waypoint } from '../../types';

/**
 * Interface for managing undo/redo history.
 *
 * Single Responsibility: Only handles history state management.
 */
export interface IHistoryManager {
  /**
   * Push a new entry to history.
   * Truncates any "future" entries (redo stack).
   */
  push(waypoints: ReadonlyArray<Waypoint>, action: HistoryAction): void;

  /**
   * Get the previous state (undo).
   * @returns The previous entry, or null if at the beginning
   */
  undo(): HistoryEntry | null;

  /**
   * Get the next state (redo).
   * @returns The next entry, or null if at the end
   */
  redo(): HistoryEntry | null;

  /**
   * Check if undo is available.
   */
  canUndo(): boolean;

  /**
   * Check if redo is available.
   */
  canRedo(): boolean;

  /**
   * Get the current history size.
   */
  getSize(): number;

  /**
   * Clear all history.
   */
  clear(): void;
}
