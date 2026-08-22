import {
    CatalogAdminCreateOfferComposer,
    CatalogAdminCreatePageComposer,
    CatalogAdminDeleteOfferComposer,
    CatalogAdminDeletePageComposer,
    CatalogAdminLoadOfferComposer,
    CatalogAdminLoadPageComposer,
    CatalogAdminMovePageComposer,
    CatalogAdminOfferDetailsEvent,
    CatalogAdminPageDetailsEvent,
    CatalogAdminReorderOffersComposer,
    CatalogAdminResultEvent,
    CatalogAdminSaveOfferComposer,
    CatalogAdminSavePageComposer,
    CatalogAdminSetPageEnabledComposer,
    CatalogAdminSetPageVisibleComposer
} from '@nitrots/nitro-renderer';
import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ICatalogNode, IPurchasableOffer, NotificationAlertType, SendMessageComposer } from '../../api';
import { useCatalogUiState, useMessageEvent, useNotification } from '../../hooks';
import { nextCatalogStudioOperationId } from './admin/studio/CatalogStudioOperationId';
import { CatalogStudioHistoryGroup, CatalogStudioOfferSnapshot, CatalogStudioPageSnapshot } from './admin/studio/CatalogStudioTypes';
import { useCatalogStudio } from './admin/studio/useCatalogStudio';
import { createCatalogAdminPageDetailsFromSnapshot } from './views/admin/CatalogAdminPageState';

const toStudioCatalogType = (catalogType: string): 'NORMAL' | 'BUILDER' =>
    catalogType === 'BUILDERS_CLUB' || catalogType === 'BUILDER' ? 'BUILDER' : 'NORMAL';

const studioLockKey = (entityType: 'PAGE' | 'OFFER', entityId: number, catalogType: string) => {
    const type = toStudioCatalogType(catalogType);
    return type === 'NORMAL' ? `${entityType}:${entityId}` : `${type}:${entityType}:${entityId}`;
};

export interface IPageEditData {
    pageId?: number;
    caption: string;
    captionSave: string;
    parentId: number;
    catalogMode: string;
    pageLayout: string;
    iconColor: number;
    iconImage: number;
    enabled: string;
    visible: string;
    minRank: number;
    clubOnly?: string;
    vipOnly?: string;
    orderNum: number;
    pageHeadline?: string;
    pageTeaser?: string;
    pageSpecial?: string;
    pageText1?: string;
    pageText2?: string;
    pageTextDetails?: string;
    pageTextTeaser?: string;
    roomId?: number;
    includes?: string;
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
    songId: number;
    limitedStack: number;
    orderNumber: number;
}

export interface IEditingOfferDetails {
    offerId: number;
    pageId: number;
    itemIds: string;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    amount: number;
    clubOnly: boolean;
    extradata: string;
    haveOffer: boolean;
    offerIdGroup: number;
    songId: number;
    limitedStack: number;
    limitedSells: number;
    orderNumber: number;
    catalogMode: string;
}

export interface IEditingPageDetails {
    pageId: number;
    caption: string;
    captionSave: string;
    parentId: number;
    catalogMode: string;
    layout: string;
    iconColor: number;
    iconImage: number;
    minRank: number;
    orderNum: number;
    visible: boolean;
    enabled: boolean;
    clubOnly: boolean;
    vipOnly: boolean;
    headline: string;
    teaser: string;
    special: string;
    textOne: string;
    textTwo: string;
    textDetails: string;
    textTeaser: string;
    roomId: number;
    includes: string;
}

type CatalogAdminMutationAction = 'createPage' | 'savePage' | 'createOffer' | 'saveOffer';

export interface CatalogAdminMutationResult {
    operationId: string;
    action: CatalogAdminMutationAction;
    success: boolean;
    code: string;
    message: string;
    entityType: 'PAGE' | 'OFFER';
    catalogType: 'NORMAL' | 'BUILDER';
    entityId: number;
    entity: CatalogStudioPageSnapshot | CatalogStudioOfferSnapshot | null;
    historyGroup: CatalogStudioHistoryGroup | null;
    fieldErrors: Record<string, string>;
    acknowledgedAt: number;
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
    creatingPage: boolean;
    setCreatingPage: (value: boolean) => void;
    loading: boolean;
    lastError: string | null;
    lastMutationResult: CatalogAdminMutationResult | null;
    studioSessionReady: boolean;
    ensurePageLock: (pageId: number) => void;
    hasPageLock: (pageId: number) => boolean;
    ensureOfferLock: (offerId: number) => void;
    hasOfferLock: (offerId: number) => boolean;
    savePage: (data: IPageEditData) => string | null;
    createPage: (data: IPageEditData) => string | null;
    deletePage: (pageId: number, summary?: string) => void;
    saveOffer: (data: IOfferEditData) => string | null;
    createOffer: (data: IOfferEditData) => string | null;
    deleteOffer: (offerId: number, summary?: string) => void;
    reorderOffers: (orders: { id: number; orderNumber: number }[], summary?: string, pageId?: number) => void;
    reorderPage: (pageId: number, newParentId: number, newIndex: number, summary?: string) => void;
    togglePageEnabled: (pageId: number, enabled: boolean, summary?: string) => void;
    togglePageVisible: (pageId: number, visible: boolean, summary?: string) => void;
    publishCatalog: () => void;
}

const CatalogAdminContext = createContext<ICatalogAdminContext>(null);

export const useCatalogAdmin = () => useContext(CatalogAdminContext);

export const CATALOG_ROOT_LOCK_ID = 2147483647;

const PAGE_INDEX_REFRESH_ACTIONS = new Set(['deletePage', 'movePage', 'toggleVisible', 'toggleEnabled']);
const OFFER_REFRESH_ACTIONS = new Set(['deleteOffer', 'reorder']);

type QueuedPageMutation =
    | { kind: 'delete'; pageId: number; catalogType: string; summary: string }
    | { kind: 'move'; pageId: number; catalogType: string; newParentId: number; newIndex: number; summary: string }
    | { kind: 'toggleEnabled'; pageId: number; catalogType: string; enabled: boolean; summary: string }
    | { kind: 'toggleVisible'; pageId: number; catalogType: string; visible: boolean; summary: string };

interface PendingCatalogAdminMutation {
    operationId: string;
    action: CatalogAdminMutationAction;
    submittedAt: number;
}

export const CatalogAdminProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { currentType } = useCatalogUiState();
    const studio = useCatalogStudio();
    const [adminMode, setAdminMode] = useState(false);
    const [editingOffer, setEditingOfferState] = useState<IPurchasableOffer | null>(null);
    const [editingOfferDetails, setEditingOfferDetails] = useState<IEditingOfferDetails | null>(null);
    const [editingPageDetails, setEditingPageDetails] = useState<IEditingPageDetails | null>(null);
    const [editingPageData, setEditingPageData] = useState(false);
    const [editingRootPage, setEditingRootPage] = useState(false);
    const [editingPageNode, setEditingPageNode] = useState<ICatalogNode | null>(null);
    const [creatingPage, setCreatingPage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastMutationResult, setLastMutationResult] = useState<CatalogAdminMutationResult | null>(null);
    const queuedPageMutationRef = useRef<QueuedPageMutation | null>(null);
    const queuedOfferDeleteRef = useRef<{ offerId: number; summary: string } | null>(null);
    const requestedOfferKeyRef = useRef<string | null>(null);
    const pendingActionRef = useRef<string | null>(null);
    const pendingSmartSaveRef = useRef<Map<string, PendingCatalogAdminMutation>>(new Map());
    const pendingSmartSaveOrderRef = useRef<string[]>([]);
    const { simpleAlert = null } = useNotification();

    const beginAdminAction = useCallback((action: string, _summary: string) => {
        if (pendingActionRef.current) return false;

        setLoading(true);
        setLastError(null);
        pendingActionRef.current = action;
        return true;
    }, []);

    const beginSmartSave = useCallback((action: CatalogAdminMutationAction) => {
        const operationId = nextCatalogStudioOperationId(action);
        pendingSmartSaveRef.current.set(operationId, { operationId, action, submittedAt: Date.now() });
        pendingSmartSaveOrderRef.current.push(operationId);
        setLoading(true);
        setLastError(null);
        setLastMutationResult(null);
        return operationId;
    }, []);

    const setEditingOffer = useCallback(
        (offer: IPurchasableOffer | null) => {
            setEditingOfferState(offer);
            setEditingOfferDetails(null);
            requestedOfferKeyRef.current = null;
            setLastError(null);
        },
        []
    );

    useEffect(() => {
        if (!editingOffer || editingOffer.offerId === -1) return;
        if (!studio.session) {
            setLastError('Catalog Studio session is not ready');
            studio.refresh();
            return;
        }

        const requestKey = `${studio.session.draftVersionId}:${editingOffer.offerId}:${toStudioCatalogType(currentType)}`;
        if (requestedOfferKeyRef.current === requestKey) return;
        requestedOfferKeyRef.current = requestKey;

        const catalogType = toStudioCatalogType(currentType);
        const snapshot = studio.session.offers.find((offer) =>
            offer.offerId === editingOffer.offerId && offer.catalogType === catalogType);
        if (snapshot) {
            setEditingOfferDetails({
                offerId: snapshot.offerId,
                pageId: snapshot.pageId,
                itemIds: snapshot.itemIds,
                catalogName: snapshot.catalogName,
                costCredits: snapshot.costCredits,
                costPoints: snapshot.costPoints,
                pointsType: snapshot.pointsType,
                amount: snapshot.amount,
                clubOnly: snapshot.clubOnly,
                extradata: snapshot.extradata,
                haveOffer: snapshot.haveOffer,
                offerIdGroup: snapshot.offerIdClient,
                songId: snapshot.songId,
                limitedStack: snapshot.limitedStack,
                limitedSells: 0,
                orderNumber: snapshot.orderNumber,
                catalogMode: catalogType
            });
        }

        setLastError(null);
        SendMessageComposer(new CatalogAdminLoadOfferComposer(
            editingOffer.offerId,
            currentType,
            studio.session.draftVersionId,
            studio.revision
        ));
    }, [currentType, editingOffer, studio.refresh, studio.revision, studio.session]);

    useMessageEvent(CatalogAdminOfferDetailsEvent, (event: CatalogAdminOfferDetailsEvent) => {
        const parser = event.getParser();

        setEditingOfferDetails({
            offerId: parser.offerId,
            pageId: parser.pageId,
            itemIds: parser.itemIds,
            catalogName: parser.catalogName,
            costCredits: parser.costCredits,
            costPoints: parser.costPoints,
            pointsType: parser.pointsType,
            amount: parser.amount,
            clubOnly: parser.clubOnly,
            extradata: parser.extradata,
            haveOffer: parser.haveOffer,
            offerIdGroup: parser.offerIdGroup,
            songId: parser.songId,
            limitedStack: parser.limitedStack,
            limitedSells: parser.limitedSells,
            orderNumber: parser.orderNumber,
            catalogMode: parser.catalogMode
        });
    });

    useMessageEvent(CatalogAdminPageDetailsEvent, (event: CatalogAdminPageDetailsEvent) => {
        const parser = event.getParser();

        setEditingPageDetails({
            pageId: parser.pageId,
            caption: parser.caption,
            captionSave: parser.captionSave,
            parentId: parser.parentId,
            catalogMode: parser.catalogMode,
            layout: parser.layout,
            iconColor: parser.iconColor,
            iconImage: parser.iconImage,
            minRank: parser.minRank,
            orderNum: parser.orderNum,
            visible: parser.visible,
            enabled: parser.enabled,
            clubOnly: parser.clubOnly,
            vipOnly: parser.vipOnly,
            headline: parser.headline,
            teaser: parser.teaser,
            special: parser.special,
            textOne: parser.textOne,
            textTwo: parser.textTwo,
            textDetails: parser.textDetails,
            textTeaser: parser.textTeaser,
            roomId: parser.roomId,
            includes: parser.includes
        });
    });

    const requestPageDetails = useCallback(
        (pageId: number) => {
            setEditingPageDetails(null);
            if (pageId == null || pageId < 0) return;
            if (!studio.session) {
                setLastError('Catalog Studio session is not ready');
                return;
            }

            const catalogType = toStudioCatalogType(currentType);
            const snapshot = studio.session.pages.find((page) =>
                page.pageId === pageId && page.catalogType === catalogType);
            if (snapshot) setEditingPageDetails(createCatalogAdminPageDetailsFromSnapshot(snapshot));

            setLastError(null);
            SendMessageComposer(new CatalogAdminLoadPageComposer(
                pageId,
                currentType,
                studio.session.draftVersionId,
                studio.revision
            ));
        },
        [currentType, studio.session, studio.revision]
    );

    const ensurePageLock = useCallback(
        (pageId: number) => {
            if (pageId == null || pageId < 0) return;

            const key = studioLockKey('PAGE', pageId, currentType);
            if (studio.locks[key]) {
                setLastError(null);
                return;
            }
            if (!studio.session) {
                setLastError('Catalog Studio session is not ready');
                studio.refresh();
                return;
            }

            setLastError(null);
            studio.acquireLock('PAGE', pageId, toStudioCatalogType(currentType));
        },
        [currentType, studio.acquireLock, studio.locks, studio.refresh, studio.session]
    );

    const hasPageLock = useCallback(
        (pageId: number) => !!studio.locks[studioLockKey('PAGE', pageId, currentType)],
        [currentType, studio.locks]
    );

    const ensureOfferLock = useCallback(
        (offerId: number) => {
            if (offerId == null || offerId <= 0) return;
            const key = studioLockKey('OFFER', offerId, currentType);
            if (studio.locks[key]) {
                setLastError(null);
                return;
            }
            if (!studio.session) {
                setLastError('Catalog Studio session is not ready');
                studio.refresh();
                return;
            }
            setLastError(null);
            studio.acquireLock('OFFER', offerId, toStudioCatalogType(currentType));
        },
        [currentType, studio.acquireLock, studio.locks, studio.refresh, studio.session]
    );

    const hasOfferLock = useCallback(
        (offerId: number) => !!studio.locks[studioLockKey('OFFER', offerId, currentType)],
        [currentType, studio.locks]
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
                    setCreatingPage(false);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [adminMode, editingOffer, editingPageData, editingRootPage, editingPageNode]);

    useMessageEvent(CatalogAdminResultEvent, (event: CatalogAdminResultEvent) => {
        const parser = event.getParser();
        const smartSaveResult = parser.smartSaveResult;

        if (smartSaveResult) {
            const pending = pendingSmartSaveRef.current.get(smartSaveResult.operationId);
            if (!pending || pending.action !== smartSaveResult.action) return;

            pendingSmartSaveRef.current.delete(smartSaveResult.operationId);
            pendingSmartSaveOrderRef.current = pendingSmartSaveOrderRef.current
                .filter(operationId => operationId !== smartSaveResult.operationId);
            setLoading(pendingSmartSaveRef.current.size > 0 || !!pendingActionRef.current);

            const mutationResult: CatalogAdminMutationResult = {
                operationId: smartSaveResult.operationId,
                action: smartSaveResult.action,
                success: parser.success,
                code: smartSaveResult.code,
                message: parser.message || smartSaveResult.code,
                entityType: smartSaveResult.entityType,
                catalogType: smartSaveResult.catalogType,
                entityId: smartSaveResult.entityId,
                entity: smartSaveResult.entity,
                historyGroup: smartSaveResult.historyGroup,
                fieldErrors: { ...smartSaveResult.fieldErrors },
                acknowledgedAt: Date.now()
            };
            setLastMutationResult(mutationResult);

            if (!parser.success || !smartSaveResult.entity || !smartSaveResult.historyGroup) {
                setLastError(parser.message || smartSaveResult.code || 'Operation failed');
                return;
            }

            studio.applyMutation({
                operationId: smartSaveResult.operationId,
                action: smartSaveResult.action,
                revision: smartSaveResult.revision,
                entityType: smartSaveResult.entityType,
                catalogType: smartSaveResult.catalogType,
                entity: smartSaveResult.entity,
                historyGroup: smartSaveResult.historyGroup
            });
            if (smartSaveResult.entityType === 'PAGE') {
                setEditingPageDetails(createCatalogAdminPageDetailsFromSnapshot(
                    smartSaveResult.entity as CatalogStudioPageSnapshot));
            } else {
                const offer = smartSaveResult.entity as CatalogStudioOfferSnapshot;
                setEditingOfferDetails(current => ({
                    offerId: offer.offerId,
                    pageId: offer.pageId,
                    itemIds: offer.itemIds,
                    catalogName: offer.catalogName,
                    costCredits: offer.costCredits,
                    costPoints: offer.costPoints,
                    pointsType: offer.pointsType,
                    amount: offer.amount,
                    clubOnly: offer.clubOnly,
                    extradata: offer.extradata,
                    haveOffer: offer.haveOffer,
                    offerIdGroup: offer.offerIdClient,
                    songId: offer.songId,
                    limitedStack: offer.limitedStack,
                    limitedSells: current?.limitedSells ?? 0,
                    orderNumber: offer.orderNumber,
                    catalogMode: offer.catalogType
                }));
            }
            setLastError(null);
            return;
        }

        let action = pendingActionRef.current;
        if (!action) {
            const operationId = pendingSmartSaveOrderRef.current.shift();
            if (operationId) {
                action = pendingSmartSaveRef.current.get(operationId)?.action ?? null;
                pendingSmartSaveRef.current.delete(operationId);
            }
        }

        pendingActionRef.current = null;
        setLoading(pendingSmartSaveRef.current.size > 0);

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
            setCreatingPage(false);

            studio.refresh();
            studio.loadHistory();

            if (action && PAGE_INDEX_REFRESH_ACTIONS.has(action)) {
                window.dispatchEvent(new Event('catalog-admin-refresh-index'));
            }

            if (action && OFFER_REFRESH_ACTIONS.has(action)) {
                window.dispatchEvent(new Event('catalog-admin-refresh-current-page'));
            }
        }
    });

    const savePage = useCallback(
        (data: IPageEditData) => {
            const summary = `Updated page: ${data.caption || `#${data.pageId}`}`;
            const lock = studio.locks[studioLockKey('PAGE', data.pageId || 0, currentType)];
            if (!studio.session || !lock) {
                setLastError('Open the page inspector and acquire its edit lock before saving');
                return null;
            }
            const operationId = beginSmartSave('savePage');

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
                    data.pageText1 || '',
                    data.iconColor,
                    data.clubOnly === '1',
                    data.vipOnly === '1',
                    data.pageSpecial || '',
                    data.pageText2 || '',
                    data.pageTextTeaser || '',
                    data.roomId || 0,
                    data.includes || '',
                    studio.session.draftVersionId,
                    studio.revision,
                    lock.token,
                    summary,
                    operationId
                )
            );
            return operationId;
        },
        [currentType, beginSmartSave, studio]
    );

    const createPage = useCallback(
        (data: IPageEditData) => {
            const summary = `Created page: ${data.caption || 'New page'}`;
            const lockId = data.parentId <= 0 ? CATALOG_ROOT_LOCK_ID : data.parentId;
            const lock = studio.locks[studioLockKey('PAGE', lockId, currentType)];
            if (!studio.session || !lock) {
                setLastError(data.parentId <= 0
                    ? 'Wait for the catalog root lock before creating a root category'
                    : 'Open the parent page inspector and acquire its edit lock before creating a sub-page');
                return null;
            }
            const operationId = beginSmartSave('createPage');
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
                    data.catalogMode,
                    data.iconColor,
                    data.clubOnly === '1',
                    data.vipOnly === '1',
                    data.pageHeadline || '',
                    data.pageTeaser || '',
                    data.pageSpecial || '',
                    data.pageText1 || '',
                    data.pageText2 || '',
                    data.pageTextDetails || '',
                    data.pageTextTeaser || '',
                    data.roomId || 0,
                    data.includes || '',
                    studio.session.draftVersionId,
                    studio.revision,
                    lock.token,
                    summary,
                    operationId
                )
            );
            return operationId;
        },
        [currentType, beginSmartSave, studio]
    );

    const saveOffer = useCallback(
        (data: IOfferEditData) => {
            const summary = `Updated offer: ${data.catalogName || `#${data.offerId}`}`;
            const lock = studio.locks[studioLockKey('OFFER', data.offerId || 0, currentType)];
            if (!studio.session || !lock) {
                setLastError('Open the offer inspector and acquire its edit lock before saving');
                return null;
            }
            const operationId = beginSmartSave('saveOffer');
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
                    data.songId,
                    currentType,
                    studio.session.draftVersionId,
                    studio.revision,
                    lock.token,
                    summary,
                    operationId
                )
            );
            return operationId;
        },
        [currentType, beginSmartSave, studio]
    );

    const createOffer = useCallback(
        (data: IOfferEditData) => {
            const summary = `Created offer: ${data.catalogName || 'New offer'}`;
            const lock = studio.locks[studioLockKey('PAGE', data.pageId, currentType)];
            if (!studio.session || !lock) {
                setLastError('Open the target page and acquire its edit lock before creating an offer');
                return null;
            }
            const operationId = beginSmartSave('createOffer');
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
                    data.songId,
                    currentType,
                    studio.session.draftVersionId,
                    studio.revision,
                    lock.token,
                    summary,
                    operationId
                )
            );
            return operationId;
        },
        [currentType, beginSmartSave, studio]
    );

    const deleteOffer = useCallback(
        (offerId: number, summary?: string) => {
            const effectiveSummary = summary || `Deleted offer #${offerId}`;
            const lock = studio.locks[studioLockKey('OFFER', offerId, currentType)];
            if (!studio.session) {
                setLastError('Catalog Studio session is not ready');
                return;
            }
            if (!lock) {
                queuedOfferDeleteRef.current = { offerId, summary: effectiveSummary };
                studio.acquireLock('OFFER', offerId, toStudioCatalogType(currentType));
                return;
            }
            if (!beginAdminAction('deleteOffer', effectiveSummary)) return;
            SendMessageComposer(new CatalogAdminDeleteOfferComposer(
                offerId, currentType, studio.session.draftVersionId, studio.revision, lock.token, effectiveSummary));
        },
        [currentType, beginAdminAction, studio]
    );

    useEffect(() => {
        const queued = queuedOfferDeleteRef.current;
        if (!queued || !studio.locks[studioLockKey('OFFER', queued.offerId, currentType)]) return;
        queuedOfferDeleteRef.current = null;
        deleteOffer(queued.offerId, queued.summary);
    }, [currentType, deleteOffer, studio.locks]);

    const reorderOffers = useCallback(
        (orders: { id: number; orderNumber: number }[], summary?: string, pageId?: number) => {
            if (!orders.length) return;
            const effectivePageId = pageId || 0;
            const lock = studio.locks[studioLockKey('PAGE', effectivePageId, currentType)];
            const effectiveSummary = summary || 'Reordered offers';
            if (!studio.session || !lock) {
                setLastError('Select the page and wait for its edit lock before reordering offers');
                return;
            }
            if (!beginAdminAction('reorder', effectiveSummary)) return;
            SendMessageComposer(new CatalogAdminReorderOffersComposer(
                orders, currentType, studio.session.draftVersionId, studio.revision, lock.token, effectiveSummary));
        },
        [currentType, beginAdminAction, studio]
    );

    const performPageMutation = useCallback(
        (mutation: QueuedPageMutation) => {
            if (!studio.session) {
                queuedPageMutationRef.current = mutation;
                setLastError(null);
                studio.refresh();
                return;
            }

            const lock = studio.locks[studioLockKey('PAGE', mutation.pageId, mutation.catalogType)];
            if (!lock) {
                queuedPageMutationRef.current = mutation;
                setLastError(null);
                studio.acquireLock('PAGE', mutation.pageId, toStudioCatalogType(mutation.catalogType));
                return;
            }

            if (!beginAdminAction(
                mutation.kind === 'delete' ? 'deletePage' :
                    mutation.kind === 'move' ? 'movePage' :
                        mutation.kind === 'toggleEnabled' ? 'toggleEnabled' : 'toggleVisible',
                mutation.summary
            )) return;

            switch (mutation.kind) {
                case 'delete':
                    SendMessageComposer(new CatalogAdminDeletePageComposer(
                        mutation.pageId, mutation.catalogType, studio.session.draftVersionId,
                        studio.revision, lock.token, mutation.summary));
                    break;
                case 'move':
                    SendMessageComposer(new CatalogAdminMovePageComposer(
                        mutation.pageId, mutation.newParentId, mutation.newIndex, mutation.catalogType,
                        studio.session.draftVersionId, studio.revision, lock.token, mutation.summary));
                    break;
                case 'toggleEnabled':
                    SendMessageComposer(new CatalogAdminSetPageEnabledComposer(
                        mutation.pageId, mutation.enabled, mutation.catalogType, studio.session.draftVersionId,
                        studio.revision, lock.token, mutation.summary));
                    break;
                case 'toggleVisible':
                    SendMessageComposer(new CatalogAdminSetPageVisibleComposer(
                        mutation.pageId, mutation.visible, mutation.catalogType, studio.session.draftVersionId,
                        studio.revision, lock.token, mutation.summary));
                    break;
            }
        },
        [beginAdminAction, studio.acquireLock, studio.locks, studio.refresh, studio.revision, studio.session]
    );

    useEffect(() => {
        const queued = queuedPageMutationRef.current;
        if (!queued || !studio.session) return;

        const lock = studio.locks[studioLockKey('PAGE', queued.pageId, queued.catalogType)];
        if (!lock) {
            studio.acquireLock('PAGE', queued.pageId, toStudioCatalogType(queued.catalogType));
            return;
        }

        queuedPageMutationRef.current = null;
        performPageMutation(queued);
    }, [performPageMutation, studio.acquireLock, studio.locks, studio.session]);

    const deletePage = useCallback(
        (pageId: number, summary?: string) => {
            performPageMutation({
                kind: 'delete',
                pageId,
                catalogType: currentType,
                summary: summary || `Deleted page #${pageId}`
            });
        },
        [currentType, performPageMutation]
    );

    const reorderPage = useCallback(
        (pageId: number, newParentId: number, newIndex: number, summary?: string) => {
            performPageMutation({
                kind: 'move',
                pageId,
                catalogType: currentType,
                newParentId,
                newIndex,
                summary: summary || `Moved page #${pageId}`
            });
        },
        [currentType, performPageMutation]
    );

    const togglePageEnabled = useCallback(
        (pageId: number, enabled: boolean, summary?: string) => {
            performPageMutation({
                kind: 'toggleEnabled',
                pageId,
                catalogType: currentType,
                enabled,
                summary: summary || `Toggled enabled state for page #${pageId}`
            });
        },
        [currentType, performPageMutation]
    );

    const togglePageVisible = useCallback(
        (pageId: number, visible: boolean, summary?: string) => {
            performPageMutation({
                kind: 'toggleVisible',
                pageId,
                catalogType: currentType,
                visible,
                summary: summary || `Toggled visibility for page #${pageId}`
            });
        },
        [currentType, performPageMutation]
    );

    const publishCatalog = useCallback(() => studio.publish(), [studio]);

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
                creatingPage,
                setCreatingPage,
                loading,
                lastError: lastError || studio.lastError,
                lastMutationResult,
                studioSessionReady: !!studio.session,
                ensurePageLock,
                hasPageLock,
                ensureOfferLock,
                hasOfferLock,
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
