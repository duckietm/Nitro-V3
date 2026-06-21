import {
    ConsoleReadReceiptEvent,
    ConsoleTypingComposer,
    FriendIsTypingEvent,
    GetSessionDataManager,
    MarkConsoleReadComposer,
    NewConsoleMessageEvent,
    RoomInviteErrorEvent,
    RoomInviteEvent,
    SendMessageComposer as SendMessageComposerPacket
} from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import {
    CloneObject,
    LocalizeText,
    MessengerIconState,
    MessengerThread,
    MessengerThreadChat,
    NotificationAlertType,
    PlaySound,
    SendMessageComposer,
    SoundNames
} from '../../api';
import { useMessageEvent } from '../events';
import { useNotification } from '../notification';
import { IResolvedTranslation, useTranslation } from '../translation';
import { useFriends } from './useFriends';

const useMessengerState = () => {
    const [messageThreads, setMessageThreads] = useState<MessengerThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<number>(-1);
    const [hiddenThreadIds, setHiddenThreadIds] = useState<number[]>([]);
    const [iconState, setIconState] = useState<number>(MessengerIconState.HIDDEN);
    const { getFriend = null } = useFriends();
    const { simpleAlert = null } = useNotification();
    const { settings, translateIncoming } = useTranslation();

    const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
    const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const messageThreadsRef = useRef(messageThreads);
    messageThreadsRef.current = messageThreads;

    const visibleThreads = useMemo(() => messageThreads.filter((thread) => hiddenThreadIds.indexOf(thread.threadId) === -1), [messageThreads, hiddenThreadIds]);
    const activeThread = useMemo(
        () => activeThreadId > 0 && visibleThreads.find((thread) => thread.threadId === activeThreadId || null),
        [activeThreadId, visibleThreads]
    );

    const getMessageThread = (userId: number) => {
        let thread = messageThreads.find((thread) => thread.participant && thread.participant.id === userId);

        if (!thread) {
            const friend = getFriend(userId);

            if (!friend) return null;

            thread = new MessengerThread(friend);

            thread.addMessage(null, LocalizeText('messenger.moderationinfo'), 0, null, MessengerThreadChat.SECURITY_NOTIFICATION);

            thread.setRead();

            setMessageThreads((prevValue) => {
                const newValue = [...prevValue];

                newValue.push(thread);

                return newValue;
            });
        } else {
            const hiddenIndex = hiddenThreadIds.indexOf(thread.threadId);

            if (hiddenIndex >= 0) {
                setHiddenThreadIds((prevValue) => {
                    const newValue = [...prevValue];

                    newValue.splice(hiddenIndex, 1);

                    return newValue;
                });
            }
        }

        return thread;
    };

    const closeThread = (threadId: number) => {
        setHiddenThreadIds((prevValue) => {
            const newValue = [...prevValue];

            if (newValue.indexOf(threadId) >= 0) return prevValue;

            newValue.push(threadId);

            return newValue;
        });

        if (activeThreadId === threadId) setActiveThreadId(-1);
    };

    const sendMessage = (
        thread: MessengerThread,
        senderId: number,
        messageText: string,
        secondsSinceSent: number = 0,
        extraData: string = null,
        messageType: number = MessengerThreadChat.CHAT,
        translation: IResolvedTranslation = null
    ) => {
        if (!thread || !messageText || !messageText.length) return;

        const ownMessage = senderId === GetSessionDataManager().userId;

        if (ownMessage && messageText.length <= 255) SendMessageComposer(new SendMessageComposerPacket(thread.participant.id, messageText));

        let addedChatId = -1;

        setMessageThreads((prevValue) => {
            const newValue = [...prevValue];
            const index = newValue.findIndex((newThread) => newThread.threadId === thread.threadId);

            if (index === -1) return prevValue;

            thread = CloneObject(newValue[index]);

            if (ownMessage && thread.groups.length === 1) PlaySound(SoundNames.MESSENGER_NEW_THREAD);

            const addedChat = thread.addMessage(
                messageType === MessengerThreadChat.ROOM_INVITE ? null : senderId,
                messageText,
                secondsSinceSent,
                extraData,
                messageType
            );

            addedChatId = addedChat?.id || -1;

            if (translation && messageType === MessengerThreadChat.CHAT)
                addedChat?.setTranslation(translation.originalText, translation.translatedText, translation.detectedLanguage, translation.targetLanguage);

            if (activeThreadId === thread.threadId) thread.setRead();

            newValue[index] = thread;

            if (!ownMessage && thread.unread) PlaySound(SoundNames.MESSENGER_MESSAGE_RECEIVED);

            return newValue;
        });

        const canTranslateMessage = !translation && settings.enabled && messageType === MessengerThreadChat.CHAT && !!messageText?.trim().length;

        if (!canTranslateMessage || addedChatId <= 0) return;

        void translateIncoming(messageText).then((translation) => {
            if (!translation) return;

            setMessageThreads((prevValue) => {
                const newValue = [...prevValue];
                const index = newValue.findIndex((newThread) => newThread.threadId === thread.threadId);

                if (index === -1) return prevValue;

                const clonedThread = CloneObject(newValue[index]);
                const chat = clonedThread.getChat(addedChatId);

                if (!chat) return prevValue;

                chat.setTranslation(translation.originalText, translation.translatedText, translation.detectedLanguage, translation.targetLanguage);
                newValue[index] = clonedThread;

                return newValue;
            });
        });
    };

    const sendTypingStatus = (peerId: number, isTyping: boolean) => {
        if (!peerId || peerId <= 0) return;

        SendMessageComposer(new ConsoleTypingComposer(peerId, isTyping));
    };

    useMessageEvent<NewConsoleMessageEvent>(NewConsoleMessageEvent, (event) => {
        const parser = event.getParser();
        const thread = getMessageThread(parser.senderId);

        if (!thread) return;

        sendMessage(thread, parser.senderId, parser.messageText, parser.secondsSinceSent, parser.extraData);
        if (thread.threadId === activeThreadId && parser.senderId > 0) SendMessageComposer(new MarkConsoleReadComposer(parser.senderId));
    });

    useMessageEvent<RoomInviteEvent>(RoomInviteEvent, (event) => {
        const parser = event.getParser();
        const thread = getMessageThread(parser.senderId);

        if (!thread) return;

        sendMessage(thread, parser.senderId, parser.messageText, 0, null, MessengerThreadChat.ROOM_INVITE);
    });

    useMessageEvent<RoomInviteErrorEvent>(RoomInviteErrorEvent, (event) => {
        const parser = event.getParser();

        simpleAlert(
            `Received room invite error: ${parser.errorCode},recipients: ${parser.failedRecipients.join(',')}`,
            NotificationAlertType.DEFAULT,
            null,
            null,
            LocalizeText('friendlist.alert.title')
        );
    });

    useMessageEvent<FriendIsTypingEvent>(FriendIsTypingEvent, (event) => {
        const parser = event.getParser();
        const senderId = parser.senderId;

        if (senderId <= 0) return;

        const timers = typingTimersRef.current;
        const existing = timers.get(senderId);

        if (existing) {
            clearTimeout(existing);
            timers.delete(senderId);
        }

        if (parser.isTyping) {
            setTypingUserIds((prev) => (prev.indexOf(senderId) >= 0 ? prev : [...prev, senderId]));

            timers.set(
                senderId,
                setTimeout(() => {
                    typingTimersRef.current.delete(senderId);
                    setTypingUserIds((prev) => prev.filter((id) => id !== senderId));
                }, 6000)
            );
        } else {
            setTypingUserIds((prev) => prev.filter((id) => id !== senderId));
        }
    });

    useMessageEvent<ConsoleReadReceiptEvent>(ConsoleReadReceiptEvent, (event) => {
        const parser = event.getParser();
        const ownUserId = GetSessionDataManager().userId;

        setMessageThreads((prevValue) => {
            const index = prevValue.findIndex((thread) => thread.participant && thread.participant.id === parser.readerId);

            if (index === -1) return prevValue;

            const newValue = [...prevValue];

            newValue[index] = CloneObject(newValue[index]);
            newValue[index].setMessagesReadFromUser(ownUserId);

            return newValue;
        });
    });

    useEffect(() => {
        if (activeThreadId <= 0) return;

        const activeThreadValue = messageThreadsRef.current.find((thread) => thread.threadId === activeThreadId);
        const participantId = activeThreadValue?.participant?.id ?? 0;

        setMessageThreads((prevValue) => {
            const newValue = [...prevValue];
            const index = newValue.findIndex((newThread) => newThread.threadId === activeThreadId);

            if (index >= 0) {
                newValue[index] = CloneObject(newValue[index]);
                newValue[index].setRead();
            }

            return newValue;
        });

        if (participantId > 0) SendMessageComposer(new MarkConsoleReadComposer(participantId));
    }, [activeThreadId]);

    useEffect(() => {
        setIconState((prevValue) => {
            if (!visibleThreads.length) return MessengerIconState.HIDDEN;

            let isUnread = false;

            for (const thread of visibleThreads) {
                if (thread.unreadCount > 0) {
                    isUnread = true;

                    break;
                }
            }

            if (isUnread) return MessengerIconState.UNREAD;

            return MessengerIconState.SHOW;
        });
    }, [visibleThreads]);

    return {
        messageThreads,
        activeThread,
        iconState,
        visibleThreads,
        getMessageThread,
        setActiveThreadId,
        closeThread,
        sendMessage,
        typingUserIds,
        sendTypingStatus
    };
};

export const useMessenger = () => useBetween(useMessengerState);
