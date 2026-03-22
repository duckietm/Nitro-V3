import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationViewProps
{
    node: ICatalogNode;
}

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = props =>
{
    const { node = null } = props;
    const { searchResult = null } = useCatalog();

    return (
        <div className="flex flex-col gap-px px-0.5 py-0.5">
            { searchResult && (searchResult.filteredNodes.length > 0) && searchResult.filteredNodes.map((n, index) =>
            {
                return <CatalogNavigationItemView key={ index } node={ n } />;
            }) }
            { !searchResult &&
                <CatalogNavigationSetView node={ node } /> }
        </div>
    );
};
