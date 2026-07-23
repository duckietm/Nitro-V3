import { describe, expect, it } from 'vitest';
import { countFriendsByCategory, filterFriendsByCategory, withUpdatedFriendCategories } from './friendCategory.helpers';
import { MessengerFriend } from './MessengerFriend';
import { MessengerSettings } from './MessengerSettings';

const makeFriend = (id: number, categoryId: number): MessengerFriend => {
    const friend = new MessengerFriend();
    friend.id = id;
    friend.categoryId = categoryId;
    return friend;
};

describe('filterFriendsByCategory', () => {
    const friends = [makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5), makeFriend(4, 8)];

    it('returns all friends when categoryId is 0 (All)', () => {
        expect(filterFriendsByCategory(friends, 0)).toHaveLength(4);
    });

    it('returns only the friends in the given category', () => {
        expect(filterFriendsByCategory(friends, 5).map((f) => f.id)).toEqual([2, 3]);
    });

    it('returns an empty array for a category with no members', () => {
        expect(filterFriendsByCategory(friends, 99)).toEqual([]);
    });

    it('is null-safe', () => {
        expect(filterFriendsByCategory(null, 5)).toEqual([]);
    });
});

describe('countFriendsByCategory', () => {
    const friends = [makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5)];

    it('counts members per category id', () => {
        const counts = countFriendsByCategory(friends);
        expect(counts.get(0)).toBe(1);
        expect(counts.get(5)).toBe(2);
    });

    it('is null-safe', () => {
        expect(countFriendsByCategory(null).size).toBe(0);
    });
});

describe('withUpdatedFriendCategories', () => {
    it('preserves limits and replaces categories, including an empty server list', () => {
        const settings = new MessengerSettings(100, 200, 300, [ { id: 1, name: 'Old' } as any ]);
        const updated = withUpdatedFriendCategories(settings, [ { id: 2, name: 'New' } as any ]);
        const cleared = withUpdatedFriendCategories(updated, []);

        expect(updated).toMatchObject({ userFriendLimit: 100, normalFriendLimit: 200, extendedFriendLimit: 300 });
        expect(updated.categories.map(category => category.id)).toEqual([ 2 ]);
        expect(cleared.categories).toEqual([]);
    });
});
