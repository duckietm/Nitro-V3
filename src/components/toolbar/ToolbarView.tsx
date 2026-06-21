import {
    CreateLinkEvent,
    Dispose,
    DropBounce,
    EaseOut,
    FindNewFriendsMessageComposer,
    JumpBy,
    Motions,
    NitroToolbarAnimateIconEvent,
    PerkAllowancesMessageEvent,
    PerkEnum,
    Queue,
    Wait,
    YouTubeRoomSettingsEvent
} from '@nitrots/nitro-renderer';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FC, useEffect, useMemo, useState } from 'react';
import {
    GetConfigurationValue,
    isHousekeepingEnabled,
    MessengerIconState,
    OpenMessengerChat,
    SendMessageComposer,
    setYoutubeRoomEnabled,
    VisitDesktop
} from '../../api';
import { Flex, LayoutAvatarImageView, LayoutItemCountView } from '../../common';
import {
    useAchievements,
    useFriends,
    useHasPermission,
    useInventoryUnseenTracker,
    useMentionsSnapshot,
    useMessageEvent,
    useMessenger,
    useModTools,
    useNitroEvent,
    useSessionInfo,
    useSoundboard,
    useWiredTools
} from '../../hooks';
import { ToolbarItemView } from './ToolbarItemView';
import { ToolbarMeView } from './ToolbarMeView';
import { YouTubePlayerView } from './YouTubePlayerView';

const containerVariants: Variants = {
    hidden: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
    visible: { transition: { staggerChildren: 0.025 } }
};
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22 } }
};

const shellVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 }
};

const SHELL_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 26 };
const NAV_TRANSITION = { type: 'spring' as const, stiffness: 300, damping: 28 };
const ME_POPOVER_TRANSITION = { type: 'spring' as const, stiffness: 420, damping: 28 };

export const ToolbarView: FC<{ isInRoom: boolean }> = (props) => {
    const { isInRoom } = props;
    const [isMeExpanded, setMeExpanded] = useState(false);
    const [isTouchLayout, setIsTouchLayout] = useState(false);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [staffStackBottom, setStaffStackBottom] = useState<number | null>(null);
    const [useGuideTool, setUseGuideTool] = useState(false);
    const [youtubeEnabled, setYoutubeEnabled] = useState(false);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const { unreadCount: mentionsUnread = 0 } = useMentionsSnapshot();
    const mentionsEnabled = useMemo(() => GetConfigurationValue<boolean>('mentions_ui.enabled', true), []);
    const buildersClubEnabled = useMemo(
        () => GetConfigurationValue<boolean>('buildersclub.enabled', GetConfigurationValue<boolean>('toolbar.buildersclub.enabled', true)),
        []
    );
    const rareValuesEnabled = useMemo(() => GetConfigurationValue<boolean>('toolbar.rarevalues.enabled', true), []);
    const fortuneWheelEnabled = useMemo(() => GetConfigurationValue<boolean>('toolbar.fortunewheel.enabled', true), []);
    const { openMonitor, showToolbarButton } = useWiredTools();
    const { enabled: soundboardEnabled, reset: resetSoundboard } = useSoundboard();
    const isMod = useHasPermission('acc_supporttool');
    const isHk = useHasPermission('acc_housekeeping');
    const hkEnabled = useMemo(() => isHousekeepingEnabled(), []);
    const { tickets = [] } = useModTools();
    const openTicketsCount = useMemo(() => (isMod ? tickets.filter((ticket) => ticket && ticket.state === 1).length : 0), [isMod, tickets]);
    const visibilityVariant = 'visible';

    const compactFramePosition = 'bottom-[90px] min-[1700px]:bottom-[7px]';
    const mobileOnlyClasses = isTouchLayout ? '' : 'min-[1700px]:hidden';
    const desktopBlockClasses = isTouchLayout ? 'hidden' : 'hidden min-[1700px]:block';
    const desktopFlexClasses = isTouchLayout ? 'hidden' : 'hidden min-[1700px]:flex';
    const leftNavVariants = useMemo<Variants>(
        () => ({
            hidden: { opacity: 0, x: isInRoom ? -10 : 0, y: isInRoom ? 0 : 8, pointerEvents: 'none' },
            visible: { opacity: 1, x: 0, y: 0, pointerEvents: 'auto' }
        }),
        [isInRoom]
    );
    const rightNavVariants = useMemo<Variants>(
        () => ({
            hidden: { opacity: 0, x: 10, pointerEvents: 'none' },
            visible: { opacity: 1, x: 0, pointerEvents: 'auto' }
        }),
        []
    );
    const mobileNavVariants = useMemo<Variants>(
        () => ({
            hidden: { opacity: 0, y: 8, pointerEvents: 'none' },
            visible: { opacity: 1, y: 0, pointerEvents: 'auto' }
        }),
        []
    );

    useMessageEvent<YouTubeRoomSettingsEvent>(YouTubeRoomSettingsEvent, (event) => {
        const enabled = event.getParser().youtubeEnabled;
        setYoutubeEnabled(enabled);
        setYoutubeRoomEnabled(enabled);
    });

    useEffect(() => {
        if (!isInRoom) {
            setYoutubeEnabled(false);
            setYoutubeRoomEnabled(false);
            resetSoundboard();
        }
    }, [isInRoom, resetSoundboard]);

    useEffect(() => {
        const query = window.matchMedia('(pointer: coarse), (hover: none)');
        const updateTouchLayout = () => setIsTouchLayout(query.matches);

        updateTouchLayout();
        query.addEventListener('change', updateTouchLayout);

        return () => query.removeEventListener('change', updateTouchLayout);
    }, []);

    // Keep the left staff-tools stack pinned 15px above the room tools rail
    // (its height is dynamic, so measure it). Falls back to null (CSS
    // default) when the room tools aren't present, e.g. outside a room.
    useEffect(() => {
        const measure = () => {
            const roomTools = document.querySelector('.nitro-room-tools-container') as HTMLElement | null;
            const next = roomTools ? Math.max(8, Math.round(window.innerHeight - roomTools.getBoundingClientRect().top + 15)) : null;

            setStaffStackBottom((prevValue) => (prevValue === next ? prevValue : next));
        };

        measure();

        const interval = window.setInterval(measure, 400);
        window.addEventListener('resize', measure);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('resize', measure);
        };
    }, [isInRoom]);

    const openYouTubePlayer = () => window.dispatchEvent(new CustomEvent('youtube:toggle'));

    useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, (event) => {
        setUseGuideTool(event.getParser().isAllowed(PerkEnum.USE_GUIDE_TOOL));
    });

    useNitroEvent<NitroToolbarAnimateIconEvent>(NitroToolbarAnimateIconEvent.ANIMATE_ICON, (event) => {
        const animationIconToToolbar = (iconName: string, image: HTMLImageElement, x: number, y: number) => {
            const target = document.body.getElementsByClassName(iconName)[0] as HTMLElement;

            if (!target) return;

            image.className = 'toolbar-icon-animation';
            image.style.visibility = 'visible';
            image.style.left = x + 'px';
            image.style.top = y + 'px';

            document.body.append(image);

            const targetBounds = target.getBoundingClientRect();
            const imageBounds = image.getBoundingClientRect();
            const left = imageBounds.x - targetBounds.x;
            const top = imageBounds.y - targetBounds.y;
            const squared = Math.sqrt(left * left + top * top);
            const wait = 500 - Math.abs((1 / squared) * 100 * 500 * 0.5);
            const height = 20;
            const motionName = `ToolbarBouncing[${iconName}]`;

            if (!Motions.getMotionByTag(motionName)) {
                Motions.runMotion(new Queue(new Wait(wait + 8), new DropBounce(target, 400, 12))).tag = motionName;
            }

            const motion = new Queue(
                new EaseOut(new JumpBy(image, wait, targetBounds.x - imageBounds.x + height, targetBounds.y - imageBounds.y, 100, 1), 1),
                new Dispose(image)
            );

            Motions.runMotion(motion);
        };

        animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
    });

    return (
        <>
            {youtubeEnabled && <YouTubePlayerView />}

            {isInRoom && (
                <div
                    className={`tb-frame fixed ${compactFramePosition} left-1/2 -translate-x-1/2 z-40 flex h-[38px] w-[420px] max-w-[95vw] items-center px-[6px] py-[4px] pointer-events-none`}
                >
                    <Flex
                        alignItems="center"
                        justifyContent="center"
                        className="pointer-events-auto h-full w-full min-w-0 flex-1"
                        id="toolbar-chat-input-container"
                    />
                </div>
            )}

            <motion.div
                initial="visible"
                animate={visibilityVariant}
                variants={shellVariants}
                transition={SHELL_TRANSITION}
                className={`pointer-events-none fixed bottom-0 left-0 right-0 z-[39] h-[52px] rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(62,64,72,0.55)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)] ${desktopBlockClasses}`}
            />

            <motion.div
                initial="visible"
                animate={visibilityVariant}
                variants={leftNavVariants}
                transition={NAV_TRANSITION}
                className={`tb-nav-clip fixed bottom-0 left-0 z-40 h-[52px] max-w-[calc(50vw-242px)] items-center pl-3 ${desktopFlexClasses}`}
            >
                <button
                    type="button"
                    onClick={() => setLeftCollapsed((value) => !value)}
                    aria-label="Mostra/Nascondi icone"
                    className="tb-collapse pointer-events-auto mt-[6px] mr-[3px]"
                >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={leftCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                    </svg>
                </button>
                <motion.div
                    variants={containerVariants}
                    className="tb-open-shell flex h-[52px] max-w-full items-center gap-2 overflow-visible bg-transparent px-[8px] pt-[10px] pb-[2px]"
                >
                    {!leftCollapsed && (
                        <>
                            <motion.div variants={itemVariants}>
                                {isInRoom ? (
                                    <ToolbarItemView icon="habbo" onClick={() => VisitDesktop()} className="tb-icon" />
                                ) : (
                                    <ToolbarItemView icon="house" onClick={() => CreateLinkEvent('navigator/goto/home')} className="tb-icon" />
                                )}
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <ToolbarItemView icon="rooms" onClick={() => CreateLinkEvent('navigator/toggle')} className="tb-icon" />
                            </motion.div>
                            {GetConfigurationValue('game.center.enabled') && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="game" onClick={() => CreateLinkEvent('games/toggle')} className="tb-icon" />
                                </motion.div>
                            )}
                        </>
                    )}
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="catalog" onClick={() => CreateLinkEvent('catalog/toggle/normal')} className="tb-icon" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative">
                        <AnimatePresence>
                            {isMeExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={ME_POPOVER_TRANSITION}
                                    className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2"
                                >
                                    <ToolbarMeView setMeExpanded={setMeExpanded} unseenAchievementCount={getTotalUnseen} useGuideTool={useGuideTool} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div
                            className="cursor-pointer relative h-[40px] w-[40px] overflow-hidden"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(event) => {
                                setMeExpanded((value) => !value);
                                event.stopPropagation();
                            }}
                        >
                            <LayoutAvatarImageView headOnly={true} direction={2} figure={userFigure} className="tb-icon tb-avatar-head" />
                        </motion.div>
                        {getTotalUnseen > 0 && <LayoutItemCountView count={getTotalUnseen} className="pointer-events-none absolute -right-1 -top-1 z-10" />}
                    </motion.div>
                    {buildersClubEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="buildersclub" onClick={() => CreateLinkEvent('catalog/toggle/builder')} className="tb-icon" />
                        </motion.div>
                    )}
                    <motion.div variants={itemVariants} className="relative">
                        <ToolbarItemView icon="inventory" onClick={() => CreateLinkEvent('inventory/toggle')} className="tb-icon" />
                        {getFullCount > 0 && <LayoutItemCountView count={getFullCount} className="absolute -right-1 top-0" />}
                    </motion.div>
                    {!leftCollapsed && (
                        <>
                            {rareValuesEnabled && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="rare-values" onClick={() => CreateLinkEvent('rare-values/toggle')} className="tb-icon" />
                                </motion.div>
                            )}
                            {fortuneWheelEnabled && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="fortune-wheel" onClick={() => CreateLinkEvent('fortune-wheel/toggle')} className="tb-icon" />
                                </motion.div>
                            )}
                            {isInRoom && showToolbarButton && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="wired-tools" onClick={openMonitor} className="tb-icon" />
                                </motion.div>
                            )}
                        </>
                    )}
                    {isInRoom && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="camera" onClick={() => CreateLinkEvent('camera/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                    {!leftCollapsed && (
                        <>
                            {isInRoom && youtubeEnabled && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="youtube" onClick={openYouTubePlayer} className="tb-icon" />
                                </motion.div>
                            )}
                            {isInRoom && soundboardEnabled && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView icon="soundboard" onClick={() => CreateLinkEvent('soundboard/toggle')} className="tb-icon" />
                                </motion.div>
                            )}
                        </>
                    )}
                    {isMod && (
                        <motion.div variants={itemVariants} className="relative">
                            <ToolbarItemView icon="modtools" onClick={() => CreateLinkEvent('mod-tools/toggle')} className="tb-icon" />
                            {openTicketsCount > 0 && (
                                <LayoutItemCountView count={openTicketsCount} className="pointer-events-none absolute -right-1 -top-1 z-10" />
                            )}
                        </motion.div>
                    )}
                    {isHk && hkEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="housekeeping" onClick={() => CreateLinkEvent('housekeeping/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                    {isMod && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="furnieditor" onClick={() => CreateLinkEvent('furni-editor/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
            <motion.div
                initial="visible"
                animate={visibilityVariant}
                variants={rightNavVariants}
                transition={NAV_TRANSITION}
                className={`tb-nav-clip fixed bottom-0 z-40 h-[52px] max-w-[calc(50vw-242px)] items-center pr-3 ${desktopFlexClasses} ${isInRoom ? 'right-0' : 'right-3'}`}
            >
                <motion.div
                    variants={containerVariants}
                    className="tb-open-shell flex h-[52px] max-w-full items-center gap-3 overflow-visible bg-transparent px-[8px] pt-[10px] pb-[2px]"
                >
                    <motion.div variants={itemVariants} className="relative">
                        <ToolbarItemView icon="friendall" onClick={() => CreateLinkEvent('friends/toggle')} className="tb-icon" />
                        {requests.length > 0 && <LayoutItemCountView count={requests.length} className="absolute -right-2 -top-1" />}
                    </motion.div>
                    {rightCollapsed && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="friendsearch" onClick={() => SendMessageComposer(new FindNewFriendsMessageComposer())} className="tb-icon" />
                        </motion.div>
                    )}
                    {!rightCollapsed && (
                        <>
                            {mentionsEnabled && (
                                <motion.div variants={itemVariants} className="relative">
                                    <ToolbarItemView icon="mentions" onClick={() => CreateLinkEvent('mentions/toggle')} className="tb-icon" />
                                    {mentionsUnread > 0 && <LayoutItemCountView count={mentionsUnread} className="absolute -right-2 -top-1" />}
                                </motion.div>
                            )}
                            {(iconState === MessengerIconState.SHOW || iconState === MessengerIconState.UNREAD) && (
                                <motion.div variants={itemVariants}>
                                    <ToolbarItemView
                                        className={`tb-icon ${iconState === MessengerIconState.UNREAD ? 'is-unseen animate-pulse' : ''}`}
                                        icon="message"
                                        onClick={() => OpenMessengerChat()}
                                    />
                                </motion.div>
                            )}
                            <div className={`mx-1 h-5 w-[1px] bg-white/20 ${desktopBlockClasses}`} />
                            <div className={`h-full shrink-0 ${desktopBlockClasses}`} id="toolbar-friend-bar-container-desktop" />
                        </>
                    )}
                </motion.div>
                <button
                    type="button"
                    onClick={() => setRightCollapsed((value) => !value)}
                    aria-label="Mostra/Nascondi icone"
                    className="tb-collapse pointer-events-auto mt-[6px] ml-[3px]"
                >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={rightCollapsed ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                    </svg>
                </button>
            </motion.div>
            <motion.div
                initial="visible"
                animate={visibilityVariant}
                variants={mobileNavVariants}
                transition={NAV_TRANSITION}
                className={`fixed left-1/2 bottom-0 z-40 flex w-[95vw] -translate-x-1/2 items-center overflow-visible ${mobileOnlyClasses} ${isInRoom ? 'rounded-[12px] border border-white/8 bg-[rgba(62,64,72,0.55)] px-[6px] py-[4px] mb-[3px] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]' : ''}`}
            >
                <motion.div
                    variants={containerVariants}
                    className="tb-bar-scroll flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-visible px-1"
                >
                    <motion.div variants={itemVariants}>
                        {isInRoom ? (
                            <ToolbarItemView icon="habbo" onClick={() => VisitDesktop()} className="tb-icon" />
                        ) : (
                            <ToolbarItemView icon="house" onClick={() => CreateLinkEvent('navigator/goto/home')} className="tb-icon" />
                        )}
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="rooms" onClick={() => CreateLinkEvent('navigator/toggle')} className="tb-icon" />
                    </motion.div>
                    {GetConfigurationValue('game.center.enabled') && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="game" onClick={() => CreateLinkEvent('games/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="catalog" onClick={() => CreateLinkEvent('catalog/toggle/normal')} className="tb-icon" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative shrink-0">
                        <AnimatePresence>
                            {isMeExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={ME_POPOVER_TRANSITION}
                                    className="pointer-events-auto fixed bottom-[calc(100%+10px)] left-1/2 z-[70] -translate-x-1/2"
                                >
                                    <ToolbarMeView setMeExpanded={setMeExpanded} unseenAchievementCount={getTotalUnseen} useGuideTool={useGuideTool} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div
                            className="cursor-pointer relative h-[40px] w-[40px] overflow-hidden"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(event) => {
                                setMeExpanded((value) => !value);
                                event.stopPropagation();
                            }}
                        >
                            <LayoutAvatarImageView headOnly={true} direction={2} figure={userFigure} className="tb-icon tb-avatar-head" />
                        </motion.div>
                        {getTotalUnseen > 0 && <LayoutItemCountView count={getTotalUnseen} className="pointer-events-none absolute -right-1 -top-1 z-10" />}
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative">
                        <ToolbarItemView icon="inventory" onClick={() => CreateLinkEvent('inventory/toggle')} className="tb-icon" />
                        {getFullCount > 0 && <LayoutItemCountView count={getFullCount} className="absolute -right-1 top-0" />}
                    </motion.div>
                    {rareValuesEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="rare-values" onClick={() => CreateLinkEvent('rare-values/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                    {fortuneWheelEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="fortune-wheel" onClick={() => CreateLinkEvent('fortune-wheel/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                </motion.div>
                <motion.div variants={containerVariants} className="tb-bar-scroll flex h-full items-center gap-2 overflow-x-auto overflow-y-visible px-1">
                    {isInRoom && showToolbarButton && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="wired-tools" onClick={openMonitor} className="tb-icon" />
                        </motion.div>
                    )}
                    {isInRoom && youtubeEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="youtube" onClick={openYouTubePlayer} className="tb-icon" />
                        </motion.div>
                    )}
                    {isInRoom && soundboardEnabled && (
                        <motion.div variants={itemVariants}>
                            <ToolbarItemView icon="soundboard" onClick={() => CreateLinkEvent('soundboard/toggle')} className="tb-icon" />
                        </motion.div>
                    )}
                    <motion.div variants={itemVariants} className="relative">
                        <ToolbarItemView icon="friendall" onClick={() => CreateLinkEvent('friends/toggle')} className="tb-icon" />
                        {requests.length > 0 && <LayoutItemCountView count={requests.length} className="absolute -right-2 -top-1" />}
                    </motion.div>
                    {mentionsEnabled && (
                        <motion.div variants={itemVariants} className="relative">
                            <ToolbarItemView icon="mentions" onClick={() => CreateLinkEvent('mentions/toggle')} className="tb-icon" />
                            {mentionsUnread > 0 && <LayoutItemCountView count={mentionsUnread} className="absolute -right-2 -top-1" />}
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
            {/* Mobile side tools — moved out of the bottom bar into a
                 vertical pill stack on the left edge so the bottom bar has
                 room. Optional Builders Club, plus camera in-room
                 and the staff-only tools when permitted. */}
            <motion.div
                initial="visible"
                animate={visibilityVariant}
                variants={mobileNavVariants}
                transition={NAV_TRANSITION}
                style={staffStackBottom != null ? { top: 'auto', bottom: `${staffStackBottom}px` } : undefined}
                className={`fixed left-1 z-40 flex flex-col items-center gap-2 rounded-[12px] border border-white/8 bg-[rgba(62,64,72,0.55)] px-[4px] py-[6px] shadow-[0_6px_18px_rgba(0,0,0,0.18)] ${staffStackBottom == null ? 'top-1/2 -translate-y-1/2' : ''} ${mobileOnlyClasses}`}
            >
                {buildersClubEnabled && (
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="buildersclub" onClick={() => CreateLinkEvent('catalog/toggle/builder')} className="tb-icon" />
                    </motion.div>
                )}
                {isInRoom && (
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="camera" onClick={() => CreateLinkEvent('camera/toggle')} className="tb-icon" />
                    </motion.div>
                )}
                {isMod && (
                    <motion.div variants={itemVariants} className="relative">
                        <ToolbarItemView icon="modtools" onClick={() => CreateLinkEvent('mod-tools/toggle')} className="tb-icon" />
                        {openTicketsCount > 0 && <LayoutItemCountView count={openTicketsCount} className="pointer-events-none absolute -right-1 -top-1 z-10" />}
                    </motion.div>
                )}
                {isHk && hkEnabled && (
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="housekeeping" onClick={() => CreateLinkEvent('housekeeping/toggle')} className="tb-icon" />
                    </motion.div>
                )}
                {isMod && (
                    <motion.div variants={itemVariants}>
                        <ToolbarItemView icon="furnieditor" onClick={() => CreateLinkEvent('furni-editor/toggle')} className="tb-icon" />
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};
