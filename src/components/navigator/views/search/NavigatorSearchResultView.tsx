import { NavigatorSearchComposer, NavigatorSearchResultList, NavigatorSearchSaveComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaBars, FaMinus, FaPlus, FaTh, FaWindowMaximize, FaWindowRestore } from 'react-icons/fa';
import { LocalizeText, NavigatorSearchResultViewDisplayMode, SendMessageComposer } from '../../../../api';
import { AutoGrid, AutoGridProps, Column, Flex, Grid, LayoutSearchSavesView, Text } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import { NavigatorSearchResultItemView } from './NavigatorSearchResultItemView';

export interface NavigatorSearchResultViewProps extends AutoGridProps
{
    searchResult: NavigatorSearchResultList;
}

export const NavigatorSearchResultView: FC<NavigatorSearchResultViewProps> = props =>
{
    const { searchResult = null, ...rest } = props;
    const [ isExtended, setIsExtended ] = useState(true);
    const [ displayMode, setDisplayMode ] = useState<number>(0);
    const [ selectedRoomId, setSelectedRoomId ] = useState<number | null>(null);
    const [ isPopoverActive, setIsPopoverActive ] = useState<boolean>(false);

    const { topLevelContext = null } = useNavigator();

    const getResultTitle = () =>
    {
        let name = searchResult.code;

        if(!name || !name.length || LocalizeText('navigator.searchcode.title.' + name) === ('navigator.searchcode.title.' + name)) return searchResult.data;

        if(name.startsWith('${')) return name.slice(2, (name.length - 1));

        return ('navigator.searchcode.title.' + name);
    };

    const toggleDisplayMode = () =>
    {
        setDisplayMode(prevValue =>
        {
            if(prevValue === NavigatorSearchResultViewDisplayMode.LIST) return NavigatorSearchResultViewDisplayMode.THUMBNAILS;

            return NavigatorSearchResultViewDisplayMode.LIST;
        });
    };

    const showMore = () =>
    {
        if(searchResult.action == 1) SendMessageComposer(new NavigatorSearchComposer(searchResult.code, ''));
        else if(searchResult.action == 2 && topLevelContext) SendMessageComposer(new NavigatorSearchComposer(topLevelContext.code, ''));
    };

    useEffect(() =>
    {
        if(!searchResult) return;

        setIsExtended(!searchResult.closed);
        setDisplayMode(searchResult.mode);
    }, [ searchResult ]);

    const gridHasTwoColumns = (displayMode >= NavigatorSearchResultViewDisplayMode.THUMBNAILS);

    return (
        <Column className="bg-white rounded border border-muted" gap={ 0 }>
            <Flex fullWidth alignItems="center" className="px-2 py-1" justifyContent="between">
                <Flex grow pointer alignItems="center" gap={ 1 } onClick={ event => setIsExtended(prevValue => !prevValue) }>
                    { isExtended && <FaMinus className="text-secondary fa-icon" /> }
                    { !isExtended && <FaPlus className="text-secondary fa-icon" /> }
                    <Text>{ LocalizeText(getResultTitle()) }</Text>
                </Flex>
                <div className="flex gap-2 items-center">
                    { (displayMode === NavigatorSearchResultViewDisplayMode.LIST) && <FaTh className="text-secondary fa-icon cursor-pointer" onClick={ toggleDisplayMode } /> }
                    { (displayMode >= NavigatorSearchResultViewDisplayMode.THUMBNAILS) && <FaBars className="text-secondary fa-icon cursor-pointer" onClick={ toggleDisplayMode } /> }
                    { (searchResult.action > 0) && (searchResult.action === 1) && <FaWindowMaximize className="text-secondary fa-icon cursor-pointer" title={ LocalizeText('navigator.more.rooms') } onClick={ showMore } /> }
                    { (searchResult.action > 0) && (searchResult.action !== 1) && <FaWindowRestore className="text-secondary fa-icon cursor-pointer" title={ LocalizeText('navigator.back') } onClick={ showMore } /> }
                    <LayoutSearchSavesView
                        title={ LocalizeText('navigator.tooltip.add.saved.search') }
                        onClick={ () => SendMessageComposer(new NavigatorSearchSaveComposer(getResultTitle(), searchResult.data)) }
                    />
                </div>
            </Flex>
            { isExtended &&
                <>
                    { gridHasTwoColumns
                        ? <AutoGrid columnCount={ 3 } { ...rest } className="mx-2" columnMinHeight={ 130 } columnMinWidth={ 110 }>
                            { searchResult.rooms.length > 0 && searchResult.rooms.map((room, index) => (
                                <NavigatorSearchResultItemView
                                    key={ index }
                                    roomData={ room }
                                    thumbnail={ true }
                                    isPopoverActive={ isPopoverActive }
                                    setIsPopoverActive={ setIsPopoverActive }
                                    selectedRoomId={ selectedRoomId }
                                    setSelectedRoomId={ setSelectedRoomId }
                                />
                            )) }
                        </AutoGrid>
                        : <Grid className="navigator-grid" columnCount={ 1 } gap={ 0 }>
                            { searchResult.rooms.length > 0 && searchResult.rooms.map((room, index) => (
                                <NavigatorSearchResultItemView
                                    key={ index }
                                    roomData={ room }
                                    isPopoverActive={ isPopoverActive }
                                    setIsPopoverActive={ setIsPopoverActive }
                                    selectedRoomId={ selectedRoomId }
                                    setSelectedRoomId={ setSelectedRoomId }
                                />
                            )) }
                        </Grid> }
                </> }
        </Column>
    );
};
