# Berghain Challenge Frontend v2

A desktop-only React application for the Berghain Challenge venue admission simulation.

## Features

- **Manual Mode**: Tinder-style accept/reject with images and attributes
- **Auto Mode**: Automated decision making with multiple strategies
- **Real-time HUD**: Constraint progress, venue stats, feasibility warnings
- **Leaderboard**: Global ranking system across scenarios
- **Settings**: Customizable display name, sounds, delays, themes
- **Image System**: Dynamic image loading with signature-based manifests

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Image System

The frontend uses a signature-based system to match person attributes to images:

1. **Generate Manifests**: Run `npm run gen:manifests` from the project root to scan images and create scenario manifests
2. **Image Format**: Images should be named `{celebrity}__{signature}.webp` (e.g., `john-doe__UV1_I0_FF0_QF0_VC0_GS0.webp`)
3. **Signature Format**: For scenario 3: `UV{0|1}_I{0|1}_FF{0|1}_QF{0|1}_VC{0|1}_GS{0|1}`

## Keyboard Shortcuts

- **←** / **R**: Reject current person
- **→** / **A**: Accept current person  
- **Space**: Pause/resume auto-run
- **?**: Show help tooltip

## Decision Strategies

1. **Greedy Tightness** - Default strategy focusing on constraint urgency
2. **Expected Feasible Guard** - Ensures expected supply meets deficits
3. **Risk-adjusted Feasible** - Adds statistical variance to feasibility checks
4. **Proportional Control** - Balances attribute proportions
5. **Lookahead-1** - One-step lookahead optimization

## Backend Integration

Requires the Berghain Challenge backend running with v2 endpoints:
- Profile management (`/api/profile`)
- Leaderboard data (`/api/leaderboard`)
- Enhanced auto-step with delay control

## File Structure

```
src/
├── components/        # React components
├── hooks/            # Custom hooks
├── lib/              # API client and utilities
├── types.ts          # TypeScript definitions
└── App.tsx           # Main application
```

## Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8000/api`)

## Production Notes

- Desktop-only design (no mobile responsive layout)
- Requires HTTPS for production cookie handling
- Image manifests must be pre-generated
- Fallback image required at `/people/fallback.webp`
