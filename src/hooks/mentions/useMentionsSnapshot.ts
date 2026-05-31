import { IMentionEntry } from '../../api/mentions';
import { useExternalSnapshot } from '../events/useExternalSnapshot';
import { getMentionsSnapshot, getUnreadCount, subscribeMentions } from './mentionsStore';

export const useMentionsSnapshot = (): { mentions: ReadonlyArray<IMentionEntry>; unreadCount: number } =>
{
    const mentions = useExternalSnapshot(subscribeMentions, getMentionsSnapshot);
    const unreadCount = useExternalSnapshot(subscribeMentions, getUnreadCount);
    return { mentions, unreadCount };
};
