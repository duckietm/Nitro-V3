import { CreateLinkEvent, MarkMentionsReadComposer } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useExternalSnapshot } from '../../hooks/events/useExternalSnapshot';
import { markRead } from '../../hooks/mentions/mentionsStore';
import { dismissMentionToast, getMentionToasts, MentionToast, subscribeMentionToasts } from '../../hooks/mentions/mentionToastsStore';

// Quanto resta visibile un toast prima di nascondersi da solo (resta non-letto).
const AUTO_DISMISS_MS = 8000;

const MentionToastItemView: FC<{ toast: MentionToast }> = ({ toast }) =>
{
    useEffect(() =>
    {
        const timer = window.setTimeout(() => dismissMentionToast(toast.mentionId), AUTO_DISMISS_MS);
        return () => window.clearTimeout(timer);
    }, [ toast.mentionId ]);

    // Dismiss esplicito: segna letta (badge toolbar si aggiorna) + persiste sul server + chiude.
    const onDismiss = (event: MouseEvent) =>
    {
        event.stopPropagation();
        markRead(toast.mentionId);
        SendMessageComposer(new MarkMentionsReadComposer(1, toast.mentionId));
        dismissMentionToast(toast.mentionId);
    };

    const onOpen = () =>
    {
        CreateLinkEvent('mentions/toggle');
        dismissMentionToast(toast.mentionId);
    };

    return (
        <div className="mention-toast" onClick={ onOpen }>
            <div className="mention-toast-avatar">
                <LayoutAvatarImageView headOnly direction={ 2 } figure={ toast.senderFigure } />
            </div>
            <div className="mention-toast-body">
                <div className="mention-toast-title">{ toast.senderUsername }</div>
                <div className="mention-toast-message">{ toast.message }</div>
            </div>
            <button className="mention-toast-dismiss" title={ LocalizeText('generic.cancel') } type="button" onClick={ onDismiss }>
                <FaTimes />
            </button>
        </div>
    );
};

export const MentionToastsView: FC = () =>
{
    const toasts = useExternalSnapshot(subscribeMentionToasts, getMentionToasts);

    if(!toasts || !toasts.length) return null;

    return (
        <div className="mention-toasts">
            { toasts.map(toast => <MentionToastItemView key={ toast.mentionId } toast={ toast } />) }
        </div>
    );
};
