/**
 * GeoJSON Position: [longitude, latitude] or [longitude, latitude, altitude]
 */
type Position = [number, number] | [number, number, number];
/**
 * Named coordinate object for clarity
 */
interface Coordinate {
    longitude: number;
    latitude: number;
}
/**
 * Bounding box: [minLng, minLat, maxLng, maxLat]
 */
type BoundingBox = [number, number, number, number];
/**
 * A waypoint on a route
 */
interface Waypoint {
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
type ManeuverType = 'depart' | 'arrive' | 'turn-left' | 'turn-right' | 'turn-slight-left' | 'turn-slight-right' | 'turn-sharp-left' | 'turn-sharp-right' | 'uturn' | 'continue' | 'merge' | 'fork-left' | 'fork-right' | 'roundabout' | 'exit-roundabout' | 'notification' | 'unknown';
/**
 * A navigation step with turn-by-turn instructions
 */
interface NavigationStep {
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
interface Route {
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
interface RouteStats {
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
type HistoryAction = 'add' | 'remove' | 'update' | 'reorder' | 'clear';
/**
 * A snapshot of waypoints for undo/redo
 */
interface HistoryEntry {
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
interface NearestPointResult {
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
interface RoutePlannerOptions {
    /** Maximum history entries for undo/redo (default: 50) */
    maxHistorySize?: number;
    /** Threshold in meters for off-route detection (default: 50) */
    offRouteThreshold?: number;
    /** Auto-recalculate route when waypoints change (default: true) */
    autoRecalculate?: boolean;
}

/**
 * Request for fetching directions
 */
interface DirectionsRequest {
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
interface DirectionsStep {
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
interface DirectionsResponse {
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
interface DirectionsProvider {
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

/**
 * Event fired when a waypoint is added
 */
interface WaypointAddedEvent {
    waypoint: Waypoint;
    index: number;
    allWaypoints: ReadonlyArray<Waypoint>;
}
/**
 * Event fired when a waypoint is removed
 */
interface WaypointRemovedEvent {
    waypoint: Waypoint;
    index: number;
    allWaypoints: ReadonlyArray<Waypoint>;
}
/**
 * Event fired when a waypoint is updated
 */
interface WaypointUpdatedEvent {
    waypoint: Waypoint;
    previousCoordinate: Coordinate;
    allWaypoints: ReadonlyArray<Waypoint>;
}
/**
 * Event fired when waypoints are reordered
 */
interface WaypointReorderedEvent {
    fromIndex: number;
    toIndex: number;
    allWaypoints: ReadonlyArray<Waypoint>;
}
/**
 * Event fired when route calculation starts
 */
interface RouteCalculatingEvent {
    waypointCount: number;
}
/**
 * Event fired when route calculation completes successfully
 */
interface RouteCalculatedEvent {
    route: Route;
    stats: RouteStats;
    steps: ReadonlyArray<NavigationStep>;
}
/**
 * Event fired when route calculation fails
 */
interface RouteErrorEvent {
    error: Error;
    waypointCount: number;
}
/**
 * Event fired when the route is cleared
 */
interface RouteClearedEvent {
    previousWaypointCount: number;
}
/**
 * Event fired when undo/redo occurs
 */
interface HistoryChangeEvent {
    action: 'undo' | 'redo';
    canUndo: boolean;
    canRedo: boolean;
    historySize: number;
}
/**
 * Event fired when stats change
 */
interface StatsUpdatedEvent {
    stats: RouteStats;
    previousStats: RouteStats | null;
}
/**
 * Map of all route events and their payloads
 */
interface RouteEventMap {
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

/**
 * Repository interface for managing waypoints.
 * Follows the Repository pattern from DDD.
 *
 * Single Responsibility: Only handles waypoint CRUD operations.
 */
interface IWaypointRepository {
    /**
     * Get all waypoints in order.
     */
    getAll(): ReadonlyArray<Waypoint>;
    /**
     * Get a waypoint by its ID.
     */
    getById(id: string): Waypoint | null;
    /**
     * Get a waypoint by its index.
     */
    getByIndex(index: number): Waypoint | null;
    /**
     * Add a waypoint to the end.
     * @returns The created waypoint
     */
    add(coordinate: Coordinate, name?: string): Waypoint;
    /**
     * Insert a waypoint at a specific index.
     * @returns The created waypoint
     */
    insert(coordinate: Coordinate, index: number, name?: string): Waypoint;
    /**
     * Remove a waypoint by ID.
     * @returns The removed waypoint, or null if not found
     */
    remove(id: string): Waypoint | null;
    /**
     * Update a waypoint's position.
     * @returns The previous coordinate, or null if waypoint not found
     */
    update(id: string, coordinate: Coordinate): Coordinate | null;
    /**
     * Reorder a waypoint from one index to another.
     * @returns true if successful
     */
    reorder(fromIndex: number, toIndex: number): boolean;
    /**
     * Replace all waypoints (used for undo/redo).
     */
    setAll(waypoints: ReadonlyArray<Waypoint>): void;
    /**
     * Get the total count of waypoints.
     */
    count(): number;
    /**
     * Remove all waypoints.
     */
    clear(): void;
}

/**
 * Interface for managing undo/redo history.
 *
 * Single Responsibility: Only handles history state management.
 */
interface IHistoryManager {
    /**
     * Push a new entry to history.
     * Truncates any "future" entries (redo stack).
     */
    push(waypoints: ReadonlyArray<Waypoint>, action: HistoryAction): void;
    /**
     * Get the previous state (undo).
     * @returns The previous entry, or null if at the beginning
     */
    undo(): HistoryEntry | null;
    /**
     * Get the next state (redo).
     * @returns The next entry, or null if at the end
     */
    redo(): HistoryEntry | null;
    /**
     * Check if undo is available.
     */
    canUndo(): boolean;
    /**
     * Check if redo is available.
     */
    canRedo(): boolean;
    /**
     * Get the current history size.
     */
    getSize(): number;
    /**
     * Clear all history.
     */
    clear(): void;
}

/**
 * Result of a route calculation.
 */
interface RouteCalculationResult {
    route: Route;
    stats: RouteStats;
    steps: ReadonlyArray<NavigationStep>;
}
/**
 * Interface for calculating routes from waypoints.
 *
 * Single Responsibility: Only handles route calculation.
 * This is the application's port to external directions services.
 */
interface IRouteCalculator {
    /**
     * Calculate a route from the given waypoints.
     * @returns The calculation result, or null if calculation failed
     */
    calculate(waypoints: ReadonlyArray<Waypoint>): Promise<RouteCalculationResult | null>;
    /**
     * Cancel any in-progress calculation.
     */
    cancel(): void;
}

/**
 * Interface for geographic calculations.
 *
 * Single Responsibility: Only handles geo computations.
 * All methods are pure functions with no side effects.
 */
interface IGeoService {
    /**
     * Calculate distance between two coordinates.
     * @returns Distance in meters
     */
    calculateDistance(from: Coordinate, to: Coordinate): number;
    /**
     * Calculate the total length of a polyline.
     * @returns Length in meters
     */
    calculateLineLength(coordinates: ReadonlyArray<Position>): number;
    /**
     * Find the nearest point on a line to a given coordinate.
     * @returns The nearest point result, or null if line has < 2 points
     */
    findNearestPointOnLine(point: Coordinate, lineCoordinates: ReadonlyArray<Position>): NearestPointResult | null;
    /**
     * Check if a coordinate is off-route.
     * @param thresholdMeters - Maximum distance from route (default: 50m)
     */
    isOffRoute(location: Coordinate, routeCoordinates: ReadonlyArray<Position>, thresholdMeters?: number): boolean;
    /**
     * Calculate the remaining distance from a point along the route.
     * @returns Remaining distance in meters
     */
    calculateRemainingDistance(coordinates: ReadonlyArray<Position>, fromIndex: number, fromFraction: number): number;
}

/**
 * Interface for publishing and subscribing to domain events.
 *
 * Single Responsibility: Only handles event pub/sub.
 * Decouples event producers from consumers.
 */
interface IEventBus {
    /**
     * Subscribe to an event.
     * @returns An unsubscribe function
     */
    on<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): () => void;
    /**
     * Unsubscribe from an event.
     */
    off<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): void;
    /**
     * Subscribe to an event once.
     * @returns An unsubscribe function
     */
    once<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): () => void;
    /**
     * Publish an event to all subscribers.
     */
    emit<K extends keyof RouteEventMap>(event: K, data: RouteEventMap[K]): void;
    /**
     * Remove all listeners.
     */
    removeAllListeners(event?: keyof RouteEventMap): void;
}

/**
 * Dependencies that can be injected into RoutePlanner.
 * Supports the Dependency Inversion Principle.
 */
interface RoutePlannerDependencies {
    waypointRepository?: IWaypointRepository;
    historyManager?: IHistoryManager;
    routeCalculator?: IRouteCalculator;
    geoService?: IGeoService;
    eventBus?: IEventBus;
}
/**
 * The main route planner facade.
 *
 * This class follows SOLID principles:
 *
 * - Single Responsibility: Acts as a facade/coordinator only. Actual work
 *   is delegated to specialized services.
 *
 * - Open/Closed: New functionality can be added by implementing interfaces
 *   and injecting them, without modifying this class.
 *
 * - Liskov Substitution: All dependencies are interfaces, allowing any
 *   conforming implementation to be substituted.
 *
 * - Interface Segregation: Dependencies use small, focused interfaces
 *   (IWaypointRepository, IHistoryManager, etc.) rather than one large interface.
 *
 * - Dependency Inversion: Depends on abstractions (interfaces), not concretions.
 *   Dependencies are injected, not instantiated internally.
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const planner = new RoutePlanner(myDirectionsProvider);
 *
 * // With custom dependencies (DI)
 * const planner = new RoutePlanner(myProvider, {}, {
 *   waypointRepository: new CustomWaypointRepo(),
 *   geoService: new CustomGeoService(),
 * });
 * ```
 */
declare class RoutePlanner {
    private readonly options;
    private readonly waypointRepo;
    private readonly history;
    private readonly calculator;
    private readonly geo;
    private readonly events;
    private currentRoute;
    private currentStats;
    private calculating;
    private disposed;
    /**
     * Create a new RoutePlanner.
     *
     * @param provider - The directions provider for route calculation
     * @param options - Configuration options
     * @param dependencies - Optional dependency overrides for testing or customization
     */
    constructor(provider: DirectionsProvider, options?: RoutePlannerOptions, dependencies?: RoutePlannerDependencies);
    /**
     * Subscribe to route events.
     * @returns An unsubscribe function
     */
    on<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): () => void;
    /**
     * Unsubscribe from route events.
     */
    off<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): void;
    /**
     * Subscribe to an event once.
     */
    once<K extends keyof RouteEventMap>(event: K, listener: (data: RouteEventMap[K]) => void): () => void;
    /**
     * Add a waypoint to the end of the route.
     */
    addWaypoint(coordinate: Coordinate, name?: string): Promise<Waypoint>;
    /**
     * Insert a waypoint at a specific index.
     */
    insertWaypoint(coordinate: Coordinate, index: number, name?: string): Promise<Waypoint>;
    /**
     * Remove a waypoint by ID.
     */
    removeWaypoint(waypointId: string): Promise<void>;
    /**
     * Update a waypoint's position.
     */
    updateWaypoint(waypointId: string, coordinate: Coordinate): Promise<void>;
    /**
     * Reorder waypoints (drag-and-drop support).
     */
    reorderWaypoints(fromIndex: number, toIndex: number): Promise<void>;
    /**
     * Get all waypoints.
     */
    getWaypoints(): ReadonlyArray<Waypoint>;
    /**
     * Clear all waypoints and reset route.
     */
    clear(): void;
    /**
     * Get the current calculated route.
     */
    getRoute(): Route | null;
    /**
     * Get route statistics (distance, duration).
     */
    getStats(): RouteStats | null;
    /**
     * Get turn-by-turn navigation steps.
     */
    getNavigationSteps(): ReadonlyArray<NavigationStep>;
    /**
     * Check if route is currently being calculated.
     */
    isCalculating(): boolean;
    /**
     * Undo the last waypoint change.
     */
    undo(): Promise<boolean>;
    /**
     * Redo the last undone change.
     */
    redo(): Promise<boolean>;
    /**
     * Check if undo is available.
     */
    canUndo(): boolean;
    /**
     * Check if redo is available.
     */
    canRedo(): boolean;
    /**
     * Get current history size.
     */
    getHistorySize(): number;
    /**
     * Calculate distance between two coordinates (meters).
     * Static method using default implementation.
     */
    static calculateDistance(from: Coordinate, to: Coordinate): number;
    /**
     * Find the nearest point on the route to a given coordinate.
     */
    getNearestPointOnRoute(coordinate: Coordinate): NearestPointResult | null;
    /**
     * Check if a coordinate is off-route.
     */
    isOffRoute(coordinate: Coordinate, threshold?: number): boolean;
    /**
     * Get the remaining distance from a point along the route.
     */
    getRemainingDistance(coordinate: Coordinate): number | null;
    /**
     * Force recalculation of the current route.
     */
    recalculate(): Promise<void>;
    /**
     * Dispose of resources and clear subscriptions.
     */
    dispose(): void;
    /**
     * Check if the planner has been disposed.
     */
    isDisposed(): boolean;
    private ensureNotDisposed;
}

/**
 * In-memory implementation of IWaypointRepository.
 *
 * Implements the Repository pattern with automatic reindexing.
 */
declare class WaypointRepository implements IWaypointRepository {
    private waypoints;
    getAll(): ReadonlyArray<Waypoint>;
    getById(id: string): Waypoint | null;
    getByIndex(index: number): Waypoint | null;
    add(coordinate: Coordinate, name?: string): Waypoint;
    insert(coordinate: Coordinate, index: number, name?: string): Waypoint;
    remove(id: string): Waypoint | null;
    update(id: string, coordinate: Coordinate): Coordinate | null;
    reorder(fromIndex: number, toIndex: number): boolean;
    setAll(waypoints: ReadonlyArray<Waypoint>): void;
    count(): number;
    clear(): void;
    private reindex;
}

/**
 * Default implementation of IHistoryManager.
 *
 * Uses a circular buffer with configurable max size.
 */
declare class HistoryManagerImpl implements IHistoryManager {
    private readonly maxSize;
    private history;
    private currentIndex;
    constructor(maxSize?: number);
    push(waypoints: ReadonlyArray<Waypoint>, action: HistoryAction): void;
    undo(): HistoryEntry | null;
    redo(): HistoryEntry | null;
    canUndo(): boolean;
    canRedo(): boolean;
    getSize(): number;
    clear(): void;
}

/**
 * Default implementation of IGeoService.
 *
 * Wraps the pure geo functions to implement the interface.
 * This allows consumers to swap with their own implementation if needed.
 */
declare class GeoServiceImpl implements IGeoService {
    calculateDistance(from: Coordinate, to: Coordinate): number;
    calculateLineLength(coordinates: ReadonlyArray<Position>): number;
    findNearestPointOnLine(point: Coordinate, lineCoordinates: ReadonlyArray<Position>): NearestPointResult | null;
    isOffRoute(location: Coordinate, routeCoordinates: ReadonlyArray<Position>, thresholdMeters?: number): boolean;
    calculateRemainingDistance(coordinates: ReadonlyArray<Position>, fromIndex: number, fromFraction: number): number;
}

/**
 * Adapter that wraps a DirectionsProvider to implement IRouteCalculator.
 *
 * Follows the Adapter pattern - converts the external DirectionsProvider
 * interface to our internal IRouteCalculator interface.
 *
 * This is the boundary between our domain and external infrastructure.
 */
declare class RouteCalculatorAdapter implements IRouteCalculator {
    private provider;
    constructor(provider: DirectionsProvider);
    calculate(waypoints: ReadonlyArray<Waypoint>): Promise<RouteCalculationResult | null>;
    cancel(): void;
    /**
     * Replace the underlying provider.
     * Allows swapping providers at runtime.
     */
    setProvider(provider: DirectionsProvider): void;
}

type Listener<T> = (data: T) => void;
/**
 * Default implementation of IEventBus.
 *
 * Simple in-memory pub/sub for domain events.
 */
declare class EventBusImpl implements IEventBus {
    private listeners;
    on<K extends keyof RouteEventMap>(event: K, listener: Listener<RouteEventMap[K]>): () => void;
    off<K extends keyof RouteEventMap>(event: K, listener: Listener<RouteEventMap[K]>): void;
    once<K extends keyof RouteEventMap>(event: K, listener: Listener<RouteEventMap[K]>): () => void;
    emit<K extends keyof RouteEventMap>(event: K, data: RouteEventMap[K]): void;
    removeAllListeners(event?: keyof RouteEventMap): void;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param from - Starting coordinate
 * @param to - Ending coordinate
 * @returns Distance in meters
 */
declare function calculateDistance(from: Coordinate, to: Coordinate): number;

/**
 * Calculate the total length of a polyline.
 * @param coordinates - Array of positions forming the line
 * @returns Total length in meters
 */
declare function calculateLineLength(coordinates: ReadonlyArray<Position>): number;
/**
 * Calculate the length of a polyline from a given segment index to the end.
 * @param coordinates - Array of positions forming the line
 * @param fromIndex - Starting segment index
 * @param fromFraction - Fractional position along the starting segment (0-1)
 * @returns Remaining length in meters
 */
declare function calculateRemainingLength(coordinates: ReadonlyArray<Position>, fromIndex: number, fromFraction: number): number;

/**
 * Find the nearest point on a polyline to a given coordinate.
 * @param point - The coordinate to find the nearest point for
 * @param lineCoordinates - Array of positions forming the line
 * @returns The nearest point result, or null if the line has fewer than 2 points
 */
declare function findNearestPointOnLine(point: Coordinate, lineCoordinates: ReadonlyArray<Position>): NearestPointResult | null;
/**
 * Check if a coordinate is off-route (beyond a threshold distance from the line).
 * @param location - The coordinate to check
 * @param routeCoordinates - The route geometry
 * @param thresholdMeters - Maximum allowed distance from the route (default: 50m)
 * @returns true if the location is off-route
 */
declare function isOffRoute(location: Coordinate, routeCoordinates: ReadonlyArray<Position>, thresholdMeters?: number): boolean;

export { type BoundingBox, type Coordinate, type DirectionsProvider, type DirectionsRequest, type DirectionsResponse, type DirectionsStep, EventBusImpl, GeoServiceImpl, type HistoryAction, type HistoryChangeEvent, type HistoryEntry, HistoryManagerImpl, type IEventBus, type IGeoService, type IHistoryManager, type IRouteCalculator, type IWaypointRepository, type ManeuverType, type NavigationStep, type NearestPointResult, type Position, type Route, type RouteCalculatedEvent, type RouteCalculatingEvent, type RouteCalculationResult, RouteCalculatorAdapter, type RouteClearedEvent, type RouteErrorEvent, type RouteEventMap, RoutePlanner, type RoutePlannerDependencies, type RoutePlannerOptions, type RouteStats, type StatsUpdatedEvent, type Waypoint, type WaypointAddedEvent, type WaypointRemovedEvent, type WaypointReorderedEvent, WaypointRepository, type WaypointUpdatedEvent, calculateDistance, calculateLineLength, calculateRemainingLength, findNearestPointOnLine, isOffRoute };
