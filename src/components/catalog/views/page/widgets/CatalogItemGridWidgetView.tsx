import { InfiniteGrid } from '@layout/InfiniteGrid';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer } from '../../../../../api';
import { AutoGrid, AutoGridProps } from '../../../../../common';
import { useCatalogActions, useCatalogData, useCatalogUiState } from '../../../../../hooks';
import { replaceCatalogPageOffers } from '../../../../../hooks/catalog/useCatalog.helpers';
import { useCatalogAdmin } from '../../../CatalogAdminContext';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

/** Pages above this count use @tanstack/react-virtual via InfiniteGrid. */
const VIRTUALIZE_OFFER_THRESHOLD = 500;

interface CatalogItemGridWidgetViewProps extends AutoGridProps {
    tintColor?: string;
}

export const CatalogItemGridWidgetView: FC<CatalogItemGridWidgetViewProps> = (props) => {
    const { columnCount = 5, columnMinHeight = 80, tintColor = null, children = null, className = '', ...rest } = props;
    const { currentOffer = null, currentPage = null } = useCatalogData();
    const { selectCatalogOffer = null } = useCatalogActions();
    const { setCurrentPage } = useCatalogUiState();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const elementRef = useRef<HTMLDivElement>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const offers = currentPage?.offers ?? [];
    const useVirtualGrid = !adminMode && offers.length > VIRTUALIZE_OFFER_THRESHOLD;

    useEffect(() => {
        if (elementRef.current) elementRef.current.scrollTop = 0;
    }, [currentPage]);

    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDropIndex(index);
    }, []);

    const handleDrop = useCallback(
        (index: number) => {
            if (dragIndex !== null && dragIndex !== index && currentPage?.offers) {
                const reordered = [...currentPage.offers];
                const [moved] = reordered.splice(dragIndex, 1);

                reordered.splice(index, 0, moved);

                setCurrentPage(replaceCatalogPageOffers(currentPage, reordered));

                const orders = reordered.map((o, i) => ({ id: o.offerId, orderNumber: i }));

                catalogAdmin?.reorderOffers(orders, `Reordered offers on page #${currentPage.pageId}`);
            }

            setDragIndex(null);
            setDropIndex(null);
        },
        [dragIndex, currentPage, catalogAdmin, setCurrentPage]
    );

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setDropIndex(null);
    }, []);

    if (!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer) => {
        selectCatalogOffer(offer);
    };

    const renderOfferTile = (offer: IPurchasableOffer, index: number) => {
        const isDragging = dragIndex === index;
        const isDropTarget = dropIndex === index && dragIndex !== index;

        return (
            <div
                key={offer.offerId}
                className={`${isDragging ? 'opacity-40' : ''} ${isDropTarget ? 'ring-2 ring-primary ring-offset-1 rounded' : ''}`}
                draggable={adminMode}
                onDragEnd={adminMode ? handleDragEnd : undefined}
                onDragOver={adminMode ? (e) => handleDragOver(e, index) : undefined}
                onDragStart={adminMode ? () => handleDragStart(index) : undefined}
                onDrop={adminMode ? () => handleDrop(index) : undefined}
            >
                <CatalogGridOfferView
                    itemActive={currentOffer && currentOffer.offerId === offer.offerId}
                    offer={offer}
                    selectOffer={selectOffer}
                    tintColor={tintColor}
                />
            </div>
        );
    };

    if (useVirtualGrid) {
        return (
            <div className={`nitro-catalog-grid-virtual h-full min-h-0 ${className}`.trim()}>
                <InfiniteGrid
                    columnCount={columnCount}
                    estimateSize={columnMinHeight}
                    items={offers}
                    overscan={4}
                    itemRender={(offer, index) => (offer ? renderOfferTile(offer, index) : <></>)}
                />
                {children}
            </div>
        );
    }

    return (
        <AutoGrid className={className} columnCount={columnCount} columnMinHeight={columnMinHeight} innerRef={elementRef} {...rest}>
            {offers.length > 0 && offers.map((offer, index) => renderOfferTile(offer, index))}
            {children}
        </AutoGrid>
    );
};
