import { GetTickerTime } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { CatalogType, FriendlyTime, LocalizeText } from '../../../../api';
import buildersClubIcon from '../../../../assets/images/toolbar/icons/buildersclub.png';
import { useCatalog } from '../../../../hooks';

export const CatalogBuildersClubStatusView: FC = () =>
{
    const { currentType = CatalogType.NORMAL, furniCount = 0, furniLimit = 0, secondsLeft = 0, secondsLeftWithGrace = 0, updateTime = 0 } = useCatalog();
    const [ ticker, setTicker ] = useState(() => GetTickerTime());

    useEffect(() =>
    {
        if(currentType !== CatalogType.BUILDER) return;

        const interval = window.setInterval(() => setTicker(GetTickerTime()), 1000);

        return () => window.clearInterval(interval);
    }, [ currentType ]);

    const localizeOrDefault = (key: string, fallback: string, parameters: string[] = [], values: string[] = []) =>
    {
        const localized = LocalizeText(key, parameters, values);

        return ((localized && (localized !== key)) ? localized : fallback);
    };

    const remainingSeconds = useMemo(() =>
    {
        const baseSeconds = (secondsLeft > 0) ? secondsLeft : secondsLeftWithGrace;

        if(baseSeconds <= 0) return 0;

        const elapsed = ((updateTime > 0) ? Math.floor((ticker - updateTime) / 1000) : 0);

        return Math.max(0, (baseSeconds - elapsed));
    }, [ secondsLeft, secondsLeftWithGrace, ticker, updateTime ]);

    const isFullMember = (secondsLeft > 0);
    const membershipStatus = localizeOrDefault(
        isFullMember ? 'builder.header.status.member' : 'builder.header.status.trial',
        isFullMember ? 'Membro Completo' : 'Prova Gratuita'
    );

    const title = localizeOrDefault(
        'builder.header.title',
        `Stato Builders' Club: ${ membershipStatus }`,
        [ 'BCSTATUS' ],
        [ membershipStatus ]
    );

    const durationText = localizeOrDefault(
        'builder.header.status.membership',
        `Tempo mancante: ${ FriendlyTime.format(remainingSeconds) }`,
        [ 'DURATION' ],
        [ FriendlyTime.format(remainingSeconds) ]
    );

    const limitText = localizeOrDefault(
        'builder.header.status.limit',
        `Furni usati: ${ furniCount }/${ furniLimit }`,
        [ 'COUNT', 'LIMIT' ],
        [ furniCount.toString(), furniLimit.toString() ]
    );

    if(currentType !== CatalogType.BUILDER) return null;

    return (
        <div className="builders-club-status-shell flex items-center gap-3 px-4 py-3">
            <div className="builders-club-status-icon-shell flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md">
                <img alt="" className="h-[28px] w-[28px] object-contain" src={ buildersClubIcon } />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] leading-none font-bold text-white">
                    { title }
                </span>
                <span className="mt-1 text-[11px] leading-tight text-white/95">
                    { durationText }
                </span>
                <span className="text-[11px] leading-tight text-[#ffba45]">
                    { limitText }
                </span>
            </div>
        </div>
    );
};
