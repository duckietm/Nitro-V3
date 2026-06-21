import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { CatalogType, GetConfigurationValue, IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView, LayoutGridItem, LayoutGridItemProps } from '../../../../../common';
import { useCatalogActions, useCatalogFavorites, useCatalogUiState, useInventoryFurni } from '../../../../../hooks';

interface CatalogGridOfferViewProps extends LayoutGridItemProps {
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer) => void;
    tintColor?: string;
}

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = (props) => {
    const { offer = null, selectOffer = null, itemActive = false, tintColor = null, ...rest } = props;
    const [isMouseDown, setMouseDown] = useState(false);
    const { requestOfferToMover = null } = useCatalogActions();
    const { currentType = CatalogType.NORMAL } = useCatalogUiState();
    const { isVisible = false } = useInventoryFurni();
    const { isFavoriteOffer, toggleFavoriteOffer } = useCatalogFavorites();
    const isFav = offer ? isFavoriteOffer(offer.offerId) : false;

    const iconUrl = useMemo(() => {
        if (!offer) return null;

        if (offer.pricingModel === Offer.PRICING_MODEL_BUNDLE) {
            return null;
        }

        const product = offer.product;

        if (!product) return null;

        if (product.productType === ProductTypeEnum.FLOOR || product.productType === ProductTypeEnum.WALL) {
            const className = product.furnitureData?.className;

            if (className?.length) {
                let param = '';

                if (product.productType === ProductTypeEnum.WALL && product.extraParam?.length) {
                    param = `_${product.extraParam}`;
                } else if (product.productType === ProductTypeEnum.FLOOR && product.furnitureData?.hasIndexedColor && product.furnitureData.colorIndex > 0) {
                    param = `_${product.furnitureData.colorIndex}`;
                }

                const configuredIconUrl = GetConfigurationValue<string>('furni.asset.icon.url', '');

                if (configuredIconUrl?.length) {
                    return configuredIconUrl.replace('%libname%', className).replace('%param%', param);
                }
            }
        }

        return product.getIconUrl(offer) ?? null;
    }, [offer]);

    const prices = useMemo(() => {
        if (!offer) return [];

        const values: { amount: number; type: number }[] = [];

        if (offer.priceInCredits > 0) values.push({ amount: offer.priceInCredits, type: -1 });
        if (offer.priceInActivityPoints > 0) values.push({ amount: offer.priceInActivityPoints, type: offer.activityPointType });

        return values;
    }, [offer]);

    const getCurrencyIconUrl = (type: number) => {
        const configuredCurrencyUrl = GetConfigurationValue<string>('currency.asset.icon.url', '');

        return configuredCurrencyUrl.replace('%type%', type.toString());
    };

    const onMouseEvent = (event: MouseEvent) => {
        switch (event.type) {
            case MouseEventType.MOUSE_DOWN:
                selectOffer(offer);
                setMouseDown(true);
                return;
            case MouseEventType.MOUSE_UP:
                setMouseDown(false);
                return;
            case MouseEventType.ROLL_OUT:
                if (!isMouseDown || !itemActive) return;
                if (currentType === CatalogType.BUILDER) return;
                if (!isVisible) return;

                requestOfferToMover(offer);
                return;
        }
    };

    if (!offer) return null;

    const product = offer.product;

    if (!product) return null;

    return (
        <LayoutGridItem
            className={`group/tile relative ${itemActive ? 'is-active' : ''}`}
            gap={1}
            itemActive={itemActive}
            itemCount={offer.pricingModel === Offer.PRICING_MODEL_MULTI ? product.productCount : 1}
            itemUniqueNumber={product.uniqueLimitedItemSeriesSize}
            itemUniqueSoldout={product.uniqueLimitedItemSeriesSize && !product.uniqueLimitedItemsLeft}
            title={`ID: ${product.productClassId} | Offer: ${offer.offerId}`}
            onMouseDown={onMouseEvent}
            onMouseOut={onMouseEvent}
            onMouseUp={onMouseEvent}
            {...rest}
        >
            {iconUrl && !(offer.product.productType === ProductTypeEnum.ROBOT) && (
                <img
                    className="nitro-catalog-grid-offer-icon"
                    src={iconUrl}
                    draggable={false}
                    style={tintColor ? { filter: 'url(#guild-furni-recolor)', transform: 'translateZ(0)' } : undefined}
                    onError={(event) => {
                        const fallbackIconUrl = product.getIconUrl(offer);

                        if (fallbackIconUrl && event.currentTarget.src !== fallbackIconUrl) event.currentTarget.src = fallbackIconUrl;
                    }}
                />
            )}
            {offer.product.productType === ProductTypeEnum.ROBOT && <LayoutAvatarImageView direction={2} figure={offer.product.extraParam} fit />}
            {prices.length > 0 && (
                <span className={`nitro-catalog-grid-price ${prices.length > 1 ? 'is-multi-price' : 'is-single-price'}`}>
                    {prices.map((price, index) => (
                        <span key={`${price.type}-${index}`} className="nitro-catalog-grid-price-entry">
                            {index > 0 && <span className="nitro-catalog-grid-price-plus">+</span>}
                            <span className="nitro-catalog-grid-price-amount">{price.amount}</span>
                            <img className="nitro-catalog-grid-price-currency" src={getCurrencyIconUrl(price.type)} draggable={false} />
                        </span>
                    ))}
                </span>
            )}
            <div
                className={`absolute top-0 right-0 z-10 p-0.5 cursor-pointer transition-opacity duration-100 ${isFav ? 'opacity-100' : 'opacity-0 group-hover/tile:opacity-100'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleFavoriteOffer(offer.offerId, offer.localizationName, iconUrl);
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <FaHeart className={`text-[10px] drop-shadow transition-colors duration-100 ${isFav ? 'text-danger' : 'text-muted hover:text-danger'}`} />
            </div>
        </LayoutGridItem>
    );
};
