import { NavigatorSavedSearch } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import quicklinkAdd from '../../../../assets/images/navigator/air/quicklink-add.png';
import { Column, Flex, Text } from '../../../../common';
import { NavigatorSearchSavesResultItemView } from './NavigatorSearchSavesResultItemView';

export interface NavigatorSearchSavesResultViewProps {
    searches: NavigatorSavedSearch[];
}

export const NavigatorSearchSavesResultView: FC<NavigatorSearchSavesResultViewProps> = (props) => {
    const { searches = [] } = props;

    return (
        <Column className="nitro-navigator-search-saves-result h-full" gap={0}>
            <Flex className="nitro-navigator-search-saves-result__header shrink-0" gap={1} alignItems="center">
                <img src={quicklinkAdd} alt="" />
                <Text variant="white" truncate>
                    {LocalizeText('navigator.quick.links.title')}
                </Text>
            </Flex>
            <Column className="nitro-navigator-search-saves-result__list flex-1 min-h-0 overflow-x-hidden overflow-y-auto" gap={0}>
                {searches && searches.length > 0 ? (
                    searches.map((search: NavigatorSavedSearch) => <NavigatorSearchSavesResultItemView key={search.id} search={search} />)
                ) : (
                    <Flex center className="py-4 opacity-30">
                        <img src={quicklinkAdd} alt="" />
                    </Flex>
                )}
            </Column>
        </Column>
    );
};
