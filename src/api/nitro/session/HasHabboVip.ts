import { GetSessionDataManager, HabboClubLevelEnum } from '@nitrots/session';

export function HasHabboVip(): boolean
{
    return (GetSessionDataManager().clubLevel >= HabboClubLevelEnum.VIP);
}
