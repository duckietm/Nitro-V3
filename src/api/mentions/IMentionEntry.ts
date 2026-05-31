export interface IMentionEntry
{
    mentionId: number;
    senderId: number;
    senderUsername: string;
    roomId: number;
    roomName: string;
    message: string;
    mentionType: number;
    timestamp: number;
    read: boolean;
}
