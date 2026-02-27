import { AddLinkEventTracker, FollowFriendMessageComposer, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { GetUserProfile, LocalizeText, ReportType, SendMessageComposer } from '../../../../api';
import { Button, Column, Flex, Grid, LayoutAvatarImageView, LayoutGridItem, LayoutItemCountView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useHelp, useMessenger } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { FriendsMessengerThreadView } from './messenger-thread/FriendsMessengerThreadView';

export const FriendsMessengerView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ lastThreadId, setLastThreadId ] = useState(-1);
    const [ messageText, setMessageText ] = useState('');
    const { visibleThreads = [], activeThread = null, getMessageThread = null, sendMessage = null, setActiveThreadId = null, closeThread = null } = useMessenger();
    const { report = null } = useHelp();
    const messagesBox = useRef<HTMLDivElement>();

    const followFriend = () => (activeThread && activeThread.participant && SendMessageComposer(new FollowFriendMessageComposer(activeThread.participant.id)));
    const openProfile = () => (activeThread && activeThread.participant && GetUserProfile(activeThread.participant.id));

    const send = () =>
    {
        if(!activeThread || !messageText.length) return;

        sendMessage(activeThread, GetSessionDataManager().userId, messageText);

        setMessageText('');
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        send();
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
        <NitroCardView className="nitro-friends-messenger w-[800px] h-[720px]" theme="primary-slim" uniqueKey="nitro-friends-messenger">
            <NitroCardHeaderView headerText={ LocalizeText('messenger.window.title', [ 'OPEN_CHAT_COUNT' ], [ visibleThreads.length.toString() ]) } onCloseClick={ event => setIsVisible(false) } />
            <NitroCardContentView>
                <Grid overflow="hidden">
                    <Column overflow="hidden" size={ 4 }>
                        <Text bold>{ LocalizeText('toolbar.icon.label.messenger') }</Text>
                        <Column fit overflow="auto">
                            <Column>
                                { visibleThreads && (visibleThreads.length > 0) && visibleThreads.map(thread =>
                                {
                                    return (
                                        <LayoutGridItem key={ thread.threadId } itemActive={ (activeThread === thread) } onClick={ event => setActiveThreadId(thread.threadId) } className="py-1 px-2">
                                            { thread.unread && <LayoutItemCountView className="text-black" count={ thread.unreadCount } /> }
                                            <Flex fullWidth gap={ 1 } style={{ minHeight: '50px' }}>
                                                <LayoutAvatarImageView
                                                    figure={ thread.participant.id > 0 ? thread.participant.figure : thread.participant.figure === 'ADM' ? 'ha-3409-1413-70.lg-285-89.ch-3032-1334-109.sh-3016-110.hd-185-1359.ca-3225-110-62.wa-3264-62-62.fa-1206-90.hr-3322-1403' : thread.participant.figure }
                                                    headOnly={ true }
                                                    direction={ thread.participant.id > 0 ? 2 : 3 }
                                                    style={{ width: '50px', height: '80px', backgroundPosition: 'center 45%', flexShrink: 0, alignSelf: 'flex-end' }}
                                                />
                                                <Text truncate grow className="self-center">{ thread.participant.name }</Text>
                                            </Flex>
                                        </LayoutGridItem>
                                    );
                                }) }
                            </Column>
                        </Column>
                    </Column>
                    <Column overflow="hidden" size={ 8 }>
                        { activeThread &&
                            <>
                                <Text bold center>{ LocalizeText('messenger.window.separator', [ 'FRIEND_NAME' ], [ activeThread.participant.name ]) }</Text>
                                <Flex alignItems="center" gap={ 1 } justifyContent="between">
                                    { (activeThread.participant.id > 0) &&
                                        <div className="flex gap-1">
                                            <div className="relative inline-flex align-middle">
                                                <Button onClick={ followFriend }>
                                                    <div className="nitro-friends-spritesheet icon-follow" />
                                                </Button>
                                                <Button onClick={ openProfile }>
                                                    <div className="nitro-friends-spritesheet icon-profile-sm" />
                                                </Button>
                                            </div>
                                            <Button variant="danger" onClick={ () => report(ReportType.IM, { reportedUserId: activeThread.participant.id }) }>
                                                { LocalizeText('messenger.window.button.report') }
                                            </Button>
                                        </div> }
                                    <Button onClick={ event => closeThread(activeThread.threadId) }>
                                        <FaTimes className="fa-icon" />
                                    </Button>
                                </Flex>
                                <Column fit className="bg-muted p-2 rounded chat-messages">
                                    <Column innerRef={ messagesBox } overflow="auto">
                                        <FriendsMessengerThreadView thread={ activeThread } />
                                    </Column>
                                </Column>
                                <div className="flex gap-1">
                                    <NitroInput maxLength={ 255 } placeholder={ LocalizeText('messenger.window.input.default', [ 'FRIEND_NAME' ], [ activeThread.participant.name ]) } type="text" value={ messageText } onChange={ event => setMessageText(event.target.value) } onKeyDown={ onKeyDown } />
                                    <Button variant="success" onClick={ send }>
                                        { LocalizeText('widgets.chatinput.say') }
                                    </Button>
                                </div>
                            </> }
                    </Column>
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
};
