import type {
  Waypoint,
  Route,
  RouteStats,
  NavigationStep,
  Coordinate,
} from '../types';

/**
 * Event fired when a waypoint is added
 */
export interface WaypointAddedEvent {
  waypoint: Waypoint;
  index: number;
  allWaypoints: ReadonlyArray<Waypoint>;
}

/**
 * Event fired when a waypoint is removed
 */
export interface WaypointRemovedEvent {
  waypoint: Waypoint;
  index: number;
  allWaypoints: ReadonlyArray<Waypoint>;
}

/**
 * Event fired when a waypoint is updated
 */
export interface WaypointUpdatedEvent {
  waypoint: Waypoint;
  previousCoordinate: Coordinate;
  allWaypoints: ReadonlyArray<Waypoint>;
}

/**
 * Event fired when waypoints are reordered
 */
export interface WaypointReorderedEvent {
  fromIndex: number;
  toIndex: number;
  allWaypoints: ReadonlyArray<Waypoint>;
}

/**
 * Event fired when route calculation starts
 */
export interface RouteCalculatingEvent {
  waypointCount: number;
}

/**
 * Event fired when route calculation completes successfully
 */
export interface RouteCalculatedEvent {
  route: Route;
  stats: RouteStats;
  steps: ReadonlyArray<NavigationStep>;
}

/**
 * Event fired when route calculation fails
 */
export interface RouteErrorEvent {
  error: Error;
  waypointCount: number;
}

/**
 * Event fired when the route is cleared
 */
export interface RouteClearedEvent {
  previousWaypointCount: number;
}

/**
 * Event fired when undo/redo occurs
 */
export interface HistoryChangeEvent {
  action: 'undo' | 'redo';
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
}

/**
 * Event fired when stats change
 */
export interface StatsUpdatedEvent {
  stats: RouteStats;
  previousStats: RouteStats | null;
}

/**
 * Map of all route events and their payloads
 */
export interface RouteEventMap {
  'waypoint:added': WaypointAddedEvent;
  'waypoint:removed': WaypointRemovedEvent;
  'waypoint:updated': WaypointUpdatedEvent;
  'waypoint:reordered': WaypointReorderedEvent;
  'route:calculating': RouteCalculatingEvent;
  'route:calculated': RouteCalculatedEvent;
  'route:error': RouteErrorEvent;
  'route:cleared': RouteClearedEvent;
  'history:change': HistoryChangeEvent;
  'stats:updated': StatsUpdatedEvent;
}
