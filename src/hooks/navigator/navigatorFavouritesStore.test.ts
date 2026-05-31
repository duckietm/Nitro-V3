import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigatorFavouritesStore } from './navigatorFavouritesStore';

const reset = () => useNavigatorFavouritesStore.setState({ ids: new Set<number>() });

describe('navigatorFavouritesStore', () =>
{
    beforeEach(reset);

    it('setAll replaces membership and coerces ids to numbers', () =>
    {
        useNavigatorFavouritesStore.getState().setAll([ '1', 2, '3' ] as any);
        const { ids } = useNavigatorFavouritesStore.getState();
        expect(ids.has(1)).toBe(true);
        expect(ids.has(2)).toBe(true);
        expect(ids.has(3)).toBe(true);
        expect(ids.size).toBe(3);
    });

    it('apply(true) adds and apply(false) removes', () =>
    {
        const { apply } = useNavigatorFavouritesStore.getState();
        apply(7, true);
        expect(useNavigatorFavouritesStore.getState().ids.has(7)).toBe(true);
        apply(7, false);
        expect(useNavigatorFavouritesStore.getState().ids.has(7)).toBe(false);
    });

    it('apply returns the same state reference when nothing changes (no needless re-render)', () =>
    {
        useNavigatorFavouritesStore.getState().setAll([ 5 ]);
        const before = useNavigatorFavouritesStore.getState().ids;
        useNavigatorFavouritesStore.getState().apply(5, true); // already present
        expect(useNavigatorFavouritesStore.getState().ids).toBe(before);
        useNavigatorFavouritesStore.getState().apply(99, false); // already absent
        expect(useNavigatorFavouritesStore.getState().ids).toBe(before);
    });

    it('apply creates a new Set reference when membership actually changes', () =>
    {
        useNavigatorFavouritesStore.getState().setAll([ 5 ]);
        const before = useNavigatorFavouritesStore.getState().ids;
        useNavigatorFavouritesStore.getState().apply(6, true);
        expect(useNavigatorFavouritesStore.getState().ids).not.toBe(before);
    });
});
