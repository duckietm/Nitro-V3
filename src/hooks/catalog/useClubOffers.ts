import { ClubOfferData, GetClubOffersMessageComposer, HabboClubOffersMessageEvent } from '@nitrots/nitro-renderer';
import { UseQueryResult } from '@tanstack/react-query';
import { useNitroQuery } from '../../api/nitro-query';

/**
 * Habbo Club offer list keyed by Catalog `windowId`. windowId 1 is the
 * VIP buy page; 2 / 3 are the Builders Club / Builders Club Addons
 * pages. Each catalog layout asks the server for its own slice via
 * GetClubOffersMessageComposer(windowId) — the server replies with a
 * HabboClubOffersMessageEvent carrying parser.windowId + parser.offers.
 *
 * Wrapped as a TanStack query so multiple consumers reading the same
 * windowId share one request, and reopening the page within the
 * session-stable cache window doesn't re-fetch.
 *
 * The accept() predicate filters out responses tagged with a different
 * windowId — the renderer multiplexes the same event for every page,
 * so without the filter a slow VIP response would land in a Builders
 * Club query.
 */
export const useClubOffers = (
    windowId: number,
    options: { enabled?: boolean } = {}
): UseQueryResult<ClubOfferData[]> =>
    useNitroQuery<HabboClubOffersMessageEvent, ClubOfferData[]>({
        key: [ 'nitro', 'catalog', 'clubOffers', windowId ],
        request: () => new GetClubOffersMessageComposer(windowId),
        parser: HabboClubOffersMessageEvent,
        accept: event => (event.getParser().windowId === windowId),
        select: event => (event.getParser().offers || []),
        enabled: options.enabled,
        staleTime: Infinity
    });
