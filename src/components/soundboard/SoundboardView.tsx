import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../api';
import { Column, Flex, Text } from '../../common';
import { useSoundboard } from '../../hooks';
import { NitroCard } from '../../layout';

export const SoundboardView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { enabled, sounds, lastPlayed, play } = useSoundboard();

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
            eventUrlPrefix: 'soundboard/',
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    // The soundboard belongs to the room — close it when the room turns it off.
    useEffect(() =>
    {
        if(!enabled) setIsVisible(false);
    }, [ enabled ]);

    if(!isVisible || !enabled) return null;

    return (
        <NitroCard className="w-[420px] max-w-[96vw]" uniqueKey="soundboard">
            <NitroCard.Header headerText={ LocalizeText('soundboard.title') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCard.Content>
                <Column gap={ 2 }>
                    { !sounds.length &&
                        <Text small className="text-black/50">{ LocalizeText('soundboard.empty') }</Text> }
                    { !!sounds.length &&
                        <div className="grid grid-cols-3 gap-2">
                            { sounds.map(sound => (
                                <button
                                    key={ sound.id }
                                    onClick={ () => play(sound) }
                                    title={ sound.name }
                                    className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-[#3a7bb5] px-2 text-white shadow transition-transform hover:bg-[#336ea3] active:scale-95">
                                    <span className="text-2xl leading-none">🔊</span>
                                    <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{ sound.name }</span>
                                </button>
                            )) }
                        </div> }
                    { lastPlayed &&
                        <Flex alignItems="center" justifyContent="center" className="pt-1">
                            <Text small className="text-[#2f6f95]">
                                { LocalizeText('soundboard.lastplayed', [ 'user' ], [ lastPlayed.username ]) }
                            </Text>
                        </Flex> }
                </Column>
            </NitroCard.Content>
        </NitroCard>
    );
};
