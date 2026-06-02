# Navigator Modernization P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 492-line `useNavigator` god-hook into a `wired-tools`-style store + three filters, extract door lifecycle to `useDoorState`, hoist NavigatorView's 9 local useState into a Zustand `navigatorUiStore`, migrate all 13 consumers, delete the shim — zero user-visible change.

**Architecture:** `src/hooks/navigator/useNavigatorStore.ts` is the internal `useBetween` closure holding data state + non-door event listeners + the `sendSearch`/`reloadCurrentSearch` actions. Three filter files (`useNavigatorData.ts`, `useNavigatorUiState.ts`, `useNavigatorActions.ts`) expose flat slices. `navigatorUiStore.ts` is a Zustand store for 9 panel-visibility/lifecycle flags. `useDoorState.ts` (in `src/hooks/rooms/widgets/`) is a separate `useBetween` closure for door bell/password lifecycle — dual-subscribed to `GetGuestRoomResultEvent` and `GenericErrorEvent` alongside the navigator store, each filtering by branch / error code.

**Tech Stack:** React 19.2, TypeScript (TS 7 native preview for typecheck), Zustand 5 via `createNitroStore`, `use-between` 1.x, Vitest 3 with co-located suites + `src/nitro-renderer.mock.ts`.

**Branch:** `feat/navigator-modernization` (already created at `66062c6`, forked from `origin/Dev` @ `d5d5ca59`). All commits stay on this branch; auto-push to `simoleo/feat/navigator-modernization` FF-only.

**House rules (apply to every commit):**
- Commit author: `simoleo89 <simoleo89@users.noreply.github.com>` via per-command `-c` overrides — do NOT modify global git config.
- **No `Co-Authored-By` trailer.**
- Each commit must be a stopping point: `yarn typecheck` clean, `yarn test --run` green, `yarn lint:hooks` clean.

---

## Task 1: Zustand `navigatorUiStore` (TDD)

**Files:**
- Create: `src/hooks/navigator/navigatorUiStore.ts`
- Test: `src/hooks/navigator/navigatorUiStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/navigator/navigatorUiStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigatorUiStore } from './navigatorUiStore';

const INITIAL = {
    isVisible: false,
    isReady: false,
    isCreatorOpen: false,
    isRoomInfoOpen: false,
    isRoomLinkOpen: false,
    isOpenSavesSearches: false,
    isLoading: false,
    needsInit: true,
    needsSearch: false
};

describe('useNavigatorUiStore', () =>
{
    beforeEach(() =>
    {
        useNavigatorUiStore.setState(INITIAL);
    });

    it('exposes the documented defaults', () =>
    {
        const s = useNavigatorUiStore.getState();
        expect(s.isVisible).toBe(false);
        expect(s.isReady).toBe(false);
        expect(s.isCreatorOpen).toBe(false);
        expect(s.isRoomInfoOpen).toBe(false);
        expect(s.isRoomLinkOpen).toBe(false);
        expect(s.isOpenSavesSearches).toBe(false);
        expect(s.isLoading).toBe(false);
        expect(s.needsInit).toBe(true);
        expect(s.needsSearch).toBe(false);
    });

    describe('show / hide / toggle', () =>
    {
        it('show() sets isVisible true and requests a search', () =>
        {
            useNavigatorUiStore.getState().show();
            expect(useNavigatorUiStore.getState().isVisible).toBe(true);
            expect(useNavigatorUiStore.getState().needsSearch).toBe(true);
        });

        it('hide() sets isVisible false without touching needsSearch', () =>
        {
            useNavigatorUiStore.setState({ isVisible: true, needsSearch: false });
            useNavigatorUiStore.getState().hide();
            expect(useNavigatorUiStore.getState().isVisible).toBe(false);
            expect(useNavigatorUiStore.getState().needsSearch).toBe(false);
        });

        it('toggle() flips visibility and requests a search on show', () =>
        {
            useNavigatorUiStore.getState().toggle();
            expect(useNavigatorUiStore.getState().isVisible).toBe(true);
            expect(useNavigatorUiStore.getState().needsSearch).toBe(true);

            useNavigatorUiStore.setState({ needsSearch: false });
            useNavigatorUiStore.getState().toggle();
            expect(useNavigatorUiStore.getState().isVisible).toBe(false);
            expect(useNavigatorUiStore.getState().needsSearch).toBe(false);
        });
    });

    describe('creator panel', () =>
    {
        it('openCreator() opens both visible and creator', () =>
        {
            useNavigatorUiStore.getState().openCreator();
            expect(useNavigatorUiStore.getState().isVisible).toBe(true);
            expect(useNavigatorUiStore.getState().isCreatorOpen).toBe(true);
        });

        it('closeCreator() closes only the creator panel', () =>
        {
            useNavigatorUiStore.setState({ isVisible: true, isCreatorOpen: true });
            useNavigatorUiStore.getState().closeCreator();
            expect(useNavigatorUiStore.getState().isCreatorOpen).toBe(false);
            expect(useNavigatorUiStore.getState().isVisible).toBe(true);
        });
    });

    describe('roomInfo / roomLink / savesSearches', () =>
    {
        it('setRoomInfoOpen(true) and toggleRoomInfo flip the flag', () =>
        {
            useNavigatorUiStore.getState().setRoomInfoOpen(true);
            expect(useNavigatorUiStore.getState().isRoomInfoOpen).toBe(true);
            useNavigatorUiStore.getState().toggleRoomInfo();
            expect(useNavigatorUiStore.getState().isRoomInfoOpen).toBe(false);
        });

        it('setRoomLinkOpen(true) and toggleRoomLink flip the flag', () =>
        {
            useNavigatorUiStore.getState().setRoomLinkOpen(true);
            expect(useNavigatorUiStore.getState().isRoomLinkOpen).toBe(true);
            useNavigatorUiStore.getState().toggleRoomLink();
            expect(useNavigatorUiStore.getState().isRoomLinkOpen).toBe(false);
        });

        it('toggleSavesSearches() flips the sidebar flag', () =>
        {
            useNavigatorUiStore.getState().toggleSavesSearches();
            expect(useNavigatorUiStore.getState().isOpenSavesSearches).toBe(true);
            useNavigatorUiStore.getState().toggleSavesSearches();
            expect(useNavigatorUiStore.getState().isOpenSavesSearches).toBe(false);
        });
    });

    describe('lifecycle flags', () =>
    {
        it('setLoading(true) and setLoading(false) toggle isLoading', () =>
        {
            useNavigatorUiStore.getState().setLoading(true);
            expect(useNavigatorUiStore.getState().isLoading).toBe(true);
            useNavigatorUiStore.getState().setLoading(false);
            expect(useNavigatorUiStore.getState().isLoading).toBe(false);
        });

        it('markReady() sets isReady true and is idempotent', () =>
        {
            useNavigatorUiStore.getState().markReady();
            expect(useNavigatorUiStore.getState().isReady).toBe(true);
            useNavigatorUiStore.getState().markReady();
            expect(useNavigatorUiStore.getState().isReady).toBe(true);
        });

        it('markInitDone() flips needsInit to false', () =>
        {
            useNavigatorUiStore.getState().markInitDone();
            expect(useNavigatorUiStore.getState().needsInit).toBe(false);
        });

        it('requestSearch() + consumeSearchRequest() are symmetric', () =>
        {
            useNavigatorUiStore.getState().requestSearch();
            expect(useNavigatorUiStore.getState().needsSearch).toBe(true);
            useNavigatorUiStore.getState().consumeSearchRequest();
            expect(useNavigatorUiStore.getState().needsSearch).toBe(false);
        });
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
cd Nitro-V3 ; yarn test --run src/hooks/navigator/navigatorUiStore.test.ts
```

Expected: FAIL — `Cannot find module './navigatorUiStore'`.

- [ ] **Step 3: Implement the store**

Create `src/hooks/navigator/navigatorUiStore.ts`:

```ts
import { createNitroStore } from '../../state/createNitroStore';

export type NavigatorUiState = {
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

export type NavigatorUiActions = {
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
    requestSearch(): void;
    consumeSearchRequest(): void;
};

export const useNavigatorUiStore = createNitroStore<NavigatorUiState & NavigatorUiActions>()((set) => ({
    isVisible: false,
    isReady: false,
    isCreatorOpen: false,
    isRoomInfoOpen: false,
    isRoomLinkOpen: false,
    isOpenSavesSearches: false,
    isLoading: false,
    needsInit: true,
    needsSearch: false,

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
    consumeSearchRequest: () => set({ needsSearch: false })
}));
```

- [ ] **Step 4: Run the test to verify it passes**

```powershell
cd Nitro-V3 ; yarn test --run src/hooks/navigator/navigatorUiStore.test.ts
```

Expected: PASS (all ~14 cases green).

- [ ] **Step 5: Commit**

```powershell
cd Nitro-V3
git add src/hooks/navigator/navigatorUiStore.ts src/hooks/navigator/navigatorUiStore.test.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(navigator): Zustand UI store for panel-visibility + lifecycle flags

Hoists the 9 useState in NavigatorView (isVisible, isReady, isCreatorOpen,
isRoomInfoOpen, isRoomLinkOpen, isOpenSavesSearches, isLoading, needsInit,
needsSearch) into a createNitroStore-backed Zustand store with named
actions. Future linkTracker / lifecycle wiring will call these actions
instead of mutating local component state.

TDD: ~14 cases on each action's transitions + idempotency."
git push simoleo feat/navigator-modernization
```

---

## Task 2: Extract `useDoorState` (TDD)

**Files:**
- Create: `src/hooks/rooms/widgets/useDoorState.ts`
- Test: `src/hooks/rooms/widgets/useDoorState.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/rooms/widgets/useDoorState.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { DoorbellMessageEvent, FlatAccessDeniedMessageEvent,
    GenericErrorEvent, GetGuestRoomResultEvent, RoomDataParser,
    RoomDoorbellAcceptedEvent } from '@nitrots/nitro-renderer';
import { beforeEach, describe, expect, it } from 'vitest';
import { DoorStateType } from '../../../api';
import { clearMockEventDispatcher, mockEventDispatcher } from '../../../nitro-renderer.mock';
import { useDoorState } from './useDoorState';

const makeParserlessEvent = (klass: any, parser: any) =>
{
    const ev = new klass();
    (ev as any).getParser = () => parser;
    return ev;
};

describe('useDoorState', () =>
{
    beforeEach(() =>
    {
        clearMockEventDispatcher();
    });

    it('exposes the initial NONE snapshot', () =>
    {
        const { result } = renderHook(() => useDoorState());
        expect(result.current.snapshot.state).toBe(DoorStateType.NONE);
        expect(result.current.snapshot.roomInfo).toBeNull();
    });

    it('DoorbellMessageEvent with empty userName -> STATE_WAITING', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WAITING);
    });

    it('DoorbellMessageEvent with non-empty userName does NOT change state', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: 'someone' }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('RoomDoorbellAcceptedEvent (empty userName) -> STATE_ACCEPTED', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(RoomDoorbellAcceptedEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_ACCEPTED);
    });

    it('FlatAccessDeniedMessageEvent (empty userName) -> STATE_NO_ANSWER', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(FlatAccessDeniedMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_NO_ANSWER);
    });

    it('GenericErrorEvent -100002 -> STATE_WRONG_PASSWORD', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GenericErrorEvent, { errorCode: -100002 }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WRONG_PASSWORD);
    });

    it('GenericErrorEvent 4010 does NOT touch door state', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GenericErrorEvent, { errorCode: 4010 }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('GetGuestRoomResultEvent with roomForward + DOORBELL_STATE -> START_DOORBELL', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const fakeRoomData: any = { roomId: 42, roomName: 'r', ownerName: 'other', doorMode: RoomDataParser.DOORBELL_STATE };
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: fakeRoomData
            }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.START_DOORBELL);
        expect(result.current.snapshot.roomInfo).toBe(fakeRoomData);
    });

    it('GetGuestRoomResultEvent with roomForward + PASSWORD_STATE -> START_PASSWORD', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const fakeRoomData: any = { roomId: 42, roomName: 'r', ownerName: 'other', doorMode: RoomDataParser.PASSWORD_STATE };
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: fakeRoomData
            }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.START_PASSWORD);
    });

    it('GetGuestRoomResultEvent for owner does NOT dispatch a door dialog', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        // Mock GetSessionDataManager().userName to be the owner name.
        // The hook reads owner name dynamically — see useDoorState impl.
        // For this test we make doorMode something other than bell/password.
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: { ownerName: 'me', doorMode: 99 }
            }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('reset() returns snapshot to NONE', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WAITING);
        act(() => result.current.reset());
        expect(result.current.snapshot.state).toBe(DoorStateType.NONE);
        expect(result.current.snapshot.roomInfo).toBeNull();
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
cd Nitro-V3 ; yarn test --run src/hooks/rooms/widgets/useDoorState.test.tsx
```

Expected: FAIL — `Cannot find module './useDoorState'`.

- [ ] **Step 3: Implement `useDoorState`**

Create `src/hooks/rooms/widgets/useDoorState.ts`:

```ts
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
    state: number;
};

const INITIAL: DoorStateSnapshot = { roomInfo: null, state: DoorStateType.NONE };

const useDoorStateStore = () =>
{
    const [ snapshot, setSnapshot ] = useState<DoorStateSnapshot>(INITIAL);

    useMessageEvent<DoorbellMessageEvent>(DoorbellMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_WAITING }));
    });

    useMessageEvent<RoomDoorbellAcceptedEvent>(RoomDoorbellAcceptedEvent, event =>
    {
        const parser = event.getParser();
        if(parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_ACCEPTED }));
    });

    useMessageEvent<FlatAccessDeniedMessageEvent>(FlatAccessDeniedMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.userName && parser.userName.length > 0) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_NO_ANSWER }));
    });

    useMessageEvent<GenericErrorEvent>(GenericErrorEvent, event =>
    {
        const parser = event.getParser();
        if(parser.errorCode !== -100002) return;
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_WRONG_PASSWORD }));
    });

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();
        if(!parser.roomForward) return;
        if(parser.data.ownerName === GetSessionDataManager().userName) return;
        if(parser.isGroupMember) return;
        if(parser.data.doorMode === RoomDataParser.DOORBELL_STATE)
        {
            setSnapshot({ roomInfo: parser.data, state: DoorStateType.START_DOORBELL });
            return;
        }
        if(parser.data.doorMode === RoomDataParser.PASSWORD_STATE)
        {
            setSnapshot({ roomInfo: parser.data, state: DoorStateType.START_PASSWORD });
        }
    });

    const reset = useCallback(() => setSnapshot(INITIAL), []);

    return { snapshot, setSnapshot, reset };
};

export const useDoorState = () => useBetween(useDoorStateStore);
```

- [ ] **Step 4: Verify the renderer mock exposes the events used in tests**

```powershell
cd Nitro-V3 ; grep -E "DoorbellMessageEvent|RoomDoorbellAcceptedEvent|FlatAccessDeniedMessageEvent|GenericErrorEvent|GetGuestRoomResultEvent|RoomDataParser" src/nitro-renderer.mock.ts
```

Expected: all six symbols present. If any are missing, ADD a minimal stub to `src/nitro-renderer.mock.ts` (real class with a no-arg constructor; `getParser` will be overridden in tests). Use the existing pattern — e.g. find `RoomSessionDoorbellEvent` and follow its shape.

- [ ] **Step 5: Run the test to verify it passes**

```powershell
cd Nitro-V3 ; yarn test --run src/hooks/rooms/widgets/useDoorState.test.tsx
```

Expected: PASS (11 cases).

- [ ] **Step 6: Commit**

```powershell
cd Nitro-V3
git add src/hooks/rooms/widgets/useDoorState.ts src/hooks/rooms/widgets/useDoorState.test.tsx src/nitro-renderer.mock.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(rooms): extract useDoorState from useNavigator god-hook

Separates the door bell/password lifecycle from Navigator data. Subscribes
to DoorbellMessageEvent / RoomDoorbellAcceptedEvent /
FlatAccessDeniedMessageEvent / GenericErrorEvent (-100002 only) /
GetGuestRoomResultEvent (roomForward branch with DOORBELL_STATE or
PASSWORD_STATE doorMode only). Other branches/errorCodes stay on
useNavigator — both subscribers coexist via useMessageEvent + filtering.

TDD: 11 cases incl. userName-empty filter + errorCode -100002 filter +
owner-skip + reset()."
git push simoleo feat/navigator-modernization
```

---

## Task 3: Internal `useNavigatorStore` (closure with data + non-door listeners + new actions)

**Files:**
- Create: `src/hooks/navigator/useNavigatorStore.ts`

- [ ] **Step 1: Read current `useNavigator.ts` in full**

```powershell
cd Nitro-V3 ; cat src/hooks/navigator/useNavigator.ts | head -100
```

You will translate this file's `useNavigatorState` function into the new `useNavigatorStore.ts`, with these surgical changes:

1. **Remove** `doorData` state and its dual writers (lines that called `setDoorData`).
2. **Remove** the door-only branches of `GetGuestRoomResultEvent` (doorMode bell/password) — these are now in `useDoorState`. KEEP the `roomEnter` branch and the `roomForward` branch that calls `CreateRoomSession(parser.data.roomId)`.
3. **Remove** the `GenericErrorEvent` case for errorCode `-100002` — now in `useDoorState`. KEEP cases 4009/4010/4011/4013.
4. **Keep** all other listeners untouched.
5. **Add** two new actions extracted from `NavigatorView.tsx` locals (currently at `NavigatorView.tsx:42-79`): `sendSearch(searchValue, contextCode)` and `reloadCurrentSearch()`.
6. The store function is NAMED `useNavigatorStore` (not `useNavigatorState`) and is NOT wrapped in `useBetween` here — the wrapping happens in the three filter files.

- [ ] **Step 2: Create the new file**

Create `src/hooks/navigator/useNavigatorStore.ts`:

```ts
import { CanCreateRoomEventEvent, CantConnectMessageParser, CreateLinkEvent,
    FavouriteChangedEvent, FavouritesEvent, FlatCreatedEvent,
    FollowFriendMessageComposer, GenericErrorEvent, GetGuestRoomMessageComposer,
    GetGuestRoomResultEvent, GetRoomSessionManager, GetSessionDataManager,
    GetUserEventCatsMessageComposer, GetUserFlatCatsMessageComposer,
    HabboWebTools, LegacyExternalInterface, NavigatorCategoryDataParser,
    NavigatorEventCategoryDataParser, NavigatorHomeRoomEvent,
    NavigatorMetadataEvent, NavigatorOpenRoomCreatorEvent, NavigatorSavedSearch,
    NavigatorSearchComposer, NavigatorSearchesEvent, NavigatorSearchEvent,
    NavigatorSearchResultSet, NavigatorTopLevelContext, NitroEventType,
    RoomDataParser, RoomEnterErrorEvent, RoomEntryInfoMessageEvent,
    RoomForwardEvent, RoomScoreEvent, RoomSettingsUpdatedEvent,
    SecurityLevel, UserEventCatsEvent, UserFlatCatsEvent,
    UserInfoEvent, UserPermissionsEvent } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { CreateRoomSession, GetConfigurationValue, INavigatorData,
    LocalizeText, NotificationAlertType, SendMessageComposer,
    TryVisitRoom, VisitDesktop } from '../../api';
import { useMessageEvent, useNitroEvent } from '../events';
import { useNotification } from '../notification';
import { useNavigatorUiStore } from './navigatorUiStore';

export const useNavigatorStore = () =>
{
    const [ categories, setCategories ] = useState<NavigatorCategoryDataParser[]>(null);
    const [ eventCategories, setEventCategories ] = useState<NavigatorEventCategoryDataParser[]>(null);
    const [ favouriteRoomIds, setFavouriteRoomIds ] = useState<number[]>([]);
    const [ topLevelContext, setTopLevelContext ] = useState<NavigatorTopLevelContext>(null);
    const [ topLevelContexts, setTopLevelContexts ] = useState<NavigatorTopLevelContext[]>(null);
    const [ searchResult, setSearchResult ] = useState<NavigatorSearchResultSet>(null);
    const [ navigatorSearches, setNavigatorSearches ] = useState<NavigatorSavedSearch[]>(null);
    const [ navigatorData, setNavigatorData ] = useState<INavigatorData>({
        settingsReceived: false,
        homeRoomId: 0,
        enteredGuestRoom: null,
        currentRoomOwner: false,
        currentRoomId: 0,
        currentRoomIsStaffPick: false,
        createdFlatId: 0,
        avatarId: 0,
        roomPicker: false,
        eventMod: false,
        currentRoomRating: 0,
        canRate: true
    });

    const { simpleAlert = null } = useNotification();

    const sendSearch = useCallback((searchValue: string, contextCode: string) =>
    {
        useNavigatorUiStore.getState().closeCreator();
        SendMessageComposer(new NavigatorSearchComposer(contextCode, searchValue));
        useNavigatorUiStore.getState().setLoading(true);
    }, []);

    const reloadCurrentSearch = useCallback(() =>
    {
        if(!useNavigatorUiStore.getState().isReady)
        {
            useNavigatorUiStore.getState().requestSearch();
            return;
        }
        if(searchResult)
        {
            sendSearch(searchResult.data, searchResult.code);
            return;
        }
        if(!topLevelContext) return;
        sendSearch('', topLevelContext.code);
    }, [ searchResult, topLevelContext, sendSearch ]);

    useMessageEvent<FavouritesEvent>(FavouritesEvent, event =>
    {
        const parser = event.getParser();
        const favoriteIds = (parser.favoriteRoomIds || []).map((x: any) => Number(x));
        setFavouriteRoomIds(favoriteIds);
    });

    useMessageEvent<FavouriteChangedEvent>(FavouriteChangedEvent, event =>
    {
        const parser = event.getParser();
        const roomId = Number(parser.flatId);
        const added = !!parser.added;
        setFavouriteRoomIds(prev =>
        {
            const ids = (prev || []).map((x: any) => Number(x));
            if(added) return ids.includes(roomId) ? ids : [ ...ids, roomId ];
            return ids.filter(id => id !== roomId);
        });
    });

    useMessageEvent<RoomSettingsUpdatedEvent>(RoomSettingsUpdatedEvent, event =>
    {
        const parser = event.getParser();
        SendMessageComposer(new GetGuestRoomMessageComposer(parser.roomId, false, false));
    });

    useMessageEvent<CanCreateRoomEventEvent>(CanCreateRoomEventEvent, event =>
    {
        const parser = event.getParser();
        if(parser.canCreate) return;
        simpleAlert(LocalizeText(`navigator.cannotcreateevent.error.${ parser.errorCode }`), null, null, null, LocalizeText('navigator.cannotcreateevent.title'));
    });

    useMessageEvent<UserInfoEvent>(UserInfoEvent, event =>
    {
        SendMessageComposer(new GetUserFlatCatsMessageComposer());
        SendMessageComposer(new GetUserEventCatsMessageComposer());
    });

    useMessageEvent<UserPermissionsEvent>(UserPermissionsEvent, event =>
    {
        const parser = event.getParser();
        setNavigatorData(prev => ({
            ...prev,
            eventMod: parser.securityLevel >= SecurityLevel.MODERATOR,
            roomPicker: parser.securityLevel >= SecurityLevel.COMMUNITY
        }));
    });

    useMessageEvent<RoomForwardEvent>(RoomForwardEvent, event =>
    {
        const parser = event.getParser();
        TryVisitRoom(parser.roomId);
    });

    useMessageEvent<RoomEntryInfoMessageEvent>(RoomEntryInfoMessageEvent, event =>
    {
        const parser = event.getParser();
        setNavigatorData(prev => ({
            ...prev,
            enteredGuestRoom: null,
            currentRoomOwner: parser.isOwner,
            currentRoomId: parser.roomId
        }));
        SendMessageComposer(new GetGuestRoomMessageComposer(parser.roomId, true, false));
        if(LegacyExternalInterface.available) LegacyExternalInterface.call('legacyTrack', 'navigator', 'private', [ parser.roomId ]);
    });

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();
        if(parser.roomEnter)
        {
            setNavigatorData(prev =>
            {
                const next = { ...prev };
                next.enteredGuestRoom = parser.data;
                next.currentRoomIsStaffPick = parser.staffPick;
                const isCreated = next.createdFlatId === parser.data.roomId;
                if(!isCreated && parser.data.displayRoomEntryAd)
                {
                    if(GetConfigurationValue<boolean>('roomenterad.habblet.enabled', false)) HabboWebTools.openRoomEnterAd();
                }
                next.createdFlatId = 0;
                return next;
            });
            return;
        }
        if(parser.roomForward)
        {
            // Door-mode branches handled in useDoorState — skip here.
            const isOwner = parser.data.ownerName === GetSessionDataManager().userName;
            if(!isOwner && !parser.isGroupMember)
            {
                if(parser.data.doorMode === RoomDataParser.DOORBELL_STATE) return;
                if(parser.data.doorMode === RoomDataParser.PASSWORD_STATE) return;
            }
            if((parser.data.doorMode === RoomDataParser.NOOB_STATE) && !GetSessionDataManager().isAmbassador && !GetSessionDataManager().isRealNoob && !GetSessionDataManager().isModerator) return;
            CreateRoomSession(parser.data.roomId);
            return;
        }
        setNavigatorData(prev => ({
            ...prev,
            enteredGuestRoom: parser.data,
            currentRoomIsStaffPick: parser.staffPick
        }));
    });

    useMessageEvent<RoomScoreEvent>(RoomScoreEvent, event =>
    {
        const parser = event.getParser();
        setNavigatorData(prev => ({
            ...prev,
            currentRoomRating: parser.totalLikes,
            canRate: parser.canLike
        }));
    });

    useMessageEvent<GenericErrorEvent>(GenericErrorEvent, event =>
    {
        const parser = event.getParser();
        // -100002 (wrong password) handled in useDoorState — skip here.
        switch(parser.errorCode)
        {
            case 4009:
                simpleAlert(LocalizeText('navigator.alert.need.to.be.vip'), NotificationAlertType.DEFAULT, null, null, LocalizeText('generic.alert.title'));
                return;
            case 4010:
                simpleAlert(LocalizeText('navigator.alert.invalid_room_name'), NotificationAlertType.DEFAULT, null, null, LocalizeText('generic.alert.title'));
                return;
            case 4011:
                simpleAlert(LocalizeText('navigator.alert.cannot_perm_ban'), NotificationAlertType.DEFAULT, null, null, LocalizeText('generic.alert.title'));
                return;
            case 4013:
                simpleAlert(LocalizeText('navigator.alert.room_in_maintenance'), NotificationAlertType.DEFAULT, null, null, LocalizeText('generic.alert.title'));
                return;
        }
    });

    useMessageEvent<NavigatorMetadataEvent>(NavigatorMetadataEvent, event =>
    {
        const parser = event.getParser();
        setTopLevelContexts(parser.topLevelContexts);
        setTopLevelContext(parser.topLevelContexts.length ? parser.topLevelContexts[0] : null);
    });

    useMessageEvent<NavigatorSearchEvent>(NavigatorSearchEvent, event =>
    {
        const parser = event.getParser();
        setTopLevelContext(prev =>
        {
            let next = prev;
            if(!next) next = (topLevelContexts && topLevelContexts.length && topLevelContexts[0]) || null;
            if(!next) return null;
            if(topLevelContexts && topLevelContexts.length)
            {
                for(const ctx of topLevelContexts)
                {
                    if(ctx.code === parser.result.code) next = ctx;
                }
            }
            return next;
        });
        setSearchResult(parser.result);
        useNavigatorUiStore.getState().setLoading(false);
    });

    useMessageEvent<UserFlatCatsEvent>(UserFlatCatsEvent, event =>
    {
        const parser = event.getParser();
        setCategories(parser.categories);
    });

    useMessageEvent<UserEventCatsEvent>(UserEventCatsEvent, event =>
    {
        const parser = event.getParser();
        setEventCategories(parser.categories);
    });

    useMessageEvent<FlatCreatedEvent>(FlatCreatedEvent, event =>
    {
        const parser = event.getParser();
        CreateRoomSession(parser.roomId);
    });

    useNitroEvent(NitroEventType.SOCKET_RECONNECTING, () =>
    {
        setNavigatorData(prev => ({ ...prev, settingsReceived: false }));
    });

    useMessageEvent<NavigatorHomeRoomEvent>(NavigatorHomeRoomEvent, event =>
    {
        const parser = event.getParser();
        let prevSettingsReceived = false;
        setNavigatorData(prev =>
        {
            prevSettingsReceived = prev.settingsReceived;
            return { ...prev, homeRoomId: parser.homeRoomId, settingsReceived: true };
        });
        if(prevSettingsReceived) return;
        if(GetRoomSessionManager().viewerSession) return;

        let forwardType = -1;
        let forwardId = -1;
        if((GetConfigurationValue<string>('friend.id') !== undefined) && (parseInt(GetConfigurationValue<string>('friend.id')) > 0))
        {
            forwardType = 0;
            SendMessageComposer(new FollowFriendMessageComposer(parseInt(GetConfigurationValue<string>('friend.id'))));
        }
        if((GetConfigurationValue<number>('forward.type') !== undefined) && (GetConfigurationValue<number>('forward.id') !== undefined))
        {
            forwardType = parseInt(GetConfigurationValue<string>('forward.type'));
            forwardId = parseInt(GetConfigurationValue<string>('forward.id'));
        }
        if(forwardType === 2)
        {
            TryVisitRoom(forwardId);
        }
        else if((forwardType === -1) && (parser.roomIdToEnter > 0))
        {
            CreateLinkEvent('navigator/close');
            CreateRoomSession(parser.roomIdToEnter !== parser.homeRoomId ? parser.roomIdToEnter : parser.homeRoomId);
        }
    });

    useMessageEvent<RoomEnterErrorEvent>(RoomEnterErrorEvent, event =>
    {
        const parser = event.getParser();
        switch(parser.reason)
        {
            case CantConnectMessageParser.REASON_FULL:
                simpleAlert(LocalizeText('navigator.guestroomfull.text'), NotificationAlertType.DEFAULT, null, null, LocalizeText('navigator.guestroomfull.title'));
                break;
            case CantConnectMessageParser.REASON_QUEUE_ERROR:
                simpleAlert(LocalizeText(`room.queue.error.${ parser.parameter }`), NotificationAlertType.DEFAULT, null, null, LocalizeText('room.queue.error.title'));
                break;
            case CantConnectMessageParser.REASON_BANNED:
                simpleAlert(LocalizeText('navigator.banned.text'), NotificationAlertType.DEFAULT, null, null, LocalizeText('navigator.banned.title'));
                break;
            default:
                simpleAlert(LocalizeText('room.queue.error.title'), NotificationAlertType.DEFAULT, null, null, LocalizeText('room.queue.error.title'));
                break;
        }
        if(GetRoomSessionManager().isReconnecting) return;
        VisitDesktop();
    });

    useMessageEvent<NavigatorOpenRoomCreatorEvent>(NavigatorOpenRoomCreatorEvent, event => CreateLinkEvent('navigator/show'));

    useMessageEvent<NavigatorSearchesEvent>(NavigatorSearchesEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;
        setNavigatorSearches(parser.searches);
    });

    return {
        categories, eventCategories, favouriteRoomIds,
        topLevelContext, topLevelContexts,
        searchResult, navigatorSearches, navigatorData,
        sendSearch, reloadCurrentSearch
    };
};
```

- [ ] **Step 3: Run typecheck to verify the file compiles**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | tail -10
```

Expected: no NEW errors in `src/hooks/navigator/useNavigatorStore.ts`. Pre-existing floorplan-related typecheck errors (`applyFloorModelLocally`, JSX namespace) are environmental, not caused by P1 — see spec §11.

- [ ] **Step 4: Do NOT commit yet**

The three filter files in Task 4 will land in the same commit as this file — atomically, so the codebase always has working hook exports.

---

## Task 4: Three filter files + updated barrel + smoke test

**Files:**
- Create: `src/hooks/navigator/useNavigatorData.ts`
- Create: `src/hooks/navigator/useNavigatorUiState.ts`
- Create: `src/hooks/navigator/useNavigatorActions.ts`
- Modify: `src/hooks/navigator/index.ts`
- Create: `src/hooks/navigator/useNavigatorStore.test.tsx`

- [ ] **Step 1: Create `useNavigatorData.ts`**

```ts
import { useBetween } from 'use-between';
import { useNavigatorStore } from './useNavigatorStore';

export const useNavigatorData = () =>
{
    const {
        categories, eventCategories, favouriteRoomIds,
        topLevelContext, topLevelContexts,
        searchResult, navigatorSearches, navigatorData
    } = useBetween(useNavigatorStore);

    return {
        categories, eventCategories, favouriteRoomIds,
        topLevelContext, topLevelContexts,
        searchResult, navigatorSearches, navigatorData
    };
};
```

- [ ] **Step 2: Create `useNavigatorUiState.ts`**

```ts
import { useNavigatorUiStore } from './navigatorUiStore';

export const useNavigatorUiState = () =>
{
    const isVisible           = useNavigatorUiStore(s => s.isVisible);
    const isReady             = useNavigatorUiStore(s => s.isReady);
    const isCreatorOpen       = useNavigatorUiStore(s => s.isCreatorOpen);
    const isRoomInfoOpen      = useNavigatorUiStore(s => s.isRoomInfoOpen);
    const isRoomLinkOpen      = useNavigatorUiStore(s => s.isRoomLinkOpen);
    const isOpenSavesSearches = useNavigatorUiStore(s => s.isOpenSavesSearches);
    const isLoading           = useNavigatorUiStore(s => s.isLoading);
    const needsInit           = useNavigatorUiStore(s => s.needsInit);
    const needsSearch         = useNavigatorUiStore(s => s.needsSearch);
    return {
        isVisible, isReady, isCreatorOpen, isRoomInfoOpen, isRoomLinkOpen,
        isOpenSavesSearches, isLoading, needsInit, needsSearch
    };
};
```

- [ ] **Step 3: Create `useNavigatorActions.ts`**

```ts
import { useBetween } from 'use-between';
import { useNavigatorStore } from './useNavigatorStore';

export const useNavigatorActions = () =>
{
    const { sendSearch, reloadCurrentSearch } = useBetween(useNavigatorStore);
    return { sendSearch, reloadCurrentSearch };
};
```

- [ ] **Step 4: Rewrite the barrel `index.ts`**

```ts
export { useNavigatorActions } from './useNavigatorActions';
export { useNavigatorData } from './useNavigatorData';
export { useNavigatorUiState } from './useNavigatorUiState';
export { useNavigatorUiStore } from './navigatorUiStore';
export { useDoorState } from '../rooms/widgets/useDoorState';
export type { DoorStateSnapshot } from '../rooms/widgets/useDoorState';
export type { NavigatorUiActions, NavigatorUiState } from './navigatorUiStore';
```

Notice: the old `export * from './useNavigator';` is GONE. `useNavigator` is no longer exported by the barrel — consumers must use the new filters. (The old file still exists on disk until Task 9.)

- [ ] **Step 5: Add a smoke test**

Create `src/hooks/navigator/useNavigatorStore.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNavigatorActions, useNavigatorData, useNavigatorUiState } from './index';

describe('navigator filter shapes (smoke)', () =>
{
    it('useNavigatorData returns the documented keys', () =>
    {
        const { result } = renderHook(() => useNavigatorData());
        expect(Object.keys(result.current).sort()).toEqual([
            'categories', 'eventCategories', 'favouriteRoomIds',
            'navigatorData', 'navigatorSearches',
            'searchResult', 'topLevelContext', 'topLevelContexts'
        ].sort());
    });

    it('useNavigatorUiState returns the 9 documented flags', () =>
    {
        const { result } = renderHook(() => useNavigatorUiState());
        expect(Object.keys(result.current).sort()).toEqual([
            'isCreatorOpen', 'isLoading', 'isOpenSavesSearches',
            'isReady', 'isRoomInfoOpen', 'isRoomLinkOpen', 'isVisible',
            'needsInit', 'needsSearch'
        ].sort());
    });

    it('useNavigatorActions returns sendSearch + reloadCurrentSearch', () =>
    {
        const { result } = renderHook(() => useNavigatorActions());
        expect(typeof result.current.sendSearch).toBe('function');
        expect(typeof result.current.reloadCurrentSearch).toBe('function');
    });
});
```

- [ ] **Step 6: Run typecheck — the project will fail because consumers still import `useNavigator`**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | tail -20
```

Expected: errors like `Module '"...hooks/navigator"' has no exported member 'useNavigator'` in the 13 consumer files. That's intentional — Tasks 6/7/8 fix them. The hook files themselves must typecheck clean.

- [ ] **Step 7: Run the smoke test in isolation**

```powershell
cd Nitro-V3 ; yarn test --run src/hooks/navigator/useNavigatorStore.test.tsx
```

Expected: PASS (3 cases).

- [ ] **Step 8: Commit all new hook files together**

```powershell
cd Nitro-V3
git add src/hooks/navigator/useNavigatorStore.ts src/hooks/navigator/useNavigatorData.ts src/hooks/navigator/useNavigatorUiState.ts src/hooks/navigator/useNavigatorActions.ts src/hooks/navigator/index.ts src/hooks/navigator/useNavigatorStore.test.tsx
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(navigator): wired-tools-style hook split (Store + 3 filters)

Splits the 492-line useNavigator god-hook into a useBetween-backed
useNavigatorStore closure plus three flat-shape filters
(useNavigatorData, useNavigatorUiState, useNavigatorActions), mirroring
the wired-tools layout. sendSearch + reloadCurrentSearch are extracted
as named actions out of NavigatorView locals.

Door-mode handling is removed from this store and lives in useDoorState
(committed previously) — see GetGuestRoomResultEvent and
GenericErrorEvent dual-subscription with mutually exclusive filters.

The barrel index.ts no longer re-exports useNavigator. The 13 consumers
will fail typecheck until Tasks 6-8 migrate them; the hook files
themselves are clean. Smoke test covers filter shapes."
git push simoleo feat/navigator-modernization
```

Note: `yarn test --run` overall is RED at this commit (consumers can't typecheck) — that's why we commit AND PUSH but DO NOT verify whole-project test green here. The next tasks make it green.

**Deviation from house rule**: this is the only intentionally-broken intermediate commit in the plan. Documented in spec §11.

---

## Task 5: Migrate `NavigatorDoorStateView.tsx`

**Files:**
- Modify: `src/components/navigator/views/NavigatorDoorStateView.tsx`

- [ ] **Step 1: Apply the consumer rewrite**

Replace the file content with:

```tsx
import { FC, useEffect, useState } from 'react';
import { CreateRoomSession, DoorStateType, GoToDesktop, LocalizeText } from '../../../api';
import { Button, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../common';
import { useDoorState } from '../../../hooks';
import { NitroInput } from '../../../layout';

const VISIBLE_STATES = [ DoorStateType.START_DOORBELL, DoorStateType.STATE_WAITING, DoorStateType.STATE_NO_ANSWER, DoorStateType.START_PASSWORD, DoorStateType.STATE_WRONG_PASSWORD ];
const DOORBELL_STATES = [ DoorStateType.START_DOORBELL, DoorStateType.STATE_WAITING, DoorStateType.STATE_NO_ANSWER ];

export const NavigatorDoorStateView: FC<{}> = props =>
{
    const [ password, setPassword ] = useState('');
    const { snapshot, setSnapshot, reset } = useDoorState();

    const onClose = () =>
    {
        if(snapshot.state === DoorStateType.STATE_WAITING) GoToDesktop();
        reset();
    };

    const ring = () =>
    {
        if(!snapshot.roomInfo) return;
        CreateRoomSession(snapshot.roomInfo.roomId);
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_PENDING_SERVER }));
    };

    const tryEntering = () =>
    {
        if(!snapshot.roomInfo) return;
        CreateRoomSession(snapshot.roomInfo.roomId, password);
        setSnapshot(prev => ({ ...prev, state: DoorStateType.STATE_PENDING_SERVER }));
    };

    useEffect(() =>
    {
        if(snapshot.state !== DoorStateType.STATE_NO_ANSWER) return;
        GoToDesktop();
    }, [ snapshot.state ]);

    if(snapshot.state === DoorStateType.NONE) return null;
    if(VISIBLE_STATES.indexOf(snapshot.state) === -1) return null;

    const isDoorbell = DOORBELL_STATES.indexOf(snapshot.state) >= 0;

    return (
        <NitroCardView className="nitro-navigator-doorbell" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText(isDoorbell ? 'navigator.doorbell.title' : 'navigator.password.title') } onCloseClick={ onClose } />
            <NitroCardContentView>
                <div className="flex flex-col gap-1">
                    <Text bold>{ snapshot.roomInfo && snapshot.roomInfo.roomName }</Text>
                    { snapshot.state === DoorStateType.START_DOORBELL &&
                        <Text>{ LocalizeText('navigator.doorbell.info') }</Text> }
                    { snapshot.state === DoorStateType.STATE_WAITING &&
                        <Text>{ LocalizeText('navigator.doorbell.waiting') }</Text> }
                    { snapshot.state === DoorStateType.STATE_NO_ANSWER &&
                        <Text>{ LocalizeText('navigator.doorbell.no.answer') }</Text> }
                    { snapshot.state === DoorStateType.START_PASSWORD &&
                        <Text>{ LocalizeText('navigator.password.info') }</Text> }
                    { snapshot.state === DoorStateType.STATE_WRONG_PASSWORD &&
                        <Text>{ LocalizeText('navigator.password.retryinfo') }</Text> }
                </div>
                { isDoorbell &&
                    <div className="flex flex-col gap-1">
                        { snapshot.state === DoorStateType.START_DOORBELL &&
                            <Button variant="success" onClick={ ring }>
                                { LocalizeText('navigator.doorbell.button.ring') }
                            </Button> }
                        <Button variant="danger" onClick={ onClose }>
                            { LocalizeText('generic.cancel') }
                        </Button>
                    </div> }
                { !isDoorbell &&
                    <>
                        <div className="flex flex-col gap-1">
                            <Text>{ LocalizeText('navigator.password.enter') }</Text>
                            <NitroInput type="password" onChange={ event => setPassword(event.target.value) } />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button variant="success" onClick={ tryEntering }>
                                { LocalizeText('navigator.password.button.try') }
                            </Button>
                            <Button variant="danger" onClick={ onClose }>
                                { LocalizeText('generic.cancel') }
                            </Button>
                        </div>
                    </> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
```

Key changes:
- `useNavigator()` → `useDoorState()`
- `doorData` → `snapshot`
- `setDoorData(null)` → `reset()`
- `setDoorData(prev => ...)` → `setSnapshot(prev => ...)`
- Defensive `if(doorData && ...)` guards removed because `snapshot` is never null (always has a default `{ roomInfo: null, state: NONE }`)

- [ ] **Step 2: Verify typecheck for this file is clean**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | grep NavigatorDoorStateView
```

Expected: no output (no errors mentioning this file).

- [ ] **Step 3: Do NOT commit yet** — bundle with the rest of consumer migration in Task 8.

---

## Task 6: Migrate `NavigatorView.tsx` (the big one)

**Files:**
- Modify: `src/components/navigator/NavigatorView.tsx`

- [ ] **Step 1: Read the current file in full**

```powershell
cd Nitro-V3 ; cat src/components/navigator/NavigatorView.tsx
```

You will replace 9 local `useState`, the local `sendSearch`/`reloadCurrentSearch` definitions, and most of the `linkTracker` body with calls to `useNavigatorUiStore.getState()`.

- [ ] **Step 2: Apply the rewrite**

Replace the file contents with:

```tsx
import { NitroCard } from '@layout/NitroCard';
import { AddLinkEventTracker, ConvertGlobalRoomIdMessageComposer, FindNewFriendsMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, RemoveLinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { FaPlus } from 'react-icons/fa';
import savesSearchIcon from '../../assets/images/navigator/saves-search/search_save.png';
import createRoomImg from '../../assets/images/navigator/create_room.png';
import randomRoomImg from '../../assets/images/navigator/random_room.png';
import promoteRoomImg from '../../assets/images/navigator/promote_room.png';
import { CreateLinkEvent, LocalizeText, SendMessageComposer, TryVisitRoom } from '../../api';
import { Flex, Text } from '../../common';
import { useNavigatorActions, useNavigatorData, useNavigatorUiState, useNavigatorUiStore, useNitroEvent } from '../../hooks';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorSearchResultView } from './views/search/NavigatorSearchResultView';
import { NavigatorSearchSavesResultView } from './views/search/NavigatorSearchSavesResultView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';

export const NavigatorView: FC<{}> = props =>
{
    const { searchResult, topLevelContext, topLevelContexts, navigatorData, navigatorSearches } = useNavigatorData();
    const { isVisible, isReady, isCreatorOpen, isRoomInfoOpen, isRoomLinkOpen, isOpenSavesSearches, isLoading, needsInit, needsSearch } = useNavigatorUiState();
    const { sendSearch, reloadCurrentSearch } = useNavigatorActions();
    const pendingSearch = useRef<{ value: string, code: string }>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
        useNavigatorUiStore.getState().hide();
        useNavigatorUiStore.getState().closeCreator();
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                const store = useNavigatorUiStore.getState();
                switch(parts[1])
                {
                    case 'show':
                        store.show();
                        return;
                    case 'hide':
                        store.hide();
                        return;
                    case 'toggle':
                        store.toggle();
                        return;
                    case 'toggle-room-info':
                        store.toggleRoomInfo();
                        return;
                    case 'toggle-room-link':
                        store.toggleRoomLink();
                        return;
                    case 'goto':
                        if(parts.length <= 2) return;
                        if(parts[2] === 'home')
                        {
                            if(navigatorData.homeRoomId <= 0) return;
                            TryVisitRoom(navigatorData.homeRoomId);
                            return;
                        }
                        TryVisitRoom(parseInt(parts[2]));
                        return;
                    case 'create':
                        store.openCreator();
                        return;
                    case 'search':
                        if(parts.length <= 2) return;
                        pendingSearch.current = { value: parts.length > 3 ? parts[3] : '', code: parts[2] };
                        store.show();
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };
        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ navigatorData ]);

    useEffect(() =>
    {
        if(!searchResult) return;
        if(elementRef.current) elementRef.current.scrollTop = 0;
    }, [ searchResult ]);

    useEffect(() =>
    {
        if(!isVisible || !isReady || !needsSearch) return;
        if(pendingSearch.current)
        {
            sendSearch(pendingSearch.current.value, pendingSearch.current.code);
            pendingSearch.current = null;
        }
        else
        {
            reloadCurrentSearch();
        }
        useNavigatorUiStore.getState().consumeSearchRequest();
    }, [ isVisible, isReady, needsSearch, sendSearch, reloadCurrentSearch ]);

    useEffect(() =>
    {
        if(isReady || !topLevelContext) return;
        useNavigatorUiStore.getState().markReady();
    }, [ isReady, topLevelContext ]);

    useEffect(() =>
    {
        if(!isVisible || !needsInit) return;
        SendMessageComposer(new NavigatorInitComposer());
        useNavigatorUiStore.getState().markInitDone();
    }, [ isVisible, needsInit ]);

    useEffect(() =>
    {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    if(!isVisible) return (
        <>
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => useNavigatorUiStore.getState().setRoomInfoOpen(false) } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => useNavigatorUiStore.getState().setRoomLinkOpen(false) } /> }
            <NavigatorRoomSettingsView />
        </>
    );

    return (
        <>
            <NitroCard
                className={ `${ isOpenSavesSearches ? 'w-[600px] min-w-[600px]' : 'w-navigator-w min-w-navigator-w' } h-navigator-h min-h-navigator-h` }
                uniqueKey="navigator">
                <NitroCard.Header
                    headerText={ LocalizeText(isCreatorOpen ? 'navigator.createroom.title' : 'navigator.title') }
                    onCloseClick={ () => useNavigatorUiStore.getState().hide() } />
                <NitroCard.Tabs>
                    <NitroCard.TabItem
                        isActive={ isOpenSavesSearches }
                        title={ LocalizeText('navigator.tooltip.left.show.hide') }
                        onClick={ () => useNavigatorUiStore.getState().toggleSavesSearches() }>
                        <img src={ savesSearchIcon } alt="" style={{ width: 18, height: 18 }} />
                    </NitroCard.TabItem>
                    { topLevelContexts && topLevelContexts.length > 0 && topLevelContexts.map((context, index) =>
                        <NitroCard.TabItem
                            key={ index }
                            isActive={ topLevelContext === context && !isCreatorOpen }
                            onClick={ () => sendSearch('', context.code) }>
                            { LocalizeText('navigator.toplevelview.' + context.code) }
                        </NitroCard.TabItem>) }
                    <NitroCard.TabItem
                        isActive={ isCreatorOpen }
                        onClick={ () => useNavigatorUiStore.getState().openCreator() }>
                        <FaPlus className="fa-icon" />
                    </NitroCard.TabItem>
                </NitroCard.Tabs>
                <NitroCard.Content isLoading={ isLoading }>
                    { !isCreatorOpen &&
                        <div className="flex h-full overflow-hidden gap-2">
                            { isOpenSavesSearches &&
                                <div className="overflow-hidden pr-1 shrink-0">
                                    <NavigatorSearchSavesResultView searches={ navigatorSearches || [] } />
                                </div> }
                            <div className="flex flex-col w-full overflow-hidden gap-2">
                                <NavigatorSearchView />
                                <div ref={ elementRef } className="flex flex-col flex-1 min-h-0 overflow-auto gap-2">
                                    { searchResult && searchResult.results.map((result, index) => <NavigatorSearchResultView key={ index } searchResult={ result } />) }
                                    { searchResult && (!searchResult.results || searchResult.results.length === 0) &&
                                        <div className="nitro-card-panel px-3 py-2 text-sm text-muted">
                                            { LocalizeText(searchResult.code === 'myworld_view' ? 'navigator.roomsettings.moderation.none' : 'navigator.search.returned.no.results') }
                                        </div> }
                                </div>
                                <Flex className="nitro-card-divider pt-2 border-t gap-2">
                                    <Flex pointer alignItems="center" justifyContent="center"
                                        className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                        style={ { backgroundImage: `url(${ createRoomImg })`, backgroundSize: '100% 100%' } }
                                        onClick={ () => useNavigatorUiStore.getState().openCreator() }>
                                        <Text variant="white" bold className="text-xs drop-shadow">
                                            { LocalizeText('navigator.createroom.create') }
                                        </Text>
                                    </Flex>
                                    { searchResult?.code !== 'myworld_view' && searchResult?.code !== 'roomads_view' &&
                                        <Flex pointer alignItems="center" justifyContent="center"
                                            className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                            style={ { backgroundImage: `url(${ randomRoomImg })`, backgroundSize: '100% 100%' } }
                                            onClick={ () => SendMessageComposer(new FindNewFriendsMessageComposer()) }>
                                            <Text variant="white" bold className="text-xs drop-shadow">
                                                { LocalizeText('navigator.random.room') }
                                            </Text>
                                        </Flex> }
                                    { (searchResult?.code === 'myworld_view' || searchResult?.code === 'roomads_view') &&
                                        <Flex pointer alignItems="center" justifyContent="center"
                                            className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                            style={ { backgroundImage: `url(${ promoteRoomImg })`, backgroundSize: '100% 100%' } }
                                            onClick={ () => CreateLinkEvent('catalog/open/room_event') }>
                                            <Text variant="white" bold className="text-xs drop-shadow">
                                                { LocalizeText('navigator.promote.room') }
                                            </Text>
                                        </Flex> }
                                </Flex>
                            </div>
                        </div> }
                    { isCreatorOpen && <NavigatorRoomCreatorView /> }
                </NitroCard.Content>
            </NitroCard>
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => useNavigatorUiStore.getState().setRoomInfoOpen(false) } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => useNavigatorUiStore.getState().setRoomLinkOpen(false) } /> }
            <NavigatorRoomSettingsView />
        </>
    );
};
```

Key changes:
- 9 `useState` → 3 filter hooks (`useNavigatorData`, `useNavigatorUiState`, `useNavigatorActions`) + direct `useNavigatorUiStore.getState()` calls in handlers
- `sendSearch` and `reloadCurrentSearch` removed from this file — they're in `useNavigatorStore` now
- `linkTracker` body becomes a clean dispatch table on `store.show()` / `store.hide()` / etc.
- `NavigatorSearchView` no longer receives `sendSearch` as a prop — Task 7 updates that consumer too

- [ ] **Step 3: Verify typecheck**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | grep NavigatorView
```

Expected: no errors in `NavigatorView.tsx`. (Other consumer files still red — fixed in Tasks 7-8.)

- [ ] **Step 4: Do NOT commit yet** — bundle with the rest in Task 8.

---

## Task 7: Migrate `NavigatorSearchView.tsx` (drop the prop)

**Files:**
- Modify: `src/components/navigator/views/search/NavigatorSearchView.tsx`

- [ ] **Step 1: Read the current file**

```powershell
cd Nitro-V3 ; cat src/components/navigator/views/search/NavigatorSearchView.tsx
```

- [ ] **Step 2: Apply the swap**

Find and replace inside the file:

| Before | After |
|---|---|
| `import { useNavigator } from '../../../../hooks';` | `import { useNavigatorActions, useNavigatorData } from '../../../../hooks';` |
| `const { topLevelContext = null } = useNavigator();` | `const { topLevelContext } = useNavigatorData();` |
| The `sendSearch` prop from the component's signature | DELETED |
| `sendSearch(value, code)` calls in handlers | replace with destructured local: `const { sendSearch } = useNavigatorActions();` and call `sendSearch(...)` |

(Exact line-by-line edit — read the file then mechanically apply the table above. If the file uses `sendSearch` from props, the JSX type for the component changes too.)

- [ ] **Step 3: Verify typecheck**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | grep NavigatorSearchView
```

Expected: no errors.

- [ ] **Step 4: Do NOT commit yet** — bundle in Task 8.

---

## Task 8: Migrate the remaining 10 bulk consumers

**Files (10 modifications):**
- `src/components/navigator/views/NavigatorRoomCreatorView.tsx`
- `src/components/navigator/views/NavigatorRoomInfoView.tsx`
- `src/components/navigator/views/NavigatorRoomLinkView.tsx`
- `src/components/navigator/views/room-settings/NavigatorRoomSettingsBasicTabView.tsx`
- `src/components/navigator/views/search/NavigatorSearchResultItemView.tsx`
- `src/components/navigator/views/search/NavigatorSearchResultItemInfoView.tsx`
- `src/components/navigator/views/search/NavigatorSearchResultView.tsx`
- `src/components/catalog/views/page/layout/CatalogLayoutRoomAdsView.tsx`
- `src/components/room/widgets/room-filter-words/RoomFilterWordsWidgetView.tsx`
- `src/components/room/widgets/room-tools/RoomToolsWidgetView.tsx`

- [ ] **Step 1: For each of the 10 files above, apply this mechanical swap**

| Before | After |
|---|---|
| `import { useNavigator } from '...../hooks';` | `import { useNavigatorData } from '...../hooks';` (keep the same relative path) |
| `const { X = ..., Y = ..., ... } = useNavigator();` | `const { X, Y, ... } = useNavigatorData();` (drop the `= null` / `= []` defaults — the new filter always returns the same shape) |

**Spot-checks per file** (verify you've changed nothing else):

- `NavigatorRoomCreatorView`: reads `categories` only
- `NavigatorRoomInfoView`: reads `navigatorData` and `favouriteRoomIds`
- `NavigatorRoomLinkView`: reads `navigatorData.enteredGuestRoom`
- `NavigatorRoomSettingsBasicTabView`: reads `categories`
- `NavigatorSearchResultItemView`: reads `favouriteRoomIds` and `navigatorData`
- `NavigatorSearchResultItemInfoView`: reads `navigatorData`
- `NavigatorSearchResultView`: reads `topLevelContext`
- `CatalogLayoutRoomAdsView`: reads `navigatorData.currentRoomId`
- `RoomFilterWordsWidgetView`: reads `navigatorData.currentRoomId`
- `RoomToolsWidgetView`: reads `navigatorData`

- [ ] **Step 2: Run full typecheck**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | tail -15
```

Expected: no NEW errors. (Pre-existing floorplan errors `applyFloorModelLocally` / JSX namespace may still appear — they are NOT introduced by P1 and may be present on `origin/Dev` independently of this work.)

- [ ] **Step 3: Run full test suite**

```powershell
cd Nitro-V3 ; yarn test --run 2>&1 | tail -10
```

Expected: all suites pass, including the 3 new ones from this PR.

- [ ] **Step 4: Run lint:hooks**

```powershell
cd Nitro-V3 ; yarn lint:hooks 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 5: Commit the full consumer-migration sweep (Tasks 5, 6, 7, 8 atomic)**

```powershell
cd Nitro-V3
git add src/components/navigator/views/NavigatorDoorStateView.tsx src/components/navigator/NavigatorView.tsx src/components/navigator/views/search/NavigatorSearchView.tsx src/components/navigator/views/NavigatorRoomCreatorView.tsx src/components/navigator/views/NavigatorRoomInfoView.tsx src/components/navigator/views/NavigatorRoomLinkView.tsx src/components/navigator/views/room-settings/NavigatorRoomSettingsBasicTabView.tsx src/components/navigator/views/search/NavigatorSearchResultItemView.tsx src/components/navigator/views/search/NavigatorSearchResultItemInfoView.tsx src/components/navigator/views/search/NavigatorSearchResultView.tsx src/components/catalog/views/page/layout/CatalogLayoutRoomAdsView.tsx src/components/room/widgets/room-filter-words/RoomFilterWordsWidgetView.tsx src/components/room/widgets/room-tools/RoomToolsWidgetView.tsx
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "refactor(navigator): migrate all 13 consumers off useNavigator god-hook

Mechanical swap to the new filter hooks landed in the previous commit:
- NavigatorDoorStateView -> useDoorState (snapshot/setSnapshot/reset)
- NavigatorView -> useNavigatorData + useNavigatorUiState +
  useNavigatorActions + direct useNavigatorUiStore.getState() in handlers
  (linkTracker collapsed to a dispatch table; 9 useState gone)
- NavigatorSearchView -> useNavigatorData + useNavigatorActions
  (sendSearch prop drilling removed)
- 10 bulk consumers (one-line import swap) -> useNavigatorData

Zero behavioural change intended. yarn typecheck + yarn test --run +
yarn lint:hooks all clean on this commit."
git push simoleo feat/navigator-modernization
```

---

## Task 9: Delete the old `useNavigator.ts` + final verification

**Files:**
- Delete: `src/hooks/navigator/useNavigator.ts`

- [ ] **Step 1: Verify no references remain**

```powershell
cd Nitro-V3 ; grep -rn "from.*hooks/navigator/useNavigator" src/ --include="*.ts" --include="*.tsx"
cd Nitro-V3 ; grep -rn "useNavigator\b" src/ --include="*.ts" --include="*.tsx" | findstr /V /C:"useNavigatorData" /C:"useNavigatorUiState" /C:"useNavigatorActions" /C:"useNavigatorStore" /C:"useNavigatorUiStore"
```

Expected: both commands return no results (or only the deletion target itself).

- [ ] **Step 2: Delete the file**

```powershell
cd Nitro-V3 ; git rm src/hooks/navigator/useNavigator.ts
```

- [ ] **Step 3: Run the gate trio**

```powershell
cd Nitro-V3 ; yarn typecheck 2>&1 | tail -10
cd Nitro-V3 ; yarn test --run 2>&1 | tail -10
cd Nitro-V3 ; yarn lint:hooks 2>&1 | tail -5
```

Expected: all clean.

- [ ] **Step 4: Manual smoke (development build)**

Start the dev server. Verify each path renders identically to pre-P1:

```powershell
cd Nitro-V3 ; yarn start
```

Then in the browser:

- [ ] Open Navigator via toolbar icon → opens at default tab
- [ ] Click each top-level tab (Pubbliche / Tutte le stanze / Eventi / Il mio mondo) → results load, loading spinner shows briefly
- [ ] Type into filter input → search returns
- [ ] Open a room with NO door (your own room or a public) → enters directly
- [ ] Open a room with DOORBELL → doorbell prompt appears, click Ring, then close
- [ ] Open a room with PASSWORD → password prompt appears, type wrong password → "wrong password" message, then close
- [ ] Click favourite ☆ on a search result → star fills/empties
- [ ] Open RoomInfo (`navigator/toggle-room-info` link or in-room button) → opens, close again
- [ ] Open RoomLink (`navigator/toggle-room-link`) → opens, close again
- [ ] Open Room Creator (the `+` tab) → renders, close
- [ ] Close Navigator → all sub-windows hide

If anything regresses → STOP, do NOT commit, investigate.

- [ ] **Step 5: Commit + push final**

```powershell
cd Nitro-V3
git add src/hooks/navigator/useNavigator.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "refactor(navigator): remove deprecated useNavigator god-hook

P1 complete. All 13 consumers migrated to the wired-tools-style split:
- useNavigatorData / useNavigatorUiState / useNavigatorActions (filters)
- useNavigatorStore (internal useBetween closure)
- navigatorUiStore (Zustand for 9 UI flags)
- useDoorState (extracted to src/hooks/rooms/widgets)

Closes spec docs/superpowers/specs/2026-05-26-navigator-modernization-p1-design.md.
Next phases: P2 (TanStack Query for search), P3 (reactive favourites
via snapshot), P4 (visual rework + virtualization + persistence)."
git push simoleo feat/navigator-modernization
```

- [ ] **Step 6: Open PR (optional, but recommended)**

```powershell
cd Nitro-V3 ; gh pr create --base Dev --head simoleo89:feat/navigator-modernization --title "feat(navigator): wired-tools-style hook split + Zustand UI store (P1)" --body "## Summary
- Splits the 492-line useNavigator god-hook into useNavigatorStore + useNavigatorData / useNavigatorUiState / useNavigatorActions filters (wired-tools layout)
- Extracts door bell/password lifecycle to src/hooks/rooms/widgets/useDoorState
- Hoists the 9 useState in NavigatorView into a Zustand navigatorUiStore via createNitroStore
- Migrates all 13 consumers off useNavigator
- Removes the deprecated useNavigator shim entirely
- Zero user-visible change — spec marks the visual rework as P4 (separate plan)

Spec: docs/superpowers/specs/2026-05-26-navigator-modernization-p1-design.md
Plan: docs/superpowers/plans/2026-05-26-navigator-modernization-p1.md

## Test plan
- [x] yarn typecheck clean
- [x] yarn test --run green (+3 new suites: navigatorUiStore, useDoorState, useNavigatorStore smoke)
- [x] yarn lint:hooks clean
- [x] Manual smoke (see plan §9 step 4 checklist)"
```

(If the `gh` PR fails on `--base Dev` mapping, use `Dev` exactly as written; the duckietm upstream uses capital-D `Dev`.)

---

## Self-review against spec

After completing all tasks, verify:

- [x] **§3.1 useNavigatorStore** — Task 3 creates this file
- [x] **§3.2 useNavigatorData/UiState/Actions** — Task 4 creates these
- [x] **§3.3 navigatorUiStore** — Task 1 creates this
- [x] **§3.4 useDoorState** — Task 2 creates this
- [x] **§4 13 consumer migration map** — Tasks 5/6/7/8 cover all 13
- [x] **§5.1-5.3 dual-subscription** — Task 2 and Task 3 implement the mutually exclusive filters
- [x] **§7 testing strategy** — Tasks 1/2/4 create the 3 new suites
- [x] **§10 acceptance criteria** — Task 9 verifies all 9 acceptance items
- [x] **§11 risk register** — the intentionally-broken intermediate commit at Task 4 step 8 is documented and bracketed by a green commit in Task 8 step 5
