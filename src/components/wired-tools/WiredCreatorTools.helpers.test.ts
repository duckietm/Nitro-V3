import { describe, expect, it } from 'vitest';
import {
    createEmptyMonitorSnapshot,
    formatMonitorHistoryOccurrence,
    formatMonitorLatestOccurrence,
    formatMonitorSource,
    formatVariableTimestamp,
    normalizeMonitorReason
} from './WiredCreatorTools.helpers';

describe('WiredCreatorTools helpers', () =>
{
    describe('createEmptyMonitorSnapshot', () =>
    {
        it('returns a zeroed-out snapshot with empty logs and history arrays', () =>
        {
            const snap = createEmptyMonitorSnapshot();

            expect(snap.usageCurrentWindow).toBe(0);
            expect(snap.usageLimitPerWindow).toBe(0);
            expect(snap.isHeavy).toBe(false);
            expect(snap.killedRemainingSeconds).toBe(0);
            expect(snap.logs).toEqual([]);
            expect(snap.history).toEqual([]);
        });

        it('returns fresh arrays each call (no shared state)', () =>
        {
            const a = createEmptyMonitorSnapshot();
            const b = createEmptyMonitorSnapshot();

            expect(a.logs).not.toBe(b.logs);
            expect(a.history).not.toBe(b.history);
        });
    });

    describe('formatMonitorLatestOccurrence', () =>
    {
        const NOW = 1_700_000_000_000;

        it('returns "/" when no occurrence has been recorded yet', () =>
        {
            expect(formatMonitorLatestOccurrence(0, NOW)).toBe('/');
            expect(formatMonitorLatestOccurrence(-1, NOW)).toBe('/');
        });

        it('returns "Just now" for diffs under 5 seconds', () =>
        {
            const occurredAt = NOW / 1000;
            expect(formatMonitorLatestOccurrence(occurredAt, NOW)).toBe('Just now');
        });

        it('returns "<n>s ago" for diffs under a minute', () =>
        {
            const tenSecondsAgo = (NOW - 10_000) / 1000;
            expect(formatMonitorLatestOccurrence(tenSecondsAgo, NOW)).toBe('10s ago');
        });

        it('returns "<n>m ago" for diffs under an hour', () =>
        {
            const fiveMinutesAgo = (NOW - 5 * 60 * 1000) / 1000;
            expect(formatMonitorLatestOccurrence(fiveMinutesAgo, NOW)).toBe('5m ago');
        });

        it('returns "<n>h ago" for diffs under a day', () =>
        {
            const threeHoursAgo = (NOW - 3 * 60 * 60 * 1000) / 1000;
            expect(formatMonitorLatestOccurrence(threeHoursAgo, NOW)).toBe('3h ago');
        });

        it('returns "<n>d ago" for older diffs', () =>
        {
            const twoDaysAgo = (NOW - 2 * 24 * 60 * 60 * 1000) / 1000;
            expect(formatMonitorLatestOccurrence(twoDaysAgo, NOW)).toBe('2d ago');
        });
    });

    describe('formatMonitorHistoryOccurrence', () =>
    {
        it('returns "/" for non-positive timestamps', () =>
        {
            expect(formatMonitorHistoryOccurrence(0)).toBe('/');
            expect(formatMonitorHistoryOccurrence(-5)).toBe('/');
        });

        it('returns a non-empty formatted string for a real timestamp', () =>
        {
            const out = formatMonitorHistoryOccurrence(1_700_000_000);
            expect(out).not.toBe('/');
            expect(out.length).toBeGreaterThan(0);
        });
    });

    describe('formatVariableTimestamp', () =>
    {
        it('returns "/" for zero, negative, or falsy values', () =>
        {
            expect(formatVariableTimestamp(0)).toBe('/');
            expect(formatVariableTimestamp(-1)).toBe('/');
            expect(formatVariableTimestamp(null)).toBe('/');
        });

        it('formats a positive epoch-seconds value as a locale string', () =>
        {
            const out = formatVariableTimestamp(1_700_000_000);
            expect(out).not.toBe('/');
            expect(out.length).toBeGreaterThan(0);
        });
    });

    describe('formatMonitorSource', () =>
    {
        it('falls back to "Room monitor" when both label and id are missing', () =>
        {
            expect(formatMonitorSource('', 0)).toBe('Room monitor');
            expect(formatMonitorSource('', -1)).toBe('Room monitor');
        });

        it('returns just the label when there is no source id', () =>
        {
            expect(formatMonitorSource('wired-trigger', 0)).toBe('wired-trigger');
        });

        it('appends "(#<id>)" when source id is positive', () =>
        {
            expect(formatMonitorSource('on-walk', 42)).toBe('on-walk (#42)');
        });

        it('uses "wired" as default label when only the id is set', () =>
        {
            expect(formatMonitorSource('', 7)).toBe('wired (#7)');
        });
    });

    describe('normalizeMonitorReason', () =>
    {
        it('returns the trimmed reason when one is provided', () =>
        {
            expect(normalizeMonitorReason('  loop detected  ')).toBe('loop detected');
        });

        it('falls back to a placeholder when the reason is empty or whitespace', () =>
        {
            expect(normalizeMonitorReason('')).toContain('No detailed reason');
            expect(normalizeMonitorReason('   ')).toContain('No detailed reason');
            expect(normalizeMonitorReason(null)).toContain('No detailed reason');
        });
    });
});
