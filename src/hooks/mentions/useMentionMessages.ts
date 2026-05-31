import { MentionReceivedEvent, MentionsListEvent, RequestMentionsComposer } from '@nitrots/nitro-renderer';
import { useCallback, useEffect } from 'react';
import { GetConfigurationValue, IMentionEntry, LocalizeText, NotificationBubbleType, PlaySound, SendMessageComposer, SoundNames } from '../../api';
import { useMessageEvent } from '../events';
import { useNotificationActions } from '../notification';
import { addMention, setMentions } from './mentionsStore';

export const useMentionMessages = (): void =>
{
    const { showSingleBubble } = useNotificationActions();

    const onMentionsList = useCallback((event: MentionsListEvent) =>
    {
        const list = event.getParser().mentions;

        setMentions(list.map(m => ({
            mentionId: m.mentionId,
            senderId: m.senderId,
            senderUsername: m.senderUsername,
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
            roomId: m.roomId,
            roomName: m.roomName,
            message: m.message,
            mentionType: m.mentionType,
            timestamp: m.timestamp,
            read: false
        };

        addMention(entry);

        if(GetConfigurationValue<boolean>('mentions_ui.sound', true)) PlaySound(SoundNames.MESSENGER_MESSAGE_RECEIVED);

        showSingleBubble(
            LocalizeText('mentions.notification', [ 'sender', 'room' ], [ entry.senderUsername, entry.roomName ]),
            NotificationBubbleType.INFO,
            null,
            'mentions/toggle',
            entry.senderUsername
        );
    }, [ showSingleBubble ]);

    useMessageEvent<MentionsListEvent>(MentionsListEvent, onMentionsList);
    useMessageEvent<MentionReceivedEvent>(MentionReceivedEvent, onMentionReceived);

    useEffect(() =>
    {
        if(!GetConfigurationValue<boolean>('mentions_ui.enabled', true)) return;

        SendMessageComposer(new RequestMentionsComposer());
    }, []);
};
