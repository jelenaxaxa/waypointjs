import type { Coordinate, Position, NearestPointResult } from '../types';
import type { IGeoService } from '../domain/interfaces';
import {
  calculateDistance as geoCalculateDistance,
  calculateLineLength as geoCalculateLineLength,
  calculateRemainingLength,
  findNearestPointOnLine as geoFindNearestPointOnLine,
  isOffRoute as geoIsOffRoute,
} from '../geo';

/**
 * Default implementation of IGeoService.
 *
 * Wraps the pure geo functions to implement the interface.
 * This allows consumers to swap with their own implementation if needed.
 */
export class GeoServiceImpl implements IGeoService {
  calculateDistance(from: Coordinate, to: Coordinate): number {
    return geoCalculateDistance(from, to);
  }

  calculateLineLength(coordinates: ReadonlyArray<Position>): number {
    return geoCalculateLineLength(coordinates);
  }

  findNearestPointOnLine(
    point: Coordinate,
    lineCoordinates: ReadonlyArray<Position>
  ): NearestPointResult | null {
    return geoFindNearestPointOnLine(point, lineCoordinates);
  }

  isOffRoute(
    location: Coordinate,
    routeCoordinates: ReadonlyArray<Position>,
    thresholdMeters: number = 50
  ): boolean {
    return geoIsOffRoute(location, routeCoordinates, thresholdMeters);
  }

  calculateRemainingDistance(
    coordinates: ReadonlyArray<Position>,
    fromIndex: number,
    fromFraction: number
  ): number {
    return calculateRemainingLength(coordinates, fromIndex, fromFraction);
  }
}
