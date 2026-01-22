import type { Position, Coordinate } from '../types';
import { calculateDistance } from './distance';

/**
 * Convert a Position to a Coordinate
 */
function positionToCoordinate(pos: Position): Coordinate {
  return { longitude: pos[0], latitude: pos[1] };
}

/**
 * Calculate the total length of a polyline.
 * @param coordinates - Array of positions forming the line
 * @returns Total length in meters
 */
export function calculateLineLength(
  coordinates: ReadonlyArray<Position>
): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let totalLength = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const from = positionToCoordinate(coordinates[i]);
    const to = positionToCoordinate(coordinates[i + 1]);
    totalLength += calculateDistance(from, to);
  }

  return totalLength;
}

/**
 * Calculate the length of a polyline from a given segment index to the end.
 * @param coordinates - Array of positions forming the line
 * @param fromIndex - Starting segment index
 * @param fromFraction - Fractional position along the starting segment (0-1)
 * @returns Remaining length in meters
 */
export function calculateRemainingLength(
  coordinates: ReadonlyArray<Position>,
  fromIndex: number,
  fromFraction: number
): number {
  if (coordinates.length < 2 || fromIndex >= coordinates.length - 1) {
    return 0;
  }

  let totalLength = 0;

  // Add partial length of current segment
  const segmentStart = positionToCoordinate(coordinates[fromIndex]);
  const segmentEnd = positionToCoordinate(coordinates[fromIndex + 1]);
  const segmentLength = calculateDistance(segmentStart, segmentEnd);
  totalLength += segmentLength * (1 - fromFraction);

  // Add length of remaining segments
  for (let i = fromIndex + 1; i < coordinates.length - 1; i++) {
    const from = positionToCoordinate(coordinates[i]);
    const to = positionToCoordinate(coordinates[i + 1]);
    totalLength += calculateDistance(from, to);
  }

  return totalLength;
}
