import { CreateLinkEvent, Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait, YouTubeRoomSettingsEvent } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue, isHousekeepingEnabled, MessengerIconState, OpenMessengerChat, setYoutubeRoomEnabled, VisitDesktop } from '../../api';
import { Flex, LayoutAvatarImageView, LayoutItemCountView } from '../../common';
import { useAchievements, useFriends, useHasPermission, useInventoryUnseenTracker, useMessageEvent, useMessenger, useModTools, useNitroEvent, useSessionInfo, useSoundboard, useWiredTools } from '../../hooks';
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
const TOGGLE_LOCK_MS = 220;

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    const [ isMeExpanded, setMeExpanded ] = useState(false);
    const [ isToolbarOpen, setIsToolbarOpen ] = useState(false);
    const [ isTouchLayout, setIsTouchLayout ] = useState(false);
    const [ useGuideTool, setUseGuideTool ] = useState(false);
    const [ youtubeEnabled, setYoutubeEnabled ] = useState(false);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const { openMonitor, showToolbarButton } = useWiredTools();
    const { enabled: soundboardEnabled, reset: resetSoundboard } = useSoundboard();
    const isMod = useHasPermission('acc_supporttool');
    const isHk = useHasPermission('acc_housekeeping');
    const hkEnabled = useMemo(() => isHousekeepingEnabled(), []);
    const { tickets = [] } = useModTools();
    const openTicketsCount = useMemo(
        () => isMod ? tickets.filter(ticket => ticket && (ticket.state === 1)).length : 0,
        [ isMod, tickets ]
    );
    const isVisible = (isToolbarOpen || !isInRoom);
    const visibilityVariant = isVisible ? 'visible' : 'hidden';
    const toggleLockRef = useRef(false);
    const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () =>
    {
        if(toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
    }, []);

    const handleToggleClick = useCallback(() =>
    {
        if(toggleLockRef.current) return;
        toggleLockRef.current = true;
        setIsToolbarOpen(value => !value);
        if(toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
        toggleTimeoutRef.current = setTimeout(() => { toggleLockRef.current = false; }, TOGGLE_LOCK_MS);
    }, []);

    const compactFramePosition = (isToolbarOpen && isInRoom) ? 'bottom-[90px] min-[1700px]:bottom-0' : 'bottom-0';
    const mobileOnlyClasses = isTouchLayout ? '' : 'min-[1700px]:hidden';
    const desktopBlockClasses = isTouchLayout ? 'hidden' : 'hidden min-[1700px]:block';
    const desktopFlexClasses = isTouchLayout ? 'hidden' : 'hidden min-[1700px]:flex';
    const leftNavVariants = useMemo<Variants>(() => ({
        hidden: { opacity: 0, x: isInRoom ? -10 : 0, y: isInRoom ? 0 : 8, pointerEvents: 'none' },
        visible: { opacity: 1, x: 0, y: 0, pointerEvents: 'auto' }
    }), [ isInRoom ]);
    const rightNavVariants = useMemo<Variants>(() => ({
        hidden: { opacity: 0, x: 10, pointerEvents: 'none' },
        visible: { opacity: 1, x: 0, pointerEvents: 'auto' }
    }), []);
    const mobileNavVariants = useMemo<Variants>(() => ({
        hidden: { opacity: 0, y: 8, pointerEvents: 'none' },
        visible: { opacity: 1, y: 0, pointerEvents: 'auto' }
    }), []);

    useMessageEvent<YouTubeRoomSettingsEvent>(YouTubeRoomSettingsEvent, event =>
    {
        const enabled = event.getParser().youtubeEnabled;
        setYoutubeEnabled(enabled);
        setYoutubeRoomEnabled(enabled);
    });

    useEffect(() =>
    {
        if(!isInRoom)
        {
            setYoutubeEnabled(false);
            setYoutubeRoomEnabled(false);
            resetSoundboard();
        }
    }, [ isInRoom, resetSoundboard ]);

    useEffect(() =>
    {
        const query = window.matchMedia('(pointer: coarse), (hover: none)');
        const updateTouchLayout = () => setIsTouchLayout(query.matches);

        updateTouchLayout();
        query.addEventListener('change', updateTouchLayout);

        return () => query.removeEventListener('change', updateTouchLayout);
    }, []);

    const openYouTubePlayer = () => window.dispatchEvent(new CustomEvent('youtube:toggle'));

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
            <style>{ TOOLBAR_STYLES }</style>
            { youtubeEnabled && <YouTubePlayerView /> }

            { isInRoom &&
                <div className={ `tb-frame fixed ${ compactFramePosition } left-1/2 -translate-x-1/2 z-40 flex h-[38px] w-[420px] max-w-[95vw] items-center px-[6px] py-[4px] pointer-events-none` }>
                    <motion.div
                        className="tb-toggle pointer-events-auto mr-2 flex-shrink-0"
                        onClick={ handleToggleClick }
                        whileTap={ { scale: 0.9 } }>
                        <motion.svg
                            className="h-3.5 w-3.5 text-white/70"
                            animate={ { rotate: isToolbarOpen ? 180 : 0 } }
                            transition={ { type: 'spring', stiffness: 320, damping: 24 } }
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2.5 } d="M5 15l7-7 7 7" />
                        </motion.svg>
                    </motion.div>
                    <Flex
                        alignItems="center"
                        justifyContent="center"
                        className="pointer-events-auto h-full w-full min-w-0 flex-1"
                        id="toolbar-chat-input-container" />
                </div> }

            <motion.div
                initial="hidden"
                animate={ visibilityVariant }
                variants={ shellVariants }
                transition={ SHELL_TRANSITION }
                className={ `pointer-events-none fixed bottom-0 left-0 right-0 z-[39] h-[52px] rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)] ${ desktopBlockClasses }` } />

            <motion.div
                initial="hidden"
                animate={ visibilityVariant }
                variants={ leftNavVariants }
                transition={ NAV_TRANSITION }
                className={ `tb-nav-clip fixed bottom-0 left-0 z-40 h-[52px] max-w-[calc(50vw-242px)] items-center pl-3 ${ desktopFlexClasses }` }>
                <motion.div
                    variants={ containerVariants }
                    className="tb-open-shell flex h-[52px] max-w-full items-center gap-2 overflow-visible bg-transparent px-[8px] pt-[10px] pb-[2px]">
                    <motion.div variants={ itemVariants }>
                        { isInRoom
                            ? <ToolbarItemView icon="habbo" onClick={ () => VisitDesktop() } className="tb-icon" />
                            : <ToolbarItemView icon="house" onClick={ () => CreateLinkEvent('navigator/goto/home') } className="tb-icon" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="rooms" onClick={ () => CreateLinkEvent('navigator/toggle') } className="tb-icon" />
                    </motion.div>
                    { GetConfigurationValue('game.center.enabled') &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="game" onClick={ () => CreateLinkEvent('games/toggle') } className="tb-icon" />
                        </motion.div> }
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="catalog" onClick={ () => CreateLinkEvent('catalog/toggle/normal') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants } className="relative">
                        <AnimatePresence>
                            { isMeExpanded &&
                                <motion.div
                                    initial={ { opacity: 0, y: 6, scale: 0.97 } }
                                    animate={ { opacity: 1, y: 0, scale: 1 } }
                                    exit={ { opacity: 0, y: 6, scale: 0.97 } }
                                    transition={ ME_POPOVER_TRANSITION }
                                    className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2">
                                    <ToolbarMeView setMeExpanded={ setMeExpanded } unseenAchievementCount={ getTotalUnseen } useGuideTool={ useGuideTool } />
                                </motion.div> }
                        </AnimatePresence>
                        <motion.div
                            className="cursor-pointer relative h-[40px] w-[40px] overflow-hidden"
                            whileHover={ { scale: 1.08 } }
                            whileTap={ { scale: 0.95 } }
                            onClick={ event =>
                            {
                                setMeExpanded(value => !value);
                                event.stopPropagation();
                            } }>
                            <LayoutAvatarImageView headOnly={ true } direction={ 2 } figure={ userFigure } className="tb-icon" style={ { backgroundSize: 'auto', backgroundPosition: '-25px -38px' } } />
                        </motion.div>
                        { (getTotalUnseen > 0) &&
                            <LayoutItemCountView count={ getTotalUnseen } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="buildersclub" onClick={ () => CreateLinkEvent('catalog/toggle/builder') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants } className="relative">
                        <ToolbarItemView icon="inventory" onClick={ () => CreateLinkEvent('inventory/toggle') } className="tb-icon" />
                        { (getFullCount > 0) &&
                            <LayoutItemCountView count={ getFullCount } className="absolute -right-1 top-0" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="rare-values" onClick={ () => CreateLinkEvent('rare-values/toggle') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="fortune-wheel" onClick={ () => CreateLinkEvent('fortune-wheel/toggle') } className="tb-icon" />
                    </motion.div>
                    { (isInRoom && showToolbarButton) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="wired-tools" onClick={ openMonitor } className="tb-icon" />
                        </motion.div> }
                    { isInRoom &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="camera" onClick={ () => CreateLinkEvent('camera/toggle') } className="tb-icon" />
                        </motion.div> }
                    { (isInRoom && youtubeEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="youtube" onClick={ openYouTubePlayer } className="tb-icon" />
                        </motion.div> }
                    { (isInRoom && soundboardEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="soundboard" onClick={ () => CreateLinkEvent('soundboard/toggle') } className="tb-icon" />
                        </motion.div> }
                    { isMod &&
                        <motion.div variants={ itemVariants } className="relative">
                            <ToolbarItemView icon="modtools" onClick={ () => CreateLinkEvent('mod-tools/toggle') } className="tb-icon" />
                            { (openTicketsCount > 0) &&
                                <LayoutItemCountView count={ openTicketsCount } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                        </motion.div> }
                    { (isHk && hkEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="housekeeping" onClick={ () => CreateLinkEvent('housekeeping/toggle') } className="tb-icon" />
                        </motion.div> }
                    { isMod &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="furnieditor" onClick={ () => CreateLinkEvent('furni-editor/toggle') } className="tb-icon" />
                        </motion.div> }
                </motion.div>
            </motion.div>
            <motion.div
                initial="hidden"
                animate={ visibilityVariant }
                variants={ rightNavVariants }
                transition={ NAV_TRANSITION }
                className={ `tb-nav-clip fixed bottom-0 z-40 h-[52px] max-w-[calc(50vw-242px)] items-center pr-3 ${ desktopFlexClasses } ${ isInRoom ? 'right-0' : 'right-3' }` }>
                <motion.div
                    variants={ containerVariants }
                    className="tb-open-shell flex h-[52px] max-w-full items-center gap-3 overflow-visible bg-transparent px-[8px] pt-[10px] pb-[2px]">
                    <motion.div variants={ itemVariants } className="relative">
                        <ToolbarItemView icon="friendall" onClick={ () => CreateLinkEvent('friends/toggle') } className="tb-icon" />
                        { (requests.length > 0) &&
                            <LayoutItemCountView count={ requests.length } className="absolute -right-2 -top-1" /> }
                    </motion.div>
                    { ((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView className={ `tb-icon ${ iconState === MessengerIconState.UNREAD ? 'is-unseen animate-pulse' : '' }` } icon="message" onClick={ () => OpenMessengerChat() } />
                        </motion.div> }
                    <div className={ `mx-1 h-5 w-[1px] bg-white/20 ${ desktopBlockClasses }` } />
                    <div className={ `h-full shrink-0 ${ desktopBlockClasses }` } id="toolbar-friend-bar-container-desktop" />
                </motion.div>
            </motion.div>
            <motion.div
                initial="hidden"
                animate={ visibilityVariant }
                variants={ mobileNavVariants }
                transition={ NAV_TRANSITION }
                className={ `fixed left-1/2 bottom-0 z-40 flex w-[95vw] -translate-x-1/2 items-center overflow-visible ${ mobileOnlyClasses } ${ isInRoom ? 'rounded-[12px] border border-white/8 bg-[rgba(10,10,12,0.58)] px-[6px] py-[4px] mb-[3px] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]' : '' }` }>
                <motion.div
                    variants={ containerVariants }
                    className="tb-bar-scroll flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-visible px-1">
                    <motion.div variants={ itemVariants }>
                        { isInRoom
                            ? <ToolbarItemView icon="habbo" onClick={ () => VisitDesktop() } className="tb-icon" />
                            : <ToolbarItemView icon="house" onClick={ () => CreateLinkEvent('navigator/goto/home') } className="tb-icon" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="rooms" onClick={ () => CreateLinkEvent('navigator/toggle') } className="tb-icon" />
                    </motion.div>
                    { GetConfigurationValue('game.center.enabled') &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="game" onClick={ () => CreateLinkEvent('games/toggle') } className="tb-icon" />
                        </motion.div> }
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="catalog" onClick={ () => CreateLinkEvent('catalog/toggle/normal') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants } className="relative shrink-0">
                        <AnimatePresence>
                            { isMeExpanded &&
                                <motion.div
                                    initial={ { opacity: 0, y: 6, scale: 0.97 } }
                                    animate={ { opacity: 1, y: 0, scale: 1 } }
                                    exit={ { opacity: 0, y: 6, scale: 0.97 } }
                                    transition={ ME_POPOVER_TRANSITION }
                                    className="pointer-events-auto absolute bottom-[calc(100%+10px)] left-1/2 z-[70] -translate-x-1/2">
                                    <ToolbarMeView setMeExpanded={ setMeExpanded } unseenAchievementCount={ getTotalUnseen } useGuideTool={ useGuideTool } />
                                </motion.div> }
                        </AnimatePresence>
                        <motion.div
                            className="cursor-pointer relative h-[40px] w-[40px] overflow-hidden"
                            whileHover={ { scale: 1.08 } }
                            whileTap={ { scale: 0.95 } }
                            onClick={ event =>
                            {
                                setMeExpanded(value => !value);
                                event.stopPropagation();
                            } }>
                            <LayoutAvatarImageView headOnly={ true } direction={ 2 } figure={ userFigure } className="tb-icon" style={ { backgroundSize: 'auto', backgroundPosition: '-25px -38px' } } />
                        </motion.div>
                        { (getTotalUnseen > 0) &&
                            <LayoutItemCountView count={ getTotalUnseen } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="buildersclub" onClick={ () => CreateLinkEvent('catalog/toggle/builder') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants } className="relative">
                        <ToolbarItemView icon="inventory" onClick={ () => CreateLinkEvent('inventory/toggle') } className="tb-icon" />
                        { (getFullCount > 0) &&
                            <LayoutItemCountView count={ getFullCount } className="absolute -right-1 top-0" /> }
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="rare-values" onClick={ () => CreateLinkEvent('rare-values/toggle') } className="tb-icon" />
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                        <ToolbarItemView icon="fortune-wheel" onClick={ () => CreateLinkEvent('fortune-wheel/toggle') } className="tb-icon" />
                    </motion.div>
                </motion.div>
                <motion.div
                    variants={ containerVariants }
                    className="tb-bar-scroll flex h-full items-center gap-2 overflow-x-auto overflow-y-visible px-1">
                    { (isInRoom && showToolbarButton) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="wired-tools" onClick={ openMonitor } className="tb-icon" />
                        </motion.div> }
                    { isInRoom &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="camera" onClick={ () => CreateLinkEvent('camera/toggle') } className="tb-icon" />
                        </motion.div> }
                    { (isInRoom && youtubeEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="youtube" onClick={ openYouTubePlayer } className="tb-icon" />
                        </motion.div> }
                    { (isInRoom && soundboardEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="soundboard" onClick={ () => CreateLinkEvent('soundboard/toggle') } className="tb-icon" />
                        </motion.div> }
                    { isMod &&
                        <motion.div variants={ itemVariants } className="relative">
                            <ToolbarItemView icon="modtools" onClick={ () => CreateLinkEvent('mod-tools/toggle') } className="tb-icon" />
                            { (openTicketsCount > 0) &&
                                <LayoutItemCountView count={ openTicketsCount } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                        </motion.div> }
                    { (isHk && hkEnabled) &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="housekeeping" onClick={ () => CreateLinkEvent('housekeeping/toggle') } className="tb-icon" />
                        </motion.div> }
                    { isMod &&
                        <motion.div variants={ itemVariants }>
                            <ToolbarItemView icon="furnieditor" onClick={ () => CreateLinkEvent('furni-editor/toggle') } className="tb-icon" />
                        </motion.div> }
                    <motion.div variants={ itemVariants } className="relative">
                        <ToolbarItemView icon="friendall" onClick={ () => CreateLinkEvent('friends/toggle') } className="tb-icon" />
                        { (requests.length > 0) &&
                            <LayoutItemCountView count={ requests.length } className="absolute -right-2 -top-1" /> }
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    );
};

const TOOLBAR_STYLES = `
  /* The frame's background / border / shadow swap when the toolbar
     toggles is a plain class change, so without an explicit
     transition the visuals snap instantly while framer-motion is
     still animating the nav children — looked broken on rapid
     toggles. Easing it over the same timing as the spring smooths
     the burst-click case out. (No 'will-change' here — those props
     change about once per toggle, but a permanent compositor layer
     would be re-rasterised on every browser-window resize tick,
     which is what made dragging the window corner feel sluggish.) */
  .tb-frame {
    transition: background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, border-radius 220ms ease;
  }

  /* Left + right nav containers shrink with the viewport, but the icons
     inside don't. Without horizontal clipping they overflow into the
     centred chat input around the md breakpoint. 'overflow-x: clip'
     clips horizontally WITHOUT creating a scroll container the way
     'overflow-x: hidden' would — so the Me popover that animates
     upwards from the avatar still escapes vertically, and the browser
     doesn't render a stray vertical scrollbar thumb on the nav.
     Negative inset margins on the clip path keep vertical breathing
     room for the popover even on engines that fall back to 'hidden'. */
  .tb-nav-clip {
    overflow-x: clip;
    overflow-y: visible;
    overflow-clip-margin: 0 0 200px 0;
  }

  .tb-icon {
    opacity: 1;
    transition: transform 0.15s ease;
    cursor: pointer;
  }

  .tb-icon:hover {
    transform: translateY(-2px);
  }

  .tb-icon:active {
    transform: translateY(0);
  }

  .tb-toggle {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 9px;
    background: rgba(18, 16, 14, 0.80);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
    transition: background 0.15s, border-color 0.15s;
  }

  .tb-toggle:hover {
    background: rgba(30, 26, 20, 0.88);
    border-color: rgba(255, 255, 255, 0.13);
  }

  .tb-bar-scroll {
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: none;
    -ms-overflow-style: none;
    flex-wrap: nowrap;
  }

  .tb-bar-scroll::-webkit-scrollbar {
    display: none;
  }

  .tb-open-shell {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tb-open-shell::-webkit-scrollbar {
    display: none;
  }
`;
