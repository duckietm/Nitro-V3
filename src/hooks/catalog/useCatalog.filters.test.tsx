/* @vitest-environment jsdom */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// `useCatalogStore` mounts ~30 useState calls, opens a fresh
// RoomPreviewer, subscribes to a dozen renderer message events, and
// reaches into `useNotification()` for the alert helpers — too much
// surface to render under jsdom and not what these tests are about.
//
// We just want to lock down the *contract* of the three filters
// (`useCatalogData` / `useCatalogUiState` / `useCatalogActions`) and
// the shim: each one must read its specific subset of keys from the
// same `useBetween` singleton.
//
// Stub `use-between` so all four hooks share one deterministic store
// object. `vi.hoisted` lets us reference the fake from the mock
// factory (which is itself hoisted).

const { fakeStore } = vi.hoisted(() => {
    const fakeStore = {
        // Data slice
        isBusy: false,
        rootNode: null,
        offersToNodes: null,
        currentPage: null,
        currentOffer: null,
        frontPageItems: [],
        searchResult: null,
        roomPreviewer: null,
        catalogLocalizationVersion: 0,
        furniCount: 0,
        furniLimit: 0,
        maxFurniLimit: 0,
        secondsLeft: 0,
        secondsLeftWithGrace: 0,
        updateTime: 0,
        // UiState slice
        isVisible: false,
        setIsVisible: vi.fn(),
        pageId: -1,
        previousPageId: -1,
        currentType: 'NORMAL',
        activeNodes: [] as any[],
        navigationHidden: false,
        setNavigationHidden: vi.fn(),
        purchaseOptions: { quantity: 1 },
        setPurchaseOptions: vi.fn(),
        catalogPlaceMultipleObjects: false,
        setCatalogPlaceMultipleObjects: vi.fn(),
        setCurrentPage: vi.fn(),
        setCurrentOffer: vi.fn(),
        setSearchResult: vi.fn(),
        // Actions slice
        openCatalogByType: vi.fn(),
        toggleCatalogByType: vi.fn(),
        activateNode: vi.fn(),
        openPageById: vi.fn(),
        openPageByName: vi.fn(),
        openPageByOfferId: vi.fn(),
        requestOfferToMover: vi.fn(),
        selectCatalogOffer: vi.fn(),
        getNodeById: vi.fn(),
        getNodeByName: vi.fn(),
        getNodesByOfferId: vi.fn(),
        getBuilderFurniPlaceableStatus: vi.fn()
    };

    return { fakeStore };
});

vi.mock('use-between', () => ({
    useBetween: () => fakeStore
}));

// Import AFTER the mock is set up. The hooks resolve `useBetween` at
// import time via the module graph, so the order matters.
import { useCatalogActions, useCatalogData, useCatalogUiState } from './useCatalog';

describe('useCatalog filter contract', () => {
    it('useCatalogData returns the read-only data slice', () => {
        const { result } = renderHook(() => useCatalogData());

        expect(Object.keys(result.current).sort()).toEqual([
            'catalogLocalizationVersion',
            'currentOffer',
            'currentPage',
            'frontPageItems',
            'furniCount',
            'furniLimit',
            'isBusy',
            'maxFurniLimit',
            'offersToNodes',
            'roomPreviewer',
            'rootNode',
            'searchResult',
            'secondsLeft',
            'secondsLeftWithGrace',
            'updateTime'
        ]);

        // Reads point at the same underlying values.
        expect(result.current.rootNode).toBe(fakeStore.rootNode);
        expect(result.current.furniCount).toBe(fakeStore.furniCount);
        expect(result.current.frontPageItems).toBe(fakeStore.frontPageItems);
    });

    it('useCatalogUiState returns the UI fields plus their setters', () => {
        const { result } = renderHook(() => useCatalogUiState());

        expect(Object.keys(result.current).sort()).toEqual([
            'activeNodes',
            'catalogPlaceMultipleObjects',
            'currentType',
            'isVisible',
            'navigationHidden',
            'pageId',
            'previousPageId',
            'purchaseOptions',
            'setCatalogPlaceMultipleObjects',
            'setCurrentOffer',
            'setCurrentPage',
            'setIsVisible',
            'setNavigationHidden',
            'setPurchaseOptions',
            'setSearchResult'
        ]);

        expect(result.current.setIsVisible).toBe(fakeStore.setIsVisible);
        expect(result.current.setCurrentPage).toBe(fakeStore.setCurrentPage);
    });

    it('useCatalogActions returns only imperative operations', () => {
        const { result } = renderHook(() => useCatalogActions());

        expect(Object.keys(result.current).sort()).toEqual([
            'activateNode',
            'getBuilderFurniPlaceableStatus',
            'getNodeById',
            'getNodeByName',
            'getNodesByOfferId',
            'openCatalogByType',
            'openPageById',
            'openPageByName',
            'openPageByOfferId',
            'requestOfferToMover',
            'selectCatalogOffer',
            'toggleCatalogByType'
        ]);

        // No data fields leak through.
        expect(result.current).not.toHaveProperty('rootNode');
        expect(result.current).not.toHaveProperty('isVisible');
        expect(result.current).not.toHaveProperty('currentPage');

        expect(result.current.activateNode).toBe(fakeStore.activateNode);
        expect(result.current.openCatalogByType).toBe(fakeStore.openCatalogByType);
    });

    it('all three filters observe the same singleton — refs are ===', () => {
        const { result } = renderHook(() => ({
            data: useCatalogData(),
            ui: useCatalogUiState(),
            actions: useCatalogActions()
        }));

        // Each slice reaches the same fakeStore via useBetween. Any
        // accidental copy would break these `===` checks.
        expect(result.current.actions.activateNode).toBe(fakeStore.activateNode);
        expect(result.current.actions.openCatalogByType).toBe(fakeStore.openCatalogByType);
        expect(result.current.ui.setIsVisible).toBe(fakeStore.setIsVisible);
        expect(result.current.ui.setCurrentPage).toBe(fakeStore.setCurrentPage);
        expect(result.current.data.rootNode).toBe(fakeStore.rootNode);
        expect(result.current.data.furniCount).toBe(fakeStore.furniCount);
        expect(result.current.data.roomPreviewer).toBe(fakeStore.roomPreviewer);
    });
});
