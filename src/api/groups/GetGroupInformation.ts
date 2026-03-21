import { GroupInformationComposer } from '@nitrots/communication';
import { SendMessageComposer } from '../nitro';

export function GetGroupInformation(groupId: number): void
{
    SendMessageComposer(new GroupInformationComposer(groupId, true));
}
