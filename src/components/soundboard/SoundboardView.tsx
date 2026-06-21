import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../api';
import { Column, Flex, Text } from '../../common';
import { useSoundboard } from '../../hooks';
import { NitroCard } from '../../layout';

export const SoundboardView: FC<{}> = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { enabled, sounds, lastPlayed, play } = useSoundboard();

    const PAGE_SIZE = 9;
    const [page, setPage] = useState(0);
    const totalPages = Math.max(1, Math.ceil(sounds.length / PAGE_SIZE));

    // Clamp the page if the sound list shrinks (or on first load).
    useEffect(() => {
        if (page > totalPages - 1) setPage(0);
    }, [totalPages, page]);

    const pageSounds = sounds.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');
                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible((prev) => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'soundboard/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    // The soundboard belongs to the room — close it when the room turns it off.
    useEffect(() => {
        if (!enabled) setIsVisible(false);
    }, [enabled]);

    if (!isVisible || !enabled) return null;

    return (
        <NitroCard className="w-[420px] max-w-[96vw]" uniqueKey="soundboard">
            <NitroCard.Header headerText={LocalizeText('soundboard.title')} onCloseClick={() => setIsVisible(false)} />
            <NitroCard.Content>
                <Column gap={2}>
                    {!sounds.length && (
                        <Text small className="text-black/50">
                            {LocalizeText('soundboard.empty')}
                        </Text>
                    )}
                    {!!sounds.length && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                {pageSounds.map((sound) => (
                                    <button
                                        key={sound.id}
                                        onClick={() => play(sound)}
                                        title={sound.name}
                                        className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-[#3a7bb5] px-2 text-white shadow transition-transform hover:bg-[#336ea3] active:scale-95"
                                    >
                                        <span className="text-2xl leading-none">🔊</span>
                                        <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{sound.name}</span>
                                    </button>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <Flex alignItems="center" justifyContent="center" gap={2} className="select-none pt-1">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        className="cursor-pointer rounded bg-[#3a7bb5] px-3 py-1 text-sm font-bold text-white hover:bg-[#336ea3] disabled:cursor-default disabled:opacity-40"
                                    >
                                        ◀
                                    </button>
                                    <Text small bold className="min-w-[44px] text-center text-[#2f6f95]">
                                        {page + 1} / {totalPages}
                                    </Text>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        className="cursor-pointer rounded bg-[#3a7bb5] px-3 py-1 text-sm font-bold text-white hover:bg-[#336ea3] disabled:cursor-default disabled:opacity-40"
                                    >
                                        ▶
                                    </button>
                                </Flex>
                            )}
                        </>
                    )}
                    {lastPlayed && (
                        <Flex alignItems="center" justifyContent="center" className="pt-1">
                            <Text small className="text-[#2f6f95]">
                                {LocalizeText('soundboard.lastplayed', ['user'], [lastPlayed.username])}
                            </Text>
                        </Flex>
                    )}
                </Column>
            </NitroCard.Content>
        </NitroCard>
    );
};
