import { AddLinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';

export const YoutubeTvView: FC<{}> = props =>
{
    const [ videoId, setVideoId ] = useState<string>('');
    const [ isVisible, setIsVisible ] = useState<boolean>(false);

    const close = () => setIsVisible(false);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 3) return;

                switch(parts[1])
                {
                    case 'show':
                        setVideoId(parts[2]);
                        setIsVisible(true);
                        return;
                }
            },
            eventUrlPrefix: 'youtube-tv/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const originUrl = useMemo(() => GetConfigurationValue<string>('url.prefix', ''), []);

    if(!isVisible) return null;

    return (
        <NitroCardView className="w-[560px] h-[345px]" uniqueKey="youtube-tv">
            <NitroCardHeaderView headerText="YouTube TV" onCloseClick={ close } />
            <NitroCardContentView grow gap={ 0 } overflow="hidden">
                { (videoId.length > 0) &&
                    <iframe
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        src={ `https://www.youtube.com/embed/${ videoId }?autoplay=1&mute=0&controls=1&origin=${ originUrl }&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&enablejsapi=1&widgetid=3` }
                    />
                }
            </NitroCardContentView>
        </NitroCardView>
    );
};
