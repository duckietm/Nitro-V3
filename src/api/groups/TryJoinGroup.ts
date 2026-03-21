import { GroupJoinComposer } from '@nitrots/communication';
import { SendMessageComposer } from '../nitro';

export const TryJoinGroup = (groupId: number) => SendMessageComposer(new GroupJoinComposer(groupId));
