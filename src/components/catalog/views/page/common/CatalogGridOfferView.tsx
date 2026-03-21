import { MouseEventType } from '@nitrots/api';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView, LayoutGridItem, LayoutGridItemProps } from '../../../../../common';
import { useCatalog, useCatalogFavorites, useInventoryFurni } from '../../../../../hooks';

interface CatalogGridOfferViewProps extends LayoutGridItemProps
{
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer) => void;
}

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = props =>
{
    const { offer = null, selectOffer = null, itemActive = false, ...rest } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const { requestOfferToMover = null } = useCatalog();
    const { isVisible = false } = useInventoryFurni();
    const { isFavoriteOffer, toggleFavoriteOffer } = useCatalogFavorites();
    const isFav = isFavoriteOffer(offer.offerId);

    const iconUrl = useMemo(() =>
    {
        if(offer.pricingModel === Offer.PRICING_MODEL_BUNDLE)
        {
            return null;
        }

        return offer.product.getIconUrl(offer);
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
                if(!isMouseDown || !itemActive || !isVisible) return;

                requestOfferToMover(offer);
                return;
        }
    };

    const product = offer.product;

    if(!product) return null;

    return (
        <LayoutGridItem
            className={ `bg-white! border-catalog-border! rounded-lg! shadow-catalog-card hover:shadow-catalog-card-hover hover:scale-[1.03] transition-all duration-150 group/tile relative ${ itemActive ? 'ring-2 ring-catalog-accent border-catalog-accent!' : '' }` }
            itemActive={ itemActive }
            itemCount={ ((offer.pricingModel === Offer.PRICING_MODEL_MULTI) ? product.productCount : 1) }
            itemImage={ iconUrl }
            itemUniqueNumber={ product.uniqueLimitedItemSeriesSize }
            itemUniqueSoldout={ (product.uniqueLimitedItemSeriesSize && !product.uniqueLimitedItemsLeft) }
            title={ `ID: ${ product.productClassId } | Offer: ${ offer.offerId }` }
            onMouseDown={ onMouseEvent }
            onMouseOut={ onMouseEvent }
            onMouseUp={ onMouseEvent }
            { ...rest }
        >
            { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                <LayoutAvatarImageView direction={ 3 } figure={ offer.product.extraParam } headOnly={ true } /> }
            <div
                className={ `absolute top-0.5 right-0.5 z-10 cursor-pointer transition-opacity duration-150 ${ isFav ? 'opacity-100' : 'opacity-0 group-hover/tile:opacity-100' }` }
                onClick={ e => { e.stopPropagation(); e.preventDefault(); toggleFavoriteOffer(offer.offerId); } }
                onMouseDown={ e => e.stopPropagation() }
            >
                <FaHeart className={ `text-[11px] drop-shadow-sm transition-colors duration-150 ${ isFav ? 'text-red-500' : 'text-gray-300 hover:text-red-400' }` } />
            </div>
        </LayoutGridItem>
    );
};
