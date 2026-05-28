import { NavigatorSearchComposer, NavigatorSearchEvent, NavigatorSearchResultSet } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { useNavigatorUiStore } from './navigatorUiStore';


export const useNavigatorSearch = () =>
{
    const tabCode = useNavigatorUiStore(s => s.currentTabCode);
    const filter  = useNavigatorUiStore(s => s.currentFilter);

    const [ searchResult, setSearchResult ] = useState<NavigatorSearchResultSet | null>(null);
    const [ isFetching, setIsFetching ] = useState(false);

    useEffect(() =>
    {
        if(!tabCode) return;

        setIsFetching(true);
        SendMessageComposer(new NavigatorSearchComposer(tabCode, filter));
    }, [ tabCode, filter ]);

    useMessageEvent<NavigatorSearchEvent>(NavigatorSearchEvent, event =>
    {
        const result = event.getParser()?.result;
        if(!result) return;

        if(tabCode && result.code !== tabCode) return;

        setSearchResult(result);
        setIsFetching(false);
    });

    return {
        searchResult,
        isFetching,
        refetch: () =>
        {
            if(!tabCode) return;
            setIsFetching(true);
            SendMessageComposer(new NavigatorSearchComposer(tabCode, filter));
        }
    };
};
