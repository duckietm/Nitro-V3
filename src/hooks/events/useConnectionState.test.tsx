import { GetCommunication, IConnectionStateSnapshot, NitroEventType } from '@nitrots/nitro-renderer';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMockEventDispatcher, mockEventDispatcher } from '../../nitro-renderer.mock';
import { useConnectionState } from './useConnectionState';

describe('useConnectionState', () => {
    let snapshot: IConnectionStateSnapshot;

    beforeEach(() => {
        clearMockEventDispatcher();
        snapshot = {
            phase: 'disconnected',
            reconnectAttempt: 0,
            maxReconnectAttempts: 7,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        };
        vi.mocked(GetCommunication).mockReturnValue({ connection: { get connectionState() { return snapshot; } } } as never);
    });

    it('rereads the authoritative snapshot when the renderer notifies a change', () => {
        const { result } = renderHook(() => useConnectionState());

        snapshot = { ...snapshot, phase: 'reconnecting', reconnectAttempt: 2 };
        act(() => mockEventDispatcher.dispatchEvent({ type: NitroEventType.CONNECTION_STATE_CHANGED }));

        expect(result.current).toBe(snapshot);
        expect(result.current.phase).toBe('reconnecting');
        expect(result.current.reconnectAttempt).toBe(2);
    });
});
