import { FC, useMemo } from 'react';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { Flex, LayoutCurrencyIcon, Text } from '../../../common';

interface CurrencyViewProps
{
    type: number;
    amount: number;
    short: boolean;
}

export const CurrencyView: FC<CurrencyViewProps> = props =>
{
    const { type = -1, amount = -1, short = false } = props;

    const element = useMemo(() =>
    {
        return (
            <Flex justifyContent="end" pointer gap={ 1 } className={ `nitro-purse-button rounded allcurrencypurse nitro-purse-button currency-${ type }` }>
                <Text truncate textEnd variant="white" grow>{ short ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount) }</Text>
                <LayoutCurrencyIcon type={ type } />
            </Flex>);
    }, [ amount, short, type ]);

    if(!short) return element;

    return (
        <div className="group relative">
            { element }
            <div
                role="tooltip"
                className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
                { LocalizeFormattedNumber(amount) }
            </div>
        </div>
    );
};
