/* @vitest-environment jsdom */

import { act, cleanup, render, renderHook } from '@testing-library/react';
import { Component, ReactNode, useSyncExternalStore } from 'react';
import { useBetween } from 'use-between';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetEventDispatcher, GetSessionDataManager } from '../../nitro-renderer.mock';
import { useHasPermission, usePermissionValue, useUserPermissions, useUserRank } from './useSessionSnapshots';

// Regression guard for the rolled-back snapshot-consumer migration.
//
// `use-between` (v1.x) ships its own dispatcher that proxies a subset of
// React hooks (useState, useReducer, useEffect, useLayoutEffect,
// useCallback, useMemo, useRef, useImperativeHandle). It does NOT
// implement `useSyncExternalStore`. When a state function runs inside
// `useBetween(stateFn)` and that state function calls
// `useSyncExternalStore` (directly or via a wrapper like
// `useExternalSnapshot` / `useUserDataSnapshot`), React resolves the
// dispatcher to use-between's proxy, finds `useSyncExternalStore`
// missing, and throws "(intermediate value)() is undefined" on the
// first render — that's the exact production error reported at
// ToolbarView.tsx:46 last session.
//
// The fix is structural: snapshot hooks must run OUTSIDE the useBetween
// scope (i.e. in the exported wrapper, not in the inner state
// function). These tests pin the constraint so a future migration
// doesn't reintroduce the broken pattern.

class CaptureBoundary extends Component<{ children: ReactNode }, { error: Error | null }>
{
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error)
    {
        return { error };
    }

    componentDidCatch()
    {
    }

    render()
    {
        return this.state.error ? null : this.props.children;
    }
}

describe('use-between + useSyncExternalStore incompatibility', () =>
{
    afterEach(() =>
    {
        cleanup();
    });

    it('crashes when useSyncExternalStore is called inside a useBetween scope', () =>
    {
        // React 19 logs every render-time error to console.error before
        // forwarding to the error boundary. Suppress the noise to keep
        // the test output readable, then assert the error fingerprint.
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const Broken = () =>
        {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: this test asserts the runtime crash
            useBetween(() => useSyncExternalStore(() => () => undefined, () => 'v', () => 'v'));
            return null;
        };

        let captured: Error | null = null;
        const boundaryRef = (instance: CaptureBoundary | null) =>
        {
            if(instance) captured = instance.state.error;
        };

        render(
            <CaptureBoundary ref={boundaryRef as any}>
                <Broken />
            </CaptureBoundary>
        );

        expect(captured).not.toBeNull();
        expect(captured!.message).toMatch(/useSyncExternalStore is not a function|intermediate value/);

        consoleError.mockRestore();
    });

    it('works when useSyncExternalStore is called OUTSIDE the useBetween scope', () =>
    {
        const sharedState = () => ({ count: 0 });

        // Lowercase intentionally — this is a custom hook named like a
        // regular function so the test reproduces the exact call shape
        // a refactor might land on. The eslint disable below silences
        // the "hooks must start with use" lint that flags the body.
        const safeHook = () =>
        {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: function named like a hook to mirror real call sites
            const shared = useBetween(sharedState);
            // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: same reason as above
            const external = useSyncExternalStore(() => () => undefined, () => 'value', () => 'value');

            return { ...shared, external };
        };

        const { result } = renderHook(() => safeHook());

        expect(result.current.external).toBe('value');
        expect(result.current.count).toBe(0);
    });
});

// ============================================================================
// Permission-driven API — useHasPermission / usePermissionValue /
// useUserPermissions / useUserRank (display).
//
// Wire-fed by Arcturus' UserPermissionsMapComposer (resolved against
// permission_definitions for the user's rank) + the legacy
// UserPermissionsComposer (clubLevel/securityLevel/isAmbassador + rank
// metadata extension). The renderer's SessionDataManager keeps two
// snapshots: userDataSnapshot (display info) and permissionsSnapshot
// (gating). Tests fake both sides.
// ============================================================================

const makeFakeDispatcher = () =>
{
    const listeners = new Map<string, Set<() => void>>();

    return {
        subscribe(type: string, cb: () => void): () => void
        {
            let bucket = listeners.get(type);
            if(!bucket)
            {
                bucket = new Set();
                listeners.set(type, bucket);
            }
            bucket.add(cb);
            return () => bucket!.delete(cb);
        },
        dispatch(type: string): void
        {
            listeners.get(type)?.forEach(cb => cb());
        }
    };
};

interface FakeUserSnapshot
{
    securityLevel: number;
    rankId: number;
    rankName: string;
    rankBadge: string;
    rankPrefix: string;
    rankPrefixColor: string;
}

const makeUserSnapshot = (overrides: Partial<FakeUserSnapshot> = {}): FakeUserSnapshot => ({
    securityLevel: 0,
    rankId: 0,
    rankName: '',
    rankBadge: '',
    rankPrefix: '',
    rankPrefixColor: '',
    ...overrides
});

describe('useHasPermission + usePermissionValue + useUserPermissions', () =>
{
    let userSnapshot: FakeUserSnapshot;
    let permissionsSnapshot: ReadonlyMap<string, number>;
    let fakeDispatcher: ReturnType<typeof makeFakeDispatcher>;

    beforeEach(() =>
    {
        userSnapshot = makeUserSnapshot();
        permissionsSnapshot = new Map();
        fakeDispatcher = makeFakeDispatcher();

        vi.mocked(GetSessionDataManager).mockReturnValue({
            getUserDataSnapshot: () => userSnapshot,
            getPermissionsSnapshot: () => permissionsSnapshot
        } as any);

        vi.mocked(GetEventDispatcher).mockReturnValue(fakeDispatcher as any);
    });

    afterEach(() =>
    {
        cleanup();
        vi.mocked(GetSessionDataManager).mockReset();
        vi.mocked(GetEventDispatcher).mockReset();
    });

    it('useUserRank surfaces rank metadata for presentational use', () =>
    {
        userSnapshot = makeUserSnapshot({
            securityLevel: 5,
            rankId: 5,
            rankName: 'Moderator',
            rankBadge: 'ADM',
            rankPrefix: '[MOD]',
            rankPrefixColor: '#327fa8'
        });

        const { result } = renderHook(() => useUserRank());

        expect(result.current).toEqual({
            id: 5,
            name: 'Moderator',
            level: 5,
            badge: 'ADM',
            prefix: '[MOD]',
            prefixColor: '#327fa8'
        });
    });

    it('useHasPermission returns true only for ALLOWED (value 1), false for ROOM_OWNER/absent/zero', () =>
    {
        permissionsSnapshot = new Map([
            [ 'acc_supporttool', 1 ],     // ALLOWED
            [ 'acc_anyroomowner', 2 ],    // ROOM_OWNER — requires room ownership at call time
            [ 'acc_closedice_room', 0 ]   // DISALLOWED (shouldn't reach the client, but defensive)
        ]);

        // ALLOWED → true. Matches Habbo.hasPermission(key) which calls
        // Rank.hasPermission(key, false) → only ALLOWED short-circuits.
        expect(renderHook(() => useHasPermission('acc_supporttool')).result.current).toBe(true);

        // ROOM_OWNER → false. The server-side check requires the
        // caller to pass isRoomOwner=true, which the client doesn't
        // have ambiently. Code that needs to combine this with the
        // active room session should call usePermissionValue(key) and
        // check === 2 alongside roomSession.isRoomOwner.
        expect(renderHook(() => useHasPermission('acc_anyroomowner')).result.current).toBe(false);

        expect(renderHook(() => useHasPermission('acc_closedice_room')).result.current).toBe(false);
        expect(renderHook(() => useHasPermission('acc_unknown_key')).result.current).toBe(false);
    });

    it('usePermissionValue returns the raw integer (or 0 if absent)', () =>
    {
        permissionsSnapshot = new Map([
            [ 'acc_supporttool', 1 ],
            [ 'acc_anyroomowner', 2 ]
        ]);

        expect(renderHook(() => usePermissionValue('acc_supporttool')).result.current).toBe(1);
        expect(renderHook(() => usePermissionValue('acc_anyroomowner')).result.current).toBe(2);
        expect(renderHook(() => usePermissionValue('acc_missing')).result.current).toBe(0);
    });

    it('useUserPermissions exposes the full map', () =>
    {
        permissionsSnapshot = new Map([ [ 'acc_supporttool', 1 ], [ 'acc_ambassador', 1 ] ]);

        const { result } = renderHook(() => useUserPermissions());

        expect(result.current.size).toBe(2);
        expect(result.current.get('acc_supporttool')).toBe(1);
        expect(result.current.get('acc_ambassador')).toBe(1);
    });

    it('re-renders when USER_PERMISSIONS_UPDATED fires after a runtime promote', () =>
    {
        permissionsSnapshot = new Map();
        const { result } = renderHook(() => useHasPermission('acc_supporttool'));
        expect(result.current).toBe(false);

        act(() =>
        {
            // Renderer invariant: every invalidation produces a NEW
            // map reference. The mock's NitroEventType proxy resolves
            // any property to `mock:NitroEventType:<PROP>`, so that's
            // the wire string useSessionSnapshots subscribes against.
            permissionsSnapshot = new Map([ [ 'acc_supporttool', 1 ] ]);
            fakeDispatcher.dispatch('mock:NitroEventType:USER_PERMISSIONS_UPDATED');
        });

        expect(result.current).toBe(true);
    });
});
