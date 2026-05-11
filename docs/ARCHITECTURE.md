# Architecture & Refactor Plan

> Status: **living document**, last updated 2026-05-10.
> This file describes the structural direction the codebase is moving in.
> Read it before starting a non-trivial refactor — half the value comes from
> staying consistent, not from each individual change.

## Table of contents

1. [Where the project stands today](#where-the-project-stands-today)
2. [Five structural improvements](#five-structural-improvements)
   1. [Event subscriptions as derived state](#1-event-subscriptions-as-derived-state)
   2. [Server requests as queries](#2-server-requests-as-queries)
   3. [Feature folders](#3-feature-folders)
   4. [Splitting god-hooks](#4-splitting-god-hooks)
   5. [Unified UI store](#5-unified-ui-store)
3. [Bonus: error boundaries](#bonus-error-boundaries)
4. [What's already in place](#whats-already-in-place)
5. [How to pick the next refactor PR](#how-to-pick-the-next-refactor-pr)

---

## Where the project stands today

The codebase is a React 19.2 client for the Nitro renderer (Habbo-style hotel
client). Most of the architectural pressure comes from the renderer's
**event-bus + composer/parser** model: the UI talks to the server by sending
composers and listening to incoming message events. Almost every piece of
state in this app is "the latest value seen on a given event".

That model creates two kinds of friction with modern React:

1. **`useEffect` everywhere** — `react-hooks/set-state-in-effect` reports
   ~328 violations across ~280 files. Most are legitimate event-driven
   updates, but the pattern hides the intent (it reads as "imperative
   setState on mount/effect" rather than "subscribe to a stream").
2. **God-hooks** — `useCatalog` (~1100 lines), `useChat`, `useWiredTools`,
   `useInventoryFurni` all bundle data fetching, UI state, side effects,
   and computed values into a single export. Components import the whole
   thing for one field; the React Compiler skips memoization.

Two big files (`WiredCreatorToolsView.tsx` 4493→3901 lines,
`LoginView.tsx` 1700) further compound the problem: the Compiler logs
"Compilation Skipped: Existing memoization could not be preserved", which
means manual `useMemo`/`useCallback` are not even helping.

The improvements below are ordered so that each one makes the next one
easier.

---

## Five structural improvements

### 1. Event subscriptions as derived state

**Problem.** Pattern repeated hundreds of times:
```ts
const [foo, setFoo] = useState(initial);
useNitroEvent(SomeEvent, e => setFoo(e.payload));
```
or with the message channel:
```ts
const [data, setData] = useState(null);
useMessageEvent(SomeParser, e => {
    const parser = e.getParser();
    if (!parser) return;
    setData(parser.field);
});
```

The shape of the code obscures the intent ("`foo` IS the latest event payload")
and makes the lint think we're doing imperative setState in an effect.

**Solution.** Two thin hooks (`src/hooks/events/useNitroEventState.ts`
and `useMessageEventState.ts`):
```ts
const foo = useNitroEventState(SomeEvent, e => e.payload, initial);
const data = useMessageEventState(SomeParser, e => e.getParser()?.field ?? null, null);
```

Internally the selector closure is held in a ref refreshed in commit phase
(`useLayoutEffect`), so a new selector identity per render does not force
re-subscription. The listener is registered once.

**Status.** Implemented + adopted in `OfferView.tsx`, `useAvatarInfoWidget`
(figure/badges/group merge), and `useInventoryFurni` (extracted pure
reducers consumed by `useMessageEvent` setters).

**Adoption.** Organic: when a contributor sees a clean
"derive-from-single-event" case, they convert it. **Do not sweep-replace.**
The majority of existing subscriptions have side effects, multi-state
updates, conditional filters, or state-machine semantics that lose
information when forced into a single selector.

**Companions** (all implemented in `src/hooks/events/`):
- `useNitroEventReducer<S, T>(types, reducer, initial)` — multiple event
  types collapsing into one owned state slice (analogous to
  `useReducer` but driven by renderer events).
- `useMessageEventReducer<S, T>(eventTypes, reducer, initial)` — same
  shape on the server message channel; accepts a single type or an
  array of types that all feed the same reducer.
- `useExternalSnapshot<T>(subscribe, getSnapshot)` —
  `useSyncExternalStore` wrapper pairing the renderer's
  `EventDispatcher.subscribe()` with the `getXxxSnapshot()` getters
  added in renderer 2.1.0. Use this for readonly views over manager
  state (`getUserDataSnapshot`, `getActiveRoomSessionSnapshot`).

For state owned outside the listener (the `useState` + `setState(prev =>
applyX(prev, event))` pattern), keep using `useNitroEvent` /
`useMessageEvent` and extract the reducer as a pure function for
testability. See `src/hooks/inventory/useInventoryFurni.reducers.ts` and
`src/hooks/rooms/widgets/avatarInfo.reducers.ts` for the convention.

---

### 2. Server requests as queries

**Problem.** A request/response pair against the server today looks like:
```ts
useEffect(() => {
    SendMessageComposer(new GetXComposer());
}, []);

useMessageEvent(YParser, e => {
    setData(e.getParser().data);
});
```

There is no caching, no deduplication, no retry, no loading or error state,
no devtools. Every consumer rolls its own. The same request fires
multiple times if multiple components mount it.

**Solution.** Wrap composer/parser pairs in a TanStack Query adapter
(`@tanstack/react-query` is in the same family as `@tanstack/react-virtual`
which is already a dependency):
```ts
const { data, isLoading } = useNitroQuery({
    request: () => new GetXComposer(),
    parser: YParser,
    select: e => e.getParser().data,
});
```

**Status.** Adapter prototype written (`src/api/nitro-query/createNitroQuery.ts`).
Not wired up because `@tanstack/react-query` is **not yet installed** —
deliberately left as a `yarn add` step the team can approve.

**To enable.**
```sh
yarn add @tanstack/react-query @tanstack/react-query-devtools
```
Then mount the provider in `src/index.tsx`:
```tsx
<QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Migration order suggested.**
1. Read-only catalog data (`useCatalog` page fetches) — biggest win, lowest
   risk because it's mostly read.
2. Inventory tabs.
3. Navigator search results.
4. Marketplace listings.

Push messages (events the server emits without the client asking) keep
using `useMessageEventState` — they're not requests.

---

### 3. Feature folders ~~(adopted)~~ — **rejected, keep the current layout**

> **Update:** an earlier version of this document proposed a
> `src/features/<feature>/` layout (vertical slices). The pilot on the
> doorbell widget showed that the existing `src/components/<area>/` +
> `src/hooks/<area>/` split is the convention the team wants to keep.
> The pilot has been rolled back; this section is left as a record of
> the decision.

**Current convention** (the one to follow):

- **Views** live under `src/components/<area>/<feature>/*.tsx`
  (e.g. `src/components/room/widgets/doorbell/DoorbellWidgetView.tsx`).
- **Hooks** live under `src/hooks/<area>/<feature?>/*.ts`
  (e.g. `src/hooks/rooms/widgets/useDoorbellState.ts`). Multiple hooks
  for the same widget go in the same folder as siblings, not in a
  per-widget subfolder.
- **Pure helpers / constants / types** that are specific to one view
  go in sibling files next to the view (see
  `src/components/wired-tools/WiredCreatorTools.{types,constants,helpers}.ts`
  for the established pattern).
- **Cross-cutting** utilities continue to live under `src/api/` and
  `src/common/`.

Discoverability is acceptable as long as the **naming** is consistent —
`useDoorbellState` / `useDoorbellActions` / `DoorbellWidgetView` are
greppable in seconds even though they live in three separate directory
trees.

---

### 4. Splitting god-hooks

**Problem.** `useCatalog.ts` is ~1100 lines. It owns:
- Server fetch lifecycle (request/parser pairs)
- UI state (selected page, current product, filters)
- Side effects (purchases, gift composer dispatch)
- Computed values (pricing display, page tree)
- Cross-cutting helpers (currency lookup, club level checks)

Every component that imports `useCatalog()` for one field re-runs the
whole thing. The Compiler can't memoize it (too large). Tests can't be
written against a single concern.

**Solution.** Split by responsibility, not by entity:
```ts
useCatalogData()      // server data, returns { pages, currentPage, isLoading }
useCatalogUiState()   // ui state, returns { selectedNode, setSelectedNode, filters, ... }
useCatalogActions()   // imperative actions, returns { purchase, gift, openOffer }
```

Inside, `useCatalogData` uses `useNitroQuery` (#2). `useCatalogUiState` uses
a Zustand slice (#5). `useCatalogActions` is a stateless export — just
functions that compose composers.

**Status.** Pilot done on `useDoorbellWidget`:
- `src/hooks/rooms/widgets/useDoorbellState.ts` — the users list,
  derived from three events using a `useNitroEventReducer`-like pattern.
- `src/hooks/rooms/widgets/useDoorbellActions.ts` — `answer(name, flag)`.
- `src/hooks/rooms/widgets/useDoorbellWidget.ts` kept as a deprecated
  shim that composes the two so existing consumers don't break.

It's a small hook so the split looks almost theatrical, but the shape is
the same one we want to apply to `useCatalog`.

**Migration order suggested.** Largest pain first, moving down:
1. `useCatalog` (~1100 LOC) — but only after #2 is enabled (server fetches
   collapse to a few `useNitroQuery` calls, removing 60% of the file).
2. `useChatInputWidget` (~500 LOC)
3. `useWiredTools` (~600 LOC)
4. `useInventoryFurni` (~300 LOC)

---

### 5. Unified UI store

**Problem.** Cross-feature UI state lives in:
- React Context (e.g. `UiSettingsContext`)
- Custom hooks with module-level singletons (`useNavigator`'s implicit cache)
- `let foo = ...` module-level mutable variables — flagged by the React
  Compiler as "Writing to a variable defined outside a component or hook is
  not allowed" (currently 5+ violations)
- `localStorage` reads in effects

There is no single source of truth, no devtools, no time-travel.

**Solution.** Adopt **Zustand** for cross-feature UI state. Each feature
owns one slice:
```ts
// src/state/wired-tools.ts (or src/components/wired-tools/wiredToolsStore.ts)
export const useWiredToolsStore = create<WiredToolsState>()((set) => ({
    activeTab: 'monitor',
    setActiveTab: (tab) => set({ activeTab: tab }),
    // ...
}));
```

Components subscribe to **specific keys** (Zustand re-renders only the
subscribers whose selected slice changed):
```ts
const activeTab = useWiredToolsStore(s => s.activeTab);
```

This eliminates the `let isCreatingRoom = false` module-level pattern and
makes the state ispezionable in dev tools.

**Status.** Skeleton written (`src/state/createNitroStore.ts`), not yet
adopted — `zustand` is not yet installed. Same reason as #2: deliberately
a follow-up `yarn add` step.

**To enable.**
```sh
yarn add zustand
```
Then convert the smallest singleton first (suggestion: the
`isCreatingRoom`/`createRoomTimeout` pair in
`NavigatorRoomCreatorView.tsx` — it's a clean 5-line conversion).

**Do not** wholesale-replace Context. Some Contexts (theming, i18n) are
fine as-is. Zustand is for *application* state, not *configuration* state.

---

## Bonus: error boundaries

`react-error-boundary` is already a dependency. A widget crashing in a
room (e.g. malformed pet data in `InfoStandWidgetFurniView`) currently
takes down the whole UI.

**Solution.** Wrap each widget root in `<ErrorBoundary fallback={null} onError={NitroLogger.error}>`.
Implementation lives at `src/common/error-boundary/WidgetErrorBoundary.tsx`.

**Status.** Implemented + applied to `RoomWidgetsView` as the umbrella for
all in-room widgets. A widget crash now degrades gracefully (the offending
widget disappears) instead of unmounting the room.

A more granular pass could wrap each individual widget for finer-grained
fallbacks, but the umbrella alone already prevents the worst class of
failures.

---

## What's already in place

The current branch (**`feat/react19-modernization`**, PR #2) has applied:

### Toolchain
- React 19.2 / `react-dom` 19.2 / `@types/react` 19.2.
- TS 6 for build + **TS 7 native preview** (`tsgo`) for `yarn typecheck`.
- ESLint 10 + `typescript-eslint` 8 + `eslint-plugin-react-hooks@7` +
  `eslint-plugin-react-compiler`.
- Vite 8 + React Compiler 1.0 (`babel-plugin-react-compiler`).
- `<StrictMode>` mounted; `App.tsx` made idempotent for the double-mount.

### React 19 idioms
- **`forwardRef` → `ref` prop** on 7 layout/component files (11 call sites).
- **`<Ctx.Provider>` → `<Ctx>`** on 6 contexts.
- **Native `<script>`** in `TurnstileWidget`, `ExternalPluginLoader`,
  `GoogleAdsView`.
- **Form Actions** (`useActionState` + `useFormStatus`) for the inline
  Login/Register/Forgot dialogs in `LoginView.tsx`. Legacy non-Action
  versions in `components/login/components/` removed as dead code.
- **`useEffectEvent`** in `App.tsx`, `FurniEditorSearchView`,
  `NotificationBadgeReceivedBubbleView`,
  `NavigatorRoomSettingsRightsTabView`, `UiSettingsContext`,
  `TurnstileWidget` — clears all remaining `exhaustive-deps` warnings.
- Targeted `set-state-in-effect` fixes: `CatalogHeaderView` (pure derive),
  `NavigatorRoomCreatorView` (lazy state init), `LoginView`
  (track-previous-prop reset), `ChooserWidgetView` (callback in
  `useEffectEvent`).

### Patterns + adoption (proposals #1, #2, #4, #5)
- **`useNitroEventState` / `useMessageEventState` + companions** (proposal #1)
  — adapters in `src/hooks/events/`. Selectors are held in a
  `useLayoutEffect`-refreshed ref (Dan Abramov's use-event-callback
  pattern) so the listener stays mounted across renders.
  Companions for the multi-event → single state-slice case:
  `useNitroEventReducer`, `useMessageEventReducer`, plus
  `useExternalSnapshot` (a typed wrapper of `useSyncExternalStore` for the
  renderer's `EventDispatcher.subscribe()` + `getXxxSnapshot()` getters
  added in `Nitro_Render_V3` 2.1.0).
  Pilots: `OfferView` (single-event), `useAvatarInfoWidget` (3 listeners
  for figure/badges/group merged via pure reducers — moved out of
  `InfoStandWidgetUserView`, killing 3 `CloneObject` calls), and
  `useInventoryFurni` (4 message listeners + fragment buffer refactored
  to pure reducers; the module-level `furniMsgFragments` is now a
  `useRef` and the dead `FurniturePostItPlacedEvent` handler dropped).
- **`useNitroQuery`** (proposal #2) — **enabled**. `@tanstack/react-query` +
  devtools installed; `QueryClientProvider` mounted in `src/index.tsx`.
  Adapter at `src/api/nitro-query/createNitroQuery.ts` with `select`,
  `accept` (correlation-key filter), `timeoutMs`, `staleTime`, plus a
  lower-level `awaitNitroResponse()` for imperative use. Pilots:
  `OfferView`, `CatalogLayoutRoomAdsView`, `ModToolsChatlogView`,
  `CfhChatlogView`, `useGiftConfiguration` (replaces the
  `GiftWrappingConfigurationEvent` listener + eager composer dispatch
  that lived in `useCatalog`; consumed directly by `CatalogGiftView`).
- **Layout / feature folders** (proposal #3) — **rejected**. The existing
  `src/components/<area>/<feature>/` (views) +
  `src/hooks/<area>/<feature?>/` (flat hook files) is the layout that
  stays. See section 3 above for the full rule.
- **God-hook split** (proposal #4) — applied to:
    - **doorbell**: `useDoorbellState` + `useDoorbellActions` + shim.
    - **poll**: `usePollSubscriptions` (mounted once in `RoomWidgetsView`)
      + `usePollActions` + shim. `useWordQuizWidget` was migrated to
      import `usePollActions` directly so it doesn't pull subscriptions.
    - **furni chooser**: `useFurniChooserState` + `useFurniChooserActions`
      + shim. Helper `buildWallItem`/`buildFloorItem` dedupes ~50 lines
      of inline `RoomObjectItem` construction (typed via `IRoomObject`;
      the dead `sessionDataManager.getUserData` fallback dropped — the
      method never existed).
    - **user chooser**: `useUserChooserState` + `useUserChooserActions`
      + shim. Helper `buildUserItem`. Adds `?.` guards on
      `roomSession?.userDataManager?` to avoid the room-transition NPE
      pattern.
    - **friend request**: `useFriendRequestState` (3 useState + 2 event
      bridges + 1 derive effect) + `useFriendRequestActions` (thin
      adapter on the friends store) + shim. Exports `ActiveFriendRequest`
      type.
    - **chat input**: `useChatInputState` (5 state slices + 3 event
      listeners + 3 lifecycle effects: flood countdown, idle auto-clear,
      typing-indicator sync) + `useChatInputActions` (`sendChat` with
      the full slash-command repertoire and the outgoing-translation
      pipeline) + shim. Single consumer (`ChatInputView`) keeps the
      original tuple.
    - **wired tools**: `useWiredToolsStore` (internal singleton — state,
      listeners, effects, 13 actions in one closure) + `useWiredToolsState`
      / `useWiredToolsActions` (read-only and imperative `useBetween`
      filters over the same singleton) + `useWiredTools` shim. Used by
      ~20 consumers; the singleton sharing keeps a single source of
      truth while letting consumers import only the slice they touch.
    - **translation**: `useTranslationStore` (internal singleton) +
      `useTranslationState` / `useTranslationActions` (filtered
      `useBetween` views) + `useTranslation` shim. Same pattern as
      Wired tools — six consumers split across read-only views
      (settings panel, bootstrap) and dispatch sites (messenger, chat
      input).
- **Zustand** (proposal #5) — **enabled**. `zustand` installed; factory at
  `src/state/createNitroStore.ts`. First adoption: the `let isCreatingRoom`
  / `createRoomTimeout` module-level pair in `NavigatorRoomCreatorView`
  replaced by `useRoomCreatorStore` (timer lives in the store closure,
  survives StrictMode double-mount).

### `WiredCreatorToolsView` decomposition
- Top-level constants/types/helpers extracted to sibling files
  (`WiredCreatorTools.{types,constants,helpers}.ts`).
- All four tab JSX bodies extracted into sibling components:
    - `WiredMonitorTabView`
    - `WiredInspectionTabView`
    - `WiredVariablesTabView`
    - `WiredToolsSettingsTabView` (already separate from before this PR)
- The three Monitor-tab overlay popups guarded by `{ false && ... }`
  were dead duplicates of the live overlays mounted at the root level —
  dropped.
- Main view: **4493 → 3544 lines** (−21%).

### Tests
- Vitest 3 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`
  configured. Separate `vitest.config.mts` so the runner doesn't drag in
  the renderer SDK aliases from `vite.config.mjs`.
- **83 cases passing** across 7 test files:
    - `WiredCreatorTools.helpers.test.ts` (18) — formatters + snapshot
      factory.
    - `navigatorRoomCreatorStore.test.ts` (4) — Zustand store invariants
      with fake timers.
    - `api-utils.test.ts` (27) — `ConvertSeconds`, `LocalizeShortNumber`,
      `CloneObject`, `GetWiredTimeLocale`, `WiredDateToString`,
      `PrefixUtils`.
    - `api-utils-extra.test.ts` (16) — `ColorUtils`, `FixedSizeStack`,
      `LocalizeFormattedNumber`.
    - `friendly-time.test.ts` (12) — `FriendlyTime` with a deterministic
      `LocalizeText` mock (cuts the transitive renderer-SDK import).
    - `dedupeBadges.test.ts` (6) — slot-preserving badge dedup
      (covers the helper used by the InfoStand pilot).
- `yarn test` + `yarn test:watch` scripts added.

### Logic bug fixes
- Doorbell close button didn't close while users were pending
  (`useEffect(() => setIsVisible(!!users.length))` overrode the close).
- Doorbell `answer()` removed users locally before the server confirmed
  via `RSDE_ACCEPTED`/`RSDE_REJECTED`, desyncing on network drop.
- `RoomToolsWidgetView` wiped `nitro.room.history` from localStorage on
  every `beforeunload` (every tab close).
- `AvatarInfoPetTrainingPanelView` crashed if `roomSession` was null at
  parser time.
- `useInventoryFurni` had a module-level `furniMsgFragments` buffer that
  would have collided between two simultaneous client instances (now
  scoped to a `useRef` inside the singleton hook).

### Dead code removed
- `src/components/login/components/RegisterDialog.tsx`.
- `src/components/login/components/ForgotDialog.tsx`.
- `src/components/login/components/shared.ts` (consumed only by the two
  legacy dialogs).
- `useInventoryFurni`'s empty `FurniturePostItPlacedEvent` handler.
- `IRoomSession.sendWhisperGroupMessage` + impl in the renderer (the
  `ChatWhisperGroupComposer` it referenced never existed; no client
  call site).

### Typecheck baseline
- Repository-wide `tsgo` (TS 7 preview) errors driven down to **57**
  client-side and **0** renderer-side via a series of small targeted
  sweeps:
    - Framer-motion `Variants` typing on `ToolbarView` + `FriendsBarView`
      (−33).
    - `createNitroQuery` import path / generics / Pick subset
      (−3 + −1 propagation).
    - `useFurniChooserState` typed as `IRoomObject` + dead getUserData
      branch dropped (−10).
    - `ColorVariantType` extended with the 5 `outline-*` bootstrap
      variants used by the group-forum thread view (−4).
    - React 19 `JSX` import in `WiredNeighborhoodSelectorView` (−1).
    - `showConfirm` extra-arg drop in `useOnClickChat` (−1).
    - `UserContainerView` `friendsCount.toString()` (−1).
- Renderer-side cluster cleared in a single pass: TS 5.7+ `ArrayBuffer`
  drift, Pixi v8 `Filter[]` / `WebGLRenderer` narrows, missing
  `IGraphicAsset` import, empty-tuple `IMessageComposer<[]>`,
  `PetBreedingMessageParser.bytesAvailable` boolean-vs-number bug,
  `RoomEnterComposer` extended with optional spawnX/spawnY to match the
  Arcturus server (which already reads both ints when present).

### Bonus
- **`WidgetErrorBoundary`** (`src/common/error-boundary/`) — wraps the
  `RoomWidgetsView` umbrella. A widget crash now degrades gracefully
  (logged to `NitroLogger.error`) instead of unmounting the room.
- **`CLAUDE.md`** at the repo root — onboarding file Claude Code reads at
  session start. Captures the layout convention, the patterns to use,
  what's wired up, what isn't, and the open logic bugs.

---

## How to pick the next refactor PR

Foundations are **done**: React Query enabled with 4 pilot migrations,
Zustand enabled with 1 store, Vitest with 77 cases, error boundary on
the room widgets umbrella, `usePollSubscriptions` already hoisted to
`RoomWidgetsView`, `WiredCreatorToolsView` fully split per tab.

Remaining order of value/risk for the next contributor:

1. **Migrate `useCatalog`'s read-only fetches to `useNitroQuery`.**
   Biggest expected payoff (cache + dedup + loading state for free).
   The hook is ~1100 lines; start with the page-tree fetch and the
   handful of fire-and-forget request/response pairs (gift wrapping
   config, builders-club furni count, sellable pet palettes). The
   imperative purchase / gift flows stay where they are. Add a
   Vitest case per migration.
2. **Split `useCatalog` along the doorbell/poll lines**
   (`useCatalogData` / `useCatalogUiState` / `useCatalogActions`,
   siblings under `src/hooks/catalog/`). Only after step 1 — React
   Query removes ~60% of the file's responsibility, Zustand can absorb
   the UI state slice.
3. **Per-widget `WidgetErrorBoundary` wrapping** inside `RoomWidgetsView`.
   The umbrella is in place; granular wrapping means a crash in one
   widget (e.g. `ChatWidgetView`) doesn't take down the rest of the
   room overlay. Mechanical and safe.
4. **Hoist `WiredCreatorToolsView`'s shared state to a Zustand slice.**
   The 4-tab split is done but the parent still passes ~25 props to
   each tab. A slice at `src/components/wired-tools/wiredToolsStore.ts`
   would make each tab subscribe to the keys it needs.
5. **Address the two open logic bugs** (see the "Known logic bugs"
   section above): the `MainView` CREATED/ENDED race needs a session
   token; the `LayoutFurniImageView` / `LayoutAvatarImageView` async
   fetch race needs a request-id ref (or is solved by migrating the
   image fetch to `useNitroQuery` keyed on props).
6. **Wider Vitest coverage** — next worthwhile targets: the
   `useNitroQuery` adapter (timeout + cleanup + accept-filter
   behavior, needs a stub for `@nitrots/nitro-renderer`),
   `useDoorbellState`/`useUserChooserState` event-reducer logic
   (needs the same renderer stub).

Skipped intentionally and documented in commit messages:

- `usePetPackageWidget` and `useWordQuizWidget` god-hook splits — their
  "actions" mutate internal state, so a clean data/actions split would
  need either action arguments or a shared store first.
- `useChatInputWidget` / `useChatWidget` / `useAvatarInfoWidget` —
  large state machines, need per-file design before a mechanical split.

Anything else (the `LoginView` dialog split, the
`react-compiler/react-compiler` warnings on the remaining big files,
the `set-state-in-effect` sweep) is a downstream consequence of the
above — easier and safer once the foundations are in place.

---

## Known logic bugs (independent of structural refactor)

These are runtime bugs spotted while doing the structural work. They are
**not** fixed by the patterns above — they need their own PRs with manual
QA. Listing them here because there is currently no GitHub Issues board on
this repo.

### Open

#### `MainView` — race between `RoomSessionEvent.CREATED` and `ENDED`

`src/components/MainView.tsx:47-48` writes the same `landingViewVisible`
state from two independent listeners with no session-token guard:

```ts
useNitroEvent(RoomSessionEvent.CREATED, () => setLandingViewVisible(false));
useNitroEvent(RoomSessionEvent.ENDED, e => setLandingViewVisible(e.openLandingView));
```

If the events arrive out of order (fast reconnect, network reordering),
the final state contradicts the actual session state — landing view stuck
open inside a room, or stuck closed at the hotel view. Resolves on next
room change.

**Fix shape** (deferred until `useNitroEventReducer` companion lands —
see proposal #1):

```ts
// One reducer owns both events + the active session token
const { sessionId, landingViewVisible } = useNitroEventReducer<...>(
    [RoomSessionEvent.CREATED, RoomSessionEvent.ENDED],
    (state, e) => {
        if (e.type === RoomSessionEvent.CREATED) {
            return { sessionId: e.session.roomId, landingViewVisible: false };
        }
        if (state.sessionId !== null && e.session.roomId !== state.sessionId) {
            return state; // stale ENDED for old session, ignore
        }
        return { sessionId: null, landingViewVisible: e.openLandingView };
    },
    { sessionId: null, landingViewVisible: true }
);
```

**Severity**: edge case, observed only after unstable websocket
reconnects. UX-degrading, not data-corrupting.

#### `LayoutFurniImageView` / `LayoutAvatarImageView` — async fetch race

In both files an effect kicks off an async `processAsImageUrl` /
`generateImage` and writes the result via `setImageElement`. If props
change twice in quick succession, the first fetch can resolve **after**
the second one and overwrite the newer image with the older one.

**Fix shape**: capture a request-id ref at the start of the effect, only
write the result if the ref hasn't been bumped meanwhile. Or — better —
once React Query (#2) is enabled, model the image fetch as a query keyed
on the props tuple; React Query handles cancellation and ordering for
free.

**Severity**: visible only on slow connections / rapid prop changes. Not
data-corrupting.

### Recently fixed (in this branch)

- **Doorbell close button didn't close** while users were pending
  (`useEffect(() => setIsVisible(!!users.length))` overrode the close).
  Fixed by `src/components/room/widgets/doorbell/DoorbellWidgetView.tsx`
  (separate `dismissed` state, visibility computed in render).
- **Doorbell optimistic remove without rollback** — the original
  `answer()` removed the user from the local list before the server
  confirmed via `RSDE_ACCEPTED`/`RSDE_REJECTED`, leaving client and
  server desynced if the network dropped. Fixed by removing the local
  `removeUser` call: the server-driven events now own the list. Note:
  a "pending" indicator (so users see their answer is in flight) is
  desirable — separate small PR.
- **`localStorage` room history wiped on every tab close**
  (`RoomToolsWidgetView.tsx`, `useEffect` on `beforeunload` removing
  `nitro.room.history`). Fixed by removing the `beforeunload` handler;
  history now persists across sessions, which is the only sensible
  meaning of `localStorage`. If "session-only" was the intent, the right
  primitive is `sessionStorage` — file an issue if that's actually
  desired.
- **`AvatarInfoPetTrainingPanelView` null-pointer** —
  `roomSession.userDataManager.getPetData(parser.petId)` could throw if
  `roomSession` was null at the moment the event arrived (between rooms).
  Fixed with `?.` chain.
