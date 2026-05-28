import { createNitroStore } from '../../state/createNitroStore';

export type NavigatorUiState = {
    isVisible: boolean;
    isReady: boolean;
    isCreatorOpen: boolean;
    isRoomInfoOpen: boolean;
    isRoomLinkOpen: boolean;
    isOpenSavesSearches: boolean;
    isLoading: boolean;
    needsInit: boolean;
    needsSearch: boolean;
    currentTabCode: string;
    currentFilter: string;
};

export type NavigatorUiActions = {
    show(): void;
    hide(): void;
    toggle(): void;
    openCreator(): void;
    closeCreator(): void;
    setRoomInfoOpen(open: boolean): void;
    toggleRoomInfo(): void;
    setRoomLinkOpen(open: boolean): void;
    toggleRoomLink(): void;
    toggleSavesSearches(): void;
    setLoading(loading: boolean): void;
    markReady(): void;
    markInitDone(): void;
    requestSearch(): void;
    consumeSearchRequest(): void;
    setTab(code: string): void;
    setFilter(value: string): void;
};

export const useNavigatorUiStore = createNitroStore<NavigatorUiState & NavigatorUiActions>()((set) => ({
    isVisible: false,
    isReady: false,
    isCreatorOpen: false,
    isRoomInfoOpen: false,
    isRoomLinkOpen: false,
    isOpenSavesSearches: false,
    isLoading: false,
    needsInit: true,
    needsSearch: false,
    currentTabCode: '',
    currentFilter: '',

    show: () => set({ isVisible: true, needsSearch: true }),
    hide: () => set({ isVisible: false }),
    toggle: () => set((s) => s.isVisible
        ? { isVisible: false }
        : { isVisible: true, needsSearch: true }),
    openCreator: () => set({ isVisible: true, isCreatorOpen: true }),
    closeCreator: () => set({ isCreatorOpen: false }),
    setRoomInfoOpen: (open) => set({ isRoomInfoOpen: open }),
    toggleRoomInfo: () => set((s) => ({ isRoomInfoOpen: !s.isRoomInfoOpen })),
    setRoomLinkOpen: (open) => set({ isRoomLinkOpen: open }),
    toggleRoomLink: () => set((s) => ({ isRoomLinkOpen: !s.isRoomLinkOpen })),
    toggleSavesSearches: () => set((s) => ({ isOpenSavesSearches: !s.isOpenSavesSearches })),
    setLoading: (loading) => set({ isLoading: loading }),
    markReady: () => set({ isReady: true }),
    markInitDone: () => set({ needsInit: false }),
    requestSearch: () => set({ needsSearch: true }),
    consumeSearchRequest: () => set({ needsSearch: false }),
    setTab: (code) => set({ currentTabCode: code, currentFilter: '' }),
    setFilter: (value) => set({ currentFilter: value })
}));
