import { CreateLinkEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useMemo, useState } from 'react';
import { FaChartBar, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { ClearRememberLogin, GetConfigurationValue, GetRememberLogin, LocalizeText, localizeWithFallback } from '../../api';
import { Column, LayoutCurrencyIcon } from '../../common';
import { usePurse } from '../../hooks';
import { CurrencyView } from './views/CurrencyView';
import { SeasonalView } from './views/SeasonalView';

export const PurseView: FC<{}> = (props) => {
    const { purse = null, hcDisabled = false } = usePurse();
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

    const openSettingsSection = useCallback((section: string) => {
        CreateLinkEvent('user-settings/show/' + section);
        setSettingsMenuOpen(false);
    }, []);

    const displayedCurrencies = useMemo(() => GetConfigurationValue<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfigurationValue<boolean>('currency.display.number.short', false), []);

    const currencyTypes = useMemo(() => {
        if (!purse || !purse.activityPoints || !purse.activityPoints.size) return [];

        const types = Array.from(purse.activityPoints.keys()).filter((type) => displayedCurrencies.indexOf(type) >= 0);
        types.sort((a, b) => {
            if (a === 0) return -1;
            if (b === 0) return 1;
            if (a === 5) return -1;
            if (b === 5) return 1;
            return a - b;
        });

        return types;
    }, [displayedCurrencies, purse]);

    const hasDiamonds = currencyTypes.indexOf(5) >= 0;
    const hasDuckets = currencyTypes.indexOf(0) >= 0;
    const otherCurrencies = currencyTypes.filter((type) => type !== 0 && type !== 5);

    const joinLabel = useMemo(() => localizeWithFallback('purse.join', 'Join'), []);
    const earningsLabel = useMemo(() => localizeWithFallback('earnings.title', 'Earnings'), []);
    const helpLabel = useMemo(() => localizeWithFallback('help.button.name', 'Help'), []);

    const openClub = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        CreateLinkEvent('habboUI/open/hccenter');
    }, []);

    const openEarnings = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        CreateLinkEvent('habboUI/open/vault');
    }, []);

    const handleLogout = useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        const logoutUrl = GetConfigurationValue<string>('login.logout.endpoint', '/api/auth/logout');
        const ssoTicket = (window.NitroConfig?.['sso.ticket'] as string) ?? '';
        const rememberToken = GetRememberLogin()?.token || '';

        try {
            await fetch(logoutUrl, {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'NitroPurseLogout'
                },
                body: JSON.stringify({ ssoTicket, rememberToken })
            });
        } catch {
            /* best-effort — proceed with local logout regardless */
        }

        ClearRememberLogin();
        if (window.NitroConfig) window.NitroConfig['sso.ticket'] = '';
        window.location.reload();
    }, []);

    if (!purse) return null;

    return (
        <Column alignItems="end" className="nitro-purse-container" gap={0}>
            <div className="nitro-purse">
                <div className="nitro-purse__body">
                    <div className="nitro-purse__currencies">
                        {hasDiamonds && <CurrencyView type={5} amount={purse.activityPoints.get(5) || 0} short={currencyDisplayNumberShort} />}
                        <CurrencyView type={-1} amount={purse.credits} short={currencyDisplayNumberShort} />
                        {hasDuckets && <CurrencyView type={0} amount={purse.activityPoints.get(0) || 0} short={currencyDisplayNumberShort} />}
                    </div>
                    <div className="nitro-purse__col nitro-purse__col--primary">
                        {!hcDisabled && (
                            <button type="button" className="nitro-purse__btn nitro-purse__btn--join" onClick={openClub} title={joinLabel}>
                                <LayoutCurrencyIcon type="hc" />
                                <span>{joinLabel}</span>
                            </button>
                        )}
                        <button type="button" className="nitro-purse__btn nitro-purse__btn--earnings" onClick={openEarnings} title={earningsLabel}>
                            <FaChartBar className="nitro-purse__btn-icon" />
                            <span>{earningsLabel}</span>
                        </button>
                    </div>
                    <div className="nitro-purse__col nitro-purse__col--actions">
                        <button
                            type="button"
                            className="nitro-purse__btn nitro-purse__btn--help"
                            onClick={(event) => {
                                event.stopPropagation();
                                CreateLinkEvent('help/show');
                            }}
                            title={helpLabel}
                        >
                            <span>{helpLabel}</span>
                        </button>
                        <button
                            type="button"
                            className="nitro-purse__btn nitro-purse__btn--icon nitro-purse__btn--logout"
                            onClick={handleLogout}
                            title="Log out"
                        >
                            <FaSignOutAlt />
                        </button>
                        <button
                            type="button"
                            className="nitro-purse__btn nitro-purse__btn--icon nitro-purse__btn--settings"
                            onClick={(event) => {
                                event.stopPropagation();
                                setSettingsMenuOpen((value) => !value);
                            }}
                            title={LocalizeText('widget.memenu.settings.title')}
                        >
                            <FaCog />
                        </button>
                    </div>
                </div>
            </div>
            {settingsMenuOpen && (
                <div className="nitro-purse-menu">
                    <button type="button" className="nitro-purse-menu__item" onClick={() => openSettingsSection('audio')}>
                        Impostazioni Audio
                    </button>
                    <button type="button" className="nitro-purse-menu__item nitro-purse-menu__item--disabled" disabled>
                        Impostazioni Discord
                    </button>
                    <button type="button" className="nitro-purse-menu__item" onClick={() => openSettingsSection('chat')}>
                        Impostazioni Chat
                    </button>
                    <button type="button" className="nitro-purse-menu__item" onClick={() => openSettingsSection('other')}>
                        Altre Impostazioni
                    </button>
                    <button
                        type="button"
                        className="nitro-purse-menu__item"
                        onClick={() => {
                            CreateLinkEvent('user-account-settings/show');
                            setSettingsMenuOpen(false);
                        }}
                    >
                        Gestione Account
                    </button>
                    <button type="button" className="nitro-purse-menu__item nitro-purse-menu__item--disabled" disabled>
                        Filtro Parole
                    </button>
                </div>
            )}
            {otherCurrencies.length > 0 && (
                <div className="nitro-purse__other">
                    {otherCurrencies.map((type) => (
                        <SeasonalView key={type} type={type} amount={purse.activityPoints.get(type) || 0} />
                    ))}
                </div>
            )}
        </Column>
    );
};
