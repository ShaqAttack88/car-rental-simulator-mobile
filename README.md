# Car Rental Simulator Mobile

A retro pixel-art car rental management simulator optimized for mobile and desktop web browsers.

## Features
- **One-Way Traffic Circuit**: Automated boom barriers for entrance and exit.
- **Dynamic Parking Rows**: Compact parking bays with color-matching combo multipliers.
- **Refueling & Car Wash Stations**: Dedicated 4-bay service stations with wash water effects and fuel pumps.
- **Multi-Service Logic**: Cars can need parking, refueling, car washing, or both services before checkout.
- **Staging Bays**: Neutral waiting bays next to the office to hold vehicles without penalty.
- **Reputation & Combo Mechanics**: Multipliers for matching colors and quick dispatch; negative combos if patience expires.
- **Shop & Expansion**: Buy new parking bays, car wash bays, fuel bays, and waiting bays.
- **Retro Audio & Visuals**: Synthesized 8-bit sound effects, boom arm animations, suds/hazard tarmac, and particle celebrations.

## Tech Stack
- HTML5 Canvas (Pixel art rendering at 180×320 internal resolution, scaled cleanly)
- Vanilla JavaScript (ES modules)
- Web Audio API (Chiptune sound effects)
- Vite build tooling

## Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
