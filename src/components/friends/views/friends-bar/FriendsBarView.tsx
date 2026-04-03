import { FC, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText, MessengerFriend } from '../../../../api';
import { FriendBarItemView } from './FriendBarItemView';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_DISPLAY_COUNT = 3;

// Mirrored from Toolbar to keep physics identical
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 as const } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22 } },
    exit: { opacity: 0, y: 6, scale: 0.85, transition: { duration: 0.1 } },
};

export const FriendBarView: FC<{ onlineFriends: MessengerFriend[]; requestsCount?: number }> = props => {
    const { onlineFriends = [], requestsCount = 0 } = props;
    const [ indexOffset, setIndexOffset ] = useState(0);
    const elementRef = useRef<HTMLDivElement>(null);
    const hasScrollableFriends = (onlineFriends.length > MAX_DISPLAY_COUNT);
    const visibleFriends = onlineFriends.slice(indexOffset, (indexOffset + MAX_DISPLAY_COUNT));

    return (
        <motion.div 
            ref={elementRef} 
            className="flex h-[40px] items-center gap-[6px] px-[2px] py-[3px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            { (requestsCount > 0) &&
                <motion.div variants={ itemVariants }>
                    <div className="flex h-[34px] items-center rounded-[7px] border border-[#9fc56f] bg-[#5f7d2f] px-[10px] text-[0.74rem] font-bold whitespace-nowrap text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)]">
                        { requestsCount } richieste
                    </div>
                </motion.div> }
            <motion.div variants={itemVariants}>
                <div 
                    className={ `flex h-[34px] w-[20px] items-center justify-center text-white/80 transition-all ${ (!hasScrollableFriends || (indexOffset <= 0)) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-white active:scale-95' }` }
                    onClick={ () => { if(indexOffset > 0) setIndexOffset(indexOffset - 1); } }
                >
                    <FaChevronLeft className="text-white/70 text-sm drop-shadow-[1px_1px_0_#000]" />
                </div>
            </motion.div>

            <AnimatePresence mode="popLayout">
                { visibleFriends.map(friend => (
                    <motion.div
                        key={ friend.id }
                        variants={ itemVariants }
                        layout
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FriendBarItemView friend={ friend } />
                    </motion.div>
                )) }
                <motion.div
                    key="friend-search"
                    variants={ itemVariants }
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <FriendBarItemView friend={ null } />
                </motion.div>
                { (!onlineFriends.length && (requestsCount <= 0)) &&
                    <motion.div
                        key="friend-empty"
                        variants={ itemVariants }
                        layout
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex h-[34px] items-center rounded-[7px] border border-[#9fc56f] bg-[#5f7d2f] px-[10px] text-[0.74rem] font-medium whitespace-nowrap text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)]">
                            Nessun amico online
                        </div>
                    </motion.div> }
            </AnimatePresence>

            <motion.div variants={itemVariants}>
                <div 
                    className={ `flex h-[34px] w-[20px] items-center justify-center text-white/80 transition-all ${ (!hasScrollableFriends || !((onlineFriends.length > MAX_DISPLAY_COUNT) && ((indexOffset + MAX_DISPLAY_COUNT) <= (onlineFriends.length - 1)))) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-white active:scale-95' }` }
                    onClick={ () => { if((onlineFriends.length > MAX_DISPLAY_COUNT) && ((indexOffset + MAX_DISPLAY_COUNT) <= (onlineFriends.length - 1))) setIndexOffset(indexOffset + 1); } }
                >
                    <FaChevronRight className="text-white/70 text-sm drop-shadow-[1px_1px_0_#000]" />
                </div>
            </motion.div>

            <style>{FRIENDBAR_STYLES}</style>
        </motion.div>
    );
};

const FRIENDBAR_STYLES = `
  .tbme-panel {
    background: rgba(18, 16, 14, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 10px 12px;
    box-shadow:
      0 10px 36px rgba(0, 0, 0, 0.65),
      0 1px 0 rgba(255, 255, 255, 0.05) inset;
  }

  .tbme-icon {
    opacity: 0.72;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .tbme-icon:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  .tbme-icon:active {
    opacity: 0.85;
    transform: translateY(0);
  }
`;
