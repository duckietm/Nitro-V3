import { CreateLinkEvent, Dispose, DropBounce, EaseOut, GetSessionDataManager, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useState } from 'react';
import { GetConfigurationValue, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { Flex, LayoutAvatarImageView, LayoutItemCountView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useNitroEvent, useSessionInfo, useWiredTools } from '../../hooks';
import { ToolbarItemView } from './ToolbarItemView';
import { ToolbarMeView } from './ToolbarMeView';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 as const } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22 } },
    exit: { opacity: 0, y: 6, scale: 0.85, transition: { duration: 0.1 } }
};

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    const [ isMeExpanded, setMeExpanded ] = useState(false);
    const [ isToolbarOpen, setIsToolbarOpen ] = useState(false);
    const [ useGuideTool, setUseGuideTool ] = useState(false);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const { openMonitor, showToolbarButton } = useWiredTools();
    const isMod = GetSessionDataManager().isModerator;
    const hasDesktopUnifiedShell = (isInRoom && isToolbarOpen);
    const showDesktopShell = (isToolbarOpen || !isInRoom);

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

            { isInRoom &&
                <div className={ `fixed bottom-0 left-0 right-0 z-40 flex h-[52px] items-end px-0 pt-[2px] pb-0 pointer-events-none md:left-1/2 md:right-auto md:h-[52px] md:w-[420px] md:-translate-x-1/2 md:items-center md:px-[6px] md:py-[4px] lg:w-[460px] ${ isToolbarOpen ? (hasDesktopUnifiedShell ? 'md:rounded-none md:border-0 md:bg-transparent md:shadow-none rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]' : 'rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]') : 'border-0 bg-transparent shadow-none md:border-0 md:bg-transparent md:shadow-none' }` }>
                    <motion.div
                        className="tb-toggle pointer-events-auto mr-2 mb-[4px] flex-shrink-0 md:mb-0"
                        onClick={ () => setIsToolbarOpen(value => !value) }
                        whileTap={ { scale: 0.9 } }>
                        <svg
                            className={ `h-3.5 w-3.5 text-white/70 transition-transform duration-300 ${ isToolbarOpen ? 'rotate-180 md:-rotate-90' : 'rotate-0 md:rotate-90' }` }
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2.5 } d="M5 15l7-7 7 7" />
                        </svg>
                    </motion.div>
                    <Flex
                        alignItems="center"
                        justifyContent="center"
                        className="pointer-events-auto h-full w-full min-w-0 flex-1 px-[6px] md:px-0"
                        id="toolbar-chat-input-container" />
                    <div className="pointer-events-auto relative mr-[6px] shrink-0 md:hidden">
                        <ToolbarItemView icon="friendall" onClick={ () => CreateLinkEvent('friends/toggle') } className="tb-icon" />
                        { (requests.length > 0) &&
                            <LayoutItemCountView count={ requests.length } className="absolute -right-1 top-0" /> }
                    </div>
                </div> }

            <AnimatePresence>
                { (isToolbarOpen || !isInRoom) &&
                    <>
                        { showDesktopShell &&
                            <motion.div
                                key="desktop-unified-shell"
                                initial={ { opacity: 0, y: 8 } }
                                animate={ { opacity: 1, y: 0 } }
                                exit={ { opacity: 0, y: 8 } }
                                transition={ { type: 'spring', stiffness: 260, damping: 26 } }
                                className="pointer-events-none fixed bottom-0 left-0 right-0 z-[39] hidden h-[52px] rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)] md:block" /> }

                        <motion.div
                            key="left-nav"
                            initial={ { opacity: 0, x: isInRoom ? -10 : 0, y: isInRoom ? 0 : 8 } }
                            animate={ { opacity: 1, x: 0, y: 0 } }
                            exit={ { opacity: 0, x: isInRoom ? -10 : 0, y: isInRoom ? 0 : 8 } }
                            transition={ { type: 'spring', stiffness: 300, damping: 28 } }
                            className="fixed bottom-0 left-0 z-40 hidden h-[52px] max-w-[calc(50vw-242px)] items-center overflow-visible pl-3 pointer-events-auto md:flex">
                            <motion.div variants={ containerVariants } initial="hidden" animate="visible" exit="exit" className={ `tb-open-shell flex h-[52px] max-w-full items-center gap-2 overflow-visible px-[8px] pt-[10px] pb-[2px] ${ showDesktopShell ? 'bg-transparent' : 'rounded-t-[10px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]' }` }>
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
                                    <ToolbarItemView icon="catalog" onClick={ () => CreateLinkEvent('catalog/toggle') } className="tb-icon" />
                                </motion.div>
                                <motion.div variants={ itemVariants } className="relative">
                                    <ToolbarItemView icon="inventory" onClick={ () => CreateLinkEvent('inventory/toggle') } className="tb-icon" />
                                    { (getFullCount > 0) &&
                                        <LayoutItemCountView count={ getFullCount } className="absolute -right-1 top-0" /> }
                                </motion.div>
                                <motion.div variants={ itemVariants } className="relative">
                                    <AnimatePresence>
                                        { isMeExpanded &&
                                            <motion.div
                                                initial={ { opacity: 0, y: 6, scale: 0.97 } }
                                                animate={ { opacity: 1, y: 0, scale: 1 } }
                                                exit={ { opacity: 0, y: 6, scale: 0.97 } }
                                                transition={ { type: 'spring', stiffness: 420, damping: 28 } }
                                                className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2">
                                                <ToolbarMeView setMeExpanded={ setMeExpanded } unseenAchievementCount={ getTotalUnseen } useGuideTool={ useGuideTool } />
                                            </motion.div> }
                                    </AnimatePresence>
                                    <motion.div whileHover={ { scale: 1.08 } } whileTap={ { scale: 0.95 } } className="cursor-pointer" onClick={ event => { setMeExpanded(value => !value); event.stopPropagation(); } }>
                                        <LayoutAvatarImageView headOnly={ true } direction={ 2 } figure={ userFigure } className="tb-icon !h-[44px] !w-[32px] !bg-center !bg-no-repeat" style={ { marginTop: '4px' } } />
                                    </motion.div>
                                    { (getTotalUnseen > 0) &&
                                        <LayoutItemCountView count={ getTotalUnseen } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                                </motion.div>
                                { (isInRoom && showToolbarButton) &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="wired-tools" onClick={ openMonitor } className="tb-icon" />
                                    </motion.div> }
                                { isInRoom &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="camera" onClick={ () => CreateLinkEvent('camera/toggle') } className="tb-icon" />
                                    </motion.div> }
                                { isMod &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="modtools" onClick={ () => CreateLinkEvent('mod-tools/toggle') } className="tb-icon" />
                                    </motion.div> }
                                { isMod &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="furnieditor" onClick={ () => CreateLinkEvent('furni-editor/toggle') } className="tb-icon" />
                                    </motion.div> }
                            </motion.div>
                        </motion.div>

                        <motion.div
                            key="right-nav"
                            initial={ { opacity: 0, x: 10 } }
                            animate={ { opacity: 1, x: 0 } }
                            exit={ { opacity: 0, x: 10 } }
                            transition={ { type: 'spring', stiffness: 300, damping: 28 } }
                            className={ `fixed bottom-0 z-40 hidden h-[52px] max-w-[calc(50vw-242px)] items-center overflow-visible pr-3 pointer-events-auto md:flex ${ isInRoom ? 'right-0' : 'right-3' }` }>
                                <motion.div variants={ containerVariants } initial="hidden" animate="visible" exit="exit" className="tb-open-shell flex h-[52px] max-w-full items-center gap-3 overflow-visible bg-transparent px-[8px] pt-[10px] pb-[2px]">
                                    <motion.div variants={ itemVariants } className="relative">
                                        <ToolbarItemView icon="friendall" onClick={ () => CreateLinkEvent('friends/toggle') } className="tb-icon" />
                                        { (requests.length > 0) &&
                                            <LayoutItemCountView count={ requests.length } className="absolute -right-2 -top-1" /> }
                                    </motion.div>
                                    { ((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
                                        <motion.div variants={ itemVariants }>
                                            <ToolbarItemView className={ `tb-icon ${ iconState === MessengerIconState.UNREAD ? 'is-unseen animate-pulse' : '' }` } icon="message" onClick={ () => OpenMessengerChat() } />
                                        </motion.div> }
                                    <div className="mx-1 hidden h-5 w-[1px] bg-white/20 md:block" />
                                    <div className="hidden h-full shrink-0 md:block" id="toolbar-friend-bar-container-desktop" />
                                </motion.div>
                            </motion.div>

                        <motion.div
                            key="mobile-nav"
                            initial={ { opacity: 0, y: 8 } }
                            animate={ { opacity: 1, y: 0 } }
                            exit={ { opacity: 0, y: 8 } }
                            transition={ { type: 'spring', stiffness: 300, damping: 28 } }
                            className={ `fixed left-1/2 z-40 flex w-[95vw] -translate-x-1/2 items-center overflow-visible pointer-events-auto md:hidden ${ isInRoom ? 'bottom-[52px] rounded-t-[12px] border border-b-0 border-white/8 bg-[rgba(10,10,12,0.58)] px-[6px] py-[4px] shadow-[0_-6px_18px_rgba(0,0,0,0.18)]' : 'bottom-0' }` }>
                            <motion.div variants={ containerVariants } initial="hidden" animate="visible" exit="exit" className="tb-bar-scroll flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-visible px-1">
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
                                    <ToolbarItemView icon="catalog" onClick={ () => CreateLinkEvent('catalog/toggle') } className="tb-icon" />
                                </motion.div>
                                <motion.div variants={ itemVariants } className="relative">
                                    <ToolbarItemView icon="inventory" onClick={ () => CreateLinkEvent('inventory/toggle') } className="tb-icon" />
                                    { (getFullCount > 0) &&
                                        <LayoutItemCountView count={ getFullCount } className="absolute -right-1 top-0" /> }
                                </motion.div>
                            </motion.div>
                            <motion.div variants={ itemVariants } className="relative mx-[2px] shrink-0">
                                <AnimatePresence>
                                    { isMeExpanded &&
                                        <motion.div
                                            initial={ { opacity: 0, y: 6, scale: 0.97 } }
                                            animate={ { opacity: 1, y: 0, scale: 1 } }
                                            exit={ { opacity: 0, y: 6, scale: 0.97 } }
                                            transition={ { type: 'spring', stiffness: 420, damping: 28 } }
                                            className="pointer-events-auto absolute bottom-[calc(100%+10px)] left-1/2 z-[70] -translate-x-1/2">
                                            <ToolbarMeView setMeExpanded={ setMeExpanded } unseenAchievementCount={ getTotalUnseen } useGuideTool={ useGuideTool } />
                                        </motion.div> }
                                    </AnimatePresence>
                                    <motion.div whileHover={ { scale: 1.08 } } whileTap={ { scale: 0.95 } } className="cursor-pointer" onClick={ event => { setMeExpanded(value => !value); event.stopPropagation(); } }>
                                        <LayoutAvatarImageView headOnly={ true } direction={ 2 } figure={ userFigure } className="tb-icon !h-[44px] !w-[32px] !bg-center !bg-no-repeat" style={ { marginTop: '4px' } } />
                                    </motion.div>
                                    { (getTotalUnseen > 0) &&
                                        <LayoutItemCountView count={ getTotalUnseen } className="pointer-events-none absolute -right-1 -top-1 z-10" /> }
                                </motion.div>
                            <motion.div variants={ containerVariants } initial="hidden" animate="visible" exit="exit" className="tb-bar-scroll flex h-full items-center gap-2 overflow-x-auto overflow-y-visible px-1">
                                { (isInRoom && showToolbarButton) &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="wired-tools" onClick={ openMonitor } className="tb-icon" />
                                    </motion.div> }
                                { isInRoom &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="camera" onClick={ () => CreateLinkEvent('camera/toggle') } className="tb-icon" />
                                    </motion.div> }
                                { isMod &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="modtools" onClick={ () => CreateLinkEvent('mod-tools/toggle') } className="tb-icon" />
                                    </motion.div> }
                                { isMod &&
                                    <motion.div variants={ itemVariants }>
                                        <ToolbarItemView icon="furnieditor" onClick={ () => CreateLinkEvent('furni-editor/toggle') } className="tb-icon" />
                                    </motion.div> }
                                { !isInRoom &&
                                    <motion.div variants={ itemVariants } className="relative">
                                        <ToolbarItemView icon="friendall" onClick={ () => CreateLinkEvent('friends/toggle') } className="tb-icon" />
                                        { (requests.length > 0) &&
                                            <LayoutItemCountView count={ requests.length } className="absolute -right-2 -top-1" /> }
                                    </motion.div> }
                            </motion.div>
                        </motion.div>
                    </> }
            </AnimatePresence>
        </>
    );
};

const TOOLBAR_STYLES = `
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
