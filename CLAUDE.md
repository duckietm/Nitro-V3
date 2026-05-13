# Claude Code — project memory for Nitro-V3

This file is read automatically by Claude Code at session start. It captures
the conventions and current state of this branch so a new session can hit
the ground running.

## TL;DR

This branch — **`feat/react19-modernization`** — is a long-running modernization
of the Nitro V3 client: bump to React 19.2 idioms, add the supporting
infrastructure (TanStack Query, Zustand, Vitest, React Compiler, error
boundaries), split a few god-hooks, and audit logic bugs along the way.
PR is **#2** on `simoleo89/Nitro-V3`.

On top of the modernization work this branch also picks up a couple of
upstream feature commits that lived only on `duckietm/Nitro-V3` (PR #126):
reset password / email / change username under user settings, and the
wear-badge popup fix.

Local-dev game assets are served by a small Vite plugin (`sirv` middleware
mounted on `/nitro-assets` and `/swf`, reading from
`E:\Users\simol\Desktop\DEV\Nitro-Files`) — NOT by symlinking inside
`public/`. The symlink path triggers chokidar on ~177k files and the dev
server hangs for minutes on Windows. See `vite.config.mjs` and the
`.gitignore` note.

Detailed status, decisions, and next steps live in **`docs/ARCHITECTURE.md`** —
read that before starting anything non-trivial.

## Commands

| Goal | Command |
|---|---|
| Dev server | `yarn start` |
| Production build | `yarn build` |
| Serve production build | `yarn preview` (defaults to http://localhost:4173) |
| Lint | `yarn eslint` |
| Type-check (TS 7 native, fast) | `yarn typecheck` |
| Test (Vitest, once) | `yarn test` |
| Test (watch) | `yarn test:watch` |

## Setup walkthrough

1. **Clone the renderer SDK as a sibling of this repo.**
   `vite.config.mjs` resolves the `@nitrots/*` aliases against
   `../Nitro_Render_V3` (preferred) or `../renderer` (legacy). If neither
   exists, the dev server and build now fail fast with a message
   pointing here.

   ```sh
   cd ..                            # parent of Nitro-V3
   git clone <renderer-repo> Nitro_Render_V3
   cd Nitro_Render_V3 && yarn install
   ```

2. **Install client deps.**
   ```sh
   cd ../Nitro-V3
   yarn install
   ```

3. **Materialize the runtime configuration.** `public/configuration/`
   ships `.example` files. Copy the ones you need without the `.example`
   suffix and point them at your game server (websocket URL, asset
   base URL, UI texts, etc.). The dev server doesn't fail if these are
   missing but the client renders a blank/error screen at runtime.

4. **Run.**
   - Dev: `yarn start` (Vite, HMR, includes the renderer source).
   - Production preview: `yarn build && yarn preview`.

The renderer SDK (`@nitrots/nitro-renderer`) is consumed via a filesystem
link to a sibling working tree — `../Nitro_Render_V3` (preferred) or
`../renderer` (legacy). Without it, `yarn typecheck` reports TS2307 across
the codebase — that's expected on a sandbox without the renderer, not a
regression.

## Stack snapshot

- React 19.2.5, `react-dom` 19.2.5, `@types/react` 19.2.x.
- TypeScript: TS 6 for build, **TS 7 native preview** (`@typescript/native-preview`,
  invoked via `tsgo`) for the `typecheck` script.
- Vite 8 + `@vitejs/plugin-react` 6 + `babel-plugin-react-compiler` 1.0.
- ESLint 10 + `typescript-eslint` 8 + `eslint-plugin-react-hooks@7` +
  `eslint-plugin-react-compiler`.
- TanStack Query 5 (`@tanstack/react-query` + devtools).
- Zustand 5.
- Vitest 3 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`.
- `react-error-boundary` 6.

## Layout convention (DO NOT CHANGE)

Established by the team and recorded in `docs/ARCHITECTURE.md` proposal #3
(rejected the `src/features/` alternative). Stay on this layout — every PR
that violates it will need to be reworked.

```
src/components/<area>/<feature>/         → views (.tsx only)
  e.g. src/components/room/widgets/doorbell/DoorbellWidgetView.tsx

src/hooks/<area>/<feature?>/             → hooks, FLAT files, no per-feature subfolder
  e.g. src/hooks/rooms/widgets/useDoorbellState.ts
       src/hooks/rooms/widgets/useDoorbellActions.ts
       src/hooks/rooms/widgets/useDoorbellWidget.ts (deprecated shim)

src/api/                                 → cross-cutting helpers (LocalizeText, composers, formatters)
src/common/                              → reusable UI primitives + error boundary
src/state/                               → Zustand stores (cross-feature only)
tests/                                   → Vitest suites (mirror filename of subject)
```

When splitting a god-hook the convention is **3 files, all flat in the
hooks barrel directory**:

- `use<Feature>State.ts` — state + event subscriptions + derived values
- `use<Feature>Actions.ts` — pure imperative actions (no state writes)
- `use<Feature>Widget.ts` — deprecated wrapper that composes the two and
  preserves the old return shape so existing consumers don't break

See `useDoorbellState`/`useDoorbellActions`/`useDoorbellWidget` as the
canonical pattern.

## Patterns to use

### `useNitroEventState` / `useMessageEventState`

For "derived state from a single event" replace the two-step
`useState + useNitroEvent(e => setState(...))` with a single call:

```ts
const foo = useNitroEventState(SomeEvent, e => e.payload, initial);
const data = useMessageEventState(SomeParser, e => e.getParser()?.field ?? null, null);
```

The selector is held in a `useLayoutEffect`-refreshed ref so the listener
stays registered across renders. Both hooks are exported from
`src/hooks/events`.

### `useNitroQuery`

For composer/parser request-response pairs:

```ts
const { data } = useNitroQuery<SomeParser, SomeData>({
    key: ['nitro', 'domain', 'request', ...args],
    request: () => new SomeComposer(args),
    parser: SomeParser,
    select: e => e.getParser()?.data,
    accept: e => e.getParser()?.correlationKey === args, // optional, for shared event bus
    staleTime: 60_000,
});
```

Already wired up; `QueryClientProvider` is mounted in `src/index.tsx`.

Companion `useNitroEventInvalidator(eventType, queryKey, accept?)` —
import from `src/api/nitro-query`. Subscribes to the renderer event
and invalidates the query slot on every push, so server-driven
refresh paths work the same as the initial request/response (e.g.
ClubGiftInfoEvent firing again after the user claims a gift).

### Singleton-filter split for `useBetween`-based hooks

When a hook backs many consumers but most only need either state OR
actions (not both), split it without breaking the shared-singleton
guarantee:

```ts
// internal: state + actions in one closure
const useFooStore = () => {
    const [ data, setData ] = useState(...);
    // listeners, effects, actions ...
    return { data, doThing };
};

// public: read-only filter
export const useFooState = () => {
    const { data } = useBetween(useFooStore);
    return { data };
};

// public: imperative filter
export const useFooActions = () => {
    const { doThing } = useBetween(useFooStore);
    return { doThing };
};

// deprecated shim — keeps the historical return shape
export const useFoo = () => useBetween(useFooStore);
```

`useBetween` ensures all three entry points hit the same store
instance, so listeners/effects register once. Used by `useWiredTools`,
`useTranslation`, `useNotification`, `useFriends`.

### Zustand stores

For cross-feature UI state (avoid module-level `let`):

```ts
import { createNitroStore } from '@/state/createNitroStore';

export const useFooStore = createNitroStore<FooState>()((set) => ({
    ...
}));
```

Components subscribe to slices, not the whole store:

```ts
const value = useFooStore(s => s.value);
```

First adoption: `src/components/navigator/views/navigatorRoomCreatorStore.ts`.

### `WidgetErrorBoundary`

Wrap any in-room widget tree so a crash degrades gracefully (logs to
NitroLogger, falls back to `null`). Already applied at `RoomWidgetsView`
as an umbrella; per-widget wrapping is a follow-up.

```tsx
<WidgetErrorBoundary name="ChatWidget">
    <ChatWidgetView />
</WidgetErrorBoundary>
```

### Form Actions

Login / Register / Forgot in `src/components/login/LoginView.tsx` use
`useActionState` + `useFormStatus`. The legacy non-Action versions in
`src/components/login/components/{Register,Forgot}Dialog.tsx` and
`shared.ts` have been **removed** (dead code).

### Configuration pre-init in bootstrap

`src/bootstrap.ts` calls `await GetConfiguration().init()` **before**
importing `./index`. Otherwise the first paint dumps a flood of
"Missing configuration key" warnings while components synchronously
read `asset.url`, `login.endpoint`, … against an empty store before
`prepare()`'s deferred init lands.

### Asset serving in dev

Game assets (`bundled/`, `c_images/`, `gamedata/`, `swf/...`) are NOT
copied or symlinked under `public/`. They're served by a custom Vite
plugin (`nitroAssetsServer` in `vite.config.mjs`) that mounts `sirv`
on `/nitro-assets` and `/swf`, reading from
`E:\Users\simol\Desktop\DEV\Nitro-Files\`. sirv is a connect-style
middleware that bypasses chokidar entirely, so the ~177k asset files
never enter the watch graph. The plugin also wires the same handler
into `configurePreviewServer` so `yarn preview` keeps working.

## What's wired up and what isn't

| Adopted | Pilot sites |
|---|---|
| `useNitroEventState` + companions (Reducer, ExternalSnapshot) | `OfferView`, `useAvatarInfoWidget` (figure/badges/group reducer), `useInventoryFurni` (pure reducers + fragments useRef) |
| `useNitroQuery` + `useNitroEventInvalidator` | `OfferView`, `CatalogLayoutRoomAdsView`, `ModToolsChatlogView`, `CfhChatlogView`, `useGiftConfiguration`, `useUserGroups`, `useClubOffers(windowId)`, `useSellablePetPalette(breed)`, `useMarketplaceConfiguration`, `useClubGifts` (with invalidator) |
| Zustand | `NavigatorRoomCreatorView` (`useRoomCreatorStore`) |
| God-hook split (state + actions + shim) | `doorbell`, `poll`, `furni-chooser`, `user-chooser`, `friend-request`, `chat-input` |
| God-hook split (`useBetween` singleton + state filter + actions filter + shim) | `wired-tools`, `translation`, `notification`, `friends`, `catalog` (three-way: `useCatalogData` / `useCatalogUiState` / `useCatalogActions`, plus the `useCatalog` shim) |
| `WidgetErrorBoundary` | `RoomWidgetsView` umbrella |
| Vitest | 163/163 cases — pure helpers + Zustand store + 2 component-/hook-level pilots (WidgetErrorBoundary, useDoorbellState) on top of the renderer-SDK mock at `tests/mocks/renderer-mock.ts`, 34 cases on the catalog pure helpers, 5 contract cases on the catalog filters |
| Form Actions | Login / Register / Forgot (LoginView.tsx) |
| Cherry-picked from `duckietm` PR #126 | `UserAccountSettingsView` (reset password / email / username under user settings), plus the wear-badge popup `canShowWearButton` gating |

| Not yet | Notes |
|---|---|
| Migrate the 48 `useCatalog()` consumers to the new filters | The split is done: pure helpers in `useCatalog.helpers.ts`, three filters (`useCatalogData` / `useCatalogUiState` / `useCatalogActions`) plus the deprecated `useCatalog` shim. Three pilot consumers already migrated (`CatalogBuildersClubStatusView`, `CatalogBreadcrumbView`, `CatalogNavigationItemView`). The remaining 45 still hit the shim — incremental work, each migration is mechanical: split the destructure into 2-3 filter calls based on which keys are read. |
| Split `useChatWidget` / `useAvatarInfoWidget` | Both state-driven via events with no clean imperative actions to extract — skip-motivated. Already touched today for the InfoStand listener move. |
| Split `usePetPackageWidget` / `useWordQuizWidget` / `useChatCommandSelector` | Their "actions" mutate internal state or are tightly interdependent — skip-motivated. |
| Hoist Wired Creator Tools shared state to a Zustand slice | Would remove ~25 props passed to the 3 tab sub-components. (Wired-tools split done as singleton-filter; Zustand slice is the next step.) |
| Widen the component / hook test coverage | Mock layer is in place (`tests/mocks/renderer-mock.ts`) and the first 2 pilots pass. Good follow-up targets: other `*State` hooks built on event reducers, `LoginView` Form Actions happy/error paths, OfferView with `useNitroQuery`. |

## Known open logic bugs

Read `docs/ARCHITECTURE.md` "Known logic bugs" section. The two still-open
ones:

- `MainView.tsx:47-48` — race between `RoomSessionEvent.CREATED` and `ENDED`
  (no session token guard).
- `LayoutFurniImageView` / `LayoutAvatarImageView` — async fetch race when
  props change twice in quick succession.

Fix shapes documented; both are reasonable PRs on their own.

## House rules

- **Commit author**: `simoleo89 <simoleo89@users.noreply.github.com>`.
  When committing, pass these via per-command overrides
  (`git -c user.name=simoleo89 -c user.email=...`) — do NOT modify the
  global git config.
- **No `claude/...` branch names** — auto-generated names should be
  renamed before pushing. Prefer `feat/<description>`.
- **Never merge a branch that violates the layout convention** above.
  The `feat/react19-hooks-adapter` branch (deleted) put hooks under
  `src/components/...`; that's wrong and a recurring temptation.
- **Skip-motivated god-hook splits are fine** — when a hook's actions
  mutate internal state, document the reason in the commit message and
  move on rather than forcing a bad split.
- **`yarn test` must stay green** on every commit. Currently 113/113.
- **Lint baseline**: don't regress. Some pre-existing errors (`FC<{}>`,
  `IMessageEvent | undefined` redundant union in the local sandbox where
  the renderer SDK isn't installed) are out of scope here.

## Where everything lives

- Architecture doc: `docs/ARCHITECTURE.md`
- Test runner config: `vitest.config.mts` (separate from `vite.config.mjs`)
- Test setup: `tests/setup.ts`
- React Query adapter: `src/api/nitro-query/createNitroQuery.ts`
- Zustand factory: `src/state/createNitroStore.ts`
- Error boundary: `src/common/error-boundary/WidgetErrorBoundary.tsx`
- Event hooks (`useNitroEvent`, `useMessageEvent`, `useNitroEventState`,
  `useMessageEventState`): `src/hooks/events/`
- Wired-tools split (types/constants/helpers + 3 tab views):
  `src/components/wired-tools/`
- User account settings (cherry-picked from upstream PR #126):
  `src/components/user-settings/UserAccountSettingsView.tsx`
- Access-token persistence helper (used by login + remember + rotate):
  `src/api/auth/accessToken.ts` (`persistAccessTokenFromPayload`)
- Asset middleware: `nitroAssetsServer()` in `vite.config.mjs`
- Configuration pre-init: `src/bootstrap.ts` (`await GetConfiguration().init()`
  before `import('./index')`)
- Catalog pure helpers: `src/hooks/catalog/useCatalog.helpers.ts`
  (`buildCatalogNodeTree`, `findNodeById` / `findNodeByName`,
  `getNodesByOfferIdFromMap`, `getOfferProductKeys`,
  `normalizeCatalogType`, `resolveBuilderFurniPlaceableStatus`)
- Catalog three-way filter split: `useCatalogData` /
  `useCatalogUiState` / `useCatalogActions` (with the deprecated
  `useCatalog` shim) in `src/hooks/catalog/useCatalog.ts`
- Renderer-SDK mock for Vitest: `tests/mocks/renderer-mock.ts`
  (aliased over `@nitrots/nitro-renderer` via `vitest.config.mts`).
  Hosts the explicit `NitroLogger` mock, the `mockEventDispatcher` /
  `clearMockEventDispatcher` helpers used by hook tests, the
  `RoomSessionDoorbellEvent` stub, and a long list of placeholder
  classes/enums kept around just so the `src/api/*` barrel cascade
  imports without throwing. **Grow this file when a new test needs a
  symbol; prefer real deterministic stubs over `vi.fn()`.**
