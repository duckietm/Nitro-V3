import { CreateLinkEvent, MarkMentionsReadComposer } from '@nitrots/nitro-renderer';
import { useCallback } from 'react';
import { IMentionEntry, SendMessageComposer } from '../../api';
import { markRead } from '../../hooks/mentions/mentionsStore';

// Shared row-click handler used by both MentionsView and the chat-history
// "Menzioni" tab so the mark-read + room-navigation behaviour can't diverge.
export const useMentionRowClick = (): ((mention: IMentionEntry) => void) =>
{
    return useCallback((mention: IMentionEntry) =>
    {
        if(!mention.read)
        {
            markRead(mention.mentionId);
            SendMessageComposer(new MarkMentionsReadComposer(1, mention.mentionId));
        }

        if(mention.roomId > 0) CreateLinkEvent(`navigator/goto/${ mention.roomId }`);
    }, []);
};
