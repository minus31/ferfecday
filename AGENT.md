# ferfecday Agent Notes

## Project

- Name: `ferfecday`
- Purpose: Korean birth-date selection service that recommends auspicious delivery dates based on saju concepts.
- Current state: Next.js MVP UI with mock result data. No real backend, saju engine, payment, ad SDK, or Supabase integration is implemented yet.

## Stack

- Framework: Next.js App Router
- Language: TypeScript
- UI: React, Tailwind CSS v4, shadcn-style components, Radix UI primitives
- Date UI: `react-day-picker`, `date-fns`
- Icons: `lucide-react`

## Commands

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Start production server: `npm run start`
- Lint script exists as `npm run lint`, but verify compatibility before relying on it.

## Routes

- `/`: Home page. Lets the user choose an expected delivery date range, then routes to `/results?from=yyyy-MM-dd&to=yyyy-MM-dd`.
- `/results`: Result page. Reads `from` and `to` from query params and renders Best 1 plus locked Best 2-5 cards from mock data.

## Important Files

- `app/page.tsx`: Home page and date-range submit flow.
- `app/results/page.tsx`: Results page, mock lucky-day data, unlock state, detail dialog state.
- `components/date-range-picker.tsx`: Date range picker with max 14-day selection.
- `components/lucky-day-card.tsx`: Lucky-day card UI with locked and featured states.
- `components/lucky-day-detail-dialog.tsx`: Detail modal for a selected lucky day.
- `components/site-header.tsx`: Shared sticky header.
- `app/globals.css`: Tailwind v4 theme tokens and base styles.

## Current Behavior Notes

- Date ranges are limited to 14 days.
- Dates before the current date are disabled in the calendar.
- Best 1 is always visible.
- Best 2-5 are initially locked and can be unlocked locally by clicking the ad button.
- Clicking an unlocked lucky-day card opens a detail dialog.
- Result data is currently hardcoded in `app/results/page.tsx` as `MOCK_DAYS`.

## Known Issues

- After selecting a full date range on the home page, the calendar popover stays open and can intercept clicks on `길일 찾기`. Pressing Escape closes it and routing works. This should be fixed by controlling popover open state and closing it when a valid range is selected.
- `favicon.ico` is missing, causing a browser console 404.

## Product Direction From README

- Start without a separate backend server.
- Use Next.js Route Handlers / Server Actions as needed.
- Planned backend/data stack: Supabase Postgres, Supabase Auth, Supabase Storage, Supabase Realtime.
- Planned deployment: Vercel.
- Planned monetization gates: ads and/or payment for Best 5/details.
