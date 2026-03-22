import { FC } from 'react';
import { GetConfigurationValue } from '../../api';
import { CatalogClassicView } from './CatalogClassicView';
import { CatalogModernView } from './CatalogModernView';

export const CatalogView: FC<{}> = () =>
{
    const style = GetConfigurationValue<string>('catalog.style', 'classic');

    if(style === 'new') return <CatalogModernView />;

    return <CatalogClassicView />;
};
