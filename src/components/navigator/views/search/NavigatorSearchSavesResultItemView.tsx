import { NavigatorDeleteSavedSearchComposer, NavigatorSavedSearch } from '@nitrots/nitro-renderer';
import { FC, MouseEvent } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import quicklinkPlain from '../../../../assets/images/navigator/air/icon-ql-plain.png';
import { Flex, Text } from '../../../../common';
import { useNavigatorUiStore } from '../../../../hooks';

export interface NavigatorSearchSavesResultItemViewProps {
    search: NavigatorSavedSearch;
}

export const NavigatorSearchSavesResultItemView: FC<NavigatorSearchSavesResultItemViewProps> = (props) => {
    const { search = null } = props;

    const getResultTitle = () => {
        let name = search.code;

        if (!name || !name.length || LocalizeText('navigator.searchcode.title.' + name) === 'navigator.searchcode.title.' + name) return search.code;

        if (name.startsWith('${')) return name.slice(2, name.length - 1);

        return 'navigator.searchcode.title.' + name;
    };

    // Drive the search through the navigator store so useNavigatorSearch
    // both fires the request AND accepts the response. Sending the
    // composer directly didn't work: the search hook only keeps a
    // NavigatorSearchEvent whose result.code matches the active tab, so a
    // raw search whose code differed from the current tab was discarded
    // (clicking a saved search appeared to do nothing).
    const openSearch = () => {
        const code = search.code.split('.').reverse()[0];
        const store = useNavigatorUiStore.getState();

        store.setTab(code);
        if (search.filter) store.setFilter(search.filter);
    };

    const deleteSearch = (event: MouseEvent) => {
        event.stopPropagation();
        SendMessageComposer(new NavigatorDeleteSavedSearchComposer(search.id));
    };

    const title = LocalizeText(getResultTitle());

    return (
        <Flex alignItems="center" className="saved-search-row group shrink-0">
            <button type="button" className="saved-search-row__open" title={LocalizeText('navigator.tooltip.open.saved.search')} onClick={openSearch}>
                <img src={quicklinkPlain} alt="" />
                <Text small truncate variant="black" className="grow! min-w-0 text-left">
                    {title}
                </Text>
            </button>
            <button
                type="button"
                className="saved-search-row__delete nitro-icon icon-navigator-search-delete"
                aria-label={`${LocalizeText('navigator.tooltip.remove.saved.search')} ${title}`}
                title={LocalizeText('navigator.tooltip.remove.saved.search')}
                onClick={deleteSearch}
            />
        </Flex>
    );
};
