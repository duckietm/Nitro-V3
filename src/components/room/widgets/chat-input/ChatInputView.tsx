import { GetSessionDataManager, HabboClubLevelEnum, RoomControllerLevel } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatMessageTypeEnum, GetClubMemberLevel, GetConfigurationValue, LocalizeText, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { Text } from '../../../../common';
import { useChatCommandSelector, useChatInputWidget, useRoom, useSessionInfo, useUiEvent } from '../../../../hooks';
import { useRoomUserListSnapshot } from '../../../../hooks/session/useSessionSnapshots';
import { ChatInputCommandSelectorView } from './ChatInputCommandSelectorView';
import { ChatInputEmojiSelectorView } from './ChatInputEmojiSelectorView';
import { ChatInputMentionSelectorView, MentionSuggestion } from './ChatInputMentionSelectorView';
import { ChatInputStyleSelectorView } from './ChatInputStyleSelectorView';

const USER_TYPE_REAL_USER = 1;
const MAX_MENTION_SUGGESTIONS = 8;
const MENTION_ALIASES: ReadonlyArray<{ key: string; label: string; description?: string }> = [
    { key: 'all', label: 'all', description: 'Everyone in the hotel' },
    { key: 'everyone', label: 'everyone', description: 'Everyone in the hotel' },
    { key: 'tutti', label: 'tutti', description: 'Everyone in the hotel' },
    { key: 'friends', label: 'friends', description: 'Your online friends' },
    { key: 'amici', label: 'amici', description: 'Your online friends' },
    { key: 'room', label: 'room', description: 'Everyone in this room' },
    { key: 'stanza', label: 'stanza', description: 'Everyone in this room' }
];

export const ChatInputView: FC<{}> = props =>
{
    const [ chatValue, setChatValue ] = useState<string>('');
    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const { selectedUsername = '', floodBlocked = false, floodBlockedSeconds = 0, setIsTyping = null, setIsIdle = null, sendChat = null } = useChatInputWidget();
    const { roomSession = null } = useRoom();
    const inputRef = useRef<HTMLInputElement>(null);
    const { isVisible: commandSelectorVisible, filteredCommands, selectedIndex, setSelectedIndex, moveUp, moveDown, selectCurrent, close: closeCommandSelector } = useChatCommandSelector(chatValue);
    const roomUserList = useRoomUserListSnapshot();
    const [ mentionSelectedIndex, setMentionSelectedIndex ] = useState<number>(0);

    const mentionContext = useMemo(() =>
    {
        if(!chatValue) return null;
        if(commandSelectorVisible) return null;

        const caret = inputRef.current?.selectionStart ?? chatValue.length;
        const upToCaret = chatValue.slice(0, caret);
        const at = upToCaret.lastIndexOf('@');
        if(at < 0) return null;

        if(at > 0 && !/\s/.test(upToCaret.charAt(at - 1))) return null;

        const query = upToCaret.slice(at + 1);

        if(/\s/.test(query)) return null;

        return { atIndex: at, replaceFrom: at, replaceTo: caret, query };
    }, [ chatValue, commandSelectorVisible ]);

    const mentionSuggestions = useMemo<MentionSuggestion[]>(() =>
    {
        if(!mentionContext) return [];

        const query = mentionContext.query.toLowerCase();
        const out: MentionSuggestion[] = [];

        for(const user of roomUserList)
        {
            if(!user || user.type !== USER_TYPE_REAL_USER) continue;
            if(!user.name) continue;
            if(query.length > 0 && !user.name.toLowerCase().startsWith(query)) continue;

            out.push({
                key: `user:${ user.webID }`,
                kind: 'user',
                name: user.name,
                insertToken: user.name,
                figure: user.figure || ''
            });

            if(out.length >= MAX_MENTION_SUGGESTIONS) break;
        }

        for(const alias of MENTION_ALIASES)
        {
            if(query.length > 0 && !alias.key.toLowerCase().startsWith(query)) continue;

            out.push({
                key: `alias:${ alias.key }`,
                kind: 'alias',
                name: alias.label,
                insertToken: alias.key,
                description: alias.description
            });

            if(out.length >= MAX_MENTION_SUGGESTIONS) break;
        }

        return out;
    }, [ mentionContext, roomUserList ]);

    const mentionSelectorVisible = mentionSuggestions.length > 0;

    useEffect(() =>
    {
        if(mentionSelectedIndex >= mentionSuggestions.length) setMentionSelectedIndex(0);
    }, [ mentionSuggestions.length, mentionSelectedIndex ]);

    const applyMentionSuggestion = useCallback((suggestion: MentionSuggestion) =>
    {
        if(!suggestion || !mentionContext) return;

        const before = chatValue.slice(0, mentionContext.replaceFrom);
        const after = chatValue.slice(mentionContext.replaceTo);
        const inserted = `@${ suggestion.insertToken } `;
        const next = `${ before }${ inserted }${ after }`;

        setChatValue(next);

        requestAnimationFrame(() =>
        {
            if(!inputRef.current) return;
            const caret = before.length + inserted.length;
            inputRef.current.focus();
            inputRef.current.setSelectionRange(caret, caret);
        });

        setMentionSelectedIndex(0);
    }, [ chatValue, mentionContext ]);

    const chatModeIdWhisper = useMemo(() => LocalizeText('widgets.chatinput.mode.whisper'), []);
    const chatModeIdShout = useMemo(() => LocalizeText('widgets.chatinput.mode.shout'), []);
    const chatModeIdSpeak = useMemo(() => LocalizeText('widgets.chatinput.mode.speak'), []);
    const maxChatLength = useMemo(() => GetConfigurationValue<number>('chat.input.maxlength', 100), []);

    const anotherInputHasFocus = useCallback(() =>
    {
        const activeElement = document.activeElement;

        if(!activeElement) return false;

        if(inputRef && (inputRef.current === activeElement)) return false;

        if(!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) return false;

        return true;
    }, [ inputRef ]);

    const setInputFocus = useCallback(() =>
    {
        inputRef.current.focus();

        inputRef.current.setSelectionRange((inputRef.current.value.length * 2), (inputRef.current.value.length * 2));
    }, [ inputRef ]);

    const setChatInputValue = useCallback((value: string, markTyping: boolean = true) =>
    {
        setChatValue(value);

        if(markTyping)
        {
            setIsTyping(!!value.length);
            setIsIdle(!!value.length);
        }

        requestAnimationFrame(() =>
        {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(value.length, value.length);
        });
    }, [ setIsTyping, setIsIdle ]);

    const checkSpecialKeywordForInput = useCallback(() =>
    {
        setChatValue(prevValue =>
        {
            if((prevValue !== chatModeIdWhisper) || !selectedUsername.length) return prevValue;

            return (`${ prevValue } ${ selectedUsername }`);
        });
    }, [ selectedUsername, chatModeIdWhisper ]);

    const sendChatValue = useCallback((value: string, shiftKey: boolean = false) =>
    {
        if(!value || (value === '')) return;

        let chatType = (shiftKey ? ChatMessageTypeEnum.CHAT_SHOUT : ChatMessageTypeEnum.CHAT_DEFAULT);
        let text = value;

        const parts = text.split(' ');

        let recipientName = '';
        let append = '';

        switch(parts[0])
        {
            case chatModeIdWhisper:
                chatType = ChatMessageTypeEnum.CHAT_WHISPER;
                recipientName = parts[1];
                append = (chatModeIdWhisper + ' ' + recipientName + ' ');

                parts.shift();
                parts.shift();
                break;
            case chatModeIdShout:
                chatType = ChatMessageTypeEnum.CHAT_SHOUT;

                parts.shift();
                break;
            case chatModeIdSpeak:
                chatType = ChatMessageTypeEnum.CHAT_DEFAULT;

                parts.shift();
                break;
        }

        text = parts.join(' ');

        setIsTyping(false);
        setIsIdle(false);

        if(text.length <= maxChatLength)
        {
            if(/%CC%/g.test(encodeURIComponent(text)))
            {
                setChatValue('');
            }
            else
            {
                setChatValue('');
                sendChat(text, chatType, recipientName, chatStyleId);
            }
        }

        setChatValue(append);
    }, [ chatModeIdWhisper, chatModeIdShout, chatModeIdSpeak, maxChatLength, chatStyleId, setIsTyping, setIsIdle, sendChat ]);

    const updateChatInput = useCallback((value: string) =>
    {
        if(!value || !value.length)
        {
            setIsTyping(false);
        }
        else
        {
            setIsTyping(true);
            setIsIdle(true);
        }

        setChatValue(value);
    }, [ setIsTyping, setIsIdle ]);

    const addChatEmoji = useCallback((emoji: string) =>
    {
        setChatValue(prev => prev + emoji);
        setIsTyping(true);
        inputRef.current?.focus();
    }, [ setIsTyping, inputRef ]);

    const onKeyDownEvent = useCallback((event: KeyboardEvent) =>
    {
        if(floodBlocked || !inputRef.current || anotherInputHasFocus()) return;

        if(document.activeElement !== inputRef.current) setInputFocus();

        if(commandSelectorVisible)
        {
            switch(event.key)
            {
                case 'ArrowUp':
                    event.preventDefault();
                    moveUp();
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    moveDown();
                    return;
                case 'Tab':
                    event.preventDefault();
                case 'NumpadEnter':
                case 'Enter': {
                    const selected = selectCurrent();

                    if(selected)
                    {
                        event.preventDefault();
                        setChatInputValue(':' + selected.key + ' ');
                        return;
                    }
                    break;
                }
                case 'Escape':
                    event.preventDefault();
                    closeCommandSelector();
                    return;
            }
        }

        if(mentionSelectorVisible)
        {
            switch(event.key)
            {
                case 'ArrowUp':
                    event.preventDefault();
                    setMentionSelectedIndex(prev => (prev <= 0) ? (mentionSuggestions.length - 1) : (prev - 1));
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    setMentionSelectedIndex(prev => (prev >= mentionSuggestions.length - 1) ? 0 : (prev + 1));
                    return;
                case 'Tab':
                case 'NumpadEnter':
                case 'Enter': {
                    const picked = mentionSuggestions[mentionSelectedIndex] ?? mentionSuggestions[0];

                    if(picked)
                    {
                        event.preventDefault();
                        applyMentionSuggestion(picked);
                        return;
                    }
                    break;
                }
                case 'Escape':
                    event.preventDefault();
                    setMentionSelectedIndex(0);

                    if(mentionContext)
                    {
                        const before = chatValue.slice(0, mentionContext.replaceFrom);
                        const after = chatValue.slice(mentionContext.replaceTo);
                        setChatValue(before + after);
                    }
                    return;
            }
        }

        const value = (event.target as HTMLInputElement).value;

        switch(event.key)
        {
            case ' ':
            case 'Space':
                checkSpecialKeywordForInput();
                return;
            case 'NumpadEnter':
            case 'Enter':
                sendChatValue(value, event.shiftKey);
                return;
            case 'Backspace':
                if(value)
                {
                    const parts = value.split(' ');

                    if((parts[0] === chatModeIdWhisper) && (parts.length === 3) && (parts[2] === ''))
                    {
                        setChatValue('');
                    }
                }
                return;
        }

    }, [ floodBlocked, inputRef, chatModeIdWhisper, anotherInputHasFocus, setInputFocus, checkSpecialKeywordForInput, sendChatValue, commandSelectorVisible, moveUp, moveDown, selectCurrent, closeCommandSelector, mentionSelectorVisible, mentionSuggestions, mentionSelectedIndex, applyMentionSuggestion, mentionContext, chatValue ]);

    useUiEvent<RoomWidgetUpdateChatInputContentEvent>(RoomWidgetUpdateChatInputContentEvent.CHAT_INPUT_CONTENT, event =>
    {
        switch(event.chatMode)
        {
            case RoomWidgetUpdateChatInputContentEvent.TEXT:
                setChatInputValue(event.userName);
                return;
            case RoomWidgetUpdateChatInputContentEvent.WHISPER: {
                setChatValue(`${ chatModeIdWhisper } ${ event.userName } `);
                return;
            }
            case RoomWidgetUpdateChatInputContentEvent.SHOUT:
                return;
        }
    });

    const chatStyleIds = useMemo(() =>
    {
        let styleIds: number[] = [];

        const styles = GetConfigurationValue<{ styleId: number, minRank: number, isSystemStyle: boolean, isHcOnly: boolean, isAmbassadorOnly: boolean }[]>('chat.styles');

        for(const style of styles)
        {
            if(!style) continue;

            if(style.minRank > 0)
            {
                if(GetSessionDataManager().hasSecurity(style.minRank)) styleIds.push(style.styleId);

                continue;
            }

            if(style.isSystemStyle)
            {
                if(GetSessionDataManager().hasSecurity(RoomControllerLevel.MODERATOR))
                {
                    styleIds.push(style.styleId);

                    continue;
                }
            }

            if(GetConfigurationValue<number[]>('chat.styles.disabled').indexOf(style.styleId) >= 0) continue;

            if(style.isHcOnly && (GetClubMemberLevel() >= HabboClubLevelEnum.CLUB))
            {
                styleIds.push(style.styleId);

                continue;
            }

            if(style.isAmbassadorOnly && GetSessionDataManager().isAmbassador)
            {
                styleIds.push(style.styleId);

                continue;
            }

            if(!style.isHcOnly && !style.isAmbassadorOnly) styleIds.push(style.styleId);
        }

        return styleIds;
    }, []);

    useEffect(() =>
    {
        document.body.addEventListener('keydown', onKeyDownEvent);

        return () =>
        {
            document.body.removeEventListener('keydown', onKeyDownEvent);
        };
    }, [ onKeyDownEvent ]);

    useEffect(() =>
    {
        if(!inputRef.current) return;

        inputRef.current.parentElement.dataset.value = chatValue;
    }, [ chatValue ]);

    if(!roomSession || roomSession.isSpectator) return null;

    return (
        createPortal(
            <div className="nitro-chat-input-container relative flex h-[38px] w-full items-center justify-between overflow-visible rounded-[12px] border-2 border-black bg-white pr-[8px]">
                { commandSelectorVisible &&
                    <ChatInputCommandSelectorView
                        commands={ filteredCommands }
                        selectedIndex={ selectedIndex }
                        onSelect={ (cmd) =>
                        {
                            setChatInputValue(':' + cmd.key + ' ');
                        } }
                        onHover={ setSelectedIndex }
                    /> }
                { mentionSelectorVisible && !commandSelectorVisible &&
                    <ChatInputMentionSelectorView
                        suggestions={ mentionSuggestions }
                        selectedIndex={ mentionSelectedIndex }
                        onSelect={ applyMentionSuggestion }
                        onHover={ setMentionSelectedIndex }
                    /> }
                <div className="flex-1 items-center input-sizer">
                    { !floodBlocked &&
                        <input ref={ inputRef } className="w-full border-none bg-transparent px-[10px] text-[0.86rem] text-black placeholder:text-[#6c757d] focus:border-current focus:shadow-none focus:ring-0" maxLength={ maxChatLength } placeholder={ LocalizeText('widgets.chatinput.default') } type="text" value={ chatValue } onChange={ event => updateChatInput(event.target.value) } onMouseDown={ event => setInputFocus() } /> }
                    { floodBlocked &&
                        <Text variant="danger">{ LocalizeText('chat.input.alert.flood', [ 'time' ], [ floodBlockedSeconds.toString() ]) } </Text> }
                </div>
                <ChatInputEmojiSelectorView addChatEmoji={ addChatEmoji } />
                <ChatInputStyleSelectorView chatStyleId={ chatStyleId } chatStyleIds={ chatStyleIds } selectChatStyleId={ updateChatStyleId } />
            </div>, document.getElementById('toolbar-chat-input-container'))
    );
};
