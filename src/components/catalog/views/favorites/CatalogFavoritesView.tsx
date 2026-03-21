import { FC, useMemo } from 'react';
import { FaHeart, FaStar, FaTimes } from 'react-icons/fa';
import { ICatalogNode, LocalizeText } from '../../../../api';
import { useCatalog, useCatalogFavorites } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';

interface CatalogFavoritesViewProps
{
    onClose: () => void;
}

export const CatalogFavoritesView: FC<CatalogFavoritesViewProps> = props =>
{
    const { onClose } = props;
    const { favoriteOffers, favoritePageIds, toggleFavoritePage, toggleFavoriteOffer } = useCatalogFavorites();
    const { offersToNodes, activateNode, openPageByOfferId, rootNode } = useCatalog();

    const favoritePages = useMemo(() =>
    {
        if(!rootNode || favoritePageIds.length === 0) return [];

        const pages: Array<{ pageId: number; name: string; iconId: number; node: ICatalogNode }> = [];

        const findNode = (node: ICatalogNode) =>
        {
            if(favoritePageIds.includes(node.pageId))
            {
                pages.push({ pageId: node.pageId, name: node.localization, iconId: node.iconId, node });
            }

            if(node.children)
            {
                for(const child of node.children) findNode(child);
            }
        };

        findNode(rootNode);

        return pages;
    }, [ favoritePageIds, rootNode ]);

    // Enrich offers with node data if available
    const enrichedOffers = useMemo(() =>
    {
        return favoriteOffers.map(fav =>
        {
            let nodeName: string | null = null;
            let nodeIconId: number | null = null;

            if(offersToNodes)
            {
                const nodes = offersToNodes.get(fav.offerId);

                if(nodes && nodes.length > 0)
                {
                    nodeName = nodes[0].localization;
                    nodeIconId = nodes[0].iconId;
                }
            }

            return {
                ...fav,
                displayName: fav.name || nodeName || `Offer #${ fav.offerId }`,
                nodeIconId
            };
        });
    }, [ favoriteOffers, offersToNodes ]);

    return (
        <div className="flex flex-col h-full gap-2 p-2.5">
            { /* Header */ }
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <FaHeart className="text-danger text-xs" />
                    <span className="text-sm font-bold">{ LocalizeText('catalog.favorites') }</span>
                    <span className="text-[10px] text-muted font-bold">({ enrichedOffers.length + favoritePages.length })</span>
                </div>
                <button className="text-muted hover:text-danger cursor-pointer transition-colors" onClick={ onClose }>
                    <FaTimes className="text-[10px]" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
                { /* Favorite Pages */ }
                { favoritePages.length > 0 &&
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <FaStar className="text-warning text-[8px]" />
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{ LocalizeText('catalog.favorites.pages') }</span>
                        </div>
                        <div className="flex flex-col gap-px">
                            { favoritePages.map(page => (
                                <div
                                    key={ page.pageId }
                                    className="group/fav flex items-center gap-2 px-1.5 py-1 bg-card-grid-item rounded border border-card-grid-item-border hover:bg-card-grid-item-active cursor-pointer transition-all duration-100"
                                    onClick={ () => { activateNode(page.node); onClose(); } }
                                >
                                    <CatalogIconView icon={ page.iconId } />
                                    <span className="text-[11px] flex-1 truncate font-medium">{ page.name }</span>
                                    <FaTimes
                                        className="text-[7px] text-muted opacity-0 group-hover/fav:opacity-100 hover:text-danger transition-all cursor-pointer"
                                        onClick={ e => { e.stopPropagation(); toggleFavoritePage(page.pageId); } }
                                    />
                                </div>
                            )) }
                        </div>
                    </div> }

                { /* Favorite Offers */ }
                { enrichedOffers.length > 0 &&
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <FaHeart className="text-danger text-[8px]" />
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{ LocalizeText('catalog.favorites.furni') }</span>
                        </div>
                        <div className="flex flex-col gap-px">
                            { enrichedOffers.map(fav => (
                                <div
                                    key={ fav.offerId }
                                    className="group/fav flex items-center gap-2 px-1.5 py-1 bg-card-grid-item rounded border border-card-grid-item-border hover:bg-card-grid-item-active cursor-pointer transition-all duration-100"
                                    onClick={ () => { openPageByOfferId(fav.offerId); onClose(); } }
                                >
                                    { /* Furni icon */ }
                                    <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0 bg-white rounded border border-card-grid-item-border overflow-hidden">
                                        { fav.iconUrl
                                            ? <img className="max-w-full max-h-full object-contain image-rendering-pixelated" src={ fav.iconUrl } />
                                            : fav.nodeIconId !== null
                                                ? <CatalogIconView icon={ fav.nodeIconId } />
                                                : <FaHeart className="text-[9px] text-muted" />
                                        }
                                    </div>
                                    <span className="text-[11px] flex-1 truncate font-medium">{ fav.displayName }</span>
                                    <FaTimes
                                        className="text-[7px] text-muted opacity-0 group-hover/fav:opacity-100 hover:text-danger transition-all cursor-pointer"
                                        onClick={ e => { e.stopPropagation(); toggleFavoriteOffer(fav.offerId); } }
                                    />
                                </div>
                            )) }
                        </div>
                    </div> }

                { /* Empty state */ }
                { favoritePages.length === 0 && enrichedOffers.length === 0 &&
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted">
                            <FaHeart className="text-xl text-card-grid-item-border mx-auto mb-1.5" />
                            <p className="text-[11px] font-bold">{ LocalizeText('catalog.favorites.empty') }</p>
                            <p className="text-[10px] mt-0.5">{ LocalizeText('catalog.favorites.empty.hint') }</p>
                        </div>
                    </div> }
            </div>
        </div>
    );
};
