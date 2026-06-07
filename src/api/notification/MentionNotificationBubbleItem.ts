import { IMentionEntry } from '../mentions';
import { NotificationBubbleItem } from './NotificationBubbleItem';
import { NotificationBubbleType } from './NotificationBubbleType';

/**
 * A notification bubble that carries a full mention entry, so the dedicated
 * mention bubble layout can render the sender's avatar (from the figure) and
 * the go-to-room action — data the plain NotificationBubbleItem can't hold.
 */
export class MentionNotificationBubbleItem extends NotificationBubbleItem
{
    private _mention: IMentionEntry;

    constructor(mention: IMentionEntry)
    {
        super(mention.message, NotificationBubbleType.MENTION, null, null, mention.senderUsername);

        this._mention = mention;
    }

    public get mention(): IMentionEntry
    {
        return this._mention;
    }
}
