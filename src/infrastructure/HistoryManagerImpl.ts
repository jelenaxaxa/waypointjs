import type { HistoryEntry, HistoryAction, Waypoint } from '../types';
import type { IHistoryManager } from '../domain/interfaces';

/**
 * Default implementation of IHistoryManager.
 *
 * Uses a circular buffer with configurable max size.
 */
export class HistoryManagerImpl implements IHistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;

  constructor(private readonly maxSize: number = 50) {}

  push(waypoints: ReadonlyArray<Waypoint>, action: HistoryAction): void {
    // Remove any entries after current index (redo stack)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new entry
    this.history.push({
      waypoints: waypoints.map((wp) => ({ ...wp })),
      timestamp: Date.now(),
      action,
    });

    // Trim to max size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }

    this.currentIndex = this.history.length - 1;
  }

  undo(): HistoryEntry | null {
    if (!this.canUndo()) {
      return null;
    }
    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  redo(): HistoryEntry | null {
    if (!this.canRedo()) {
      return null;
    }
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getSize(): number {
    return this.history.length;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
