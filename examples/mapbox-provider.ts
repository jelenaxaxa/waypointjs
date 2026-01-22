/**
 * Example Mapbox DirectionsProvider implementation.
 *
 * This file shows how to implement the DirectionsProvider interface
 * for Mapbox Directions API.
 *
 * Usage:
 * ```typescript
 * import { RoutePlanner } from 'route-planner-core';
 * import { MapboxDirectionsProvider } from './mapbox-provider';
 *
 * const provider = new MapboxDirectionsProvider('your-mapbox-token');
 * const planner = new RoutePlanner(provider);
 * ```
 */

import type {
  DirectionsProvider,
  DirectionsRequest,
  DirectionsResponse,
} from '../src';

export class MapboxDirectionsProvider implements DirectionsProvider {
  readonly name = 'mapbox';
  private abortController: AbortController | null = null;

  constructor(private accessToken: string) {}

  async getDirections(
    request: DirectionsRequest
  ): Promise<DirectionsResponse | null> {
    const { waypoints, profile = 'walking', options = {} } = request;

    if (waypoints.length < 2) {
      return null;
    }

    // Format waypoints as "lon,lat;lon,lat"
    const coordinates = waypoints
      .map((wp) => `${wp.longitude},${wp.latitude}`)
      .join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`;

    const params = new URLSearchParams({
      access_token: this.accessToken,
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      ...(options as Record<string, string>),
    });

    // Cancel any previous request
    this.cancel();
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${url}?${params}`, {
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        console.error(`Mapbox API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.routes?.[0]) {
        return null;
      }

      const route = data.routes[0];

      return {
        geometry: route.geometry.coordinates,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        steps: route.legs.flatMap((leg: any) =>
          leg.steps.map((step: any) => ({
            instruction: step.maneuver.instruction,
            maneuverType: this.normalizeManeuverType(step.maneuver.type),
            distanceMeters: step.distance,
            durationSeconds: step.duration,
            geometry: step.geometry.coordinates,
          }))
        ),
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      console.error('Mapbox directions error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.accessToken;
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private normalizeManeuverType(type: string): string {
    // Map Mapbox maneuver types to our standard types
    const typeMap: Record<string, string> = {
      'turn left': 'turn-left',
      'turn right': 'turn-right',
      'slight left': 'turn-slight-left',
      'slight right': 'turn-slight-right',
      'sharp left': 'turn-sharp-left',
      'sharp right': 'turn-sharp-right',
      uturn: 'uturn',
      straight: 'continue',
      depart: 'depart',
      arrive: 'arrive',
      merge: 'merge',
      'fork left': 'fork-left',
      'fork right': 'fork-right',
      roundabout: 'roundabout',
      'exit roundabout': 'exit-roundabout',
      rotary: 'roundabout',
      'exit rotary': 'exit-roundabout',
    };

    return typeMap[type.toLowerCase()] || type;
  }
}
