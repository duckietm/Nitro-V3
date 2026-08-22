import { NavigatorSearchComposer, NavigatorSearchResultList, NavigatorSearchSaveComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { LocalizeText, localizeWithFallback, NavigatorSearchResultViewDisplayMode, SendMessageComposer } from '../../../../api';
import categoryCollapse from '../../../../assets/images/navigator/air/category-collapse.png';
import categoryExpand from '../../../../assets/images/navigator/air/category-expand.png';
import categoryShowMore from '../../../../assets/images/navigator/air/category-show-more.png';
import navViewMini from '../../../../assets/images/navigator/air/nav-view-mini.png';
import navViewRow from '../../../../assets/images/navigator/air/nav-view-row.png';
import navViewThumbs from '../../../../assets/images/navigator/air/nav-view-thumbs.png';
import { AutoGrid, AutoGridProps, Column, Flex, Grid, LayoutSearchSavesView, Text } from '../../../../common';
import { useNavigatorData, useNavigatorUiStore } from '../../../../hooks';
import { NavigatorSearchResultItemView } from './NavigatorSearchResultItemView';

export interface NavigatorSearchResultViewProps extends AutoGridProps {
    searchResult: NavigatorSearchResultList;
}

export const NavigatorSearchResultView: FC<NavigatorSearchResultViewProps> = (props) => {
    const { searchResult = null, ...rest } = props;
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [isPopoverActive, setIsPopoverActive] = useState<boolean>(false);

    const { topLevelContext } = useNavigatorData();
    const isExtended = useNavigatorUiStore(
        (state) => state.expandedResultCodes.includes(searchResult.code) || (!state.collapsedResultCodes.includes(searchResult.code) && !searchResult.closed)
    );
    const displayMode = useNavigatorUiStore((state) => state.resultViewModes[searchResult.code] ?? searchResult.mode);

    const getResultTitle = () => {
        const name = searchResult.code;

        if (!name || !name.length) return searchResult.data;
        if (name.startsWith('${')) return name.slice(2, name.length - 1);

        return localizeWithFallback('navigator.searchcode.title.' + name, searchResult.data || name);
    };

    const toggleDisplayMode = () => {
        const nextMode =
            displayMode === NavigatorSearchResultViewDisplayMode.LIST
                ? NavigatorSearchResultViewDisplayMode.THUMBNAILS
                : NavigatorSearchResultViewDisplayMode.LIST;

        useNavigatorUiStore.getState().setResultViewMode(searchResult.code, nextMode);
    };

    const showMore = () => {
        if (searchResult.action == 1) SendMessageComposer(new NavigatorSearchComposer(searchResult.code, ''));
        else if (searchResult.action == 2 && topLevelContext) SendMessageComposer(new NavigatorSearchComposer(topLevelContext.code, ''));
    };

    const gridHasTwoColumns = displayMode >= NavigatorSearchResultViewDisplayMode.THUMBNAILS;
    const resultTitle = getResultTitle();
    const listViewLabel = localizeWithFallback('navigator.viewmode.list', 'Show rooms as a list');
    const tileViewLabel = localizeWithFallback('navigator.viewmode.tiles', 'Show rooms as tiles');

    return (
        <Column className="nitro-card-panel" gap={0}>
            <Flex fullWidth alignItems="center" className="nitro-navigator-air__category-header" justifyContent="between">
                <button
                    type="button"
                    className="nitro-navigator-air__category-toggle flex grow items-center gap-1"
                    aria-label={resultTitle}
                    aria-expanded={isExtended}
                    onClick={() => useNavigatorUiStore.getState().setResultCollapsed(searchResult.code, isExtended)}
                >
                    <img src={isExtended ? categoryCollapse : categoryExpand} alt="" />
                    <Text>{resultTitle}</Text>
                </button>
                <div className="flex gap-[5px] items-center">
                    {displayMode === NavigatorSearchResultViewDisplayMode.LIST && (
                        <button
                            type="button"
                            className="nitro-navigator-air__icon-button"
                            aria-label={tileViewLabel}
                            title={tileViewLabel}
                            onClick={toggleDisplayMode}
                        >
                            <img src={navViewThumbs} alt="" />
                        </button>
                    )}
                    {displayMode >= NavigatorSearchResultViewDisplayMode.THUMBNAILS && (
                        <button
                            type="button"
                            className="nitro-navigator-air__icon-button"
                            aria-label={listViewLabel}
                            title={listViewLabel}
                            onClick={toggleDisplayMode}
                        >
                            <img src={navViewRow} alt="" />
                        </button>
                    )}
                    {searchResult.action > 0 && searchResult.action === 1 && (
                        <button
                            type="button"
                            className="nitro-navigator-air__icon-button"
                            title={LocalizeText('navigator.more.rooms')}
                            onClick={showMore}
                        >
                            <img src={categoryShowMore} alt="" />
                        </button>
                    )}
                    {searchResult.action > 0 && searchResult.action !== 1 && (
                        <button type="button" className="nitro-navigator-air__icon-button" title={LocalizeText('navigator.back')} onClick={showMore}>
                            <img src={navViewMini} alt="" />
                        </button>
                    )}
                    <LayoutSearchSavesView
                        title={LocalizeText('navigator.tooltip.add.saved.search')}
                        onClick={() => SendMessageComposer(new NavigatorSearchSaveComposer(resultTitle, searchResult.data))}
                    />
                </div>
            </Flex>
            {isExtended && (
                <>
                    {gridHasTwoColumns ? (
                        <AutoGrid columnCount={3} {...rest} className="mx-1" columnMinHeight={146} columnMinWidth={122}>
                            {searchResult.rooms.length > 0 &&
                                searchResult.rooms.map((room, index) => (
                                    <NavigatorSearchResultItemView
                                        key={index}
                                        roomData={room}
                                        thumbnail={true}
                                        isPopoverActive={isPopoverActive}
                                        setIsPopoverActive={setIsPopoverActive}
                                        selectedRoomId={selectedRoomId}
                                        setSelectedRoomId={setSelectedRoomId}
                                    />
                                ))}
                        </AutoGrid>
                    ) : (
                        <Grid className="navigator-grid" columnCount={1} gap={0}>
                            {searchResult.rooms.length > 0 &&
                                searchResult.rooms.map((room, index) => (
                                    <NavigatorSearchResultItemView
                                        key={index}
                                        roomData={room}
                                        isPopoverActive={isPopoverActive}
                                        setIsPopoverActive={setIsPopoverActive}
                                        selectedRoomId={selectedRoomId}
                                        setSelectedRoomId={setSelectedRoomId}
                                    />
                                ))}
                        </Grid>
                    )}
                    {searchResult.rooms.length === 0 && (
                        <Text className="px-3 py-2 text-sm" variant="muted">
                            {LocalizeText(
                                searchResult.code === 'myworld_view' ? 'navigator.roomsettings.moderation.none' : 'navigator.search.returned.no.results'
                            )}
                        </Text>
                    )}
                </>
            )}
        </Column>
    );
};
