import { describe, expect, it } from 'vitest';
import { formatMentionTime, getMentionDateGroup } from './mentionsFormat';

// Fixed reference "now": 2026-06-02 14:30 local time.
const NOW = new Date(2026, 5, 2, 14, 30, 0);
const at = (y: number, mo: number, d: number, h = 12, mi = 0): number => Math.floor(new Date(y, mo, d, h, mi, 0).getTime() / 1000);

describe('getMentionDateGroup', () => {
    it('buckets same-day as today', () => {
        expect(getMentionDateGroup(at(2026, 5, 2, 9, 15), NOW)).toBe('today');
    });

    it('buckets previous day as yesterday', () => {
        expect(getMentionDateGroup(at(2026, 5, 1, 23, 59), NOW)).toBe('yesterday');
    });

    it('buckets two+ days ago as older', () => {
        expect(getMentionDateGroup(at(2026, 4, 28, 10, 0), NOW)).toBe('older');
    });

    it('treats missing/zero timestamp as older', () => {
        expect(getMentionDateGroup(0, NOW)).toBe('older');
    });
});

describe('formatMentionTime', () => {
    it('shows HH:MM (zero-padded) for today', () => {
        expect(formatMentionTime(at(2026, 5, 2, 9, 5), NOW)).toBe('09:05');
    });

    it('shows HH:MM for yesterday', () => {
        expect(formatMentionTime(at(2026, 5, 1, 18, 45), NOW)).toBe('18:45');
    });

    it('shows DD-MM for older entries', () => {
        expect(formatMentionTime(at(2026, 4, 28, 10, 0), NOW)).toBe('28-05');
    });

    it('returns empty string for missing timestamp', () => {
        expect(formatMentionTime(0, NOW)).toBe('');
    });
});
