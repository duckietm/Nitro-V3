import { FC } from 'react';
import { useCatalogClassicStyle, useCatalogData } from '../../hooks';
import { CatalogClassicView } from './CatalogClassicView';
import { CatalogModernView } from './CatalogModernView';

export const CatalogView: FC<{}> = () =>
{
    const { catalogLocalizationVersion = 0 } = useCatalogData();
    const [ catalogClassicStyle ] = useCatalogClassicStyle();

    // Default = upstream rebuilt catalog (CatalogClassicView, latest release theme).
    // The "stile classico" toggle (or global catalog.classic.style flag) switches
    // to the Hippiehotel.nl catalog (CatalogModernView, self-contained tailwind).
    // Both the normal catalog and the Builders Club follow this toggle.
    if(catalogClassicStyle) return (
        <>
            <div className="hidden" data-catalog-localization-version={ catalogLocalizationVersion } />
            <CatalogModernView />
        </>
    );

    return (
        <>
            <div className="hidden" data-catalog-localization-version={ catalogLocalizationVersion } />
            <CatalogClassicView />
        </>
    );
};
