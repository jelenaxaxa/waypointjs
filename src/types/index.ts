/**
 * GeoJSON Position: [longitude, latitude] or [longitude, latitude, altitude]
 */
export type Position = [number, number] | [number, number, number];

/**
 * Named coordinate object for clarity
 */
export interface Coordinate {
  longitude: number;
  latitude: number;
}

/**
 * Bounding box: [minLng, minLat, maxLng, maxLat]
 */
export type BoundingBox = [number, number, number, number];

/**
 * A waypoint on a route
 */
export interface Waypoint {
  /** Unique identifier */
  readonly id: string;
  /** Position in the waypoint list (0-indexed) */
  readonly index: number;
  /** Longitude */
  readonly longitude: number;
  /** Latitude */
  readonly latitude: number;
  /** Optional display name */
  readonly name?: string;
  /** Timestamp when created */
  readonly createdAt: number;
}

/**
 * Maneuver types for navigation steps
 */
export type ManeuverType =
  | 'depart'
  | 'arrive'
  | 'turn-left'
  | 'turn-right'
  | 'turn-slight-left'
  | 'turn-slight-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'uturn'
  | 'continue'
  | 'merge'
  | 'fork-left'
  | 'fork-right'
  | 'roundabout'
  | 'exit-roundabout'
  | 'notification'
  | 'unknown';

/**
 * A navigation step with turn-by-turn instructions
 */
export interface NavigationStep {
  /** Unique identifier */
  readonly id: string;
  /** Step index (0-indexed) */
  readonly index: number;
  /** Human-readable instruction */
  readonly instruction: string;
  /** Maneuver type */
  readonly maneuverType: ManeuverType;
  /** Distance of this step in meters */
  readonly distanceMeters: number;
  /** Duration of this step in seconds */
  readonly durationSeconds: number;
  /** Geometry for this step */
  readonly geometry: ReadonlyArray<Position>;
}

/**
 * A calculated route
 */
export interface Route {
  /** Full route geometry as coordinate array */
  readonly geometry: ReadonlyArray<Position>;
  /** Ordered waypoints */
  readonly waypoints: ReadonlyArray<Waypoint>;
  /** Turn-by-turn navigation steps */
  readonly steps: ReadonlyArray<NavigationStep>;
  /** Bounding box of the route */
  readonly bounds: BoundingBox;
}

/**
 * Statistics for a route
 */
export interface RouteStats {
  /** Total distance in meters */
  readonly distanceMeters: number;
  /** Estimated duration in seconds */
  readonly durationSeconds: number;
  /** Number of waypoints */
  readonly waypointCount: number;
  /** Number of navigation steps */
  readonly stepCount: number;
}

/**
 * Actions that can be recorded in history
 */
export type HistoryAction = 'add' | 'remove' | 'update' | 'reorder' | 'clear';

/**
 * A snapshot of waypoints for undo/redo
 */
export interface HistoryEntry {
  /** Snapshot of waypoints at this point */
  readonly waypoints: ReadonlyArray<Waypoint>;
  /** Timestamp of the change */
  readonly timestamp: number;
  /** Type of action that created this entry */
  readonly action: HistoryAction;
}

/**
 * Result from finding nearest point on a route
 */
export interface NearestPointResult {
  /** The nearest point on the route */
  point: Coordinate;
  /** Distance from the input coordinate to the nearest point (meters) */
  distance: number;
  /** Index of the segment where the nearest point lies */
  segmentIndex: number;
  /** Fractional position along the segment (0-1) */
  segmentFraction: number;
}

/**
 * Options for the RoutePlanner
 */
export interface RoutePlannerOptions {
  /** Maximum history entries for undo/redo (default: 50) */
  maxHistorySize?: number;
  /** Threshold in meters for off-route detection (default: 50) */
  offRouteThreshold?: number;
  /** Auto-recalculate route when waypoints change (default: true) */
  autoRecalculate?: boolean;
}
