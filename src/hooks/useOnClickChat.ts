import { useBetween } from 'use-between';
import { LocalizeText } from '../api';
import { useNotification } from './notification';

const useOnClickChatState = () =>
{
    const { showConfirm = null } = useNotification();

    const onClickChat = (event: React.MouseEvent<HTMLElement>) =>
    {
        if(!(event.target instanceof HTMLAnchorElement) || !event.target.href) return;

        event.stopPropagation();
        event.preventDefault();

        const url = event.target.href;

        showConfirm(LocalizeText('chat.confirm.openurl', [ 'url' ], [ url ]), () =>
        {
            window.open(url, '_blank');
        }, null, null, null, LocalizeText('generic.alert.title'), null, 'link');
    };

    return { onClickChat };
};

export const useOnClickChat = () => useBetween(useOnClickChatState);
