# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository hosts two distinct applications that share the same codebase:

1. **Personal portfolio** for Romário Alves (UX/UI designer) — served as a standalone static HTML page (`public/portfolio.html`) and as a React component set (`src/components/ShaderHeader.jsx`)
2. **UFO Burguers delivery management system** — a full React SPA in `src/App.jsx` with Firebase backend

Both apps are deployed via Firebase Hosting (SPA rewrites enabled, output from `dist/`).

## Commands

```bash
npm run dev       # Vite dev server with HMR on port 5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config, JS/JSX only)
```

There is no test suite configured. To serve the standalone portfolio page separately:

```bash
npx serve public/ -p 4444
```

## Architecture

### Two-App Structure

| App | Entry Point | Deployment |
|-----|------------|------------|
| Portfolio static page | `public/portfolio.html` | Served directly as static file |
| Portfolio React header | `src/HeaderDemo.jsx` → `src/components/ShaderHeader.jsx` | Imported into React app |
| Delivery system | `src/App.jsx` | React SPA at root route |

### Delivery App (`src/App.jsx`)

This is a monolithic ~462 KB file containing all delivery app logic. Its internal structure follows this order:

1. **Imports** — React, React Router, Lucide icons, Firebase, Leaflet
2. **Data constants** — `INITIAL_MENU` (26 hardcoded items), `STATUS_FLOW`, `INITIAL_ORDERS`, `INITIAL_CUSTOMERS`
3. **Helpers** — e.g. `getDisplayOrderId`
4. **Main App component** — routing, state, all UI

The app is NOT split into feature modules yet; all domains (menu, orders, customers, drivers, admin, loyalty) live in one file.

**Order status flow (Kanban):**
```
Aguardando Pagamento → Novo → Confirmado → Preparando → Saiu p/ Entrega → Entregue
```

**Firestore collections:** `settings`, `menu`, `system`, `orders`, `caixa`, `users`, `customers`, `rewards`, `points_log`, `coupons`, `supplies`, `supply_purchases`, `supply_usage`, `drivers`

Real-time updates use Firestore `onSnapshot` listeners. Auth uses Firebase Auth (Google Sign-in + phone/Recaptcha).

### Portfolio Components (`src/components/`)

- `ShaderHeader.jsx` — Hero section with pixel art logo (SVG generated from a 2D bitmap array), gold color scheme (`#c8922a`), DM Serif Display + Syne fonts
- `components/ui/shader-lines.jsx` — Three.js WebGL shader animation (UFO silhouette with animated horizontal lines). Three.js is loaded **dynamically from CDN** inside a `useEffect`, not bundled. Cleanup runs on unmount (cancels animation frame, disposes renderer).

### Build Configuration

`vite.config.js` manually chunks output:
- `vendor-react` — React, React-DOM, Lucide React
- `vendor-firebase` — Firebase
- `vendor` — remaining node_modules

Chunk size warning threshold is set to 1000 KB (App.jsx is large by design for now).

Tailwind CSS 4 is used via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`.

## Conventions

- **Pure JavaScript** — no TypeScript, no type annotations
- **Component naming**: PascalCase files and exports
- **Constants**: UPPER_SNAKE_CASE (e.g. `INITIAL_MENU`, `UFO_RESTAURANT_COORDS`)
- **Styling mix**: Tailwind utility classes for layout/spacing, inline styles for brand colors (`#c8922a` gold, `#0b0906` dark background) and custom font families
- **Restaurant coordinates** are hardcoded: `UFO_RESTAURANT_COORDS = [-3.7510, -38.5282]` (Fortaleza, Brazil)
- **No Prettier config** — formatting is not enforced automatically

## Firebase / Environment

- Firebase config is imported from `src/firebase.js` (not committed — must be created locally)
- `firestore.rules` currently allows all reads/writes (`if true`) — intended for development only
- No `.env.example` exists; Firebase credentials are expected to be embedded in `src/firebase.js`
- Deploy with: `firebase deploy` (requires Firebase CLI and project access)
