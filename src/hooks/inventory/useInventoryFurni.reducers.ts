import { CreateLinkEvent, FurnitureListAddOrUpdateEvent, FurnitureListEvent, FurnitureListItemParser, FurnitureListRemovedEvent } from '@nitrots/nitro-renderer';
import { CloneObject, FurnitureItem, GroupItem, UnseenItemCategory, addFurnitureItem, attemptItemPlacement, cancelRoomObjectPlacement, getAllItemIds, getPlacingItemId, mergeFurniFragments } from '../../api';

/**
 * Pure reducers for furniture inventory state. Each takes the current
 * GroupItem[] state plus the inbound event plus a context object carrying
 * the cross-cutting helpers (unseen tracker, ui-event dispatcher).
 *
 * Side effects (CreateLinkEvent, attemptItemPlacement, dispatchAdded,
 * cancelRoomObjectPlacement) are intentionally kept here to preserve the
 * exact behavior of the original useInventoryFurni — they fire when the
 * state transition demands them. The original code embedded them inside
 * setGroupItems(prev => ...) and we mirror that.
 */

export interface FurniReducerContext {
    isUnseen: (category: number, id: number) => boolean;
    dispatchAdded: (id: number, type: number, category: number) => void;
    fragments: { current: Map<number, FurnitureListItemParser>[] | null };
}

export const applyFurnitureListAddOrUpdate = (
    state: GroupItem[],
    event: FurnitureListAddOrUpdateEvent,
    ctx: FurniReducerContext
): GroupItem[] =>
{
    const parser = event.getParser();
    const newValue = [ ...state ];

    for(const item of parser.items)
    {
        let i = 0;
        let groupItem: GroupItem = null;

        while(i < newValue.length)
        {
            const group = newValue[i];

            let j = 0;

            while(j < group.items.length)
            {
                const furniture = group.items[j];

                if(furniture.id === item.itemId)
                {
                    furniture.update(item);

                    const newFurniture = [ ...group.items ];

                    newFurniture[j] = furniture;

                    group.items = newFurniture;

                    groupItem = group;

                    break;
                }

                j++;
            }

            if(groupItem) break;

            i++;
        }

        if(groupItem)
        {
            groupItem.hasUnseenItems = true;

            newValue[i] = CloneObject(groupItem);
        }
        else
        {
            const furniture = new FurnitureItem(item);

            addFurnitureItem(newValue, furniture, ctx.isUnseen(UnseenItemCategory.FURNI, item.itemId));

            ctx.dispatchAdded(furniture.id, furniture.type, furniture.category);
        }
    }

    return newValue;
};

export const applyFurnitureList = (
    state: GroupItem[],
    event: FurnitureListEvent,
    ctx: FurniReducerContext
): GroupItem[] =>
{
    const parser = event.getParser();

    if(!ctx.fragments.current) ctx.fragments.current = new Array(parser.totalFragments);

    const fragment = mergeFurniFragments(parser.fragment, parser.totalFragments, parser.fragmentNumber, ctx.fragments.current);

    if(!fragment) return state;

    const newValue = [ ...state ];
    const existingIds = getAllItemIds(newValue);

    for(const existingId of existingIds)
    {
        if(fragment.get(existingId)) continue;

        let index = 0;

        while(index < newValue.length)
        {
            const group = newValue[index];
            const item = group.remove(existingId);

            if(!item)
            {
                index++;

                continue;
            }

            if(getPlacingItemId() === item.ref)
            {
                cancelRoomObjectPlacement();

                if(!attemptItemPlacement(group))
                {
                    CreateLinkEvent('inventory/show');
                }
            }

            if(group.getTotalCount() <= 0)
            {
                newValue.splice(index, 1);

                group.dispose();
            }

            break;
        }
    }

    for(const itemId of fragment.keys())
    {
        if(existingIds.indexOf(itemId) >= 0) continue;

        const parserItem = fragment.get(itemId);

        if(!parserItem) continue;

        const item = new FurnitureItem(parserItem);

        addFurnitureItem(newValue, item, ctx.isUnseen(UnseenItemCategory.FURNI, itemId));

        ctx.dispatchAdded(item.id, item.type, item.category);
    }

    ctx.fragments.current = null;

    return newValue;
};

export const applyFurnitureListRemoved = (
    state: GroupItem[],
    event: FurnitureListRemovedEvent
): GroupItem[] =>
{
    const parser = event.getParser();
    const newValue = [ ...state ];

    let index = 0;

    while(index < newValue.length)
    {
        const group = newValue[index];
        const item = group.remove(parser.itemId);

        if(!item)
        {
            index++;

            continue;
        }

        if(getPlacingItemId() === item.ref)
        {
            cancelRoomObjectPlacement();

            if(!attemptItemPlacement(group)) CreateLinkEvent('inventory/show');
        }

        if(group.getTotalCount() <= 0)
        {
            newValue.splice(index, 1);

            group.dispose();
        }

        break;
    }

    return newValue;
};

export const clearUnseenFlags = (state: GroupItem[]): GroupItem[] =>
{
    const newValue = [ ...state ];

    for(const newGroup of newValue) newGroup.hasUnseenItems = false;

    return newValue;
};

export const refreshGroupItemsLocalization = (state: GroupItem[]): GroupItem[] =>
{
    if(!state?.length) return state;

    return state.map(groupItem =>
    {
        const nextGroupItem = groupItem.clone();

        nextGroupItem.refreshLocalization();

        return nextGroupItem;
    });
};
