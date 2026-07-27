# Best Price — Client (Vite + TypeScript + Zustand + TanStack Query)

## First-time setup

```bash
npm install
cp .env.example .env      # then set VITE_SERVER_URL to your API's URL
npm run dev                # starts on http://localhost:5173
```

Requires the Server (TS + Prisma + MySQL) from the companion zip running
and reachable at `VITE_SERVER_URL`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck (`tsc -b`) then build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run typecheck` — `tsc -b --noEmit`

## What changed vs. the CRA/Redux client

- Vite instead of Create React App — faster dev server, smaller/modern
  toolchain. Env vars now use the `VITE_` prefix instead of `REACT_APP_`.
- TypeScript throughout, with shared types (`src/types`) matching exactly
  what the new backend serializes.
- **Tailwind CSS v4** instead of hand-written CSS files — all styling is
  now utility classes, with brand colors, spacing and radii defined once
  in `src/index.css`'s `@theme` block (`btn`, `card-surface`,
  `section-heading` etc. are the only custom classes, kept for the few
  patterns repeated everywhere).
- **Light/dark theme** — a `themeStore` (Zustand, persisted) drives a
  `.dark` class on `<html>`, with a three-way light/dark/system toggle in
  the nav (`ThemeToggle`). Every color in the Tailwind theme is a CSS
  variable that's redefined under `.dark`, so `bg-surface`, `text-ink`,
  etc. automatically flip — no component needs its own dark-mode
  variant classes. MUI components (Pagination, Rating, Snackbar) are
  wired to the same state via an `MuiThemeProvider` in `App.tsx` so they
  match instead of staying stuck in light mode.
- Zustand instead of Redux + redux-persist for client state (`authStore`,
  `cartStore`, `feedbackStore`, `themeStore`) — a fraction of the
  boilerplate for the same behavior, cart/theme persistence included.
- TanStack Query instead of hand-written thunks/reducers for all server
  state (products, orders, wishlist, chat, etc.) — caching, retries and
  loading/error states come for free instead of being tracked by hand.
- Every real bug fixed in the earlier UI-redesign pass carried over
  (broken product-details wishlist check, filter race condition, etc.)
  since the pages were ported from that version, not the original.

## Known gaps in this pass (functional, but lighter than the rest)

- **SignUp** only implements step 1 (buyer/seller basic info). The
  seller step-2 payment-details form (bank/provider + account number)
  from the old app isn't built yet.
- **Profile, Chat, Seller Dashboard, Seller Products** pages work end
  to end against the real API and use the same Tailwind theme as the
  rest of the app, but are visually simpler (plain cards/lists) than
  the more polished shop/cart/checkout flow, and Chat doesn't yet have
  typing indicators or read receipts in the UI (the backend already
  emits both).
- No `eslint` setup: `typescript-eslint`'s current release caps its
  peer dependency at TypeScript `<6.1.0`, so it can't install alongside
  TypeScript 7 yet. Worth revisiting once that catches up, or add
  `eslint` back manually with `--legacy-peer-deps` if you want it now.
