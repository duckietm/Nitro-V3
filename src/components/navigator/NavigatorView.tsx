import { NitroCard } from '@layout/NitroCard';
import { AddLinkEventTracker, ConvertGlobalRoomIdMessageComposer, FindNewFriendsMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RemoveLinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import savesSearchIcon from '../../assets/images/navigator/saves-search/search_save.png';
import createRoomImg from '../../assets/images/navigator/create_room.png';
import randomRoomImg from '../../assets/images/navigator/random_room.png';
import promoteRoomImg from '../../assets/images/navigator/promote_room.png';
import { CreateLinkEvent, LocalizeText, SendMessageComposer, TryVisitRoom } from '../../api';
import { Flex, Text } from '../../common';
import { useNavigator, useNitroEvent } from '../../hooks';
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
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState(false);
    const [ isCreatorOpen, setCreatorOpen ] = useState(false);
    const [ isRoomInfoOpen, setRoomInfoOpen ] = useState(false);
    const [ isRoomLinkOpen, setRoomLinkOpen ] = useState(false);
    const [ isOpenSavesSearches, setIsOpenSavesSearches ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ needsInit, setNeedsInit ] = useState(true);
    const [ needsSearch, setNeedsSearch ] = useState(false);
    const { searchResult = null, topLevelContext = null, topLevelContexts = null, navigatorData = null, navigatorSearches = null } = useNavigator();
    const pendingSearch = useRef<{ value: string, code: string }>(null);
    const elementRef = useRef<HTMLDivElement>();

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
        setIsVisible(false);
        setCreatorOpen(false);
    });

    const sendSearch = useCallback((searchValue: string, contextCode: string) =>
    {
        setCreatorOpen(false);

        SendMessageComposer(new NavigatorSearchComposer(contextCode, searchValue));

        setIsLoading(true);
    }, []);

    const reloadCurrentSearch = useCallback(() =>
    {
        if(!isReady)
        {
            setNeedsSearch(true);

            return;
        }

        if(pendingSearch.current)
        {
            sendSearch(pendingSearch.current.value, pendingSearch.current.code);

            pendingSearch.current = null;

            return;
        }

        if(searchResult)
        {
            sendSearch(searchResult.data, searchResult.code);

            return;
        }

        if(!topLevelContext) return;

        sendSearch('', topLevelContext.code);
    }, [ isReady, searchResult, topLevelContext, sendSearch ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': {
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle': {
                        if(isVisible)
                        {
                            setIsVisible(false);

                            return;
                        }

                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'toggle-room-info':
                        setRoomInfoOpen(value => !value);
                        return;
                    case 'toggle-room-link':
                        setRoomLinkOpen(value => !value);
                        return;
                    case 'goto':
                        if(parts.length <= 2) return;

                        switch(parts[2])
                        {
                            case 'home':
                                if(navigatorData.homeRoomId <= 0) return;

                                TryVisitRoom(navigatorData.homeRoomId);
                                break;
                            default: {
                                const roomId = parseInt(parts[2]);

                                TryVisitRoom(roomId);
                            }
                        }
                        return;
                    case 'create':
                        setIsVisible(true);
                        setCreatorOpen(true);
                        return;
                    case 'search':
                        if(parts.length > 2)
                        {
                            const topLevelContextCode = parts[2];

                            let searchValue = '';

                            if(parts.length > 3) searchValue = parts[3];

                            pendingSearch.current = { value: searchValue, code: topLevelContextCode };

                            setIsVisible(true);
                            setNeedsSearch(true);
                        }
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ isVisible, navigatorData ]);

    useEffect(() =>
    {
        if(!searchResult) return;

        setIsLoading(false);

        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ searchResult ]);

    useEffect(() =>
    {
        if(!isVisible || !isReady || !needsSearch) return;

        reloadCurrentSearch();

        setNeedsSearch(false);
    }, [ isVisible, isReady, needsSearch, reloadCurrentSearch ]);

    useEffect(() =>
    {
        if(isReady || !topLevelContext) return;

        setIsReady(true);
    }, [ isReady, topLevelContext ]);

    useEffect(() =>
    {
        if(!isVisible || !needsInit) return;

        SendMessageComposer(new NavigatorInitComposer());

        setNeedsInit(false);
    }, [ isVisible, needsInit ]);

    useEffect(() =>
    {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string, _arg_2: boolean = false, _arg_3: string = null) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    return (
        <>
            { isVisible &&
                <NitroCard
                    className={ `${ isOpenSavesSearches ? 'w-[600px] min-w-[600px]' : 'w-navigator-w min-w-navigator-w' } h-navigator-h min-h-navigator-h` }
                    uniqueKey="navigator">
                    <NitroCard.Header
                        headerText={ LocalizeText(isCreatorOpen ? 'navigator.createroom.title' : 'navigator.title') }
                        onCloseClick={ event => setIsVisible(false) } />
                    <NitroCard.Tabs>
                        <NitroCard.TabItem
                            isActive={ isOpenSavesSearches }
                            title={ LocalizeText('navigator.tooltip.left.show.hide') }
                            onClick={ () => setIsOpenSavesSearches(prev => !prev) }>
                            <img src={ savesSearchIcon } alt="" style={{ width: 18, height: 18 }} />
                        </NitroCard.TabItem>
                        { topLevelContexts && (topLevelContexts.length > 0) && topLevelContexts.map((context, index) =>
                        {
                            return (
                                <NitroCard.TabItem
                                    key={ index }
                                    isActive={ ((topLevelContext === context) && !isCreatorOpen) }
                                    onClick={ event => sendSearch('', context.code) }>
                                    { LocalizeText(('navigator.toplevelview.' + context.code)) }
                                </NitroCard.TabItem>
                            );
                        }) }
                        <NitroCard.TabItem
                            isActive={ isCreatorOpen }
                            onClick={ event => setCreatorOpen(true) }>
                            <FaPlus className="fa-icon" />
                        </NitroCard.TabItem>
                    </NitroCard.Tabs>
                    <NitroCard.Content isLoading={ isLoading }>
                        { !isCreatorOpen &&
                            <div className="flex h-full overflow-hidden gap-2">
                                { isOpenSavesSearches &&
                                    <div className="overflow-hidden pr-1 shrink-0">
                                        <NavigatorSearchSavesResultView searches={ navigatorSearches || [] } />
                                    </div> }
                                <div className="flex flex-col w-full overflow-hidden gap-2">
                                    <NavigatorSearchView sendSearch={ sendSearch } />
                                    <div ref={ elementRef } className="flex flex-col flex-1 min-h-0 overflow-auto gap-2">
                                        { (searchResult && searchResult.results.map((result, index) => <NavigatorSearchResultView key={ index } searchResult={ result } />)) }
                                    </div>
                                    <Flex className="pt-2 border-t border-muted gap-2">
                                        <Flex
                                            pointer
                                            alignItems="center"
                                            justifyContent="center"
                                            className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                            style={ { backgroundImage: `url(${ createRoomImg })`, backgroundSize: '100% 100%' } }
                                            onClick={ () => setCreatorOpen(true) }
                                        >
                                            <Text variant="white" bold className="text-xs drop-shadow">
                                                { LocalizeText('navigator.createroom.create') }
                                            </Text>
                                        </Flex>
                                        { (searchResult?.code !== 'myworld_view' && searchResult?.code !== 'roomads_view') &&
                                            <Flex
                                                pointer
                                                alignItems="center"
                                                justifyContent="center"
                                                className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                                style={ { backgroundImage: `url(${ randomRoomImg })`, backgroundSize: '100% 100%' } }
                                                onClick={ () => SendMessageComposer(new FindNewFriendsMessageComposer()) }
                                            >
                                                <Text variant="white" bold className="text-xs drop-shadow">
                                                    { LocalizeText('navigator.random.room') }
                                                </Text>
                                            </Flex> }
                                        { (searchResult?.code === 'myworld_view' || searchResult?.code === 'roomads_view') &&
                                            <Flex
                                                pointer
                                                alignItems="center"
                                                justifyContent="center"
                                                className="flex-1 h-[60px] cursor-pointer bg-no-repeat pl-16"
                                                style={ { backgroundImage: `url(${ promoteRoomImg })`, backgroundSize: '100% 100%' } }
                                                onClick={ () => CreateLinkEvent('catalog/open/room_event') }
                                            >
                                                <Text variant="white" bold className="text-xs drop-shadow">
                                                    { LocalizeText('navigator.promote.room') }
                                                </Text>
                                            </Flex> }
                                    </Flex>
                                </div>
                            </div> }
                        { isCreatorOpen && <NavigatorRoomCreatorView /> }
                    </NitroCard.Content>
                </NitroCard> }
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => setRoomInfoOpen(false) } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => setRoomLinkOpen(false) } /> }
            <NavigatorRoomSettingsView />
        </>
    );
};
