import { GetSessionDataManager, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useCallback, useMemo, useState } from 'react';
import { GetClubMemberLevel, GetConfigurationValue } from '../../api';
import { Base, Flex, Grid, LayoutCurrencyIcon, NitroCardTabsItemView, NitroCardTabsView, Text } from '../../common';
import { useRoom } from '../../hooks';

interface ItemData
{
    id: number;
    isHcOnly: boolean;
    minRank: number;
    isAmbassadorOnly: boolean;
    selectable: boolean;
}

const SUB_TABS = [ 'backgrounds', 'stands', 'overlays' ] as const;
type SubTabType = typeof SUB_TABS[number];

const SUB_TAB_LABELS: Record<SubTabType, string> = {
    backgrounds: 'Sfondi',
    stands: 'Basi',
    overlays: 'Overlay'
};

export const InterfaceProfileTabView: FC<{}> = () =>
{
    const [ activeSubTab, setActiveSubTab ] = useState<SubTabType>('backgrounds');
    const [ selectedBackground, setSelectedBackground ] = useState<number>(0);
    const [ selectedStand, setSelectedStand ] = useState<number>(0);
    const [ selectedOverlay, setSelectedOverlay ] = useState<number>(0);
    const { roomSession } = useRoom();

    const userData = useMemo(() => ({
        isHcMember: GetClubMemberLevel() >= HabboClubLevelEnum.CLUB,
        securityLevel: GetSessionDataManager().canChangeName,
        isAmbassador: GetSessionDataManager().isAmbassador
    }), []);

    const processData = useCallback((configData: any[], dataType: string): ItemData[] =>
    {
        if(!configData?.length) return [];

        return configData
            .filter(item =>
            {
                const meetsRank = userData.securityLevel >= item.minRank;
                const ambassadorEligible = !item.isAmbassadorOnly || userData.isAmbassador;
                return item.isHcOnly || (meetsRank && ambassadorEligible);
            })
            .map(item => ({ id: item[`${ dataType }Id`], ...item, selectable: !item.isHcOnly || userData.isHcMember }));
    }, [ userData ]);

    const allData = useMemo(() => ({
        backgrounds: processData(GetConfigurationValue('backgrounds.data'), 'background'),
        stands: processData(GetConfigurationValue('stands.data'), 'stand'),
        overlays: processData(GetConfigurationValue('overlays.data'), 'overlay')
    }), [ processData ]);

    const handleSelection = useCallback((id: number) =>
    {
        if(!roomSession) return;

        const setters = { backgrounds: setSelectedBackground, stands: setSelectedStand, overlays: setSelectedOverlay };
        const currentValues = { backgrounds: selectedBackground, stands: selectedStand, overlays: selectedOverlay };

        setters[activeSubTab](id);
        const newValues = { ...currentValues, [activeSubTab]: id };
        roomSession.sendBackgroundMessage(newValues.backgrounds, newValues.stands, newValues.overlays);
    }, [ activeSubTab, roomSession, selectedBackground, selectedStand, selectedOverlay ]);

    const renderItem = useCallback((item: ItemData, type: string) => (
        <Flex
            pointer
            position="relative"
            key={ item.id }
            onClick={ () => item.selectable && handleSelection(item.id) }
            className={ item.selectable ? '' : 'non-selectable' }
        >
            <Base className={ `profile-${ type } ${ type }-${ item.id }` } />
            { item.isHcOnly && <LayoutCurrencyIcon position="absolute" className="top-1 inset-e-1" type="hc" /> }
        </Flex>
    ), [ handleSelection ]);

    return (
        <Flex column gap={ 1 }>
            <Flex gap={ 1 } className="justify-center">
                { SUB_TABS.map(tab => (
                    <button
                        key={ tab }
                        className={ `px-3 py-1 rounded text-sm cursor-pointer transition-colors ${ activeSubTab === tab ? 'bg-primary text-white' : 'bg-card-grid-item text-black hover:bg-card-grid-item-active' }` }
                        onClick={ () => setActiveSubTab(tab) }
                    >
                        { SUB_TAB_LABELS[tab] }
                    </button>
                )) }
            </Flex>
            { !roomSession && (
                <Text bold center className="text-black py-4">Entra in una stanza per modificare il profilo</Text>
            ) }
            { roomSession && (
                <Grid gap={ 1 } columnCount={ 7 } overflow="auto" className="max-h-[300px]">
                    { allData[activeSubTab].map(item => renderItem(item, activeSubTab.slice(0, -1))) }
                </Grid>
            ) }
        </Flex>
    );
};
