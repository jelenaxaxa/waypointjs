import type { Waypoint, Coordinate } from '../../types';

/**
 * Repository interface for managing waypoints.
 * Follows the Repository pattern from DDD.
 *
 * Single Responsibility: Only handles waypoint CRUD operations.
 */
export interface IWaypointRepository {
  /**
   * Get all waypoints in order.
   */
  getAll(): ReadonlyArray<Waypoint>;

  /**
   * Get a waypoint by its ID.
   */
  getById(id: string): Waypoint | null;

  /**
   * Get a waypoint by its index.
   */
  getByIndex(index: number): Waypoint | null;

  /**
   * Add a waypoint to the end.
   * @returns The created waypoint
   */
  add(coordinate: Coordinate, name?: string): Waypoint;

  /**
   * Insert a waypoint at a specific index.
   * @returns The created waypoint
   */
  insert(coordinate: Coordinate, index: number, name?: string): Waypoint;

  /**
   * Remove a waypoint by ID.
   * @returns The removed waypoint, or null if not found
   */
  remove(id: string): Waypoint | null;

  /**
   * Update a waypoint's position.
   * @returns The previous coordinate, or null if waypoint not found
   */
  update(id: string, coordinate: Coordinate): Coordinate | null;

  /**
   * Reorder a waypoint from one index to another.
   * @returns true if successful
   */
  reorder(fromIndex: number, toIndex: number): boolean;

  /**
   * Replace all waypoints (used for undo/redo).
   */
  setAll(waypoints: ReadonlyArray<Waypoint>): void;

  /**
   * Get the total count of waypoints.
   */
  count(): number;

  /**
   * Remove all waypoints.
   */
  clear(): void;
}
