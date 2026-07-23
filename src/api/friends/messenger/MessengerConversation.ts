export interface MessengerConversation
{
    id: number;
    type: number;
    participantId: number;
    name: string;
    lastMessageId: number;
    unreadCount: number;
    updatedAt: number;
}

export interface MessengerHistoryState
{
    loading: boolean;
    loaded: boolean;
    hasMore: boolean;
    error: boolean;
}
