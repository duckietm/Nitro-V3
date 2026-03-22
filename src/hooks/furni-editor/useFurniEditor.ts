import { useCallback, useState } from 'react';

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

const API_BASE = '/api/admin/furni-editor';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T>
{
    const res = await fetch(url, { credentials: 'include', ...options });
    const data = await res.json();

    if(!res.ok || data.error) throw new Error(data.error || 'API error');

    return data;
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

    const clearError = useCallback(() => setError(null), []);

    const searchItems = useCallback(async (query: string, type: string, pg: number) =>
    {
        setLoading(true);
        setError(null);

        try
        {
            const params = new URLSearchParams({ q: query, limit: '20', page: String(pg) });

            if(type) params.set('type', type);

            const data = await apiFetch<{ items: FurniItem[]; total: number; page: number }>(`${ API_BASE }?${ params }`);

            setItems(data.items);
            setTotal(data.total);
            setPage(data.page);
        }
        catch(e: any)
        {
            setError(e.message);
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (id: number): Promise<boolean> =>
    {
        setLoading(true);
        setError(null);

        try
        {
            const data = await apiFetch<{ item: FurniDetail; catalogItems: CatalogRef[]; furniDataEntry: Record<string, unknown> | null }>(`${ API_BASE }/detail?id=${ id }`);

            setSelectedItem(data.item);
            setCatalogItems(data.catalogItems);
            setFurniDataEntry(data.furniDataEntry);

            return true;
        }
        catch(e: any)
        {
            setError(e.message);

            return false;
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const updateItem = useCallback(async (id: number, fields: Record<string, unknown>) =>
    {
        setLoading(true);
        setError(null);

        try
        {
            await apiFetch(`${ API_BASE }/update?id=${ id }`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            });

            return true;
        }
        catch(e: any)
        {
            setError(e.message);

            return false;
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const createItem = useCallback(async (fields: Record<string, unknown>) =>
    {
        setLoading(true);
        setError(null);

        try
        {
            const data = await apiFetch<{ id: number }>(`${ API_BASE }`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            });

            return data.id;
        }
        catch(e: any)
        {
            setError(e.message);

            return null;
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const deleteItem = useCallback(async (id: number) =>
    {
        setLoading(true);
        setError(null);

        try
        {
            await apiFetch(`${ API_BASE }/delete?id=${ id }`, { method: 'POST' });

            return true;
        }
        catch(e: any)
        {
            setError(e.message);

            return false;
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const loadInteractions = useCallback(async () =>
    {
        try
        {
            const data = await apiFetch<{ interactions: Array<string | { name: string }> }>(`${ API_BASE }/interactions`);

            setInteractions(data.interactions.map(i => typeof i === 'string' ? i : i.name));
        }
        catch {}
    }, []);

    const loadBySpriteId = useCallback(async (spriteId: number): Promise<boolean> =>
    {
        try
        {
            const data = await apiFetch<{ id: number }>(`${ API_BASE }/by-sprite?spriteId=${ spriteId }`);

            return await loadDetail(data.id);
        }
        catch(e: any)
        {
            setError(e.message);

            return false;
        }
    }, [ loadDetail ]);

    return {
        items, total, page, loading, error, clearError,
        selectedItem, setSelectedItem, catalogItems, furniDataEntry,
        interactions,
        searchItems, loadDetail, loadBySpriteId, updateItem, createItem, deleteItem, loadInteractions
    };
};
