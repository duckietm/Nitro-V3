import { MessengerConversation, MessengerHistoryState } from './MessengerConversation';
import { MessengerMessage } from './MessengerMessage';

export interface MessengerState
{
    selectedConversationId: number;
    conversationIds: number[];
    conversationsById: Record<number, MessengerConversation>;
    messagesByKey: Record<string, MessengerMessage>;
    messageKeysByConversation: Record<number, string[]>;
    historyByConversation: Record<number, MessengerHistoryState>;
}

export const initialMessengerState: MessengerState = {
    selectedConversationId: 0, conversationIds: [], conversationsById: {}, messagesByKey: {}, messageKeysByConversation: {}, historyByConversation: {}
};

export type MessengerAction =
    | { type: 'summariesLoaded'; conversations: MessengerConversation[] }
    | { type: 'directConversationOpened'; participantId: number; name: string }
    | { type: 'historyLoading'; conversationId: number }
    | { type: 'historyLoaded'; conversationId: number; messages: MessengerMessage[]; hasMore: boolean }
    | { type: 'historyFailed'; conversationId: number }
    | { type: 'messageOptimistic'; message: MessengerMessage }
    | { type: 'messageAcknowledged'; clientId: string; messageId: number; conversationId: number; createdAt: number }
    | { type: 'messageFailed'; clientId: string; errorCode: number }
    | { type: 'messageReceived'; message: MessengerMessage }
    | { type: 'readCursorAdvanced'; conversationId: number; readerId: number; messageId: number; ownUserId: number };

const keyFor = (message: MessengerMessage) => message.id > 0 ? `server:${ message.id }` : `client:${ message.clientId }`;
const isStaffChat = (conversation: MessengerConversation) => conversation.name.trim().toLocaleLowerCase() === 'staff chat';

const insertMessage = (state: MessengerState, message: MessengerMessage): MessengerState =>
{
    const key = keyFor(message);
    const currentKeys = state.messageKeysByConversation[message.conversationId] || [];
    if(state.messagesByKey[key]) return state;

    const keys = [ ...currentKeys, key ].sort((a, b) =>
    {
        const left = a === key ? message : state.messagesByKey[a];
        const right = b === key ? message : state.messagesByKey[b];
        return (left.createdAt - right.createdAt) || (left.id - right.id);
    });

    return {
        ...state,
        messagesByKey: { ...state.messagesByKey, [key]: message },
        messageKeysByConversation: { ...state.messageKeysByConversation, [message.conversationId]: keys }
    };
};

export const messengerReducer = (state: MessengerState, action: MessengerAction): MessengerState =>
{
    switch(action.type)
    {
        case 'directConversationOpened':
        {
            if(action.participantId === -1 || action.name.trim().toLocaleLowerCase() === 'staff chat')
            {
                const staffChat = state.conversationIds.map(id => state.conversationsById[id]).find(conversation => conversation.type === 1 && isStaffChat(conversation));
                return staffChat ? { ...state, selectedConversationId: staffChat.id } : state;
            }
            const existing = state.conversationIds.map(id => state.conversationsById[id]).find(conversation => conversation.type === 0 && conversation.participantId === action.participantId);
            if(existing) return { ...state, selectedConversationId: existing.id };
            const draftId = -action.participantId;
            const draft: MessengerConversation = { id: draftId, type: 0, participantId: action.participantId, name: action.name, lastMessageId: 0, unreadCount: 0, updatedAt: Math.floor(Date.now() / 1000) };
            return {
                ...state,
                selectedConversationId: draftId,
                conversationIds: [ draftId, ...state.conversationIds ],
                conversationsById: { ...state.conversationsById, [draftId]: draft }
            };
        }
        case 'summariesLoaded':
        {
            const serverConversations = action.conversations.reduce<MessengerConversation[]>((result, conversation) =>
            {
                if(!isStaffChat(conversation)) return [ ...result, conversation ];
                const duplicateIndex = result.findIndex(isStaffChat);
                if(duplicateIndex === -1) return [ ...result, conversation ];
                if(result[duplicateIndex].updatedAt >= conversation.updatedAt) return result;
                const next = [ ...result ];
                next[duplicateIndex] = conversation;
                return next;
            }, []);
            const serverIds = serverConversations.map(item => item.id);
            const preservedIds = state.conversationIds.filter(id =>
            {
                if(serverIds.indexOf(id) !== -1) return false;
                const existing = state.conversationsById[id];
                return !existing || !isStaffChat(existing) || !serverConversations.some(isStaffChat);
            });

            return {
                ...state,
                conversationIds: [ ...serverIds, ...preservedIds ],
                conversationsById: {
                    ...state.conversationsById,
                    ...Object.fromEntries(serverConversations.map(item => [ item.id, item ]))
                }
            };
        }
        case 'historyLoading':
            return { ...state, historyByConversation: { ...state.historyByConversation, [action.conversationId]: { ...(state.historyByConversation[action.conversationId] || { loaded: false, hasMore: true }), loading: true, error: false } } };
        case 'historyLoaded':
        {
            let next = state;
            action.messages.forEach(message => { next = insertMessage(next, message); });
            return { ...next, historyByConversation: { ...next.historyByConversation, [action.conversationId]: { loading: false, loaded: true, hasMore: action.hasMore, error: false } } };
        }
        case 'historyFailed':
            return { ...state, historyByConversation: { ...state.historyByConversation, [action.conversationId]: { ...(state.historyByConversation[action.conversationId] || { loaded: false, hasMore: true }), loading: false, error: true } } };
        case 'messageOptimistic':
            return insertMessage(state, action.message);
        case 'messageReceived':
        {
            if(state.messagesByKey[keyFor(action.message)]) return state;
            const next = insertMessage(state, action.message);
            const conversation = next.conversationsById[action.message.conversationId];
            if(!conversation) return next;
            return {
                ...next,
                conversationsById: {
                    ...next.conversationsById,
                    [conversation.id]: {
                        ...conversation,
                        lastMessageId: action.message.id,
                        unreadCount: conversation.unreadCount + 1,
                        updatedAt: action.message.createdAt
                    }
                }
            };
        }
        case 'messageAcknowledged':
        {
            const oldKey = `client:${ action.clientId }`;
            const pending = state.messagesByKey[oldKey];
            if(!pending) return state;
            const newKey = `server:${ action.messageId }`;
            const acknowledged = { ...pending, id: action.messageId, conversationId: action.conversationId, createdAt: action.createdAt, status: 'sent' as const };
            const messagesByKey = { ...state.messagesByKey };
            delete messagesByKey[oldKey];
            messagesByKey[newKey] = acknowledged;
            const keys = (state.messageKeysByConversation[pending.conversationId] || []).map(key => key === oldKey ? newKey : key);
            if(pending.conversationId === action.conversationId) return { ...state, messagesByKey, messageKeysByConversation: { ...state.messageKeysByConversation, [pending.conversationId]: keys } };

            const draft = state.conversationsById[pending.conversationId];
            const conversationsById = { ...state.conversationsById };
            delete conversationsById[pending.conversationId];
            if(draft) conversationsById[action.conversationId] = { ...draft, id: action.conversationId, lastMessageId: action.messageId, updatedAt: action.createdAt };
            const messageKeysByConversation = { ...state.messageKeysByConversation };
            delete messageKeysByConversation[pending.conversationId];
            messageKeysByConversation[action.conversationId] = keys;
            return {
                ...state,
                selectedConversationId: state.selectedConversationId === pending.conversationId ? action.conversationId : state.selectedConversationId,
                conversationIds: state.conversationIds.map(id => id === pending.conversationId ? action.conversationId : id),
                conversationsById,
                messagesByKey,
                messageKeysByConversation
            };
        }
        case 'messageFailed':
        {
            const key = `client:${ action.clientId }`;
            const message = state.messagesByKey[key];
            if(!message) return state;
            return { ...state, messagesByKey: { ...state.messagesByKey, [key]: { ...message, status: 'failed', errorCode: action.errorCode } } };
        }
        case 'readCursorAdvanced':
        {
            const messagesByKey = { ...state.messagesByKey };
            (state.messageKeysByConversation[action.conversationId] || []).forEach(key =>
            {
                const message = messagesByKey[key];
                if(message.senderId === action.ownUserId && message.id > 0 && message.id <= action.messageId) messagesByKey[key] = { ...message, status: 'read' };
            });
            const conversation = state.conversationsById[action.conversationId];
            const conversationsById = action.readerId === action.ownUserId && conversation
                ? { ...state.conversationsById, [conversation.id]: { ...conversation, unreadCount: 0 } }
                : state.conversationsById;
            return { ...state, messagesByKey, conversationsById };
        }
        default:
            return state;
    }
};
