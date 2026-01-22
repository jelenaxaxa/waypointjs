import type { RouteEventMap } from '../events';
import type { IEventBus } from '../domain/interfaces';

type Listener<T> = (data: T) => void;

/**
 * Default implementation of IEventBus.
 *
 * Simple in-memory pub/sub for domain events.
 */
export class EventBusImpl implements IEventBus {
  private listeners = new Map<keyof RouteEventMap, Set<Listener<unknown>>>();

  on<K extends keyof RouteEventMap>(
    event: K,
    listener: Listener<RouteEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);

    return () => this.off(event, listener);
  }

  off<K extends keyof RouteEventMap>(
    event: K,
    listener: Listener<RouteEventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  once<K extends keyof RouteEventMap>(
    event: K,
    listener: Listener<RouteEventMap[K]>
  ): () => void {
    const onceWrapper: Listener<RouteEventMap[K]> = (data) => {
      this.off(event, onceWrapper);
      listener(data);
    };
    return this.on(event, onceWrapper);
  }

  emit<K extends keyof RouteEventMap>(event: K, data: RouteEventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    });
  }

  removeAllListeners(event?: keyof RouteEventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
