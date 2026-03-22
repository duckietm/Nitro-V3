import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer, ProductTypeEnum } from '../../../../../api';
import { AutoGrid, AutoGridProps } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { useCatalogAdmin } from '../../../CatalogAdminContext';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

interface CatalogItemGridWidgetViewProps extends AutoGridProps
{

}

export const CatalogItemGridWidgetView: FC<CatalogItemGridWidgetViewProps> = props =>
{
    const { columnCount = 5, children = null, ...rest } = props;
    const { currentOffer = null, setCurrentOffer = null, currentPage = null, setPurchaseOptions = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const elementRef = useRef<HTMLDivElement>();
    const [ dragIndex, setDragIndex ] = useState<number | null>(null);
    const [ dropIndex, setDropIndex ] = useState<number | null>(null);

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentPage ]);

    if(!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer) =>
    {
        offer.activate();

        if(offer.isLazy) return;

        setCurrentOffer(offer);

        if(offer.product && (offer.product.productType === ProductTypeEnum.WALL))
        {
            setPurchaseOptions(prevValue =>
            {
                const newValue = { ...prevValue };

                newValue.extraData = (offer.product.extraParam || null);

                return newValue;
            });
        }
    };

    const handleDragStart = useCallback((index: number) =>
    {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) =>
    {
        e.preventDefault();
        setDropIndex(index);
    }, []);

    const handleDrop = useCallback((index: number) =>
    {
        if(dragIndex !== null && dragIndex !== index && currentPage?.offers)
        {
            const offers = [ ...currentPage.offers ];
            const [ moved ] = offers.splice(dragIndex, 1);

            offers.splice(index, 0, moved);

            const orders = offers.map((o, i) => ({ id: o.offerId, orderNumber: i }));

            catalogAdmin?.reorderOffers(orders);
        }

        setDragIndex(null);
        setDropIndex(null);
    }, [ dragIndex, currentPage, catalogAdmin ]);

    const handleDragEnd = useCallback(() =>
    {
        setDragIndex(null);
        setDropIndex(null);
    }, []);

    return (
        <AutoGrid columnCount={ columnCount } innerRef={ elementRef } { ...rest }>
            { currentPage.offers && (currentPage.offers.length > 0) && currentPage.offers.map((offer, index) =>
            {
                const isDragging = dragIndex === index;
                const isDropTarget = dropIndex === index && dragIndex !== index;

                return (
                    <div
                        key={ index }
                        className={ `${ isDragging ? 'opacity-40' : '' } ${ isDropTarget ? 'ring-2 ring-primary ring-offset-1 rounded' : '' }` }
                        draggable={ adminMode }
                        onDragEnd={ adminMode ? handleDragEnd : undefined }
                        onDragOver={ adminMode ? (e) => handleDragOver(e, index) : undefined }
                        onDragStart={ adminMode ? () => handleDragStart(index) : undefined }
                        onDrop={ adminMode ? () => handleDrop(index) : undefined }
                    >
                        <CatalogGridOfferView
                            itemActive={ (currentOffer && (currentOffer.offerId === offer.offerId)) }
                            offer={ offer }
                            selectOffer={ selectOffer }
                        />
                    </div>
                );
            }) }
            { children }
        </AutoGrid>
    );
};
