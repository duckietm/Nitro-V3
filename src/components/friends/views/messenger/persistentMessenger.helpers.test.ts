import { describe, expect, it } from 'vitest';
import { canFollowMessengerConversation, filterMessengerConversations, resolveConversationAfterClose, restoreConversationsWithNewMessages } from './persistentMessenger.helpers';

const conversations = [
    { id: 1, type: 0, participantId: 7, name: 'Alex', lastMessageId: 4, unreadCount: 0, updatedAt: 10 },
    { id: 2, type: 1, participantId: 0, name: 'Wired Lab', lastMessageId: 8, unreadCount: 3, updatedAt: 20 }
];

describe('filterMessengerConversations', () =>
{
    it('filters names case-insensitively and preserves activity order', () =>
    {
        expect(filterMessengerConversations(conversations, 'wired').map(item => item.id)).toEqual([ 2 ]);
        expect(filterMessengerConversations(conversations, '').map(item => item.id)).toEqual([ 2, 1 ]);
    });
});

describe('canFollowMessengerConversation', () =>
{
    it('hides Follow for Staff Chat and keeps it for ordinary direct chats', () =>
    {
        expect(canFollowMessengerConversation(conversations[0])).toBe(true);
        expect(canFollowMessengerConversation({ ...conversations[0], participantId: -1, name: 'Staff Chat' })).toBe(false);
        expect(canFollowMessengerConversation({ ...conversations[0], name: 'staff chat' })).toBe(false);
    });
});

describe('resolveConversationAfterClose', () =>
{
    it('selects the next visible conversation and falls back to an earlier one', () =>
    {
        expect(resolveConversationAfterClose(conversations, [], 1)).toBe(2);
        expect(resolveConversationAfterClose(conversations, [ 2 ], 1)).toBe(0);
        expect(resolveConversationAfterClose(conversations, [], 2)).toBe(1);
    });
});

describe('restoreConversationsWithNewMessages', () =>
{
    it('restores hidden conversations when their message or unread cursor advances', () =>
    {
        const previous = conversations.map(item => ({ ...item }));
        const current = conversations.map(item => item.id === 1 ? { ...item, lastMessageId: 5 } : { ...item, unreadCount: 4 });

        expect(restoreConversationsWithNewMessages([ 1, 2 ], previous, current)).toEqual([]);
        expect(restoreConversationsWithNewMessages([ 1, 2 ], previous, previous)).toEqual([ 1, 2 ]);
    });
});
