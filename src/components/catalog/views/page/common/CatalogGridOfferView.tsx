import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { CatalogType, IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView, LayoutGridItem, LayoutGridItemProps } from '../../../../../common';
import { useCatalogActions, useCatalogFavorites, useCatalogUiState, useInventoryFurni } from '../../../../../hooks';

interface CatalogGridOfferViewProps extends LayoutGridItemProps
{
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer) => void;
}

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = props =>
{
    const { offer = null, selectOffer = null, itemActive = false, ...rest } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const { requestOfferToMover = null } = useCatalogActions();
    const { currentType = CatalogType.NORMAL } = useCatalogUiState();
    const { isVisible = false } = useInventoryFurni();
    const { isFavoriteOffer, toggleFavoriteOffer } = useCatalogFavorites();
    const isFav = offer ? isFavoriteOffer(offer.offerId) : false;

    const iconUrl = useMemo(() =>
    {
        if(!offer) return null;

        if(offer.pricingModel === Offer.PRICING_MODEL_BUNDLE)
        {
            return null;
        }

        return offer.product?.getIconUrl(offer) ?? null;
    }, [ offer ]);

    const onMouseEvent = (event: MouseEvent) =>
    {
        switch(event.type)
        {
            case MouseEventType.MOUSE_DOWN:
                selectOffer(offer);
                setMouseDown(true);
                return;
            case MouseEventType.MOUSE_UP:
                setMouseDown(false);
                return;
            case MouseEventType.ROLL_OUT:
                if(!isMouseDown || !itemActive) return;
                if(currentType === CatalogType.BUILDER) return;
                if(!isVisible) return;

                requestOfferToMover(offer);
                return;
        }
    };

    if(!offer) return null;

    const product = offer.product;

    if(!product) return null;

    return (
        <LayoutGridItem
            className={ `group/tile relative ${ itemActive ? 'is-active' : '' }` }
            itemActive={ itemActive }
            itemCount={ ((offer.pricingModel === Offer.PRICING_MODEL_MULTI) ? product.productCount : 1) }
            itemUniqueNumber={ product.uniqueLimitedItemSeriesSize }
            itemUniqueSoldout={ (product.uniqueLimitedItemSeriesSize && !product.uniqueLimitedItemsLeft) }
            title={ `ID: ${ product.productClassId } | Offer: ${ offer.offerId }` }
            onMouseDown={ onMouseEvent }
            onMouseOut={ onMouseEvent }
            onMouseUp={ onMouseEvent }
            { ...rest }
        >
            { iconUrl && !(offer.product.productType === ProductTypeEnum.ROBOT) &&
                <div className="nitro-catalog-classic-grid-offer-icon" style={ { backgroundImage: `url(${ iconUrl })` } } /> }
            { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                <LayoutAvatarImageView direction={ 2 } figure={ offer.product.extraParam } fit /> }
            <div
                className={ `absolute top-0 right-0 z-10 p-0.5 cursor-pointer transition-opacity duration-100 ${ isFav ? 'opacity-100' : 'opacity-0 group-hover/tile:opacity-100' }` }
                onClick={ e =>
                {
                    e.stopPropagation(); e.preventDefault(); toggleFavoriteOffer(offer.offerId, offer.localizationName, iconUrl);
                } }
                onMouseDown={ e => e.stopPropagation() }
            >
                <FaHeart className={ `text-[10px] drop-shadow transition-colors duration-100 ${ isFav ? 'text-danger' : 'text-muted hover:text-danger' }` } />
            </div>
        </LayoutGridItem>
    );
};
