import type { Waypoint, Route, RouteStats, NavigationStep, Position, BoundingBox } from '../types';
import type { DirectionsProvider } from '../providers';
import type { IRouteCalculator, RouteCalculationResult } from '../domain/interfaces';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate bounding box for a set of coordinates
 */
function calculateBounds(coordinates: ReadonlyArray<Position>): BoundingBox {
  if (coordinates.length === 0) {
    return [0, 0, 0, 0];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Adapter that wraps a DirectionsProvider to implement IRouteCalculator.
 *
 * Follows the Adapter pattern - converts the external DirectionsProvider
 * interface to our internal IRouteCalculator interface.
 *
 * This is the boundary between our domain and external infrastructure.
 */
export class RouteCalculatorAdapter implements IRouteCalculator {
  constructor(private provider: DirectionsProvider) {}

  async calculate(
    waypoints: ReadonlyArray<Waypoint>
  ): Promise<RouteCalculationResult | null> {
    if (waypoints.length < 2) {
      return null;
    }

    const response = await this.provider.getDirections({
      waypoints: waypoints.map((wp) => ({
        longitude: wp.longitude,
        latitude: wp.latitude,
      })),
    });

    if (!response) {
      return null;
    }

    // Transform steps to NavigationStep format
    const steps: NavigationStep[] = response.steps.map((step, index) => ({
      id: generateId(),
      index,
      instruction: step.instruction,
      maneuverType: step.maneuverType as NavigationStep['maneuverType'],
      distanceMeters: step.distanceMeters,
      durationSeconds: step.durationSeconds,
      geometry: step.geometry,
    }));

    const route: Route = {
      geometry: response.geometry,
      waypoints,
      steps,
      bounds: calculateBounds(response.geometry),
    };

    const stats: RouteStats = {
      distanceMeters: response.distanceMeters,
      durationSeconds: response.durationSeconds,
      waypointCount: waypoints.length,
      stepCount: steps.length,
    };

    return { route, stats, steps };
  }

  cancel(): void {
    this.provider.cancel?.();
  }

  /**
   * Replace the underlying provider.
   * Allows swapping providers at runtime.
   */
  setProvider(provider: DirectionsProvider): void {
    this.provider = provider;
  }
}
