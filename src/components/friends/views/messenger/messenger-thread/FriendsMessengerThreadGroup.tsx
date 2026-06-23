import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { GetGroupChatData, LocalizeText, MessengerGroupType, MessengerThread, MessengerThreadChat, MessengerThreadChatGroup } from '../../../../../api';
import { Base, Flex, LayoutAvatarImageView } from '../../../../../common';
import { useFriends } from '../../../../../hooks';
import { resolveAvatarFigure } from '../../friends-list/resolveAvatarFigure';

export const FriendsMessengerThreadGroup: FC<{ thread: MessengerThread; group: MessengerThreadChatGroup }> = (props) => {
    const { thread = null, group = null } = props;
    const { getFriend = null } = useFriends();

    const groupChatData = useMemo(() => group.type === MessengerGroupType.GROUP_CHAT && GetGroupChatData(group.chats[0].extraData), [group]);

    const isOwnChat = useMemo(() => {
        if (!thread || !group) return false;

        if (group.type === MessengerGroupType.PRIVATE_CHAT && group.userId === GetSessionDataManager().userId) return true;

        if (groupChatData && group.chats.length && groupChatData.userId === GetSessionDataManager().userId) return true;

        return false;
    }, [thread, group, groupChatData]);

    if (!thread || !group) return null;

    if (!group.userId) {
        return (
            <>
                {group.chats.map((chat, index) => {
                    if (chat.type === MessengerThreadChat.SECURITY_NOTIFICATION) return null;

                    return (
                        <Flex key={index} fullWidth gap={2} justifyContent="start">
                            <Base className="w-full text-break">
                                {chat.type === MessengerThreadChat.ROOM_INVITE && (
                                    <Flex alignItems="center" className="bg-light rounded mb-2 px-2 py-1 small text-black" gap={2}>
                                        <Base className="messenger-notification-icon shrink-0" />
                                        <Base>
                                            {LocalizeText('messenger.invitation') + ' '}
                                            {chat.message}
                                        </Base>
                                    </Flex>
                                )}
                            </Base>
                        </Flex>
                    );
                })}
            </>
        );
    }

    return (
        <Flex fullWidth gap={2} justifyContent={isOwnChat ? 'end' : 'start'} className={'messenger-message-row ' + (isOwnChat ? 'own' : '')}>
            <Base shrink className="message-avatar">
                {group.type === MessengerGroupType.PRIVATE_CHAT && !isOwnChat && (
                    <LayoutAvatarImageView
                        direction={2}
                        figure={resolveAvatarFigure(
                            getFriend?.(thread.participant.id)?.figure || thread.participant.figure,
                            getFriend?.(thread.participant.id)?.gender ?? thread.participant.gender
                        )}
                        headOnly={true}
                    />
                )}
                {groupChatData && !isOwnChat && <LayoutAvatarImageView direction={2} figure={groupChatData.figure} headOnly={true} />}
            </Base>
            <Base className="messenger-message-body">
                <Base className={'messenger-message-name ' + (isOwnChat ? 'text-end' : '')}>
                    {isOwnChat && GetSessionDataManager().userName}
                    {!isOwnChat && (groupChatData ? groupChatData.username : thread.participant.name)}:
                </Base>
                <Base className={'messenger-message-bubble messages-group-' + (isOwnChat ? 'right' : 'left')}>
                    {group.chats.map((chat, index) => {
                        if (!chat.showTranslation) {
                            return (
                                <Base key={index} className="text-break">
                                    {chat.message}
                                    {chat.offlineDelivered && <span className="messenger-offline-tag">{LocalizeText('messenger.offline.delivered')}</span>}
                                </Base>
                            );
                        }

                        return (
                            <Base key={index} className="messenger-translation-block">
                                <Base className="messenger-translation-row">
                                    <span className="messenger-translation-label">original:</span>
                                    <span className="text-break">{chat.originalMessage || chat.message}</span>
                                </Base>
                                <Base className="messenger-translation-row">
                                    <span className="messenger-translation-label">translate:</span>
                                    <span className="text-break">{chat.translatedMessage || chat.message}</span>
                                </Base>
                            </Base>
                        );
                    })}
                </Base>
                <Base className="messenger-message-time">{group.chats[0].date.toLocaleTimeString()}</Base>
                {isOwnChat && group.type === MessengerGroupType.PRIVATE_CHAT && group.chats[group.chats.length - 1].type === MessengerThreadChat.CHAT && (
                    <Base className={'messenger-message-status ' + (group.chats[group.chats.length - 1].status === MessengerThreadChat.READ ? 'read' : '')}>
                        {group.chats[group.chats.length - 1].status === MessengerThreadChat.READ ? '✓✓' : '✓'}
                    </Base>
                )}
            </Base>
            {isOwnChat && (
                <Base shrink className="message-avatar">
                    <LayoutAvatarImageView direction={4} figure={GetSessionDataManager().figure} headOnly={true} />
                </Base>
            )}
        </Flex>
    );
};
