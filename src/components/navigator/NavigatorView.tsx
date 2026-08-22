import {
    AddLinkEventTracker,
    ConvertGlobalRoomIdMessageComposer,
    FindNewFriendsMessageComposer,
    GetCategoriesWithUserCountMessageComposer,
    HabboWebTools,
    ILinkEventTracker,
    LegacyExternalInterface,
    NavigatorInitComposer,
    RemoveLinkEventTracker,
    RoomSessionEvent
} from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { CreateLinkEvent, LocalizeText, localizeWithFallback, SendMessageComposer, TryVisitRoom } from '../../api';
import createRoomImg from '../../assets/images/navigator/air/create-room.png';
import promoteRoomImg from '../../assets/images/navigator/air/promote-room.png';
import quicklinkAdd from '../../assets/images/navigator/air/quicklink-add.png';
import randomRoomImg from '../../assets/images/navigator/air/random-room.png';
import { WidgetErrorBoundary } from '../../common';
import { useNavigatorData, useNavigatorSearch, useNavigatorUiState, useNavigatorUiStore, useNitroEvent } from '../../hooks';
import { NitroCard } from '../../layout/NitroCard';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorEmptyStateView } from './views/search/NavigatorEmptyStateView';
import { NavigatorSearchResultView } from './views/search/NavigatorSearchResultView';
import { NavigatorSearchSavesResultView } from './views/search/NavigatorSearchSavesResultView';
import { NavigatorSearchSkeletonView } from './views/search/NavigatorSearchSkeletonView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';

export const NavigatorView: FC<{}> = (props) => {
    const { topLevelContext, topLevelContexts, navigatorData, navigatorSearches } = useNavigatorData();
    const { searchResult, isFetching } = useNavigatorSearch();
    const { isVisible, isCreatorOpen, isRoomInfoOpen, isRoomLinkOpen, isOpenSavesSearches, needsInit, currentTabCode } = useNavigatorUiState();
    const elementRef = useRef<HTMLDivElement>(null);

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, (event) => {
        useNavigatorUiStore.getState().hide();
        useNavigatorUiStore.getState().closeCreator();
    });

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');
                if (parts.length < 2) return;
                const store = useNavigatorUiStore.getState();
                switch (parts[1]) {
                    case 'show':
                        store.show();
                        return;
                    case 'hide':
                        store.hide();
                        return;
                    case 'toggle':
                        store.toggle();
                        return;
                    case 'toggle-room-info':
                        store.toggleRoomInfo();
                        return;
                    case 'toggle-room-link':
                        store.toggleRoomLink();
                        return;
                    case 'goto':
                        if (parts.length <= 2) return;
                        if (parts[2] === 'home') {
                            if (navigatorData.homeRoomId <= 0) return;
                            TryVisitRoom(navigatorData.homeRoomId);
                            return;
                        }
                        TryVisitRoom(parseInt(parts[2]));
                        return;
                    case 'create':
                        store.openCreator();
                        return;
                    case 'search':
                        if (parts.length <= 2) return;
                        const code = parts[2];
                        const value = parts.length > 3 ? parts[3] : '';
                        store.setTab(code);
                        if (value) store.setFilter(value);
                        store.show();
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };
        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [navigatorData]);

    useEffect(() => {
        if (!searchResult) return;
        if (elementRef.current) elementRef.current.scrollTop = 0;
    }, [searchResult]);

    useEffect(() => {
        if (!isVisible || !needsInit) return;
        SendMessageComposer(new NavigatorInitComposer());
        SendMessageComposer(new GetCategoriesWithUserCountMessageComposer());
        useNavigatorUiStore.getState().markInitDone();
    }, [isVisible, needsInit]);

    useEffect(() => {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    useEffect(() => {
        useNavigatorUiStore.getState().hydrateAirPreferences();
    }, []);

    const quickLinksLabel = localizeWithFallback('navigator.quick.links.title', 'Quick links');
    const navigatorLabel = localizeWithFallback('navigator.title', 'Navigator');
    const quickLinksToggleLabel = localizeWithFallback('navigator.tooltip.left.show.hide', 'Show or hide quick links');

    return (
        <>
            {isVisible && (
                <NitroCard
                    className={`${isOpenSavesSearches ? 'w-[min(578px,calc(100vw-16px))]' : 'w-[min(var(--navigator-width,425px),calc(100vw-16px))]'} nitro-navigator-air min-w-0 max-w-[calc(100vw-16px)] h-[min(var(--navigator-height,628px),calc(100vh-16px))] min-h-0 max-h-[calc(100vh-16px)] has-classic-scrollbar`}
                    uniqueKey="navigator"
                >
                    <NitroCard.Header
                        headerText={LocalizeText(isCreatorOpen ? 'navigator.createroom.title' : 'navigator.title')}
                        onCloseClick={() => useNavigatorUiStore.getState().hide()}
                    />
                    <NitroCard.Tabs>
                        <NitroCard.TabItem isActive={isOpenSavesSearches} title={quickLinksToggleLabel}>
                            <button
                                type="button"
                                className="nitro-navigator-air__quick-toggle"
                                aria-label={quickLinksToggleLabel}
                                aria-expanded={isOpenSavesSearches}
                                onClick={() => useNavigatorUiStore.getState().toggleSavesSearches()}
                            >
                                <img src={quicklinkAdd} alt="" width={18} height={18} />
                            </button>
                        </NitroCard.TabItem>
                        {topLevelContexts &&
                            topLevelContexts.length > 0 &&
                            topLevelContexts.map((context, index) => (
                                <NitroCard.TabItem
                                    key={index}
                                    isActive={(currentTabCode ? currentTabCode === context.code : topLevelContext === context) && !isCreatorOpen}
                                    onClick={() => useNavigatorUiStore.getState().setTab(context.code)}
                                >
                                    {LocalizeText('navigator.toplevelview.' + context.code)}
                                </NitroCard.TabItem>
                            ))}
                        <NitroCard.TabItem isActive={isCreatorOpen} onClick={() => useNavigatorUiStore.getState().openCreator()}>
                            <span className="nitro-navigator-air__create-tab" aria-hidden="true">
                                +
                            </span>
                        </NitroCard.TabItem>
                    </NitroCard.Tabs>
                    <NitroCard.Content>
                        {!isCreatorOpen && (
                            <div className="nitro-navigator-air__workspace flex h-full overflow-hidden">
                                {isOpenSavesSearches && (
                                    <nav className="nitro-navigator-air__quick-links overflow-hidden shrink-0" aria-label={quickLinksLabel}>
                                        <NavigatorSearchSavesResultView searches={navigatorSearches || []} />
                                    </nav>
                                )}
                                <main className="nitro-navigator-air__main flex flex-col w-full min-h-0 overflow-hidden gap-2" aria-label={navigatorLabel}>
                                    <NavigatorSearchView searchResult={searchResult} />
                                    <div ref={elementRef} className="flex flex-col flex-1 min-h-0 overflow-auto gap-2">
                                        {isFetching && !searchResult && <NavigatorSearchSkeletonView />}
                                        {searchResult &&
                                            searchResult.results.map((result, index) => <NavigatorSearchResultView key={index} searchResult={result} />)}
                                        {searchResult && (!searchResult.results || searchResult.results.length === 0) && (
                                            <NavigatorEmptyStateView
                                                code={searchResult.code}
                                                onCreateRoom={() => useNavigatorUiStore.getState().openCreator()}
                                            />
                                        )}
                                    </div>
                                    <div className="nitro-navigator-air__actions shrink-0">
                                        <button
                                            type="button"
                                            className="nitro-navigator-air__action"
                                            onClick={() => useNavigatorUiStore.getState().openCreator()}
                                        >
                                            <img src={createRoomImg} alt="" />
                                            <span>{LocalizeText('navigator.createroom.create')}</span>
                                        </button>
                                        {searchResult?.code !== 'myworld_view' && searchResult?.code !== 'roomads_view' && (
                                            <button
                                                type="button"
                                                className="nitro-navigator-air__action"
                                                onClick={() => SendMessageComposer(new FindNewFriendsMessageComposer())}
                                            >
                                                <img src={randomRoomImg} alt="" />
                                                <span>{LocalizeText('navigator.random.room')}</span>
                                            </button>
                                        )}
                                        {(searchResult?.code === 'myworld_view' || searchResult?.code === 'roomads_view') && (
                                            <button
                                                type="button"
                                                className="nitro-navigator-air__action"
                                                onClick={() => CreateLinkEvent('catalog/open/room_event')}
                                            >
                                                <img src={promoteRoomImg} alt="" />
                                                <span>{LocalizeText('navigator.promote.room')}</span>
                                            </button>
                                        )}
                                    </div>
                                </main>
                            </div>
                        )}
                        {isCreatorOpen && (
                            <WidgetErrorBoundary name="NavigatorRoomCreator">
                                <NavigatorRoomCreatorView />
                            </WidgetErrorBoundary>
                        )}
                    </NitroCard.Content>
                </NitroCard>
            )}
            <WidgetErrorBoundary name="NavigatorDoorState">
                <NavigatorDoorStateView />
            </WidgetErrorBoundary>
            {isRoomInfoOpen && (
                <WidgetErrorBoundary name="NavigatorRoomInfo">
                    <NavigatorRoomInfoView onCloseClick={() => useNavigatorUiStore.getState().setRoomInfoOpen(false)} />
                </WidgetErrorBoundary>
            )}
            {isRoomLinkOpen && (
                <WidgetErrorBoundary name="NavigatorRoomLink">
                    <NavigatorRoomLinkView onCloseClick={() => useNavigatorUiStore.getState().setRoomLinkOpen(false)} />
                </WidgetErrorBoundary>
            )}
            <WidgetErrorBoundary name="NavigatorRoomSettings">
                <NavigatorRoomSettingsView />
            </WidgetErrorBoundary>
        </>
    );
};
