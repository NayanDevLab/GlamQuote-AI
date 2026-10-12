# GlamQuote AI — Product Requirements Document (PRD)

> **Project name:** GlamQuote AI  
> **Tagline:** *Your Look. Your Choice. No Surprises.*  
> **Document status:** Draft — review and approve before implementation  
> **Development status:** Not started; this is the initial implementation brief  
> **Product:** Android-first AI beauty and grooming look decision companion  
> **Primary users:** Adults (18+), all genders  
> **Platform:** React Native + Expo + TypeScript  
> **Primary visual AI:** Perfect Corp YouCam APIs  
> **Supporting text AI:** Google Gemini  
> **Backend and identity:** Supabase  
> **Private saved media:** Cloudinary  
> **UI design reference:** `/design/` folder containing Claude-generated `.tsx` designs  
> **Purpose:** A **standalone, from-scratch product specification** for an AI coding IDE. Defines what the app must do, why it exists, and how implemented behavior will be accepted. No previous PRD is required.

**Project starting point:** No production mobile app, database, backend integration, or actual AI generation is assumed to exist. The UI designs have been prepared separately and **will be supplied as `.tsx` files inside the project’s `/design/` directory when development begins**. A screen in that directory is a design reference, **not proof that its features already work**.

**Scope:** No competition rules, deadlines, or development schedule. This PRD is not a database schema or a source of guessed third-party API payloads.

---

## 1. Executive Summary

**Working name:** GlamQuote AI  
**Tagline:** *Your Look. Your Choice. No Surprises.*  
**Category:** AI-powered beauty and grooming look discovery, virtual try-on, and decision support.

GlamQuote AI helps a person **choose a nail design, hairstyle, or hair color before making a real-world appearance change**. A user can browse supported looks or get a preference-based shortlist; upload their own photo; generate a **genuine YouCam** virtual try-on result; create alternative results; compare the results; optionally receive preference-based text guidance from Gemini; save a final look; and export a polished card for personal use or sharing.

The product must be useful **without** salon discovery, pricing, consultation, booking, or payments. It is a **consumer decision companion**, not a salon business application.

### Single user problem

> “I found several beauty or grooming looks I like, but I am unsure which one to choose. Help me see realistic possibilities on my own photo, compare them clearly, and decide for myself.”

### Core user outcome

An adult user can reach a **user-selected, saved favorite** based on at least one real YouCam preview and a clear understanding that the preview is illustrative rather than guaranteed.

### Core differentiation

Most standalone try-on experiences stop after generating a picture. GlamQuote connects **discovery → YouCam transformation → configurable variations → A/B comparison → optional Gemini-assisted trade-offs → saved personal decision → shareable card**.

---

## 2. Problem, Evidence, and Product Hypothesis

### Pain points

1. Inspiration images on other people's hands or hair do not show what a style may look like on the user's own photo.
2. A user may prefer different nail finishes, shapes, lengths, hairstyles, or hair colors but lacks an easy way to preview alternatives.
3. Saving individual previews does not automatically help the user **compare two choices using the same original photo**.
4. Beauty recommendations may be generic, overwhelming, or misleading when they pretend to know how a look will suit a face.
5. Image-upload, permissions, processing time, errors, and privacy concerns can make AI beauty apps confusing for first-time users.
6. A final choice should be easy to revisit or share without requiring salon or shopping features.

### Product hypothesis (to validate)

Guided discovery, **real photo-based YouCam virtual try-on**, editable options, side-by-side comparison, and optional grounded text guidance will make selecting a look more understandable than browsing inspiration images alone.

This is a hypothesis, **not** a proven effect on confidence, purchases, or real-world appearance.

---

## 3. Goals, Non-Goals, and Principles

### Primary goal

Help users make one informed **personal style choice** through a simple, trustworthy Android experience.

### Secondary goals

- Make the sponsor's actual YouCam image-transforming capabilities central and useful, rather than decorative.
- Cover both inspiration-based try-on and parameter-based customization where the provider supports them.
- Reduce repeat uploads by safely reusing an available original photo in related workflows.
- Make A/B comparison and final selection possible **without new image-generation requests**.
- Let Gemini support decisions without sending personal photos, previews, or image URLs to it.
- Provide guest entry and first-use tutorials while keeping the user in control of privacy and sharing.
- Offer offline-readable already-cached content when practical; live AI processing requires connectivity.

### Product principles

1. **One pain point:** Choosing a look before changing it.
2. **YouCam-first:** Real YouCam tasks produce every personalized virtual try-on.
3. **No fake success:** Sample artwork, curated reference photos, and mock outputs must never masquerade as user-generated results.
4. **User decides:** No attractiveness scores, facial ranking, or forced AI winner.
5. **Consent before cloud processing:** Never send personal imagery without user action and appropriate notice.
6. **Privacy-conscious Gemini:** Text-only preference and style-metadata requests.
7. **Reusability:** Shared photo upload, consent, processing, result, Look Battle, Lookbook, tutorials, and error components.
8. **Graceful failure:** API downtime does not erase saved looks or block manual browsing.
9. **Simple language:** User-facing copy avoids raw endpoint names and unsupported promises.
10. **Inclusive:** All-gender adult positioning with diverse skin tones, hair types, and styles.

### Explicit non-goals

- Salon consultation, quotation, appointment or booking.
- Stylist profiles, salon dashboard, marketplace, merchant accounts, or payments.
- Shopping cart, service pricing, subscriptions, affiliate commerce, or salon discovery.
- Public social network, likes/feed, or multi-user realtime collaboration.
- Attractiveness/beauty scores, face-fit percentages, biometric identification, or medical/skin diagnoses.
- Training a proprietary image model.
- Continuous live AR camera overlay for this version; input is **captured/uploaded photo → asynchronous AI result**.
- Automatically combining hairstyle generation and hair-color generation into one chained transformation.

---

## 4. Users and Environment

### Primary user

An adult exploring a hairstyle, nail look, or hair color and wanting to visualize, compare, and decide before making a real change.

### Example jobs

- **Nails, inspiration:** “I saved an interesting nail design. Let me preview it on my hand.”
- **Nails, customization:** “I want to compare plum metallic polish and a rosewood press-on shape on the same hand.”
- **Haircut:** “Show me a chin-length bob versus another supported haircut on my selfie.”
- **Hair color:** “Compare a honey-blonde full color with a dark-brown-to-caramel ombre.”
- **Decision:** “Both pictures look interesting. Help me understand their different styles and decide based on what matters to me.”

### Environment

- Android-first; a normal Android smartphone with camera/gallery is sufficient.
- No ring, headset, AR device, or specialized hardware required.
- Internet is required for YouCam generation, Gemini requests, media upload, and cloud-backed saving.
- Initial user-facing language: English. Do not expose unsupported language selectors as live features.
- Adult audience only (18+); avoid encouraging submissions of minors' photos.

---

## 5. Priority Framework and Release Scope

Priority means **product importance**, not that a provider integration has been tested.

| Priority | Definition |
|---|---|
| **P0** | Required for the intended core consumer experience, subject to the capability gates in Section 6. |
| **P1** | Optional expansion only after a reliable end-to-end P0. |
| **P2** | Deferred, not part of the approved initial experience. |

### P0 capability scope

| ID | Feature | Primary technology |
|---|---|---|
| GQ-01 | Splash, onboarding, guest mode, Home, navigation, tutorials | Expo / Supabase |
| GQ-02 | Explore catalogue, search, supported styles, filters | Local + Supabase |
| GQ-03 | Guided Look Finder | Gemini text + catalogue |
| GQ-04 | **Nail Inspiration** — reference-based preview | **YouCam AI Nail Transfer** |
| GQ-05 | **Nail Customization** — Nail Polish + Press-On | **YouCam AI Nail Virtual Try-On** |
| GQ-06 | **Hairstyle Studio** — presets + custom inspiration reference | **YouCam Hair Style V2.1** |
| GQ-07 | **Hair Color Studio** — Full / Ombre, preset / custom | **YouCam AI Hair Color V1.0** |
| GQ-08 | Real-result Before/After viewer | Existing YouCam output |
| GQ-09 | Shared A/B Look Battle and user favorite selection | Existing YouCam output |
| GQ-10 | Optional Decision Assistant and trade-off explanations | Gemini text + metadata |
| GQ-11 | My Lookbook, filters, favorites, notes, deletion | Supabase + private Cloudinary |
| GQ-12 | Final Look Card: templates, export, local save/share | Expo local rendering |
| GQ-13 | Settings, privacy, photo management, legal, help | Expo / Supabase |
| GQ-14 | Real processing states, quota/cost protections, errors, recovery | Cross-cutting |

**Capability gate:** If an API, parameter, preset, account permission, or provider response format is not validated, that individual mode stays disabled/marked unavailable. **Never create fake YouCam results to make the P0 feature appear functional.** The smallest useful end-to-end journey remains more important than an unfinished feature list.

### P1 — Later expansion (not required to ship the core app)

- **Makeup Studio**, using an actually accessible relevant YouCam API.
- **Beard Studio**, using an actually accessible relevant YouCam API.
- Recoverable permanent identity/account linking and cross-device sync.
- Natural-language advanced search and carefully sourced style-care guidance.

### P2 — Deferred

- Additional languages, complex collections, trusted private friend feedback, premium monetization, richer social features, or other beauty studios.

**Display rule:** Makeup and Beard can be visible as **Coming Soon**, but cannot open a counterfeit live AI generation flow.

---

## 6. Provider Capability Gates — Must Be Verified Before Coding Live Modes

The product designs describe **intended interactions**. Exact availability, schema, costs, formats, server region, media retention, and available units depend on the current provider documentation and the project's account.

| Provider capability | Intended use | Must verify in actual account |
|---|---|---|
| YouCam AI Nail Transfer | Hand photo + design reference → result | Account access, correct source/reference spec, upload, task lifecycle, failure handling, one successful result |
| YouCam AI Nail VTO | `nail_polish` and `press_on_nails` customization | Access, actual per-finger and finish parameters, valid combinations, shapes/lengths via current metadata, one successful result per mode |
| YouCam Hair Style V2.1 | Provider template or authorized hairstyle reference | Access, current template IDs, reference upload, source-image checks, one successful result in each enabled mode |
| YouCam Hair Color V1.0 | Full color / Ombre, preset / custom palette | Access, current presets, custom pattern/palette validation, actual color attributes and ranges, one successful result in each enabled mode |
| Gemini eligible text model | Supported-ID shortlist, grounded decision text | Current model name, quota, region, privacy terms, structured response support, fallback |
| Supabase + Cloudinary | Anonymous identity, private metadata/assets | RLS, authenticated delivery, secure signing, ownership checks, deletion workflows, free-tier constraints |

### Policy for uncertain capability

- Source style lists and shapes from **current provider metadata**, not hardcoded illustrative labels.
- UI controls may exist in design but should be **feature-flagged** until provider support is confirmed.
- Client never sends raw credentials to YouCam or Gemini; server validates all selected values before task creation.
- No active mode may claim success without a real successful response and valid result media.
- If an API is unavailable, users can still browse supported modes, see saved looks, and use non-generation tools; disable that specific action with honest copy.
- No fixed processing ETA, per-user quota, or API consumption number is guaranteed by this PRD.

### Official reference links (documentation, not proof of account access)

- Nail Transfer: https://docs.perfectcorp.com/reference/ai_nail_transfer/v1.0
- Nail Virtual Try-On: https://docs.perfectcorp.com/reference/ai_nail_vto/section/overview
- Hair Style: https://docs.perfectcorp.com/reference/ai_hairstyle/section/overview/integration-guide
- Hair Color: https://docs.perfectcorp.com/reference/ai_hair_color/section/overview

---

## 7. Complete Feature Requirements and Acceptance Criteria

### GQ-01 — First launch, Home, guest mode, and tutorials (P0)

**Requirements**
- Branded splash transitions automatically when ready; no artificial long startup wait.
- New user onboarding illustrates **Discover**, **Try On**, and **Compare & Decide**, and can be skipped.
- Guest Welcome offers **Continue as Guest**; no mandatory traditional signup.
- Returning guests bypass previously completed onboarding and welcome when guest session remains valid.
- Home surfaces **Find My Look**, **Explore Styles**, Nail Studio, Hair Studio, and Lookbook.
- Three-tab navigation: **Home | Explore | Lookbook**; Settings accessible from profile/help.
- Feature-specific first-use tutorial sheets exist for Nail Studio, Hair Studio, Hair Color, Look Finder, Look Battle, Decision Assistant, Lookbook, Final Card and major supporting flows.
- Tutorials can be skipped and replayed via contextual `?` or Help Center; completion is tracked independently.
- Setting “Show tutorials on first visit” controls automatic display only. Manual tutorial replay remains available. Replay Onboarding returns to the initiating screen.

**Acceptance criteria**
- A brand-new user can reach Explore without signup; back/skip works.
- A returning guest can continue without being forced through onboarding again.
- A tutorial does not automatically reopen on every visit; `?` can reopen it.
- No tutorial interrupts an ongoing YouCam task or conceals an error recovery action.

### GQ-02 — Explore and style catalogue (P0)

**Requirements**
- Explore screen includes supported Hair/Nails category tabs, gallery, search, and relevant filters.
- Show style title, curated thumbnail, category, and short, grounded attributes.
- The catalogue contains **real, currently supported provider styles or validated references**; content/editorial metadata is separate from API parameters.
- Users can open studios directly from cards or use Gemini Look Finder.
- Makeup/Beard appear only as truly disabled Coming Soon categories unless implemented.
- No shopping/cart/appointments/prices anywhere.

**Acceptance criteria**
- Filters and search produce consistent results with an appropriate no-match state.
- A chosen supported catalogue style opens the appropriate studio with its selection preserved.
- Unsupported styles cannot initiate a generation task.

### GQ-03 — Gemini Look Finder (P0, supporting AI)

**Requirements**
- Ask category (required) and optional occasion, preferred maintenance effort, and style preference.
- Previous answers can prefill and be edited; manual browsing is always available.
- Gemini receives text preferences and **allowlisted catalogue metadata only**, never photos/media URLs.
- Return 1–3 (optionally up to 5) supported style IDs with short reasons; strictly validate IDs, category, and grounded claims server-side.
- Loading uses indeterminate feedback. Gemini quota/failure has deterministic catalogue-based fallback labelled **not AI / rule-based**.
- “Try This Look” opens the correct live studio with a real, supported style selected.
- Do not save an untried recommendation as a generated preview in Lookbook.

**Acceptance criteria**
- Recommendations are clickable only when mapped to an active, supported style.
- No claims such as “98% face match” or photo-based attractiveness appear.
- Gemini failure never blocks manual Explore or YouCam-only workflows.

### GQ-04 — Nail Studio: Try Inspiration / AI Nail Transfer (P0)

**Requirements**
- Two entry modes are clear on Nail Studio Landing: **Try Inspiration** and **Customize My Nails**.
- Try Inspiration accepts one suitable hand photo (camera/gallery), and a supported nail reference selected from a curated gallery or provided by the user with appropriate rights.
- Show guidance for clear nails, unobstructed view, lighting, and relevant provider image requirements.
- Allow changing the hand photo without losing the reference, and changing the reference without losing the hand photo.
- Review shows **Your Hand** and **Selected Nail Design**, an edit action, provider processing disclosure, and explicit consent.
- Only after consent and explicit Generate does the server create a real YouCam Nail Transfer task.
- Show verifiable lifecycle statuses, recovery actions, and the **actual returned image**.
- Result has Before/After, zoom, Try Another Design, Save to Lookbook, and applicable comparison entry.

**Acceptance criteria**
- A permitted source + compatible reference can complete an actual Nail Transfer operation.
- Failed tasks cannot display a fabricated successful AI Preview or consume a duplicate task through rapid taps.
- Inputs are preserved on back/retry unless user clears them.

### GQ-05 — Nail Studio: Customize My Nails / AI Nail VTO (P0)

**Requirements**
- Reuse the hand-photo upload, consent, lifecycle, result, and error components.
- Editor has two distinct supported modes: **Nail Polish** and **Press-On Nails**.
- Nail Polish: user selects color, supported finish/texture, optionally individual-finger customization and compatible advanced settings.
- Press-On: user selects valid supported color/finish, shape and length controls where the verified provider schema supports them.
- Mode-specific settings are kept in separate drafts; switching modes does not overwrite the other draft or the source photo.
- Show **Sample styling — not your photo** in the editor. Selecting a swatch is **not** an AI-generated preview.
- Validate per-mode parameters and combinations; unsupported controls must be removed or disabled, not guessed.
- Review accurately summarizes Nail Type, Color, Finish, and Shape/Length when applicable; obtains fresh consent for generation.
- A successful YouCam Nail VTO output feeds the shared result/Lookbook/Look Battle.
- “Try Another Variation” keeps prior successful preview for in-session comparison if the source photo is unchanged.

**Acceptance criteria**
- One real Nail Polish preview and one real Press-On preview can be produced if those modes are enabled and verified.
- Press-On-only controls never appear as active settings in Nail Polish mode.
- Every resulting image is traceable to an actual successful provider task.

### GQ-06 — Hair Studio: Hairstyle templates and custom inspiration (P0)

**Requirements**
- Hair Studio presents **Explore Hairstyles** and **Try My Inspiration** with gender-inclusive imagery and no forced gender selection.
- Camera/gallery takes a suitable original selfie. Guidance: one person, face/hair clearly visible, adequate angle and lighting, head/shoulders in frame.
- “Explore Hairstyles” uses current provider template IDs; previews use curated thumbnails, not fake rendered results.
- “Try My Inspiration” requires a separate custom hairstyle reference upload/selection screen with preview, photo guidance, and change action.
- Selfie and selected template/reference survive back navigation.
- Review displays source selfie and selected template/reference, requests consent, and enables Generate only when valid.
- Actual YouCam Hair Style V2.1 task, honest processing states, actual AI output, Before/After, Try Another, Save and eligible comparison.
- If custom-reference access is unavailable, the mode must be disabled—not simulated with a preset.

**Acceptance criteria**
- A supported template can generate a genuine hairstyle preview from a valid selfie.
- If reference mode is enabled, it also completes with an actual approved reference.
- Invalid face/pose/image errors offer retake/change actions without losing chosen style.

### GQ-07 — Hair Color Studio: Full and Ombre (P0)

**Requirements**
- Hair Color is integrated into Hair Studio/Explore with two user-facing modes: **Full Hair Color** and **Ombre Hair Color**.
- Reuse an available, eligible **original user selfie**, not an already generated hairstyle result, by default.
- Full mode: official presets and, if supported, a separate Custom Color editor (HEX/palette, meaningful intensity/shine controls).
- Ombre mode: official two-tone presets and, if supported, Custom Ombre with top/bottom palette and documented blend/position controls.
- Preset and custom payload paths are **mutually exclusive**; server validates actual ranges and names before task creation.
- Label all pre-generation colored examples **Sample color — not applied to your photo**.
- Maintain distinct draft values per mode and per preset/custom submode; changing mode must preserve the original photo.
- Review shows original photo, sample swatch, selected settings, processing terms, and explicit consent.
- Generate triggers a real YouCam Hair Color task, then shared processing/result/recovery UX.
- Generated Full and Ombre variations on the same original image can be compared without new provider calls.

**Acceptance criteria**
- A live Full preset and Ombre preset flow can complete if enabled and verified; custom variants require successful parameter-specific tests before activation.
- API results are labelled AI previews; sample swatches never appear as successful personalized outputs.
- No automatic transformation chaining is represented as supported.

### GQ-08 — Original/AI Preview Result Viewer (P0)

**Requirements**
- Share one accessible viewer across Nail Transfer, Nail VTO, Hairstyle and Hair Color.
- Always distinguish **Original** vs **AI Preview** and offer slider/split view and zoom where feasible.
- Use the exact returned YouCam result, preserving sensible crop/orientation and image quality.
- Show selected style/configuration and a discreet, readable “AI preview; actual results may vary” label.
- If the original source image was not retained, show only the generated result and explain why Before/After is unavailable.
- Results from failed/expired provider tasks must never render as successful previews.

**Acceptance criteria**
- Users can compare a valid source/result on a typical Android display.
- A completed result can be viewed again without triggering YouCam.

### GQ-09 — Shared Look Battle and personal choice (P0)

**Requirements**
- Compare **two successfully generated YouCam results from the same original source photo**, within the same category (**Nails** or **Hair**).
- Include saved results and eligible unsaved current-session results if media remains accessible.
- Disallow duplicate selection, missing result assets, different source photos, and Nails-vs-Hair pairing.
- Nails can mix Nail Transfer and Nail VTO, with the transformation types clearly stated.
- Hair can mix hairstyle versus hair-color previews, but clarify these represent different kinds of changes and are **not** automatically combined.
- A/B cards can zoom, swap order, and show relevant **What's Different** fields based only on valid metadata.
- User taps to select a favorite; no objective winner or score is computed. A clear confirmation action follows selection.
- **Help Me Decide** must be accessible directly from A/B comparison *before* picking a favorite.
- With only one eligible preview, show **Create Another Look** and an unambiguous Save action; no fake VS state.
- Comparison never initiates a new YouCam operation.

**Acceptance criteria**
- Two eligible previews can be compared and a user-selected winner saved without any additional image-generation call.
- If the original photo is removed, comparison eligibility is recalculated honestly.

### GQ-10 — Gemini Decision Assistant (P0, supporting AI)

**Requirements**
- User can open optional **Help Me Decide** from Look Battle or from a previously selected favorite.
- Show the two actual existing previews **inside the app only**; send Gemini only selected style/configuration metadata and explicit preference answers.
- Questions: occasion, desired subtlety/change, what matters (e.g., natural/bold/versatility), optional note explicitly opted in.
- Use known style metadata to explain Look A, Look B, important trade-offs, and optionally a suggestion limited to A/B.
- If known metadata does not support maintenance or outcome claims, acknowledge the limitation instead of guessing.
- Fixed follow-up questions can explore differences without an unrestricted chatbot interface.
- Provide neutral/balanced outcome when both are equally plausible or metadata is insufficient.
- Server-side validated structured response; unknown properties, third-look IDs, attractiveness judgments, and guarantees are rejected.
- Failure/quota fallback: compare manually with a clearly labelled rule-based metadata summary; disable immediate retry when quota truly exhausted.
- Preference/note changes invalidate cached insights. User can choose A/B, refine answers, or compare again. AI never auto-saves the winner.

**Acceptance criteria**
- No photo pixels, personal image URLs, original media, or preview media reach Gemini.
- AI guidance is optional; user retains final choice.
- Incorrect, invented or unparseable Gemini output is not shown as validated advice.

### GQ-11 — My Lookbook, favorites, notes and deletion (P0)

**Requirements**
- A saved look is created only after a completed real preview and an explicit **Save to Lookbook** action.
- Lookbook has Empty, Populated, Nail/Hair/Favorites filters, sort and search/filter-empty states.
- Display saved preview (not stock/catalogue imagery), look title, transformation type and relevant details.
- User can open details, favorite/unfavorite, edit plain-text title/note, choose Compare, create a Final Look Card, share a preview, or delete.
- Note values are always **strings**; never display `[object Object]`. Notes are not shared with Gemini unless the user separately opts in.
- Original source media retention is optional; saved AI preview remains viewable if original is intentionally removed, but Before/After and same-photo comparison may become unavailable.
- **Shared original assets:** deleting one saved look must not delete an original still referenced by other active saved looks. Deleting an original separately warns about affected comparisons.
- Delete processes handle partial storage/database failures honestly; do not claim total deletion until GlamQuote-controlled deletion completes.
- Lost anonymous identity may block access; no unsupported cross-device recovery promise.

**Acceptance criteria**
- Saved looks reopen after app restart when identity is intact, without paid re-generation.
- Editing metadata/favorites makes no AI request.
- A user can delete one saved preview without damaging other looks that use its original asset.

### GQ-12 — Final Look Card, export and sharing (P0)

**Requirements**
- Start from an **already saved genuine YouCam preview**.
- Select one of three approved card templates: **Minimal Elegance**, **Editorial Beauty**, **Bold Statement**.
- Edit title, optional subtitle/note, visibility of style metadata, permitted image crop, and output format.
- Two initial sizes: **4:5 (1080×1350)** and **9:16 (1080×1920)**; PNG default, JPEG optional.
- The output is rendered locally at the requested resolution, using the saved image and an approved template; no YouCam or Gemini task.
- Preview and export share the **same layout logic**, with accurate crop, typography, and safe margins; export does not capture app chrome.
- Original user photo is **excluded by default**; if explicit original inclusion is later offered it requires available permitted original media and a clear choice.
- Every card clearly discloses **AI-generated preview** and that actual results may vary.
- Save to device and Android native share are separate actions; share need not require a prior gallery save.
- Sharing requires a user action and, when private text/original is included, an accurate content confirmation. Do not claim posting/sending occurred merely because the share sheet opened.
- Storage/export errors preserve the card editor state and do not produce false success notices.

**Acceptance criteria**
- Selected look produces a readable high-resolution PNG without additional AI generation.
- Gallery success is shown only after the save operation completes.
- Share opens a valid Android share sheet with the exported file and no hidden identifiers.

### GQ-13 — Settings, Privacy, Saved Photos, Help and Legal (P0)

**Requirements**
- Settings has guest status, Tutorials & Help, Replay Onboarding, Manage Saved Looks, Privacy & Photos, basic language display, About/Legal, and Delete My Data.
- Tutorials & Help groups feature guides, with replayable, non-blocking bottom sheets.
- Privacy page separately explains YouCam processing, Gemini text-only data, GlamQuote-controlled Supabase metadata and private Cloudinary assets.
- Manage Photos distinguishes retained originals, saved generated previews and temporary session media. Source images shared among multiple looks show related-look count.
- Deleting an original explains any loss of Before/After or comparison functionality while preserving separately saved generated previews.
- Delete My Data requires explicit destructive confirmation, progress and honest partial-failure/retry behavior; distinguishes app-managed deletion from the provider's own retention terms and previously exported/shared copies.
- Guest explanation accurately warns about app reinstall/device change and account-linking availability.
- About/Legal provides current app version, independent app attribution, and actual working Privacy Policy and Terms links when released.
- App does **not** claim affiliation, sponsorship or endorsement merely because provider APIs are used.

**Acceptance criteria**
- The user can find clear answers to “Who processes my photo?”, “What do you save?”, and “How can I delete it?”
- Manual tutorial replay still works with auto-tutorial display disabled.
- Delete and provider-error outcomes never falsely claim success.

### GQ-14 — Stability, error recovery and usage safeguards (P0)

**Requirements**
- Cross-cutting states: missing/invalid photo, insufficient nails/hair/face, unsupported reference/settings, denied permission, offline, provider failure, timeout, quota, missing media, partial deletion, guest identity error, local export failure.
- Server-side YouCam adapter handles upload, task creation, real status polling or supported signed webhook, success/error result, and cancellation only where provider supports it.
- One generation action creates at most one active task per input/mode/idempotency key. Duplicate taps do not spend more units.
- Persist enough task metadata to resume pending task retrieval after safe app background/restart where the provider allows it; no fake task cancellation.
- Avoid invented progress bars and fixed ETAs. Do not continue retrying a provider operation when a hard quota is exhausted.
- Retry should retain valid source selections and not automatically create repeated chargeable tasks.
- Provider image responses may expire; explicitly saved previews are copied to controlled saved media; unsaved results have limited session availability.
- Offline states preserve cached reads where available and avoid misleading queued-write promises.

**Acceptance criteria**
- Errors provide an actionable next step; no invalid task is marked successful.
- Reopening a successful saved look incurs zero new YouCam tasks.
- Rapid repeated taps on Generate do not create duplicate tasks.

---

## 8. Product-Level User Journeys

### Journey A — First use

Splash → Onboarding (or Skip) → Guest Welcome → Home → Explore or Find My Look.

### Journey B — Nail inspiration

Nail Studio → Hand Photo → Curated/User Reference → Review & Consent → **YouCam Nail Transfer** → Original/Result → Save / Create another look.

### Journey C — Nail customization

Nail Studio → Hand Photo → Nail Polish **or** Press-On Editor → Review & Consent → **YouCam Nail VTO** → Original/Result → Another Variation / Lookbook.

### Journey D — Hairstyle

Hair Studio → Original Selfie → Provider Template **or** Custom Inspiration Upload → Review & Consent → **YouCam Hairstyle V2.1** → Result → Save/Compare.

### Journey E — Hair color

Hair Color Studio → Original Selfie (reuse if eligible) → Full **or** Ombre → Preset **or** Custom Editor → Review & Consent → **YouCam Hair Color** → Result → Another Color/Compare/Save.

### Journey F — AI-assisted discovery

Home / Explore → Gemini Look Finder → Preferences → Supported Catalogue Recommendations → Try This Look → Corresponding studio with style selected.

### Journey G — Compare and decide

Two compatible YouCam results → Look Battle → (optional) Help Me Decide → Text-based trade-offs → User selects A/B → Explicit Save to Lookbook.

### Journey H — Saved look to final card

Lookbook → Saved Look Details → Card Template → Personalize → Size/Format → Final Preview → Save Image **or** Share Card.

### Journey I — Data control

Settings → Privacy & Photos → Manage Saved Photos / Delete Look / Delete My Data → explicit confirmation → honest result.

The product supports nonlinear navigation and backtracking; previous valid inputs should not be silently lost.

---

## 9. Design Reference and Screen Handoff

### 9.1 One application, one visual design source

The app uses the existing **GlamQuote Design System v1.1**: warm ivory surfaces, plum primary actions, champagne accents, editorial serif headings, accessible sans-serif body text, restrained rounded cards, premium and inclusive beauty imagery, consistent bottom sheets, and an Android-first layout.

**The actual, prepared Claude `.tsx` UI files will live in the root-level `/design/` folder of the development repository.** Treat this folder as the **visual and interaction source of truth** for supported screen layout and copy. Read the actual files instead of recreating layouts from memory or using arbitrary templates.

- All code in `/design/` is **reference code**, not assumed to be production React Native code.
- Designers may have used browser-specific JSX (`div`, `button`, `img`), CSS, Tailwind for web, inline SVG, CSS animations, or mock data. Translate such constructs into **React Native + Expo** equivalents; do not blindly import web TSX into a native screen.
- If design code is already React Native compatible, reuse it after checking accessibility, types, behavior, and responsiveness.
- Do not modify or overwrite `/design/` unless the product owner asks. Build actual app screens separately in the Expo app.
- Use local design assets only when available and permitted. Placeholder images, generated sample illustrations, and hardcoded demo preview output may not masquerade as a successfully completed user try-on.
- Inspect existing design components, tokens, fonts (by permitted family), image paths, interactions, and artboard names before writing the corresponding screen. If a reference file is missing or cannot be parsed, record the gap and request the actual file; do not silently fabricate a replacement.
- A single `.tsx` file may contain several artboards, variants, or a demo page. Identify the individual design states it includes rather than assuming `one file = one mobile screen`.
- Design examples and imagined UI states never override genuine YouCam response behavior, user consent, or documented privacy requirements.

### 9.2 Screen inventory to implement from `/design/`

| Area | Screen groups expected in design references |
|---|---|
| Design System and Home | Brand tokens, home, navigation, cards, typography and controls |
| First Launch | Splash, three onboarding steps, guest welcome and how-it-works sheet |
| Explore and Look Finder | Search, filters, studio discovery, preferences, loading, recommendations and fallback |
| Nail Inspiration | Landing, first-use tutorial, hand photo, inspiration gallery, consent, Nail Transfer task, result, save, error |
| Nail Customization | Nail Polish and Press-On editors, selected states, review, Nail VTO task, result and variation comparison |
| Hairstyle | Landing, tutorial, selfie, preset gallery, custom reference upload, review, task, before/after, save and errors |
| Hair Color | Landing, full-color presets/custom, ombre presets/custom, image selection, review, task, results and comparison |
| Look Battle | Entry, selection, nail/hair A/B, single-result state, favorite selection |
| Gemini Decision Assistant | Tutorial, preference inputs, loading, insight, trade-offs, balanced guidance and error/fallback |
| My Lookbook | Empty/populated, filters, detail, edit notes, favorites, delete confirmation and errors |
| Final Look Card | Introduction, template selection, editor, image format, export preview, export, save/share and privacy sheet |
| Settings and Help | Account/guest, feature tutorial replay, privacy, manage photos, delete data, legal and recovery states |
| Application review | Navigation, responsive/accessibility review, cross-screen component and state definitions |

Artboard identifiers such as `P3B-*`, `P4A-*`, `P5A-*`, and `P6B-*` may appear in design files. These are **reference names**, not required React Native route names. Verify that **custom hairstyle reference upload (previously labelled `P4A-11`)** is truly represented; if absent, do not pretend the route has a finished design.

### 9.3 Required fidelity to the design

- Preserve the design system's branding, color hierarchy, cards, icons, labels, selected states, bottom action bar, helpful tutorials, and before/after patterns as closely as is practical on Android.
- Create a shared implementation for common behavior: camera/gallery picker, user photo preview, consent, provider task state, before/after viewer, Look Battle, AI disclosure, save action, first-use tutorial, errors and recovery.
- Prioritize **actual on-device usability** over pixel-perfect copying of incompatible web interactions. Native gestures, keyboard handling, safe areas, scrolling, accessibility and Android Back behavior must work.
- All active primary actions must route to the expected screen or perform a real action. Avoid inert buttons, permanent mock loading, or fake save successes.
- Make `Home | Explore | Lookbook` the main navigation tabs, with independent studio, assistant, settings and export flows.
- Support 393×852 Android design reference, 360×640 smaller devices, larger font scale, and appropriate safe-area/keyboard behavior.
- Use **licensed/permissioned editorial assets** for catalogue and tutorial illustrations; **actual YouCam output** for personalized generated-result slots.

### 9.4 Known UI details that must be respected

- Hair Color is not labelled `Coming Soon` once live verified Hair Color is accessible; Makeup/Beard remain deferred unless implemented.
- Before users choose a favorite, both Nail and Hair Look Battle provide **Help Me Decide**.
- Gemini copy says: *“Gemini uses your preferences and style details, not your photos or AI previews.”* Do not say personal images never leave the phone; YouCam processes uploaded imagery with consent.
- The Lookbook notes text input must contain a string, never `[object Object]`.
- Deleting one saved look must not delete a source photo shared by other saved looks.
- A comparison requires two successful generated outputs from the **same original photo** and the same broad category; no comparing catalogue examples to personal outputs.
- Repeated Save controls with the same effect should be removed. The favorite chosen in Look Battle is not persisted until explicitly saved.
- The card editor's CTA must describe the actual next destination (e.g., **Continue to Size & Format**).
- Final Card preview/export use the same high-quality renderer; exported images contain no app chrome, controls, or Android status bar.
- Uploaded personal imagery, reference photos, AI results and optional notes remain distinct in privacy and sharing controls.

### 9.5 Source-of-truth order when instructions conflict

1. User safety, consent, genuine third-party capability, and verified platform constraints.
2. This PRD for feature scope, acceptance criteria, product boundaries, and data handling.
3. Actual `/design/` `.tsx` artboards for visual layout, copy, component appearance, and intended interactions.
4. Separate approved System Design / Database Design / Backend API documents for technical contracts once written.
5. Developer implementation decisions for unaddressed minor details.

If there is a material conflict, **surface it and obtain a decision** rather than silently changing the product.

---

## 10. Ownership of Responsibilities — YouCam, Gemini and the App

| Responsibility | Owner | Never do |
|---|---|---|
| Nail Transfer transformation | YouCam Nail Transfer | Substitute stock output |
| Nail polish / press-on transformation | YouCam Nail VTO | Pretend swatch selection is generated on hand |
| Hairstyle transformation | YouCam Hair Style V2.1 | Treat reference/model shot as user result |
| Full/Ombre recoloring | YouCam Hair Color | Combine unsupported presets/custom payloads |
| Supported-style recommendation | Gemini + validated catalogue | Invent an unavailable style ID |
| A/B decision text | Gemini + vetted metadata | View user photos or infer beauty/face fit |
| User photo capture/crop | App | Upload without consent |
| Photo/task integration | Protected backend | Put provider secrets in the app |
| Compare, choose and save | App / Supabase | Automatically force an AI winner |
| Saved media | Private Cloudinary delivery | Expose private user images by public defaults |
| Final image export | Local Android renderer | Call image AI or claim successful share without user action |

**Comparing transformations is not merging transformations.** A hairstyle preview and a hair-color preview may be compared but their individual changes should not be depicted as jointly applied unless a separate, verified pipeline explicitly supports it.

---

## 11. Privacy, Consent, and Media Lifecycle

### Before image processing

- The user selects or captures the photo locally.
- The app checks basic file validity and, where practical, on-device pre-checks to avoid wasted tasks.
- The Review screen identifies the destination processor, the photo/reference/configuration being used, and the purpose.
- The user explicitly consents and initiates generation.
- Backend authorizes the user, validates the request, uploads or securely supplies media to YouCam, and creates the task.

### During processing

- User's photo/reference may be processed or temporarily stored by YouCam under its applicable policies; the UI does not promise immediate erasure or “never stored”.
- App keeps bounded task metadata to retrieve and display outcomes, including failures and expiration.
- Gemini receives **no image bytes, image URLs, original photo, preview photo, or facial/body data**.

### After a successful task

- Display the real YouCam result in temporary app/session state.
- Preserve successful unsaved variation media long enough for a reasonable comparison when permitted; disclose session limits.
- Only on user Save, copy the generated image to app-controlled **private** saved storage.
- Original source photo is retained persistently **only if the user separately opts to keep it**; otherwise comparison using originals is session-scoped.
- Saved item metadata belongs to the user's Supabase identity; apply RLS and verified media ownership.

### Deletion and retention

- Saved look deletion removes the app's preview asset and record when controlled deletion succeeds.
- Shared source originals are reference-managed; removing one dependent look does not remove a still-needed original asset.
- Explicit original deletion warns that Before/After and future same-photo comparison may become unavailable, without deleting independently saved AI previews.
- Partial failures surface a pending/retry state and do not falsely report all copies removed.
- Already exported/downloaded/shared images cannot be revoked remotely.
- GlamQuote deletion does not override YouCam or other third-party retention rules.
- Guest uninstall / anonymous-identity loss may make saved data inaccessible until account linking exists.

### Sharing

- Share only on explicit user action.
- No original photo included in Final Look Card by default.
- Personal notes are included only if actively enabled; confirmation must reflect actual exported content.
- Do not embed image URLs, internal task IDs, account IDs or EXIF metadata in the exported graphic.

### Legal readiness

- Product must have accurate working Privacy Policy, Terms, and third-party disclosures before public release.
- Confirm legal/contractual permissions for uploaded images and sample/reference assets.
- Avoid claims of provider endorsement/affiliation without permission.

---

## 12. High-Level Technology Direction (Not API/DB Spec)

| Layer | Selected approach | Intent |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | Android user experience |
| Navigation | Expo Router | Screen stacks and deep flows |
| Styling | NativeWind + approved component tokens | Consistent UI |
| Local state | Zustand | Current source image, style draft, comparison selections, tutorials |
| Server state | TanStack Query | Task/result retrieval and safe caching |
| Auth and database | Supabase Auth, PostgreSQL, RLS | Anonymous guest and private metadata |
| Server integration | Supabase Edge Functions | Protected orchestration and Gemini calls |
| Saved images | Cloudinary with private/authenticated delivery | Explicitly saved generated previews and optional retained originals |
| Visual AI | Perfect Corp YouCam API adapters | Four core AI families |
| Text AI | Google Gemini configured eligible text model | Supported suggestions and explanations |
| Validation | TypeScript schemas / Zod or equivalent | Config and model-response validation |
| Local export | Expo-compatible renderer + filesystem/share/gallery APIs | Crisp images and Android share |
| Distribution | Expo EAS | Android installable builds |

### Technical constraints

- API keys and privileged Supabase credentials remain server-side.
- Provider operations must be typed adapters rather than sprawling UI calls.
- Never assume Expo SDK package compatibility without checking selected version.
- YouCam task creation is chargeable/limited; use deduplication and avoid automatic expensive retries.
- Provider result URLs may be temporary; persistence should happen only after explicit Save and permitted fetch/copy.
- Image-storage privacy requires more than a signed upload; access-controlled **delivery** is required.
- Minimize sensitive logs; do not log raw photos, signed URLs, full Gemini notes, or credential material.
- Structured provider/Gemini responses must be validated before displaying them to users.
- UI task progress reflects real status or indeterminate processing, not scripted progress percentages.

### High-level conceptual data entities

- User/guest profile and preferences.
- Feature tutorial completion flags.
- Supported style catalogue and provider capability map.
- Original photo/media asset with ownership and reference tracking.
- AI generation task and validated result metadata.
- Saved look with media reference, source-photo linkage, title, notes, favorite state.
- Look Battle decision (A, B, favorite, user preferences, optional note).
- Gemini text insight with sanitized input/version and bounded cache validity.
- Optional Final Look Card settings/draft (local unless specifically saved).
- Deletion status/retry records where necessary.

**Actual Supabase tables, policies, storage mappings and REST/Edge Function endpoints belong in separate Database and Backend API specifications.**

---

## 13. Nonfunctional Requirements

| Dimension | Requirement |
|---|---|
| Accessibility | Large touch targets, readable small text, clear disabled/selected states, screen-reader labels, keyboard-safe forms. |
| Responsive Android | Test at design 393×852, smaller 360×640, and larger font scaling with safe-area/sticky CTA behavior. |
| Performance | Avoid blocking JS/UI thread during image decode, network waits and card export; cache thumbnails. |
| Reliability | Task state survives safe background/reopen where possible; no double submission; distinguish terminal error/expired/success. |
| Offline behavior | Preserve available cached reads and local drafts; disable generation/actions requiring network with clear copy. |
| Security | Correct Auth/RLS, server-side secrets, image access controls, validated uploads, ownership checks, input limits. |
| Privacy | Minimal original-photo retention, no photos to Gemini, explicit Save/Share/Delete actions and clear third-party disclosures. |
| Cost control | Per-user request limits, idempotent generation, no re-generation on view/compare/export, cached valid insights. |
| Testability | Clearly separate deterministic fixtures from live provider responses; cover failure modes and contract tests. |
| Maintainability | Shared editor/result/tutorial/error primitives; clean feature modules; no duplicated provider schema logic in screens. |
| Content integrity | Catalogue tags and maintenance claims manually curated/verified; no false match scores or guarantee language. |

No hard-coded provider time-to-complete promise; speed depends on remote AI task behavior and network.

---

## 14. Acceptance Test Scenarios (Cross-Feature)

| ID | Test / expected outcome |
|---|---|
| AT-01 | New user skips onboarding and explores without sign-up. |
| AT-02 | User completes Nail Transfer with a real provider result; source/reference and consent are valid. |
| AT-03 | Nail Polish and Press-On produce real distinct provider results when verified and enabled. |
| AT-04 | Supported hairstyle template and custom reference work only if account and schema are verified. |
| AT-05 | Full and Ombre hair-color modes work with valid presets; custom modes validate actual API ranges. |
| AT-06 | A processing error never displays a stock/sample photo as a successful AI preview. |
| AT-07 | After two same-source results, Look Battle can compare and select A or B without new YouCam generation. |
| AT-08 | Nails and Hair cannot be combined in the same A/B pair; different source photos cannot be paired. |
| AT-09 | Gemini receives no photos/images/URLs and suggestions use only allowed style IDs. |
| AT-10 | Gemini outage or quota exhaustion still allows manual comparison and selection. |
| AT-11 | Saving one successful result persists it; simply viewing or exporting it produces zero new AI tasks. |
| AT-12 | Deleting one of several looks from a shared original retains the original for remaining dependencies. |
| AT-13 | Deleting an original warns about before/after/paired-comparison loss and retains other saved results. |
| AT-14 | Notes field stores and renders plain text; saved metadata edits make no image-generation request. |
| AT-15 | Final card exports correct 4:5 / 9:16 resolution, with no UI chrome and with AI disclosure. |
| AT-16 | Native Share opens a share sheet; the app does not falsely claim the file was sent. |
| AT-17 | Offline, invalid photo, provider error, expired media, permission denial and partial delete have recovery actions. |
| AT-18 | Settings tutorial toggle never disables manual help; replayed onboarding returns to invoker. |
| AT-19 | Guest loss and third-party photo retention limitations are explained without false guarantees. |
| AT-20 | Real Android device validates safe areas, scrolling, touch targets, cropping, app background/reopen and image permissions. |

---

## 15. Product Validation and Success Measures

### Definition of a complete core product

- A guest can discover one supported look and understand what the app offers.
- Each **enabled** live YouCam family has at least one provider-tested successful flow, and unsupported ones are visibly disabled.
- Users can generate a result, create a second variation, compare both, and choose a favorite.
- Gemini suggestions and decision support remain grounded, optional and privacy-safe.
- Users can save, revisit, delete, and locally export/share their selected preview.
- Recovery, consent, guest account transparency and private saved-media access work on a physical Android phone.

### Metrics to instrument (with privacy-preserving analytics if implemented)

- Entry → first completed YouCam preview rate.
- Generation success/failure by provider family and normalized error reason.
- Number of completed variants per original photo (aggregate, not an identity signal).
- Look Battle usage and decision completion rate.
- Gemini-assisted vs manual path usage.
- Saved look reopen and export completion rate.
- Percentage of test users who correctly identify sample imagery versus real output.
- Common user-flow drop-offs and support issues.

These are suggested observability metrics, **not** claimed outcomes or mandatory tracking of personally identifying media.

---

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Provider account lacks required mode/access | Designed option cannot execute | Run capability smoke tests, feature flags, disable unsupported modes. |
| Artboard API settings do not match latest schema | Invalid task or unexpected cost | Server allowlists current provider schema; API contract test per mode. |
| Poor source photos | Failed generation | Clear photo guidance, device pre-check where reliable, edit/retry. |
| Duplicate chargeable tasks | Unit loss | Idempotency key, in-flight lock, resumed task IDs, cautious retry. |
| Gemini hallucinates supported attributes | Misleading recommendation | Structured output, allowlists, reason grounding, no forced winner. |
| Personal imagery exposed through media URL | Privacy breach | Authenticated/private delivery, signed access, RLS and secret handling. |
| Deleting shared original breaks other results | User data loss | Reference tracking and explicit deletion impact warnings. |
| Result URLs expire | Lost unsaved work | Correct task lifecycle, session TTL, copy only on explicit Save. |
| Layout looks finished but assets are placeholders | Misleading demo/poor trust | Licensed photography + real generated success cases; visible sample labels. |
| Guest uninstalls app | Cannot recover saved data | Explain guest limitation; linking is optional P1 until implemented. |
| Exported card looks blurry | Bad share result | Export at target dimensions with safe typography and source resolution checks. |
| Scope creep | No stable end-to-end journey | Keep one pain point and stage P0/P1 clearly. |

---

## 17. Pre-development Readiness Checklist

Everything below is a **pre-development validation item**, not a claim that code or live provider integrations already exist.

- [ ] This standalone PRD has been reviewed and approved as the starting product specification.
- [ ] Root `/design/` folder has been provided with Claude-generated `.tsx` design screens and any referenced assets/tokens.
- [ ] Design files have been inventoried (file → artboards → feature route → reusable component → expected interactions).
- [ ] Confirm all essential screens exist, especially the custom hairstyle reference upload design; record any gaps.
- [ ] Copy any unresolved critical usability findings from the externally completed design audit into the development issue list.
- [ ] Verify that the four YouCam core families and submodes are accessible on the actual account and return **real** results.
- [ ] Test provider photo constraints, template IDs, parameters, upload/task/result/expiry, real errors, and API units.
- [ ] Choose a currently eligible Gemini text model and verify structured output, quota and fallback.
- [ ] Approve privacy policy, third-party processing disclosures, rights to reference images, and retention decisions.
- [ ] Prepare separate System Design document with architecture and provider adapters.
- [ ] Prepare separate Supabase database/Row Level Security and storage-ownership design.
- [ ] Prepare separate backend API contracts, session/task persistence, idempotency and deletion orchestration.
- [ ] Validate Cloudinary's selected private delivery, signing and media deletion pattern.
- [ ] Verify Expo SDK-compatible image picker, camera, file system, export, sharing and navigation dependencies.
- [ ] Verify physical Android device installation, permissions and end-to-end flows.
- [ ] Identify any design/demo mock media so it cannot accidentally be shipped as real generated output.

---

## 18. Rules for AI Coding IDEs (Cursor, Claude Code and Similar)

**Starting instruction:** The repo begins from scratch. Do not assume React Native app files, database tables, Supabase configuration, Cloudinary assets or YouCam/Gemini integration already exist. After the product owner approves this PRD, inspect `/design/` first and implement the actual Expo app in small, testable steps.

1. **Read this `PRD.md` in full** before proposing code or new product scope.
2. **Inspect `/design/` recursively**: list `.tsx`, inspect design tokens, shared widgets, image assets and actual user-flow variants. Report missing dependencies rather than guessing.
3. **Use `/design/` strictly as source reference**; implement production code in the Expo app directory and modular `src/` features. Do not rewrite design source files unless explicitly requested.
4. If a Claude `.tsx` screen contains web HTML/DOM or web-specific CSS, **port its look and behavior** to React Native `View`, `Text`, `Pressable`, `Image`, `ScrollView`/`FlatList`, and supported Expo-native libraries. Do not paste DOM tags into React Native.
5. **Follow existing visuals**, not generic component-library templates. Keep approved typography, spacing, colors, navigation states and photo/preview hierarchy.
6. Do not add salon consultation, quotations, appointment bookings, payments, shopping, salon lists, social feeds or stylist accounts. “Quote” in the name is not a pricing feature.
7. Do not replace the intended YouCam generation with Gemini, static images, image-generator calls or simulated API success.
8. Development fixtures must be explicitly marked `DEMO / SAMPLE`; production success requires an actual successful YouCam task and accessible resulting image.
9. Do not invent YouCam API parameters, unsupported preset names, or account entitlements. Validate against current docs and account tests. Hide/disable unverified controls.
10. Gemini receives only **text preferences, verified style attributes and optional permitted non-identifying notes**; never personal photo/image bytes or URLs.
11. Protect secrets behind Supabase Edge Functions or another appropriate secure backend. Privileged keys never appear in the client bundle or tracked repository.
12. Build shared components for capture, consent, API task states, previews, comparison, saving, errors, tutorials and empty states; avoid copy-pasting each studio.
13. Keep state across expected back navigation. Use safe task idempotency to avoid accidental duplicate paid provider requests.
14. Generate/supply schema migrations, Row Level Security rules and backend contracts from their separate specs; do not guess them based on screenshot placeholders.
15. Preserve user ownership and privacy: explicit consent, private media, shared-source references, truthful failures, no auto-save or auto-share.
16. Exports and saved-look browsing do not consume new YouCam units. Export the card at its target pixel dimensions with local rendering.
17. For every delivered feature, include actual functional test cases (success, loading, error, permission, no-network and Android Back) and distinguish tested results from pending items.
18. Never modify or delete existing user-supplied design files to make development simpler. Ask about contradictions, asset rights and unsupported states.
19. Do not implement an unrestricted AI chatbot or assess user attractiveness, biometric traits, clinical conditions, or unobserved physical appearance.
20. Before claiming a flow is working, test the real service, actual device behavior and data persistence, and show what remains unverified.

---

## 19. Expected Repository Structure and `/design/` Integration Contract

The actual repo can be initialized later. The structure below is a **starting organizational convention**, not an assertion that these paths already exist.

```text
GlamQuote-AI/
├── PRD.md                       # This complete product brief
├── design/                      # Claude-generated .tsx reference UI (read-only source)
│   ├── *.tsx                    # Screens, artboards, variants, design pages
│   ├── components/              # If provided by the design export
│   ├── assets/                  # Images/illustrations, if provided and licensed
│   └── ...                      # Preserve the real supplied structure
├── app/                         # Expo Router native screen routes (future implementation)
├── src/
│   ├── features/                # nail, hair, hair-color, look-finder, battle, lookbook...
│   ├── components/              # Native reusable components
│   ├── services/                # Typed client service adapters
│   ├── state/                   # Session and UI state
│   ├── theme/                   # Native implementation of /design tokens
│   └── utils/
├── assets/                      # Production-safe app media, copied with rights verified
├── supabase/
│   ├── migrations/              # Separate database spec, created later
│   └── functions/               # Private Edge Functions, created later
└── docs/
    ├── system-design.md         # Written separately
    ├── database-design.md       # Written separately
    ├── backend-api.md           # Written separately
    └── design-implementation-map.md  # File/artboard -> native route -> status
```

**Exact path requirement:** Use `/design/` relative to the repository root (not a filesystem root path) for this handoff. If the user eventually supplies a folder literally named `/desing/`, do not silently miss the files: ask before renaming or reference the supplied actual path. **The folder name on disk is authoritative.**

### Design-to-native workflow

For each feature:

1. Identify the specific `/design/` `.tsx` file(s), design assets, screen variants and clickable transitions.
2. Document mapping of reference artboard → Expo Router route → shared native components → backend dependency.
3. Reproduce layout/copy/states with React Native primitives; do not depend on browser globals, web CSS or `window`/DOM.
4. Connect navigation, controlled inputs, local persisted state and real API adapter, keeping `DEMO` test results isolated.
5. Test screen at design reference size and common smaller Android sizes, with keyboard, scroll and Back actions.
6. Compare native result against provided design in an on-device or emulator capture and fix material differences.
7. Mark functionality as **Implemented** only after interaction testing; as **Integrated** only after real provider and persistence testing.

### Design assets versus actual AI results

| Source | Allowed purpose | Not allowed |
|---|---|---|
| Claude TSX design artboards | Layout, appearance, expected interactions | Proof of completed backend behavior |
| Curated reference images | Inspiration galleries, examples with rights | Passing off as generated output |
| Sample manicure/hair swatches | Editors and tutorials, visibly labelled sample | Claiming a live personalized AI try-on |
| User-uploaded original | Consent-based YouCam processing, optionally retained | Silent permanent storage or Gemini input |
| Genuine YouCam result | AI Preview, Look Battle, saved media, Look Card | Saying results are guaranteed physical outcomes |

### Delivery expectation for implementation prompts

When coding begins, ask the AI IDE for **one feature slice at a time**, with a list of design files being used and explicit definition of done. Do not generate the full Android application from the PRD in a single unreviewed pass.

---

## 20. Open Decisions and External Checks

These items do **not** change the single product goal. They must be resolved before the affected live feature is enabled.

1. **Provider access:** Test account permissions, region, cost/credits and actual result outputs for Nail Transfer, Nail VTO, Hairstyle V2.1 and Hair Color, including advertised submodes.
2. **Original photo retention:** Recommend optional explicit **Keep Original for Before/After** after result generation, with clear impacts if deleted. Do not assume retaining the original is compulsory.
3. **Production image permissions:** Ensure stock/editorial, reference-photo and design assets can lawfully be used; AI demo illustrations must be labelled.
4. **Design inventory:** Inspect the actual supplied `/design/` `.tsx` references when available, including P4A custom hairstyle reference upload and accessible variants. Where an artboard is absent, obtain a design decision instead of guessing.
5. **UX audit carryover:** The product owner reports the full design audit was completed; any unresolved P0 findings must be carried into the implementation issue list when that report is available.
6. **Guest recovery:** Optional recoverable account linking is deferred unless explicitly moved into initial scope; wording must match what actually ships.
7. **Privacy/legal:** Confirm actual processing terms, retention disclosures, consent copy, policy URLs and deletion obligations before public release.
8. **Real device smoke test:** Verify all initial supported transformations, gallery/export, background task resume, session loss, camera refusal and Android Back on a physical Android phone.

---

## 21. Review and Sign-off

**Status: Draft — awaiting product-owner approval.** This is the single standalone PRD for building GlamQuote AI from scratch, once approved. It does not depend on earlier document versions.

Approving it means approving:

- One consumer pain point: **choose a real-world nail, hairstyle or hair-color look confidently before changing it**.
- Four YouCam visual AI integration families, subject to real account capability checks.
- Gemini as an **optional text-only** style-finder and decision assistant, never a substitute image renderer.
- The complete guest-first mobile journey, Look Battle, Lookbook, local export and truthful privacy behavior.
- The **`/design/` `.tsx` folder as the design reference** for native React Native implementation, while this PRD controls product scope.
- Makeup/Beard as later possibilities, and salon consultations, quotations, appointments, payments, e-commerce and ratings as excluded.

**After approval, prepare separate artifacts:** YouCam API feasibility checklist → System Design → Supabase Database Design → secure Backend API Contracts → feature-by-feature Expo implementation mapping from `/design/`.

**No development has been claimed or performed by this document.**

*End of GlamQuote AI Product Requirements Document.*

