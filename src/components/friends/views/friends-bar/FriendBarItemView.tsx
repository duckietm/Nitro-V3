import { FindNewFriendsMessageComposer, MouseEventType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetUserProfile, LocalizeText, MessengerFriend, OpenMessengerChat, SendMessageComposer } from '../../../../api';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../common';
import { useFriends } from '../../../../hooks';
import { motion, AnimatePresence } from 'framer-motion';

export const FriendBarItemView: FC<{ friend: MessengerFriend }> = props => {
    const { friend = null } = props;
    const [isVisible, setVisible] = useState(false);
    const { followFriend = null } = useFriends();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const element = elementRef.current;
            if (!element) return;
            if ((event.target !== element) && !element.contains((event.target as Node))) {
                setVisible(false);
            }
        };
        document.addEventListener(MouseEventType.MOUSE_CLICK, onClick);
        return () => document.removeEventListener(MouseEventType.MOUSE_CLICK, onClick);
    }, []);

    if (!friend) {
        return (
            <div ref={elementRef} className="relative">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="relative flex h-[34px] w-[132px] items-center rounded-[7px] border border-[#9fc56f] bg-[#5f7d2f] pl-[34px] pr-[10px] text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)]"
                    onClick={() => setVisible(prev => !prev)}
                >
                    <div className="absolute left-[6px] top-1/2 h-[24px] w-[24px] -translate-y-1/2 bg-[url('@/assets/images/toolbar/friend-search.png')] bg-contain bg-center bg-no-repeat pointer-events-none" />
                    <div className="truncate text-[0.8rem] font-bold">{LocalizeText('friend.bar.find.title')}</div>
                </motion.button>
                
                <AnimatePresence>
                    {isVisible && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 tbme-panel whitespace-nowrap z-[80] flex flex-col items-center gap-2 pointer-events-auto min-w-[170px]"
                        >
                            <div className="text-white text-[13px] font-bold drop-shadow-[1px_1px_0_#000]">{LocalizeText('friend.bar.find.title')}</div>
                            <div className="text-white/80 text-xs px-2">{LocalizeText('friend.bar.find.text')}</div>
                            <button 
                                className="px-3 py-1 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-white text-[11px] font-bold transition-colors cursor-pointer mt-1"
                                onClick={event => { event.stopPropagation(); SendMessageComposer(new FindNewFriendsMessageComposer()); setVisible(false); }}
                            >
                                {LocalizeText('friend.bar.find.button')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={elementRef} className="relative">
            <div className="absolute left-[-4px] bottom-[-2px] z-10 h-[66px] w-[34px] overflow-hidden pointer-events-none">
                {(friend.id > 0) ? (
                    <LayoutAvatarImageView
                        direction={2}
                        figure={friend.figure}
                        headOnly={false}
                        className="block pointer-events-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]"
                        style={ { marginLeft: '-28px', marginTop: '-10px' } }
                    />
                ) : (
                    <LayoutBadgeImageView badgeCode="ADM" isGroup={false} className="scale-75 block pointer-events-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]" />
                )}
            </div>
            <motion.button
                type="button"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="relative flex h-[34px] w-[132px] items-center rounded-[7px] border border-[#9fc56f] bg-[#6f8f39] pl-[44px] pr-[10px] text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)] overflow-visible"
                onClick={() => setVisible(prev => !prev)}
            >
                <div className="truncate text-[0.82rem] font-bold">{friend.name}</div>
            </motion.button>

            <AnimatePresence>
                {isVisible && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 tbme-panel flex flex-col items-center gap-2 z-[80] pointer-events-auto min-w-[110px]"
                    >
                        <div className="text-white font-bold text-[13px] drop-shadow-[1px_1px_0_#000] truncate max-w-[120px] px-1">{friend.name}</div>
                        <div className="flex justify-center gap-3 px-2">
                            <div className="cursor-pointer tbme-icon nitro-friends-spritesheet icon-friendbar-chat hover:-translate-y-1 transition-transform" onClick={event => { event.stopPropagation(); OpenMessengerChat(friend.id); setVisible(false); }} />
                            {friend.followingAllowed &&
                                <div className="cursor-pointer tbme-icon nitro-friends-spritesheet icon-friendbar-visit hover:-translate-y-1 transition-transform" onClick={event => { event.stopPropagation(); followFriend(friend); setVisible(false); }} />}
                            <div className="cursor-pointer tbme-icon nitro-friends-spritesheet icon-profile hover:-translate-y-1 transition-transform" onClick={event => { event.stopPropagation(); GetUserProfile(friend.id); setVisible(false); }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
