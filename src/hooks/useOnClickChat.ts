import { useBetween } from 'use-between';
import { isSafeExternalUrl, LocalizeText } from '../api';
import { useNotification } from './notification';

const useOnClickChatState = () => {
    const { showConfirm = null } = useNotification();

    const onClickChat = (event: React.MouseEvent<HTMLElement>) => {
        if (!(event.target instanceof HTMLAnchorElement) || !event.target.href) return;

        event.stopPropagation();
        event.preventDefault();

        const url = event.target.href;

        // Never open a URL that came from chat unless it is a plain web link —
        // a javascript:/data: href would otherwise run in our origin.
        if (!isSafeExternalUrl(url)) return;

        showConfirm(
            LocalizeText('chat.confirm.openurl', ['url'], [url]),
            () => {
                window.open(url, '_blank', 'noopener,noreferrer');
            },
            null,
            null,
            null,
            LocalizeText('generic.alert.title'),
            null
        );
    };

    return { onClickChat };
};

export const useOnClickChat = () => useBetween(useOnClickChatState);
