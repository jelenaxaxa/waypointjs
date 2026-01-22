import type { Coordinate, Position, NearestPointResult } from '../../types';

/**
 * Interface for geographic calculations.
 *
 * Single Responsibility: Only handles geo computations.
 * All methods are pure functions with no side effects.
 */
export interface IGeoService {
  /**
   * Calculate distance between two coordinates.
   * @returns Distance in meters
   */
  calculateDistance(from: Coordinate, to: Coordinate): number;

  /**
   * Calculate the total length of a polyline.
   * @returns Length in meters
   */
  calculateLineLength(coordinates: ReadonlyArray<Position>): number;

  /**
   * Find the nearest point on a line to a given coordinate.
   * @returns The nearest point result, or null if line has < 2 points
   */
  findNearestPointOnLine(
    point: Coordinate,
    lineCoordinates: ReadonlyArray<Position>
  ): NearestPointResult | null;

  /**
   * Check if a coordinate is off-route.
   * @param thresholdMeters - Maximum distance from route (default: 50m)
   */
  isOffRoute(
    location: Coordinate,
    routeCoordinates: ReadonlyArray<Position>,
    thresholdMeters?: number
  ): boolean;

  /**
   * Calculate the remaining distance from a point along the route.
   * @returns Remaining distance in meters
   */
  calculateRemainingDistance(
    coordinates: ReadonlyArray<Position>,
    fromIndex: number,
    fromFraction: number
  ): number;
}
