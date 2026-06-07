import { FC, MouseEvent } from 'react';
import { FaArrowRight, FaTimes } from 'react-icons/fa';
import { formatMentionTime, IMentionEntry, LocalizeText, MentionType } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { MentionMessageView } from './MentionMessageView';

interface MentionRowViewProps
{
    mention: IMentionEntry;
    ownUsername: string;
    onOpen: (mention: IMentionEntry) => void;
    onGoto?: (mention: IMentionEntry) => void;
    onRemove?: (mention: IMentionEntry) => void;
}

export const MentionRowView: FC<MentionRowViewProps> = props =>
{
    const { mention, ownUsername, onOpen, onGoto = null, onRemove = null } = props;

    const isRoom = (mention.mentionType === MentionType.ROOM);
    const typeTitle = LocalizeText(isRoom ? 'mentions.type.room' : 'mentions.type.direct');
    const time = formatMentionTime(mention.timestamp);

    const stop = (event: MouseEvent, action: () => void) =>
    {
        event.stopPropagation();
        action();
    };

    return (
        <div className={ `mention-row ${ mention.read ? '' : 'is-unread' }` } onClick={ () => onOpen(mention) }>
            { !mention.read &&
                <span className="mention-row-unread-dot" aria-hidden /> }
            <div className="mention-row-avatar" title={ typeTitle }>
                <LayoutAvatarImageView headOnly direction={ 2 } figure={ mention.senderFigure } />
                <span className={ `mention-row-type ${ isRoom ? 'is-room' : 'is-direct' }` }>{ isRoom ? '∗' : '@' }</span>
            </div>
            <div className="mention-row-body">
                <div className="mention-row-head">
                    <span className="mention-row-name">{ mention.senderUsername }</span>
                    { (mention.roomName && (mention.roomName.length > 0)) &&
                        <span className="mention-row-room">· { mention.roomName }</span> }
                </div>
                <MentionMessageView className="mention-row-msg" ownUsername={ ownUsername } text={ mention.message } />
            </div>
            <div className="mention-row-meta">
                { (time.length > 0) &&
                    <span className="mention-row-time">{ time }</span> }
                <div className="mention-row-actions">
                    { onGoto &&
                        <button type="button" className="mention-row-action" title={ LocalizeText('mentions.action.goto') } onClick={ event => stop(event, () => onGoto(mention)) }><FaArrowRight /></button> }
                    { onRemove &&
                        <button type="button" className="mention-row-action is-remove" title={ LocalizeText('mentions.action.remove') } onClick={ event => stop(event, () => onRemove(mention)) }><FaTimes /></button> }
                </div>
            </div>
        </div>
    );
};
