import { NitroCard } from '@layout/NitroCard';
import { AddLinkEventTracker, ConvertGlobalRoomIdMessageComposer, FindNewFriendsMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, RemoveLinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { FaPlus } from 'react-icons/fa';
import savesSearchIcon from '../../assets/images/navigator/saves-search/search_save.png';
import createRoomImg from '../../assets/images/navigator/create_room.png';
import randomRoomImg from '../../assets/images/navigator/random_room.png';
import promoteRoomImg from '../../assets/images/navigator/promote_room.png';
import { CreateLinkEvent, LocalizeText, SendMessageComposer, TryVisitRoom } from '../../api';
import { Flex, Text, WidgetErrorBoundary } from '../../common';
import { useNavigatorData, useNavigatorSearch, useNavigatorUiState, useNavigatorUiStore, useNitroEvent } from '../../hooks';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorSearchResultView } from './views/search/NavigatorSearchResultView';
import { NavigatorSearchSavesResultView } from './views/search/NavigatorSearchSavesResultView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';

export const NavigatorView: FC<{}> = props =>
{
    const { topLevelContext, topLevelContexts, navigatorData, navigatorSearches } = useNavigatorData();
    const { searchResult, isFetching } = useNavigatorSearch();
    const { isVisible, isCreatorOpen, isRoomInfoOpen, isRoomLinkOpen, isOpenSavesSearches, needsInit } = useNavigatorUiState();
    const elementRef = useRef<HTMLDivElement>(null);

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
        useNavigatorUiStore.getState().hide();
        useNavigatorUiStore.getState().closeCreator();
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                const store = useNavigatorUiStore.getState();
                switch(parts[1])
                {
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
                        if(parts.length <= 2) return;
                        if(parts[2] === 'home')
                        {
                            if(navigatorData.homeRoomId <= 0) return;
                            TryVisitRoom(navigatorData.homeRoomId);
                            return;
                        }
                        TryVisitRoom(parseInt(parts[2]));
                        return;
                    case 'create':
                        store.openCreator();
                        return;
                    case 'search':
                        if(parts.length <= 2) return;
                        const code = parts[2];
                        const value = parts.length > 3 ? parts[3] : '';
                        store.setTab(code);
                        if(value) store.setFilter(value);
                        store.show();
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };
        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ navigatorData ]);

    useEffect(() =>
    {
        if(!searchResult) return;
        if(elementRef.current) elementRef.current.scrollTop = 0;
    }, [ searchResult ]);

    useEffect(() =>
    {
        if(!isVisible || !needsInit) return;
        SendMessageComposer(new NavigatorInitComposer());
        useNavigatorUiStore.getState().markInitDone();
    }, [ isVisible, needsInit ]);

    useEffect(() =>
    {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    return (
        <>
            { isVisible &&
                <NitroCard
                    className={ `${ isOpenSavesSearches ? 'w-[600px] min-w-[600px]' : 'w-navigator-w min-w-navigator-w' } h-navigator-h min-h-navigator-h` }
                    uniqueKey="navigator">
                    <NitroCard.Header
                        headerText={ LocalizeText(isCreatorOpen ? 'navigator.createroom.title' : 'navigator.title') }
                        onCloseClick={ () => useNavigatorUiStore.getState().hide() } />
                    <NitroCard.Tabs>
                        <NitroCard.TabItem
                            isActive={ isOpenSavesSearches }
                            title={ LocalizeText('navigator.tooltip.left.show.hide') }
                            onClick={ () => useNavigatorUiStore.getState().toggleSavesSearches() }>
                            <img src={ savesSearchIcon } alt="" style={{ width: 18, height: 18 }} />
                        </NitroCard.TabItem>
                        { topLevelContexts && topLevelContexts.length > 0 && topLevelContexts.map((context, index) =>
                            <NitroCard.TabItem
                                key={ index }
                                isActive={ topLevelContext === context && !isCreatorOpen }
                                onClick={ () => useNavigatorUiStore.getState().setTab(context.code) }>
                                { LocalizeText('navigator.toplevelview.' + context.code) }
                            </NitroCard.TabItem>) }
                        <NitroCard.TabItem
                            isActive={ isCreatorOpen }
                            onClick={ () => useNavigatorUiStore.getState().openCreator() }>
                            <FaPlus className="fa-icon" />
                        </NitroCard.TabItem>
                    </NitroCard.Tabs>
                    <NitroCard.Content isLoading={ isFetching }>
                        { !isCreatorOpen &&
                            <div className="flex h-full overflow-hidden gap-2">
                                { isOpenSavesSearches &&
                                    <div className="overflow-hidden pr-1 shrink-0">
                                        <NavigatorSearchSavesResultView searches={ navigatorSearches || [] } />
                                    </div> }
                                <div className="flex flex-col w-full overflow-hidden gap-2">
                                    <NavigatorSearchView />
                                    <div ref={ elementRef } className="flex flex-col flex-1 min-h-0 overflow-auto gap-2">
                                        { searchResult && searchResult.results.map((result, index) => <NavigatorSearchResultView key={ index } searchResult={ result } />) }
                                        { searchResult && (!searchResult.results || searchResult.results.length === 0) &&
                                            <div className="nitro-card-panel px-3 py-2 text-sm text-muted">
                                                { LocalizeText(searchResult.code === 'myworld_view' ? 'navigator.roomsettings.moderation.none' : 'navigator.search.returned.no.results') }
                                            </div> }
                                    </div>
                                    <Flex className="nitro-card-divider pt-2 border-t gap-2">
                                        <Flex pointer alignItems="center" justifyContent="center"
                                            className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                            style={ { backgroundImage: `url(${ createRoomImg })`, backgroundSize: '100% 100%' } }
                                            onClick={ () => useNavigatorUiStore.getState().openCreator() }>
                                            <Text variant="white" bold className="text-xs drop-shadow">
                                                { LocalizeText('navigator.createroom.create') }
                                            </Text>
                                        </Flex>
                                        { searchResult?.code !== 'myworld_view' && searchResult?.code !== 'roomads_view' &&
                                            <Flex pointer alignItems="center" justifyContent="center"
                                                className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                                style={ { backgroundImage: `url(${ randomRoomImg })`, backgroundSize: '100% 100%' } }
                                                onClick={ () => SendMessageComposer(new FindNewFriendsMessageComposer()) }>
                                                <Text variant="white" bold className="text-xs drop-shadow">
                                                    { LocalizeText('navigator.random.room') }
                                                </Text>
                                            </Flex> }
                                        { (searchResult?.code === 'myworld_view' || searchResult?.code === 'roomads_view') &&
                                            <Flex pointer alignItems="center" justifyContent="center"
                                                className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                                style={ { backgroundImage: `url(${ promoteRoomImg })`, backgroundSize: '100% 100%' } }
                                                onClick={ () => CreateLinkEvent('catalog/open/room_event') }>
                                                <Text variant="white" bold className="text-xs drop-shadow">
                                                    { LocalizeText('navigator.promote.room') }
                                                </Text>
                                            </Flex> }
                                    </Flex>
                                </div>
                            </div> }
                        { isCreatorOpen &&
                            <WidgetErrorBoundary name="NavigatorRoomCreator">
                                <NavigatorRoomCreatorView />
                            </WidgetErrorBoundary> }
                    </NitroCard.Content>
                </NitroCard> }
            <WidgetErrorBoundary name="NavigatorDoorState">
                <NavigatorDoorStateView />
            </WidgetErrorBoundary>
            { isRoomInfoOpen &&
                <WidgetErrorBoundary name="NavigatorRoomInfo">
                    <NavigatorRoomInfoView onCloseClick={ () => useNavigatorUiStore.getState().setRoomInfoOpen(false) } />
                </WidgetErrorBoundary> }
            { isRoomLinkOpen &&
                <WidgetErrorBoundary name="NavigatorRoomLink">
                    <NavigatorRoomLinkView onCloseClick={ () => useNavigatorUiStore.getState().setRoomLinkOpen(false) } />
                </WidgetErrorBoundary> }
            <WidgetErrorBoundary name="NavigatorRoomSettings">
                <NavigatorRoomSettingsView />
            </WidgetErrorBoundary>
        </>
    );
};
