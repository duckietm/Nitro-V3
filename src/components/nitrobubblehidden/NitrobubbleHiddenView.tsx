import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';

export const NitrobubbleHiddenView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() =>
    {
        document.body.classList.toggle('nitro-bubbles-hidden', isVisible);

        return () => document.body.classList.remove('nitro-bubbles-hidden');
    }, [ isVisible ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'nitrobubblehidden/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    return null;
};
