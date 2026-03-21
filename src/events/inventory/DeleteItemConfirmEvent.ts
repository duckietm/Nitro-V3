import { NitroEvent } from '@nitrots/events';
import { FurnitureItem } from '../../api';

export class DeleteItemConfirmEvent extends NitroEvent
{
    public static DELETE_ITEM_CONFIRM: string = 'DICE_DELETE_ITEM_CONFIRM';

    constructor(
        public readonly item: FurnitureItem,
        public readonly amount: number)
    {
        super(DeleteItemConfirmEvent.DELETE_ITEM_CONFIRM);
    }
}
