import { NitroEvent } from '@nitrots/nitro-renderer';
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
