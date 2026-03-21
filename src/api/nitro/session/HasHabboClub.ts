import { GetSessionDataManager, HabboClubLevelEnum } from '@nitrots/session';

export function HasHabboClub(): boolean
{
    return (GetSessionDataManager().clubLevel >= HabboClubLevelEnum.CLUB);
}
