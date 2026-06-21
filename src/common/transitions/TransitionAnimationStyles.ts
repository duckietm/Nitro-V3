import { Variants } from 'framer-motion';
import { TransitionAnimationTypes } from './TransitionAnimationTypes';

export function getTransitionVariants(type: string): Variants {
    switch (type) {
        case TransitionAnimationTypes.BOUNCE:
            return {
                hidden: { opacity: 0, scale: 0.3 },
                visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 12 } },
                exit: { opacity: 0, scale: 0.3 }
            };
        case TransitionAnimationTypes.SLIDE_LEFT:
            return {
                hidden: { opacity: 0, x: '-100%' },
                visible: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: '-100%' }
            };
        case TransitionAnimationTypes.SLIDE_RIGHT:
            return {
                hidden: { opacity: 0, x: '100%' },
                visible: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: '100%' }
            };
        case TransitionAnimationTypes.FLIP_X:
            return {
                hidden: { opacity: 0, rotateX: 90 },
                visible: { opacity: 1, rotateX: 0 },
                exit: { opacity: 0, rotateX: 90 }
            };
        case TransitionAnimationTypes.FADE_UP:
            return {
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 20 }
            };
        case TransitionAnimationTypes.FADE_IN:
            return {
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
                exit: { opacity: 0 }
            };
        case TransitionAnimationTypes.FADE_DOWN:
            return {
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 }
            };
        case TransitionAnimationTypes.HEAD_SHAKE:
            return {
                hidden: { x: 0 },
                visible: {
                    x: [0, -6, 5, -3, 2, 0],
                    transition: { duration: 0.5 }
                },
                exit: { x: 0 }
            };
    }

    return {
        hidden: {},
        visible: {},
        exit: {}
    };
}
