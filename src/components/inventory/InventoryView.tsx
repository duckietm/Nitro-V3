import { AddLinkEventTracker, BadgePointLimitsEvent, GetLocalizationManager, GetRoomEngine, ILinkEventTracker, IRoomSession, RemoveLinkEventTracker, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomPreviewer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useState } from 'react';
import { FaAward, FaCouch, FaPaw, FaRobot, FaTag } from 'react-icons/fa';
import { GroupItem, LocalizeText, UnseenItemCategory, isObjectMoverRequested, setObjectMoverRequested } from '../../api';
import { NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useInventoryBadges, useInventoryFurni, useInventoryPrefixes, useInventoryTrade, useInventoryUnseenTracker, useMessageEvent, useNitroEvent } from '../../hooks';
import { InventoryCategoryFilterView } from './views/InventoryCategoryFilterView';
import { InventoryBadgeView } from './views/badge/InventoryBadgeView';
import { InventoryBotView } from './views/bot/InventoryBotView';
import { InventoryFurnitureDeleteView } from './views/furniture/InventoryFurnitureDeleteView';
import { InventoryFurnitureView } from './views/furniture/InventoryFurnitureView';
import { InventoryTradeView } from './views/furniture/InventoryTradeView';
import { InventoryPetView } from './views/pet/InventoryPetView';
import { InventoryPrefixView } from './views/prefix/InventoryPrefixView';

const TAB_FURNITURE: string = 'inventory.furni';
const TAB_BOTS: string = 'inventory.bots';
const TAB_PETS: string = 'inventory.furni.tab.pets';
const TAB_BADGES: string = 'inventory.badges';
const TAB_PREFIXES: string = 'inventory.prefixes';
const TABS = [ TAB_FURNITURE, TAB_PETS, TAB_BADGES, TAB_PREFIXES, TAB_BOTS ];
// Maps an optional link code (inventory/show/<code>) to a tab so other views
// (e.g. the profile "Change Badges" button) can deep-link to a specific tab.
const TAB_BY_CODE: Record<string, string> = {
    furni: TAB_FURNITURE, furniture: TAB_FURNITURE,
    pets: TAB_PETS, badges: TAB_BADGES,
    prefixes: TAB_PREFIXES, bots: TAB_BOTS
};
const UNSEEN_CATEGORIES = [ UnseenItemCategory.FURNI, UnseenItemCategory.PET, UnseenItemCategory.BADGE, UnseenItemCategory.PREFIX, UnseenItemCategory.BOT ];
const TAB_ICONS: Record<string, ReactNode> = {
    [TAB_FURNITURE]: <FaCouch />,
    [TAB_PETS]: <FaPaw />,
    [TAB_BADGES]: <FaAward />,
    [TAB_PREFIXES]: <FaTag />,
    [TAB_BOTS]: <FaRobot />
};

export const InventoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>(TABS[0]);
    const [ roomSession, setRoomSession ] = useState<IRoomSession>(null);
    const [ roomPreviewer, setRoomPreviewer ] = useState<RoomPreviewer>(null);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);
    const [ filteredBadgeCodes, setFilteredBadgeCodes ] = useState<string[]>([]);
    const { isTrading = false, stopTrading = null } = useInventoryTrade();
    const { getCount = null } = useInventoryUnseenTracker();
    const { groupItems = [] } = useInventoryFurni();
    const { badgeCodes = [] } = useInventoryBadges();

    const onClose = () =>
    {
        if(isTrading) stopTrading();

        setIsVisible(false);
    };

    useNitroEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event =>
    {
        if(!isObjectMoverRequested()) return;

        setObjectMoverRequested(false);

        if(!event.placedInRoom) setIsVisible(true);
    });

    useNitroEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED
    ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setRoomSession(event.session);
                return;
            case RoomSessionEvent.ENDED:
                setRoomSession(null);
                setIsVisible(false);
                return;
        }
    });

    useMessageEvent<BadgePointLimitsEvent>(BadgePointLimitsEvent, event =>
    {
        const parser = event.getParser();

        for(const data of parser.data) GetLocalizationManager().setBadgePointLimit(data.badgeId, data.limit);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        if(parts[2] && TAB_BY_CODE[parts[2]]) setCurrentTab(TAB_BY_CODE[parts[2]]);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        if(parts[2] && TAB_BY_CODE[parts[2]]) setCurrentTab(TAB_BY_CODE[parts[2]]);
                        return;
                }
            },
            eventUrlPrefix: 'inventory/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setRoomPreviewer(new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER));

        return () =>
        {
            setRoomPreviewer(prevValue =>
            {
                prevValue.dispose();

                return null;
            });
        };
    }, []);

    useEffect(() =>
    {
        if(!isVisible && isTrading) setIsVisible(true);
    }, [ isVisible, isTrading ]);

    if(!isVisible) return null;

    const showFilter = !isTrading && (currentTab === TAB_FURNITURE || currentTab === TAB_BADGES);

    return (
        <>
            <NitroCardView className="nitro-inventory-window w-[528px] h-[420px] min-w-[528px] min-h-[420px]" uniqueKey="inventory">
                <NitroCardHeaderView
                    headerText={ LocalizeText('inventory.title') }
                    onCloseClick={ onClose } />
                { !isTrading &&
                    <>
                        <NitroCardTabsView classNames={ [ 'nitro-inventory-tabs-shell' ] }>
                            { TABS.map((name, index) =>
                            {
                                return (
                                    <NitroCardTabsItemView
                                        key={ index }
                                        count={ getCount(UNSEEN_CATEGORIES[index]) }
                                        isActive={ (currentTab === name) }
                                        onClick={ event => setCurrentTab(name) }>
                                        <span className="nitro-inventory-tab-icon" title={ LocalizeText(name) }>{ TAB_ICONS[name] }</span>
                                        <span className="nitro-inventory-tab-label">{ LocalizeText(name) }</span>
                                    </NitroCardTabsItemView>
                                );
                            }) }
                        </NitroCardTabsView>
                        <div className="nitro-inventory-body flex flex-col overflow-hidden p-2 h-full gap-2">
                            { showFilter &&
                                <InventoryCategoryFilterView
                                    badgeCodes={ badgeCodes }
                                    currentTab={ currentTab }
                                    groupItems={ groupItems }
                                    setBadgeCodes={ setFilteredBadgeCodes }
                                    setGroupItems={ setFilteredGroupItems } /> }
                            <div className="flex-1 overflow-hidden">
                                { (currentTab === TAB_FURNITURE) &&
                                    <InventoryFurnitureView
                                        filteredGroupItems={ filteredGroupItems }
                                        roomPreviewer={ roomPreviewer }
                                        roomSession={ roomSession } /> }
                                { (currentTab === TAB_PETS) &&
                                    <InventoryPetView roomPreviewer={ roomPreviewer } roomSession={ roomSession } /> }
                                { (currentTab === TAB_BADGES) &&
                                    <InventoryBadgeView filteredBadgeCodes={ filteredBadgeCodes } /> }
                                { (currentTab === TAB_PREFIXES) &&
                                    <InventoryPrefixView /> }
                                { (currentTab === TAB_BOTS) &&
                                    <InventoryBotView roomPreviewer={ roomPreviewer } roomSession={ roomSession } /> }
                            </div>
                        </div>
                    </> }
                { isTrading &&
                    <div className="nitro-inventory-body flex flex-col overflow-hidden p-2 h-full">
                        <InventoryTradeView cancelTrade={ onClose } />
                    </div> }
            </NitroCardView>
            <InventoryFurnitureDeleteView />
        </>
    );
};
