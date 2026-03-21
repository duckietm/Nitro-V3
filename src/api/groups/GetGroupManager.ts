import { CreateLinkEvent } from '@nitrots/utils';

export function GetGroupManager(groupId: number): void
{
    CreateLinkEvent(`groups/manage/${ groupId }`);
}
