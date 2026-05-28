# Navigator Modernization — P2: TanStack Query for Search

**Branch**: `feat/navigator-p2-query` (forked from `feat/navigator-modernization` @ `1148c0a6`)
**Date**: 2026-05-27
**Depends on**: P1 (hook split) — merged or pending merge

## 1. Goal

Migrate Navigator's search request/response from event-driven imperative state to TanStack Query. The user gets:
- **Instant tab switching** when the same tab/filter was visited before in the session (cache hit, no round-trip)
- **Stale-while-revalidate** on revisit (shows cached results while refetching in background)
- **Server-driven refresh** via `useNitroEventInvalidator` on `FlatCreatedEvent` and `RoomSettingsUpdatedEvent` (and possibly `FavouriteChangedEvent` if the active tab is `favorites_view`)
- **Single source of truth** for `isFetching` — no separate `isLoading` flag to manage

## 2. Architecture changes

### 2.1 New file: `src/hooks/navigator/useNavigatorSearch.ts`

The query hook. Reads `currentTabCode` + `currentFilter` from `navigatorUiStore`, fires `NavigatorSearchComposer`, waits for `NavigatorSearchEvent`, returns the parsed `NavigatorSearchResultSet`.

```ts
import { NavigatorSearchComposer, NavigatorSearchEvent, NavigatorSearchResultSet } from '@nitrots/nitro-renderer';
import { useNitroEventInvalidator, useNitroQuery } from '../../api/nitro-query';
import { useNavigatorUiStore } from './navigatorUiStore';

export const useNavigatorSearch = () =>
{
    const tabCode = useNavigatorUiStore(s => s.currentTabCode);
    const filter = useNavigatorUiStore(s => s.currentFilter);

    const query = useNitroQuery<typeof NavigatorSearchEvent, NavigatorSearchResultSet>({
        key: [ 'navigator', 'search', tabCode, filter ],
        request: () => new NavigatorSearchComposer(tabCode, filter),
        parser: NavigatorSearchEvent,
        select: e => e.getParser()?.result ?? null,
        accept: e => {
            const result = e.getParser()?.result;
            // accept-filter: only this query's matching tab code
            return !!result && result.code === tabCode;
        },
        enabled: !!tabCode,
        staleTime: 30_000   // re-fetch after 30s of staleness on revisit
    });

    useNitroEventInvalidator(FlatCreatedEvent, [ 'navigator', 'search' ]);
    useNitroEventInvalidator(RoomSettingsUpdatedEvent, [ 'navigator', 'search' ]);

    return {
        searchResult: query.data,
        isFetching: query.isFetching,
        refetch: query.refetch
    };
};
```

### 2.2 `navigatorUiStore.ts` additions

Add 2 new state fields + 2 new actions:

```ts
type NavigatorUiState = {
    // ...existing 9 flags...
    currentTabCode: string;   // '' until NavigatorMetadataEvent arrives, then first top-level context code
    currentFilter: string;    // '' by default
};

type NavigatorUiActions = {
    // ...existing 15 actions...
    setTab(code: string): void;        // also clears currentFilter
    setFilter(value: string): void;
};
```

`setTab(code)` resets `currentFilter` to `''` because switching tabs starts a fresh search. `setFilter` updates only the filter — the user is typing in the same tab.

### 2.3 `useNavigatorStore.ts` — remove search state ownership

Remove:
- `useState<NavigatorSearchResultSet>(null)` for `searchResult`
- `useMessageEvent<NavigatorSearchEvent>` listener
- `sendSearch` and `reloadCurrentSearch` actions
- The `useNavigatorUiStore.getState().setLoading(...)` calls (no longer needed)
- The `topLevelContextRef` and `searchResultRef` (only consumed inside `reloadCurrentSearch`)

Keep:
- `topLevelContext` + `topLevelContexts` (these still come from `NavigatorMetadataEvent` and drive the tab list)
- The `NavigatorMetadataEvent` listener — but it now ALSO calls `useNavigatorUiStore.getState().setTab(parser.topLevelContexts[0]?.code ?? '')` on first arrival, to seed the initial tab. The query then activates because `currentTabCode` becomes non-empty (`enabled: !!tabCode`).

### 2.4 `useNavigatorData.ts` — remove `searchResult` from return shape

`useNavigatorData()` no longer returns `searchResult`. Consumers that need it call `useNavigatorSearch()` instead.

### 2.5 `useNavigatorActions.ts` — empty or removed

Both `sendSearch` and `reloadCurrentSearch` are gone. Either:
- Remove the file + the export — consumers use `useNavigatorUiStore.getState().setTab(...)` / `setFilter(...)` directly
- Or keep the file as an empty re-export for forward compat. (Decision: REMOVE — minimize dead API).

### 2.6 `useNavigatorUiState.ts` — add the 2 new flags

Add `currentTabCode` and `currentFilter` to the per-key selector list and return shape.

### 2.7 `useNavigatorSearch.test.tsx` — new

Test cases:
- Initial mount with empty tabCode → query is disabled, no request fired
- After `setTab('public')` → query fires NavigatorSearchComposer('public', '')
- After `setFilter('cocco')` → query fires NavigatorSearchComposer('public', 'cocco')
- After `setTab('events')` → currentFilter resets to '', query fires NavigatorSearchComposer('events', '')
- `FlatCreatedEvent` invalidates the cache → refetch
- `RoomSettingsUpdatedEvent` invalidates the cache → refetch
- `NavigatorSearchEvent` with WRONG tabCode (e.g. server pushes an unsolicited result) is REJECTED by `accept` filter — does NOT update query data

### 2.8 `NavigatorView.tsx` — major rewrite

Replace:
- `useNavigatorActions` import → gone
- `useNavigatorData` no longer destructures `searchResult` — get it from `useNavigatorSearch` instead
- 4 `useEffect` blocks driving the imperative search flow (`needsSearch`, `needsInit` lifecycle, `reloadCurrentSearch` orchestration) → gone
- Tab `onClick={ () => sendSearch('', context.code) }` → `onClick={ () => useNavigatorUiStore.getState().setTab(context.code) }`
- `isLoading` from `useNavigatorUiState()` → `isFetching` from `useNavigatorSearch()` query
- `NavigatorInitComposer` initial dispatch on first `isVisible` — KEEP (still need it to get `topLevelContexts` populated)
- `pendingSearch` ref — gone (linkTracker `case 'search'` directly does `setTab(code); setFilter(value)`)

Major simplification: the file shrinks ~30 lines.

### 2.9 `NavigatorSearchView.tsx` — drive setFilter

Read the file. The component currently exposes a search input that, on enter or button click, calls `sendSearch(value, currentTabCode)`. After P2 it:
- Reads `currentFilter` from `useNavigatorUiState`
- onChange → `useNavigatorUiStore.getState().setFilter(value)` (debounced 300ms)
- No more `sendSearch` reference

Debounce: use a local `useState` for the input text + a `useEffect` that calls `setFilter(text)` 300ms after the last keystroke. Standard pattern.

## 3. Backward-compat considerations

- `useNavigatorActions.sendSearch` and `useNavigatorActions.reloadCurrentSearch` are REMOVED. No consumer outside Navigator depends on them — verified by grepping the previous P1 consumer migration.
- `useNavigatorData.searchResult` is REMOVED. Only `NavigatorView` reads it currently — easy to migrate.
- The `useNavigatorActions` filter itself becomes empty — consider whether to delete the file entirely. **Decision: delete the file** to minimize the API surface. Tasks 5-8 of P1 migrated `NavigatorSearchView` to use `useNavigatorActions` — that's the only consumer; it migrates to `useNavigatorUiStore` directly.

## 4. Out of scope (each gets its own future spec)

- Reactive favourite stars on cards (P3)
- Visual rework: empty states, virtualization, chip-based UI (P4)
- Form Action on search input (P6)

## 5. Acceptance criteria

P2 is complete when:

1. `src/hooks/navigator/useNavigatorSearch.ts` exists and exports `useNavigatorSearch`
2. `useNavigatorStore.ts` no longer owns `searchResult`, no longer subscribes to `NavigatorSearchEvent`, no longer exposes `sendSearch` or `reloadCurrentSearch`
3. `navigatorUiStore.ts` has `currentTabCode` + `currentFilter` state and `setTab` + `setFilter` actions
4. `useNavigatorActions.ts` is deleted; barrel no longer exports `useNavigatorActions`
5. `useNavigatorData.ts` no longer returns `searchResult`
6. `useNavigatorUiState.ts` returns `currentTabCode` + `currentFilter`
7. `NavigatorView.tsx` reads `searchResult` from `useNavigatorSearch()`, uses `isFetching` for the loading flag, calls `setTab` on tab clicks
8. `NavigatorSearchView.tsx` debounces `setFilter` calls
9. `yarn typecheck` clean (same pre-existing floorplan errors)
10. `yarn test --run` green; smoke test updated; new `useNavigatorSearch.test.tsx` with 7 cases
11. `yarn lint:hooks` clean
12. Manual smoke: switch tabs rapidly → results cached, no flicker. Type filter → debounced refetch. Create a room → list refreshes.

## 6. Risk register

| Risk | Mitigation |
|---|---|
| `NavigatorSearchEvent` arrives unsolicited (server-side push) — query wouldn't update | The `accept` filter checks the result's code matches the current tabCode, so only matching events update the query. Unsolicited results to a non-active tab are ignored (acceptable — when the user switches to that tab, the cache is empty and a fresh query fires). |
| Removing `useNavigatorActions` breaks an import we missed | Type-checker catches it. The P1 grep showed only Navigator-internal consumers use it. |
| Removing the `isLoading`/`isReady`/`needsInit`/`needsSearch` flags from `navigatorUiStore` (they're now derivable from query state) — too aggressive? | KEEP them in P2. Only `searchResult` ownership moves. Future cleanup can remove the obsolete lifecycle flags once we're sure nothing reads them. |
| Debounce timing on search input | 300ms is standard; if it feels laggy the user can lower it later — pure UX tune |

## 7. Plan (executable)

### Task 1: Add UI store state + actions (TDD)

**Files**: `src/hooks/navigator/navigatorUiStore.ts`, `src/hooks/navigator/navigatorUiStore.test.ts`

- [ ] Add `currentTabCode: string` (initial `''`) and `currentFilter: string` (initial `''`) to `NavigatorUiState`
- [ ] Add `setTab(code: string): void` and `setFilter(value: string): void` to `NavigatorUiActions`
- [ ] `setTab(code)` sets `{ currentTabCode: code, currentFilter: '' }` (atomic reset on tab change)
- [ ] `setFilter(value)` sets `{ currentFilter: value }` (no tab side-effect)
- [ ] Update test file: 3 new cases — `setTab` updates tab and resets filter; `setFilter` updates filter without touching tab; idempotent `setTab` on same code resets filter to '' regardless
- [ ] `yarn test --run src/hooks/navigator/navigatorUiStore.test.ts` → green
- [ ] Commit: `feat(navigator): add currentTabCode + currentFilter to UI store (P2 prep)`

### Task 2: Create `useNavigatorSearch` query hook (TDD)

**Files**: `src/hooks/navigator/useNavigatorSearch.ts`, `src/hooks/navigator/useNavigatorSearch.test.tsx`

Implement per §2.1 + §2.7 above. 7 test cases.

The test will need: `QueryClientProvider` wrapper, mock for `NavigatorSearchComposer` (probably already in mock), `NavigatorSearchEvent` dispatch with parser.result.code matching/non-matching.

- [ ] Commit: `feat(navigator): useNavigatorSearch query hook (P2 core)`

### Task 3: Strip search ownership from `useNavigatorStore` + `useNavigatorData` + remove `useNavigatorActions`

**Files**: `useNavigatorStore.ts`, `useNavigatorData.ts`, `useNavigatorActions.ts` (DELETE), `useNavigatorUiState.ts`, `index.ts`

- [ ] Remove `searchResult` state + `setSearchResult` from `useNavigatorStore`
- [ ] Remove `NavigatorSearchEvent` listener from `useNavigatorStore`
- [ ] Remove `sendSearch` and `reloadCurrentSearch` from `useNavigatorStore` return
- [ ] Remove `setLoading` calls inside `useNavigatorStore`
- [ ] Remove `topLevelContextRef` and `searchResultRef` (no longer used after sendSearch/reload removal)
- [ ] In `NavigatorMetadataEvent` handler, add `useNavigatorUiStore.getState().setTab(parser.topLevelContexts[0]?.code ?? '')` after `setTopLevelContext(...)` — seeds the query when contexts arrive
- [ ] Remove `searchResult` from `useNavigatorData` destructure + return
- [ ] DELETE `src/hooks/navigator/useNavigatorActions.ts`
- [ ] Update `useNavigatorUiState.ts` to expose `currentTabCode` + `currentFilter` per-key selectors
- [ ] Update `src/hooks/navigator/index.ts` to remove `useNavigatorActions` export, add `useNavigatorSearch` export
- [ ] Update `useNavigatorStore.test.tsx` smoke test: 2 cases that expected `searchResult` in data shape or `sendSearch/reloadCurrentSearch` in actions shape — update accordingly (or just remove the "useNavigatorActions returns ..." test entirely)
- [ ] Verify typecheck: ONLY consumer-side errors expected (NavigatorView still references the old API). Hook files clean.
- [ ] Commit: `refactor(navigator): remove search ownership from useNavigatorStore`

### Task 4: Migrate `NavigatorView.tsx` + `NavigatorSearchView.tsx`

**Files**: `src/components/navigator/NavigatorView.tsx`, `src/components/navigator/views/search/NavigatorSearchView.tsx`

- [ ] In `NavigatorView`:
  - Import `useNavigatorSearch`
  - Replace `useNavigatorData` destructure of `searchResult` with `useNavigatorSearch()` call returning `{ searchResult, isFetching }`
  - Drop `useNavigatorActions` import + destructure (it's gone)
  - Drop the 4 lifecycle `useEffect` blocks (needsSearch / needsInit-init / markReady / reloadCurrentSearch); the new flow:
    - Keep the `NavigatorInitComposer` on first `isVisible` — still needed for metadata
    - Tab clicks call `useNavigatorUiStore.getState().setTab(context.code)`
    - linkTracker `case 'search'`: `store.setTab(parts[2]); store.setFilter(parts[3] ?? ''); store.show();` (no more `pendingSearch` ref)
  - Replace `<NitroCard.Content isLoading={ isLoading }>` with `isFetching` from the query
  - Drop the `pendingSearch` ref
- [ ] In `NavigatorSearchView`:
  - Read `currentFilter` from `useNavigatorUiState` for the initial input value
  - Local `useState` for the text being typed (mirrors the store value)
  - Debounce: `useEffect` with 300ms timer calling `useNavigatorUiStore.getState().setFilter(text)`
  - Remove all `useNavigatorActions` references — the search submit happens via store, query refires automatically
- [ ] `yarn typecheck` clean
- [ ] `yarn test --run` green
- [ ] `yarn lint:hooks` clean
- [ ] Commit: `feat(navigator): drive search via TanStack Query + setTab/setFilter UI store actions`

### Task 5: PR

- [ ] Push branch
- [ ] Open PR against `duckietm:Dev`: `feat(navigator): TanStack Query for search (P2)`
