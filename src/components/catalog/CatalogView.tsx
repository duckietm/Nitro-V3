import { FC } from 'react';
import { useCatalogClassicStyle, useCatalogData } from '../../hooks';
import { CatalogClassicView } from './CatalogClassicView';
// Modern catalog FULLY FORKED into ../catalog-modern/* (own copy of every catalog
// component) so the two catalogs share NOTHING: editing the modern one never
// touches duckie's classic, which stays 1:1 upstream.
import { CatalogModernView } from '../catalog-modern/CatalogModernView';

export const CatalogView: FC<{}> = () =>
{
    const { catalogLocalizationVersion = 0 } = useCatalogData();
    const [ catalogClassicStyle ] = useCatalogClassicStyle();

    // Default (toggle OFF) = duckie's classic catalog 1:1 upstream (./CatalogClassicView,
    // uses the original ./views/* tree). Toggle ON = the modern catalog, a fully
    // self-contained fork under ../catalog-modern/* — nothing shared between the two.
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
