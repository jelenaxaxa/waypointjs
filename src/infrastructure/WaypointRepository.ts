import type { Waypoint, Coordinate } from '../types';
import type { IWaypointRepository } from '../domain/interfaces';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * In-memory implementation of IWaypointRepository.
 *
 * Implements the Repository pattern with automatic reindexing.
 */
export class WaypointRepository implements IWaypointRepository {
  private waypoints: Waypoint[] = [];

  getAll(): ReadonlyArray<Waypoint> {
    return this.waypoints;
  }

  getById(id: string): Waypoint | null {
    return this.waypoints.find((wp) => wp.id === id) ?? null;
  }

  getByIndex(index: number): Waypoint | null {
    return this.waypoints[index] ?? null;
  }

  add(coordinate: Coordinate, name?: string): Waypoint {
    const waypoint: Waypoint = {
      id: generateId(),
      index: this.waypoints.length,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
      name,
      createdAt: Date.now(),
    };

    this.waypoints.push(waypoint);
    return waypoint;
  }

  insert(coordinate: Coordinate, index: number, name?: string): Waypoint {
    const clampedIndex = Math.max(0, Math.min(index, this.waypoints.length));

    const waypoint: Waypoint = {
      id: generateId(),
      index: clampedIndex,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
      name,
      createdAt: Date.now(),
    };

    this.waypoints.splice(clampedIndex, 0, waypoint);
    this.reindex();

    return waypoint;
  }

  remove(id: string): Waypoint | null {
    const index = this.waypoints.findIndex((wp) => wp.id === id);
    if (index === -1) {
      return null;
    }

    const [removed] = this.waypoints.splice(index, 1);
    this.reindex();

    return removed;
  }

  update(id: string, coordinate: Coordinate): Coordinate | null {
    const index = this.waypoints.findIndex((wp) => wp.id === id);
    if (index === -1) {
      return null;
    }

    const previous: Coordinate = {
      longitude: this.waypoints[index].longitude,
      latitude: this.waypoints[index].latitude,
    };

    this.waypoints[index] = {
      ...this.waypoints[index],
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
    };

    return previous;
  }

  reorder(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.waypoints.length ||
      toIndex < 0 ||
      toIndex >= this.waypoints.length
    ) {
      return false;
    }

    const [waypoint] = this.waypoints.splice(fromIndex, 1);
    this.waypoints.splice(toIndex, 0, waypoint);
    this.reindex();

    return true;
  }

  setAll(waypoints: ReadonlyArray<Waypoint>): void {
    this.waypoints = waypoints.map((wp, index) => ({
      ...wp,
      index,
    }));
  }

  count(): number {
    return this.waypoints.length;
  }

  clear(): void {
    this.waypoints = [];
  }

  private reindex(): void {
    this.waypoints = this.waypoints.map((wp, index) => ({
      ...wp,
      index,
    }));
  }
}
