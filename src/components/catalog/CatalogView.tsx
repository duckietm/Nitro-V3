import { ILinkEventTracker } from '@nitrots/api';
import { GetSessionDataManager } from '@nitrots/session';
import { AddLinkEventTracker, RemoveLinkEventTracker } from '@nitrots/utils';
import { FC, useEffect, useState } from 'react';
import { FaCog, FaHeart } from 'react-icons/fa';
import { LocalizeText } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useCatalog, useCatalogFavorites } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogRailItemView } from './views/catalog-rail/CatalogRailItemView';
import { CatalogFavoritesView } from './views/favorites/CatalogFavoritesView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogBreadcrumbView } from './views/navigation/CatalogBreadcrumbView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogViewInner: FC<{}> = () =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById } = useCatalog();
    const { adminMode, setAdminMode } = useCatalogAdmin();
    const { favoriteOfferIds, favoritePageIds } = useCatalogFavorites();
    const [ showFavorites, setShowFavorites ] = useState(false);

    const isMod = GetSessionDataManager().isModerator;
    const hasFavorites = (favoriteOfferIds.length + favoritePageIds.length) > 0;

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'open':
                        if(parts.length > 2)
                        {
                            if(parts.length === 4)
                            {
                                switch(parts[2])
                                {
                                    case 'offerId':
                                        openPageByOfferId(parseInt(parts[3]));
                                        return;
                                }
                            }
                            else
                            {
                                openPageByName(parts[2]);
                            }
                        }
                        else
                        {
                            setIsVisible(true);
                        }

                        return;
                }
            },
            eventUrlPrefix: 'catalog/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ setIsVisible, openPageByOfferId, openPageByName ]);

    return (
        <>
            { isVisible &&
                <NitroCardView className="w-[780px] h-[520px]" uniqueKey="catalog">
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ event => setIsVisible(false) } />
                    <NitroCardContentView classNames={ [ 'p-0!', 'bg-catalog-bg!', 'overflow-hidden!' ] }>
                        { adminMode &&
                            <div className="bg-yellow-400 text-yellow-900 text-[10px] font-semibold text-center py-0.5 uppercase tracking-wider">
                                Admin Mode
                            </div> }
                        <div className="flex flex-row h-full">
                            { /* Icon Rail */ }
                            <div className="group flex flex-col w-[56px] hover:w-[180px] min-w-[56px] bg-catalog-rail-bg py-2 gap-0.5 items-stretch overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-in-out px-2">
                                { /* Favorites button */ }
                                <div
                                    className={ `flex items-center gap-2 px-1.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 shrink-0 ${ showFavorites ? 'bg-red-50 ring-1 ring-red-200' : 'hover:bg-white/60' }` }
                                    title="Preferiti"
                                    onClick={ () => setShowFavorites(!showFavorites) }
                                >
                                    <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0 relative">
                                        <FaHeart className={ `text-sm transition-colors ${ showFavorites ? 'text-red-500' : hasFavorites ? 'text-red-400' : 'text-gray-400' }` } />
                                        { hasFavorites &&
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                                                { favoriteOfferIds.length + favoritePageIds.length }
                                            </span> }
                                    </div>
                                    <span className="text-xs font-medium text-catalog-text whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">Preferiti</span>
                                </div>
                                <div className="border-b border-catalog-border/30 mx-1 my-0.5" />
                                { rootNode && (rootNode.children.length > 0) && rootNode.children.map((child, index) =>
                                {
                                    if(!child.isVisible) return null;

                                    return (
                                        <CatalogRailItemView
                                            key={ `${ child.pageId }-${ child.pageName }-${ index }` }
                                            isActive={ child.isActive }
                                            node={ child }
                                            onClick={ () =>
                                            {
                                                if(searchResult) setSearchResult(null);
                                                if(showFavorites) setShowFavorites(false);
                                                activateNode(child);
                                            } }
                                        />
                                    );
                                }) }
                            </div>

                            { /* Main content panel */ }
                            <div className="flex flex-col flex-1 overflow-hidden">
                                { /* Breadcrumb + Search bar */ }
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-catalog-border bg-white">
                                    <CatalogBreadcrumbView />
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="w-[200px] shrink-0">
                                            <CatalogSearchView />
                                        </div>
                                        { isMod &&
                                            <button
                                                className={ `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 border cursor-pointer shrink-0 ${ adminMode ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-catalog-accent hover:text-white hover:border-catalog-accent' }` }
                                                title={ adminMode ? 'Disattiva Admin Mode' : 'Attiva Admin Mode' }
                                                onClick={ () => setAdminMode(!adminMode) }
                                            >
                                                <FaCog className={ `text-[10px] ${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                                                <span>Admin</span>
                                            </button> }
                                    </div>
                                </div>

                                { /* Sub-navigation + Page content */ }
                                <div className="flex flex-1 overflow-hidden">
                                    { showFavorites
                                        ? <div className="flex-1 overflow-auto">
                                            <CatalogFavoritesView onClose={ () => setShowFavorites(false) } />
                                        </div>
                                        : <>
                                            { !navigationHidden && activeNodes && (activeNodes.length > 0) &&
                                                <div className="w-[200px] min-w-[200px] border-r border-catalog-border bg-white overflow-y-auto py-2">
                                                    <CatalogNavigationView node={ activeNodes[0] } />
                                                </div> }
                                            <div className="flex-1 overflow-auto p-3">
                                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                                            </div>
                                        </> }
                                </div>
                            </div>
                        </div>
                    </NitroCardContentView>
                </NitroCardView> }
            <CatalogAdminOfferEditView />
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
};

export const CatalogView: FC<{}> = () =>
{
    return (
        <CatalogAdminProvider>
            <CatalogViewInner />
        </CatalogAdminProvider>
    );
};
