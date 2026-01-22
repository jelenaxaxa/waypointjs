import type { RouteEventMap } from '../../events';

/**
 * Interface for publishing and subscribing to domain events.
 *
 * Single Responsibility: Only handles event pub/sub.
 * Decouples event producers from consumers.
 */
export interface IEventBus {
  /**
   * Subscribe to an event.
   * @returns An unsubscribe function
   */
  on<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): () => void;

  /**
   * Unsubscribe from an event.
   */
  off<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): void;

  /**
   * Subscribe to an event once.
   * @returns An unsubscribe function
   */
  once<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): () => void;

  /**
   * Publish an event to all subscribers.
   */
  emit<K extends keyof RouteEventMap>(event: K, data: RouteEventMap[K]): void;

  /**
   * Remove all listeners.
   */
  removeAllListeners(event?: keyof RouteEventMap): void;
}
