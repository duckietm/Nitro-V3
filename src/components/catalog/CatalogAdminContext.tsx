import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';
import { ICatalogNode, IPurchasableOffer } from '../../api';

export interface IPageEditData
{
    pageId?: number;
    caption: string;
    parentId: number;
    pageLayout: string;
    enabled: string;
    visible: string;
    minRank: number;
    clubOnly?: string;
    orderNum: number;
    pageHeadline?: string;
    pageTeaser?: string;
    pageSpecial?: string;
    pageText1?: string;
    pageText2?: string;
    pageTextDetails?: string;
    pageTextTeaser?: string;
}

export interface IOfferEditData
{
    offerId?: number;
    pageId: number;
    itemIds: string;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    amount: number;
    clubOnly: string;
    extradata: string;
    haveOffer: string;
    offerId_group: number;
    limitedStack: number;
    orderNumber: number;
}

interface ICatalogAdminContext
{
    adminMode: boolean;
    setAdminMode: (value: boolean) => void;
    editingOffer: IPurchasableOffer | null;
    setEditingOffer: (offer: IPurchasableOffer | null) => void;
    editingPageData: boolean;
    setEditingPageData: (value: boolean) => void;
    editingRootPage: boolean;
    setEditingRootPage: (value: boolean) => void;
    editingPageNode: ICatalogNode | null;
    setEditingPageNode: (node: ICatalogNode | null) => void;
    loading: boolean;
    lastError: string | null;
    savePage: (data: IPageEditData) => Promise<boolean>;
    createPage: (data: IPageEditData) => Promise<boolean>;
    deletePage: (pageId: number) => Promise<boolean>;
    saveOffer: (data: IOfferEditData) => Promise<boolean>;
    createOffer: (data: IOfferEditData) => Promise<boolean>;
    deleteOffer: (offerId: number) => Promise<boolean>;
    reorderOffers: (orders: { id: number; orderNumber: number }[]) => Promise<boolean>;
    togglePageEnabled: (pageId: number) => Promise<boolean>;
    togglePageVisible: (pageId: number) => Promise<boolean>;
}

const CatalogAdminContext = createContext<ICatalogAdminContext>(null);

export const useCatalogAdmin = () => useContext(CatalogAdminContext);

const API_BASE = '/api/admin/catalog';

async function apiCall(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>
{
    try
    {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            ...(body !== undefined ? { body: JSON.stringify(body) } : {})
        });

        const json = await res.json();

        if(!res.ok || json.error)
        {
            return { ok: false, error: json.error || `HTTP ${ res.status }` };
        }

        return { ok: true, data: json };
    }
    catch(err)
    {
        return { ok: false, error: (err as Error).message };
    }
}

export const CatalogAdminProvider: FC<{ children: ReactNode }> = ({ children }) =>
{
    const [ adminMode, setAdminMode ] = useState(false);
    const [ editingOffer, setEditingOffer ] = useState<IPurchasableOffer | null>(null);
    const [ editingPageData, setEditingPageData ] = useState(false);
    const [ editingRootPage, setEditingRootPage ] = useState(false);
    const [ editingPageNode, setEditingPageNode ] = useState<ICatalogNode | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ lastError, setLastError ] = useState<string | null>(null);

    const withLoading = useCallback(async (fn: () => Promise<boolean>): Promise<boolean> =>
    {
        setLoading(true);
        setLastError(null);

        try
        {
            return await fn();
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    const savePage = useCallback((data: IPageEditData): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const { pageId, ...fields } = data;
            const result = await apiCall(`${ API_BASE }?id=${ pageId }`, 'PUT', fields);

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const createPage = useCallback((data: IPageEditData): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(API_BASE, 'POST', data);

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const deletePage = useCallback((pageId: number): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(API_BASE, 'DELETE', { id: pageId });

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const saveOffer = useCallback((data: IOfferEditData): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const { offerId, ...fields } = data;
            const result = await apiCall(`${ API_BASE }/items?id=${ offerId }`, 'PUT', fields);

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const createOffer = useCallback((data: IOfferEditData): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(`${ API_BASE }/items`, 'POST', data);

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const deleteOffer = useCallback((offerId: number): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(`${ API_BASE }/items`, 'DELETE', { id: offerId });

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const reorderOffers = useCallback((orders: { id: number; orderNumber: number }[]): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(`${ API_BASE }/items`, 'PATCH', { action: 'reorder', orders });

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const togglePageEnabled = useCallback((pageId: number): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(API_BASE, 'PATCH', { action: 'toggleEnabled', id: pageId });

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    const togglePageVisible = useCallback((pageId: number): Promise<boolean> =>
    {
        return withLoading(async () =>
        {
            const result = await apiCall(API_BASE, 'PATCH', { action: 'toggleVisible', id: pageId });

            if(!result.ok) { setLastError(result.error); return false; }

            return true;
        });
    }, [ withLoading ]);

    return (
        <CatalogAdminContext.Provider value={ {
            adminMode, setAdminMode,
            editingOffer, setEditingOffer,
            editingPageData, setEditingPageData,
            editingRootPage, setEditingRootPage,
            editingPageNode, setEditingPageNode,
            loading, lastError,
            savePage, createPage, deletePage,
            saveOffer, createOffer, deleteOffer,
            reorderOffers, togglePageEnabled, togglePageVisible
        } }>
            { children }
        </CatalogAdminContext.Provider>
    );
};
