import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { useCatalogData } from '../../../../hooks';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationViewProps {
    node: ICatalogNode;
}

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = (props) => {
    const { node = null } = props;
    const { searchResult = null } = useCatalogData();

    return (
        <div className="nitro-catalog-navigation-list">
            {searchResult &&
                searchResult.filteredNodes.length > 0 &&
                searchResult.filteredNodes.map((n, index) => {
                    return <CatalogNavigationItemView key={index} node={n} />;
                })}
            {!searchResult && <CatalogNavigationSetView node={node} />}
        </div>
    );
};
