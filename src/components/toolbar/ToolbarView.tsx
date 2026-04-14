import { CreateLinkEvent, Dispose, DropBounce, EaseOut, GetSessionDataManager, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait, YouTubeRoomSettingsEvent } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue, MessengerIconState, OpenMessengerChat, setYoutubeRoomEnabled, VisitDesktop } from '../../api';
import { Flex, LayoutAvatarImageView, LayoutItemCountView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useNitroEvent, useSessionInfo } from '../../hooks';
import { ToolbarItemView } from './ToolbarItemView';
import { ToolbarMeView } from './ToolbarMeView';
import { YouTubePlayerView } from './YouTubePlayerView';

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    const [ isMeExpanded, setMeExpanded ] = useState(false);
    const [ useGuideTool, setUseGuideTool ] = useState(false);
    const [ youtubeEnabled, setYoutubeEnabled ] = useState(false);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const isMod = GetSessionDataManager().isModerator;

    useMessageEvent<YouTubeRoomSettingsEvent>(YouTubeRoomSettingsEvent, event =>
    {
        const enabled = event.getParser().youtubeEnabled;
        setYoutubeEnabled(enabled);
        setYoutubeRoomEnabled(enabled);
    });

    useEffect(() => {
        if (!isInRoom) {
            setYoutubeEnabled(false);
            setYoutubeRoomEnabled(false);
        }
    }, [isInRoom]);

    const openYouTubePlayer = () =>
    {
        window.dispatchEvent(new CustomEvent('youtube:toggle'));
    };

    useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, event =>
    {
        setUseGuideTool(event.getParser().isAllowed(PerkEnum.USE_GUIDE_TOOL));
    });

    useNitroEvent<NitroToolbarAnimateIconEvent>(NitroToolbarAnimateIconEvent.ANIMATE_ICON, event =>
    {
        const animationIconToToolbar = (iconName: string, image: HTMLImageElement, x: number, y: number) =>
        {
            const target = (document.body.getElementsByClassName(iconName)[0] as HTMLElement);

            if(!target) return;

            image.className = 'toolbar-icon-animation';
            image.style.visibility = 'visible';
            image.style.left = (x + 'px');
            image.style.top = (y + 'px');

            document.body.append(image);

            const targetBounds = target.getBoundingClientRect();
            const imageBounds = image.getBoundingClientRect();

            const left = (imageBounds.x - targetBounds.x);
            const top = (imageBounds.y - targetBounds.y);
            const squared = Math.sqrt(((left * left) + (top * top)));
            const wait = (500 - Math.abs(((((1 / squared) * 100) * 500) * 0.5)));
            const height = 20;

            const motionName = (`ToolbarBouncing[${ iconName }]`);

            if(!Motions.getMotionByTag(motionName))
            {
                Motions.runMotion(new Queue(new Wait((wait + 8)), new DropBounce(target, 400, 12))).tag = motionName;
            }

            const motion = new Queue(new EaseOut(new JumpBy(image, wait, ((targetBounds.x - imageBounds.x) + height), (targetBounds.y - imageBounds.y), 100, 1), 1), new Dispose(image));

            Motions.runMotion(motion);
        };

        animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
    });

    return (
        <>
            { youtubeEnabled && <YouTubePlayerView /> }
            <AnimatePresence> { isMeExpanded && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
					<ToolbarMeView setMeExpanded={ setMeExpanded } unseenAchievementCount={ getTotalUnseen } useGuideTool={ useGuideTool } />
				</motion.div> )}
			</AnimatePresence>
            <Flex alignItems="center" className="absolute bottom-0 left-0 w-full h-[55px] bg-[rgba(28,28,32,.95)] [box-shadow:inset_0_5px_#22222799,inset_0_-4px_#12121599] py-1 px-3" gap={ 2 }>
                <Flex alignItems="center" gap={ 2 } className="flex-shrink-0">
                    <Flex center pointer className={ 'relative w-[50px] h-[45px] overflow-hidden ' + (isMeExpanded ? 'active ' : '') } onClick={ event =>
                    {
                        setMeExpanded(!isMeExpanded);
                        event.stopPropagation();
                    } }>
                        <LayoutAvatarImageView className="-ml-[5px] mt-[25px]" direction={ 2 } figure={ userFigure } position="absolute" />
                        { (getTotalUnseen > 0) &&
                            <LayoutItemCountView count={ getTotalUnseen } /> }
                    </Flex>
                    { isInRoom &&
                        <ToolbarItemView icon="habbo" onClick={ event => VisitDesktop() } /> }
                    { !isInRoom &&
                        <ToolbarItemView icon="house" onClick={ event => CreateLinkEvent('navigator/goto/home') } /> }
                    <ToolbarItemView icon="rooms" onClick={ event => CreateLinkEvent('navigator/toggle') } />
                    { GetConfigurationValue('game.center.enabled') &&
                        <ToolbarItemView icon="game" onClick={ event => CreateLinkEvent('games/toggle') } /> }
                    <ToolbarItemView icon="catalog" onClick={ event => CreateLinkEvent('catalog/toggle') } />
                    <ToolbarItemView icon="inventory" onClick={ event => CreateLinkEvent('inventory/toggle') }>
                        { (getFullCount > 0) &&
                            <LayoutItemCountView count={ getFullCount } /> }
                    </ToolbarItemView>
                    { isInRoom &&
                        <ToolbarItemView icon="camera" onClick={ event => CreateLinkEvent('camera/toggle') } /> }
                    { youtubeEnabled &&
                        <ToolbarItemView icon="youtube" onClick={ openYouTubePlayer } /> }
                    { isMod &&
                        <ToolbarItemView icon="modtools" onClick={ event => CreateLinkEvent('mod-tools/toggle') } /> }
                    { isMod &&
                        <ToolbarItemView icon="furnieditor" onClick={ event => CreateLinkEvent('furni-editor/toggle') } /> }
                </Flex>
                <Flex alignItems="center" justifyContent="center" className="lg:flex-1 lg:min-w-0 lg:max-w-[600px] lg:mx-auto max-lg:flex-none max-lg:w-0 max-lg:max-w-0 max-lg:overflow-visible" id="toolbar-chat-input-container" />
                <Flex alignItems="center" gap={ 2 } className="flex-shrink-0">
                    <Flex gap={ 2 }>
                        <ToolbarItemView icon="friendall" onClick={ event => CreateLinkEvent('friends/toggle') }>
                            { (requests.length > 0) &&
                                <LayoutItemCountView count={ requests.length } /> }
                        </ToolbarItemView>
                        { ((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
                            <ToolbarItemView className={ (iconState === MessengerIconState.UNREAD) && 'is-unseen' } icon="message" onClick={ event => OpenMessengerChat() } /> }
                    </Flex>
                    <div className="hidden lg:block" id="toolbar-friend-bar-container" />
                </Flex>
            </Flex>
        </>
    );
};
