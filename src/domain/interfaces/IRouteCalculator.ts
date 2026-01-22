import type { Waypoint, Route, RouteStats, NavigationStep } from '../../types';

/**
 * Result of a route calculation.
 */
export interface RouteCalculationResult {
  route: Route;
  stats: RouteStats;
  steps: ReadonlyArray<NavigationStep>;
}

/**
 * Interface for calculating routes from waypoints.
 *
 * Single Responsibility: Only handles route calculation.
 * This is the application's port to external directions services.
 */
export interface IRouteCalculator {
  /**
   * Calculate a route from the given waypoints.
   * @returns The calculation result, or null if calculation failed
   */
  calculate(waypoints: ReadonlyArray<Waypoint>): Promise<RouteCalculationResult | null>;

  /**
   * Cancel any in-progress calculation.
   */
  cancel(): void;
}
