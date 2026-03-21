import { FC } from 'react';
import { FaCaretDown, FaCaretUp, FaStar } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { LayoutGridItem, Text } from '../../../../common';
import { useCatalog, useCatalogFavorites } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();
    const { isFavoritePage, toggleFavoritePage } = useCatalogFavorites();
    const isFav = node.pageId > 0 && isFavoritePage(node.pageId);

    return (
        <div className={ child ? 'pl-[5px] border-s-2 border-[#b6bec5]' : '' }>
            <LayoutGridItem className={ 'h-[23px]! bg-[#cdd3d9] border-0! px-[3px] py-px text-sm group/nav' } column={ false } gap={ 1 } itemActive={ node.isActive } onClick={ event => activateNode(node) }>
                <CatalogIconView icon={ node.iconId } />
                <Text truncate className="grow!">{ node.localization }</Text>
                { node.offerIds && node.offerIds.length > 0 &&
                    <span className="text-[9px] text-gray-400 shrink-0">({ node.offerIds.length })</span> }
                { node.pageId > 0 &&
                    <div
                        className={ `shrink-0 cursor-pointer transition-opacity duration-150 ${ isFav ? 'opacity-100' : 'opacity-0 group-hover/nav:opacity-100' }` }
                        onClick={ e => { e.stopPropagation(); toggleFavoritePage(node.pageId); } }
                    >
                        <FaStar className={ `text-[9px] ${ isFav ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400' }` } />
                    </div> }
                { node.isBranch &&
                    <>
                        { node.isOpen && <FaCaretUp className="fa-icon" /> }
                        { !node.isOpen && <FaCaretDown className="fa-icon" /> }
                    </> }
            </LayoutGridItem>
            { node.isOpen && node.isBranch &&
                <CatalogNavigationSetView child={ true } node={ node } /> }
        </div>
    );
};
