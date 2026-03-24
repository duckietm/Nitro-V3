import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { FaCog, FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText } from '../../api';
import { Column, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useCatalog } from '../../hooks';
import { CatalogAdminProvider, useCatalogAdmin } from './CatalogAdminContext';
import { CatalogAdminOfferEditView } from './views/admin/CatalogAdminOfferEditView';
import { CatalogAdminPageEditView } from './views/admin/CatalogAdminPageEditView';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CatalogClassicViewInner: FC<{}> = () =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() => {});
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog ?? (() => {});
    const loading = catalogAdmin?.loading ?? false;

    const isMod = GetSessionDataManager().isModerator;

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
                <NitroCardView className="w-[630px] h-[400px]" style={ GetConfigurationValue('catalog.headers') ? { width: 710 } : {} } uniqueKey="catalog">
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ () => setIsVisible(false) } />
                    { /* Admin banner */ }
                    { adminMode &&
                        <div className="flex items-center justify-between bg-warning text-dark text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider" style={ { textShadow: '0 1px 0 rgba(255,255,255,0.3)' } }>
                            <span>⚙ Admin Mode</span>
                            <button
                                className={ `px-3 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${ hasPendingChanges ? 'bg-success text-white animate-pulse shadow-md' : 'bg-white/50 text-dark hover:bg-success hover:text-white' }` }
                                disabled={ loading }
                                onClick={ () => publishCatalog() }
                            >
                                { loading ? '...' : '⬆ Publish' }
                            </button>
                        </div> }
                    <NitroCardTabsView>
                        { rootNode && (rootNode.children.length > 0) && rootNode.children.map((child, index) =>
                        {
                            if(!adminMode && !child.isVisible) return null;

                            const isHidden = !child.isVisible;

                            return (
                                <NitroCardTabsItemView key={ `${ child.pageId }-${ child.pageName }-${ index }` } isActive={ child.isActive } onClick={ () =>
                                {
                                    if(searchResult) setSearchResult(null);

                                    activateNode(child);
                                } } >
                                    <div className={ `flex items-center gap-${ GetConfigurationValue('catalog.tab.icons') ? 1 : 0 } ${ isHidden ? 'opacity-40' : '' }` }>
                                        { GetConfigurationValue('catalog.tab.icons') && <CatalogIconView icon={ child.iconId } /> }
                                        { child.localization }
                                        { adminMode && isHidden && <FaEyeSlash className="text-[8px] text-danger ml-1" /> }
                                        { adminMode &&
                                            <div className="flex items-center gap-0.5 ml-1" onClick={ e => e.stopPropagation() }>
                                                <FaEdit className="text-[8px] text-primary cursor-pointer hover:text-dark" title={ LocalizeText('catalog.admin.edit.title') }
                                                    onClick={ () => { catalogAdmin.setEditingPageNode(child); catalogAdmin.setEditingRootPage(false); catalogAdmin.setEditingPageData(true); } } />
                                                <span className="cursor-pointer" title={ isHidden ? LocalizeText('catalog.admin.show') : LocalizeText('catalog.admin.hide') }
                                                    onClick={ () => catalogAdmin.togglePageVisible(child.pageId) }>
                                                    { isHidden ? <FaEye className="text-[8px] text-success" /> : <FaEyeSlash className="text-[8px] text-muted" /> }
                                                </span>
                                                <FaTrash className="text-[8px] text-danger cursor-pointer hover:text-red-800" title={ LocalizeText('catalog.admin.delete.title') }
                                                    onClick={ () => { if(confirm(LocalizeText('catalog.admin.delete.category.confirm', [ 'name' ], [ child.localization ]))) catalogAdmin.deletePage(child.pageId); } } />
                                            </div> }
                                    </div>
                                </NitroCardTabsItemView>
                            );
                        }) }
                        { /* Admin toggle button in tabs bar */ }
                        { isMod &&
                            <NitroCardTabsItemView isActive={ adminMode } onClick={ () => setAdminMode(!adminMode) }>
                                <FaCog className={ `text-[10px] ${ adminMode ? 'animate-spin' : '' }` } style={ adminMode ? { animationDuration: '3s' } : {} } />
                            </NitroCardTabsItemView> }
                    </NitroCardTabsView>
                    <NitroCardContentView>
                        { /* Admin: add new root category */ }
                        { adminMode && rootNode &&
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    className="flex items-center gap-1 text-[9px] text-success hover:text-green-800 cursor-pointer transition-colors"
                                    onClick={ () => catalogAdmin.createPage({ caption: 'New Category', pageLayout: 'default_3x3', minRank: 1, visible: '1', enabled: '1', orderNum: 99, parentId: rootNode.pageId }) }
                                >
                                    <FaPlus className="text-[8px]" />
                                    <span>{ LocalizeText('catalog.admin.new') }</span>
                                </button>
                                <button
                                    className="flex items-center gap-1 text-[9px] text-primary hover:text-dark cursor-pointer transition-colors"
                                    onClick={ () => { catalogAdmin.setEditingPageNode(null); catalogAdmin.setEditingRootPage(true); catalogAdmin.setEditingPageData(true); } }
                                >
                                    <FaEdit className="text-[8px]" />
                                    <span>{ LocalizeText('catalog.admin.root') }</span>
                                </button>
                            </div> }
                        <Grid>
                            { !navigationHidden &&
                                <Column overflow="hidden" size={ 3 }>
                                    { activeNodes && (activeNodes.length > 0) &&
                                        <CatalogNavigationView node={ activeNodes[0] } /> }
                                </Column> }
                            <Column overflow="hidden" size={ !navigationHidden ? 9 : 12 }>
                                { adminMode && <CatalogAdminPageEditView /> }
                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                            </Column>
                        </Grid>
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
