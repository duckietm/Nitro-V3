import { GroupBadgePart } from './GroupBadgePart';

export interface IGroupData {
    groupId: number;
    groupName: string;
    groupDescription: string;
    groupHomeroomId: number;
    groupState: number;
    groupCanMembersDecorate: boolean;
    groupHasForum: boolean;
    groupColors: number[];
    groupBadgeParts: GroupBadgePart[];
}
