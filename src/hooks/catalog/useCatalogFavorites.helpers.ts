import { CatalogType } from '../../api/catalog/CatalogType';

/**
 * Pure helpers consumed by useCatalogFavorites. Extracted standalone
 * so localStorage parse/migration logic can be covered by Vitest
 * without React or the renderer SDK in the loop.
 *
 * The favorites system tracks two parallel lists per catalog type
 * (NORMAL vs BUILDER): a list of favorited offers (offer id + display
 * metadata) and a list of favorited page ids. Both persist in
 * localStorage under per-type keys; a v1 → v3 migration runs for the
 * NORMAL catalog when the v3 key is empty but the legacy key exists.
 */

export interface IFavoriteOffer
{
    offerId: number;
    name?: string;
    iconUrl?: string;
}

export const LEGACY_STORAGE_KEY_OFFERS = 'catalog_fav_offers_v2';
export const LEGACY_STORAGE_KEY_PAGES = 'catalog_fav_pages';
export const STORAGE_KEY_OFFERS_NORMAL = 'catalog_fav_offers_v3_normal';
export const STORAGE_KEY_OFFERS_BUILDER = 'catalog_fav_offers_v3_builder';
export const STORAGE_KEY_PAGES_NORMAL = 'catalog_fav_pages_v2_normal';
export const STORAGE_KEY_PAGES_BUILDER = 'catalog_fav_pages_v2_builder';

export const normalizeCatalogType = (catalogType?: string): string =>
    ((catalogType === CatalogType.BUILDER) ? CatalogType.BUILDER : CatalogType.NORMAL);

export const getOffersStorageKey = (catalogType?: string): string =>
    ((normalizeCatalogType(catalogType) === CatalogType.BUILDER) ? STORAGE_KEY_OFFERS_BUILDER : STORAGE_KEY_OFFERS_NORMAL);

export const getPagesStorageKey = (catalogType?: string): string =>
    ((normalizeCatalogType(catalogType) === CatalogType.BUILDER) ? STORAGE_KEY_PAGES_BUILDER : STORAGE_KEY_PAGES_NORMAL);

/**
 * Parse a serialized offers list from localStorage. Handles three
 * cases:
 *  - well-formed `IFavoriteOffer[]` → returned as-is
 *  - legacy `number[]` (v2 format) → migrated to `IFavoriteOffer[]`
 *    with only offerId populated
 *  - anything else (corrupt JSON, wrong shape) → empty array
 */
export const parseOffers = (raw: string): IFavoriteOffer[] =>
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

/**
 * Parse a serialized pages list from localStorage. Accepts any
 * array, rejects everything else. (The pages list has always been
 * `number[]`, no legacy format to migrate.)
 */
export const parsePages = (raw: string): number[] =>
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
