import { FC } from 'react';
import { useCatalogData } from '../../hooks';
import { CatalogClassicView } from './CatalogClassicView';

export const CatalogView: FC<{}> = () =>
{
    const { catalogLocalizationVersion = 0 } = useCatalogData();

    return (
        <>
            <div className="hidden" data-catalog-localization-version={ catalogLocalizationVersion } />
            <CatalogClassicView />
        </>
    );
};
