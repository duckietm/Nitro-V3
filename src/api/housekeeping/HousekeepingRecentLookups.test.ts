import { describe, expect, it } from 'vitest';
import { pushRecentLookup, RECENT_LOOKUPS_LIMIT, RecentLookupEntry } from './HousekeepingRecentLookups';

const entry = (over: Partial<RecentLookupEntry> = {}): RecentLookupEntry => ({
    kind: 'user',
    id: 1,
    label: 'alice',
    at: 1,
    ...over
});

describe('pushRecentLookup', () => {
    it('prepends a new entry to an empty list', () => {
        const next = pushRecentLookup([], entry({ id: 7, label: 'bob' }));

        expect(next).toHaveLength(1);
        expect(next[0].id).toBe(7);
    });

    it('moves an existing entry of the same kind+id to the front (and refreshes the timestamp)', () => {
        const initial: RecentLookupEntry[] = [entry({ kind: 'user', id: 1, label: 'alice', at: 1 }), entry({ kind: 'user', id: 2, label: 'bob', at: 2 })];
        const next = pushRecentLookup(initial, entry({ kind: 'user', id: 2, label: 'bob', at: 99 }));

        expect(next.map((e) => e.id)).toEqual([2, 1]);
        expect(next[0].at).toBe(99);
    });

    it('does NOT dedupe across kinds (user #1 and room #1 are distinct)', () => {
        const next = pushRecentLookup([entry({ kind: 'user', id: 1 })], entry({ kind: 'room', id: 1, label: 'lobby' }));

        expect(next).toHaveLength(2);
        expect(next[0].kind).toBe('room');
        expect(next[1].kind).toBe('user');
    });

    it('trims past the limit by dropping the tail entry (caller invariant: newest at index 0, oldest at the end)', () => {
        // Build the initial list in store-order: index 0 is the most-recently-pushed
        // entry, index N-1 is the oldest. id=1 has the FRESHEST `at`, id=N has the OLDEST.
        const initial: RecentLookupEntry[] = Array.from({ length: RECENT_LOOKUPS_LIMIT }, (_, i) =>
            entry({ kind: 'user', id: i + 1, label: `u${i + 1}`, at: RECENT_LOOKUPS_LIMIT - i })
        );
        const tailId = initial[initial.length - 1].id;
        const next = pushRecentLookup(initial, entry({ kind: 'user', id: 999, label: 'new', at: 1000 }));

        expect(next).toHaveLength(RECENT_LOOKUPS_LIMIT);
        expect(next[0].id).toBe(999);
        // The tail entry (the oldest, by store invariant) is the one that falls off
        expect(next.find((e) => e.id === tailId)).toBeUndefined();
        // The head of the previous list is still around, now at index 1
        expect(next[1].id).toBe(initial[0].id);
    });
});
