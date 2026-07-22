# 생일선물 (BirthdayGift) Agent Notes

## Project

- Name: `BirthdayGift`
- Purpose: Korean birth-date selection service that recommends auspicious delivery dates based on saju concepts.
- Current state: Toss mini app compatible static Next.js app. Saju scoring runs in the browser without a backend API route.

## Stack

- Framework: Next.js App Router with static export
- Toss: `@apps-in-toss/web-framework`, `ait build`
- Language: TypeScript
- UI: React, Tailwind CSS v4, shadcn-style components, Radix UI primitives
- Date UI: `react-day-picker`, `date-fns`
- Icons: `lucide-react`

## Commands

- Install dependencies: `npm install`
- Run Toss dev environment: `npm run dev`
- Build Toss artifact: `npm run build`
- Verify plain Next static export: `npm run next:build`
- Start production server: `npm run start`
- Lint script exists as `npm run lint`, but verify compatibility before relying on it.

## Routes

- `/`: Home page. Lets the user choose date range, gender, and delivery location text.
- `/results`: Static result page. Reads query params and computes Top10 locally.

## Important Files

- `app/page.tsx`: Home page and date-range submit flow.
- `app/results/page.tsx`: Results page, local Top10 computation, detail dialog state.
- `lib/lucky-days.ts`: Static/client-safe lucky day candidate generation and scoring.
- `granite.config.ts`: Apps in Toss configuration.
- `components/date-range-picker.tsx`: Date range picker with max 3-day selection.
- `components/lucky-day-card.tsx`: Lucky-day card UI with locked and featured states.
- `components/lucky-day-detail-dialog.tsx`: Detail modal for a selected lucky day.
- `components/site-header.tsx`: Shared sticky header.
- `app/globals.css`: Tailwind v4 theme tokens and base styles.

## Current Behavior Notes

- Date ranges are limited to 3 days.
- Dates before the current date are disabled in the calendar.
- Clicking an unlocked lucky-day card opens a detail dialog.
- Result data is computed from `@orrery/core` and local scoring modules.

## Known Issues

- `favicon.ico` is missing, causing a browser console 404.

## Product Direction From README

- Start without a separate backend server.
- Planned backend/data stack: Supabase Postgres, Supabase Auth, Supabase Storage, Supabase Realtime.
- Planned deployment: Vercel.
- Planned monetization gates: ads and/or payment for Best 5/details.
