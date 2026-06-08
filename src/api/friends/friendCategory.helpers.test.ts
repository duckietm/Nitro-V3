import { describe, expect, it } from 'vitest';
import { MessengerFriend } from './MessengerFriend';
import { countFriendsByCategory, filterFriendsByCategory } from './friendCategory.helpers';

const makeFriend = (id: number, categoryId: number): MessengerFriend =>
{
    const friend = new MessengerFriend();
    friend.id = id;
    friend.categoryId = categoryId;
    return friend;
};

describe('filterFriendsByCategory', () =>
{
    const friends = [ makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5), makeFriend(4, 8) ];

    it('returns all friends when categoryId is 0 (All)', () =>
    {
        expect(filterFriendsByCategory(friends, 0)).toHaveLength(4);
    });

    it('returns only the friends in the given category', () =>
    {
        expect(filterFriendsByCategory(friends, 5).map(f => f.id)).toEqual([ 2, 3 ]);
    });

    it('returns an empty array for a category with no members', () =>
    {
        expect(filterFriendsByCategory(friends, 99)).toEqual([]);
    });

    it('is null-safe', () =>
    {
        expect(filterFriendsByCategory(null, 5)).toEqual([]);
    });
});

describe('countFriendsByCategory', () =>
{
    const friends = [ makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5) ];

    it('counts members per category id', () =>
    {
        const counts = countFriendsByCategory(friends);
        expect(counts.get(0)).toBe(1);
        expect(counts.get(5)).toBe(2);
    });

    it('is null-safe', () =>
    {
        expect(countFriendsByCategory(null).size).toBe(0);
    });
});
