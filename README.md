# GlamQuote AI

*Your Look. Your Choice. No Surprises.*

GlamQuote AI is an Android app that helps people decide on a new nail design, hairstyle or hair color **before** making a real-world change. You try looks on your own photo with Perfect Corp's YouCam AI APIs, compare two previews side by side, optionally ask Google Gemini for text-only guidance based on your preferences, choose a favorite and keep it in a private Lookbook.

**Journey:** Discover a look → choose a photo → consent → real YouCam preview → compare looks → Gemini guidance → choose a favorite → save to Lookbook → reopen any time.

## Try it (Android)

1. Download the APK on an Android phone (Android 7+). Link: provided in the Devpost submission.
2. Open it and allow installing from your browser or Files app if Android asks (*Settings → Apps → Special app access → Install unknown apps*). Google Play Protect may warn about an app it hasn't scanned — tap **More details → Install anyway**.
3. Open **GlamQuote AI**. No sign-up: a private guest account is created the first time you try a look.

### Suggested test path (about 5 minutes)

1. **Home → Nail Studio → Customize My Nails → Nail Polish.** Choose a clear photo of a hand (all five nails visible), pick a color and finish, review, tick consent and tap **Generate**. A real YouCam preview appears with a before/after slider. Tap **Save to Lookbook**.
2. **Try Another Variation** (or **Try Inspiration** with a nail-design photo) to make a second preview from the same hand photo.
3. **Compare Looks** → swap, zoom, then **Help Me Decide** → answer a few questions → **Get My AI Insight** (Gemini, text only).
4. Tap a look to choose it as your favorite → **Save to My Lookbook**.
5. Close the app completely, reopen it and open **Lookbook** — your looks are still there.
6. Also try **Find My Look** (Gemini Look Finder), **Explore → a style card**, **Hair Studio**, **Hair Color**, **Settings** and **Help** (replay any tutorial).

Each preview uses YouCam API units, and each guest has a daily preview limit. Previews are AI simulations — real results may vary.

## How YouCam is used

The app never calls YouCam directly: Supabase Edge Functions hold the API key, validate every request, upload the photo and create the task only after the user consents on the Review screen.

| Feature | YouCam API | Role in the app |
|---|---|---|
| Nail Transfer | AI Nail Transfer (`/s2s/v2.0/task/ai-nail`) | Copies a nail design from a reference photo onto your hand |
| Nail Polish | AI Nail Virtual Try-On (`/s2s/v2.0/task/nail-vto`, `nail_polish`) | Your color (per finger if you like) and one of nine finishes on your own nails |
| Press-On Nails | AI Nail Virtual Try-On (`press_on_nails`) | Tip and base shape, length, color and finish as press-ons |
| Hairstyle | AI Hairstyle Virtual Try-On V2.1 (`/s2s/v2.1/task/hair-transfer`) | YouCam's own predefined hairstyle templates on your selfie |
| Hair Color | AI Hair Color Virtual Try-On (`/s2s/v2.0/task/hair-color`) | Full color or ombre, from presets or a custom color |

Every preview shown or saved is a genuine YouCam result — the app has no mock or placeholder outputs. Editorial photos in Home, Explore and the studios are labelled as samples and are never presented as results.

## How Gemini is used

Gemini (`gemini-2.5-flash-lite`) is optional and **text only**:

- **Look Finder** — recommends 3–5 styles from GlamQuote's own catalogue of YouCam-supported styles, based on your answers. Picks open the matching studio with the style preselected.
- **Help Me Decide** — compares two of your previews using only their recorded style settings and the preferences you choose.

Gemini never receives photos, previews, image links or account details. Replies are structured JSON and are checked on the server (catalogue ids only, no comments on the person, no scores) before they are shown; if a reply fails the checks, the app shows a rule-based comparison instead.

## Privacy

- Your photo is sent to YouCam only after you agree on the Review screen. Original photos are never stored by GlamQuote.
- Only previews you save are kept, as private Cloudinary images reachable only through signed links, and you can delete any saved look.
- Data is tied to an anonymous guest account on your phone; uninstalling the app or clearing its data removes access.
- All provider keys live in Supabase function secrets. Only the Supabase URL and publishable key are in the app.

## Technology

Expo SDK 57 · React Native · Expo Router · TypeScript · NativeWind · Zustand · TanStack Query · Supabase (anonymous auth, Postgres with RLS, Deno Edge Functions) · Cloudinary · Perfect Corp YouCam APIs · Google Gemini API · EAS Build.

```text
src/app/            Screens (Expo Router)
src/features/       Feature logic: nail, hair, hair-color, battle, assistant, look-finder, lookbook, explore
src/components/ui/  Design-system components
src/lib/            Supabase client, Edge Function helper, photo handling
supabase/functions/ Edge Functions: nail-transfer, nail-vto, hairstyle, hair-color, lookbook, style-insight, look-finder
supabase/migrations SQL schema (RLS on every table)
```

## Run it yourself

You need your own Supabase project, YouCam API key, Cloudinary account and (optionally) Gemini API key — no keys are shared in this repository.

1. `npm install`
2. `cp .env.example .env` and fill in your values (the comments explain which are public and which are server-only).
3. Supabase dashboard → *Authentication → Sign In / Providers* → enable **Anonymous Sign-Ins**; then run every file in `supabase/migrations/` in order (SQL Editor).
4. Set the provider keys as function secrets and deploy (add `--use-api` if Docker isn't installed):

   ```bash
   npx supabase login
   npx supabase secrets set YOUCAM_API_KEY=… CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… GEMINI_API_KEY=… GEMINI_MODEL=gemini-2.5-flash-lite --project-ref <your-ref>
   npx supabase functions deploy nail-transfer nail-vto hairstyle hair-color lookbook style-insight look-finder --project-ref <your-ref>
   ```

5. `npx expo start` and open it in Expo Go, or build an APK with `npx eas-cli@latest build --platform android --profile preview` (set the two `EXPO_PUBLIC_` values as EAS environment variables for the `preview` environment).

Checks:

```bash
npm run typecheck   # regenerates Expo Router route types from src/app, then tsc --noEmit
npm run lint
npx expo-doctor
```

## Limitations

- Android only (built and tested on Android; iOS is not configured).
- Guest accounts only — there is no sign-in or account linking, so looks can't move to another phone.
- Saved looks are deleted one at a time; there is no "delete all my data" action yet.
- The Final Look Card / sharing and the Makeup and Beard studios are not implemented.
- Previews depend on YouCam's processing and photo requirements; occasionally YouCam can't finish a preview, and the app says so instead of showing a result.
