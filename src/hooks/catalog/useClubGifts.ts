import { ClubGiftInfoEvent, ClubGiftInfoParser, GetClubGiftInfo } from '@nitrots/nitro-renderer';
import { UseQueryResult } from '@tanstack/react-query';
import { useNitroEventInvalidator, useNitroQuery } from '../../api/nitro-query';

const CLUB_GIFTS_KEY = ['nitro', 'catalog', 'clubGifts'] as const;

/**
 * Habbo Club gift availability (counts of pending gifts, days until
 * next gift, gift list). The server replies once to GetClubGiftInfo
 * and then pushes ClubGiftInfoEvent again every time the user claims
 * a gift via SelectClubGiftComposer — so the cache needs to be
 * invalidated on each push, not just hydrated by the first response.
 *
 * Pair the query with useNitroEventInvalidator so unsolicited pushes
 * mark the slot stale; the next render of any consumer triggers a
 * re-fetch (which, since the server just pushed, will resolve almost
 * immediately with the fresh data the server already sent us).
 *
 * Replaces the previous useCatalog listener that stuffed
 * `parser` into `catalogOptions.clubGifts`.
 */
export const useClubGifts = (options: { enabled?: boolean } = {}): UseQueryResult<ClubGiftInfoParser> => {
    const query = useNitroQuery<ClubGiftInfoEvent, ClubGiftInfoParser>({
        key: CLUB_GIFTS_KEY as unknown as string[],
        request: () => new GetClubGiftInfo(),
        parser: ClubGiftInfoEvent,
        select: (event) => event.getParser(),
        enabled: options.enabled,
        staleTime: Infinity
    });

    useNitroEventInvalidator<ClubGiftInfoEvent>(ClubGiftInfoEvent, CLUB_GIFTS_KEY as unknown as string[]);

    return query;
};
