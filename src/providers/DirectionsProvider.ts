import type { Coordinate, Position } from '../types';

/**
 * Request for fetching directions
 */
export interface DirectionsRequest {
  /** Ordered list of waypoint coordinates */
  waypoints: ReadonlyArray<Coordinate>;
  /** Travel profile (implementation-specific, e.g., 'walking', 'cycling', 'driving') */
  profile?: string;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * A single step in the directions
 */
export interface DirectionsStep {
  /** Human-readable instruction */
  instruction: string;
  /** Maneuver type (turn-left, turn-right, arrive, etc.) */
  maneuverType: string;
  /** Distance of this step in meters */
  distanceMeters: number;
  /** Duration of this step in seconds */
  durationSeconds: number;
  /** Geometry for this step */
  geometry: Position[];
}

/**
 * Response from fetching directions
 */
export interface DirectionsResponse {
  /** Full route geometry as coordinate array */
  geometry: Position[];
  /** Total distance in meters */
  distanceMeters: number;
  /** Estimated duration in seconds */
  durationSeconds: number;
  /** Turn-by-turn navigation steps */
  steps: DirectionsStep[];
}

/**
 * Interface that must be implemented to provide directions from a mapping service.
 *
 * Consumers of route-planner-core must implement this interface for their chosen
 * mapping service (Mapbox, Google Maps, HERE, OpenRouteService, etc.).
 *
 * @example
 * ```typescript
 * class MapboxDirectionsProvider implements DirectionsProvider {
 *   readonly name = 'mapbox';
 *
 *   constructor(private accessToken: string) {}
 *
 *   async getDirections(request: DirectionsRequest): Promise<DirectionsResponse | null> {
 *     // Call Mapbox Directions API
 *     // Transform response to DirectionsResponse format
 *     // Return null if directions cannot be calculated
 *   }
 * }
 * ```
 */
export interface DirectionsProvider {
  /** Unique identifier for this provider */
  readonly name: string;

  /**
   * Fetch directions between waypoints.
   * @param request - The directions request
   * @returns The directions response, or null if directions cannot be calculated
   */
  getDirections(request: DirectionsRequest): Promise<DirectionsResponse | null>;

  /**
   * Optional: Check if the provider is available/configured.
   * @returns true if the provider can make requests
   */
  isAvailable?(): Promise<boolean>;

  /**
   * Optional: Cancel any in-flight requests.
   */
  cancel?(): void;
}
