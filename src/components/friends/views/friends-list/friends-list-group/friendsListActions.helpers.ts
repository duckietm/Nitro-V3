import { MessengerFriend } from '../../../../../api';

export const canFollowFriendListEntry = (friend: Pick<MessengerFriend, 'id' | 'name' | 'online'>) =>
    friend.online && friend.id > 0 && (friend.name || '').trim().toLocaleLowerCase() !== 'staff chat';
