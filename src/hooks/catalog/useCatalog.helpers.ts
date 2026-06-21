import { NodeData, RoomControllerLevel, RoomObjectCategory, RoomObjectType } from '@nitrots/nitro-renderer';
import { BuilderFurniPlaceableStatus, CatalogNode, CatalogType, ICatalogNode, IPurchasableOffer } from '../../api';

/**
 * Pure helpers extracted from `useCatalog.ts`. Each function takes the
 * relevant pieces of state as inputs (instead of closing over them via
 * useCallback) so it can be unit-tested without rendering a React tree.
 *
 * Keep these dependency-free at the React layer: no `useState`, no
 * refs, no `vi.fn`-able side effects beyond what the renderer SDK
 * already exposes (`GetRoomEngine`, etc., which the call sites guard).
 */

/**
 * The catalog has two top-level "types" — the regular catalog and the
 * Builders Club catalog. Anything else maps to NORMAL. Centralising
 * the coercion in one place keeps the switch from drifting between
 * call sites and the message-event handlers.
 */
export const normalizeCatalogType = (type?: string): string => {
    if (type === CatalogType.BUILDER) return CatalogType.BUILDER;

    return CatalogType.NORMAL;
};

/**
 * Build the canonical product-key list for a purchasable offer. Used
 * by the resolved-offer cache so the same offer can be looked up by
 * either `productType:id:classId` or `productType:class:className`.
 */
export const getOfferProductKeys = (offer: IPurchasableOffer | null | undefined): string[] => {
    const keys: string[] = [];
    const product = offer?.product;

    if (!product) return keys;

    if (product.productType && product.productClassId >= 0) {
        keys.push(`${product.productType}:id:${product.productClassId}`);
    }

    if (product.productType && product.furnitureData?.className?.length) {
        keys.push(`${product.productType}:class:${product.furnitureData.className}`);
    }

    return keys;
};

/**
 * Depth-first search by pageId. The root is excluded so callers never
 * select the synthetic "root" node by mistake. Recursive but bounded
 * by the tree the server sends (typically 3-4 levels deep).
 */
export const findNodeById = (id: number, node: ICatalogNode | null, rootNode: ICatalogNode | null): ICatalogNode | null => {
    if (!node) return null;
    if (node.pageId === id && node !== rootNode) return node;

    for (const child of node.children) {
        const found = findNodeById(id, child, rootNode);

        if (found) return found;
    }

    return null;
};

/**
 * Depth-first search by pageName. Same exclusion of the root as
 * `findNodeById`.
 */
export const findNodeByName = (name: string, node: ICatalogNode | null, rootNode: ICatalogNode | null): ICatalogNode | null => {
    if (!node) return null;
    if (node.pageName === name && node !== rootNode) return node;

    for (const child of node.children) {
        const found = findNodeByName(name, child, rootNode);

        if (found) return found;
    }

    return null;
};

/**
 * Lookup the list of catalog nodes a given offer appears under. When
 * `onlyVisible` is true the helper falls back to the full list if the
 * filtered subset is empty — matches the original behavior in
 * `getNodesByOfferId(offerId, true)`.
 */
export const getNodesByOfferIdFromMap = (
    offerId: number,
    offersToNodes: Map<number, ICatalogNode[]> | null | undefined,
    onlyVisible: boolean = false
): ICatalogNode[] | null => {
    if (!offersToNodes || !offersToNodes.size) return null;

    if (onlyVisible) {
        const offers = offersToNodes.get(offerId);
        const visible: ICatalogNode[] = [];

        if (offers && offers.length) {
            for (const offer of offers) {
                if (offer.isVisible) visible.push(offer);
            }
        }

        if (visible.length) return visible;
    }

    return offersToNodes.get(offerId) ?? null;
};

/**
 * Turn the server-side NodeData tree into a CatalogNode tree paired
 * with an offerId → nodes index map. Pure (besides the `new
 * CatalogNode` construction).
 *
 * Original lived inline inside the `CatalogPagesListEvent` handler;
 * extracted so the reducer is testable without rendering the hook.
 */
export const buildCatalogNodeTree = (root: NodeData): { rootNode: ICatalogNode; offersToNodes: Map<number, ICatalogNode[]> } => {
    const offersToNodes: Map<number, ICatalogNode[]> = new Map();

    const walk = (node: NodeData, depth: number, parent: ICatalogNode | null): ICatalogNode => {
        const catalogNode = new CatalogNode(node, depth, parent) as ICatalogNode;

        for (const offerId of catalogNode.offerIds) {
            const existing = offersToNodes.get(offerId);

            if (existing) existing.push(catalogNode);
            else offersToNodes.set(offerId, [catalogNode]);
        }

        for (const child of node.children) catalogNode.addChild(walk(child, depth + 1, catalogNode));

        return catalogNode;
    };

    return { rootNode: walk(root, 0, null), offersToNodes };
};

/**
 * Pure-input version of the placement-status decision. The original
 * `getBuilderFurniPlaceableStatus` closes over a handful of state
 * slices + reads `GetRoomSession()` / `GetRoomEngine()` /
 * `GetSessionDataManager()` directly. Pulling those reads up to the
 * call site (the hook still does them) makes the rest of the
 * decision tree testable in isolation.
 *
 * `roomSession` may be null (user is in the hotel view, not a room).
 * `usersInRoomMinusSelf` is the number of non-moderator, non-self
 * users sharing the room — only consulted when `secondsLeft <= 0`,
 * because the limit-reached / not-in-room paths short-circuit first.
 */
export interface BuilderPlacementStatusInput {
    offer: IPurchasableOffer | null | undefined;
    roomSession: { isGuildRoom: boolean; isRoomOwner: boolean; controllerLevel: number } | null;
    secondsLeft: number;
    furniCount: number;
    furniLimit: number;
    builderPlacementAllowedInCurrentRoom: boolean;
    builderPlacementBlockedByVisitors: boolean;
    /** Count of non-moderator, non-self users in the room. Only consulted when `secondsLeft <= 0`. */
    visitorCount?: number;
}

export const resolveBuilderFurniPlaceableStatus = (input: BuilderPlacementStatusInput): BuilderFurniPlaceableStatus => {
    const {
        offer,
        roomSession,
        secondsLeft,
        furniCount,
        furniLimit,
        builderPlacementAllowedInCurrentRoom,
        builderPlacementBlockedByVisitors,
        visitorCount = 0
    } = input;

    if (!offer) return BuilderFurniPlaceableStatus.MISSING_OFFER;

    if (!roomSession) return BuilderFurniPlaceableStatus.NOT_IN_ROOM;

    const canUseGuildAdminFallback = roomSession.isGuildRoom && roomSession.controllerLevel >= RoomControllerLevel.GUILD_ADMIN && secondsLeft > 0;

    const usesSharedPlacementPool = !roomSession.isRoomOwner && (builderPlacementAllowedInCurrentRoom || canUseGuildAdminFallback);

    if (!roomSession.isRoomOwner && !builderPlacementAllowedInCurrentRoom && !canUseGuildAdminFallback) {
        return BuilderFurniPlaceableStatus.NOT_GROUP_ADMIN;
    }

    if (!usesSharedPlacementPool && (furniCount < 0 || furniCount >= furniLimit)) {
        return BuilderFurniPlaceableStatus.FURNI_LIMIT_REACHED;
    }

    if (secondsLeft <= 0 && builderPlacementBlockedByVisitors) {
        return BuilderFurniPlaceableStatus.VISITORS_IN_ROOM;
    }

    if (secondsLeft <= 0 && visitorCount > 0) {
        return BuilderFurniPlaceableStatus.VISITORS_IN_ROOM;
    }

    return BuilderFurniPlaceableStatus.OKAY;
};

// Re-exports for the legacy categories so the call site in useCatalog
// doesn't need to know whether the constant comes from the renderer
// SDK enum or our own copy.
export { RoomControllerLevel, RoomObjectCategory, RoomObjectType };
