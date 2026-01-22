# waypointjs

A framework-agnostic, map-agnostic TypeScript library for route planning. Build custom route planning features into your app regardless of which mapping service you use.

## Features

- **Map-agnostic**: Works with any directions API (Mapbox, Google Maps, HERE, OpenRouteService, etc.)
- **Framework-agnostic**: Pure TypeScript with no React/Vue/Angular dependencies
- **Zero runtime dependencies**: Lightweight and conflict-free
- **SOLID Architecture**: Clean, testable, and extensible design
- **Dependency Injection**: Swap any component for testing or customization
- **Event-driven API**: Subscribe to route changes, calculations, and errors
- **Undo/Redo**: Built-in history management with configurable depth
- **Geo utilities**: Distance calculation, nearest point on route, off-route detection

## Installation

```bash
npm install waypointjs
```

## Architecture


```
┌─────────────────────────────────────────────────────────┐
│                    Waypointjs                           │
│                   (Facade Layer)                        │
│  Coordinates all operations, thin orchestration layer   │
└────────────────────────┬────────────────────────────────┘
                         │ depends on interfaces
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Domain Interfaces                      │
│  IWaypointRepository, IHistoryManager, IRouteCalculator │
│  IGeoService, IEventBus                                 │
└────────────────────────┬────────────────────────────────┘
                         │ implemented by
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│  WaypointRepository, HistoryManagerImpl, GeoServiceImpl │
│  RouteCalculatorAdapter, EventBusImpl                   │
└─────────────────────────────────────────────────────────┘
```


## Quick Start

```typescript
import { RoutePlanner, DirectionsProvider, DirectionsRequest, DirectionsResponse } from 'waypointjs';

// 1. Implement a DirectionsProvider for your mapping service
class MyDirectionsProvider implements DirectionsProvider {
  readonly name = 'my-provider';

  async getDirections(request: DirectionsRequest): Promise<DirectionsResponse | null> {
    // Call your directions API and return the response
  }
}

// 2. Create a RoutePlanner instance
const provider = new MyDirectionsProvider();
const planner = new RoutePlanner(provider);

// 3. Subscribe to events
planner.on('route:calculated', ({ route, stats }) => {
  console.log(`Route: ${stats.distanceMeters}m, ${stats.durationSeconds}s`);
});

// 4. Add waypoints
await planner.addWaypoint({ longitude: -122.4194, latitude: 37.7749 });
await planner.addWaypoint({ longitude: -122.4089, latitude: 37.7855 });
```

## Dependency Injection

For testing or customization, inject your own implementations:

```typescript
import {
  RoutePlanner,
  IWaypointRepository,
  IHistoryManager,
  IGeoService,
  WaypointRepository,
} from 'waypointjs';

// Custom implementation for testing
class MockWaypointRepository implements IWaypointRepository {
  // ... implement interface methods
}

// Inject dependencies
const planner = new RoutePlanner(provider, {}, {
  waypointRepository: new MockWaypointRepository(),
  // Other dependencies use defaults if not specified
});
```

### Available Interfaces

| Interface               | Purpose                    | Default Implementation   |
|-------------------------|----------------------------|--------------------------|
| `IWaypointRepository`   | Waypoint CRUD operations   | `WaypointRepository`     |
| `IHistoryManager`       | Undo/redo history          | `HistoryManagerImpl`     |
| `IRouteCalculator`      | Route calculation          | `RouteCalculatorAdapter` |
| `IGeoService`           | Geographic calculations    | `GeoServiceImpl`         |
| `IEventBus`             | Event pub/sub              | `EventBusImpl`           |

## API Reference

### RoutePlanner

#### Constructor

```typescript
new RoutePlanner(
  provider: DirectionsProvider,
  options?: RoutePlannerOptions,
  dependencies?: RoutePlannerDependencies
)
```

Options:
- `maxHistorySize`: Maximum undo/redo entries (default: 50)
- `offRouteThreshold`: Off-route detection threshold in meters (default: 50)
- `autoRecalculate`: Auto-recalculate route on waypoint changes (default: true)

#### Waypoint Management

```typescript
await planner.addWaypoint({ longitude, latitude }, name?);
await planner.insertWaypoint({ longitude, latitude }, index, name?);
await planner.removeWaypoint(waypointId);
await planner.updateWaypoint(waypointId, { longitude, latitude });
await planner.reorderWaypoints(fromIndex, toIndex);
planner.getWaypoints();
planner.clear();
```

#### Route Information

```typescript
planner.getRoute();           // Full route data
planner.getStats();           // Distance, duration, counts
planner.getNavigationSteps(); // Turn-by-turn instructions
planner.isCalculating();      // Loading state
```

#### Undo/Redo

```typescript
await planner.undo();
await planner.redo();
planner.canUndo();
planner.canRedo();
```

#### Geo Utilities

```typescript
RoutePlanner.calculateDistance(from, to);  // Static
planner.getNearestPointOnRoute(coordinate);
planner.isOffRoute(coordinate, threshold?);
planner.getRemainingDistance(coordinate);
```

#### Events

```typescript
const unsubscribe = planner.on('route:calculated', handler);
planner.off('route:calculated', handler);
planner.once('route:calculated', handler);
```

Available events:
- `waypoint:added`, `waypoint:removed`, `waypoint:updated`, `waypoint:reordered`
- `route:calculating`, `route:calculated`, `route:error`, `route:cleared`
- `history:change`, `stats:updated`

### DirectionsProvider Interface

```typescript
interface DirectionsProvider {
  readonly name: string;
  getDirections(request: DirectionsRequest): Promise<DirectionsResponse | null>;
  isAvailable?(): Promise<boolean>;
  cancel?(): void;
}
```

## Testing

The dependency injection design makes testing straightforward:

```typescript
import { RoutePlanner, IRouteCalculator, RouteCalculationResult } from 'waypointjs';

// Mock calculator for testing
class MockRouteCalculator implements IRouteCalculator {
  async calculate(waypoints) {
    return {
      route: { /* mock route */ },
      stats: { distanceMeters: 1000, durationSeconds: 600, waypointCount: 2, stepCount: 3 },
      steps: [],
    };
  }
  cancel() {}
}

// Create planner with mock
const planner = new RoutePlanner(dummyProvider, {}, {
  routeCalculator: new MockRouteCalculator(),
});

// Test without hitting real APIs
await planner.addWaypoint({ longitude: 0, latitude: 0 });
await planner.addWaypoint({ longitude: 1, latitude: 1 });
expect(planner.getStats()?.distanceMeters).toBe(1000);
```

## Extending the Library

### Custom Geo Service

```typescript
import { IGeoService, GeoServiceImpl } from 'waypointjs';

class EnhancedGeoService extends GeoServiceImpl {
  // Override with more accurate calculations
  calculateDistance(from, to) {
    // Use Vincenty formula instead of Haversine
    return vincentyDistance(from, to);
  }
}

const planner = new RoutePlanner(provider, {}, {
  geoService: new EnhancedGeoService(),
});
```

### Custom Event Bus

```typescript
import { IEventBus, RouteEventMap } from 'waypointjs';

class LoggingEventBus implements IEventBus {
  private delegate = new EventBusImpl();

  emit(event, data) {
    console.log(`[Route Event] ${event}`, data);
    this.delegate.emit(event, data);
  }
  // ... delegate other methods
}
```
