import { describe, expect, it } from 'vitest';
import { MessengerFriend } from './MessengerFriend';
import { MessengerThread } from './MessengerThread';
import { MessengerThreadChat } from './MessengerThreadChat';

const makeThread = (participantId: number): MessengerThread => {
    const friend = new MessengerFriend();
    friend.id = participantId;
    return new MessengerThread(friend);
};

describe('MessengerThread.setMessagesReadFromUser', () => {
    it("marks only the given user's messages as READ", () => {
        const thread = makeThread(7);
        const mine = thread.addMessage(100, 'a', 0, null, MessengerThreadChat.CHAT);
        const theirs = thread.addMessage(7, 'b', 0, null, MessengerThreadChat.CHAT);

        thread.setMessagesReadFromUser(100);

        expect(mine.status).toBe(MessengerThreadChat.READ);
        expect(theirs.status).toBe(MessengerThreadChat.SENT);
    });
});
