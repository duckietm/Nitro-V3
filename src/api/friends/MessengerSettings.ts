import { FriendCategoryData } from '@nitrots/communication';

export class MessengerSettings
{
    constructor(
        public userFriendLimit: number = 0,
        public normalFriendLimit: number = 0,
        public extendedFriendLimit: number = 0,
        public categories: FriendCategoryData[] = [])
    {}
}
