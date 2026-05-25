import { FC } from 'react';
import { BaseProps, LayoutBadgeImageView } from '../../../../../common';
import { useCatalogData } from '../../../../../hooks';

interface CatalogAddOnBadgeWidgetViewProps extends BaseProps<HTMLDivElement>
{

}

export const CatalogAddOnBadgeWidgetView: FC<CatalogAddOnBadgeWidgetViewProps> = props =>
{
    const { ...rest } = props;
    const { currentOffer = null } = useCatalogData();

    if(!currentOffer || !currentOffer.badgeCode || !currentOffer.badgeCode.length) return null;

    return <LayoutBadgeImageView badgeCode={ currentOffer.badgeCode } { ...rest } />;
};
