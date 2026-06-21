import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FC, ReactNode } from 'react';
import { getTransitionVariants } from './TransitionAnimationStyles';

interface TransitionAnimationProps {
    type: string;
    inProp: boolean;
    timeout?: number;
    className?: string;
    children?: ReactNode;
}

export const TransitionAnimation: FC<TransitionAnimationProps> = (props) => {
    const { type = null, inProp = false, timeout = 300, className = null, children = null } = props;

    const variants: Variants = getTransitionVariants(type);
    const duration = timeout / 1000;

    return (
        <AnimatePresence initial={false}>
            {inProp && (
                <motion.div className={className ?? ''} variants={variants} initial="hidden" animate="visible" exit="exit" transition={{ duration }}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
