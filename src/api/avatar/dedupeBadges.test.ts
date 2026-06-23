import { describe, expect, it } from 'vitest';
import { dedupeBadges } from './dedupeBadges';

describe('dedupeBadges', () => {
    it('returns an empty array for an empty input', () => {
        expect(dedupeBadges([])).toEqual([]);
    });

    it('preserves unique badges in slot order', () => {
        expect(dedupeBadges(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('replaces duplicate slots with empty strings to preserve slot indices', () => {
        expect(dedupeBadges(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', '', 'c']);
    });

    it('normalizes falsy entries (null, undefined, "") to empty string', () => {
        // server sometimes returns null/undefined for unused slots
        const input = ['a', null as unknown as string, '', undefined as unknown as string, 'b'];

        expect(dedupeBadges(input)).toEqual(['a', '', '', '', 'b']);
    });

    it('only keeps the FIRST occurrence of each unique code', () => {
        expect(dedupeBadges(['a', 'a', 'a'])).toEqual(['a', '', '']);
    });

    it('is order-sensitive: identical multisets but different orderings yield different outputs', () => {
        expect(dedupeBadges(['a', 'b', 'a'])).toEqual(['a', 'b', '']);
        expect(dedupeBadges(['b', 'a', 'a'])).toEqual(['b', 'a', '']);
    });
});
