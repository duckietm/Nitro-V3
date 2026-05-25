import { AddLinkEventTracker, FollowFriendMessageComposer, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { GetUserProfile, LocalizeText, ReportType, SendMessageComposer } from '../../../../api';
import { DraggableWindowPosition, LayoutAvatarImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useHelp, useMessenger, useTranslation } from '../../../../hooks';
import { FriendsMessengerThreadView } from './messenger-thread/FriendsMessengerThreadView';

export const FriendsMessengerView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ lastThreadId, setLastThreadId ] = useState(-1);
    const [ messageText, setMessageText ] = useState('');
    const { visibleThreads = [], activeThread = null, getMessageThread = null, sendMessage = null, setActiveThreadId = null, closeThread = null } = useMessenger();
    const { report = null } = useHelp();
    const { settings, translateOutgoing } = useTranslation();
    const messagesBox = useRef<HTMLDivElement>(null);

    const followFriend = () => (activeThread && activeThread.participant && SendMessageComposer(new FollowFriendMessageComposer(activeThread.participant.id)));
    const openProfile = () => (activeThread && activeThread.participant && GetUserProfile(activeThread.participant.id));

    const send = async () =>
    {
        if(!activeThread || !messageText.length) return;

        const trimmedText = messageText.trimStart();
        const shouldTranslateOutgoing = settings.enabled && !!trimmedText.length && (trimmedText.charAt(0) !== ':');

        if(!shouldTranslateOutgoing)
        {
            sendMessage(activeThread, GetSessionDataManager().userId, messageText);
            setMessageText('');
            return;
        }

        const translation = await translateOutgoing(messageText);

        if(translation && translation.translatedText?.length && (translation.translatedText.length <= 255))
        {
            sendMessage(activeThread, GetSessionDataManager().userId, translation.translatedText, 0, null, undefined, translation);
            setMessageText('');
            return;
        }

        sendMessage(activeThread, GetSessionDataManager().userId, messageText);

        setMessageText('');
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        void send();
    };

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length === 2)
                {
                    if(parts[1] === 'open')
                    {
                        setIsVisible(true);

                        return;
                    }

                    if(parts[1] === 'toggle')
                    {
                        setIsVisible(prevValue => !prevValue);

                        return;
                    }

                    const thread = getMessageThread(parseInt(parts[1]));

                    if(!thread) return;

                    setActiveThreadId(thread.threadId);
                    setIsVisible(true);
                }
            },
            eventUrlPrefix: 'friends-messenger/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ getMessageThread, setActiveThreadId ]);

    useEffect(() =>
    {
        if(!isVisible || !activeThread) return;

        messagesBox.current.scrollTop = messagesBox.current.scrollHeight;
    }, [ isVisible, activeThread ]);

    useEffect(() =>
    {
        if(isVisible && !activeThread)
        {
            if(lastThreadId > 0)
            {
                setActiveThreadId(lastThreadId);
            }
            else
            {
                if(visibleThreads.length > 0) setActiveThreadId(visibleThreads[0].threadId);
            }

            return;
        }

        if(!isVisible && activeThread)
        {
            setLastThreadId(activeThread.threadId);
            setActiveThreadId(-1);
        }
    }, [ isVisible, activeThread, lastThreadId, visibleThreads, setActiveThreadId ]);

    if(!isVisible) return null;

    return (
        <NitroCardView className="messenger-card" theme="primary-slim" uniqueKey={ null } windowPosition={ DraggableWindowPosition.TOP_CENTER } offsetTop={ 8 } isResizable={ false }>
            <NitroCardHeaderView headerText={ LocalizeText('messenger.window.title', [ 'OPEN_CHAT_COUNT' ], [ visibleThreads.length.toString() ]) } onCloseClick={ event => setIsVisible(false) } />
            <NitroCardContentView className="text-black p-0" gap={ 0 } overflow="hidden">
                <div className="messenger-card-body">
                    <div className="messenger-avatar-bar">
                        { visibleThreads && (visibleThreads.length > 0) && visibleThreads.map(thread =>
                        {
                            return (
                                <button key={ thread.threadId } className={ 'messenger-avatar-tab' + ((activeThread === thread) ? ' active' : '') + (thread.unread ? ' unread' : '') } onClick={ event => setActiveThreadId(thread.threadId) }>
                                    <LayoutAvatarImageView
                                        figure={ thread.participant.id > 0 ? thread.participant.figure : thread.participant.figure === 'ADM' ? 'ha-3409-1413-70.lg-285-89.ch-3032-1334-109.sh-3016-110.hd-185-1359.ca-3225-110-62.wa-3264-62-62.fa-1206-90.hr-3322-1403' : thread.participant.figure }
                                        headOnly={ true }
                                        direction={ thread.participant.id > 0 ? 2 : 3 }
                                    />
                                </button>
                            );
                        }) }
                    </div>

                    { activeThread &&
                        <>
                            <div className="messenger-thread-header">
                                <span className="messenger-thread-name">{ LocalizeText('messenger.window.separator', [ 'FRIEND_NAME' ], [ activeThread.participant.name ]) }</span>
                                <div className="messenger-actions">
                                    { (activeThread.participant.id > 0) &&
                                        <>
                                            <button className="messenger-btn icon-btn" onClick={ followFriend }>
                                                <div className="nitro-friends-spritesheet icon-follow" />
                                            </button>
                                            <button className="messenger-btn icon-btn" onClick={ openProfile }>
                                                <div className="nitro-friends-spritesheet icon-profile-sm" />
                                            </button>
                                            <button className="messenger-btn danger" onClick={ () => report(ReportType.IM, { reportedUserId: activeThread.participant.id }) }>
                                                { LocalizeText('messenger.window.button.report') }
                                            </button>
                                        </> }
                                    <button className="messenger-btn close-btn" onClick={ event => closeThread(activeThread.threadId) }>
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>

                            <div ref={ messagesBox } className="chat-messages">
                                <FriendsMessengerThreadView thread={ activeThread } />
                            </div>

                            <div className="messenger-input-row">
                                <input maxLength={ 255 } placeholder={ LocalizeText('messenger.window.input.default', [ 'FRIEND_NAME' ], [ activeThread.participant.name ]) } type="text" value={ messageText } onChange={ event => setMessageText(event.target.value) } onKeyDown={ onKeyDown } />
                                <button className="messenger-btn send" onClick={ () => void send() }>
                                    { LocalizeText('widgets.chatinput.say') }
                                </button>
                            </div>
                        </> }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
