import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { FaArrowUp, FaBoxOpen, FaBriefcase, FaCrown, FaGamepad, FaGift, FaHandHoldingHeart, FaShoppingBag, FaStore, FaTrophy } from 'react-icons/fa';
import { LocalizeText } from '../../api';
import { LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return (text && text !== key) ? text : fallback;
};

interface EarningRow
{
    key: string;
    label: string;
    Icon: IconType;
    currencies: number[];
}

// Currency ids: 5 = diamonds, 0 = duckets. Amounts are placeholders (0) until
// the emulator exposes the earnings data + claim packets. The category icons
// are FontAwesome placeholders — swap in the exact pixel icons once available.
const EARNINGS: EarningRow[] = [
    { key: 'daily', label: 'Regalo giornaliero', Icon: FaGift, currencies: [ 5 ] },
    { key: 'games', label: 'Giochi', Icon: FaGamepad, currencies: [ 0 ] },
    { key: 'achievements', label: 'Traguardi', Icon: FaTrophy, currencies: [ 5, 0 ] },
    { key: 'marketplace', label: 'Mercatino', Icon: FaStore, currencies: [ 0 ] },
    { key: 'hcpayday', label: 'Bonus giorno di paga HC', Icon: FaCrown, currencies: [ 0 ] },
    { key: 'level', label: 'Progressione Livello', Icon: FaArrowUp, currencies: [ 5, 0 ] },
    { key: 'donations', label: 'Donazioni', Icon: FaHandHoldingHeart, currencies: [ 0 ] },
    { key: 'bonusbag', label: 'Sacco Bonus', Icon: FaShoppingBag, currencies: [ 0 ] },
    { key: 'surprise', label: 'Scatole Sorprese', Icon: FaBoxOpen, currencies: [ 5, 0 ] },
    { key: 'clubwork', label: 'Club e Lavoro', Icon: FaBriefcase, currencies: [ 0 ] }
];

export const VaultView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 3) return;
                if(parts[2] !== 'vault') return;

                switch(parts[1])
                {
                    case 'open':
                        setIsVisible(true);
                        return;
                    case 'close':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'habboUI/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    return (
        <NitroCardView className="nitro-vault w-[430px]" theme="primary-slim" uniqueKey="vault">
            <NitroCardHeaderView headerText={ localizeWithFallback('earnings.title', 'Guadagni') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView className="flex flex-col gap-[5px] text-black">
                { EARNINGS.map(row =>
                {
                    const RowIcon = row.Icon;

                    return (
                        <div key={ row.key } className="flex items-center gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[5px] border-2 border-[#b3b3b3] bg-white px-1.5 py-1">
                                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border border-black/15 bg-white text-[#1e7295]">
                                    <RowIcon size={ 12 } />
                                </span>
                                <Text bold className="truncate">{ localizeWithFallback('earnings.' + row.key, row.label) }</Text>
                            </div>
                            <div className="flex min-w-[78px] shrink-0 items-center justify-end gap-2">
                                { row.currencies.map((currency, index) => (
                                    <span key={ index } className="flex items-center gap-1">
                                        <LayoutCurrencyIcon type={ currency } />
                                        <Text bold small>0</Text>
                                    </span>
                                )) }
                            </div>
                            <button type="button" disabled className="shrink-0 cursor-default rounded border border-black/20 bg-[#cfcfcf] px-2 py-[3px] text-[0.7rem] font-bold text-black/45">
                                { localizeWithFallback('earnings.claim', 'Riscatta') }
                            </button>
                        </div>
                    );
                }) }
                <div className="flex justify-center pt-1">
                    <button type="button" disabled className="cursor-default rounded border border-black/20 bg-[#cfcfcf] px-7 py-1 text-[0.78rem] font-bold text-black/45">
                        { localizeWithFallback('earnings.claim.all', 'Richiedili Tutti') }
                    </button>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
