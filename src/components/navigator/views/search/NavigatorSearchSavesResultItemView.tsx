import { NavigatorDeleteSavedSearchComposer, NavigatorSavedSearch, NavigatorSearchComposer } from '@nitrots/nitro-renderer';
import { FC, MouseEvent } from 'react';
import { FaBolt } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { Flex, Text } from '../../../../common';

export interface NavigatorSearchSavesResultItemViewProps
{
    search: NavigatorSavedSearch;
}

export const NavigatorSearchSavesResultItemView: FC<NavigatorSearchSavesResultItemViewProps> = props =>
{
    const { search = null } = props;

    const getResultTitle = () =>
    {
        let name = search.code;

        if(!name || !name.length || LocalizeText('navigator.searchcode.title.' + name) === ('navigator.searchcode.title.' + name)) return search.code;

        if(name.startsWith('${')) return name.slice(2, (name.length - 1));

        return ('navigator.searchcode.title.' + name);
    };

    const openSearch = () => SendMessageComposer(new NavigatorSearchComposer(search.code.split('.').reverse()[0], search.filter));

    const deleteSearch = (event: MouseEvent) =>
    {
        event.stopPropagation();
        SendMessageComposer(new NavigatorDeleteSavedSearchComposer(search.id));
    };

    return (
        <Flex
            grow
            pointer
            alignItems="center"
            gap={ 1 }
            className="saved-search-row group px-1 py-0.5"
            title={ LocalizeText('navigator.tooltip.open.saved.search') }
            onClick={ openSearch }
        >
            <FaBolt className="text-orange-500 shrink-0 text-[10px]" />
            <Text small pointer truncate variant="black" className="grow! min-w-0">
                { LocalizeText(getResultTitle()) }
            </Text>
            <i
                className="nitro-icon icon-navigator-search-delete cursor-pointer flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                title={ LocalizeText('navigator.tooltip.remove.saved.search') }
                onClick={ deleteSearch }
            />
        </Flex>
    );
};
