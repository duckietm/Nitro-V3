import { describe, expect, it } from 'vitest';
import { getConnectionFailureAction, getReconnectPresentation } from './connectionStateUi.helpers';

describe('connection state UI decisions', () => {
    it('shows reconnect progress through transport and reauthentication phases', () => {
        expect(getReconnectPresentation({ phase: 'reconnecting', reconnectAttempt: 2, maxReconnectAttempts: 7 })).toEqual({
            isReconnecting: true,
            hasFailed: false,
            attempt: 2,
            maxAttempts: 7
        });
        expect(getReconnectPresentation({ phase: 'reauthenticating', reconnectAttempt: 0, maxReconnectAttempts: 7 }).isReconnecting).toBe(true);
    });

    it('shows terminal failure only for the failed phase', () => {
        expect(getReconnectPresentation({ phase: 'failed', reconnectAttempt: 7, maxReconnectAttempts: 7 }).hasFailed).toBe(true);
        expect(getReconnectPresentation({ phase: 'connected', reconnectAttempt: 0, maxReconnectAttempts: 7 }).hasFailed).toBe(false);
    });

    it('ignores initial disconnected state and active reconnects', () => {
        expect(getConnectionFailureAction('disconnected', 'disconnected', false)).toBe('none');
        expect(getConnectionFailureAction('failed', 'failed', false)).toBe('none');
        expect(getConnectionFailureAction('connected', 'reconnecting', true)).toBe('none');
    });

    it('routes real failures according to whether the hotel was ready', () => {
        expect(getConnectionFailureAction('authenticating', 'disconnected', false)).toBe('login');
        expect(getConnectionFailureAction('connected', 'failed', true)).toBe('expired');
        expect(getConnectionFailureAction('authenticating', 'failed', false)).toBe('login');
    });
});
