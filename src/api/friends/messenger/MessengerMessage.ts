export type MessengerMessageStatus = 'sending' | 'sent' | 'read' | 'failed';

export interface MessengerMessage
{
    id: number;
    clientId: string | null;
    conversationId: number;
    senderId: number;
    type: number;
    message: string;
    metadata: string;
    createdAt: number;
    status: MessengerMessageStatus;
    errorCode?: number;
}
