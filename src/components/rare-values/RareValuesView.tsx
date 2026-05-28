import { AddLinkEventTracker, GetRoomEngine, GetSessionDataManager, ILinkEventTracker, IRareValue, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeFormattedNumber, LocalizeText } from '../../api';
import { Column, Flex, LayoutCurrencyIcon, LayoutImage, Text } from '../../common';
import { useRareValues } from '../../hooks';
import { NitroCard, NitroInput } from '../../layout';

interface RareValueRow
{
    spriteId: number;
    name: string;
    iconUrl: string;
    value: IRareValue;
}

export const RareValuesView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ searchValue, setSearchValue ] = useState('');
    const { values = null, loaded = false } = useRareValues();

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(prev => !prev); return;
                }
            },
            eventUrlPrefix: 'rare-values/',
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const rows = useMemo<RareValueRow[]>(() =>
    {
        if(!values) return [];

        const list: RareValueRow[] = [];

        values.forEach((value, spriteId) =>
        {
            if(value.points <= 0) return;

            const floorData = GetSessionDataManager().getFloorItemData(spriteId);
            const wallData = floorData ? null : GetSessionDataManager().getWallItemData(spriteId);
            const data = (floorData ?? wallData);

            if(!data) return;

            const iconUrl = (floorData
                ? GetRoomEngine().getFurnitureFloorIconUrl(spriteId)
                : GetRoomEngine().getFurnitureWallIconUrl(spriteId));

            list.push({ spriteId, name: (data.name || data.className || `#${ spriteId }`), iconUrl, value });
        });

        list.sort((a, b) => (b.value.points - a.value.points));

        return list;
    }, [ values ]);

    const filtered = useMemo<RareValueRow[]>(() =>
    {
        const query = searchValue.trim().toLocaleLowerCase();

        if(!query) return rows;

        return rows.filter(row => row.name.toLocaleLowerCase().includes(query));
    }, [ rows, searchValue ]);

    if(!isVisible) return null;

    return (
        <NitroCard className="w-[420px] h-[480px]" uniqueKey="rare-values">
            <NitroCard.Header
                headerText={ LocalizeText('rarevalues.title') }
                onCloseClick={ () => setIsVisible(false) } />
            <NitroCard.Content>
                <Column gap={ 2 } className="h-full p-1">
                    <NitroInput
                        placeholder={ LocalizeText('generic.search') }
                        value={ searchValue }
                        onChange={ event => setSearchValue(event.target.value) } />
                    <Column gap={ 0 } overflow="auto" className="grow">
                        { !loaded &&
                            <Text center className="mt-2 text-black/60">{ LocalizeText('rarevalues.loading') }</Text> }
                        { (loaded && !filtered.length) &&
                            <Text center className="mt-2 text-black/60">{ LocalizeText('rarevalues.empty') }</Text> }
                        { filtered.map(row => (
                            <Flex key={ row.spriteId } alignItems="center" gap={ 2 } className="border-b border-black/10 py-1.5 hover:bg-black/5">
                                <LayoutImage imageUrl={ row.iconUrl } className="h-10 w-10 shrink-0 bg-contain bg-center bg-no-repeat" />
                                <Text truncate className="grow text-[#1f2d34]">{ row.name }</Text>
                                <Flex alignItems="center" gap={ 1 } className="shrink-0">
                                    <Text bold textEnd className="text-[#2f6f95]">{ LocalizeFormattedNumber(row.value.points) }</Text>
                                    <LayoutCurrencyIcon type={ row.value.pointsType } />
                                </Flex>
                            </Flex>
                        )) }
                    </Column>
                </Column>
            </NitroCard.Content>
        </NitroCard>
    );
};
