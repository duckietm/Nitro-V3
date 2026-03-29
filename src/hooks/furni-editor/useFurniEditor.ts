import { FurniEditorBySpriteComposer, FurniEditorDeleteComposer, FurniEditorDetailComposer, FurniEditorDetailResultEvent, FurniEditorInteractionsComposer, FurniEditorInteractionsResultEvent, FurniEditorResultEvent, FurniEditorSearchComposer, FurniEditorSearchResultEvent, FurniEditorUpdateComposer } from '@nitrots/nitro-renderer';
import { useCallback, useRef, useState } from 'react';
import { NotificationAlertType, SendMessageComposer } from '../../api';
import { useMessageEvent, useNotification } from '../../hooks';

export interface FurniItem
{
    id: number;
    spriteId: number;
    itemName: string;
    publicName: string;
    type: string;
    width: number;
    length: number;
    stackHeight: number;
    allowStack: boolean;
    allowWalk: boolean;
    allowSit: boolean;
    allowLay: boolean;
    interactionType: string;
    interactionModesCount: number;
}

export interface FurniDetail extends FurniItem
{
    allowGift: boolean;
    allowTrade: boolean;
    allowRecycle: boolean;
    allowMarketplaceSell: boolean;
    allowInventoryStack: boolean;
    vendingIds: string;
    customparams: string;
    effectIdMale: number;
    effectIdFemale: number;
    clothingOnWalk: string;
    multiheight: string;
    description: string;
    usageCount: number;
}

export interface CatalogRef
{
    id: number;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    pageId: number;
    pageName: string;
}

export const useFurniEditor = () =>
{
    const [ items, setItems ] = useState<FurniItem[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ page, setPage ] = useState(1);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ selectedItem, setSelectedItem ] = useState<FurniDetail | null>(null);
    const [ catalogItems, setCatalogItems ] = useState<CatalogRef[]>([]);
    const [ interactions, setInteractions ] = useState<string[]>([]);
    const [ furniDataEntry, setFurniDataEntry ] = useState<Record<string, unknown> | null>(null);
    const pendingActionRef = useRef<string | null>(null);
    const { simpleAlert = null } = useNotification();

    const clearError = useCallback(() => setError(null), []);

    // Handle search results
    useMessageEvent(FurniEditorSearchResultEvent, (event: FurniEditorSearchResultEvent) =>
    {
        const parser = event.getParser();

        setLoading(false);
        setItems(parser.items.map(item => ({
            id: item.id,
            spriteId: item.spriteId,
            itemName: item.itemName,
            publicName: item.publicName,
            type: item.type,
            width: item.width,
            length: item.length,
            stackHeight: item.stackHeight,
            allowStack: item.allowStack,
            allowWalk: item.allowWalk,
            allowSit: item.allowSit,
            allowLay: item.allowLay,
            interactionType: item.interactionType,
            interactionModesCount: item.interactionModesCount
        })));
        setTotal(parser.total);
        setPage(parser.page);
    });

    // Handle detail results (for both detail and by-sprite lookups)
    useMessageEvent(FurniEditorDetailResultEvent, (event: FurniEditorDetailResultEvent) =>
    {
        const parser = event.getParser();
        const item = parser.item;

        setLoading(false);
        setSelectedItem({
            id: item.id,
            spriteId: item.spriteId,
            itemName: item.itemName,
            publicName: item.publicName,
            type: item.type,
            width: item.width,
            length: item.length,
            stackHeight: item.stackHeight,
            allowStack: item.allowStack,
            allowWalk: item.allowWalk,
            allowSit: item.allowSit,
            allowLay: item.allowLay,
            interactionType: item.interactionType,
            interactionModesCount: item.interactionModesCount,
            allowGift: item.allowGift,
            allowTrade: item.allowTrade,
            allowRecycle: item.allowRecycle,
            allowMarketplaceSell: item.allowMarketplaceSell,
            allowInventoryStack: item.allowInventoryStack,
            vendingIds: item.vendingIds,
            customparams: item.customparams,
            effectIdMale: item.effectIdMale,
            effectIdFemale: item.effectIdFemale,
            clothingOnWalk: item.clothingOnWalk,
            multiheight: item.multiheight,
            description: item.description,
            usageCount: item.usageCount
        });
        setCatalogItems(parser.catalogItems.map(ref => ({
            id: ref.id,
            catalogName: ref.catalogName,
            costCredits: ref.costCredits,
            costPoints: ref.costPoints,
            pointsType: ref.pointsType,
            pageId: ref.pageId,
            pageName: ref.pageName
        })));

        let furniData: Record<string, unknown> | null = null;

        try
        {
            if(parser.furniDataJson && parser.furniDataJson !== '{}' && parser.furniDataJson !== '')
            {
                furniData = JSON.parse(parser.furniDataJson);
            }
        }
        catch(e) {}

        setFurniDataEntry(furniData);
    });

    // Handle interaction types list
    useMessageEvent(FurniEditorInteractionsResultEvent, (event: FurniEditorInteractionsResultEvent) =>
    {
        setInteractions(event.getParser().interactions);
    });

    // Handle operation results (update, create, delete)
    useMessageEvent(FurniEditorResultEvent, (event: FurniEditorResultEvent) =>
    {
        const parser = event.getParser();
        const action = pendingActionRef.current;

        pendingActionRef.current = null;
        setLoading(false);

        if(!parser.success)
        {
            setError(parser.message || 'Operation failed');

            if(simpleAlert)
            {
                simpleAlert(parser.message || 'Operation failed', NotificationAlertType.ALERT, null, null, 'Furni Editor Error');
            }

            return;
        }

        setError(null);

        if(action === 'update')
        {
            // Auto-reload detail after update
            if(selectedItem)
            {
                SendMessageComposer(new FurniEditorDetailComposer(selectedItem.id));
            }

            if(simpleAlert)
            {
                simpleAlert('Item updated successfully', NotificationAlertType.DEFAULT, null, null, 'Furni Editor');
            }
        }
        else if(action === 'delete')
        {
            setSelectedItem(null);
            setCatalogItems([]);
            setFurniDataEntry(null);

            if(simpleAlert)
            {
                simpleAlert('Item deleted successfully', NotificationAlertType.DEFAULT, null, null, 'Furni Editor');
            }
        }
    });

    const searchItems = useCallback((query: string, type: string, pg: number) =>
    {
        setLoading(true);
        setError(null);
        SendMessageComposer(new FurniEditorSearchComposer(query, type, pg));
    }, []);

    const loadDetail = useCallback((id: number) =>
    {
        setLoading(true);
        setError(null);
        SendMessageComposer(new FurniEditorDetailComposer(id));
    }, []);

    const loadBySpriteId = useCallback((spriteId: number) =>
    {
        setLoading(true);
        setError(null);
        SendMessageComposer(new FurniEditorBySpriteComposer(spriteId));
    }, []);

    const updateItem = useCallback((id: number, fields: Record<string, unknown>) =>
    {
        setLoading(true);
        setError(null);
        pendingActionRef.current = 'update';
        SendMessageComposer(new FurniEditorUpdateComposer(id, JSON.stringify(fields)));
    }, []);

    const deleteItem = useCallback((id: number) =>
    {
        setLoading(true);
        setError(null);
        pendingActionRef.current = 'delete';
        SendMessageComposer(new FurniEditorDeleteComposer(id));
    }, []);

    const loadInteractions = useCallback(() =>
    {
        SendMessageComposer(new FurniEditorInteractionsComposer());
    }, []);

    return {
        items, total, page, loading, error, clearError,
        selectedItem, setSelectedItem, catalogItems, furniDataEntry,
        interactions,
        searchItems, loadDetail, loadBySpriteId, updateItem, deleteItem, loadInteractions
    };
};
