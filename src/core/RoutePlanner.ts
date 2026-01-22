import type {
  Coordinate,
  Waypoint,
  Route,
  RouteStats,
  NavigationStep,
  NearestPointResult,
  RoutePlannerOptions,
} from '../types';
import type { DirectionsProvider } from '../providers';
import type { RouteEventMap } from '../events';
import type {
  IWaypointRepository,
  IHistoryManager,
  IRouteCalculator,
  IGeoService,
  IEventBus,
} from '../domain/interfaces';
import {
  WaypointRepository,
  HistoryManagerImpl,
  GeoServiceImpl,
  RouteCalculatorAdapter,
  EventBusImpl,
} from '../infrastructure';

/**
 * Default options for RoutePlanner.
 */
const DEFAULT_OPTIONS: Required<RoutePlannerOptions> = {
  maxHistorySize: 50,
  offRouteThreshold: 50,
  autoRecalculate: true,
};

/**
 * Dependencies that can be injected into RoutePlanner.
 * Supports the Dependency Inversion Principle.
 */
export interface RoutePlannerDependencies {
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
export class RoutePlanner {
  private readonly options: Required<RoutePlannerOptions>;
  private readonly waypointRepo: IWaypointRepository;
  private readonly history: IHistoryManager;
  private readonly calculator: IRouteCalculator;
  private readonly geo: IGeoService;
  private readonly events: IEventBus;

  private currentRoute: Route | null = null;
  private currentStats: RouteStats | null = null;
  private calculating = false;
  private disposed = false;

  /**
   * Create a new RoutePlanner.
   *
   * @param provider - The directions provider for route calculation
   * @param options - Configuration options
   * @param dependencies - Optional dependency overrides for testing or customization
   */
  constructor(
    provider: DirectionsProvider,
    options?: RoutePlannerOptions,
    dependencies?: RoutePlannerDependencies
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Apply dependency injection with defaults (DIP)
    this.waypointRepo = dependencies?.waypointRepository ?? new WaypointRepository();
    this.history = dependencies?.historyManager ?? new HistoryManagerImpl(this.options.maxHistorySize);
    this.calculator = dependencies?.routeCalculator ?? new RouteCalculatorAdapter(provider);
    this.geo = dependencies?.geoService ?? new GeoServiceImpl();
    this.events = dependencies?.eventBus ?? new EventBusImpl();
  }

  // ==================== Event Subscription ====================

  /**
   * Subscribe to route events.
   * @returns An unsubscribe function
   */
  on<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * Unsubscribe from route events.
   */
  off<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): void {
    this.events.off(event, listener);
  }

  /**
   * Subscribe to an event once.
   */
  once<K extends keyof RouteEventMap>(
    event: K,
    listener: (data: RouteEventMap[K]) => void
  ): () => void {
    return this.events.once(event, listener);
  }

  // ==================== Waypoint Management ====================

  /**
   * Add a waypoint to the end of the route.
   */
  async addWaypoint(coordinate: Coordinate, name?: string): Promise<Waypoint> {
    this.ensureNotDisposed();

    this.history.push(this.waypointRepo.getAll(), 'add');

    const waypoint = this.waypointRepo.add(coordinate, name);
    const allWaypoints = this.waypointRepo.getAll();

    this.events.emit('waypoint:added', {
      waypoint,
      index: waypoint.index,
      allWaypoints,
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }

    return waypoint;
  }

  /**
   * Insert a waypoint at a specific index.
   */
  async insertWaypoint(
    coordinate: Coordinate,
    index: number,
    name?: string
  ): Promise<Waypoint> {
    this.ensureNotDisposed();

    this.history.push(this.waypointRepo.getAll(), 'add');

    const waypoint = this.waypointRepo.insert(coordinate, index, name);
    const allWaypoints = this.waypointRepo.getAll();

    this.events.emit('waypoint:added', {
      waypoint,
      index: waypoint.index,
      allWaypoints,
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }

    return waypoint;
  }

  /**
   * Remove a waypoint by ID.
   */
  async removeWaypoint(waypointId: string): Promise<void> {
    this.ensureNotDisposed();

    const waypoint = this.waypointRepo.getById(waypointId);
    if (!waypoint) {
      return;
    }

    this.history.push(this.waypointRepo.getAll(), 'remove');

    const removedIndex = waypoint.index;
    this.waypointRepo.remove(waypointId);
    const allWaypoints = this.waypointRepo.getAll();

    this.events.emit('waypoint:removed', {
      waypoint,
      index: removedIndex,
      allWaypoints,
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }

  /**
   * Update a waypoint's position.
   */
  async updateWaypoint(waypointId: string, coordinate: Coordinate): Promise<void> {
    this.ensureNotDisposed();

    const waypoint = this.waypointRepo.getById(waypointId);
    if (!waypoint) {
      return;
    }

    this.history.push(this.waypointRepo.getAll(), 'update');

    const previousCoordinate = this.waypointRepo.update(waypointId, coordinate);
    if (!previousCoordinate) {
      return;
    }

    const updatedWaypoint = this.waypointRepo.getById(waypointId)!;
    const allWaypoints = this.waypointRepo.getAll();

    this.events.emit('waypoint:updated', {
      waypoint: updatedWaypoint,
      previousCoordinate,
      allWaypoints,
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }

  /**
   * Reorder waypoints (drag-and-drop support).
   */
  async reorderWaypoints(fromIndex: number, toIndex: number): Promise<void> {
    this.ensureNotDisposed();

    this.history.push(this.waypointRepo.getAll(), 'reorder');

    const success = this.waypointRepo.reorder(fromIndex, toIndex);
    if (!success) {
      return;
    }

    const allWaypoints = this.waypointRepo.getAll();

    this.events.emit('waypoint:reordered', {
      fromIndex,
      toIndex,
      allWaypoints,
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }

  /**
   * Get all waypoints.
   */
  getWaypoints(): ReadonlyArray<Waypoint> {
    return this.waypointRepo.getAll();
  }

  /**
   * Clear all waypoints and reset route.
   */
  clear(): void {
    this.ensureNotDisposed();

    const previousCount = this.waypointRepo.count();

    if (previousCount > 0) {
      this.history.push(this.waypointRepo.getAll(), 'clear');
    }

    this.waypointRepo.clear();
    this.currentRoute = null;
    this.currentStats = null;

    this.events.emit('route:cleared', {
      previousWaypointCount: previousCount,
    });
  }

  // ==================== Route Information ====================

  /**
   * Get the current calculated route.
   */
  getRoute(): Route | null {
    return this.currentRoute;
  }

  /**
   * Get route statistics (distance, duration).
   */
  getStats(): RouteStats | null {
    return this.currentStats;
  }

  /**
   * Get turn-by-turn navigation steps.
   */
  getNavigationSteps(): ReadonlyArray<NavigationStep> {
    return this.currentRoute?.steps ?? [];
  }

  /**
   * Check if route is currently being calculated.
   */
  isCalculating(): boolean {
    return this.calculating;
  }

  // ==================== Undo/Redo ====================

  /**
   * Undo the last waypoint change.
   */
  async undo(): Promise<boolean> {
    this.ensureNotDisposed();

    const entry = this.history.undo();
    if (!entry) {
      return false;
    }

    this.waypointRepo.setAll(entry.waypoints);

    this.events.emit('history:change', {
      action: 'undo',
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      historySize: this.history.getSize(),
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }

    return true;
  }

  /**
   * Redo the last undone change.
   */
  async redo(): Promise<boolean> {
    this.ensureNotDisposed();

    const entry = this.history.redo();
    if (!entry) {
      return false;
    }

    this.waypointRepo.setAll(entry.waypoints);

    this.events.emit('history:change', {
      action: 'redo',
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      historySize: this.history.getSize(),
    });

    if (this.options.autoRecalculate) {
      await this.recalculate();
    }

    return true;
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.history.canUndo();
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.history.canRedo();
  }

  /**
   * Get current history size.
   */
  getHistorySize(): number {
    return this.history.getSize();
  }

  // ==================== Geo Utilities ====================

  /**
   * Calculate distance between two coordinates (meters).
   * Static method using default implementation.
   */
  static calculateDistance(from: Coordinate, to: Coordinate): number {
    return new GeoServiceImpl().calculateDistance(from, to);
  }

  /**
   * Find the nearest point on the route to a given coordinate.
   */
  getNearestPointOnRoute(coordinate: Coordinate): NearestPointResult | null {
    if (!this.currentRoute || this.currentRoute.geometry.length < 2) {
      return null;
    }
    return this.geo.findNearestPointOnLine(coordinate, this.currentRoute.geometry);
  }

  /**
   * Check if a coordinate is off-route.
   */
  isOffRoute(coordinate: Coordinate, threshold?: number): boolean {
    if (!this.currentRoute || this.currentRoute.geometry.length < 2) {
      return false;
    }
    return this.geo.isOffRoute(
      coordinate,
      this.currentRoute.geometry,
      threshold ?? this.options.offRouteThreshold
    );
  }

  /**
   * Get the remaining distance from a point along the route.
   */
  getRemainingDistance(coordinate: Coordinate): number | null {
    if (!this.currentRoute || this.currentRoute.geometry.length < 2) {
      return null;
    }

    const nearest = this.geo.findNearestPointOnLine(
      coordinate,
      this.currentRoute.geometry
    );
    if (!nearest) {
      return null;
    }

    return this.geo.calculateRemainingDistance(
      this.currentRoute.geometry,
      nearest.segmentIndex,
      nearest.segmentFraction
    );
  }

  // ==================== Route Calculation ====================

  /**
   * Force recalculation of the current route.
   */
  async recalculate(): Promise<void> {
    this.ensureNotDisposed();

    const waypoints = this.waypointRepo.getAll();

    if (waypoints.length < 2) {
      this.currentRoute = null;
      const previousStats = this.currentStats;
      this.currentStats = null;

      if (previousStats) {
        this.events.emit('stats:updated', {
          stats: {
            distanceMeters: 0,
            durationSeconds: 0,
            waypointCount: waypoints.length,
            stepCount: 0,
          },
          previousStats,
        });
      }
      return;
    }

    this.calculating = true;
    this.events.emit('route:calculating', {
      waypointCount: waypoints.length,
    });

    try {
      const result = await this.calculator.calculate(waypoints);

      if (!result) {
        throw new Error('Failed to calculate directions');
      }

      const previousStats = this.currentStats;

      this.currentRoute = result.route;
      this.currentStats = result.stats;
      this.calculating = false;

      this.events.emit('route:calculated', {
        route: result.route,
        stats: result.stats,
        steps: result.steps,
      });

      this.events.emit('stats:updated', {
        stats: result.stats,
        previousStats,
      });
    } catch (error) {
      this.calculating = false;
      this.events.emit('route:error', {
        error: error instanceof Error ? error : new Error(String(error)),
        waypointCount: waypoints.length,
      });
    }
  }

  // ==================== Lifecycle ====================

  /**
   * Dispose of resources and clear subscriptions.
   */
  dispose(): void {
    this.disposed = true;
    this.events.removeAllListeners();
    this.waypointRepo.clear();
    this.history.clear();
    this.currentRoute = null;
    this.currentStats = null;
    this.calculator.cancel();
  }

  /**
   * Check if the planner has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error('RoutePlanner has been disposed');
    }
  }
}
