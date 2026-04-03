import { CreateLinkEvent, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaQuestionCircle } from 'react-icons/fa';
import { FriendlyTime, GetConfigurationValue, LocalizeText } from '../../api';
import { Column, Flex, LayoutCurrencyIcon, Text } from '../../common';
import { usePurse } from '../../hooks';
import purseIcon from '../../assets/images/rightside/purse.gif';
import { CurrencyView } from './views/CurrencyView';
import { SeasonalView } from './views/SeasonalView';

export const PurseView: FC<{}> = props => {
    const { purse = null, hcDisabled = false } = usePurse();
    const [ isOpen, setIsOpen ] = useState(true);
    const [ isCompact, setIsCompact ] = useState(false);

    const displayedCurrencies = useMemo(() => GetConfigurationValue<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfigurationValue<boolean>('currency.display.number.short', false), []);

    const getClubText = (() => {
        if (!purse) return null;

        const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
        const minutesUntilExpiration = purse.minutesUntilExpiration;

        if (purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');
        else if ((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);
        else return FriendlyTime.shortFormat(totalDays * 86400);
    })();

    const currencyTypes = useMemo(() => {
        if (!purse || !purse.activityPoints || !purse.activityPoints.size) return [];

        const types = Array.from(purse.activityPoints.keys()).filter(type => (displayedCurrencies.indexOf(type) >= 0));
        types.sort((a, b) => {
            if (a === 0) return -1;
            if (b === 0) return 1;
            if (a === 5) return -1;
            if (b === 5) return 1;
            return a - b;
        });

        return types;
    }, [ displayedCurrencies, purse ]);

    const primaryCurrencies = currencyTypes.slice(0, 2);
    const seasonalCurrencies = currencyTypes.slice(2);

    useEffect(() =>
    {
        if(isOpen)
        {
            setIsCompact(false);
            return;
        }

        const timeout = window.setTimeout(() => setIsCompact(true), 220);

        return () => window.clearTimeout(timeout);
    }, [ isOpen ]);

    if (!purse) return null;

    return (
        <Column alignItems="end" className="nitro-purse-container" gap={ 0 }>
            <div className={ `nitro-purse-shell ${ isCompact ? 'is-closed' : '' }` }>
                <div className={ `nitro-purse ${ isCompact ? 'is-closed' : '' }` }>
                    <div className={ `nitro-purse__header ${ isCompact ? 'is-closed' : '' }` } onClick={ () => setIsOpen(value => !value) }>
                        <Flex alignItems="center" gap={ 1 } className={ isCompact ? 'nitro-purse__header-main is-closed' : 'nitro-purse__header-main' }>
                            <div className="nitro-purse__header-icon">
                                <img src={ purseIcon } alt="" className="nitro-purse__header-image" />
                            </div>
                        </Flex>
                        <div className={ `nitro-purse__header-toggle ${ isOpen ? 'is-open' : '' }` }>
                            <FaChevronDown className="fa-icon text-[10px]" />
                        </div>
                    </div>
                    <div className={ `nitro-purse__content ${ isOpen ? 'is-open' : 'is-closed' }` }>
                            <div className={ `nitro-purse__summary nitro-purse__summary--compact ${ hcDisabled ? 'is-no-hc' : '' }` }>
                                <div className="nitro-purse__primary">
                                    <CurrencyView type={ -1 } amount={ purse.credits } short={ currencyDisplayNumberShort } />
                                    { primaryCurrencies.map(type => <CurrencyView key={ type } type={ type } amount={ purse.activityPoints.get(type) || 0 } short={ currencyDisplayNumberShort } />) }
                                </div>
                                { !hcDisabled &&
                                    <div className="nitro-purse-subscription" onClick={ event => { event.stopPropagation(); CreateLinkEvent('habboUI/open/hccenter'); } }>
                                        <div className="nitro-purse-subscription__icon">
                                            <LayoutCurrencyIcon type="hc" />
                                        </div>
                                        <div className="nitro-purse-subscription__copy">
                                            <Text variant="white" className="nitro-purse-subscription__label">HC</Text>
                                            <Text variant="white" className="nitro-purse-subscription__value">{ getClubText }</Text>
                                        </div>
                                    </div> }
                                <div className="nitro-purse__actions">
                                    <button type="button" className="nitro-purse__action-button nitro-purse__action-button--help" onClick={ event => { event.stopPropagation(); CreateLinkEvent('help/show'); } } title={ LocalizeText('help.button.name') }>
                                        <FaQuestionCircle />
                                    </button>
                                    <button type="button" className="nitro-purse__action-button nitro-purse__action-button--settings" onClick={ event => { event.stopPropagation(); CreateLinkEvent('user-settings/toggle'); } } title={ LocalizeText('widget.memenu.settings.title') }>
                                        <i className="nitro-icon icon-cog" />
                                    </button>
                                </div>
                            </div>
                            { seasonalCurrencies.length > 0 &&
                                <div className="nitro-purse__seasonal">
                                    { seasonalCurrencies.map(type => <SeasonalView key={ type } type={ type } amount={ purse.activityPoints.get(type) || 0 } />) }
                                </div> }
                    </div>
                </div>
            </div>
        </Column>
    );
};
