import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaBars, FaCog, FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from 'react-icons/fa';
import { CatalogType, GetConfigurationValue, LocalizeShortNumber, LocalizeText, SanitizeHtml } from '../../api';
import { LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
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

const CatalogViewInner: FC<{}> = () => {
    const { rootNode = null, currentPage = null, searchResult = null } = useCatalogData();
    const {
        isVisible = false,
        setIsVisible = null,
        navigationHidden = false,
        setNavigationHidden = null,
        activeNodes = [],
        setSearchResult = null,
        currentType = CatalogType.NORMAL
    } = useCatalogUiState();
    const { openPageByName = null, openPageByOfferId = null, activateNode = null, openCatalogByType = null, toggleCatalogByType = null } = useCatalogActions();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const setAdminMode = catalogAdmin?.setAdminMode ?? (() => {});
    const hasPendingChanges = catalogAdmin?.hasPendingChanges ?? false;
    const publishCatalog = catalogAdmin?.publishCatalog ?? (() => {});
    const loading = catalogAdmin?.loading ?? false;

    const isMod = useHasPermission('acc_catalogfurni');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { purse = null } = usePurse();
    const displayedCurrencies = GetConfigurationValue<number[]>('system.currency.types', []);
    const activeCatalogNode = activeNodes?.[activeNodes.length - 1] ?? null;
    const buildersClubEnabled = GetConfigurationValue<boolean>('buildersclub.enabled', GetConfigurationValue<boolean>('toolbar.buildersclub.enabled', true));
    // Strip SWF-style suffixes like "(BC)" or "(Hot)" but keep the
    // pageId hint the gameserver appends when the viewer has
    // ACC_CATALOG_IDS - that's a pure-numeric "(6)" trailer.
    const getSwfTabLabel = (label: string) => (label || '').replace(/\s*\(\D[^)]*\)\s*$/g, '').trim();

    useEffect(() => {
        const getCatalogTypeFromLink = (type?: string) => {
            switch ((type || '').toLowerCase()) {
                case 'bc':
                case 'builder':
                case 'buildersclub':
                case 'builders_club':
                    return buildersClubEnabled ? CatalogType.BUILDER : CatalogType.NORMAL;
                default:
                    return CatalogType.NORMAL;
            }
        };

        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        if (parts.length > 2) {
                            openCatalogByType(getCatalogTypeFromLink(parts[2]));

                            return;
                        }

                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if (parts.length > 2) {
                            toggleCatalogByType(getCatalogTypeFromLink(parts[2]));

                            return;
                        }

                        setIsVisible((prevValue) => !prevValue);
                        return;
                    case 'open':
                        if (parts.length > 2) {
                            if (parts.length === 4) {
                                switch (parts[2]) {
                                    case 'offerId':
                                        openPageByOfferId(parseInt(parts[3]));
                                        return;
                                }
                            } else {
                                openPageByName(parts[2]);
                            }
                        } else {
                            setIsVisible(true);
                        }

                        return;
                }
            },
            eventUrlPrefix: 'catalog/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [setIsVisible, openPageByOfferId, openPageByName, openCatalogByType, toggleCatalogByType, buildersClubEnabled]);

    return (
        <>
            {isVisible && (
                <NitroCardView classNames={['nitro-catalog-window']} isResizable={false} uniqueKey="catalog">
                    <NitroCardHeaderView
                        className={currentType === CatalogType.BUILDER ? 'builders-club-card-header' : ''}
                        headerText={LocalizeText('catalog.title')}
                        onCloseClick={() => setIsVisible(false)}
                    />
                    <div className="nitro-catalog-mobile-header">
                        {isMod && (
                            <div className="nitro-catalog-mobile-burger">
                                <button className="nitro-catalog-burger-btn" onClick={() => setMobileMenuOpen((value) => !value)}>
                                    <FaBars />
                                </button>
                                {mobileMenuOpen && (
                                    <div className="nitro-catalog-burger-menu">
                                        <button
                                            onClick={() => {
                                                setAdminMode(!adminMode);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            {adminMode ? 'Exit Admin' : 'Admin'}
                                        </button>
                                        {adminMode && (
                                            <button
                                                disabled={loading}
                                                onClick={() => {
                                                    publishCatalog();
                                                    setMobileMenuOpen(false);
                                                }}
                                            >
                                                {loading ? '...' : 'Publish'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="nitro-catalog-mobile-currency">
                            <div className="nitro-catalog-coin">
                                <span>{LocalizeShortNumber(purse?.credits ?? 0)}</span>
                                <LayoutCurrencyIcon type={-1} />
                            </div>
                            {displayedCurrencies.map((type) => (
                                <div key={type} className="nitro-catalog-coin">
                                    <span>{LocalizeShortNumber(purse?.activityPoints?.get(type) ?? 0)}</span>
                                    <LayoutCurrencyIcon type={type} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {adminMode && (
                        <button
                            className={`nitro-catalog-header-publish nitro-catalog-swf-button nitro-catalog-swf-buy-button ${hasPendingChanges ? 'has-pending' : ''}`}
                            disabled={loading}
                            onClick={() => publishCatalog()}
                            title={hasPendingChanges ? 'You have unsaved changes - click to publish' : 'Publish catalog'}
                        >
                            {loading ? '...' : 'PUBLISH'}
                        </button>
                    )}
                    <NitroCardTabsView classNames={['nitro-catalog-tabs-shell']} justifyContent="start">
                        {rootNode &&
                            rootNode.children.length > 0 &&
                            rootNode.children.map((child, index) => {
                                if (!adminMode && !child.isVisible) return null;
                                if (!adminMode && index === 0 && getSwfTabLabel(child.localization).toLowerCase().includes('rari')) return null;

                                const isHidden = !child.isVisible;

                                return (
                                    <NitroCardTabsItemView
                                        key={`${child.pageId}-${child.pageName}-${index}`}
                                        isActive={child.isActive}
                                        onClick={() => {
                                            if (searchResult) setSearchResult(null);

                                            activateNode(child);
                                        }}
                                    >
                                        <div className={`flex items-center gap-1 ${isHidden ? 'opacity-40' : ''}`}>
                                            {child.iconId > 0 && <CatalogIconView icon={child.iconId} className="nitro-catalog-tab-icon" />}
                                            <span className="nitro-catalog-tab-label truncate">{getSwfTabLabel(child.localization)}</span>
                                            {adminMode && isHidden && <FaEyeSlash className="text-[8px] text-danger ml-1" />}
                                            {adminMode && (
                                                <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                                                    <FaEdit
                                                        className="text-[8px] text-primary cursor-pointer hover:text-dark"
                                                        title={LocalizeText('catalog.admin.edit.title')}
                                                        onClick={() => {
                                                            catalogAdmin.setEditingPageNode(child);
                                                            catalogAdmin.setEditingRootPage(false);
                                                            catalogAdmin.setEditingPageData(true);
                                                        }}
                                                    />
                                                    <span
                                                        className="cursor-pointer"
                                                        title={isHidden ? LocalizeText('catalog.admin.show') : LocalizeText('catalog.admin.hide')}
                                                        onClick={() => catalogAdmin.togglePageVisible(child.pageId)}
                                                    >
                                                        {isHidden ? (
                                                            <FaEye className="text-[8px] text-success" />
                                                        ) : (
                                                            <FaEyeSlash className="text-[8px] text-muted" />
                                                        )}
                                                    </span>
                                                    <FaTrash
                                                        className="text-[8px] text-danger cursor-pointer hover:text-red-800"
                                                        title={LocalizeText('catalog.admin.delete.title')}
                                                        onClick={() => {
                                                            if (confirm(LocalizeText('catalog.admin.delete.category.confirm', ['name'], [child.localization])))
                                                                catalogAdmin.deletePage(child.pageId);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </NitroCardTabsItemView>
                                );
                            })}
                        {isMod && (
                            <NitroCardTabsItemView classNames={['nitro-catalog-admin-tab']} isActive={adminMode} onClick={() => setAdminMode(!adminMode)}>
                                <FaCog className={`text-[10px] ${adminMode ? 'animate-spin' : ''}`} style={adminMode ? { animationDuration: '3s' } : {}} />
                            </NitroCardTabsItemView>
                        )}
                    </NitroCardTabsView>
                    <div className="nitro-catalog-swf-header">
                        <div
                            className="nitro-catalog-swf-header-bg"
                            style={currentPage?.localization?.getImage(0) ? { backgroundImage: `url(${currentPage.localization.getImage(0)})` } : undefined}
                        />
                        <div className="nitro-catalog-swf-header-icon">
                            <CatalogIconView icon={activeCatalogNode?.iconId ?? rootNode?.iconId ?? 1} />
                        </div>
                        <div className="nitro-catalog-swf-header-copy">
                            <div className="nitro-catalog-swf-header-title">
                                {currentType === CatalogType.BUILDER
                                    ? LocalizeText('builder.header.title')
                                    : getSwfTabLabel(activeCatalogNode?.localization ?? LocalizeText('catalog.title'))}
                            </div>
                            {currentType === CatalogType.BUILDER ? (
                                <div className="nitro-catalog-swf-header-description">{LocalizeText('builder.header.status.membership')}</div>
                            ) : (
                                <div
                                    className="nitro-catalog-swf-header-description"
                                    dangerouslySetInnerHTML={{ __html: SanitizeHtml(currentPage?.localization?.getText(0) || '') }}
                                />
                            )}
                        </div>
                    </div>
                    <NitroCardContentView classNames={['nitro-catalog-content-shell']}>
                        <CatalogBuildersClubStatusView />
                        {adminMode && rootNode && (
                            <div className="flex items-center gap-2 mb-1 nitro-catalog-admin-actions">
                                <button
                                    className="flex items-center gap-1 text-[9px] text-success hover:text-green-800 cursor-pointer transition-colors"
                                    onClick={() =>
                                        catalogAdmin.createPage({
                                            caption: 'New Category',
                                            captionSave: 'New Category',
                                            catalogMode: currentType,
                                            pageLayout: 'default_3x3',
                                            iconImage: 0,
                                            minRank: 1,
                                            visible: '1',
                                            enabled: '1',
                                            orderNum: 99,
                                            parentId: rootNode.pageId
                                        })
                                    }
                                >
                                    <FaPlus className="text-[8px]" />
                                    <span>{LocalizeText('catalog.admin.new')}</span>
                                </button>
                                <button
                                    className="flex items-center gap-1 text-[9px] text-primary hover:text-dark cursor-pointer transition-colors"
                                    onClick={() => {
                                        catalogAdmin.setEditingPageNode(null);
                                        catalogAdmin.setEditingRootPage(true);
                                        catalogAdmin.setEditingPageData(true);
                                    }}
                                >
                                    <FaEdit className="text-[8px]" />
                                    <span>{LocalizeText('catalog.admin.root')}</span>
                                </button>
                            </div>
                        )}
                        <div className={`nitro-catalog-stage ${navigationHidden ? 'is-navigation-hidden' : ''}`}>
                            {!navigationHidden && (
                                <div className="nitro-catalog-sidebar">
                                    <div className="nitro-catalog-search-shell">
                                        <CatalogSearchView />
                                    </div>
                                    <div className="nitro-catalog-navigation-shell">
                                        {activeNodes && activeNodes.length > 0 && <CatalogNavigationView node={activeNodes[0]} />}
                                    </div>
                                </div>
                            )}
                            <div className="nitro-catalog-layout-shell">
                                <div className="nitro-catalog-layout-header-shell">
                                    <CatalogBreadcrumbView />
                                    <div className="nitro-catalog-layout-hero">
                                        {!!currentPage?.localization?.getImage(0) && <img alt="" src={currentPage.localization.getImage(0)} />}
                                    </div>
                                </div>
                                <div className="nitro-catalog-layout-container">
                                    {adminMode && <CatalogAdminPageEditView />}
                                    {GetCatalogLayout(currentPage, () => setNavigationHidden(true))}
                                </div>
                            </div>
                        </div>
                    </NitroCardContentView>
                </NitroCardView>
            )}
            <CatalogAdminOfferEditView />
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
};

export const CatalogView: FC<{}> = () => {
    const { catalogLocalizationVersion = 0 } = useCatalogData();

    return (
        <CatalogAdminProvider>
            <div className="hidden" data-catalog-localization-version={catalogLocalizationVersion} />
            <CatalogViewInner />
        </CatalogAdminProvider>
    );
};
