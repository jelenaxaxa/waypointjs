type Listener<T> = (data: T) => void;

/**
 * A strongly-typed event emitter
 */
export class TypedEventEmitter<EventMap extends { [K in keyof EventMap]: unknown }> {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  /**
   * Subscribe to an event
   * @param event - The event name
   * @param listener - The callback function
   * @returns An unsubscribe function
   */
  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event
   * @param event - The event name
   * @param listener - The callback function to remove
   */
  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  /**
   * Subscribe to an event once
   * @param event - The event name
   * @param listener - The callback function
   * @returns An unsubscribe function
   */
  once<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>
  ): () => void {
    const onceWrapper: Listener<EventMap[K]> = (data) => {
      this.off(event, onceWrapper);
      listener(data);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Emit an event to all subscribers
   * @param event - The event name
   * @param data - The event payload
   */
  protected emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    });
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name. If not provided, removes all listeners.
   */
  removeAllListeners(event?: keyof EventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - The event name
   * @returns The number of listeners
   */
  listenerCount(event: keyof EventMap): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
