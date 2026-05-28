/* @vitest-environment jsdom */

import { FlatCreatedEvent, NavigatorSearchEvent,
    NavigatorSearchResultSet } from '@nitrots/nitro-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEventDispatcher } from '../../nitro-renderer.mock';
import { useNavigatorUiStore } from './navigatorUiStore';
import { useNavigatorSearch } from './useNavigatorSearch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh QueryClient with retries off so failures are immediate. */
const makeQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 }
        }
    });

/** Wrapper factory — each test gets its own QueryClient instance. */
const makeWrapper = (client: QueryClient) =>
    ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={ client }>
            { children }
        </QueryClientProvider>
    );

/** Build a fake NavigatorSearchEvent that getParser() returns a result with `code`. */
const makeSearchEvent = (code: string) =>
{
    // Cast constructors as `any` so tsgo doesn't check required args against
    // the real renderer SDK types (the mock stubs have no required args).
    const result = new (NavigatorSearchResultSet as any)() as any;
    result.code = code;
    result.data = '';
    result.results = [];

    const ev = new (NavigatorSearchEvent as any)() as any;
    ev.getParser = () => ({ result });
    return ev;
};

const INITIAL_UI = {
    isVisible: false,
    isReady: false,
    isCreatorOpen: false,
    isRoomInfoOpen: false,
    isRoomLinkOpen: false,
    isOpenSavesSearches: false,
    isLoading: false,
    needsInit: true,
    needsSearch: false,
    currentTabCode: '',
    currentFilter: ''
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNavigatorSearch', () =>
{
    beforeEach(() =>
    {
        // Reset UI store state before each test
        useNavigatorUiStore.setState(INITIAL_UI);
    });

    afterEach(() =>
    {
        cleanup();
        vi.clearAllMocks();
    });

    it('1. with empty tabCode query is disabled — NavigatorSearchEvent does not update data', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        // Dispatch a search event — should be ignored (query disabled)
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });

        // Data must stay null
        expect(result.current.searchResult).toBeNull();
        expect(result.current.isFetching).toBe(false);
    });

    it('2. after setTab("public"), NavigatorSearchComposer is fired and NavigatorSearchEvent resolves query', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        // Activate the query
        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
        });

        // Hook should start fetching
        await waitFor(() => expect(result.current.isFetching).toBe(true));

        // Simulate server response
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });

        // Query should resolve with the matching result
        await waitFor(() => expect(result.current.searchResult).not.toBeNull());
        expect((result.current.searchResult as any).code).toBe('public');
        expect(result.current.isFetching).toBe(false);
    });

    it('3. after setFilter("cocco"), a new query fires and NavigatorSearchEvent resolves it', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        // First establish a tab
        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
        });
        // Resolve the initial query
        await waitFor(() => expect(result.current.isFetching).toBe(true));
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });
        await waitFor(() => expect(result.current.isFetching).toBe(false));

        // Now set a filter — triggers new query
        act(() =>
        {
            useNavigatorUiStore.getState().setFilter('cocco');
        });

        await waitFor(() => expect(result.current.isFetching).toBe(true));

        // Resolve with matching event
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });

        await waitFor(() => expect(result.current.isFetching).toBe(false));
        expect((result.current.searchResult as any).code).toBe('public');

        // Confirm filter is set
        expect(useNavigatorUiStore.getState().currentFilter).toBe('cocco');
    });

    it('4. after setTab("events"), currentFilter resets to "" and new query fires for events', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        // Establish public tab with a filter
        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
            useNavigatorUiStore.getState().setFilter('some-filter');
        });

        // Resolve the public+filter query
        await waitFor(() => expect(result.current.isFetching).toBe(true));
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });
        await waitFor(() => expect(result.current.isFetching).toBe(false));

        // Switch to events tab — should atomically reset filter
        act(() =>
        {
            useNavigatorUiStore.getState().setTab('events');
        });

        // Filter must be cleared
        expect(useNavigatorUiStore.getState().currentFilter).toBe('');
        expect(useNavigatorUiStore.getState().currentTabCode).toBe('events');

        // New query for 'events' fires
        await waitFor(() => expect(result.current.isFetching).toBe(true));

        // Resolve with events result
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('events') as any);
        });

        await waitFor(() => expect(result.current.isFetching).toBe(false));
        expect((result.current.searchResult as any).code).toBe('events');
    });

    it('5. NavigatorSearchEvent with result.code === currentTabCode is accepted and updates data', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
        });

        await waitFor(() => expect(result.current.isFetching).toBe(true));

        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });

        await waitFor(() =>
        {
            expect(result.current.searchResult).not.toBeNull();
            expect((result.current.searchResult as any).code).toBe('public');
        });
    });

    it('6. NavigatorSearchEvent with result.code !== currentTabCode is REJECTED — data unchanged', async () =>
    {
        const client = makeQueryClient();
        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
        });

        await waitFor(() => expect(result.current.isFetching).toBe(true));

        // Dispatch an event for a DIFFERENT tab — should be rejected by accept filter
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('wrong_tab') as any);
        });

        // Still fetching — the wrong-tab event was ignored
        // (the query promise stays pending until it times out or a matching event arrives)
        // After the wrong-tab dispatch, data should NOT be updated
        expect(result.current.searchResult).toBeNull();

        // Now dispatch the correct one to unblock the test
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });

        await waitFor(() => expect(result.current.searchResult).not.toBeNull());
        // Only the correct-tab result is stored
        expect((result.current.searchResult as any).code).toBe('public');
    });

    it('7. dispatching FlatCreatedEvent triggers query invalidation (refetch starts)', async () =>
    {
        const client = makeQueryClient();

        // Spy on invalidateQueries to confirm the invalidator calls it
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

        const { result } = renderHook(() => useNavigatorSearch(), { wrapper: makeWrapper(client) });

        // Establish a resolved query so there is something to invalidate
        act(() =>
        {
            useNavigatorUiStore.getState().setTab('public');
        });
        await waitFor(() => expect(result.current.isFetching).toBe(true));
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeSearchEvent('public') as any);
        });
        await waitFor(() => expect(result.current.isFetching).toBe(false));

        // Dispatch FlatCreatedEvent — should trigger invalidateQueries
        const flatCreatedEv = new (FlatCreatedEvent as any)() as any;
        flatCreatedEv.getParser = () => ({ roomId: 999 });
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(flatCreatedEv as any);
        });

        await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

        // The invalidation should target the 'navigator', 'search' key prefix
        const calls = invalidateSpy.mock.calls;
        const calledWithSearchKey = calls.some(call =>
        {
            const opts = call[0] as any;
            const key: string[] = opts?.queryKey ?? [];
            return key[0] === 'navigator' && key[1] === 'search';
        });
        expect(calledWithSearchKey).toBe(true);
    });
});
