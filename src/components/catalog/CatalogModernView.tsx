import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaCog, FaEdit, FaEye, FaEyeSlash, FaHeart, FaPlus, FaStar, FaTrash } from 'react-icons/fa';
import { LocalizeText } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useCatalog, useCatalogFavorites } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogAdminPageEditView } from './views/admin/CatalogAdminPageEditView';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogFavoritesView } from './views/favorites/CatalogFavoritesView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogModernViewInner: FC<{}> = () =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() => {});
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog ?? (() => {});
    const loading = catalogAdmin?.loading ?? false;
    const { favoriteOfferIds, favoritePageIds } = useCatalogFavorites();
    const [ showFavorites, setShowFavorites ] = useState(false);

    const isMod = GetSessionDataManager().isModerator;
    const totalFavs = favoriteOfferIds.length + favoritePageIds.length;

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
                <NitroCardView className="nitro-catalog w-[780px] h-[520px]" uniqueKey="catalog">
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardContentView classNames={ [ 'p-0!', 'overflow-hidden!' ] }>
                        { /* Admin banner */ }
                        { adminMode &&
                            <div className="flex items-center justify-between bg-warning text-dark text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider" style={ { textShadow: '0 1px 0 rgba(255,255,255,0.3)' } }>
                                <span>⚙ Admin Mode</span>
                                <button
                                    className={ `px-3 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${ hasPendingChanges ? 'bg-success text-white animate-pulse shadow-md' : 'bg-white/50 text-dark hover:bg-success hover:text-white' }` }
                                    disabled={ loading }
                                    onClick={ () => publishCatalog() }
                                >
                                    { loading ? '...' : hasPendingChanges ? '⬆ Publish' : '⬆ Publish' }
                                </button>
                            </div> }

                        <div className="flex h-full">
                            { /* === LEFT SIDEBAR === */ }
                            <div className="group/rail flex flex-col w-[52px] hover:w-[175px] min-w-[52px] bg-card-grid-item border-r-2 border-card-grid-item-border py-1.5 gap-px overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-in-out">

                                { /* Favorites toggle */ }
                                <div
                                    className={ `flex items-center gap-2 mx-1 px-1.5 py-1.5 rounded cursor-pointer transition-all duration-150 ${ showFavorites ? 'bg-primary text-white' : 'hover:bg-card-grid-item-active' }` }
                                    onClick={ () => setShowFavorites(!showFavorites) }
                                >
                                    <div className="w-[28px] h-[24px] flex items-center justify-center shrink-0 relative">
                                        <FaHeart className={ `text-xs ${ showFavorites ? 'text-white' : totalFavs > 0 ? 'text-danger' : 'text-muted' }` } />
                                        { totalFavs > 0 &&
                                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                                                { totalFavs }
                                            </span> }
                                    </div>
                                    <span className={ `text-[11px] font-bold whitespace-nowrap opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 ${ showFavorites ? 'text-white' : '' }` }>{ LocalizeText('catalog.favorites') }</span>
                                </div>

                                <div className="border-b border-card-grid-item-border mx-2 my-0.5" />

                                { /* Admin: root page actions */ }
                                { adminMode && rootNode &&
                                    <div className="flex items-center gap-1 mx-1 px-1.5 py-1 opacity-0 group-hover/rail:opacity-100 transition-opacity">
                                        <button
                                            className="flex items-center gap-1 text-[9px] text-success hover:text-green-800 cursor-pointer transition-colors"
                                            title={ LocalizeText('catalog.admin.new.root.category') }
                                            onClick={ () => catalogAdmin.createPage({ caption: 'New Category', pageLayout: 'default_3x3', minRank: 1, visible: '1', enabled: '1', orderNum: 99, parentId: rootNode.pageId }) }
                                        >
                                            <FaPlus className="text-[8px]" />
                                            <span className="whitespace-nowrap">{ LocalizeText('catalog.admin.new') }</span>
                                        </button>
                                        <button
                                            className="flex items-center gap-1 text-[9px] text-primary hover:text-dark cursor-pointer transition-colors"
                                            title={ LocalizeText('catalog.admin.edit.root') }
                                            onClick={ () => { catalogAdmin.setEditingPageNode(null); catalogAdmin.setEditingRootPage(true); catalogAdmin.setEditingPageData(true); } }
                                        >
                                            <FaEdit className="text-[8px]" />
                                            <span className="whitespace-nowrap">{ LocalizeText('catalog.admin.root') }</span>
                                        </button>
                                    </div> }

                                { /* Category icons */ }
                                { rootNode && rootNode.children.length > 0 && rootNode.children.map((child, index) =>
                                {
                                    if(!adminMode && !child.isVisible) return null;

                                    const isHidden = !child.isVisible;

                                    return (
                                        <div
                                            key={ `${ child.pageId }-${ index }` }
                                            className={ `group/cat flex items-center gap-2 mx-1 px-1.5 py-1 rounded cursor-pointer transition-all duration-150 ${ isHidden ? 'opacity-40' : '' } ${ child.isActive ? 'bg-card-grid-item-active border border-card-grid-item-border-active shadow-inner1px' : 'border border-transparent hover:bg-card-grid-item-active' }` }
                                            title={ adminMode ? `${ child.localization } [ID: ${ child.pageId }]${ isHidden ? ` (${ LocalizeText('catalog.admin.hidden') })` : '' }` : child.localization }
                                            onClick={ () =>
                                            {
                                                if(searchResult) setSearchResult(null);
                                                if(showFavorites) setShowFavorites(false);
                                                activateNode(child);
                                            } }
                                        >
                                            <div className="w-[28px] h-[24px] flex items-center justify-center shrink-0 relative">
                                                <CatalogIconView icon={ child.iconId } />
                                                { isHidden && <FaEyeSlash className="absolute -bottom-0.5 -right-0.5 text-[7px] text-danger" /> }
                                            </div>
                                            <span className={ `text-[11px] whitespace-nowrap overflow-hidden truncate opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200 flex-1 ${ child.isActive ? 'font-bold text-dark' : 'text-gray-700' }` }>
                                                { child.localization }
                                            </span>
                                            { /* Admin actions on each root category */ }
                                            { adminMode &&
                                                <div className="flex items-center gap-1 opacity-0 group-hover/rail:opacity-100 transition-opacity shrink-0">
                                                    <div
                                                        className="w-[18px] h-[18px] rounded flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-colors"
                                                        title={ `${ LocalizeText('catalog.admin.edit.title') } "${ child.localization }"` }
                                                        onClick={ e =>
                                                        {
                                                            e.stopPropagation();
                                                            catalogAdmin.setEditingPageNode(child);
                                                            catalogAdmin.setEditingRootPage(false);
                                                            catalogAdmin.setEditingPageData(true);
                                                        } }
                                                    >
                                                        <FaEdit className="text-[9px] text-primary" />
                                                    </div>
                                                    <div
                                                        className="w-[18px] h-[18px] rounded flex items-center justify-center hover:bg-warning/20 cursor-pointer transition-colors"
                                                        title={ isHidden ? LocalizeText('catalog.admin.show') : LocalizeText('catalog.admin.hide') }
                                                        onClick={ e =>
                                                        {
                                                            e.stopPropagation();
                                                            catalogAdmin.togglePageVisible(child.pageId);
                                                        } }
                                                    >
                                                        { isHidden
                                                            ? <FaEye className="text-[9px] text-success" />
                                                            : <FaEyeSlash className="text-[9px] text-muted" /> }
                                                    </div>
                                                    <div
                                                        className="w-[18px] h-[18px] rounded flex items-center justify-center hover:bg-danger/20 cursor-pointer transition-colors"
                                                        title={ `${ LocalizeText('catalog.admin.delete.title') } "${ child.localization }"` }
                                                        onClick={ e =>
                                                        {
                                                            e.stopPropagation();
                                                            if(confirm(LocalizeText('catalog.admin.delete.category.confirm', [ 'name' ], [ child.localization ])))
                                                            {
                                                                catalogAdmin.deletePage(child.pageId);
                                                            }
                                                        } }
                                                    >
                                                        <FaTrash className="text-[9px] text-danger" />
                                                    </div>
                                                </div> }
                                        </div>
                                    );
                                }) }
                            </div>

                            { /* === MAIN AREA === */ }
                            <div className="flex flex-col flex-1 overflow-hidden bg-light">
                                { /* Toolbar: search + admin */ }
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-card-tab-item border-b border-card-grid-item-border">
                                    { /* Breadcrumb */ }
                                    <div className="flex items-center gap-1 text-[11px] text-gray-600 min-w-0 flex-1">
                                        <FaStar className="text-[9px] text-primary shrink-0" />
                                        { activeNodes && activeNodes.length > 0
                                            ? activeNodes.map((node, i) => (
                                                <span key={ node.pageId } className="flex items-center gap-1 min-w-0">
                                                    { i > 0 && <span className="text-[8px] opacity-30">›</span> }
                                                    <span className={ `truncate ${ i === activeNodes.length - 1 ? 'font-bold text-dark' : 'cursor-pointer hover:text-primary' }` }
                                                        onClick={ i < activeNodes.length - 1 ? () => activateNode(node) : undefined }>
                                                        { node.localization }
                                                    </span>
                                                </span>
                                            ))
                                            : <span className="text-muted">{ LocalizeText('catalog.title') }</span> }
                                    </div>

                                    <div className="w-[180px] shrink-0">
                                        <CatalogSearchView />
                                    </div>

                                    { isMod &&
                                        <button
                                            className={ `flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border ${ adminMode ? 'bg-warning text-dark border-warning shadow-inner1px' : 'bg-card-grid-item text-gray-600 border-card-grid-item-border hover:bg-primary hover:text-white hover:border-primary' }` }
                                            onClick={ () => setAdminMode(!adminMode) }
                                        >
                                            <FaCog className={ `${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                                            { LocalizeText('catalog.admin') }
                                        </button> }
                                </div>

                                { /* Content area */ }
                                <div className="flex flex-1 overflow-hidden">
                                    { showFavorites
                                        ? <div className="flex-1 overflow-auto bg-card-content-area">
                                            <CatalogFavoritesView onClose={ () => setShowFavorites(false) } />
                                        </div>
                                        : <>
                                            { !navigationHidden && activeNodes && activeNodes.length > 0 &&
                                                <div className="w-[170px] min-w-[170px] border-r-2 border-card-grid-item-border bg-card-grid-item overflow-y-auto py-1">
                                                    <CatalogNavigationView node={ activeNodes[0] } />
                                                </div> }
                                            <div className="flex-1 overflow-auto p-2 bg-card-content-area">
                                                { adminMode && <CatalogAdminPageEditView /> }
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

export const CatalogModernView: FC<{}> = () =>
{
    return (
        <CatalogAdminProvider>
            <CatalogModernViewInner />
        </CatalogAdminProvider>
    );
};
