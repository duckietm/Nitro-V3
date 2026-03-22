import { FurniEditorBySpriteComposer, FurniEditorCreateComposer, FurniEditorCreateResultEvent, FurniEditorDeleteComposer, FurniEditorDeleteResultEvent, FurniEditorDetailComposer, FurniEditorDetailResultEvent, FurniEditorInteractionsComposer, FurniEditorInteractionsResultEvent, FurniEditorSearchComposer, FurniEditorSearchResultEvent, FurniEditorUpdateComposer, FurniEditorUpdateResultEvent } from '@nitrots/nitro-renderer';
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

export const MAX_STRING_LENGTH = 255;
export const MAX_CUSTOM_PARAMS_LENGTH = 1000;
export const MAX_DIMENSION = 100;
export const MAX_STACK_HEIGHT = 100;
export const MAX_MODES_COUNT = 100;

export interface FurniFormErrors
{
    itemName?: string;
    publicName?: string;
    spriteId?: string;
    width?: string;
    length?: string;
    stackHeight?: string;
    interactionModesCount?: string;
    customparams?: string;
}

export function validateFurniForm(fields: Record<string, unknown>): FurniFormErrors
{
    const errors: FurniFormErrors = {};

    const itemName = String(fields.itemName ?? '').trim();
    const publicName = String(fields.publicName ?? '').trim();

    if(!itemName) errors.itemName = 'Item name is required';
    else if(itemName.length > MAX_STRING_LENGTH) errors.itemName = `Max ${ MAX_STRING_LENGTH } characters`;
    else if(!/^[a-zA-Z0-9_\- ]+$/.test(itemName)) errors.itemName = 'Only letters, numbers, _, - and spaces';

    if(!publicName) errors.publicName = 'Public name is required';
    else if(publicName.length > MAX_STRING_LENGTH) errors.publicName = `Max ${ MAX_STRING_LENGTH } characters`;

    const spriteId = Number(fields.spriteId);

    if(!Number.isFinite(spriteId) || spriteId < 0) errors.spriteId = 'Must be a positive number';

    const width = Number(fields.width);
    const length = Number(fields.length);
    const stackHeight = Number(fields.stackHeight);
    const modes = Number(fields.interactionModesCount);

    if(!Number.isFinite(width) || width < 1 || width > MAX_DIMENSION) errors.width = `1-${ MAX_DIMENSION }`;
    if(!Number.isFinite(length) || length < 1 || length > MAX_DIMENSION) errors.length = `1-${ MAX_DIMENSION }`;
    if(!Number.isFinite(stackHeight) || stackHeight < 0 || stackHeight > MAX_STACK_HEIGHT) errors.stackHeight = `0-${ MAX_STACK_HEIGHT }`;
    if(!Number.isFinite(modes) || modes < 0 || modes > MAX_MODES_COUNT) errors.interactionModesCount = `0-${ MAX_MODES_COUNT }`;

    const customparams = String(fields.customparams ?? '');

    if(customparams.length > MAX_CUSTOM_PARAMS_LENGTH) errors.customparams = `Max ${ MAX_CUSTOM_PARAMS_LENGTH } characters`;

    return errors;
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

    // --- Message event handlers (incoming from server) ---

    useMessageEvent<FurniEditorSearchResultEvent>(FurniEditorSearchResultEvent, useCallback(event =>
    {
        const parser = event.getParser();

        setItems(parser.items.map(i => ({
            id: i.id,
            spriteId: i.spriteId,
            itemName: i.itemName,
            publicName: i.publicName,
            type: i.type,
            width: i.width,
            length: i.length,
            stackHeight: i.stackHeight,
            allowStack: i.allowStack,
            allowWalk: i.allowWalk,
            allowSit: i.allowSit,
            allowLay: i.allowLay,
            interactionType: i.interactionType,
            interactionModesCount: i.interactionModesCount
        })));
        setTotal(parser.total);
        setPage(parser.page);
        setLoading(false);
    }, []));

    useMessageEvent<FurniEditorDetailResultEvent>(FurniEditorDetailResultEvent, useCallback(event =>
    {
        const parser = event.getParser();
        const i = parser.item;

        setSelectedItem({
            id: i.id,
            spriteId: i.spriteId,
            itemName: i.itemName,
            publicName: i.publicName,
            type: i.type,
            width: i.width,
            length: i.length,
            stackHeight: i.stackHeight,
            allowStack: i.allowStack,
            allowWalk: i.allowWalk,
            allowSit: i.allowSit,
            allowLay: i.allowLay,
            allowGift: i.allowGift,
            allowTrade: i.allowTrade,
            allowRecycle: i.allowRecycle,
            allowMarketplaceSell: i.allowMarketplaceSell,
            allowInventoryStack: i.allowInventoryStack,
            interactionType: i.interactionType,
            interactionModesCount: i.interactionModesCount,
            customparams: i.customparams,
            effectIdMale: i.effectIdMale,
            effectIdFemale: i.effectIdFemale,
            clothingOnWalk: i.clothingOnWalk,
            vendingIds: i.vendingIds,
            multiheight: i.multiheight,
            description: i.description,
            usageCount: i.usageCount,
            revision: parser.revision,
            category: parser.category,
            defaultdir: parser.defaultdir,
            offerid: parser.offerid,
            buyout: parser.buyout,
            rentofferid: parser.rentofferid,
            rentbuyout: parser.rentbuyout,
            bc: parser.bc,
            excludeddynamic: parser.excludeddynamic,
            furniline: parser.furniline,
            environment: parser.environment,
            rare: parser.rare
        });

        setCatalogItems(parser.catalogItems.map(ci => ({
            id: ci.id,
            catalogName: ci.catalogName,
            costCredits: ci.costCredits,
            costPoints: ci.costPoints,
            pointsType: ci.pointsType,
            pageId: ci.pageId,
            pageName: ci.pageName
        })));

        let furniData: Record<string, unknown> | null = null;

        if(parser.furniDataEntry)
        {
            try { furniData = JSON.parse(parser.furniDataEntry); }
            catch { furniData = null; }
        }

        setFurniDataEntry(furniData);
        setLoading(false);
    }, []));

    useMessageEvent<FurniEditorInteractionsResultEvent>(FurniEditorInteractionsResultEvent, useCallback(event =>
    {
        setInteractions(event.getParser().interactions);
    }, []));

    useMessageEvent<FurniEditorUpdateResultEvent>(FurniEditorUpdateResultEvent, useCallback(event =>
    {
        const parser = event.getParser();

        setLoading(false);

        if(!parser.success)
        {
            setError(parser.message);
        }
        else if(parser.id > 0)
        {
            SendMessageComposer(new FurniEditorDetailComposer(parser.id));
        }
    }, []));

    useMessageEvent<FurniEditorCreateResultEvent>(FurniEditorCreateResultEvent, useCallback(event =>
    {
        const parser = event.getParser();

        setLoading(false);

        if(!parser.success)
        {
            setError(parser.message);
        }
    }, []));

    useMessageEvent<FurniEditorDeleteResultEvent>(FurniEditorDeleteResultEvent, useCallback(event =>
    {
        const parser = event.getParser();

        setLoading(false);

        if(!parser.success)
        {
            setError(parser.message);
        }
    }, []));

    // --- Outgoing commands (client to server) ---

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

        const f = fields;

        SendMessageComposer(new FurniEditorUpdateComposer(
            id,
            String(f.itemName ?? ''),
            String(f.publicName ?? ''),
            Number(f.spriteId ?? 0),
            String(f.type ?? 's'),
            Number(f.width ?? 1),
            Number(f.length ?? 1),
            Number(f.stackHeight ?? 0),
            !!f.allowStack,
            !!f.allowWalk,
            !!f.allowSit,
            !!f.allowLay,
            !!f.allowGift,
            !!f.allowTrade,
            !!f.allowRecycle,
            !!f.allowMarketplaceSell,
            !!f.allowInventoryStack,
            String(f.interactionType ?? ''),
            Number(f.interactionModesCount ?? 0),
            String(f.customparams ?? ''),
            String(f.description ?? ''),
            Number(f.revision ?? 0),
            String(f.category ?? ''),
            Number(f.defaultdir ?? 0),
            Number(f.offerid ?? 0),
            !!f.buyout,
            Number(f.rentofferid ?? 0),
            !!f.rentbuyout,
            !!f.bc,
            !!f.excludeddynamic,
            String(f.furniline ?? ''),
            String(f.environment ?? ''),
            !!f.rare
        ));
    }, []);

    const createItem = useCallback((fields: Record<string, unknown>) =>
    {
        setLoading(true);
        setError(null);

        const f = fields;

        SendMessageComposer(new FurniEditorCreateComposer(
            String(f.itemName ?? ''),
            String(f.publicName ?? ''),
            Number(f.spriteId ?? 0),
            String(f.type ?? 's'),
            Number(f.width ?? 1),
            Number(f.length ?? 1),
            Number(f.stackHeight ?? 0),
            !!f.allowStack,
            !!f.allowWalk,
            !!f.allowSit,
            !!f.allowLay,
            !!f.allowGift,
            !!f.allowTrade,
            !!f.allowRecycle,
            !!f.allowMarketplaceSell,
            !!f.allowInventoryStack,
            String(f.interactionType ?? ''),
            Number(f.interactionModesCount ?? 0),
            String(f.customparams ?? ''),
            String(f.description ?? ''),
            Number(f.revision ?? 0),
            String(f.category ?? ''),
            Number(f.defaultdir ?? 0),
            Number(f.offerid ?? 0),
            !!f.buyout,
            Number(f.rentofferid ?? 0),
            !!f.rentbuyout,
            !!f.bc,
            !!f.excludeddynamic,
            String(f.furniline ?? ''),
            String(f.environment ?? ''),
            !!f.rare
        ));
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
        interactions,
        searchItems, loadDetail, loadBySpriteId, updateItem, createItem, deleteItem, loadInteractions
    };
};
