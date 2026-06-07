import { FC, useLayoutEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText, MessengerFriend } from '../../../../api';
import { FriendBarItemView } from './FriendBarItemView';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Hard cap on simultaneously-shown friend chips. The effective count is
// reduced below this when the bar would otherwise overflow its (clipped)
// slot in the toolbar — see the width measurement below.
const MAX_DISPLAY_COUNT = 3;

// Layout constants mirrored from FriendBarItemView / the flex gaps here, used
// to compute how many friend chips fit in the available width. A "slot" is one
// w-[132px] button plus the gap-[6px] that precedes it.
const ITEM_SLOT = 138; // 132px chip + 6px gap (friend chip and search chip)
const ARROWS_WIDTH = 52; // two w-[20px] arrows, each + 6px gap
const REQUEST_SLOT = 120; // requests chip (only present when requestsCount > 0)
const BASE_PAD = 8; // container px-[2px] + a little slack
const RIGHT_SAFE = 24; // right inset (right-0/right-3) + pr-3 safety margin

// Mirrored from Toolbar to keep physics identical
const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22 } },
    exit: { opacity: 0, y: 6, scale: 0.85, transition: { duration: 0.1 } },
};

export const FriendBarView: FC<{ onlineFriends: MessengerFriend[]; requestsCount?: number }> = props =>
{
    const { onlineFriends = [], requestsCount = 0 } = props;
    const [ indexOffset, setIndexOffset ] = useState(0);
    const [ maxVisible, setMaxVisible ] = useState(MAX_DISPLAY_COUNT);
    const elementRef = useRef<HTMLDivElement>(null);

    // Auto-fit the visible friend count to the room actually available between
    // the bar's left edge and the right side of the viewport. The bar lives in
    // a `overflow-x: clip` toolbar slot, so anything that doesn't fit would be
    // silently cut off (the scroll arrow / search button disappear). The bar's
    // left edge is stable (it sits after fixed-width toolbar icons), so growing
    // or shrinking the chip count never moves it — no measurement feedback loop.
    useLayoutEffect(() =>
    {
        const element = elementRef.current;

        if(!element) return;

        const measure = () =>
        {
            const left = element.getBoundingClientRect().left;
            const available = window.innerWidth - left - RIGHT_SAFE;
            const fixed = ARROWS_WIDTH + ITEM_SLOT /* search chip */ + BASE_PAD + ((requestsCount > 0) ? REQUEST_SLOT : 0);
            const fit = Math.floor((available - fixed) / ITEM_SLOT);
            const next = Math.max(1, Math.min(MAX_DISPLAY_COUNT, fit));

            setMaxVisible(prev => ((prev === next) ? prev : next));
        };

        measure();

        const observer = new ResizeObserver(measure);

        observer.observe(document.documentElement);
        window.addEventListener('resize', measure);

        return () =>
        {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [ requestsCount, onlineFriends.length ]);

    // `safeOffset` is the offset clamped to the current list/fit. Every read
    // below uses it, so a stale `indexOffset` (after the list shrinks or the fit
    // grows) renders correctly and self-corrects on the next arrow click — no
    // write-back effect needed.
    const maxOffset = Math.max(0, (onlineFriends.length - maxVisible));
    const safeOffset = Math.min(indexOffset, maxOffset);
    const canScrollLeft = (safeOffset > 0);
    const canScrollRight = (safeOffset < maxOffset);
    const visibleFriends = onlineFriends.slice(safeOffset, (safeOffset + maxVisible));

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
                    <div className="flex h-[34px] items-center rounded-[7px] border border-[#9fc56f] bg-[#5f7d2f] px-[10px] text-[0.83rem] whitespace-nowrap text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)]">
                        { requestsCount } { LocalizeText('friendbar.requests.title') }
                    </div>
                </motion.div> }
            <motion.div variants={itemVariants}>
                <div
                    className={ `flex h-[34px] w-[20px] items-center justify-center text-white/80 transition-all ${ !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-white active:scale-95' }` }
                    onClick={ () =>
                    {
                        if(canScrollLeft) setIndexOffset(safeOffset - 1);
                    } }
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
                        <div className="flex h-[34px] items-center rounded-[7px] border border-[#9fc56f] bg-[#5f7d2f] px-[10px] text-[0.83rem] font-medium whitespace-nowrap text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(0,0,0,0.25)]">
                            Nessun amico online
                        </div>
                    </motion.div> }
            </AnimatePresence>

            <motion.div variants={itemVariants}>
                <div
                    className={ `flex h-[34px] w-[20px] items-center justify-center text-white/80 transition-all ${ !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-white active:scale-95' }` }
                    onClick={ () =>
                    {
                        if(canScrollRight) setIndexOffset(safeOffset + 1);
                    } }
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
