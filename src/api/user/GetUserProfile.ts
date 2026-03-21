import { UserProfileComposer } from '@nitrots/communication';
import { SendMessageComposer } from '../nitro';

export function GetUserProfile(userId: number): void
{
    SendMessageComposer(new UserProfileComposer(userId));
}
