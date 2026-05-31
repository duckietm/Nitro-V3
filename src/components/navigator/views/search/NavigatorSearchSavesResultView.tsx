import { NavigatorSavedSearch } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { FaBolt } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { NavigatorSearchSavesResultItemView } from './NavigatorSearchSavesResultItemView';

export interface NavigatorSearchSavesResultViewProps
{
    searches: NavigatorSavedSearch[];
}

export const NavigatorSearchSavesResultView: FC<NavigatorSearchSavesResultViewProps> = props =>
{
    const { searches = [] } = props;

    return (
        <Column className="nitro-navigator-search-saves-result h-full min-w-[100px] sm:w-[150px]" gap={ 1 }>
            <Flex className="rounded px-2 py-1 bg-orange-500 shrink-0" gap={ 1 } alignItems="center">
                <FaBolt color="white" />
                <Text variant="white" truncate>{ LocalizeText('navigator.quick.links.title') }</Text>
            </Flex>
            <Column className="flex-1 min-h-0 p-1 overflow-x-hidden overflow-y-auto" gap={ 0 }>
                { (searches && searches.length > 0)
                    ? searches.map((search: NavigatorSavedSearch) => (
                        <NavigatorSearchSavesResultItemView key={ search.id } search={ search } />
                    ))
                    : <Flex center className="py-4 opacity-30">
                        <FaBolt className="text-orange-500" size={ 22 } />
                    </Flex> }
            </Column>
        </Column>
    );
};
