import { FC } from 'react';
import { GetConfigurationValue } from '../../api';
import { CatalogClassicView } from './CatalogClassicView';
import { CatalogModernView } from './CatalogModernView';

export const CatalogView: FC<{}> = () =>
{
    const useNewStyle = GetConfigurationValue<boolean>('catalog.style.new', false);

    if(useNewStyle) return <CatalogModernView />;

    return <CatalogClassicView />;
};
