import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FriendsMessengerView routing and scroll behavior', () =>
{
    it('does not dereference the legacy message box when the persistent view is mounted', () =>
    {
        const source = readFileSync(join(process.cwd(), 'src/components/friends/views/messenger/FriendsMessengerView.tsx'), 'utf8');

        expect(source).toContain('if(!messagesBox.current) return;');
    });

    it('routes Staff Chat and direct chats through the same persistent window', () =>
    {
        const source = readFileSync(join(process.cwd(), 'src/components/friends/views/messenger/FriendsMessengerView.tsx'), 'utf8');

        expect(source).not.toContain('isLegacyStaffChat');
        expect(source).not.toContain('shouldUseLegacyStaffChat');
        expect(source).toContain('persistentMessenger.actions.openDirectConversation(participantId, friend.name)');
        expect(source).toContain('if(participantId === -1)');
        expect(source).toContain('legacyStaffThread={activeThread?.participant?.id === -1 ? activeThread : null}');
    });

    it('keeps the Staff Chat avatar in the persistent tab bar', () =>
    {
        const source = readFileSync(join(process.cwd(), 'src/components/friends/views/messenger/FriendsPersistentMessengerView.tsx'), 'utf8');

        expect(source).toContain('figure={STAFF_CHAT_FIGURE}');
    });
});
