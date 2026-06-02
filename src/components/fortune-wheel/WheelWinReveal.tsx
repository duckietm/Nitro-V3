import { IWheelPrize } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { LocalizeText } from '../../api';
import { renderPrizeIcon } from './wheelPrizeIcon';
import { getPrizeTier } from './wheelPrizeTier';

interface WheelWinRevealProps
{
    prize: IWheelPrize;
    onDismiss: () => void;
}

const CONFETTI_COLORS = [ '#ffd34d', '#4fc3f7', '#ff7b7b', '#7bff9e', '#c08bff', '#ffa94d' ];
const CONFETTI_COUNT = 40;

// Precomputed once at module load (not during render) so the React Compiler
// purity rules stay happy and there's no per-mount cost. A fixed spread of
// 40 pieces with staggered delays reads as a lively burst either way.
const CONFETTI = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.8 + (Math.random() * 1.4),
    drift: (Math.random() - 0.5) * 160,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 6 + Math.round(Math.random() * 4)
}));

// How long each tier lingers before auto-dismissing (ms).
const AUTO_DISMISS = { none: 2000, common: 2400, rare: 4000 } as const;

export const WheelWinReveal: FC<WheelWinRevealProps> = ({ prize, onDismiss }) =>
{
    const tier = getPrizeTier(prize);

    useEffect(() =>
    {
        const timer = window.setTimeout(onDismiss, AUTO_DISMISS[tier]);
        return () => window.clearTimeout(timer);
    }, [ tier, onDismiss ]);

    // The "nothing" slice gets a quiet, non-celebratory message.
    if(tier === 'none')
    {
        return (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35" onClick={ onDismiss }>
                <div className="rounded-xl bg-white px-6 py-4 text-center shadow-2xl" style={ { animation: 'wheelPop .45s cubic-bezier(.18,.89,.32,1.28)' } }>
                    <div className="text-3xl">🍀</div>
                    <div className="mt-1 font-bold text-[#33424c]">{ LocalizeText('wheel.win.nothing') }</div>
                </div>
            </div>
        );
    }

    const isRare = tier === 'rare';

    return (
        <div
            className={ `absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 ${ isRare ? 'bg-black/70' : 'bg-black/40' }` }
            onClick={ onDismiss }>
            <style>{ `
                @keyframes wheelPop { from { transform: scale(.35); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes wheelConfettiFall {
                    0%   { transform: translate(0, -10%) rotate(0deg); opacity: 1; }
                    100% { transform: translate(var(--drift), 320px) rotate(720deg); opacity: 0; }
                }
                @keyframes wheelGlow {
                    0%,100% { box-shadow: 0 0 18px 4px rgba(255,211,77,.55); }
                    50%     { box-shadow: 0 0 30px 10px rgba(255,211,77,.9); }
                }
            ` }</style>

            { isRare && CONFETTI.map((piece, i) => (
                <span
                    key={ i }
                    className="pointer-events-none absolute top-0"
                    style={ {
                        left: `${ piece.left }%`,
                        width: `${ piece.width }px`,
                        height: `${ piece.width + 4 }px`,
                        background: piece.color,
                        borderRadius: '2px',
                        ['--drift' as any]: `${ piece.drift }px`,
                        animation: `wheelConfettiFall ${ piece.duration }s ${ piece.delay }s linear forwards`
                    } } />
            )) }

            { isRare &&
                <div className="text-sm font-black uppercase tracking-[0.2em] text-[#ffd34d] drop-shadow">{ LocalizeText('wheel.win.jackpot') }</div> }

            <div
                className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl"
                style={ { animation: `wheelPop .5s cubic-bezier(.18,.89,.32,1.28)${ isRare ? ', wheelGlow 1.4s ease-in-out .5s infinite' : '' }` } }>
                { renderPrizeIcon(prize, true) }
            </div>

            <div className="mt-1 text-lg font-black text-white drop-shadow">{ LocalizeText('wheel.win.title') }</div>
            { !!prize.label &&
                <div className="rounded-full bg-white/95 px-4 py-1 text-sm font-bold text-[#20313a] shadow">{ prize.label }</div> }
        </div>
    );
};
