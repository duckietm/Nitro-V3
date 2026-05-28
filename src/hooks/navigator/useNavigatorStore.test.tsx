import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNavigatorData, useNavigatorUiState } from './index';

describe('navigator filter shapes (smoke)', () =>
{
    it('useNavigatorData returns the documented keys', () =>
    {
        const { result } = renderHook(() => useNavigatorData());
        expect(Object.keys(result.current).sort()).toEqual([
            'categories', 'eventCategories', 'favouriteRoomIds',
            'navigatorData', 'navigatorSearches',
            'topLevelContext', 'topLevelContexts'
        ].sort());
    });

    it('useNavigatorUiState returns the 11 documented flags', () =>
    {
        const { result } = renderHook(() => useNavigatorUiState());
        expect(Object.keys(result.current).sort()).toEqual([
            'currentFilter', 'currentTabCode',
            'isCreatorOpen', 'isLoading', 'isOpenSavesSearches',
            'isReady', 'isRoomInfoOpen', 'isRoomLinkOpen', 'isVisible',
            'needsInit', 'needsSearch'
        ].sort());
    });
});
