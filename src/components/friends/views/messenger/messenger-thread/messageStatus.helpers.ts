import { MessengerThreadChat } from '../../../../../api';

export interface MessageStatusPresentation
{
    ticks: string;
    isRead: boolean;
}

export const getMessageStatusPresentation = (status: number): MessageStatusPresentation =>
{
    const isRead = status === MessengerThreadChat.READ;

    return { ticks: isRead ? '✓✓' : '✓', isRead };
};
