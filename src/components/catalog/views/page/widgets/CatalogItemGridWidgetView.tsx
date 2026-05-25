import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer } from '../../../../../api';
import { AutoGrid, AutoGridProps } from '../../../../../common';
import { useCatalogActions, useCatalogData } from '../../../../../hooks';
import { useCatalogAdmin } from '../../../CatalogAdminContext';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

interface CatalogItemGridWidgetViewProps extends AutoGridProps
{

}

export const CatalogItemGridWidgetView: FC<CatalogItemGridWidgetViewProps> = props =>
{
    const { columnCount = 5, children = null, ...rest } = props;
    const { currentOffer = null, currentPage = null } = useCatalogData();
    const { selectCatalogOffer = null } = useCatalogActions();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const elementRef = useRef<HTMLDivElement>(null);
    const [ dragIndex, setDragIndex ] = useState<number | null>(null);
    const [ dropIndex, setDropIndex ] = useState<number | null>(null);

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentPage ]);

    // Drag-and-drop handlers — hooks MUST run unconditionally so the
    // hook order stays stable when currentPage flips from null to a
    // real value (the `if(!currentPage) return null` below would
    // otherwise hide these from the first render and React would flag
    // "Rendered more hooks than during the previous render"). Bodies
    // are safe to evaluate pre-load: currentPage? optional chaining
    // already guards the only access inside handleDrop.
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

    if(!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer) =>
    {
        selectCatalogOffer(offer);
    };

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
