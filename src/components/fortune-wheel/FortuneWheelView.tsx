import { AddLinkEventTracker, GetRoomEngine, ILinkEventTracker, IWheelPrize, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText } from '../../api';
import { Column, Flex, LayoutAvatarImageView, LayoutBadgeImageView, LayoutCurrencyIcon, LayoutImage, Text } from '../../common';
import { useFortuneWheel, useHasPermission } from '../../hooks';
import { NitroCard } from '../../layout';
import { FortuneWheelSettingsView } from './FortuneWheelSettingsView';

// Stock UI palette (white / light-blue / grey / black).
const SLICE_COLORS = [ '#eef2f5', '#c3dcec' ];
const RIM = '#4c606c';
const WHEEL_SIZE = 420;
const ICON_RADIUS = 150;
const FULL_TURNS = 5;

const renderPrizeIcon = (prize: IWheelPrize) =>
{
    switch(prize.type)
    {
        case 'item':
            return <LayoutImage imageUrl={ GetRoomEngine().getFurnitureFloorIconUrl(prize.spriteId) } className="h-9 w-9 bg-contain bg-center bg-no-repeat" />;
        case 'badge':
            return <LayoutBadgeImageView badgeCode={ prize.badgeCode } />;
        case 'credits':
            return (
                <Column alignItems="center" gap={ 0 }>
                    <LayoutCurrencyIcon type={ -1 } />
                    <span className="text-[10px] font-bold text-[#2a3a42]">{ prize.amount }</span>
                </Column>);
        case 'points':
            return (
                <Column alignItems="center" gap={ 0 }>
                    <LayoutCurrencyIcon type={ prize.pointsType } />
                    <span className="text-[10px] font-bold text-[#2a3a42]">{ prize.amount }</span>
                </Column>);
        case 'spin':
            return <span className="text-xs font-bold text-[#2a3a42]">+{ prize.amount }</span>;
        default:
            return <span className="text-xs font-bold text-[#2a3a42]/60">—</span>;
    }
};

export const FortuneWheelView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isSettingsOpen, setIsSettingsOpen ] = useState(false);
    const { freeSpins, extraSpins, spinCost, spinCostType, prizes, recentWins, pendingPrizeId, isSpinning, open, spin, buySpin, finishSpin } = useFortuneWheel();
    const canManage = useHasPermission('acc_wheeladmin');
    const [ rotation, setRotation ] = useState(0);
    const rotationRef = useRef(0);
    const prizesRef = useRef<IWheelPrize[]>([]);
    prizesRef.current = prizes;

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(prev => !prev); return;
                }
            },
            eventUrlPrefix: 'fortune-wheel/',
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(isVisible) open();
    }, [ isVisible, open ]);

    // Drive the spin animation when the server reports the winning slice.
    useEffect(() =>
    {
        if(pendingPrizeId < 0) return;

        const list = prizesRef.current;
        const idx = list.findIndex(prize => prize.id === pendingPrizeId);

        if(!list.length || (idx < 0))
        {
            finishSpin();
            return;
        }

        const sliceAngle = 360 / list.length;
        const centerAngle = ((idx + 0.5) * sliceAngle);
        const current = rotationRef.current;
        const target = (current - (current % 360)) + (FULL_TURNS * 360) + (360 - centerAngle);

        rotationRef.current = target;
        setRotation(target);
    }, [ pendingPrizeId, finishSpin ]);

    const sliceAngle = prizes.length ? (360 / prizes.length) : 0;

    const background = useMemo(() =>
    {
        if(!prizes.length) return SLICE_COLORS[0];

        const stops = prizes.map((_, i) => `${ SLICE_COLORS[i % 2] } ${ i * sliceAngle }deg ${ (i + 1) * sliceAngle }deg`).join(', ');
        return `conic-gradient(${ stops })`;
    }, [ prizes, sliceAngle ]);

    if(!isVisible) return null;

    const canSpin = ((freeSpins + extraSpins) > 0) && !isSpinning && (prizes.length > 0);

    return (
        <NitroCard className="w-[800px] max-w-[96vw]" uniqueKey="fortune-wheel">
            <NitroCard.Header headerText={ LocalizeText('wheel.title') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCard.Content>
                <Flex gap={ 3 }>
                    <Column alignItems="center" gap={ 2 } className="shrink-0">
                        <div className="relative" style={ { width: WHEEL_SIZE, height: WHEEL_SIZE } }>
                            <div
                                className="absolute left-1/2 -top-2 z-20 -translate-x-1/2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]"
                                style={ { width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: `28px solid ${ RIM }` } } />
                            <div
                                className="absolute inset-0 rounded-full shadow-[0_0_0_4px_rgba(0,0,0,0.12),inset_0_0_18px_rgba(0,0,0,0.1)]"
                                style={ { background, border: `8px solid ${ RIM }`, transform: `rotate(${ rotation }deg)`, transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15,0.85,0.25,1)' : 'none' } }
                                onTransitionEnd={ () => { if(isSpinning) finishSpin(); } }>
                                { prizes.map((_, i) => (
                                    <div
                                        key={ `divider-${ i }` }
                                        className="absolute bottom-1/2 left-1/2 origin-bottom"
                                        style={ { width: '2px', height: `${ WHEEL_SIZE / 2 }px`, transform: `translateX(-1px) rotate(${ i * sliceAngle }deg)`, background: 'rgba(76,96,108,0.3)' } } />
                                )) }
                                { prizes.map((prize, i) =>
                                {
                                    const centerAngle = ((i + 0.5) * sliceAngle);
                                    return (
                                        <div
                                            key={ prize.id }
                                            className="absolute left-1/2 top-1/2"
                                            style={ { transform: `rotate(${ centerAngle }deg) translateY(-${ ICON_RADIUS }px) rotate(-${ centerAngle }deg)` } }>
                                            <div className="-translate-x-1/2 -translate-y-1/2">
                                                { renderPrizeIcon(prize) }
                                            </div>
                                        </div>);
                                }) }
                            </div>
                            <div className="absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eef2f5] shadow-[0_0_8px_rgba(0,0,0,0.25)]" style={ { border: `4px solid ${ RIM }` } } />
                        </div>
                        <Text bold className="text-[#2f6f95]">{ LocalizeText('wheel.free.today', [ 'count' ], [ freeSpins.toString() ]) }</Text>
                        <Text small className="text-[#33424c]">{ LocalizeText('wheel.extra', [ 'count' ], [ extraSpins.toString() ]) }</Text>
                        <Flex gap={ 2 } alignItems="center">
                            <button
                                disabled={ !canSpin }
                                onClick={ () => spin() }
                                className="cursor-pointer rounded bg-[#3a7bb5] px-4 py-2 font-bold text-white hover:bg-[#336ea3] disabled:cursor-default disabled:opacity-40">
                                { LocalizeText('wheel.spin') }
                            </button>
                            <button
                                onClick={ () => buySpin() }
                                className="flex cursor-pointer items-center gap-1 rounded bg-[#6b7884] px-3 py-2 text-white hover:bg-[#5e6a75]">
                                { LocalizeText('wheel.buy') } { spinCost }
                                <LayoutCurrencyIcon type={ spinCostType } />
                            </button>
                            { canManage &&
                                <button
                                    onClick={ () => setIsSettingsOpen(true) }
                                    className="cursor-pointer rounded bg-[#8a6b3a] px-3 py-2 font-bold text-white hover:bg-[#735730]">
                                    { LocalizeText('wheel.settings') }
                                </button> }
                        </Flex>
                    </Column>
                    <Column gap={ 2 } className="min-w-[300px] grow rounded-lg border border-black/10 bg-black/5 p-3">
                        <Text bold className="text-base text-[#33424c]">{ LocalizeText('wheel.winners') }</Text>
                        <Column gap={ 1 } overflow="auto" className="h-[440px]">
                            { recentWins.map((win, i) => (
                                <Flex key={ i } alignItems="center" gap={ 2 } className="rounded border-b border-black/10 py-1.5 hover:bg-black/5">
                                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-black/5">
                                        <LayoutAvatarImageView figure={ win.look } headOnly direction={ 2 } style={ { backgroundSize: 'auto', backgroundPosition: '-22px -32px' } } />
                                    </div>
                                    <Column gap={ 0 } className="min-w-0">
                                        <Text bold truncate className="text-[#1f2d34]">{ win.username }</Text>
                                        <Text small truncate className="text-[#2f6f95]">{ win.prizeLabel }</Text>
                                    </Column>
                                </Flex>
                            )) }
                            { !recentWins.length &&
                                <Text small className="text-black/50">{ LocalizeText('wheel.winners.empty') }</Text> }
                        </Column>
                    </Column>
                </Flex>
            </NitroCard.Content>
            { canManage && isSettingsOpen &&
                <FortuneWheelSettingsView onClose={ () => setIsSettingsOpen(false) } /> }
        </NitroCard>
    );
};
