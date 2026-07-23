import { MessengerConversation } from '../../../../api';

export const filterMessengerConversations = (conversations: MessengerConversation[], query: string) =>
{
    const normalized = query.trim().toLocaleLowerCase();
    return [ ...conversations ]
        .filter(conversation => !normalized || conversation.name.toLocaleLowerCase().includes(normalized))
        .sort((left, right) => right.updatedAt - left.updatedAt);
};

export const canFollowMessengerConversation = (conversation: MessengerConversation) =>
    conversation.participantId > 0 && conversation.name.trim().toLocaleLowerCase() !== 'staff chat';

export const resolveConversationAfterClose = (conversations: MessengerConversation[], hiddenIds: number[], closedId: number) =>
{
    const closedIndex = conversations.findIndex(conversation => conversation.id === closedId);
    const isVisible = (conversation: MessengerConversation) => conversation.id !== closedId && hiddenIds.indexOf(conversation.id) === -1;

    if(closedIndex >= 0)
    {
        const next = conversations.slice(closedIndex + 1).find(isVisible);
        if(next) return next.id;
    }

    return conversations.find(isVisible)?.id || 0;
};

export const restoreConversationsWithNewMessages = (hiddenIds: number[], previous: MessengerConversation[], current: MessengerConversation[]) =>
    hiddenIds.filter(id =>
    {
        const before = previous.find(conversation => conversation.id === id);
        const after = current.find(conversation => conversation.id === id);
        if(!before || !after) return true;
        return after.lastMessageId <= before.lastMessageId && after.unreadCount <= before.unreadCount;
    });
