import { describe, expect, it } from 'vitest';
import { canFollowFriendListEntry } from './friendsListActions.helpers';

describe('canFollowFriendListEntry', () =>
{
    it('hides Follow for Staff Chat regardless of its synthetic id', () =>
    {
        expect(canFollowFriendListEntry({ id: -1, name: 'Staff Chat', online: true })).toBe(false);
        expect(canFollowFriendListEntry({ id: 42, name: ' staff chat ', online: true })).toBe(false);
    });

    it('shows Follow only for ordinary online friends', () =>
    {
        expect(canFollowFriendListEntry({ id: 7, name: 'tester1', online: true })).toBe(true);
        expect(canFollowFriendListEntry({ id: 7, name: 'tester1', online: false })).toBe(false);
    });
});
