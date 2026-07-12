import { FC, useMemo } from 'react';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { Flex, LayoutCurrencyIcon, Text } from '../../../common';

interface CurrencyViewProps {
    type: number;
    amount: number;
    short: boolean;
}

export const CurrencyView: FC<CurrencyViewProps> = (props) => {
    const { type = -1, amount = -1, short = false } = props;
    const shouldShorten = short || Math.abs(amount) >= 1000;
    const displayAmount = useMemo(() => {
        if (!shouldShorten) return LocalizeFormattedNumber(amount);

        return LocalizeShortNumber(amount).toLowerCase();
    }, [amount, shouldShorten]);

    const element = useMemo(() => {
        return (
            <Flex justifyContent="end" pointer gap={1} className={`nitro-purse-button rounded allcurrencypurse nitro-purse-button currency-${type}`}>
                <Text textEnd variant="white" className="nitro-purse-button__amount whitespace-nowrap">
                    {displayAmount}
                </Text>
                <LayoutCurrencyIcon type={type} />
            </Flex>
        );
    }, [displayAmount, type]);

    if (!shouldShorten) return element;

    return (
        <div className="group relative">
            {element}
            <div
                role="tooltip"
                className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100"
            >
                {LocalizeFormattedNumber(amount)}
            </div>
        </div>
    );
};
