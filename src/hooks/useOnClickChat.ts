import { CreateLinkEvent } from '@nitrots/nitro-renderer';
import { useBetween } from 'use-between';
import { LocalizeText } from '../api';
import { useNotification } from './notification';

const YOUTUBE_REGEX = /(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?.*v=|shorts\/)?([a-zA-Z0-9_-]{11})/;

const useOnClickChatState = () =>
{
    const { showConfirm = null } = useNotification();

    const onClickChat = (event: React.MouseEvent<HTMLElement>) =>
    {
        if(!(event.target instanceof HTMLAnchorElement) || !event.target.href) return;

        event.stopPropagation();
        event.preventDefault();

        const url = event.target.href;
        const youtubeMatch = url.match(YOUTUBE_REGEX);

        if(youtubeMatch)
        {
            CreateLinkEvent('youtube-tv/show/' + youtubeMatch[1]);
        }
        else
        {
            showConfirm(LocalizeText('chat.confirm.openurl', [ 'url' ], [ url ]), () =>
            {
                window.open(url, '_blank');
            }, null, null, null, LocalizeText('generic.alert.title'), null, 'link');
        }
    };

    return { onClickChat };
};

export const useOnClickChat = () => useBetween(useOnClickChatState);
