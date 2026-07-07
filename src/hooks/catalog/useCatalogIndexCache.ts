import { NodeData } from '@nitrots/nitro-renderer';
import { normalizeCatalogType } from './useCatalog.helpers';

const CACHE_VERSION = 1;
const CACHE_KEY_PREFIX = 'nitro-catalog-index';

export type CatalogIndexNodeSnapshot = {
    visible: boolean;
    icon: number;
    pageId: number;
    parentId: number;
    pageName: string;
    localization: string;
    offerIds: number[];
    children: CatalogIndexNodeSnapshot[];
};

type CatalogIndexCachePayload = {
    version: number;
    catalogType: string;
    savedAt: number;
    root: CatalogIndexNodeSnapshot;
};

const cacheKey = (catalogType: string) => `${CACHE_KEY_PREFIX}:v${CACHE_VERSION}:${normalizeCatalogType(catalogType)}`;

export const snapshotCatalogIndexNode = (node: NodeData): CatalogIndexNodeSnapshot => ({
    visible: node.visible,
    icon: node.icon,
    pageId: node.pageId,
    parentId: node.parentId,
    pageName: node.pageName,
    localization: node.localization,
    offerIds: [...node.offerIds],
    children: node.children.map(snapshotCatalogIndexNode)
});

/** Plain tree shape consumed by `buildCatalogNodeTree` / `CatalogNode`. */
export const catalogIndexRootFromSnapshot = (root: CatalogIndexNodeSnapshot): NodeData => root as unknown as NodeData;

const isValidSnapshot = (value: unknown): value is CatalogIndexNodeSnapshot => {
    if (!value || typeof value !== 'object') return false;

    const node = value as CatalogIndexNodeSnapshot;

    return (
        typeof node.pageName === 'string' &&
        typeof node.localization === 'string' &&
        Array.isArray(node.children) &&
        Array.isArray(node.offerIds)
    );
};

export const readCatalogIndexCache = (catalogType: string): CatalogIndexNodeSnapshot | null => {
    if (typeof sessionStorage === 'undefined') return null;

    try {
        const raw = sessionStorage.getItem(cacheKey(catalogType));

        if (!raw) return null;

        const payload = JSON.parse(raw) as CatalogIndexCachePayload;

        if (payload.version !== CACHE_VERSION) return null;
        if (normalizeCatalogType(payload.catalogType) !== normalizeCatalogType(catalogType)) return null;
        if (!isValidSnapshot(payload.root)) return null;

        return payload.root;
    } catch {
        return null;
    }
};

export const writeCatalogIndexCache = (catalogType: string, root: NodeData): void => {
    if (typeof sessionStorage === 'undefined' || !root) return;

    try {
        const payload: CatalogIndexCachePayload = {
            version: CACHE_VERSION,
            catalogType: normalizeCatalogType(catalogType),
            savedAt: Date.now(),
            root: snapshotCatalogIndexNode(root)
        };

        sessionStorage.setItem(cacheKey(catalogType), JSON.stringify(payload));
    } catch {
        // QuotaExceededError on very large trees — ignore, network path still works.
    }
};

export const clearCatalogIndexCache = (): void => {
    if (typeof sessionStorage === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);

        if (key?.startsWith(CACHE_KEY_PREFIX)) keysToRemove.push(key);
    }

    for (const key of keysToRemove) sessionStorage.removeItem(key);
};
