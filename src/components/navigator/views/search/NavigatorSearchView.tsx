import { NavigatorSearchResultSet } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { INavigatorSearchFilter, LocalizeText, SearchFilterOptions } from '../../../../api';
import { Button } from '../../../../common';
import { useNavigatorData, useNavigatorUiStore } from '../../../../hooks';
import { NavigatorFilterChipsView } from './NavigatorFilterChipsView';

interface NavigatorSearchViewProps
{
    searchResult: NavigatorSearchResultSet | null;
}

export const NavigatorSearchView: FC<NavigatorSearchViewProps> = props =>
{
    const { searchResult } = props;
    const [ searchFilterIndex, setSearchFilterIndex ] = useState(0);
    const [ inputText, setInputText ] = useState('');
    const formRef = useRef<HTMLFormElement>(null);
    const { topLevelContext } = useNavigatorData();

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

    // React 19 form action — fires on Enter or the submit button, skipping the
    // debounce timer for an immediate search.
    const submitSearch = (formData: FormData) =>
    {
        if(!topLevelContext) return;
        const raw = formData.get('q');
        const value = (typeof raw === 'string') ? raw : inputText;
        const searchFilter = SearchFilterOptions[searchFilterIndex] ?? SearchFilterOptions[0];
        const searchQuery = (searchFilter.query ? (searchFilter.query + ':') : '') + value;
        useNavigatorUiStore.getState().setFilter(searchQuery);
    };

    return (
        <div className="flex w-full flex-col gap-1">
            <NavigatorFilterChipsView value={ searchFilterIndex } onChange={ setSearchFilterIndex } />
            <form ref={ formRef } action={ submitSearch } className="flex w-full gap-1">
                <input className="w-full form-control" name="q" placeholder={ LocalizeText('navigator.filter.input.placeholder') } type="text" value={ inputText } onChange={ event => setInputText(event.target.value) } />
                <Button variant="primary" onClick={ () => formRef.current?.requestSubmit() }>
                    <FaSearch className="fa-icon" />
                </Button>
            </form>
        </div>
    );
};
