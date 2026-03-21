import { GroupFavoriteComposer, GroupUnfavoriteComposer, HabboGroupEntryData } from '@nitrots/communication';
import { SendMessageComposer } from '../nitro';

export const ToggleFavoriteGroup = (group: HabboGroupEntryData) =>
{
    SendMessageComposer(group.favourite ? new GroupUnfavoriteComposer(group.groupId) : new GroupFavoriteComposer(group.groupId));
};
