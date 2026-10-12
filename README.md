# GlamQuote AI

*Your Look. Your Choice. No Surprises.* — an Android-first AI look decision companion.
Product scope lives in [PRD.md](PRD.md). The approved visual design lives in `design/` (a read-only web prototype export; never import it into the app).

Stack: Expo SDK 57 · React Native 0.86 · Expo Router · TypeScript (strict) · NativeWind 4 · Zustand · TanStack Query · Supabase.

## Run on an Android phone

1. `npm install`
2. `cp .env.example .env` and fill in the values (optional until a screen calls Supabase).
3. `npx expo start`
4. Install **Expo Go** from the Play Store, put the phone on the same Wi-Fi as this computer, and scan the QR code. If the phone cannot reach the computer, use `npx expo start --tunnel`.

Phase 1 only uses modules bundled with Expo Go. Once a library with custom native code is added, switch to a development build (`npx expo run:android` with a USB-connected phone, or `npx eas-cli@latest build --profile development --platform android`).

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npx expo-doctor     # config and dependency validation
```

## Layout

```text
src/app/            Expo Router routes: splash (index), (onboarding), welcome, (tabs), pending
src/components/ui/  Design-system components (buttons, chips, cards, sheet, tab bar, icons)
src/features/       Feature-specific code (explore sample catalogue, onboarding scaffold)
src/state/          Zustand stores
src/lib/            Supabase client and Edge Function helper
src/theme/          Design tokens shared by tailwind.config.js and TypeScript
supabase/           Edge Functions, migrations and the secrets template
scripts/            Smoke test for the YouCam integration
```

## Nail Transfer backend (YouCam)

The app never calls YouCam directly. `supabase/functions/nail-transfer` holds the API key and exposes `POST` (create a task) and `GET ?task_id=` (status and result) to signed-in guests.

One-time setup for a Supabase project:

1. Dashboard → Authentication → Sign In / Providers → enable **Anonymous Sign-Ins**.
2. Dashboard → SQL Editor → run both files in `supabase/migrations/`, oldest first.
3. Set `YOUCAM_API_KEY` and the three `CLOUDINARY_*` values in `.env`.
4. `npx supabase login`
5. `npx supabase secrets set --env-file .env --project-ref <ref>`
6. `npx supabase functions deploy nail-transfer lookbook --project-ref <ref>`

`supabase/functions/lookbook` handles Save to Lookbook: it copies a finished preview into private (`authenticated`) Cloudinary storage and lists saved looks. It never creates a YouCam task.

Smoke test (each `run-*` creates exactly one task = 1 YouCam unit, and refuses to run without the flag):

```bash
npm run smoke:nail -- check                                             # key check, no units
npm run smoke:nail -- run-function <hand> <reference> --confirm-1-unit  # full path, 1 unit
```

Edge Function code is Deno: check it with `npx deno check index.ts` and `npx deno lint` from `supabase/functions/nail-transfer`.

## Secrets

There is one `.env` file. Only the two `EXPO_PUBLIC_` values ship in the app bundle. `YOUCAM_API_KEY` (and later the Gemini and Cloudinary keys) must never carry that prefix: they are used only by Supabase Edge Functions, which the app reaches through `invokeEdgeFunction` in `src/lib/supabase.ts`.
