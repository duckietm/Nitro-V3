import { describe, expect, it } from 'vitest';
import { MessengerThreadChat } from './MessengerThreadChat';

describe('MessengerThreadChat.offlineDelivered', () =>
{
    it('is true for a CHAT message with extraData "offline"', () =>
    {
        const chat = new MessengerThreadChat(5, 'hello', 60, 'offline', MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(true);
    });

    it('is false for a normal CHAT message with no extraData', () =>
    {
        const chat = new MessengerThreadChat(5, 'hello', 0, null, MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(false);
    });

    it('is false when extraData is some other value (e.g. group chat data)', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, 'Bob/figurestr/5', MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(false);
    });

    it('is false for a non-CHAT type even if extraData is "offline"', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, 'offline', MessengerThreadChat.ROOM_INVITE);
        expect(chat.offlineDelivered).toBe(false);
    });
});

describe('MessengerThreadChat status', () =>
{
    it('defaults to SENT', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, null, MessengerThreadChat.CHAT);
        expect(chat.status).toBe(MessengerThreadChat.SENT);
    });

    it('can be set to READ', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, null, MessengerThreadChat.CHAT);
        chat.setStatus(MessengerThreadChat.READ);
        expect(chat.status).toBe(MessengerThreadChat.READ);
    });
});
