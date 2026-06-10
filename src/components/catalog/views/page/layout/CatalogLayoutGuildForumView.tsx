import { FC } from 'react';
import { SanitizeHtml } from '../../../../../api';
import { Column, Flex, Grid } from '../../../../../common';
import { LayoutImage } from '../../../../../common/layout/LayoutImage';
import { useCatalogData, useUserGroups } from '../../../../../hooks';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayouGuildForumView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null } = useCatalogData();
    const { data: groups = null } = useUserGroups();

    const teaserImage = page.localization.getImage(1);
    const hasGroups = !!(groups && groups.length);

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Grid overflow="hidden">
                <Column overflow="hidden" size={ 8 }>
                    <div className="nitro-catalog-forum-text grow! min-h-0 overflow-auto text-black" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(1)) } } />
                    { !!currentOffer &&
                        <Flex alignItems="center" className="shrink-0" gap={ 2 }>
                            <CatalogTotalPriceWidget />
                            <div className="grow!">
                                <CatalogGuildSelectorWidgetView />
                            </div>
                            { hasGroups &&
                                <CatalogPurchaseWidgetView noGiftOption={ true } /> }
                        </Flex> }
                </Column>
                <Column alignItems="center" overflow="hidden" size={ 4 }>
                    { !!teaserImage &&
                        <LayoutImage className="max-w-full" imageUrl={ teaserImage } /> }
                </Column>
            </Grid>
        </>
    );
};
