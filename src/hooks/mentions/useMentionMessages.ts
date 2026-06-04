import { MentionReceivedEvent, MentionsListEvent, RequestMentionsComposer } from '@nitrots/nitro-renderer';
import { useCallback, useEffect } from 'react';
import { GetConfigurationValue, IMentionEntry, PlaySound, SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { addMention, setMentions } from './mentionsStore';
import { pushMentionToast } from './mentionToastsStore';

// Dedicated mention chime served from nitro-assets/sounds/<sample>.mp3.
const MENTION_SOUND_SAMPLE = 'mentions_notification';

export const useMentionMessages = (): void =>
{
    const onMentionsList = useCallback((event: MentionsListEvent) =>
    {
        const list = event.getParser().mentions;

        setMentions(list.map(m => ({
            mentionId: m.mentionId,
            senderId: m.senderId,
            senderUsername: m.senderUsername,
            senderFigure: m.senderFigure,
            roomId: m.roomId,
            roomName: m.roomName,
            message: m.message,
            mentionType: m.mentionType,
            timestamp: m.timestamp,
            read: m.read
        })));
    }, []);

    const onMentionReceived = useCallback((event: MentionReceivedEvent) =>
    {
        if(!GetConfigurationValue<boolean>('mentions_ui.enabled', true)) return;

        const m = event.getParser().mention;

        const entry: IMentionEntry = {
            mentionId: m.mentionId,
            senderId: m.senderId,
            senderUsername: m.senderUsername,
            senderFigure: m.senderFigure,
            roomId: m.roomId,
            roomName: m.roomName,
            message: m.message,
            mentionType: m.mentionType,
            timestamp: m.timestamp,
            read: false
        };

        addMention(entry);

        if(GetConfigurationValue<boolean>('mentions_ui.sound', true)) PlaySound(MENTION_SOUND_SAMPLE);

        // Notifica laterale custom (avatar + messaggio + dismiss) invece del bubble generico.
        pushMentionToast(entry);
    }, []);

    useMessageEvent<MentionsListEvent>(MentionsListEvent, onMentionsList);
    useMessageEvent<MentionReceivedEvent>(MentionReceivedEvent, onMentionReceived);

    useEffect(() =>
    {
        if(!GetConfigurationValue<boolean>('mentions_ui.enabled', true)) return;

        SendMessageComposer(new RequestMentionsComposer());
    }, []);
};
