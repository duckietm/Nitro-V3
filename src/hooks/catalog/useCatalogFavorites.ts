import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { CatalogType } from '../../api';
import { useCatalog } from './useCatalog';

export interface IFavoriteOffer
{
    offerId: number;
    name?: string;
    iconUrl?: string;
}

const LEGACY_STORAGE_KEY_OFFERS = 'catalog_fav_offers_v2';
const LEGACY_STORAGE_KEY_PAGES = 'catalog_fav_pages';
const STORAGE_KEY_OFFERS_NORMAL = 'catalog_fav_offers_v3_normal';
const STORAGE_KEY_OFFERS_BUILDER = 'catalog_fav_offers_v3_builder';
const STORAGE_KEY_PAGES_NORMAL = 'catalog_fav_pages_v2_normal';
const STORAGE_KEY_PAGES_BUILDER = 'catalog_fav_pages_v2_builder';

const normalizeCatalogType = (catalogType?: string) => ((catalogType === CatalogType.BUILDER) ? CatalogType.BUILDER : CatalogType.NORMAL);

const getOffersStorageKey = (catalogType?: string) => ((normalizeCatalogType(catalogType) === CatalogType.BUILDER) ? STORAGE_KEY_OFFERS_BUILDER : STORAGE_KEY_OFFERS_NORMAL);
const getPagesStorageKey = (catalogType?: string) => ((normalizeCatalogType(catalogType) === CatalogType.BUILDER) ? STORAGE_KEY_PAGES_BUILDER : STORAGE_KEY_PAGES_NORMAL);

const parseOffers = (raw: string): IFavoriteOffer[] =>
{
    try
    {
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

const parsePages = (raw: string): number[] =>
{
    try
    {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch
    {
        return [];
    }
};

const readOffers = (catalogType?: string): IFavoriteOffer[] =>
{
    const storageKey = getOffersStorageKey(catalogType);
    const raw = localStorage.getItem(storageKey);

    if(raw) return parseOffers(raw);

    if(normalizeCatalogType(catalogType) === CatalogType.NORMAL)
    {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_OFFERS);

        if(legacyRaw)
        {
            const migrated = parseOffers(legacyRaw);

            localStorage.setItem(storageKey, JSON.stringify(migrated));

            return migrated;
        }
    }

    return [];
};

const readPages = (catalogType?: string): number[] =>
{
    const storageKey = getPagesStorageKey(catalogType);
    const raw = localStorage.getItem(storageKey);

    if(raw) return parsePages(raw);

    if(normalizeCatalogType(catalogType) === CatalogType.NORMAL)
    {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_PAGES);

        if(legacyRaw)
        {
            const migrated = parsePages(legacyRaw);

            localStorage.setItem(storageKey, JSON.stringify(migrated));

            return migrated;
        }
    }

    return [];
};

const writeOffers = (catalogType: string, offers: IFavoriteOffer[]) =>
{
    localStorage.setItem(getOffersStorageKey(catalogType), JSON.stringify(offers));
};

const writePages = (catalogType: string, ids: number[]) =>
{
    localStorage.setItem(getPagesStorageKey(catalogType), JSON.stringify(ids));
};

const useCatalogFavoritesState = () =>
{
    const { currentType = CatalogType.NORMAL } = useCatalog();
    const catalogType = normalizeCatalogType(currentType);
    const [ favoriteOffersByType, setFavoriteOffersByType ] = useState<Record<string, IFavoriteOffer[]>>({
        [CatalogType.NORMAL]: [],
        [CatalogType.BUILDER]: []
    });
    const [ favoritePageIdsByType, setFavoritePageIdsByType ] = useState<Record<string, number[]>>({
        [CatalogType.NORMAL]: [],
        [CatalogType.BUILDER]: []
    });
    const [ loaded, setLoaded ] = useState(false);
    const favoriteOffers = favoriteOffersByType[catalogType] || [];
    const favoritePageIds = favoritePageIdsByType[catalogType] || [];

    const favoriteOfferIds = favoriteOffers.map(f => f.offerId);

    const loadFavorites = useCallback(() =>
    {
        setFavoriteOffersByType({
            [CatalogType.NORMAL]: readOffers(CatalogType.NORMAL),
            [CatalogType.BUILDER]: readOffers(CatalogType.BUILDER)
        });
        setFavoritePageIdsByType({
            [CatalogType.NORMAL]: readPages(CatalogType.NORMAL),
            [CatalogType.BUILDER]: readPages(CatalogType.BUILDER)
        });
        setLoaded(true);
    }, []);

    useEffect(() =>
    {
        if(!loaded) loadFavorites();
    }, [ loaded, loadFavorites ]);

    const toggleFavoriteOffer = useCallback((offerId: number, name?: string, iconUrl?: string) =>
    {
        setFavoriteOffersByType(prev =>
        {
            const currentOffers = prev[catalogType] || [];
            const exists = currentOffers.find(f => f.offerId === offerId);

            if(exists)
            {
                const next = currentOffers.filter(f => f.offerId !== offerId);
                writeOffers(catalogType, next);

                return { ...prev, [catalogType]: next };
            }

            const next = [ ...currentOffers, { offerId, name, iconUrl } ];
            writeOffers(catalogType, next);

            return { ...prev, [catalogType]: next };
        });
    }, [ catalogType ]);

    const toggleFavoritePage = useCallback((pageId: number) =>
    {
        setFavoritePageIdsByType(prev =>
        {
            const currentPages = prev[catalogType] || [];
            const next = currentPages.includes(pageId) ? currentPages.filter(id => id !== pageId) : [ ...currentPages, pageId ];
            writePages(catalogType, next);

            return { ...prev, [catalogType]: next };
        });
    }, [ catalogType ]);

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

    return { favoriteOffers, favoriteOfferIds, favoritePageIds, loaded, loadFavorites, toggleFavoriteOffer, toggleFavoritePage, isFavoriteOffer, isFavoritePage, getFavoriteOffer, catalogType };
};

export const useCatalogFavorites = () => useBetween(useCatalogFavoritesState);
