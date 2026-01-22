import type { Coordinate, Position, NearestPointResult } from '../types';
import { calculateDistance } from './distance';

/**
 * Find the nearest point on a line segment to a given point.
 */
function nearestPointOnSegment(
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): { point: Coordinate; distance: number; fraction: number } {
  const dx = segEnd.longitude - segStart.longitude;
  const dy = segEnd.latitude - segStart.latitude;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Segment is a point
    return {
      point: segStart,
      distance: calculateDistance(point, segStart),
      fraction: 0,
    };
  }

  // Project point onto the segment using planar approximation
  // (sufficient for typical route distances)
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.longitude - segStart.longitude) * dx +
        (point.latitude - segStart.latitude) * dy) /
        lengthSquared
    )
  );

  const projected: Coordinate = {
    longitude: segStart.longitude + t * dx,
    latitude: segStart.latitude + t * dy,
  };

  return {
    point: projected,
    distance: calculateDistance(point, projected),
    fraction: t,
  };
}

/**
 * Find the nearest point on a polyline to a given coordinate.
 * @param point - The coordinate to find the nearest point for
 * @param lineCoordinates - Array of positions forming the line
 * @returns The nearest point result, or null if the line has fewer than 2 points
 */
export function findNearestPointOnLine(
  point: Coordinate,
  lineCoordinates: ReadonlyArray<Position>
): NearestPointResult | null {
  if (lineCoordinates.length < 2) {
    return null;
  }

  let minDistance = Infinity;
  let nearestPoint: Coordinate | null = null;
  let segmentIndex = 0;
  let segmentFraction = 0;

  for (let i = 0; i < lineCoordinates.length - 1; i++) {
    const start: Coordinate = {
      longitude: lineCoordinates[i][0],
      latitude: lineCoordinates[i][1],
    };
    const end: Coordinate = {
      longitude: lineCoordinates[i + 1][0],
      latitude: lineCoordinates[i + 1][1],
    };

    const result = nearestPointOnSegment(point, start, end);

    if (result.distance < minDistance) {
      minDistance = result.distance;
      nearestPoint = result.point;
      segmentIndex = i;
      segmentFraction = result.fraction;
    }
  }

  if (!nearestPoint) {
    return null;
  }

  return {
    point: nearestPoint,
    distance: minDistance,
    segmentIndex,
    segmentFraction,
  };
}

/**
 * Check if a coordinate is off-route (beyond a threshold distance from the line).
 * @param location - The coordinate to check
 * @param routeCoordinates - The route geometry
 * @param thresholdMeters - Maximum allowed distance from the route (default: 50m)
 * @returns true if the location is off-route
 */
export function isOffRoute(
  location: Coordinate,
  routeCoordinates: ReadonlyArray<Position>,
  thresholdMeters: number = 50
): boolean {
  const nearest = findNearestPointOnLine(location, routeCoordinates);
  if (!nearest) {
    return false;
  }
  return nearest.distance > thresholdMeters;
}
