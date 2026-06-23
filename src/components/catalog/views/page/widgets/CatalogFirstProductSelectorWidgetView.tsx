import { FC, useEffect } from 'react';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

export const CatalogFirstProductSelectorWidgetView: FC<{}> = (props) => {
    const { currentPage = null } = useCatalogData();
    const { setCurrentOffer = null } = useCatalogUiState();

    useEffect(() => {
        if (!currentPage || !currentPage.offers.length) return;

        setCurrentOffer(currentPage.offers[0]);
    }, [currentPage, setCurrentOffer]);

    return null;
};
