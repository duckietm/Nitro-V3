import { describe, expect, it, beforeEach } from 'vitest';
import { addMention, setMentions, markAllRead, markRead, getMentionsSnapshot, getUnreadCount, resetMentions } from '../mentionsStore';
import { IMentionEntry } from '../../../api/mentions';

const make = (id: number, read = false): IMentionEntry => ({
    mentionId: id, senderId: 1, senderUsername: 'Bob', roomId: 9, roomName: 'R',
    message: '@me hi', mentionType: 0, timestamp: 0, read
});

describe('mentionsStore', () =>
{
    beforeEach(() => resetMentions());

    it('adds newest-first and counts unread', () =>
    {
        addMention(make(1));
        addMention(make(2));
        expect(getMentionsSnapshot()[0].mentionId).toBe(2);
        expect(getUnreadCount()).toBe(2);
    });

    it('setMentions replaces and recomputes unread', () =>
    {
        setMentions([make(1, true), make(2, false)]);
        expect(getMentionsSnapshot()).toHaveLength(2);
        expect(getUnreadCount()).toBe(1);
    });

    it('markAllRead zeroes unread', () =>
    {
        setMentions([make(1), make(2)]);
        markAllRead();
        expect(getUnreadCount()).toBe(0);
    });

    it('markRead clears a single entry', () =>
    {
        setMentions([make(1), make(2)]);
        markRead(1);
        expect(getUnreadCount()).toBe(1);
        expect(getMentionsSnapshot().find(m => m.mentionId === 1)!.read).toBe(true);
    });
});
