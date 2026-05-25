import { FC } from 'react';
import { GetConfigurationValue } from '../../api';
import { useCatalogData } from '../../hooks';
import { CatalogClassicView } from './CatalogClassicView';
import { CatalogModernView } from './CatalogModernView';

export const CatalogView: FC<{}> = () =>
{
    const { catalogLocalizationVersion = 0 } = useCatalogData();
    const useNewStyle = GetConfigurationValue<boolean>('catalog.style.new', false);

    if(useNewStyle) return (
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
