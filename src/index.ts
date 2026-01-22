// Main class and types
export { RoutePlanner } from './core';
export type { RoutePlannerDependencies } from './core';

// Domain interfaces (for custom implementations)
export type {
  IWaypointRepository,
  IHistoryManager,
  IRouteCalculator,
  RouteCalculationResult,
  IGeoService,
  IEventBus,
} from './domain';

// Infrastructure implementations (for extension or testing)
export {
  WaypointRepository,
  HistoryManagerImpl,
  GeoServiceImpl,
  RouteCalculatorAdapter,
  EventBusImpl,
} from './infrastructure';

// Types
export type {
  Position,
  Coordinate,
  BoundingBox,
  Waypoint,
  NavigationStep,
  ManeuverType,
  Route,
  RouteStats,
  HistoryAction,
  HistoryEntry,
  NearestPointResult,
  RoutePlannerOptions,
} from './types';

// Provider types
export type {
  DirectionsProvider,
  DirectionsRequest,
  DirectionsResponse,
  DirectionsStep,
} from './providers';

// Event types
export type {
  RouteEventMap,
  WaypointAddedEvent,
  WaypointRemovedEvent,
  WaypointUpdatedEvent,
  WaypointReorderedEvent,
  RouteCalculatingEvent,
  RouteCalculatedEvent,
  RouteErrorEvent,
  RouteClearedEvent,
  HistoryChangeEvent,
  StatsUpdatedEvent,
} from './events';

// Geo utilities (standalone pure functions)
export {
  calculateDistance,
  calculateLineLength,
  calculateRemainingLength,
  findNearestPointOnLine,
  isOffRoute,
} from './geo';
