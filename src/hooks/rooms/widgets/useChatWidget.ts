import { GetGuestRoomResultEvent, GetRoomEngine, GetSessionDataManager, PetFigureData, RoomChatSettings, RoomChatSettingsEvent, RoomDragEvent, RoomObjectCategory, RoomObjectType, RoomObjectVariable, RoomSessionChatEvent, RoomUserData, SystemChatStyleEnum } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatBubbleMessage, ChatBubbleUtilities, ChatEntryType, ChatHistoryCurrentDate, GetConfigurationValue, GetRoomObjectScreenLocation, IRoomChatSettings, LocalizeText, PlaySound, RoomChatFormatter } from '../../../api';
import { useMessageEvent, useNitroEvent } from '../../events';
import { useTranslation } from '../../translation';
import { useRoom } from '../useRoom';
import { useChatHistory } from './../../chat-history';

const CHAT_MESSAGES_MAX = 250;

const useChatWidgetState = () =>
{
    const [chatMessages, setChatMessages] = useState<ChatBubbleMessage[]>([]);
    const [chatSettings, setChatSettings] = useState<IRoomChatSettings>({
        mode: RoomChatSettings.CHAT_MODE_FREE_FLOW,
        weight: RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL,
        speed: RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL,
        distance: 50,
        protection: RoomChatSettings.FLOOD_FILTER_NORMAL
    });
    const { roomSession = null } = useRoom();
    const { addChatEntry, updateChatEntry } = useChatHistory();
    const { settings, translateIncoming, consumeOutgoingTranslation } = useTranslation();
    const isDisposed = useRef(false);
    const ownUserId = (GetSessionDataManager()?.userId || -1);

    const applyTranslationToBubble = useCallback((chatMessage: ChatBubbleMessage, originalText: string, translatedText: string, detectedLanguage: string, targetLanguage: string) =>
    {
        const resolvedOriginalText = (originalText || chatMessage.text || '');
        const resolvedTranslatedText = (translatedText || resolvedOriginalText);
        const originalFormattedText = RoomChatFormatter(resolvedOriginalText);
        const translatedFormattedText = RoomChatFormatter(resolvedTranslatedText);

        chatMessage.text = resolvedOriginalText;
        chatMessage.formattedText = originalFormattedText;
        chatMessage.originalText = resolvedOriginalText;
        chatMessage.originalFormattedText = originalFormattedText;
        chatMessage.translatedText = resolvedTranslatedText;
        chatMessage.translatedFormattedText = translatedFormattedText;
        chatMessage.translationDetectedLanguage = detectedLanguage || '';
        chatMessage.translationTargetLanguage = targetLanguage || '';
        chatMessage.showTranslation = true;
    }, []);

    const buildTranslatedEntryPatch = useCallback((originalText: string, translatedText: string, detectedLanguage: string, targetLanguage: string) =>
    {
        const resolvedOriginalText = (originalText || '');
        const resolvedTranslatedText = (translatedText || resolvedOriginalText);

        return {
            showTranslation: true,
            message: RoomChatFormatter(resolvedOriginalText),
            originalMessage: RoomChatFormatter(resolvedOriginalText),
            translatedMessage: RoomChatFormatter(resolvedTranslatedText),
            detectedLanguage: detectedLanguage || '',
            targetLanguage: targetLanguage || ''
        };
    }, []);

    const applyAsyncTranslation = useCallback((bubbleId: number, chatEntryId: number, originalText: string, translatedText: string, detectedLanguage: string, targetLanguage: string) =>
    {
        setChatMessages(prevValue =>
        {
            const newValue = [ ...prevValue ];
            const bubble = newValue.find(chat => (chat.id === bubbleId));

            if(bubble) applyTranslationToBubble(bubble, originalText, translatedText, detectedLanguage, targetLanguage);

            return newValue;
        });

        updateChatEntry(chatEntryId, buildTranslatedEntryPatch(originalText, translatedText, detectedLanguage, targetLanguage));
    }, [ applyTranslationToBubble, buildTranslatedEntryPatch, updateChatEntry ]);

    const getScrollSpeed = useMemo(() =>
    {
        if(!chatSettings) return 6000;

        switch(chatSettings.speed)
        {
            case RoomChatSettings.CHAT_SCROLL_SPEED_FAST:
                return 3000;
            case RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL:
                return 6000;
            case RoomChatSettings.CHAT_SCROLL_SPEED_SLOW:
                return 12000;
        }
    }, [chatSettings]);

    useNitroEvent<RoomSessionChatEvent>(RoomSessionChatEvent.CHAT_EVENT, async event =>
    {
        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, event.objectId, RoomObjectCategory.UNIT);
        const bubbleLocation = roomObject ? GetRoomObjectScreenLocation(roomSession.roomId, roomObject?.id, RoomObjectCategory.UNIT) : { x: 0, y: 0 };
        const userData = roomObject ? roomSession.userDataManager.getUserDataByIndex(event.objectId) : new RoomUserData(-1);

        let username = '';
        let avatarColor = 0;
        let imageUrl: string = null;
        let chatType = event.chatType;
        let styleId = event.style;
        let userType = 0;
        let petType = -1;
        let text = event.message;

        if(userData)
        {
            userType = userData.type;

            const figure = userData.figure;

            switch(userType)
            {
                case RoomObjectType.PET:
                    imageUrl = await ChatBubbleUtilities.getPetImage(figure, 2, true, 64, roomObject.model.getValue<string>(RoomObjectVariable.FIGURE_POSTURE));
                    petType = new PetFigureData(figure).typeId;
                    break;
                case RoomObjectType.USER:
                    imageUrl = await ChatBubbleUtilities.getUserImage(figure);
                    break;
                case RoomObjectType.RENTABLE_BOT:
                case RoomObjectType.BOT:
                    styleId = SystemChatStyleEnum.BOT;
                    break;
            }

            avatarColor = ChatBubbleUtilities.AVATAR_COLOR_CACHE.get(figure);
            username = userData.name;
        }

        switch(chatType)
        {
            case RoomSessionChatEvent.CHAT_TYPE_RESPECT:
                text = LocalizeText('widgets.chatbubble.respect', ['username'], [username]);

                if(GetConfigurationValue('respect.options')['enabled']) PlaySound(GetConfigurationValue('respect.options')['sound']);

                break;
            case RoomSessionChatEvent.CHAT_TYPE_PETREVIVE:
            case RoomSessionChatEvent.CHAT_TYPE_PET_REBREED_FERTILIZE:
            case RoomSessionChatEvent.CHAT_TYPE_PET_SPEED_FERTILIZE: {
                let textKey = 'widget.chatbubble.petrevived';

                if(chatType === RoomSessionChatEvent.CHAT_TYPE_PET_REBREED_FERTILIZE)
                {
                    textKey = 'widget.chatbubble.petrefertilized;';
                }

                else if(chatType === RoomSessionChatEvent.CHAT_TYPE_PET_SPEED_FERTILIZE)
                {
                    textKey = 'widget.chatbubble.petspeedfertilized';
                }

                let targetUserName: string = null;

                const newRoomObject = GetRoomEngine().getRoomObject(roomSession.roomId, event.extraParam, RoomObjectCategory.UNIT);

                if(newRoomObject)
                {
                    const newUserData = roomSession.userDataManager.getUserDataByIndex(roomObject.id);

                    if(newUserData) targetUserName = newUserData.name;
                }

                text = LocalizeText(textKey, ['petName', 'userName'], [username, targetUserName]);
                break;
            }
            case RoomSessionChatEvent.CHAT_TYPE_PETRESPECT:
                text = LocalizeText('widget.chatbubble.petrespect', ['petname'], [username]);
                break;
            case RoomSessionChatEvent.CHAT_TYPE_PETTREAT:
                text = LocalizeText('widget.chatbubble.pettreat', ['petname'], [username]);
                break;
            case RoomSessionChatEvent.CHAT_TYPE_HAND_ITEM_RECEIVED:
                text = LocalizeText('widget.chatbubble.handitem', ['username', 'handitem'], [username, LocalizeText(('handitem' + event.extraParam))]);
                break;
            case RoomSessionChatEvent.CHAT_TYPE_MUTE_REMAINING: {
                const remainingSeconds = Math.max(0, event.extraParam);
                const hours = Math.floor(remainingSeconds / 3600).toString();
                const minutes = Math.floor((remainingSeconds % 3600) / 60).toString();
                const seconds = (remainingSeconds % 60).toString();

                text = LocalizeText('widget.chatbubble.mutetime', ['hours', 'minutes', 'seconds'], [hours, minutes, seconds]);
                break;
            }
        }

        const isTranslatableChatType = ((chatType === RoomSessionChatEvent.CHAT_TYPE_SPEAK) || (chatType === RoomSessionChatEvent.CHAT_TYPE_WHISPER) || (chatType === RoomSessionChatEvent.CHAT_TYPE_SHOUT));
        const outgoingTranslation = (isTranslatableChatType && (userData.webID === ownUserId)) ? consumeOutgoingTranslation(text) : null;
        const originalText = outgoingTranslation?.originalText || text;
        const formattedText = RoomChatFormatter(originalText);
        const color = (avatarColor && (('#' + (avatarColor.toString(16).padStart(6, '0'))) || null));

        const chatMessage = new ChatBubbleMessage(
            userData.roomIndex,
            RoomObjectCategory.UNIT,
            roomSession.roomId,
            originalText,
            formattedText,
            username,
            { x: bubbleLocation.x, y: bubbleLocation.y },
            chatType,
            styleId,
            imageUrl,
            color);

        if(outgoingTranslation)
        {
            applyTranslationToBubble(chatMessage, outgoingTranslation.originalText, outgoingTranslation.translatedText, outgoingTranslation.detectedLanguage, outgoingTranslation.targetLanguage);
        }

        chatMessage.prefixText = event.prefixText || '';
        chatMessage.prefixColor = event.prefixColor || '';
        chatMessage.prefixIcon = event.prefixIcon || '';
        chatMessage.prefixEffect = event.prefixEffect || '';
        chatMessage.prefixFont = event.prefixFont || '';
        chatMessage.nickIcon = event.nickIcon || '';
        chatMessage.displayOrder = event.displayOrder || 'icon-prefix-name';

        setChatMessages(prevValue =>
        {
            const newValue = [ ...prevValue, chatMessage ];

            if(newValue.length > CHAT_MESSAGES_MAX) newValue.shift();

            return newValue;
        });
        const chatEntryId = addChatEntry({
            id: -1,
            webId: userData.webID,
            entityId: userData.roomIndex,
            name: username,
            imageUrl,
            style: styleId,
            chatType: chatType,
            entityType: userData.type,
            message: formattedText,
            timestamp: ChatHistoryCurrentDate(),
            type: ChatEntryType.TYPE_CHAT,
            roomId: roomSession.roomId,
            color,
            ...(outgoingTranslation ? buildTranslatedEntryPatch(outgoingTranslation.originalText, outgoingTranslation.translatedText, outgoingTranslation.detectedLanguage, outgoingTranslation.targetLanguage) : {})
        });

        if(!settings.enabled || outgoingTranslation || !isTranslatableChatType || !text.trim().length) return;

        void translateIncoming(text).then(translation =>
        {
            if(!translation || isDisposed.current) return;

            applyAsyncTranslation(chatMessage.id, chatEntryId, translation.originalText, translation.translatedText, translation.detectedLanguage, translation.targetLanguage);
        });
    });

    useNitroEvent<RoomDragEvent>(RoomDragEvent.ROOM_DRAG, event =>
    {
        if(!chatMessages.length || (event.roomId !== roomSession.roomId)) return;

        const offsetX = event.offsetX;

        chatMessages.forEach(chat => (chat.elementRef && (chat.left += offsetX)));
    });

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();

        if(!parser.roomEnter) return;

        setChatSettings(parser.chat);
    });

    useMessageEvent<RoomChatSettingsEvent>(RoomChatSettingsEvent, event =>
    {
        const parser = event.getParser();

        setChatSettings(parser.chat);
    });

    useEffect(() =>
    {
        isDisposed.current = false;

        return () =>
        {
            isDisposed.current = true;
        };
    }, []);

    return { chatMessages, setChatMessages, chatSettings, getScrollSpeed };
};

export const useChatWidget = useChatWidgetState;
