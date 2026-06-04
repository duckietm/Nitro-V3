import { IMentionEntry } from '../../api';

// Toast laterali per le menzioni appena ricevute (avatar + messaggio + dismiss).
// Separato da mentionsStore: i toast sono effimeri, le menzioni persistono nel pannello.
export interface MentionToast
{
    mentionId: number;
    senderId: number;
    senderUsername: string;
    senderFigure: string;
    message: string;
    roomName: string;
}

const MAX_TOASTS = 4;

let toasts: MentionToast[] = [];
const listeners = new Set<() => void>();

const emit = (): void =>
{
    for(const listener of listeners) listener();
};

export const subscribeMentionToasts = (callback: () => void): (() => void) =>
{
    listeners.add(callback);
    return () => { listeners.delete(callback); };
};

export const getMentionToasts = (): ReadonlyArray<MentionToast> => toasts;

export const pushMentionToast = (entry: IMentionEntry): void =>
{
    toasts = [
        {
            mentionId: entry.mentionId,
            senderId: entry.senderId,
            senderUsername: entry.senderUsername,
            senderFigure: entry.senderFigure,
            message: entry.message,
            roomName: entry.roomName
        },
        ...toasts.filter(toast => toast.mentionId !== entry.mentionId)
    ].slice(0, MAX_TOASTS);

    emit();
};

export const dismissMentionToast = (mentionId: number): void =>
{
    const next = toasts.filter(toast => toast.mentionId !== mentionId);

    if(next.length === toasts.length) return;

    toasts = next;
    emit();
};
