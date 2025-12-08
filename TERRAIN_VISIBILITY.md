# Terrain Visibility Guide

## Current Terrain Mapping

| Mode    | Terrain  | Visual Effect                           | Key Areas                    |
|---------|----------|-----------------------------------------|------------------------------|
| THINK   | Meadow   | Gentle uniform dots, subtle jitter      | Center: calm, Edges: horizon |
| PLAN    | Lake     | Quiet center, ripples at periphery      | Center: writing area (quiet) |
| CRUMPIT | Mountain | Sloped grid tilting up-right            | Top-left: NOW quadrant       |
| LOG     | Canyon   | Horizontal strata bands                 | Timeline layers              |

## Parameters (Updated for Visibility)

All terrains now use `baseAlpha: 0.45` for better visibility on screens.

- **Meadow**: `dotSize: 1.4`, spacing: 26px
- **Mountain**: `dotSize: 1.5`, spacing: 24px, slope: 0.2
- **Lake**: `dotSize: 1.3`, spacing: 26px
- **Canyon**: `dotSize: 1.3`, spacing: 24px, bands: 70px

## Zoom Behaviors

### Meadow (THINK)
- `zoom >= 1.0`: No visible horizon, uniform
- `0.7 - 1.0`: Horizon barely implied
- `zoom < 0.7`: Upper sky softens noticeably

### Mountain (CRUMPIT)
- `zoom >= 1.0`: Slight slope
- `0.7 - 1.0`: NOW cluster difference visible
- `zoom < 0.7`: Peak shape emerges

### Lake (PLAN)
- `zoom >= 1.0`: Big quiet center
- `0.7 - 1.0`: More detail in ripples
- `zoom < 0.7`: Lake shape obvious

### Canyon (LOG)
- `zoom >= 1.0`: Subtle horizontal flavor
- `0.7 - 1.0`: Obvious banding
- `zoom < 0.7`: Canyon feel, clear stripes

## Testing

Switch modes and look at the background:
- **THINK** → Should see even dot field
- **PLAN** → Should see quiet center, ripples at edges
- **CRUMPIT** → Should see dots leaning up-right
- **LOG** → Should see horizontal bands

Zoom in/out with mousewheel or +/- keys to see terrain responses.
