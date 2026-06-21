import { FC } from 'react';
import { FaPlus } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../../api';
import { LayoutCurrencyIcon, Text } from '../../../../../common';
import { useCatalogUiState } from '../../../../../hooks';

interface CatalogPriceDisplayWidgetViewProps {
    offer: IPurchasableOffer;
    separator?: boolean;
}

export const CatalogPriceDisplayWidgetView: FC<CatalogPriceDisplayWidgetViewProps> = (props) => {
    const { offer = null, separator = false } = props;
    const { purchaseOptions = null } = useCatalogUiState();
    const { quantity = 1 } = purchaseOptions;

    if (!offer) return null;

    return (
        <div className="nitro-catalog-swf-price-display">
            {offer.priceInCredits > 0 && (
                <div className="nitro-catalog-swf-price-pill">
                    <Text className="nitro-catalog-swf-price-text">{offer.priceInCredits * quantity}</Text>
                    <LayoutCurrencyIcon type={-1} />
                </div>
            )}
            {separator && offer.priceInCredits > 0 && offer.priceInActivityPoints > 0 && <FaPlus className="nitro-catalog-swf-price-plus" />}
            {offer.priceInActivityPoints > 0 && (
                <div className="nitro-catalog-swf-price-pill">
                    <Text className="nitro-catalog-swf-price-text">{offer.priceInActivityPoints * quantity}</Text>
                    <LayoutCurrencyIcon type={offer.activityPointType} />
                </div>
            )}
        </div>
    );
};
