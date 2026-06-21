import { IMentionEntry } from '../../api/mentions';

let mentions: IMentionEntry[] = [];
const listeners = new Set<() => void>();

const emit = () => {
    for (const l of listeners) l();
};

export const subscribeMentions = (onChange: () => void): (() => void) => {
    listeners.add(onChange);
    return () => {
        listeners.delete(onChange);
    };
};

export const getMentionsSnapshot = (): ReadonlyArray<IMentionEntry> => mentions;

export const getUnreadCount = (): number => mentions.reduce((n, m) => n + (m.read ? 0 : 1), 0);

export const setMentions = (list: IMentionEntry[]): void => {
    mentions = [...list].sort((a, b) => b.mentionId - a.mentionId);
    emit();
};

export const addMention = (entry: IMentionEntry): void => {
    if (mentions.some((m) => m.mentionId === entry.mentionId && entry.mentionId !== 0)) return;
    mentions = [entry, ...mentions];
    emit();
};

export const markRead = (mentionId: number): void => {
    mentions = mentions.map((m) => (m.mentionId === mentionId ? { ...m, read: true } : m));
    emit();
};

export const markAllRead = (): void => {
    mentions = mentions.map((m) => (m.read ? m : { ...m, read: true }));
    emit();
};

export const removeMention = (mentionId: number): void => {
    const next = mentions.filter((m) => m.mentionId !== mentionId);
    if (next.length === mentions.length) return;
    mentions = next;
    emit();
};

export const resetMentions = (): void => {
    mentions = [];
    emit();
};
