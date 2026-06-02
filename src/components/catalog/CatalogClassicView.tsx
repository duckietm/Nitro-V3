import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaBars, FaCog, FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from 'react-icons/fa';
import { CatalogType, GetConfigurationValue, LocalizeShortNumber, LocalizeText } from '../../api';
import { Column, Grid, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useCatalogActions, useCatalogData, useCatalogUiState, useHasPermission, usePurse } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogAdminPageEditView } from './views/admin/CatalogAdminPageEditView';
import { CatalogBuildersClubStatusView } from './views/catalog-header/CatalogBuildersClubStatusView';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogBreadcrumbView } from './views/navigation/CatalogBreadcrumbView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogClassicViewInner: FC<{}> = () =>
{
    const { rootNode = null, currentPage = null, searchResult = null } = useCatalogData();
    const { isVisible = false, setIsVisible = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], setSearchResult = null, currentType = CatalogType.NORMAL } = useCatalogUiState();
    const { openPageByName = null, openPageByOfferId = null, activateNode = null, openCatalogByType = null, toggleCatalogByType = null } = useCatalogActions();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() =>
    {});
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog ?? (() =>
    {});
    const loading = catalogAdmin?.loading ?? false;

    const isMod = useHasPermission('acc_catalogfurni');
    const [ mobileMenuOpen, setMobileMenuOpen ] = useState(false);
    const { purse = null } = usePurse();
    const displayedCurrencies = GetConfigurationValue<number[]>('system.currency.types', []);
    const buildersClubHeaderStyle = (currentType === CatalogType.BUILDER)
        ? { borderColor: '#d79d2e', borderBottomColor: '#000', background: 'linear-gradient(180deg, #d89f2d 0%, #c68515 100%)' }
        : undefined;

    useEffect(() =>
    {
        const getCatalogTypeFromLink = (type?: string) =>
        {
            switch((type || '').toLowerCase())
            {
                case 'bc':
                case 'builder':
                case 'buildersclub':
                case 'builders_club':
                    return CatalogType.BUILDER;
                default:
                    return CatalogType.NORMAL;
            }
        };

        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        if(parts.length > 2)
                        {
                            openCatalogByType(getCatalogTypeFromLink(parts[2]));

                            return;
                        }

                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(parts.length > 2)
                        {
                            toggleCatalogByType(getCatalogTypeFromLink(parts[2]));

                            return;
                        }

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
    }, [ setIsVisible, openPageByOfferId, openPageByName, openCatalogByType, toggleCatalogByType ]);

    return (
        <>
            { isVisible &&
                <NitroCardView classNames={ [ 'nitro-catalog-classic-window' ] } isResizable={ false } uniqueKey="catalog">
                    <NitroCardHeaderView className={ currentType === CatalogType.BUILDER ? 'builders-club-card-header' : '' } headerText={ LocalizeText('catalog.title') } onCloseClick={ () => setIsVisible(false) } style={ buildersClubHeaderStyle } />
                    <div className="nitro-catalog-classic-mobile-header">
                        { isMod &&
                            <div className="nitro-catalog-classic-mobile-burger">
                                <button className="nitro-catalog-classic-burger-btn" onClick={ () => setMobileMenuOpen(value => !value) }>
                                    <FaBars />
                                </button>
                                { mobileMenuOpen &&
                                    <div className="nitro-catalog-classic-burger-menu">
                                        <button onClick={ () =>
                                        {
                                            setAdminMode(!adminMode); setMobileMenuOpen(false);
                                        } }>
                                            { adminMode ? 'Exit Admin' : 'Admin' }
                                        </button>
                                        { adminMode &&
                                            <button disabled={ loading } onClick={ () =>
                                            {
                                                publishCatalog(); setMobileMenuOpen(false);
                                            } }>
                                                { loading ? '...' : 'Publish' }
                                            </button> }
                                    </div> }
                            </div> }
                        <div className="nitro-catalog-classic-mobile-currency">
                            <div className="nitro-catalog-classic-coin">
                                <span>{ LocalizeShortNumber(purse?.credits ?? 0) }</span>
                                <LayoutCurrencyIcon type={ -1 } />
                            </div>
                            { displayedCurrencies.map(type => (
                                <div key={ type } className="nitro-catalog-classic-coin">
                                    <span>{ LocalizeShortNumber(purse?.activityPoints?.get(type) ?? 0) }</span>
                                    <LayoutCurrencyIcon type={ type } />
                                </div>
                            )) }
                        </div>
                    </div>
                    { adminMode &&
                        <div className="nitro-catalog-classic-admin-banner flex items-center justify-between text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider">
                            <span>Admin Mode</span>
                            <button
                                className={ `px-3 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${ hasPendingChanges ? 'bg-success text-white animate-pulse shadow-md' : 'bg-white/50 text-dark hover:bg-success hover:text-white' }` }
                                disabled={ loading }
                                onClick={ () => publishCatalog() }
                            >
                                { loading ? '...' : 'Publish' }
                            </button>
                        </div> }
                    <NitroCardTabsView classNames={ [ 'nitro-catalog-classic-tabs-shell' ] } justifyContent="start">
                        { rootNode && (rootNode.children.length > 0) && rootNode.children.map((child, index) =>
                        {
                            if(!adminMode && !child.isVisible) return null;

                            const isHidden = !child.isVisible;

                            return (
                                <NitroCardTabsItemView key={ `${ child.pageId }-${ child.pageName }-${ index }` } isActive={ child.isActive } onClick={ () =>
                                {
                                    if(searchResult) setSearchResult(null);

                                    activateNode(child);
                                } }>
                                    <div className={ `flex items-center gap-1 ${ isHidden ? 'opacity-40' : '' }` }>
                                        <CatalogIconView icon={ child.iconId } />
                                        <span className="nitro-catalog-classic-tab-label truncate">{ child.localization }</span>
                                        { adminMode && isHidden && <FaEyeSlash className="text-[8px] text-danger ml-1" /> }
                                        { adminMode &&
                                            <div className="flex items-center gap-0.5 ml-1" onClick={ e => e.stopPropagation() }>
                                                <FaEdit className="text-[8px] text-primary cursor-pointer hover:text-dark" title={ LocalizeText('catalog.admin.edit.title') }
                                                    onClick={ () =>
                                                    {
                                                        catalogAdmin.setEditingPageNode(child); catalogAdmin.setEditingRootPage(false); catalogAdmin.setEditingPageData(true);
                                                    } } />
                                                <span className="cursor-pointer" title={ isHidden ? LocalizeText('catalog.admin.show') : LocalizeText('catalog.admin.hide') }
                                                    onClick={ () => catalogAdmin.togglePageVisible(child.pageId) }>
                                                    { isHidden ? <FaEye className="text-[8px] text-success" /> : <FaEyeSlash className="text-[8px] text-muted" /> }
                                                </span>
                                                <FaTrash className="text-[8px] text-danger cursor-pointer hover:text-red-800" title={ LocalizeText('catalog.admin.delete.title') }
                                                    onClick={ () =>
                                                    {
                                                        if(confirm(LocalizeText('catalog.admin.delete.category.confirm', [ 'name' ], [ child.localization ]))) catalogAdmin.deletePage(child.pageId);
                                                    } } />
                                            </div> }
                                    </div>
                                </NitroCardTabsItemView>
                            );
                        }) }
                        { isMod &&
                            <NitroCardTabsItemView classNames={ [ 'nitro-catalog-classic-admin-tab' ] } isActive={ adminMode } onClick={ () => setAdminMode(!adminMode) }>
                                <FaCog className={ `text-[10px] ${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                            </NitroCardTabsItemView> }
                    </NitroCardTabsView>
                    <NitroCardContentView classNames={ [ 'nitro-catalog-classic-content-shell' ] }>
                        <CatalogBuildersClubStatusView />
                        { adminMode && rootNode &&
                            <div className="flex items-center gap-2 mb-1 nitro-catalog-classic-admin-actions">
                                <button
                                    className="flex items-center gap-1 text-[9px] text-success hover:text-green-800 cursor-pointer transition-colors"
                                    onClick={ () => catalogAdmin.createPage({ caption: 'New Category', captionSave: 'New Category', catalogMode: currentType, pageLayout: 'default_3x3', iconImage: 0, minRank: 1, visible: '1', enabled: '1', orderNum: 99, parentId: rootNode.pageId }) }
                                >
                                    <FaPlus className="text-[8px]" />
                                    <span>{ LocalizeText('catalog.admin.new') }</span>
                                </button>
                                <button
                                    className="flex items-center gap-1 text-[9px] text-primary hover:text-dark cursor-pointer transition-colors"
                                    onClick={ () =>
                                    {
                                        catalogAdmin.setEditingPageNode(null); catalogAdmin.setEditingRootPage(true); catalogAdmin.setEditingPageData(true);
                                    } }
                                >
                                    <FaEdit className="text-[8px]" />
                                    <span>{ LocalizeText('catalog.admin.root') }</span>
                                </button>
                            </div> }
                        <div className={ `nitro-catalog-classic-stage ${ navigationHidden ? 'is-navigation-hidden' : '' }` }>
                            { !navigationHidden &&
                                <div className="nitro-catalog-classic-sidebar">
                                    <div className="nitro-catalog-classic-search-shell">
                                        <CatalogSearchView />
                                    </div>
                                    <div className="nitro-catalog-classic-navigation-shell">
                                        { activeNodes && (activeNodes.length > 0) &&
                                            <CatalogNavigationView node={ activeNodes[0] } /> }
                                    </div>
                                </div> }
                            <div className="nitro-catalog-classic-layout-shell">
                                <div className="nitro-catalog-classic-layout-header-shell">
                                    <CatalogBreadcrumbView />
                                    <div className="nitro-catalog-classic-layout-hero">
                                        { /* info_duckets renders its own logo in the body (BcInfoView) — don't duplicate it in the hero */ }
                                        { (currentPage?.layoutCode !== 'info_duckets') && !!currentPage?.localization?.getImage(0) && <img src={ currentPage.localization.getImage(0) } /> }
                                    </div>
                                </div>
                                <div className="nitro-catalog-classic-layout-container">
                                    { adminMode && <CatalogAdminPageEditView /> }
                                    { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
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

export const CatalogClassicView: FC<{}> = () =>
{
    return (
        <CatalogAdminProvider>
            <CatalogClassicViewInner />
        </CatalogAdminProvider>
    );
};
