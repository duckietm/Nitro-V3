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

**Status.** Implemented + 1 pilot adoption (`OfferView.tsx`).

**Adoption.** Organic: when a contributor sees a clean
"derive-from-single-event" case, they convert it. **Do not sweep-replace.**
The majority of existing subscriptions have side effects, multi-state
updates, conditional filters, or state-machine semantics that lose
information when forced into a single selector.

**Companion to add later.** A `useNitroEventReducer<S, T>(events, reducer, initial)`
for the cases where multiple events affect one state slice
(see `useDoorbellWidget` — three events, one users array).

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

### 3. Feature folders

**Problem.** The current layout splits ownership across three trees:
```
src/components/wired-tools/    (views)
src/hooks/wired-tools/         (hooks)
src/api/wired/                 (utility functions, mixed with the wired runtime)
```
A change to "the wired-tools panel" touches all three. Discoverability is
poor: a new contributor reading `WiredCreatorToolsView.tsx` cannot guess
`useWiredTools` lives 4 directory levels away.

**Solution.** Feature folders. Each feature owns its complete vertical
slice:
```
src/features/wired-tools/
├── index.ts              (public API: only what other features can import)
├── views/                (React components)
├── hooks/                (feature-local hooks)
├── state/                (zustand slices, when they exist)
├── types.ts
├── constants.ts
└── helpers.ts
```

**Rule.** A feature folder may import:
- React, third-party libs, the renderer SDK
- `src/common/` (UI primitives)
- `src/api/` (cross-cutting helpers — `LocalizeText`, `SendMessageComposer`)
- Other features **only via their public `index.ts`**

A feature folder must **not** reach into another feature's internals.

**Status.** Pilot done on `src/features/doorbell/` (the doorbell widget,
small enough to migrate cleanly in one PR). The legacy
`src/components/room/widgets/doorbell/DoorbellWidgetView.tsx` and
`src/hooks/rooms/widgets/useDoorbellWidget.ts` are kept as compat-shim
re-exports (one line each) so existing import paths still work — they can
be deleted in a follow-up PR.

**Migration order suggested.**
Smallest features first to validate the pattern, then bigger:
1. doorbell (done)
2. campaign, ads, mod-tools (each <500 lines)
3. notification-center, help, hc-center
4. catalog, inventory, navigator, wired-tools (multi-thousand lines each)

A `jscodeshift` codemod could rewrite import paths in bulk, but each
feature's relative-path imports (`../../api`, etc.) need to be re-targeted
to the new depth — codemod-able but verify by running tsc per feature.

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
- `src/features/doorbell/hooks/useDoorbellState.ts` — the users list,
  derived from three events using `useNitroEventReducer`-like pattern.
- `src/features/doorbell/hooks/useDoorbellActions.ts` — `answer(name, flag)`.

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
// src/features/wired-tools/state/wiredToolsSlice.ts
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

The current branch (`claude/update-react-typescript-He2rs`) has applied:

- **React 19.2 / TypeScript 7 (Native preview) / ESLint 10 / React Hooks v7 / React Compiler 1.0** — toolchain bump, all warnings audited.
- **Form Actions** — `<form action={...}>` + `useActionState` adopted in
  `LoginView.tsx` (login, register, forgot dialogs).
- **`useEffectEvent`** — adopted in `App.tsx`, `FurniEditorSearchView`,
  `NotificationBadgeReceivedBubbleView`, `NavigatorRoomSettingsRightsTabView`,
  `UiSettingsContext` to clear all `react-hooks/exhaustive-deps` warnings.
- **Targeted `set-state-in-effect` cleanup** — `CatalogHeaderView` (pure
  derive), `NavigatorRoomCreatorView` (lazy state init), `LoginView`
  (track-previous-prop reset), `ChooserWidgetView` (callback in
  `useEffectEvent`).
- **`WiredCreatorToolsView` split** — types/constants/helpers extracted to
  sibling files; main view 4493 → 3901 lines.
- **Pattern #1 (`useNitroEventState`)** — implemented + 1 pilot.
- **Pattern #3 (feature folder)** — pilot on `src/features/doorbell/`.
- **Pattern #4 (split god-hook)** — pilot on the doorbell hook.
- **Pattern #2 (`useNitroQuery`)** — adapter prototype written, not yet
  enabled (needs `yarn add @tanstack/react-query`).
- **Pattern #5 (Zustand store)** — skeleton written, not yet enabled
  (needs `yarn add zustand`).
- **Bonus (error boundaries)** — `WidgetErrorBoundary` applied at
  `RoomWidgetsView`.

---

## How to pick the next refactor PR

Order of value/risk for the next contributor:

1. **Enable React Query** (`yarn add @tanstack/react-query`) and migrate
   one read-only `useCatalog` fetch as a second pilot. Highest impact, low
   risk.
2. **Migrate one mid-sized feature to feature folders** (e.g. `mod-tools`
   or `campaign`). Mostly mechanical, validates the pattern at a real
   scale.
3. **Enable Zustand** and migrate the `let isCreatingRoom` /
   `createRoomTimeout` singleton in `NavigatorRoomCreatorView`. Trivial,
   makes the Compiler stop complaining about cross-component variable
   writes.
4. **Add tests** (still the #1 thing missing — see "What I'd fix" notes).
   Vitest + jsdom + a tiny mock layer for the renderer would unblock every
   refactor below.
5. **Split `useCatalog`** — the biggest god-hook. Only do this *after*
   #1 and #5 in this list (React Query removes 60% of the file's
   responsibility, Zustand handles its UI state).

Anything else (the per-tab `WiredCreatorTools` split, the
`react-compiler/react-compiler` warnings, the `set-state-in-effect`
sweep, the `LoginView` dialog split) is a downstream consequence of these
five — easier and safer once the foundations are in place.
