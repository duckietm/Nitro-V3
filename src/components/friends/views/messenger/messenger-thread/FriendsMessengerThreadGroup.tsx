import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { GetConfigurationValue, GetGroupChatData, LocalizeText, MessengerGroupType, MessengerThread, MessengerThreadChat, MessengerThreadChatGroup } from '../../../../../api';
import MessengerNotificationIcon from '../../../../../assets/images/friends/messenger_notification_icon.png';
import { LayoutAvatarImageView } from '../../../../../common';
import { useFriends } from '../../../../../hooks';
import { resolveAvatarFigure } from '../../friends-list/resolveAvatarFigure';

type HabbiconFrame = { x: number; y: number; width: number; height: number };
const habbiconFrameCache = new Map<string, Map<number, HabbiconFrame>>();

const MessengerHabbiconMessage: FC<{ id: number; assetRoot: string }> = ({ id, assetRoot }) => {
    const [frame, setFrame] = useState<HabbiconFrame>(null);

    useEffect(() => {
        if (!assetRoot) return;

        const cached = habbiconFrameCache.get(assetRoot);

        if (cached) {
            setFrame(cached.get(id) || null);
            return;
        }

        let disposed = false;

        void fetch(`${assetRoot}habbicons.json`)
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
                if (disposed || !Array.isArray(data?.habbicons)) return;

                const frames = new Map<number, HabbiconFrame>(data.habbicons.map((entry: any) => [Number(entry.id), {
                    x: Number(entry.x) || 0,
                    y: Number(entry.y) || 0,
                    width: Number(entry.width) || 42,
                    height: Number(entry.height) || 42
                }]));

                habbiconFrameCache.set(assetRoot, frames);
                setFrame(frames.get(id) || null);
            });

        return () => { disposed = true; };
    }, [assetRoot, id]);

    if (!frame) return null;

    return <span className="swf-messenger-habbicon-message" style={{
        width: frame.width,
        height: frame.height,
        backgroundImage: `url(${assetRoot}habbicons_spritesheet.png)`,
        backgroundPosition: `-${frame.x}px -${frame.y}px`
    }} />;
};

export const FriendsMessengerThreadGroup: FC<{ thread: MessengerThread; group: MessengerThreadChatGroup }> = ({ thread, group }) => {
    const { getFriend = null } = useFriends();
    const groupChatData = useMemo(() => group.type === MessengerGroupType.GROUP_CHAT && GetGroupChatData(group.chats[0].extraData), [group]);
    const own = (group.type === MessengerGroupType.PRIVATE_CHAT && group.userId === GetSessionDataManager().userId) || (!!groupChatData && group.chats.length > 0 && groupChatData.userId === GetSessionDataManager().userId);

    if (!group.userId) return <>{group.chats.map((chat, index) => chat.type === MessengerThreadChat.ROOM_INVITE
        ? <div key={index} className="swf-messenger-notification"><img src={MessengerNotificationIcon} alt="" /><span>{LocalizeText('messenger.invitation')} {chat.message}</span></div>
        : chat.type === MessengerThreadChat.STATUS_NOTIFICATION
            ? <div key={index} className="swf-messenger-status-notification">{chat.message}</div>
            : null)}</>;

    const friend = getFriend?.(thread.participant.id);
    const name = own ? GetSessionDataManager().userName : (groupChatData?.username || thread.participant.name);
    const figure = own ? GetSessionDataManager().figure : groupChatData?.figure || resolveAvatarFigure(friend?.figure || thread.participant.figure, friend?.gender ?? thread.participant.gender);
    const assetRoot = (() => {
        const root = GetConfigurationValue<string>('habbicons.asset.root', '');
        const hash = GetConfigurationValue<string>('habbicons.asset.hash', '');

        if (!root) return '';

        const normalizedRoot = root.endsWith('/') ? root : `${root}/`;

        return hash ? `${normalizedRoot}${hash}/` : normalizedRoot;
    })();
    const renderMessage = (message: string) => {
        const match = /^\uE000(\d+)$/.exec(message || '');

        if (!match || !assetRoot) return message;

        return <MessengerHabbiconMessage id={Number(match[1])} assetRoot={assetRoot} />;
    };

    return <div className={`messenger-message-row${own ? ' own' : ''}`}>
        {!own && <div className="message-avatar"><LayoutAvatarImageView direction={2} figure={figure} headOnly /></div>}
        <div className="messenger-message-body">
            <div className="messenger-message-name">{name}:</div>
            <div className="messenger-message-bubble">
                {group.chats.map((chat, index) => !chat.showTranslation
                    ? <div key={index}>{renderMessage(chat.message)}</div>
                    : <div key={index} className="messenger-translation-block"><div><b>original:</b> {chat.originalMessage || chat.message}</div><div><b>translate:</b> {chat.translatedMessage || chat.message}</div></div>)}
            </div>
            <div className="messenger-message-time">{group.chats[0].date.toLocaleTimeString()}</div>
        </div>
        {own && <div className="message-avatar"><LayoutAvatarImageView direction={4} figure={figure} headOnly /></div>}
    </div>;
};
