/**
 * Strips duplicate badge codes from a server-supplied badge array,
 * preserving slot indices: a duplicate is replaced by an empty string
 * rather than shifted out, so badge[i] still corresponds to slot i.
 *
 * Empty / falsy entries are normalized to '' (some servers emit null
 * inside the array for unused slots).
 */
export const dedupeBadges = (badges: ReadonlyArray<string>): string[] => {
    const seen = new Set<string>();

    return badges.map((code) => {
        if (!code || seen.has(code)) return '';

        seen.add(code);

        return code;
    });
};
