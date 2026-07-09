import {
    CatalogAdminCreateOfferComposer,
    CatalogAdminCreatePageComposer,
    CatalogAdminDeleteOfferComposer,
    CatalogAdminDeletePageComposer,
    CatalogAdminLoadOfferComposer,
    CatalogAdminLoadPageComposer,
    CatalogAdminMoveOfferComposer,
    CatalogAdminMovePageComposer,
    CatalogAdminOfferDetailsEvent,
    CatalogAdminPageDetailsEvent,
    CatalogAdminPublishComposer,
    CatalogAdminResultEvent,
    CatalogAdminSaveOfferComposer,
    CatalogAdminSavePageComposer
} from '@nitrots/nitro-renderer';
import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ICatalogNode, IPurchasableOffer, NotificationAlertType, SendMessageComposer } from '../../api';
import { useCatalogUiState, useMessageEvent, useNotification } from '../../hooks';

export interface IPageEditData {
    pageId?: number;
    caption: string;
    captionSave: string;
    parentId: number;
    catalogMode: string;
    pageLayout: string;
    iconImage: number;
    enabled: string;
    visible: string;
    minRank: number;
    clubOnly?: string;
    orderNum: number;
    pageHeadline?: string;
    pageTeaser?: string;
    pageSpecial?: string;
    pageText1?: string;
    pageText2?: string;
    pageTextDetails?: string;
    pageTextTeaser?: string;
}

export interface IOfferEditData {
    offerId?: number;
    pageId: number;
    itemIds: string;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    amount: number;
    clubOnly: string;
    extradata: string;
    haveOffer: string;
    offerId_group: number;
    limitedStack: number;
    orderNumber: number;
}

export interface IEditingOfferDetails {
    offerId: number;
    offerIdGroup: number;
    limitedStack: number;
    orderNumber: number;
}

export interface IEditingPageDetails {
    pageId: number;
    caption: string;
    captionSave: string;
    minRank: number;
    orderNum: number;
    visible: boolean;
    enabled: boolean;
}

export interface ICatalogAdminPendingChange {
    id: string;
    summary: string;
    at: number;
}

interface ICatalogAdminContext {
    adminMode: boolean;
    setAdminMode: (value: boolean) => void;
    editingOffer: IPurchasableOffer | null;
    setEditingOffer: (offer: IPurchasableOffer | null) => void;
    editingOfferDetails: IEditingOfferDetails | null;
    editingPageDetails: IEditingPageDetails | null;
    requestPageDetails: (pageId: number) => void;
    editingPageData: boolean;
    setEditingPageData: (value: boolean) => void;
    editingRootPage: boolean;
    setEditingRootPage: (value: boolean) => void;
    editingPageNode: ICatalogNode | null;
    setEditingPageNode: (node: ICatalogNode | null) => void;
    loading: boolean;
    lastError: string | null;
    savePage: (data: IPageEditData) => void;
    createPage: (data: IPageEditData) => void;
    deletePage: (pageId: number, summary?: string) => void;
    saveOffer: (data: IOfferEditData) => void;
    createOffer: (data: IOfferEditData) => void;
    deleteOffer: (offerId: number, summary?: string) => void;
    reorderOffers: (orders: { id: number; orderNumber: number }[], summary?: string) => void;
    reorderPage: (pageId: number, newParentId: number, newIndex: number, summary?: string) => void;
    togglePageEnabled: (pageId: number, summary?: string) => void;
    togglePageVisible: (pageId: number, summary?: string) => void;
    publishCatalog: () => void;
    hasPendingChanges: boolean;
    pendingChanges: ICatalogAdminPendingChange[];
}

const CatalogAdminContext = createContext<ICatalogAdminContext>(null);

export const useCatalogAdmin = () => useContext(CatalogAdminContext);

let pendingChangeCounter = 0;

const PAGE_INDEX_REFRESH_ACTIONS = new Set(['savePage', 'createPage', 'deletePage', 'movePage', 'toggleVisible', 'toggleEnabled']);
const OFFER_REFRESH_ACTIONS = new Set(['saveOffer', 'createOffer', 'deleteOffer', 'reorder']);

export const CatalogAdminProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { currentType } = useCatalogUiState();
    const [adminMode, setAdminMode] = useState(false);
    const [editingOffer, setEditingOfferState] = useState<IPurchasableOffer | null>(null);
    const [editingOfferDetails, setEditingOfferDetails] = useState<IEditingOfferDetails | null>(null);
    const [editingPageDetails, setEditingPageDetails] = useState<IEditingPageDetails | null>(null);
    const [editingPageData, setEditingPageData] = useState(false);
    const [editingRootPage, setEditingRootPage] = useState(false);
    const [editingPageNode, setEditingPageNode] = useState<ICatalogNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<ICatalogAdminPendingChange[]>([]);
    const pendingActionRef = useRef<string | null>(null);
    const pendingChangeLabelRef = useRef<string | null>(null);
    const pendingChangeRecordedForBatchRef = useRef(false);
    const pendingReorderRef = useRef<{ remaining: number } | null>(null);
    const { simpleAlert = null } = useNotification();

    const beginAdminAction = useCallback((action: string, summary: string) => {
        setLoading(true);
        setLastError(null);
        pendingActionRef.current = action;
        pendingChangeLabelRef.current = summary;

        if (action === 'reorder') pendingChangeRecordedForBatchRef.current = false;
    }, []);

    const recordPendingChange = useCallback((action: string | null, summary: string | null) => {
        if (!action || action === 'publish' || !summary?.length) return;

        if (action === 'reorder') {
            if (pendingChangeRecordedForBatchRef.current) return;
            pendingChangeRecordedForBatchRef.current = true;
        }

        pendingChangeCounter += 1;

        setPendingChanges((prev) => [
            ...prev,
            {
                id: `pending-${pendingChangeCounter}`,
                summary,
                at: Date.now()
            }
        ]);
        setHasPendingChanges(true);
    }, []);

    const setEditingOffer = useCallback(
        (offer: IPurchasableOffer | null) => {
            setEditingOfferState(offer);
            setEditingOfferDetails(null);

            if (offer && offer.offerId !== -1) {
                SendMessageComposer(new CatalogAdminLoadOfferComposer(offer.offerId, currentType));
            }
        },
        [currentType]
    );

    useMessageEvent(CatalogAdminOfferDetailsEvent, (event: CatalogAdminOfferDetailsEvent) => {
        const parser = event.getParser();

        setEditingOfferDetails({
            offerId: parser.offerId,
            offerIdGroup: parser.offerIdGroup,
            limitedStack: parser.limitedStack,
            orderNumber: parser.orderNumber
        });
    });

    useMessageEvent(CatalogAdminPageDetailsEvent, (event: CatalogAdminPageDetailsEvent) => {
        const parser = event.getParser();

        setEditingPageDetails({
            pageId: parser.pageId,
            caption: parser.caption,
            captionSave: parser.captionSave,
            minRank: parser.minRank,
            orderNum: parser.orderNum,
            visible: parser.visible,
            enabled: parser.enabled
        });
    });

    const requestPageDetails = useCallback(
        (pageId: number) => {
            setEditingPageDetails(null);
            if (pageId == null || pageId < 0) return;
            SendMessageComposer(new CatalogAdminLoadPageComposer(pageId, currentType));
        },
        [currentType]
    );

    useEffect(() => {
        if (!adminMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (editingOffer) {
                    setEditingOffer(null);
                    e.preventDefault();
                    return;
                }
                if (editingPageData || editingRootPage || editingPageNode) {
                    setEditingPageData(false);
                    setEditingRootPage(false);
                    setEditingPageNode(null);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [adminMode, editingOffer, editingPageData, editingRootPage, editingPageNode]);

    useMessageEvent(CatalogAdminResultEvent, (event: CatalogAdminResultEvent) => {
        const parser = event.getParser();
        const action = pendingActionRef.current;
        const summary = pendingChangeLabelRef.current;

        if (action === 'reorder' && pendingReorderRef.current) {
            if (!parser.success) {
                pendingReorderRef.current = null;
                pendingActionRef.current = null;
                pendingChangeLabelRef.current = null;
                setLoading(false);
                setLastError(parser.message || 'Operation failed');

                if (simpleAlert) {
                    simpleAlert(parser.message || 'Operation failed', NotificationAlertType.ALERT, null, null, 'Admin Error');
                }

                window.dispatchEvent(new Event('catalog-admin-refresh-current-page'));
                return;
            }

            pendingReorderRef.current.remaining -= 1;

            if (pendingReorderRef.current.remaining > 0) return;

            pendingReorderRef.current = null;
        }

        pendingActionRef.current = null;
        pendingChangeLabelRef.current = null;
        setLoading(false);

        if (!parser.success) {
            setLastError(parser.message || 'Operation failed');

            if (simpleAlert) {
                simpleAlert(parser.message || 'Operation failed', NotificationAlertType.ALERT, null, null, 'Admin Error');
            }
        } else {
            setLastError(null);
            setEditingOffer(null);
            setEditingPageData(false);
            setEditingRootPage(false);
            setEditingPageNode(null);

            if (action === 'publish') {
                setHasPendingChanges(false);
                setPendingChanges([]);
            } else {
                recordPendingChange(action, summary);

                if (PAGE_INDEX_REFRESH_ACTIONS.has(action)) {
                    window.dispatchEvent(new Event('catalog-admin-refresh-index'));
                }

                if (OFFER_REFRESH_ACTIONS.has(action)) {
                    window.dispatchEvent(new Event('catalog-admin-refresh-current-page'));
                }
            }
        }
    });

    const savePage = useCallback(
        (data: IPageEditData) => {
            beginAdminAction('savePage', `Updated page: ${data.caption || `#${data.pageId}`}`);

            SendMessageComposer(
                new CatalogAdminSavePageComposer(
                    data.pageId || 0,
                    data.caption,
                    data.captionSave,
                    data.pageLayout,
                    data.iconImage,
                    data.minRank,
                    data.visible === '1',
                    data.enabled === '1',
                    data.orderNum,
                    data.parentId,
                    data.pageHeadline || '',
                    data.pageTeaser || '',
                    data.pageTextDetails || '',
                    currentType,
                    data.catalogMode,
                    data.pageText1 || ''
                )
            );
        },
        [currentType, beginAdminAction]
    );

    const createPage = useCallback(
        (data: IPageEditData) => {
            beginAdminAction('createPage', `Created page: ${data.caption || 'New page'}`);
            SendMessageComposer(
                new CatalogAdminCreatePageComposer(
                    data.caption,
                    data.captionSave,
                    data.pageLayout,
                    data.iconImage,
                    data.minRank,
                    data.visible === '1',
                    data.enabled === '1',
                    data.orderNum,
                    data.parentId,
                    currentType,
                    data.catalogMode
                )
            );
        },
        [currentType, beginAdminAction]
    );

    const deletePage = useCallback(
        (pageId: number, summary?: string) => {
            beginAdminAction('deletePage', summary || `Deleted page #${pageId}`);
            SendMessageComposer(new CatalogAdminDeletePageComposer(pageId, currentType));
        },
        [currentType, beginAdminAction]
    );

    const saveOffer = useCallback(
        (data: IOfferEditData) => {
            beginAdminAction('saveOffer', `Updated offer: ${data.catalogName || `#${data.offerId}`}`);
            SendMessageComposer(
                new CatalogAdminSaveOfferComposer(
                    data.offerId || 0,
                    data.pageId,
                    data.itemIds || '',
                    data.catalogName,
                    data.costCredits,
                    data.costPoints,
                    data.pointsType,
                    data.amount,
                    data.clubOnly === '1' ? 1 : 0,
                    data.extradata,
                    data.haveOffer === '1',
                    data.offerId_group,
                    data.limitedStack,
                    data.orderNumber,
                    currentType
                )
            );
        },
        [currentType, beginAdminAction]
    );

    const createOffer = useCallback(
        (data: IOfferEditData) => {
            beginAdminAction('createOffer', `Created offer: ${data.catalogName || 'New offer'}`);
            SendMessageComposer(
                new CatalogAdminCreateOfferComposer(
                    data.pageId,
                    data.itemIds || '',
                    data.catalogName,
                    data.costCredits,
                    data.costPoints,
                    data.pointsType,
                    data.amount,
                    data.clubOnly === '1' ? 1 : 0,
                    data.extradata,
                    data.haveOffer === '1',
                    data.offerId_group,
                    data.limitedStack,
                    data.orderNumber,
                    currentType
                )
            );
        },
        [currentType, beginAdminAction]
    );

    const deleteOffer = useCallback(
        (offerId: number, summary?: string) => {
            beginAdminAction('deleteOffer', summary || `Deleted offer #${offerId}`);
            SendMessageComposer(new CatalogAdminDeleteOfferComposer(offerId, currentType));
        },
        [currentType, beginAdminAction]
    );

    const reorderOffers = useCallback(
        (orders: { id: number; orderNumber: number }[], summary?: string) => {
            if (!orders.length) return;

            beginAdminAction('reorder', summary || 'Reordered offers');
            pendingReorderRef.current = { remaining: orders.length };

            for (const order of orders) {
                SendMessageComposer(new CatalogAdminMoveOfferComposer(order.id, order.orderNumber, currentType));
            }
        },
        [currentType, beginAdminAction]
    );

    const reorderPage = useCallback(
        (pageId: number, newParentId: number, newIndex: number, summary?: string) => {
            beginAdminAction('movePage', summary || `Moved page #${pageId}`);
            SendMessageComposer(new CatalogAdminMovePageComposer(pageId, newParentId, newIndex, currentType));
        },
        [currentType, beginAdminAction]
    );

    const togglePageEnabled = useCallback(
        (pageId: number, summary?: string) => {
            beginAdminAction('toggleEnabled', summary || `Toggled enabled state for page #${pageId}`);
            SendMessageComposer(new CatalogAdminMovePageComposer(pageId, -1, -1, currentType));
        },
        [currentType, beginAdminAction]
    );

    const togglePageVisible = useCallback(
        (pageId: number, summary?: string) => {
            beginAdminAction('toggleVisible', summary || `Toggled visibility for page #${pageId}`);
            SendMessageComposer(new CatalogAdminMovePageComposer(pageId, -2, -1, currentType));
        },
        [currentType, beginAdminAction]
    );

    const publishCatalog = useCallback(() => {
        beginAdminAction('publish', 'Published catalog');
        SendMessageComposer(new CatalogAdminPublishComposer());
    }, [beginAdminAction]);

    return (
        <CatalogAdminContext
            value={{
                adminMode,
                setAdminMode,
                editingOffer,
                setEditingOffer,
                editingOfferDetails,
                editingPageDetails,
                requestPageDetails,
                editingPageData,
                setEditingPageData,
                editingRootPage,
                setEditingRootPage,
                editingPageNode,
                setEditingPageNode,
                loading,
                lastError,
                hasPendingChanges,
                pendingChanges,
                savePage,
                createPage,
                deletePage,
                saveOffer,
                createOffer,
                deleteOffer,
                reorderOffers,
                reorderPage,
                togglePageEnabled,
                togglePageVisible,
                publishCatalog
            }}
        >
            {children}
        </CatalogAdminContext>
    );
};
