import { FurniEditorBySpriteComposer, FurniEditorCreateComposer, FurniEditorDeleteComposer, FurniEditorDetailComposer, FurniEditorDetailEvent as FurniEditorDetailMsgEvent, FurniEditorInteractionsComposer, FurniEditorInteractionsEvent as FurniEditorInteractionsMsgEvent, FurniEditorResultEvent as FurniEditorResultMsgEvent, FurniEditorSearchComposer, FurniEditorSearchEvent as FurniEditorSearchMsgEvent, FurniEditorUpdateComposer } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

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
    revision: number;
    category: string;
    defaultdir: number;
    offerid: number;
    buyout: boolean;
    rentofferid: number;
    rentbuyout: boolean;
    bc: boolean;
    excludeddynamic: boolean;
    furniline: string;
    environment: string;
    rare: boolean;
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
    const [ lastResult, setLastResult ] = useState<{ success: boolean; message: string; id: number } | null>(null);

    const clearError = useCallback(() => setError(null), []);

    // Listen for search results
    useMessageEvent(FurniEditorSearchMsgEvent, (event: any) =>
    {
        const parser = event.getParser();

        setItems(parser.items);
        setTotal(parser.total);
        setPage(parser.page);
        setLoading(false);
    });

    // Listen for detail results
    useMessageEvent(FurniEditorDetailMsgEvent, (event: any) =>
    {
        const parser = event.getParser();

        setSelectedItem(parser.item as FurniDetail);
        setCatalogItems(parser.catalogItems as CatalogRef[]);

        try
        {
            setFurniDataEntry(parser.furniDataJson ? JSON.parse(parser.furniDataJson) : null);
        }
        catch
        {
            setFurniDataEntry(null);
        }

        setLoading(false);
    });

    // Listen for interactions results
    useMessageEvent(FurniEditorInteractionsMsgEvent, (event: any) =>
    {
        const parser = event.getParser();

        setInteractions(parser.interactions);
    });

    // Listen for operation results (update/create/delete)
    useMessageEvent(FurniEditorResultMsgEvent, (event: any) =>
    {
        const parser = event.getParser();

        setLastResult({ success: parser.success, message: parser.message, id: parser.id });
        setLoading(false);

        if(!parser.success)
        {
            setError(parser.message);
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
        SendMessageComposer(new FurniEditorUpdateComposer(id, JSON.stringify(fields)));
    }, []);

    const createItem = useCallback((fields: Record<string, unknown>) =>
    {
        setLoading(true);
        setError(null);
        SendMessageComposer(new FurniEditorCreateComposer(JSON.stringify(fields)));
    }, []);

    const deleteItem = useCallback((id: number) =>
    {
        setLoading(true);
        setError(null);
        SendMessageComposer(new FurniEditorDeleteComposer(id));
    }, []);

    const loadInteractions = useCallback(() =>
    {
        SendMessageComposer(new FurniEditorInteractionsComposer());
    }, []);

    return {
        items, total, page, loading, error, clearError,
        selectedItem, setSelectedItem, catalogItems, furniDataEntry,
        interactions, lastResult,
        searchItems, loadDetail, loadBySpriteId, updateItem, createItem, deleteItem, loadInteractions
    };
};
