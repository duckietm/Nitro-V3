import { FurnitureListAddOrUpdateEvent, FurnitureListComposer, FurnitureListEvent, FurnitureListInvalidateEvent, FurnitureListItemParser, FurnitureListRemovedEvent } from '@nitrots/nitro-renderer';
import { useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { DispatchUiEvent, GroupItem, SendMessageComposer, UnseenItemCategory } from '../../api';
import { InventoryFurniAddedEvent } from '../../events';
import { useMessageEvent } from '../events';
import { useSharedVisibility } from '../useSharedVisibility';
import { useInventoryUnseenTracker } from './useInventoryUnseenTracker';
import { applyFurnitureList, applyFurnitureListAddOrUpdate, applyFurnitureListRemoved, clearUnseenFlags, FurniReducerContext, refreshGroupItemsLocalization } from './useInventoryFurni.reducers';

const useInventoryFurniState = () =>
{
    const [ needsUpdate, setNeedsUpdate ] = useState(true);
    const [ groupItems, setGroupItems ] = useState<GroupItem[]>([]);
    const [ selectedItem, setSelectedItem ] = useState<GroupItem>(null);
    const fragmentsRef = useRef<Map<number, FurnitureListItemParser>[] | null>(null);
    const { isVisible = false, activate = null, deactivate = null } = useSharedVisibility();
    const { isUnseen = null, resetCategory = null } = useInventoryUnseenTracker();

    const getItemsByType = (type: number) =>
    {
        if(!groupItems || !groupItems.length) return;

        return groupItems.filter((i) => i.type === type);
    };

    const getWallItemById = (id: number) =>
    {
        if(!groupItems || !groupItems.length) return;

        for(const groupItem of groupItems)
        {
            const item = groupItem.getItemById(id);

            if(item && item.isWallItem) return groupItem;
        }

        return null;
    };

    const getFloorItemById = (id: number) =>
    {
        if(!groupItems || !groupItems.length) return;

        for(const groupItem of groupItems)
        {
            const item = groupItem.getItemById(id);

            if(item && !item.isWallItem) return groupItem;
        }

        return null;
    };

    const buildContext = (): FurniReducerContext => ({
        isUnseen,
        dispatchAdded: (id, type, category) => DispatchUiEvent(new InventoryFurniAddedEvent(id, type, category)),
        fragments: fragmentsRef
    });

    useMessageEvent<FurnitureListAddOrUpdateEvent>(FurnitureListAddOrUpdateEvent, event =>
    {
        setGroupItems(prev => applyFurnitureListAddOrUpdate(prev, event, buildContext()));
    });

    useMessageEvent<FurnitureListEvent>(FurnitureListEvent, event =>
    {
        setGroupItems(prev => applyFurnitureList(prev, event, buildContext()));
    });

    useMessageEvent<FurnitureListInvalidateEvent>(FurnitureListInvalidateEvent, () =>
    {
        setNeedsUpdate(true);
    });

    useMessageEvent<FurnitureListRemovedEvent>(FurnitureListRemovedEvent, event =>
    {
        setGroupItems(prev => applyFurnitureListRemoved(prev, event));
    });

    useEffect(() =>
    {
        if(!groupItems || !groupItems.length) return;

        setSelectedItem(prevValue =>
        {
            let newValue = prevValue;

            if(newValue && (groupItems.indexOf(newValue) === -1)) newValue = null;

            if(!newValue) newValue = groupItems[0];

            return newValue;
        });
    }, [ groupItems ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        return () =>
        {
            if(resetCategory(UnseenItemCategory.FURNI))
            {
                setGroupItems(prev => clearUnseenFlags(prev));
            }
        };
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        if(!isVisible || !needsUpdate) return;

        SendMessageComposer(new FurnitureListComposer());

        setNeedsUpdate(false);
    }, [ isVisible, needsUpdate ]);

    useEffect(() =>
    {
        const refreshFurnitureLocalization = () =>
        {
            setGroupItems(prev => refreshGroupItemsLocalization(prev));

            setSelectedItem(prevValue =>
            {
                if(!prevValue) return prevValue;

                const nextGroupItem = prevValue.clone();

                nextGroupItem.refreshLocalization();

                return nextGroupItem;
            });
        };

        window.addEventListener('nitro-localization-updated', refreshFurnitureLocalization);

        return () => window.removeEventListener('nitro-localization-updated', refreshFurnitureLocalization);
    }, []);

    return { isVisible, groupItems, setGroupItems, selectedItem, setSelectedItem, activate, deactivate, getWallItemById, getFloorItemById, getItemsByType };
};

export const useInventoryFurni = () => useBetween(useInventoryFurniState);
