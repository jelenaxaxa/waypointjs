/**
 * Example Google Maps DirectionsProvider implementation.
 *
 * This file shows how to implement the DirectionsProvider interface
 * for Google Maps Directions API.
 *
 * Note: This example uses the REST API. For production use, consider
 * using the official Google Maps JavaScript SDK.
 *
 * Usage:
 * ```typescript
 * import { RoutePlanner } from 'route-planner-core';
 * import { GoogleDirectionsProvider } from './google-provider';
 *
 * const provider = new GoogleDirectionsProvider('your-google-api-key');
 * const planner = new RoutePlanner(provider);
 * ```
 */

import type {
  DirectionsProvider,
  DirectionsRequest,
  DirectionsResponse,
  Position,
} from '../src';

export class GoogleDirectionsProvider implements DirectionsProvider {
  readonly name = 'google';
  private abortController: AbortController | null = null;

  constructor(private apiKey: string) {}

  async getDirections(
    request: DirectionsRequest
  ): Promise<DirectionsResponse | null> {
    const { waypoints, profile = 'walking' } = request;

    if (waypoints.length < 2) {
      return null;
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    const params = new URLSearchParams({
      key: this.apiKey,
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: this.mapProfile(profile),
    });

    if (intermediates.length > 0) {
      params.set(
        'waypoints',
        intermediates.map((wp) => `${wp.latitude},${wp.longitude}`).join('|')
      );
    }

    // Cancel any previous request
    this.cancel();
    this.abortController = new AbortController();

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${params}`,
        { signal: this.abortController.signal }
      );

      if (!response.ok) {
        console.error(`Google API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.routes?.[0]) {
        return null;
      }

      const route = data.routes[0];

      // Decode the overview polyline
      const geometry = this.decodePolyline(route.overview_polyline.points);

      return {
        geometry,
        distanceMeters: route.legs.reduce(
          (sum: number, leg: any) => sum + leg.distance.value,
          0
        ),
        durationSeconds: route.legs.reduce(
          (sum: number, leg: any) => sum + leg.duration.value,
          0
        ),
        steps: route.legs.flatMap((leg: any) =>
          leg.steps.map((step: any) => ({
            instruction: this.stripHtml(step.html_instructions),
            maneuverType: this.normalizeManeuverType(step.maneuver || 'continue'),
            distanceMeters: step.distance.value,
            durationSeconds: step.duration.value,
            geometry: this.decodePolyline(step.polyline.points),
          }))
        ),
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      console.error('Google directions error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private mapProfile(profile: string): string {
    const profileMap: Record<string, string> = {
      walking: 'walking',
      cycling: 'bicycling',
      driving: 'driving',
      transit: 'transit',
    };
    return profileMap[profile] || 'walking';
  }

  private normalizeManeuverType(type: string): string {
    const typeMap: Record<string, string> = {
      'turn-left': 'turn-left',
      'turn-right': 'turn-right',
      'turn-slight-left': 'turn-slight-left',
      'turn-slight-right': 'turn-slight-right',
      'turn-sharp-left': 'turn-sharp-left',
      'turn-sharp-right': 'turn-sharp-right',
      uturn: 'uturn',
      'uturn-left': 'uturn',
      'uturn-right': 'uturn',
      straight: 'continue',
      merge: 'merge',
      'fork-left': 'fork-left',
      'fork-right': 'fork-right',
      roundabout: 'roundabout',
      'roundabout-left': 'roundabout',
      'roundabout-right': 'roundabout',
    };
    return typeMap[type] || type;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Decode a Google encoded polyline string.
   * Algorithm from: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
   */
  private decodePolyline(encoded: string): Position[] {
    const points: Position[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      // Decode latitude
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lat += result & 1 ? ~(result >> 1) : result >> 1;

      // Decode longitude
      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lng += result & 1 ? ~(result >> 1) : result >> 1;

      // Google uses lat,lng but GeoJSON uses lng,lat
      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  }
}
