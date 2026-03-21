import { CreateLinkEvent } from '@nitrots/utils';

export function GetGroupMembers(groupId: number, levelId?: number): void
{
    if(!levelId) CreateLinkEvent(`group-members/${ groupId }`);
    else CreateLinkEvent(`group-members/${ groupId }/${ levelId }`);
}
