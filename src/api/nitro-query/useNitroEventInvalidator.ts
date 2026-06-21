import { IMessageEvent, MessageEvent } from '@nitrots/nitro-renderer';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useMessageEvent } from '../../hooks/events/useMessageEvent';

/**
 * Invalidate a TanStack query slot every time the renderer pushes the
 * matching parser event. Companion to useNitroQuery for the case where
 * the server can push fresh data unprompted (e.g. ClubGiftInfoEvent
 * fires both as the response to GetClubGiftInfo and again after the
 * user claims a gift via SelectClubGiftComposer).
 *
 * Usage:
 *
 *   const { data: clubGifts } = useNitroQuery({
 *       key: ['nitro', 'catalog', 'clubGifts'],
 *       request: () => new GetClubGiftInfo(),
 *       parser: ClubGiftInfoEvent,
 *       select: e => e.getParser(),
 *   });
 *
 *   // re-fetch on every server push:
 *   useNitroEventInvalidator(ClubGiftInfoEvent, ['nitro', 'catalog', 'clubGifts']);
 *
 * Optional `accept` predicate filters out events that don't belong to
 * this query slot — useful when the same parser is multiplexed across
 * multiple correlated queries (mirrors useNitroQuery.accept).
 *
 * Implementation: the renderer push triggers `queryClient.invalidateQueries`,
 * which marks the slot stale; the next subscriber render triggers a
 * fresh fetch via useNitroQuery's queryFn. If nobody is currently
 * subscribed, the invalidation is a no-op (TanStack drops stale entries
 * with no active observers per its garbage-collection policy).
 */
export const useNitroEventInvalidator = <T extends IMessageEvent>(eventType: typeof MessageEvent, queryKey: QueryKey, accept?: (event: T) => boolean) => {
    const queryClient = useQueryClient();

    useMessageEvent<T>(eventType, (event) => {
        if (accept && !accept(event)) return;

        queryClient.invalidateQueries({ queryKey });
    });
};
