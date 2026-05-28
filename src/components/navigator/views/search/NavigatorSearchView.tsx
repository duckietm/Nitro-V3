import { FC, KeyboardEvent, useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { INavigatorSearchFilter, LocalizeText, SearchFilterOptions } from '../../../../api';
import { Button } from '../../../../common';
import { useNavigatorData, useNavigatorSearch, useNavigatorUiStore } from '../../../../hooks';

export const NavigatorSearchView: FC<{}> = props =>
{
    const [ searchFilterIndex, setSearchFilterIndex ] = useState(0);
    const [ inputText, setInputText ] = useState('');
    const { topLevelContext } = useNavigatorData();
    const { searchResult } = useNavigatorSearch();

    // Sync the input text display when a server result arrives (e.g. on tab switch
    // or deep-link navigation that sets the filter through the store directly).
    useEffect(() =>
    {
        if(!searchResult) return;

        const split = searchResult.data.split(':');

        let filter: INavigatorSearchFilter = null;
        let value: string = '';

        if(split.length >= 2)
        {
            const [ query, ...rest ] = split;

            filter = SearchFilterOptions.find(option => (option.query === query));
            value = rest.join(':');
        }
        else
        {
            value = searchResult.data;
        }

        if(!filter) filter = SearchFilterOptions[0];

        setSearchFilterIndex(SearchFilterOptions.findIndex(option => (option === filter)));
        setInputText(value);
    }, [ searchResult ]);

    // Debounced filter — 300ms after the user stops typing, push to the store
    // which updates the query key and triggers a refetch.
    useEffect(() =>
    {
        const timer = setTimeout(() =>
        {
            const searchFilter = SearchFilterOptions[searchFilterIndex] ?? SearchFilterOptions[0];
            const searchQuery = (searchFilter.query ? (searchFilter.query + ':') : '') + inputText;
            useNavigatorUiStore.getState().setFilter(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [ inputText, searchFilterIndex ]);

    const processSearch = () =>
    {
        if(!topLevelContext) return;
        // Immediate submit — skip the debounce timer
        const searchFilter = SearchFilterOptions[searchFilterIndex] ?? SearchFilterOptions[0];
        const searchQuery = (searchFilter.query ? (searchFilter.query + ':') : '') + inputText;
        useNavigatorUiStore.getState().setFilter(searchQuery);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        processSearch();
    };

    return (
        <div className="flex w-full gap-1">
            <div className="flex shrink-0">
                <select className="form-select" value={ searchFilterIndex } onChange={ event => setSearchFilterIndex(parseInt(event.target.value)) }>
                    { SearchFilterOptions.map((filter, index) =>
                    {
                        return <option key={ index } value={ index }>{ LocalizeText('navigator.filter.' + filter.name) }</option>;
                    }) }
                </select>
            </div>
            <div className="flex w-full gap-1">
                <input className="w-full form-control" placeholder={ LocalizeText('navigator.filter.input.placeholder') } type="text" value={ inputText } onChange={ event => setInputText(event.target.value) } onKeyDown={ event => handleKeyDown(event) } />
                <Button variant="primary" onClick={ processSearch }>
                    <FaSearch className="fa-icon" />
                </Button>
            </div>
        </div>
    );
};
