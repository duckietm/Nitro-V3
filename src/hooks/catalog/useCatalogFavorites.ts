import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';

export interface IFavoriteOffer
{
    offerId: number;
    name?: string;
    iconUrl?: string;
}

const STORAGE_KEY_OFFERS = 'catalog_fav_offers_v2';
const STORAGE_KEY_PAGES = 'catalog_fav_pages';

const readOffers = (): IFavoriteOffer[] =>
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY_OFFERS);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)) return [];

        // migrate from old format (number[]) to new format (IFavoriteOffer[])
        if(parsed.length > 0 && typeof parsed[0] === 'number')
        {
            return (parsed as number[]).map(id => ({ offerId: id }));
        }

        return parsed;
    }
    catch
    {
        return [];
    }
};

const readPages = (): number[] =>
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY_PAGES);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch
    {
        return [];
    }
};

const writeOffers = (offers: IFavoriteOffer[]) =>
{
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offers));
};

const writePages = (ids: number[]) =>
{
    localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(ids));
};

const useCatalogFavoritesState = () =>
{
    const [ favoriteOffers, setFavoriteOffers ] = useState<IFavoriteOffer[]>([]);
    const [ favoritePageIds, setFavoritePageIds ] = useState<number[]>([]);
    const [ loaded, setLoaded ] = useState(false);

    const favoriteOfferIds = favoriteOffers.map(f => f.offerId);

    const loadFavorites = useCallback(() =>
    {
        setFavoriteOffers(readOffers());
        setFavoritePageIds(readPages());
        setLoaded(true);
    }, []);

    useEffect(() =>
    {
        if(!loaded) loadFavorites();
    }, [ loaded, loadFavorites ]);

    const toggleFavoriteOffer = useCallback((offerId: number, name?: string, iconUrl?: string) =>
    {
        setFavoriteOffers(prev =>
        {
            const exists = prev.find(f => f.offerId === offerId);

            if(exists)
            {
                const next = prev.filter(f => f.offerId !== offerId);
                writeOffers(next);
                return next;
            }

            const next = [ ...prev, { offerId, name, iconUrl } ];
            writeOffers(next);
            return next;
        });
    }, []);

    const toggleFavoritePage = useCallback((pageId: number) =>
    {
        setFavoritePageIds(prev =>
        {
            const next = prev.includes(pageId) ? prev.filter(id => id !== pageId) : [ ...prev, pageId ];
            writePages(next);
            return next;
        });
    }, []);

    const isFavoriteOffer = useCallback((offerId: number) =>
    {
        return favoriteOffers.some(f => f.offerId === offerId);
    }, [ favoriteOffers ]);

    const isFavoritePage = useCallback((pageId: number) =>
    {
        return favoritePageIds.includes(pageId);
    }, [ favoritePageIds ]);

    const getFavoriteOffer = useCallback((offerId: number): IFavoriteOffer | undefined =>
    {
        return favoriteOffers.find(f => f.offerId === offerId);
    }, [ favoriteOffers ]);

    return { favoriteOffers, favoriteOfferIds, favoritePageIds, loaded, loadFavorites, toggleFavoriteOffer, toggleFavoritePage, isFavoriteOffer, isFavoritePage, getFavoriteOffer };
};

export const useCatalogFavorites = () => useBetween(useCatalogFavoritesState);
