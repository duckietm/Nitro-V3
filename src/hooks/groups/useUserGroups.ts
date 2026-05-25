import { CatalogGroupsComposer, GuildMembershipsMessageEvent, HabboGroupEntryData } from '@nitrots/nitro-renderer';
import { UseQueryResult } from '@tanstack/react-query';
import { useNitroQuery } from '../../api/nitro-query';

/**
 * The list of guilds the current Habbo belongs to, as returned by
 * the `CatalogGroupsComposer` → `GuildMembershipsMessageEvent`
 * request/response pair.
 *
 * Cached at session level: the membership list is stable for the
 * session unless the user joins/leaves a guild (in which case the
 * relevant flow should invalidate the `['nitro', 'user', 'groups']`
 * query key, which today nobody does — re-mounting the consumer
 * refetches via React Query's default behavior).
 *
 * Replaces three duplicate request+listener pairs that previously
 * each issued their own CatalogGroupsComposer:
 *   - useCatalog (catalogOptions.groups)
 *   - WiredSelectorUsersGroupView
 *   - WiredConditionActorIsGroupMemberView
 */
export const useUserGroups = (
    options: { enabled?: boolean } = {}
): UseQueryResult<HabboGroupEntryData[]> =>
    useNitroQuery<GuildMembershipsMessageEvent, HabboGroupEntryData[]>({
        key: [ 'nitro', 'user', 'groups' ],
        request: () => new CatalogGroupsComposer(),
        parser: GuildMembershipsMessageEvent,
        select: event => (event.getParser().groups || []),
        enabled: options.enabled,
        staleTime: Infinity
    });
