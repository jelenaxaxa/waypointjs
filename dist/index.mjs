// src/infrastructure/WaypointRepository.ts
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
var WaypointRepository = class {
  constructor() {
    this.waypoints = [];
  }
  getAll() {
    return this.waypoints;
  }
  getById(id) {
    return this.waypoints.find((wp) => wp.id === id) ?? null;
  }
  getByIndex(index) {
    return this.waypoints[index] ?? null;
  }
  add(coordinate, name) {
    const waypoint = {
      id: generateId(),
      index: this.waypoints.length,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
      name,
      createdAt: Date.now()
    };
    this.waypoints.push(waypoint);
    return waypoint;
  }
  insert(coordinate, index, name) {
    const clampedIndex = Math.max(0, Math.min(index, this.waypoints.length));
    const waypoint = {
      id: generateId(),
      index: clampedIndex,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
      name,
      createdAt: Date.now()
    };
    this.waypoints.splice(clampedIndex, 0, waypoint);
    this.reindex();
    return waypoint;
  }
  remove(id) {
    const index = this.waypoints.findIndex((wp) => wp.id === id);
    if (index === -1) {
      return null;
    }
    const [removed] = this.waypoints.splice(index, 1);
    this.reindex();
    return removed;
  }
  update(id, coordinate) {
    const index = this.waypoints.findIndex((wp) => wp.id === id);
    if (index === -1) {
      return null;
    }
    const previous = {
      longitude: this.waypoints[index].longitude,
      latitude: this.waypoints[index].latitude
    };
    this.waypoints[index] = {
      ...this.waypoints[index],
      longitude: coordinate.longitude,
      latitude: coordinate.latitude
    };
    return previous;
  }
  reorder(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.waypoints.length || toIndex < 0 || toIndex >= this.waypoints.length) {
      return false;
    }
    const [waypoint] = this.waypoints.splice(fromIndex, 1);
    this.waypoints.splice(toIndex, 0, waypoint);
    this.reindex();
    return true;
  }
  setAll(waypoints) {
    this.waypoints = waypoints.map((wp, index) => ({
      ...wp,
      index
    }));
  }
  count() {
    return this.waypoints.length;
  }
  clear() {
    this.waypoints = [];
  }
  reindex() {
    this.waypoints = this.waypoints.map((wp, index) => ({
      ...wp,
      index
    }));
  }
};

// src/infrastructure/HistoryManagerImpl.ts
var HistoryManagerImpl = class {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.history = [];
    this.currentIndex = -1;
  }
  push(waypoints, action) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push({
      waypoints: waypoints.map((wp) => ({ ...wp })),
      timestamp: Date.now(),
      action
    });
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }
    this.currentIndex = this.history.length - 1;
  }
  undo() {
    if (!this.canUndo()) {
      return null;
    }
    this.currentIndex--;
    return this.history[this.currentIndex];
  }
  redo() {
    if (!this.canRedo()) {
      return null;
    }
    this.currentIndex++;
    return this.history[this.currentIndex];
  }
  canUndo() {
    return this.currentIndex > 0;
  }
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
  getSize() {
    return this.history.length;
  }
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
};

// src/geo/distance.ts
var EARTH_RADIUS_METERS = 63710088e-1;
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function calculateDistance(from, to) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// src/geo/lineLength.ts
function positionToCoordinate(pos) {
  return { longitude: pos[0], latitude: pos[1] };
}
function calculateLineLength(coordinates) {
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
function calculateRemainingLength(coordinates, fromIndex, fromFraction) {
  if (coordinates.length < 2 || fromIndex >= coordinates.length - 1) {
    return 0;
  }
  let totalLength = 0;
  const segmentStart = positionToCoordinate(coordinates[fromIndex]);
  const segmentEnd = positionToCoordinate(coordinates[fromIndex + 1]);
  const segmentLength = calculateDistance(segmentStart, segmentEnd);
  totalLength += segmentLength * (1 - fromFraction);
  for (let i = fromIndex + 1; i < coordinates.length - 1; i++) {
    const from = positionToCoordinate(coordinates[i]);
    const to = positionToCoordinate(coordinates[i + 1]);
    totalLength += calculateDistance(from, to);
  }
  return totalLength;
}

// src/geo/nearestPoint.ts
function nearestPointOnSegment(point, segStart, segEnd) {
  const dx = segEnd.longitude - segStart.longitude;
  const dy = segEnd.latitude - segStart.latitude;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return {
      point: segStart,
      distance: calculateDistance(point, segStart),
      fraction: 0
    };
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.longitude - segStart.longitude) * dx + (point.latitude - segStart.latitude) * dy) / lengthSquared
    )
  );
  const projected = {
    longitude: segStart.longitude + t * dx,
    latitude: segStart.latitude + t * dy
  };
  return {
    point: projected,
    distance: calculateDistance(point, projected),
    fraction: t
  };
}
function findNearestPointOnLine(point, lineCoordinates) {
  if (lineCoordinates.length < 2) {
    return null;
  }
  let minDistance = Infinity;
  let nearestPoint = null;
  let segmentIndex = 0;
  let segmentFraction = 0;
  for (let i = 0; i < lineCoordinates.length - 1; i++) {
    const start = {
      longitude: lineCoordinates[i][0],
      latitude: lineCoordinates[i][1]
    };
    const end = {
      longitude: lineCoordinates[i + 1][0],
      latitude: lineCoordinates[i + 1][1]
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
    segmentFraction
  };
}
function isOffRoute(location, routeCoordinates, thresholdMeters = 50) {
  const nearest = findNearestPointOnLine(location, routeCoordinates);
  if (!nearest) {
    return false;
  }
  return nearest.distance > thresholdMeters;
}

// src/infrastructure/GeoServiceImpl.ts
var GeoServiceImpl = class {
  calculateDistance(from, to) {
    return calculateDistance(from, to);
  }
  calculateLineLength(coordinates) {
    return calculateLineLength(coordinates);
  }
  findNearestPointOnLine(point, lineCoordinates) {
    return findNearestPointOnLine(point, lineCoordinates);
  }
  isOffRoute(location, routeCoordinates, thresholdMeters = 50) {
    return isOffRoute(location, routeCoordinates, thresholdMeters);
  }
  calculateRemainingDistance(coordinates, fromIndex, fromFraction) {
    return calculateRemainingLength(coordinates, fromIndex, fromFraction);
  }
};

// src/infrastructure/RouteCalculatorAdapter.ts
function generateId2() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function calculateBounds(coordinates) {
  if (coordinates.length === 0) {
    return [0, 0, 0, 0];
  }
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  }
  return [minLng, minLat, maxLng, maxLat];
}
var RouteCalculatorAdapter = class {
  constructor(provider) {
    this.provider = provider;
  }
  async calculate(waypoints) {
    if (waypoints.length < 2) {
      return null;
    }
    const response = await this.provider.getDirections({
      waypoints: waypoints.map((wp) => ({
        longitude: wp.longitude,
        latitude: wp.latitude
      }))
    });
    if (!response) {
      return null;
    }
    const steps = response.steps.map((step, index) => ({
      id: generateId2(),
      index,
      instruction: step.instruction,
      maneuverType: step.maneuverType,
      distanceMeters: step.distanceMeters,
      durationSeconds: step.durationSeconds,
      geometry: step.geometry
    }));
    const route = {
      geometry: response.geometry,
      waypoints,
      steps,
      bounds: calculateBounds(response.geometry)
    };
    const stats = {
      distanceMeters: response.distanceMeters,
      durationSeconds: response.durationSeconds,
      waypointCount: waypoints.length,
      stepCount: steps.length
    };
    return { route, stats, steps };
  }
  cancel() {
    this.provider.cancel?.();
  }
  /**
   * Replace the underlying provider.
   * Allows swapping providers at runtime.
   */
  setProvider(provider) {
    this.provider = provider;
  }
};

// src/infrastructure/EventBusImpl.ts
var EventBusImpl = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }
  once(event, listener) {
    const onceWrapper = (data) => {
      this.off(event, onceWrapper);
      listener(data);
    };
    return this.on(event, onceWrapper);
  }
  emit(event, data) {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    });
  }
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
};

// src/core/RoutePlanner.ts
var DEFAULT_OPTIONS = {
  maxHistorySize: 50,
  offRouteThreshold: 50,
  autoRecalculate: true
};
var RoutePlanner = class {
  /**
   * Create a new RoutePlanner.
   *
   * @param provider - The directions provider for route calculation
   * @param options - Configuration options
   * @param dependencies - Optional dependency overrides for testing or customization
   */
  constructor(provider, options, dependencies) {
    this.currentRoute = null;
    this.currentStats = null;
    this.calculating = false;
    this.disposed = false;
    this.options = { ...DEFAULT_OPTIONS, ...options };
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
  on(event, listener) {
    return this.events.on(event, listener);
  }
  /**
   * Unsubscribe from route events.
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
  /**
   * Subscribe to an event once.
   */
  once(event, listener) {
    return this.events.once(event, listener);
  }
  // ==================== Waypoint Management ====================
  /**
   * Add a waypoint to the end of the route.
   */
  async addWaypoint(coordinate, name) {
    this.ensureNotDisposed();
    this.history.push(this.waypointRepo.getAll(), "add");
    const waypoint = this.waypointRepo.add(coordinate, name);
    const allWaypoints = this.waypointRepo.getAll();
    this.events.emit("waypoint:added", {
      waypoint,
      index: waypoint.index,
      allWaypoints
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
    return waypoint;
  }
  /**
   * Insert a waypoint at a specific index.
   */
  async insertWaypoint(coordinate, index, name) {
    this.ensureNotDisposed();
    this.history.push(this.waypointRepo.getAll(), "add");
    const waypoint = this.waypointRepo.insert(coordinate, index, name);
    const allWaypoints = this.waypointRepo.getAll();
    this.events.emit("waypoint:added", {
      waypoint,
      index: waypoint.index,
      allWaypoints
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
    return waypoint;
  }
  /**
   * Remove a waypoint by ID.
   */
  async removeWaypoint(waypointId) {
    this.ensureNotDisposed();
    const waypoint = this.waypointRepo.getById(waypointId);
    if (!waypoint) {
      return;
    }
    this.history.push(this.waypointRepo.getAll(), "remove");
    const removedIndex = waypoint.index;
    this.waypointRepo.remove(waypointId);
    const allWaypoints = this.waypointRepo.getAll();
    this.events.emit("waypoint:removed", {
      waypoint,
      index: removedIndex,
      allWaypoints
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }
  /**
   * Update a waypoint's position.
   */
  async updateWaypoint(waypointId, coordinate) {
    this.ensureNotDisposed();
    const waypoint = this.waypointRepo.getById(waypointId);
    if (!waypoint) {
      return;
    }
    this.history.push(this.waypointRepo.getAll(), "update");
    const previousCoordinate = this.waypointRepo.update(waypointId, coordinate);
    if (!previousCoordinate) {
      return;
    }
    const updatedWaypoint = this.waypointRepo.getById(waypointId);
    const allWaypoints = this.waypointRepo.getAll();
    this.events.emit("waypoint:updated", {
      waypoint: updatedWaypoint,
      previousCoordinate,
      allWaypoints
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }
  /**
   * Reorder waypoints (drag-and-drop support).
   */
  async reorderWaypoints(fromIndex, toIndex) {
    this.ensureNotDisposed();
    this.history.push(this.waypointRepo.getAll(), "reorder");
    const success = this.waypointRepo.reorder(fromIndex, toIndex);
    if (!success) {
      return;
    }
    const allWaypoints = this.waypointRepo.getAll();
    this.events.emit("waypoint:reordered", {
      fromIndex,
      toIndex,
      allWaypoints
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
  }
  /**
   * Get all waypoints.
   */
  getWaypoints() {
    return this.waypointRepo.getAll();
  }
  /**
   * Clear all waypoints and reset route.
   */
  clear() {
    this.ensureNotDisposed();
    const previousCount = this.waypointRepo.count();
    if (previousCount > 0) {
      this.history.push(this.waypointRepo.getAll(), "clear");
    }
    this.waypointRepo.clear();
    this.currentRoute = null;
    this.currentStats = null;
    this.events.emit("route:cleared", {
      previousWaypointCount: previousCount
    });
  }
  // ==================== Route Information ====================
  /**
   * Get the current calculated route.
   */
  getRoute() {
    return this.currentRoute;
  }
  /**
   * Get route statistics (distance, duration).
   */
  getStats() {
    return this.currentStats;
  }
  /**
   * Get turn-by-turn navigation steps.
   */
  getNavigationSteps() {
    return this.currentRoute?.steps ?? [];
  }
  /**
   * Check if route is currently being calculated.
   */
  isCalculating() {
    return this.calculating;
  }
  // ==================== Undo/Redo ====================
  /**
   * Undo the last waypoint change.
   */
  async undo() {
    this.ensureNotDisposed();
    const entry = this.history.undo();
    if (!entry) {
      return false;
    }
    this.waypointRepo.setAll(entry.waypoints);
    this.events.emit("history:change", {
      action: "undo",
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      historySize: this.history.getSize()
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
    return true;
  }
  /**
   * Redo the last undone change.
   */
  async redo() {
    this.ensureNotDisposed();
    const entry = this.history.redo();
    if (!entry) {
      return false;
    }
    this.waypointRepo.setAll(entry.waypoints);
    this.events.emit("history:change", {
      action: "redo",
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      historySize: this.history.getSize()
    });
    if (this.options.autoRecalculate) {
      await this.recalculate();
    }
    return true;
  }
  /**
   * Check if undo is available.
   */
  canUndo() {
    return this.history.canUndo();
  }
  /**
   * Check if redo is available.
   */
  canRedo() {
    return this.history.canRedo();
  }
  /**
   * Get current history size.
   */
  getHistorySize() {
    return this.history.getSize();
  }
  // ==================== Geo Utilities ====================
  /**
   * Calculate distance between two coordinates (meters).
   * Static method using default implementation.
   */
  static calculateDistance(from, to) {
    return new GeoServiceImpl().calculateDistance(from, to);
  }
  /**
   * Find the nearest point on the route to a given coordinate.
   */
  getNearestPointOnRoute(coordinate) {
    if (!this.currentRoute || this.currentRoute.geometry.length < 2) {
      return null;
    }
    return this.geo.findNearestPointOnLine(coordinate, this.currentRoute.geometry);
  }
  /**
   * Check if a coordinate is off-route.
   */
  isOffRoute(coordinate, threshold) {
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
  getRemainingDistance(coordinate) {
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
  async recalculate() {
    this.ensureNotDisposed();
    const waypoints = this.waypointRepo.getAll();
    if (waypoints.length < 2) {
      this.currentRoute = null;
      const previousStats = this.currentStats;
      this.currentStats = null;
      if (previousStats) {
        this.events.emit("stats:updated", {
          stats: {
            distanceMeters: 0,
            durationSeconds: 0,
            waypointCount: waypoints.length,
            stepCount: 0
          },
          previousStats
        });
      }
      return;
    }
    this.calculating = true;
    this.events.emit("route:calculating", {
      waypointCount: waypoints.length
    });
    try {
      const result = await this.calculator.calculate(waypoints);
      if (!result) {
        throw new Error("Failed to calculate directions");
      }
      const previousStats = this.currentStats;
      this.currentRoute = result.route;
      this.currentStats = result.stats;
      this.calculating = false;
      this.events.emit("route:calculated", {
        route: result.route,
        stats: result.stats,
        steps: result.steps
      });
      this.events.emit("stats:updated", {
        stats: result.stats,
        previousStats
      });
    } catch (error) {
      this.calculating = false;
      this.events.emit("route:error", {
        error: error instanceof Error ? error : new Error(String(error)),
        waypointCount: waypoints.length
      });
    }
  }
  // ==================== Lifecycle ====================
  /**
   * Dispose of resources and clear subscriptions.
   */
  dispose() {
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
  isDisposed() {
    return this.disposed;
  }
  ensureNotDisposed() {
    if (this.disposed) {
      throw new Error("RoutePlanner has been disposed");
    }
  }
};
export {
  EventBusImpl,
  GeoServiceImpl,
  HistoryManagerImpl,
  RouteCalculatorAdapter,
  RoutePlanner,
  WaypointRepository,
  calculateDistance,
  calculateLineLength,
  calculateRemainingLength,
  findNearestPointOnLine,
  isOffRoute
};
