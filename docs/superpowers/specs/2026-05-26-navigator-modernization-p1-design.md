# Navigator Modernization — P1: Hook Split + UI Store

**Branch:** `feat/navigator-modernization` (forked from `origin/Dev` @ `d5d5ca59`)
**Date:** 2026-05-26
**Scope:** P1 of a 4-phase Navigator modernization sweep (P1 → P2 → P3 → P4).
**This spec covers ONLY P1.** P2 (TanStack Query), P3 (reactive snapshots),
and P4 (visual rework + virtualization + persistence) will each get their
own spec when P1 lands.

## 1. Context

The Nitro-V3 client has established patterns for god-hook
modernization, all visible on the current `origin/Dev` tip:

- **God-hook split into filters over a `useBetween` singleton.** Two
  precedents:
  - `useWiredTools` — 4 files (`useWiredToolsStore` + `useWiredToolsState`
    + `useWiredToolsActions` + `useWiredTools` shim). 630-line store.
  - `useCatalog` — single 1055-line file holding store + three filters
    (`useCatalogData` / `useCatalogUiState` / `useCatalogActions`).
- **Zustand UI stores** via `createNitroStore` (`src/state/createNitroStore.ts`)
  for cross-feature UI flags.
- **Renderer snapshot consumer hooks** (`useSyncExternalStore`) — out of
  scope for P1, used in P3.
- **`useNitroQuery`** for composer/parser request-response — out of
  scope for P1, used in P2.
- **Co-located Vitest suites** under `src/`, sharing the renderer-SDK
  stub at `src/nitro-renderer.mock.ts`.

`src/hooks/navigator/useNavigator.ts` is the largest remaining god-hook
on this branch: 492 lines, 21 event listeners, 9 internal `useState`,
consumed by 13 files (10 inside `src/components/navigator/` + 3
outside in `room-tools`, `room-filter-words`, and `catalog` views). It
mixes three logically separate concerns:

1. **Navigator data** — search results, categories, top-level
   contexts, favourites, metadata.
2. **Door state** — doorbell, password prompt, accepted / no-answer /
   wrong-password lifecycle.
3. **Local UI flags** — 9 `useState` in `NavigatorView.tsx` controlling
   panel visibility and search lifecycle.

P1 separates these three and migrates all consumers.

## 2. Decisions

| Topic | Decision |
|---|---|
| Door state | **Extract** to `src/hooks/rooms/widgets/useDoorState.ts` |
| UI store scope | **All 9 flags** into `navigatorUiStore` Zustand |
| Shim retention | **Remove** `useNavigator` after all 13 consumers migrated |
| Filter shape | **Flat objects**, mirroring `useCatalog` and `useWiredTools` |
| File layout | **4 separate files**, mirroring `wired-tools` (not the monolithic `useCatalog.ts`) |
| Scope of P1 | **Pure refactor** — zero user-visible change |
| Branch | `feat/navigator-modernization` (forked from `origin/Dev`, not a sub-branch of any other modernization branch) |

## 3. Architecture

Mirrors the `wired-tools` layout exactly — 4 hook files in
`src/hooks/navigator/`, plus a sibling `navigatorUiStore.ts` for the
Zustand UI flags, plus `useDoorState.ts` extracted to
`src/hooks/rooms/widgets/`:

```
src/hooks/navigator/
├── useNavigatorStore.ts         ← NEW: internal useBetween closure
│                                  (data state + non-door listeners + actions)
├── useNavigatorData.ts          ← NEW: public filter — read-only data
├── useNavigatorUiState.ts       ← NEW: public filter — read-only UI flags
├── useNavigatorActions.ts       ← NEW: public filter — imperative actions
├── navigatorUiStore.ts          ← NEW: Zustand UI store (9 flags + actions)
├── index.ts                     ← REWRITTEN: barrel exports the 3 filters,
│                                  useNavigatorUiStore, and re-exports useDoorState
└── useNavigator.ts              ← DELETED at end of P1 (god-hook shim removed)

src/hooks/rooms/widgets/
└── useDoorState.ts              ← NEW: extracted door lifecycle
```

### 3.1 Internal `useNavigatorStore` closure (in `useNavigatorStore.ts`)

The single `useBetween` singleton's internal function. Holds:

- All non-door state currently in `useNavigatorState` of the old
  `useNavigator.ts`: `categories`, `eventCategories`,
  `favouriteRoomIds`, `topLevelContext`, `topLevelContexts`,
  `searchResult`, `navigatorSearches`, `navigatorData`.
- All non-door event listeners (16 of them): `FavouritesEvent`,
  `FavouriteChangedEvent`, `RoomSettingsUpdatedEvent`,
  `CanCreateRoomEventEvent`, `UserInfoEvent`, `UserPermissionsEvent`,
  `RoomForwardEvent`, `RoomEntryInfoMessageEvent`,
  `NavigatorMetadataEvent`, `NavigatorSearchEvent`,
  `UserFlatCatsEvent`, `UserEventCatsEvent`, `FlatCreatedEvent`,
  `NavigatorHomeRoomEvent`, `RoomEnterErrorEvent`,
  `NavigatorOpenRoomCreatorEvent`, `NavigatorSearchesEvent`,
  plus `NitroEventType.SOCKET_RECONNECTING`.
- `GetGuestRoomResultEvent` — dual-subscribed (see §5.2).
- `GenericErrorEvent` — dual-subscribed (see §5.3).
- New imperative actions `sendSearch` and `reloadCurrentSearch`,
  extracted from the current `NavigatorView.tsx` locals (today defined
  on lines 42-79 of `src/components/navigator/NavigatorView.tsx`).

### 3.2 The three filters (flat shape, wired-tools layout)

```ts
// useNavigatorData.ts
import { useBetween } from 'use-between';
import { useNavigatorStore } from './useNavigatorStore';

export const useNavigatorData = () => {
    const {
        categories, eventCategories, favouriteRoomIds,
        topLevelContext, topLevelContexts,
        searchResult, navigatorSearches, navigatorData,
    } = useBetween(useNavigatorStore);
    return {
        categories, eventCategories, favouriteRoomIds,
        topLevelContext, topLevelContexts,
        searchResult, navigatorSearches, navigatorData,
    };
};

// useNavigatorUiState.ts
import { useNavigatorUiStore } from './navigatorUiStore';

export const useNavigatorUiState = () => {
    const isVisible            = useNavigatorUiStore(s => s.isVisible);
    const isReady              = useNavigatorUiStore(s => s.isReady);
    const isCreatorOpen        = useNavigatorUiStore(s => s.isCreatorOpen);
    const isRoomInfoOpen       = useNavigatorUiStore(s => s.isRoomInfoOpen);
    const isRoomLinkOpen       = useNavigatorUiStore(s => s.isRoomLinkOpen);
    const isOpenSavesSearches  = useNavigatorUiStore(s => s.isOpenSavesSearches);
    const isLoading            = useNavigatorUiStore(s => s.isLoading);
    const needsInit            = useNavigatorUiStore(s => s.needsInit);
    const needsSearch          = useNavigatorUiStore(s => s.needsSearch);
    return {
        isVisible, isReady, isCreatorOpen, isRoomInfoOpen, isRoomLinkOpen,
        isOpenSavesSearches, isLoading, needsInit, needsSearch,
    };
};

// useNavigatorActions.ts
import { useBetween } from 'use-between';
import { useNavigatorStore } from './useNavigatorStore';

export const useNavigatorActions = () => {
    const { sendSearch, reloadCurrentSearch } = useBetween(useNavigatorStore);
    return { sendSearch, reloadCurrentSearch };
};
```

`useNavigatorActions` is intentionally small in P1 — favourite
toggles, room visits, and door responses keep flowing through their
existing direct composer calls in consumer components. We only hoist
the two functions that are currently prop-drilled into
`NavigatorSearchView` and the tab `onClick` handlers.

`useNavigatorUiState` uses per-key Zustand selectors (one selector
per flag) so a component re-renders only when a flag it actually
reads changes. The flat object it returns preserves the API shape
consumers expect.

### 3.3 `navigatorUiStore` (Zustand)

```ts
// src/hooks/navigator/navigatorUiStore.ts
import { createNitroStore } from '../../state/createNitroStore';

type NavigatorUiState = {
    isVisible: boolean;
    isReady: boolean;
    isCreatorOpen: boolean;
    isRoomInfoOpen: boolean;
    isRoomLinkOpen: boolean;
    isOpenSavesSearches: boolean;
    isLoading: boolean;
    needsInit: boolean;
    needsSearch: boolean;
};

type NavigatorUiActions = {
    show(): void;
    hide(): void;
    toggle(): void;
    openCreator(): void;
    closeCreator(): void;
    setRoomInfoOpen(open: boolean): void;
    toggleRoomInfo(): void;
    setRoomLinkOpen(open: boolean): void;
    toggleRoomLink(): void;
    toggleSavesSearches(): void;
    setLoading(loading: boolean): void;
    markReady(): void;
    markInitDone(): void;
    requestSearch(): void;        // sets needsSearch = true
    consumeSearchRequest(): void; // sets needsSearch = false
};

const INITIAL: NavigatorUiState = {
    isVisible: false,
    isReady: false,
    isCreatorOpen: false,
    isRoomInfoOpen: false,
    isRoomLinkOpen: false,
    isOpenSavesSearches: false,
    isLoading: false,
    needsInit: true,
    needsSearch: false,
};

export const useNavigatorUiStore = createNitroStore<NavigatorUiState & NavigatorUiActions>()((set) => ({
    ...INITIAL,
    show: () => set({ isVisible: true, needsSearch: true }),
    hide: () => set({ isVisible: false }),
    toggle: () => set((s) => s.isVisible
        ? { isVisible: false }
        : { isVisible: true, needsSearch: true }),
    openCreator: () => set({ isVisible: true, isCreatorOpen: true }),
    closeCreator: () => set({ isCreatorOpen: false }),
    setRoomInfoOpen: (open) => set({ isRoomInfoOpen: open }),
    toggleRoomInfo: () => set((s) => ({ isRoomInfoOpen: !s.isRoomInfoOpen })),
    setRoomLinkOpen: (open) => set({ isRoomLinkOpen: open }),
    toggleRoomLink: () => set((s) => ({ isRoomLinkOpen: !s.isRoomLinkOpen })),
    toggleSavesSearches: () => set((s) => ({ isOpenSavesSearches: !s.isOpenSavesSearches })),
    setLoading: (loading) => set({ isLoading: loading }),
    markReady: () => set({ isReady: true }),
    markInitDone: () => set({ needsInit: false }),
    requestSearch: () => set({ needsSearch: true }),
    consumeSearchRequest: () => set({ needsSearch: false }),
}));
```

The `linkTracker` in `NavigatorView.tsx` calls these actions directly
on `useNavigatorUiStore.getState()` instead of mutating local
`useState`. That collapses the switch statement from 30+ lines to a
clean dispatch table and eliminates the closure-over-stale-state hazard
where the tracker re-registers on every `isVisible` change (today at
`src/components/navigator/NavigatorView.tsx:162`).

### 3.4 `useDoorState` (extracted to `src/hooks/rooms/widgets/`)

```ts
// src/hooks/rooms/widgets/useDoorState.ts
import { DoorbellMessageEvent, FlatAccessDeniedMessageEvent,
    GenericErrorEvent, GetGuestRoomResultEvent,
    GetSessionDataManager, RoomDataParser,
    RoomDoorbellAcceptedEvent } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { useBetween } from 'use-between';
import { DoorStateType } from '../../../api';
import { useMessageEvent } from '../../events';

export type DoorStateSnapshot = {
    roomInfo: RoomDataParser | null;
    state: number;  // DoorStateType.*
};

const INITIAL: DoorStateSnapshot = { roomInfo: null, state: DoorStateType.NONE };

const useDoorStateStore = () => {
    const [snapshot, setSnapshot] = useState<DoorStateSnapshot>(INITIAL);

    useMessageEvent<DoorbellMessageEvent>(DoorbellMessageEvent, event => {
        const parser = event.getParser();
        if (parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_WAITING }));
    });

    useMessageEvent<RoomDoorbellAcceptedEvent>(RoomDoorbellAcceptedEvent, event => {
        const parser = event.getParser();
        if (parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_ACCEPTED }));
    });

    useMessageEvent<FlatAccessDeniedMessageEvent>(FlatAccessDeniedMessageEvent, event => {
        const parser = event.getParser();
        if (parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_NO_ANSWER }));
    });

    useMessageEvent<GenericErrorEvent>(GenericErrorEvent, event => {
        const parser = event.getParser();
        if (parser.errorCode !== -100002) return;  // door-only error code
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_WRONG_PASSWORD }));
    });

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event => {
        const parser = event.getParser();
        // ONLY handle the roomForward branch with door modes
        if (!parser.roomForward) return;
        if (parser.data.ownerName === GetSessionDataManager().userName) return;
        if (parser.isGroupMember) return;
        if (parser.data.doorMode === RoomDataParser.DOORBELL_STATE) {
            setSnapshot({ roomInfo: parser.data, state: DoorStateType.START_DOORBELL });
        } else if (parser.data.doorMode === RoomDataParser.PASSWORD_STATE) {
            setSnapshot({ roomInfo: parser.data, state: DoorStateType.START_PASSWORD });
        }
    });

    const reset = useCallback(() => setSnapshot(INITIAL), []);

    return { snapshot, setSnapshot, reset };
};

export const useDoorState = () => useBetween(useDoorStateStore);
```

The current `NavigatorDoorStateView.tsx` does
`setDoorData({ roomInfo: null, state: DoorStateType.NONE })` to reset
— after P1 it calls `reset()`.

## 4. Consumer migration map (13 files)

| File | Reads today | Reads after P1 |
|---|---|---|
| `NavigatorView.tsx` | full `useNavigator()` + 9 local useState | `useNavigatorData` + `useNavigatorActions` + `useNavigatorUiStore` (one selector per flag) |
| `NavigatorDoorStateView.tsx` | `doorData`, `setDoorData` | `useDoorState` (`snapshot`, `setSnapshot`, `reset`) |
| `NavigatorRoomCreatorView.tsx` | `categories` | `useNavigatorData` |
| `NavigatorRoomInfoView.tsx` | `navigatorData`, `favouriteRoomIds` | `useNavigatorData` |
| `NavigatorRoomLinkView.tsx` | `navigatorData.enteredGuestRoom` | `useNavigatorData` |
| `NavigatorRoomSettingsBasicTabView.tsx` | `categories` | `useNavigatorData` |
| `NavigatorSearchResultItemView.tsx` | `favouriteRoomIds`, `navigatorData` | `useNavigatorData` |
| `NavigatorSearchResultItemInfoView.tsx` | `navigatorData` | `useNavigatorData` |
| `NavigatorSearchResultView.tsx` | `topLevelContext` | `useNavigatorData` |
| `NavigatorSearchView.tsx` | `topLevelContext` + `sendSearch` prop | `useNavigatorData` + `useNavigatorActions` |
| `CatalogLayoutRoomAdsView.tsx` | `navigatorData.currentRoomId` | `useNavigatorData` |
| `RoomFilterWordsWidgetView.tsx` | `navigatorData.currentRoomId` | `useNavigatorData` |
| `RoomToolsWidgetView.tsx` | `navigatorData` | `useNavigatorData` |

All 13 consumers get a one-line import swap (plus `NavigatorView`
which is more involved since it owns the 9 useState + linkTracker
dispatch + `sendSearch` prop drilling that all go away). No
behavioural change.

## 5. Dual-subscription edge cases

### 5.1 `useBetween` guarantee

`useDoorState` uses `useBetween(useDoorStateStore)`, so multiple
consumers (currently only `NavigatorDoorStateView`) share a single
listener registration — same as how `useNavigatorStore` works.

### 5.2 `GetGuestRoomResultEvent` — dual subscription

Today this event is handled in one place (current `useNavigator.ts`
lines 130-209) with three branches: `roomEnter`, `roomForward`, else.
After P1:

- `useDoorStateStore` subscribes and acts ONLY on the `roomForward`
  branch when `doorMode` is `DOORBELL_STATE` or `PASSWORD_STATE` AND
  the user is not the owner / not a group member.
- `useNavigatorStore` subscribes and handles `roomEnter`, the
  `roomForward` branch WITHOUT door modes (direct `CreateRoomSession`
  call), and the `else` branch.

Multiple subscribers to the same event is an accepted pattern (see
`FlatCreatedEvent` listened in `useNavigator` and elsewhere). Both
listeners register through `useMessageEvent` so the renderer event
bus dispatches to both.

### 5.3 `GenericErrorEvent` — dual subscription

- `useDoorStateStore` acts ONLY on `errorCode === -100002` (wrong
  password).
- `useNavigatorStore` acts on `4009`, `4010`, `4011`, `4013` (room
  management alerts via `simpleAlert`).

Each side filters by `errorCode` immediately — no cross-effects.

## 6. Visual direction (anchor for P4 — informational only)

P1 ships zero visual change. This section documents the visual
target that P4's spec will detail, so the architecture choices in
P1 align with where we are heading.

### 6.1 Current pain points (from user screenshots, 2026-05-26)

- **Tab "Pubbliche":** empty state is bare text "No rooms found".
- **Tab "Tutte le stanze":** popular rooms shown as a small thumbnail
  grid; the "Party" category uses a compact list mode with no
  visual hierarchy or live signal.
- **Tab "Eventi":** empty state is bare text "No rooms found".
- **Tab "Il mio mondo":** sparse list, no per-room preview.
- **Saved searches:** today a 600px-wide sidebar that resizes the
  card and pushes content right.
- **Filter dropdown "Qualsiasi":** opaque about what filters exist.

### 6.2 Target shape (P4 spec will detail)

**Empty states with illustration + contextual CTA:**

```
┌─────────────────────────────────────┐
│  Navigator @ Habbo              [×] │
│ [⚡][Pubbliche][Tutte][Eventi][Mio] │
├─────────────────────────────────────┤
│ [🔓 Aperte] [🚪 Campanello] [🔒]    │
│ [filtra stanze...] 🔍               │
│ [🔖 staff] [🔖 party] [🔖 chill] +  │
├─────────────────────────────────────┤
│         ╭──────────╮                │
│         │   🏠 ✨   │                │
│         ╰──────────╯                │
│   Nessuna stanza pubblica           │
│   ancora attiva                     │
│                                     │
│   [ Esplora stanze popolari → ]     │
├─────────────────────────────────────┤
│  [+ Crea stanza] [Da qualche parte] │
└─────────────────────────────────────┘
```

**Card list with row-level hover-reveal:**

```
▼ Stanze più popolari            [▦ ☰] [⚡]
┌─────────┐ Big Party Room
│ 🏠 🎵   │ 👤 22 · 🔓 Aperta · ★ 4.7
│  (img)  │ by @Cocco
└─────────┘ [Entra] [ⓘ] [☆ favori]    ← shown on row hover
─────────────────────────────────────────
▼ Party                         [▦ ☰] [⚡]
🟢 fcfcvcvcv         👤2 🔓     [ⓘ]
🔒 aaaaa             👤1 🚪     [ⓘ]
```

**Saved searches as horizontal chip row** above the filter input
(replaces the 600px sidebar — no layout shift on toggle).

**Filter intent as visible chips** instead of "Qualsiasi" dropdown:
`🔓 Aperte` `🚪 Campanello` `🔒 Con password` `👥 Solo amici`.

**Sticky section headers** when scrolling long lists.

**Skeleton loaders** during fetch (post-P2 when query state lands).

**Per-card actions on hover**: favourite ☆, info ⓘ, room link 🔗.

### 6.3 Why P1 architecture supports this

- `useNavigatorUiStore` makes future flags (`viewMode: 'compact' | 'expanded'`,
  `lastTab`, `lastScrollTop`) trivial to add — they're new state on
  the store; persistence can be added with a Zustand `persist`
  middleware on a single line.
- Splitting `useDoorState` out means the visual rework of the door
  prompt (a separate panel, possibly modal) can evolve independently
  of Navigator search UI.
- Three flat filters mean a new card variant (compact-vs-expanded
  list) reads `useNavigatorData` only — no risk of re-rendering the
  whole Navigator when card-mode toggles.

## 7. Testing strategy

Coherent with `CLAUDE.md` "`yarn test` must stay green on every
commit":

| Suite | New / changed | Cases (target) |
|---|---|---|
| `navigatorUiStore.test.ts` | NEW | ~30: each action idempotent on no-op, transitions valid, `requestSearch`/`consumeSearchRequest` symmetric |
| `useDoorState.test.tsx` | NEW | ~12: each event listener happy path + filter-by-userName + filter-by-errorCode + reset() |
| `useNavigatorStore.test.tsx` | NEW (smoke) | ~5: 3 filters return expected shape, dispatch updates propagate to `useNavigatorData`, GenericError 4010 does NOT touch door state, GenericError -100002 DOES touch door state |
| Existing Vitest suites | Stay green | — |

All tests co-located under `src/`, alongside their subject. Reuse
`src/nitro-renderer.mock.ts` for event dispatching (the
`mockEventDispatcher` / `clearMockEventDispatcher` helpers).

CI gates that must stay green: `yarn typecheck` (TS 7 native),
`yarn test`, `yarn lint:hooks` (`react-hooks/rules-of-hooks: error`).

## 8. Compatibility with project conventions

`feat/navigator-modernization` is forked from `origin/Dev` @ `d5d5ca59`,
so it carries everything upstream has shipped through the floorplan
editor work + classic catalog view + emustats + housekeeping panel.
The design respects every constraint of this base:

- **No new dependencies.** Uses `zustand` (present), `use-between`
  (present), `vitest` (present), `createNitroStore` (present at
  `src/state/createNitroStore.ts`).
- **React 19 idioms** identical to the rest of the codebase. No
  manual `useMemo`/`useCallback` unless the React Compiler asks for
  them.
- **TypeScript strict** consistent with the rest of the project.
- **Co-located tests** under `src/` per the layout convention.
- **No conflicts with adopted patterns**: `useNitroEvent`,
  `useMessageEvent`, `useBetween`, `createNitroStore`. The new
  filters expose plain data — they don't call snapshot hooks
  (`useSyncExternalStore`) inside `useBetween` scopes, so the
  documented "snapshot-outside-useBetween" constraint never
  triggers here.
- **Commit author** per house rules: `simoleo89
  <simoleo89@users.noreply.github.com>` via per-command `-c`
  overrides. **No Co-Authored-By trailer.**
- **Branch policy**: fresh branch off `origin/Dev`, pushable
  fast-forward to `simoleo/feat/navigator-modernization` (which
  doesn't yet exist on the fork — first push creates it). No
  force-push required.

## 9. Out of scope (explicit)

- TanStack Query migration of search (P2).
- Reactive favourite icons via snapshot (P3).
- Live user counts via snapshot (P3).
- Virtualization of result list (P4).
- Empty-state component (P4).
- Saved-search chip row (P4).
- Persistence of tab/scroll/filter (P4).
- `useActionState` on search input (P6).
- `WidgetErrorBoundary` wrapping of Navigator sub-views (P5 —
  independent, can land in parallel).
- Any visual change. P1 ships byte-identical UI.
- Any change to `NavigatorRoomSettings*` subtree (self-contained,
  only reads `categories` in one tab).

## 10. Acceptance criteria

P1 is complete when:

1. `src/hooks/navigator/useNavigator.ts` does NOT exist (god-hook
   removed).
2. `src/hooks/navigator/` contains `useNavigatorStore.ts`,
   `useNavigatorData.ts`, `useNavigatorUiState.ts`,
   `useNavigatorActions.ts`, `navigatorUiStore.ts`, and an updated
   `index.ts`.
3. `src/hooks/rooms/widgets/useDoorState.ts` exists.
4. All 13 active consumers compile after their import swap.
5. `yarn typecheck` clean.
6. `yarn lint:hooks` clean.
7. `yarn test --run` green, with at least 3 new suites
   (`navigatorUiStore`, `useDoorState`, `useNavigatorStore` smoke).
8. Manual smoke test: open Navigator, switch each top-level tab, run
   a search, open a room with a doorbell, get rejected, open a room
   with a password, enter the right password, enter wrong password,
   open a room you own, click a favourite ☆, open RoomInfo, open
   RoomLink. Each path renders identically to pre-P1 behaviour.
9. Branch `feat/navigator-modernization` pushed (fast-forward only)
   to `simoleo/feat/navigator-modernization` on the user's fork.

## 11. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| A consumer reads a field we forgot to expose on a filter | medium | Type-checker catches it — all 13 consumers re-typecheck on swap |
| Dual-subscription on `GetGuestRoomResultEvent` causes double `CreateRoomSession` | low | `useDoorStateStore` only acts on doorMode bell/password; `useNavigatorStore` only acts on the other branches. Explicit `if` guards on both sides |
| `linkTracker` re-registration leaks because deps changed | low | New tracker reads `useNavigatorUiStore.getState()` instead of closure-captured state, so its `useEffect` deps shrink |
| `useDoorState` consumer in `NavigatorDoorStateView` regresses on `reset()` semantics | low | Smoke test in §10 covers this |
| Per-key Zustand selectors in `useNavigatorUiState` cause stale-closure issues | low | Each selector is one-shot, no derived values; identical pattern to existing Zustand stores in the codebase |
| Renderer SDK mismatch on local dev (e.g. floorplan-live-preview not in renderer's main) | medium | Already exists today regardless of this PR; surface in plan as a `yarn typecheck` caveat, not introduced by P1 |
