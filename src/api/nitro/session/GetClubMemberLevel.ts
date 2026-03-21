import { GetSessionDataManager, HabboClubLevelEnum } from '@nitrots/session';
import { GetConfigurationValue } from '../GetConfigurationValue';

export function GetClubMemberLevel(): number
{
    if(GetConfigurationValue<boolean>('hc.disabled', false)) return HabboClubLevelEnum.VIP;

    return GetSessionDataManager().clubLevel;
}
