import {
    CatalogStudioAcquireLockComposer,
    CatalogStudioAcquireLockEvent,
    CatalogStudioDocumentApplyComposer,
    CatalogStudioDocumentDryRunComposer,
    CatalogStudioDocumentResultEvent,
    CatalogStudioExportComposer,
    CatalogStudioHistoryComposer,
    CatalogStudioHistoryEvent,
    CatalogStudioOpenSessionComposer,
    CatalogStudioPublishComposer,
    CatalogStudioPublishEvent,
    CatalogStudioReleaseLockComposer,
    CatalogStudioReleaseLockEvent,
    CatalogStudioRenewLockComposer,
    CatalogStudioRenewLockEvent,
    CatalogStudioSessionEvent,
    CatalogStudioUndoComposer,
    CatalogStudioUndoEvent,
    CatalogStudioValidateComposer,
    CatalogStudioValidationEvent
} from '@nitrots/nitro-renderer';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SendMessageComposer } from '../../../../api';
import { useConnectionState, useMessageEvent } from '../../../../hooks';
import { applyCatalogStudioMutation } from './CatalogStudioMutationState';
import { nextCatalogStudioOperationId } from './CatalogStudioOperationId';
import { CatalogStudioDocumentResult, CatalogStudioHistoryGroup, CatalogStudioLock, CatalogStudioMutationResult, CatalogStudioPublishResult, CatalogStudioSession, CatalogStudioValidationState } from './CatalogStudioTypes';
import { CatalogStudioContext, CatalogStudioContextValue } from './useCatalogStudio';

const lockKey = (entityType: string, entityId: number, catalogType: string = 'NORMAL') =>
    catalogType === 'NORMAL' ? `${entityType}:${entityId}` : `${catalogType}:${entityType}:${entityId}`;
const CATALOG_ROOT_LOCK_ID = 2147483647;
type PendingDocumentApply = {
    format: 'SQL';
    document: string;
    fingerprint: string;
    summary: string;
};

export const CatalogStudioProvider: FC<{ active: boolean; children: ReactNode }> = ({ active, children }) => {
    const connectionState = useConnectionState();
    const authenticated = connectionState.authenticated;
    const [session, setSession] = useState<CatalogStudioSession | null>(null);
    const [history, setHistory] = useState<CatalogStudioHistoryGroup[]>([]);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [validation, setValidation] = useState<CatalogStudioValidationState | null>(null);
    const [documentResult, setDocumentResult] = useState<CatalogStudioDocumentResult | null>(null);
    const [publishResult, setPublishResult] = useState<CatalogStudioPublishResult | null>(null);
    const [locks, setLocks] = useState<Record<string, CatalogStudioLock>>({});
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const sessionRef = useRef<CatalogStudioSession | null>(null);
    const locksRef = useRef<Record<string, CatalogStudioLock>>({});
    const pendingLockKeysRef = useRef<Set<string>>(new Set());
    const pendingDocumentApplyRef = useRef<PendingDocumentApply | null>(null);
    const historyGroupIdsRef = useRef<Set<number>>(new Set());

    const replaceSession = useCallback((next: CatalogStudioSession) => {
        sessionRef.current = next;
        setSession(next);
    }, []);

    const refresh = useCallback(() => {
        if (!active || !authenticated) return;
        setLoading(true);
        SendMessageComposer(new CatalogStudioOpenSessionComposer());
    }, [active, authenticated]);

    const refreshHistory = useCallback(() => {
        const current = sessionRef.current;
        if (!current) return;
        SendMessageComposer(new CatalogStudioHistoryComposer(current.draftVersionId, 0, 50));
    }, []);

    const updateRevision = useCallback((revision: number) => {
        setSession((current) => {
            if (!current || current.revision === revision) return current;
            const next = { ...current, revision };
            sessionRef.current = next;
            return next;
        });
    }, []);

    useMessageEvent<CatalogStudioSessionEvent>(CatalogStudioSessionEvent, (event) => {
        const parser = event.getParser();
        replaceSession({
            activeVersionId: parser.activeVersionId,
            draftVersionId: parser.draftVersionId,
            revision: parser.revision,
            activeUpdatedAt: parser.activeUpdatedAt,
            draftCreatedAt: parser.draftCreatedAt,
            pendingCount: parser.pendingCount,
            actors: parser.actors.map((actor) => ({ ...actor })),
            validationCurrent: parser.validationCurrent,
            validationIssueCount: parser.validationIssueCount,
            publishedVersions: parser.publishedVersions.map((version) => ({ ...version })),
            pages: (parser.pages ?? []).map((page) => ({ ...page })),
            offers: (parser.offers ?? []).map((offer) => ({ ...offer }))
        });
        setLoading(false);
        setLastError(null);
    });

    const handleLock = useCallback((event: CatalogStudioAcquireLockEvent | CatalogStudioRenewLockEvent) => {
        const parser = event.getParser();
        const parsedCatalogType = parser.catalogType === 'BUILDER' ? 'BUILDER' : 'NORMAL';
        const isCatalogRootLock = parser.entityType === 'PAGE' && parser.entityId === CATALOG_ROOT_LOCK_ID && parsedCatalogType === 'NORMAL';
        pendingLockKeysRef.current.delete(lockKey(parser.entityType, parser.entityId, parsedCatalogType));
        setLoading(false);
        if (!parser.success) {
            if(isCatalogRootLock) pendingDocumentApplyRef.current = null;
            setLastError(parser.message || parser.code);
            return;
        }
        const nextLock: CatalogStudioLock = {
            draftVersionId: parser.draftVersionId,
            entityType: parser.entityType,
            catalogType: parsedCatalogType,
            entityId: parser.entityId,
            ownerId: parser.ownerId,
            ownerName: parser.ownerName,
            token: parser.token,
            expiresAt: parser.expiresAt
        };
        const current = sessionRef.current;
        if(!current || current.draftVersionId !== nextLock.draftVersionId) {
            if(isCatalogRootLock) pendingDocumentApplyRef.current = null;
            setLastError('The catalog draft changed while the edit lock was opening. Refresh and try again.');
            return;
        }
        setLocks((current) => {
            const next = { ...current, [lockKey(nextLock.entityType, nextLock.entityId, nextLock.catalogType)]: nextLock };
            locksRef.current = next;
            return next;
        });
        setLastError(null);

        const pendingApply = isCatalogRootLock ? pendingDocumentApplyRef.current : null;
        if(pendingApply) {
            pendingDocumentApplyRef.current = null;
            setLoading(true);
            SendMessageComposer(new CatalogStudioDocumentApplyComposer(
                nextCatalogStudioOperationId('apply'), current.draftVersionId, current.revision, nextLock.token,
                pendingApply.format, pendingApply.document, pendingApply.fingerprint, pendingApply.summary
            ));
        }
    }, []);

    useMessageEvent<CatalogStudioAcquireLockEvent>(CatalogStudioAcquireLockEvent, handleLock);
    useMessageEvent<CatalogStudioRenewLockEvent>(CatalogStudioRenewLockEvent, handleLock);

    const handleOperation = useCallback((event: CatalogStudioReleaseLockEvent | CatalogStudioUndoEvent | CatalogStudioPublishEvent) => {
        const parser = event.getParser();
        updateRevision(parser.revision);
        setLoading(false);
        if (!parser.success) {
            setLastError(parser.message || parser.code);
            if (parser.code === 'STALE_REVISION') refresh();
            return;
        }
        setLastError(null);
        refresh();
    }, [refresh, updateRevision]);

    const handleLifecycleOperation = useCallback((event: CatalogStudioPublishEvent) => {
        const parser = event.getParser();
        const reconciliation = parser as typeof parser & {
            importedChanges?: number;
            conflicts?: Array<{ catalogType: string; entityType: string; entityId: number; field: string }>;
        };
        setPublishResult({
            operationId: parser.operationId,
            success: parser.success,
            code: parser.code,
            message: parser.message,
            revision: parser.revision,
            importedChanges: reconciliation.importedChanges ?? 0,
            conflicts: (reconciliation.conflicts ?? []).map(conflict => ({
                ...conflict,
                catalogType: conflict.catalogType === 'BUILDER' ? 'BUILDER' : 'NORMAL'
            }))
        });
        if (parser.code === 'PUBLISHED') {
            locksRef.current = {};
            setLocks({});
            window.dispatchEvent(new Event('catalog-admin-refresh-index'));
            window.dispatchEvent(new Event('catalog-admin-refresh-current-page'));
        }
        handleOperation(event);
    }, [handleOperation]);

    useMessageEvent<CatalogStudioReleaseLockEvent>(CatalogStudioReleaseLockEvent, handleOperation);
    useMessageEvent<CatalogStudioUndoEvent>(CatalogStudioUndoEvent, (event) => {
        handleOperation(event);
        if (event.getParser().success) refreshHistory();
    });
    useMessageEvent<CatalogStudioPublishEvent>(CatalogStudioPublishEvent, handleLifecycleOperation);

    useMessageEvent<CatalogStudioHistoryEvent>(CatalogStudioHistoryEvent, (event) => {
        const parser = event.getParser();
        updateRevision(parser.revision);
        const nextHistory = parser.groups.map((group) => ({ ...group, entries: group.entries.map((entry) => ({ ...entry })) }));
        historyGroupIdsRef.current = new Set(nextHistory.map(group => group.id));
        setHistory(nextHistory);
        setHistoryTotalCount(parser.totalCount);
        setLoading(false);
    });

    useMessageEvent<CatalogStudioValidationEvent>(CatalogStudioValidationEvent, (event) => {
        const parser = event.getParser();
        const next: CatalogStudioValidationState = {
            operationId: parser.operationId,
            success: parser.success,
            code: parser.code,
            message: parser.message,
            revision: parser.revision,
            current: parser.current,
            issues: parser.issues.map((issue) => ({ ...issue }))
        };
        setValidation(next);
        updateRevision(parser.revision);
        setLoading(false);
        setLastError(parser.success ? null : parser.message || parser.code);
    });

    useMessageEvent<CatalogStudioDocumentResultEvent>(CatalogStudioDocumentResultEvent, (event) => {
        const parser = event.getParser();
        const result: CatalogStudioDocumentResult = {
            operationId: parser.operationId,
            success: parser.success,
            code: parser.code,
            message: parser.message,
            revision: parser.revision,
            format: parser.format,
            document: parser.document,
            fingerprint: parser.fingerprint,
            changedEntities: parser.changedEntities
        };
        setDocumentResult(result);
        setLoading(false);
        setLastError(result.success ? null : result.message || result.code);
        if(result.code === 'APPLIED' || result.code === 'ALREADY_APPLIED') {
            refresh();
            refreshHistory();
        }
    });

    useEffect(() => {
        if (!active || !authenticated) {
            setSession(null);
            sessionRef.current = null;
            locksRef.current = {};
            setLocks({});
            pendingLockKeysRef.current.clear();
            pendingDocumentApplyRef.current = null;
            setLoading(false);
            return;
        }
        refresh();
    }, [active, authenticated, refresh]);

    useEffect(() => {
        if (!active || !authenticated) return;
        const timer = window.setInterval(() => {
            Object.values(locksRef.current).forEach((lock) => {
                SendMessageComposer(new CatalogStudioRenewLockComposer(
                    nextCatalogStudioOperationId('renew-lock'), lock.draftVersionId, lock.entityType,
                    lock.catalogType, lock.entityId, lock.token
                ));
            });
        }, 30_000);
        return () => window.clearInterval(timer);
    }, [active, authenticated]);

    const acquireLock = useCallback((entityType: string, entityId: number, catalogType: 'NORMAL' | 'BUILDER' = 'NORMAL') => {
        const current = sessionRef.current;
        const key = lockKey(entityType, entityId, catalogType);
        if (!current || locksRef.current[key] || pendingLockKeysRef.current.has(key)) return;
        pendingLockKeysRef.current.add(key);
        setLoading(true);
        SendMessageComposer(new CatalogStudioAcquireLockComposer(nextCatalogStudioOperationId('acquire-lock'), current.draftVersionId, entityType, catalogType, entityId));
    }, []);

    const releaseLock = useCallback((entityType: string, entityId: number, catalogType: 'NORMAL' | 'BUILDER' = 'NORMAL') => {
        const lock = locksRef.current[lockKey(entityType, entityId, catalogType)];
        if (!lock) return;
        SendMessageComposer(new CatalogStudioReleaseLockComposer(
            nextCatalogStudioOperationId('release-lock'), lock.draftVersionId, lock.entityType, lock.catalogType, lock.entityId, lock.token
        ));
        setLocks((current) => {
            const next = { ...current };
            delete next[lockKey(entityType, entityId, catalogType)];
            locksRef.current = next;
            return next;
        });
    }, []);

    const loadHistory = useCallback((offset = 0, limit = 50) => {
        const current = sessionRef.current;
        if (!current) return;
        setLoading(true);
        SendMessageComposer(new CatalogStudioHistoryComposer(current.draftVersionId, offset, limit));
    }, []);

    const revisionAction = useCallback((action: 'validate' | 'publish') => {
        const current = sessionRef.current;
        if (!current) return;
        setLoading(true);
        const operationId = nextCatalogStudioOperationId(action);
        if (action === 'validate') SendMessageComposer(new CatalogStudioValidateComposer(operationId, current.draftVersionId, current.revision));
        if (action === 'publish') SendMessageComposer(new CatalogStudioPublishComposer(operationId, current.draftVersionId, current.revision));
    }, []);

    const undo = useCallback((groupId: number) => {
        const current = sessionRef.current;
        if (!current) return;
        setLoading(true);
        SendMessageComposer(new CatalogStudioUndoComposer(nextCatalogStudioOperationId('undo'), current.draftVersionId, current.revision, groupId));
    }, []);

    const exportDocument = useCallback((format: 'SQL') => {
        const current = sessionRef.current;
        if(!current) return;
        setLoading(true);
        SendMessageComposer(new CatalogStudioExportComposer(
            nextCatalogStudioOperationId('export'), current.draftVersionId, current.revision, format
        ));
    }, []);

    const dryRunDocument = useCallback((format: 'SQL', document: string) => {
        const current = sessionRef.current;
        if(!current) return;
        setLoading(true);
        SendMessageComposer(new CatalogStudioDocumentDryRunComposer(
            nextCatalogStudioOperationId('dry-run'), current.draftVersionId, current.revision, format, document
        ));
    }, []);

    const applyDocument = useCallback((format: 'SQL', document: string, fingerprint: string, summary: string) => {
        const current = sessionRef.current;
        if(!current) return;
        const rootLock = locksRef.current[lockKey('PAGE', CATALOG_ROOT_LOCK_ID)];
        if(!rootLock) {
            pendingDocumentApplyRef.current = { format, document, fingerprint, summary };
            setLastError(null);
            acquireLock('PAGE', CATALOG_ROOT_LOCK_ID);
            return;
        }
        setLoading(true);
        SendMessageComposer(new CatalogStudioDocumentApplyComposer(
            nextCatalogStudioOperationId('apply'), current.draftVersionId, current.revision, rootLock.token,
            format, document, fingerprint, summary
        ));
    }, [acquireLock]);

    const applyMutation = useCallback((mutation: CatalogStudioMutationResult) => {
        setSession(current => {
            if(!current) return current;
            const next = applyCatalogStudioMutation(current, mutation);
            sessionRef.current = next;
            return next;
        });
        if(!historyGroupIdsRef.current.has(mutation.historyGroup.id)) {
            historyGroupIdsRef.current.add(mutation.historyGroup.id);
            setHistory(current => [ mutation.historyGroup, ...current ].slice(0, 50));
            setHistoryTotalCount(current => current + 1);
        }
    }, []);

    const value = useMemo<CatalogStudioContextValue>(() => ({
        session,
        revision: session?.revision ?? 0,
        pendingCount: session?.pendingCount ?? 0,
        history,
        historyTotalCount,
        validation,
        documentResult,
        publishResult,
        locks,
        loading,
        lastError,
        refresh,
        acquireLock,
        releaseLock,
        loadHistory,
        undo,
        validate: () => revisionAction('validate'),
        publish: () => revisionAction('publish'),
        exportDocument,
        dryRunDocument,
        applyDocument,
        applyMutation
    }), [session, history, historyTotalCount, validation, documentResult, publishResult, locks, loading, lastError, refresh, acquireLock, releaseLock, loadHistory, undo, revisionAction, exportDocument, dryRunDocument, applyDocument, applyMutation]);

    return <CatalogStudioContext value={value}>{children}</CatalogStudioContext>;
};
