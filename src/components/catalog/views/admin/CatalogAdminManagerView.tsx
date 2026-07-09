import { FC, useCallback, useState } from 'react';
import {
    FaArrowsAlt,
    FaArrowDown,
    FaArrowUp,
    FaChevronDown,
    FaChevronRight,
    FaCloudUploadAlt,
    FaEdit,
    FaEye,
    FaEyeSlash,
    FaPlus,
    FaSearch,
    FaSitemap,
    FaTrash
} from 'react-icons/fa';
import { CatalogType, GetConfigurationValue, ICatalogNode, IPurchasableOffer, LocalizeText, ProductTypeEnum } from '../../../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useCatalogActions, useCatalogData, useCatalogUiState } from '../../../../hooks';
import { replaceCatalogPageOffers } from '../../../../hooks/catalog/useCatalog.helpers';
import { useCatalogAdmin } from '../../CatalogAdminContext';
import { parseCatalogTabLabel } from '../../useCatalogWindowWidth';
import { CatalogAdminOfferPriceView } from './CatalogAdminOfferPriceView';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';

type CatalogAdminOffer = Parameters<NonNullable<ReturnType<typeof useCatalogAdmin>>['setEditingOffer']>[0];
type ManagerTab = 'pages' | 'publish';

const stripSwfSuffix = (label: string) => (label || '').replace(/\s*\(\D[^)]*\)\s*$/g, '').trim();
const nodeName = (node: ICatalogNode) => stripSwfSuffix(parseCatalogTabLabel(node.localization).name) || node.pageName;

const findNodeByPageId = (node: ICatalogNode | null, pageId: number): ICatalogNode | null => {
    if (!node) return null;
    if (node.pageId === pageId) return node;

    for (const child of node.children) {
        const found = findNodeByPageId(child, pageId);
        if (found) return found;
    }

    return null;
};

const subtreeMatches = (node: ICatalogNode, query: string): boolean => {
    if (!query) return true;
    if (nodeName(node).toLowerCase().includes(query)) return true;

    return node.children.some((child) => subtreeMatches(child, query));
};

const getOfferIconUrl = (offer: IPurchasableOffer): string | null => {
    const product = offer.product;
    if (!product) return null;

    if (product.productType === ProductTypeEnum.FLOOR || product.productType === ProductTypeEnum.WALL) {
        const className = product.furnitureData?.className;

        if (className?.length) {
            let param = '';

            if (product.productType === ProductTypeEnum.WALL && product.extraParam?.length) {
                param = `_${product.extraParam}`;
            } else if (product.productType === ProductTypeEnum.FLOOR && product.furnitureData?.hasIndexedColor && product.furnitureData.colorIndex > 0) {
                param = `_${product.furnitureData.colorIndex}`;
            }

            const configuredIconUrl = GetConfigurationValue<string>('furni.asset.icon.url', '');
            if (configuredIconUrl?.length) return configuredIconUrl.replace('%libname%', className).replace('%param%', param);
        }
    }

    return product.getIconUrl(offer) ?? null;
};

export const CatalogAdminManagerView: FC<{}> = () => {
    const { rootNode = null, currentPage = null } = useCatalogData();
    const { currentType = CatalogType.NORMAL, setCurrentPage } = useCatalogUiState();
    const { activateNode = null } = useCatalogActions();
    const catalogAdmin = useCatalogAdmin();
    const [activeTab, setActiveTab] = useState<ManagerTab>('pages');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [dragOverPageId, setDragOverPageId] = useState<number | null>(null);
    const [dragOverOfferIndex, setDragOverOfferIndex] = useState<number | null>(null);

    const query = search.trim().toLowerCase();
    const selectedPageId = currentPage?.pageId ?? -1;
    const selectedNode = findNodeByPageId(rootNode, selectedPageId);
    const offers = currentPage?.offers ?? [];
    const categoryCount = rootNode?.children.length ?? 0;

    const handlePageDragStart = useCallback((event: React.DragEvent, node: ICatalogNode) => {
        event.stopPropagation();
        event.dataTransfer.setData('text/plain', JSON.stringify({ pageId: node.pageId, parentId: node.parent?.pageId ?? -1 }));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const handlePageDragOver = useCallback((event: React.DragEvent, node: ICatalogNode) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setDragOverPageId(node.pageId);
    }, []);

    const handlePageDragLeave = useCallback(() => {
        setDragOverPageId(null);
    }, []);

    const handlePageDrop = useCallback(
        (event: React.DragEvent, node: ICatalogNode) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOverPageId(null);

            if (!catalogAdmin) return;

            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));

                if (!data.pageId || data.pageId === node.pageId) return;

                const targetParentId = node.isBranch ? node.pageId : (node.parent?.pageId ?? -1);
                const targetIndex = node.isBranch ? 0 : (node.parent?.children?.indexOf(node) ?? 0);

                catalogAdmin.reorderPage(data.pageId, targetParentId, targetIndex, `Moved page #${data.pageId} under ${nodeName(node)}`);
            } catch {
                // Invalid drag payload
            }
        },
        [catalogAdmin]
    );

    const reorderOffersToIndex = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (!catalogAdmin || !currentPage) return;
            if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= offers.length || toIndex >= offers.length) return;

            const reordered = [...offers];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);

            setCurrentPage(replaceCatalogPageOffers(currentPage, reordered));

            const pageLabel = selectedNode ? nodeName(selectedNode) : 'page';
            catalogAdmin.reorderOffers(
                reordered.map((offer, i) => ({ id: offer.offerId, orderNumber: i })),
                `Reordered offers on "${pageLabel}"`
            );
        },
        [catalogAdmin, currentPage, offers, selectedNode, setCurrentPage]
    );

    const handleOfferDragStart = useCallback((event: React.DragEvent, index: number) => {
        event.stopPropagation();
        event.dataTransfer.setData('application/x-catalog-admin-offer', JSON.stringify({ index }));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleOfferDragOver = useCallback((event: React.DragEvent, index: number) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setDragOverOfferIndex(index);
    }, []);

    const handleOfferDragLeave = useCallback(() => {
        setDragOverOfferIndex(null);
    }, []);

    const handleOfferDrop = useCallback(
        (event: React.DragEvent, dropIndex: number) => {
            event.preventDefault();
            event.stopPropagation();
            setDragOverOfferIndex(null);

            try {
                const data = JSON.parse(event.dataTransfer.getData('application/x-catalog-admin-offer'));
                if (typeof data.index !== 'number') return;

                reorderOffersToIndex(data.index, dropIndex);
            } catch {
                // Invalid drag payload
            }
        },
        [reorderOffersToIndex]
    );

    if (!catalogAdmin?.adminMode) return null;

    const { loading, hasPendingChanges, pendingChanges } = catalogAdmin;

    const toggleExpand = (pageId: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(pageId) ? next.delete(pageId) : next.add(pageId);

            return next;
        });
    };

    const selectNode = (node: ICatalogNode) => {
        if (node.children.length) setExpanded((prev) => new Set(prev).add(node.pageId));
        if (node.pageId > -1) activateNode?.(node);
    };

    const editPage = (node: ICatalogNode | null, isRoot: boolean) => {
        catalogAdmin.setEditingPageNode(isRoot ? null : node);
        catalogAdmin.setEditingRootPage(isRoot);
        catalogAdmin.setEditingPageData(true);
    };

    const createCategory = (parent: ICatalogNode) => {
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
            parentId: parent.pageId
        });
    };

    const deletePage = (node: ICatalogNode) => {
        if (confirm(LocalizeText('catalog.admin.delete.category.confirm', ['name'], [nodeName(node)]))) {
            catalogAdmin.deletePage(node.pageId, `Deleted page: ${nodeName(node)}`);
        }
    };

    const movePage = (node: ICatalogNode, direction: -1 | 1) => {
        const parent = node.parent;
        if (!parent) return;

        const siblings = parent.children;
        const index = siblings.indexOf(node);
        const target = index + direction;
        if (target < 0 || target >= siblings.length) return;

        catalogAdmin.reorderPage(node.pageId, parent.pageId, target, `Moved page: ${nodeName(node)}`);
    };

    const newOffer = () => {
        if (!currentPage) return;

        catalogAdmin.setEditingOffer({
            offerId: -1,
            product: { productClassId: 0, productType: 'i', productCount: 1, extraParam: '' }
        } as CatalogAdminOffer);
    };

    const deleteOffer = (offer: IPurchasableOffer) => {
        const label = offer.localizationName || `#${offer.offerId}`;
        if (confirm(`Delete offer "${label}"?`)) catalogAdmin.deleteOffer(offer.offerId, `Deleted offer: ${label}`);
    };

    const moveOffer = (index: number, direction: -1 | 1) => {
        reorderOffersToIndex(index, index + direction);
    };

    const renderNode = (node: ICatalogNode, depth: number) => {
        if (!subtreeMatches(node, query)) return null;

        const isOpen = query ? true : expanded.has(node.pageId);
        const isSelected = node.pageId === selectedPageId && selectedPageId > -1;
        const isHidden = !node.isVisible;
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.pageId} className="nitro-catalog-admin-tree-branch">
                <div
                    className={`nitro-catalog-admin-tree-row ${isSelected ? 'is-selected' : ''} ${isHidden ? 'is-hidden' : ''} ${dragOverPageId === node.pageId ? 'is-drag-over' : ''}`}
                    draggable
                    style={{ paddingLeft: `${4 + depth * 14}px` }}
                    onClick={() => selectNode(node)}
                    onDragLeave={handlePageDragLeave}
                    onDragOver={(event) => handlePageDragOver(event, node)}
                    onDragStart={(event) => handlePageDragStart(event, node)}
                    onDrop={(event) => handlePageDrop(event, node)}
                >
                    <FaArrowsAlt className="nitro-catalog-admin-tree-drag" title="Drag to reorder or reparent" />
                    <span className="nitro-catalog-admin-tree-caret">
                        {hasChildren ? (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggleExpand(node.pageId);
                                }}
                            >
                                {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                            </button>
                        ) : (
                            <span className="nitro-catalog-admin-tree-caret-spacer" />
                        )}
                    </span>
                    <span className="nitro-catalog-admin-tree-icon">
                        {node.iconId > 0 ? <CatalogIconView icon={node.iconId} /> : <span className="nitro-catalog-admin-tree-icon-empty" />}
                    </span>
                    <span className="nitro-catalog-admin-tree-label">{nodeName(node)}</span>
                    <span className="nitro-catalog-admin-tree-count">{node.pageId}</span>
                </div>
                {isOpen && hasChildren && <div className="nitro-catalog-admin-tree-children">{node.children.map((child) => renderNode(child, depth + 1))}</div>}
            </div>
        );
    };

    const renderDetail = () => {
        if (!selectedNode) {
            return <div className="nitro-catalog-admin-placeholder">Select a page from the tree to edit</div>;
        }

        const siblings = selectedNode.parent?.children ?? [];
        const index = siblings.indexOf(selectedNode);
        const isHidden = !selectedNode.isVisible;

        return (
            <div className="nitro-catalog-admin-detail-inner">
                <div className="nitro-catalog-admin-detail-head">
                    <span className="nitro-catalog-admin-detail-icon">
                        {selectedNode.iconId > 0 ? <CatalogIconView icon={selectedNode.iconId} /> : <span className="nitro-catalog-admin-tree-icon-empty" />}
                    </span>
                    <div className="nitro-catalog-admin-detail-titles">
                        <span className="nitro-catalog-admin-detail-title">{nodeName(selectedNode)}</span>
                        <span className="nitro-catalog-admin-detail-sub">
                            Page ID {selectedNode.pageId} · {selectedNode.children.length} sub-page(s) · {offers.length} offer(s)
                        </span>
                    </div>
                </div>

                <div className="nitro-catalog-admin-detail-actions">
                    <button className="nitro-catalog-admin-btn is-primary" onClick={() => editPage(selectedNode, false)}>
                        <FaEdit /> <span>Edit page</span>
                    </button>
                    <button className="nitro-catalog-admin-btn" onClick={() => createCategory(selectedNode)}>
                        <FaPlus /> <span>Add sub-page</span>
                    </button>
                    <button
                        className="nitro-catalog-admin-btn"
                        onClick={() =>
                            catalogAdmin.togglePageVisible(
                                selectedNode.pageId,
                                `${isHidden ? 'Showed' : 'Hidden'} page: ${nodeName(selectedNode)}`
                            )
                        }
                    >
                        {isHidden ? <FaEye /> : <FaEyeSlash />} <span>{isHidden ? 'Show' : 'Hide'}</span>
                    </button>
                    <button className="nitro-catalog-admin-btn" disabled={index <= 0} onClick={() => movePage(selectedNode, -1)}>
                        <FaArrowUp /> <span>Move up</span>
                    </button>
                    <button className="nitro-catalog-admin-btn" disabled={index < 0 || index >= siblings.length - 1} onClick={() => movePage(selectedNode, 1)}>
                        <FaArrowDown /> <span>Move down</span>
                    </button>
                    <button className="nitro-catalog-admin-btn is-danger" onClick={() => deletePage(selectedNode)}>
                        <FaTrash /> <span>Delete</span>
                    </button>
                </div>

                <div className="nitro-catalog-admin-offers">
                    <div className="nitro-catalog-admin-offers-head">
                        <span className="nitro-catalog-admin-offers-title">Offers ({offers.length})</span>
                        <button className="nitro-catalog-admin-btn is-primary" disabled={!currentPage} onClick={newOffer}>
                            <FaPlus /> <span>New offer</span>
                        </button>
                    </div>
                    <div className="nitro-catalog-admin-offers-list">
                        {!currentPage && <div className="nitro-catalog-admin-placeholder is-small">Loading offers…</div>}
                        {currentPage && offers.length === 0 && <div className="nitro-catalog-admin-placeholder is-small">No offers on this page</div>}
                        {offers.map((offer, index) => {
                            const iconUrl = getOfferIconUrl(offer);

                            return (
                                <div
                                    key={offer.offerId}
                                    className={`nitro-catalog-admin-offer-row ${dragOverOfferIndex === index ? 'is-drag-over' : ''}`}
                                    draggable
                                    onDragLeave={handleOfferDragLeave}
                                    onDragOver={(event) => handleOfferDragOver(event, index)}
                                    onDragStart={(event) => handleOfferDragStart(event, index)}
                                    onDrop={(event) => handleOfferDrop(event, index)}
                                >
                                    <span className="nitro-catalog-admin-offer-drag" title="Drag to reorder">
                                        <FaArrowsAlt />
                                    </span>
                                    <div className="nitro-catalog-admin-manager-reorder">
                                        <button disabled={index === 0} title="Move up" onClick={() => moveOffer(index, -1)}>
                                            <FaArrowUp />
                                        </button>
                                        <button disabled={index === offers.length - 1} title="Move down" onClick={() => moveOffer(index, 1)}>
                                            <FaArrowDown />
                                        </button>
                                    </div>
                                    <span className="nitro-catalog-admin-offer-icon">
                                        {iconUrl ? (
                                            <img
                                                alt=""
                                                draggable={false}
                                                src={iconUrl}
                                                onError={(event) => {
                                                    const fallback = offer.product?.getIconUrl(offer);
                                                    if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
                                                    else event.currentTarget.style.visibility = 'hidden';
                                                }}
                                            />
                                        ) : (
                                            <span className="nitro-catalog-admin-offer-icon-empty" />
                                        )}
                                    </span>
                                    <span className="nitro-catalog-admin-offer-name" title={offer.localizationName}>
                                        {offer.localizationName || `#${offer.offerId}`}
                                    </span>
                                    <CatalogAdminOfferPriceView
                                        credits={offer.priceInCredits}
                                        points={offer.priceInActivityPoints}
                                        pointsType={offer.activityPointType}
                                    />
                                    <div className="nitro-catalog-admin-manager-controls">
                                        <button title="Edit offer" onClick={() => catalogAdmin.setEditingOffer(offer)}>
                                            <FaEdit />
                                        </button>
                                        <button className="danger" title="Delete offer" onClick={() => deleteOffer(offer)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderPagesTab = () => (
        <div className="nitro-catalog-admin-pages">
            <div className="nitro-catalog-admin-sidebar">
                <div className="nitro-catalog-admin-search-row">
                    <span className="nitro-catalog-admin-search">
                        <FaSearch />
                        <input placeholder="Search pages..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </span>
                    <button
                        className="nitro-catalog-admin-add"
                        disabled={!rootNode}
                        title="New root category"
                        onClick={() => rootNode && createCategory(rootNode)}
                    >
                        <FaPlus />
                    </button>
                </div>
                <div className="nitro-catalog-admin-tree">
                    {!rootNode || rootNode.children.length === 0 ? (
                        <div className="nitro-catalog-admin-placeholder is-small">No categories</div>
                    ) : (
                        rootNode.children.map((child) => renderNode(child, 0))
                    )}
                </div>
            </div>
            <div className="nitro-catalog-admin-detail">{renderDetail()}</div>
        </div>
    );

    const formatChangeTime = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const renderPublishTab = () => (
        <div className="nitro-catalog-admin-publish">
            <div className={`nitro-catalog-admin-publish-status ${hasPendingChanges ? 'has-pending' : ''}`}>
                {hasPendingChanges
                    ? `${pendingChanges.length} unpublished change${pendingChanges.length === 1 ? '' : 's'}.`
                    : 'Catalog is up to date — no pending changes.'}
            </div>
            <p className="nitro-catalog-admin-publish-text">
                Publishing pushes every pending page, offer and ordering change live to all connected players. Edits are saved as drafts until you publish.
            </p>

            {pendingChanges.length > 0 && (
                <div className="nitro-catalog-admin-publish-changes">
                    <div className="nitro-catalog-admin-publish-changes-head">Pending changes</div>
                    <ul className="nitro-catalog-admin-publish-changes-list">
                        {[...pendingChanges].reverse().map((change) => (
                            <li key={change.id} className="nitro-catalog-admin-publish-change">
                                <span className="nitro-catalog-admin-publish-change-summary">{change.summary}</span>
                                <span className="nitro-catalog-admin-publish-change-time">{formatChangeTime(change.at)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="nitro-catalog-admin-publish-actions">
                <button
                    className={`nitro-catalog-admin-btn is-publish ${hasPendingChanges ? 'has-pending' : ''}`}
                    disabled={loading || !hasPendingChanges}
                    onClick={() => catalogAdmin.publishCatalog()}
                >
                    <FaCloudUploadAlt /> <span>{loading ? 'Publishing…' : 'Publish catalog'}</span>
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'pages' as ManagerTab, label: 'Pages', icon: <FaSitemap />, count: categoryCount },
        { id: 'publish' as ManagerTab, label: 'Publish', icon: <FaCloudUploadAlt />, count: pendingChanges.length }
    ];

    return (
        <NitroCardView classNames={['nitro-catalog-admin-manager']} uniqueKey="catalog-admin-manager">
            <NitroCardHeaderView headerText="Catalog Admin Editor" onCloseClick={() => catalogAdmin.setAdminMode(false)} />
            <NitroCardContentView classNames={['nitro-catalog-admin-manager-body']}>
                <div className="nitro-catalog-admin-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`nitro-catalog-admin-tab ${activeTab === tab.id ? 'is-active' : ''} ${
                                tab.id === 'publish' && hasPendingChanges ? 'has-pending' : ''
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count > 0 && <span className="nitro-catalog-admin-tab-count">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                <div className="nitro-catalog-admin-panel">
                    {activeTab === 'pages' && renderPagesTab()}
                    {activeTab === 'publish' && renderPublishTab()}
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
