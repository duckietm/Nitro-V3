import { FC } from 'react';
import { FaPlus } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../../api';
import { LayoutCurrencyIcon, Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';

interface CatalogPriceDisplayWidgetViewProps
{
    offer: IPurchasableOffer;
    separator?: boolean;
}

export const CatalogPriceDisplayWidgetView: FC<CatalogPriceDisplayWidgetViewProps> = props =>
{
    const { offer = null, separator = false } = props;
    const { purchaseOptions = null } = useCatalog();
    const { quantity = 1 } = purchaseOptions;

    if(!offer) return null;

    return (
        <div className="flex items-center gap-1.5">
            { (offer.priceInCredits > 0) &&
                <div className="flex items-center gap-1 bg-warning/15 border border-warning/40 rounded-full px-2 py-0.5">
                    <Text className="text-[11px]! font-bold text-dark">{ (offer.priceInCredits * quantity) }</Text>
                    <LayoutCurrencyIcon type={ -1 } />
                </div> }
            { separator && (offer.priceInCredits > 0) && (offer.priceInActivityPoints > 0) &&
                <FaPlus className="text-[7px] text-muted" /> }
            { (offer.priceInActivityPoints > 0) &&
                <div className="flex items-center gap-1 bg-purple/15 border border-purple/40 rounded-full px-2 py-0.5">
                    <Text className="text-[11px]! font-bold text-dark">{ (offer.priceInActivityPoints * quantity) }</Text>
                    <LayoutCurrencyIcon type={ offer.activityPointType } />
                </div> }
        </div>
    );
};
