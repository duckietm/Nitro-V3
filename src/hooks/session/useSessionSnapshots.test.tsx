/* @vitest-environment jsdom */

import { cleanup, render, renderHook } from '@testing-library/react';
import { Component, ReactNode, useSyncExternalStore } from 'react';
import { useBetween } from 'use-between';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
