import { IWheelAdminPrize, IWheelAdminPrizeEdit, IWheelPrize, IWheelRecentWin, WheelAdminGetPrizesComposer, WheelAdminPrizesEvent, WheelAdminSavePrizesComposer, WheelBuySpinComposer, WheelDataEvent, WheelOpenComposer, WheelRecentWinsEvent, WheelResultEvent, WheelSpinComposer } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

// Fortune wheel state + actions. Shared via useBetween so the event listeners
// register once regardless of how many components read it.
const useFortuneWheelState = () =>
{
    const [ freeSpins, setFreeSpins ] = useState(0);
    const [ extraSpins, setExtraSpins ] = useState(0);
    const [ spinCost, setSpinCost ] = useState(0);
    const [ spinCostType, setSpinCostType ] = useState(-1);
    const [ prizes, setPrizes ] = useState<IWheelPrize[]>([]);
    const [ recentWins, setRecentWins ] = useState<IWheelRecentWin[]>([]);
    const [ pendingPrizeId, setPendingPrizeId ] = useState<number>(-1);
    const [ isSpinning, setIsSpinning ] = useState(false);
    const [ adminPrizes, setAdminPrizes ] = useState<IWheelAdminPrize[]>([]);

    useMessageEvent<WheelAdminPrizesEvent>(WheelAdminPrizesEvent, event =>
    {
        setAdminPrizes(event.getParser().prizes);
    });

    useMessageEvent<WheelDataEvent>(WheelDataEvent, event =>
    {
        const parser = event.getParser();
        setFreeSpins(parser.freeSpins);
        setExtraSpins(parser.extraSpins);
        setSpinCost(parser.spinCost);
        setSpinCostType(parser.spinCostType);
        setPrizes(parser.prizes);
    });

    useMessageEvent<WheelResultEvent>(WheelResultEvent, event =>
    {
        setPendingPrizeId(event.getParser().prizeId);
        setIsSpinning(true);
    });

    useMessageEvent<WheelRecentWinsEvent>(WheelRecentWinsEvent, event =>
    {
        setRecentWins(event.getParser().wins);
    });

    const open = useCallback(() => SendMessageComposer(new WheelOpenComposer()), []);
    const spin = useCallback(() =>
    {
        setIsSpinning(prev =>
        {
            if(!prev) SendMessageComposer(new WheelSpinComposer());
            return prev;
        });
    }, []);
    const buySpin = useCallback(() => SendMessageComposer(new WheelBuySpinComposer()), []);
    const finishSpin = useCallback(() =>
    {
        setIsSpinning(false);
        setPendingPrizeId(-1);
    }, []);

    const loadAdminPrizes = useCallback(() => SendMessageComposer(new WheelAdminGetPrizesComposer()), []);
    const saveAdminPrizes = useCallback((prizes: IWheelAdminPrizeEdit[]) => SendMessageComposer(new WheelAdminSavePrizesComposer(prizes)), []);

    return { freeSpins, extraSpins, spinCost, spinCostType, prizes, recentWins, pendingPrizeId, isSpinning, open, spin, buySpin, finishSpin, adminPrizes, loadAdminPrizes, saveAdminPrizes };
};

export const useFortuneWheel = () => useBetween(useFortuneWheelState);
