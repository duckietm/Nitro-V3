import { describe, expect, it } from 'vitest';
import { CatalogType } from '../../api/catalog/CatalogType';
import { getOffersStorageKey, getPagesStorageKey, normalizeCatalogType, parseOffers, parsePages, STORAGE_KEY_OFFERS_BUILDER, STORAGE_KEY_OFFERS_NORMAL, STORAGE_KEY_PAGES_BUILDER, STORAGE_KEY_PAGES_NORMAL } from './useCatalogFavorites.helpers';

describe('normalizeCatalogType', () =>
{
    it('returns NORMAL when nothing is passed', () =>
    {
        expect(normalizeCatalogType()).toBe(CatalogType.NORMAL);
    });

    it('returns NORMAL for unknown strings', () =>
    {
        expect(normalizeCatalogType('not-a-real-type')).toBe(CatalogType.NORMAL);
    });

    it('returns BUILDER only for the exact BUILDER constant', () =>
    {
        expect(normalizeCatalogType(CatalogType.BUILDER)).toBe(CatalogType.BUILDER);
    });

    it('returns NORMAL for NORMAL explicitly', () =>
    {
        expect(normalizeCatalogType(CatalogType.NORMAL)).toBe(CatalogType.NORMAL);
    });
});

describe('getOffersStorageKey / getPagesStorageKey', () =>
{
    it('routes the BUILDER catalog to the builder storage keys', () =>
    {
        expect(getOffersStorageKey(CatalogType.BUILDER)).toBe(STORAGE_KEY_OFFERS_BUILDER);
        expect(getPagesStorageKey(CatalogType.BUILDER)).toBe(STORAGE_KEY_PAGES_BUILDER);
    });

    it('routes the NORMAL catalog to the normal storage keys', () =>
    {
        expect(getOffersStorageKey(CatalogType.NORMAL)).toBe(STORAGE_KEY_OFFERS_NORMAL);
        expect(getPagesStorageKey(CatalogType.NORMAL)).toBe(STORAGE_KEY_PAGES_NORMAL);
    });

    it('falls back to NORMAL keys for unknown / missing catalog type', () =>
    {
        expect(getOffersStorageKey()).toBe(STORAGE_KEY_OFFERS_NORMAL);
        expect(getOffersStorageKey('garbage')).toBe(STORAGE_KEY_OFFERS_NORMAL);
        expect(getPagesStorageKey()).toBe(STORAGE_KEY_PAGES_NORMAL);
        expect(getPagesStorageKey('garbage')).toBe(STORAGE_KEY_PAGES_NORMAL);
    });
});

describe('parseOffers', () =>
{
    it('returns an empty array on invalid JSON', () =>
    {
        expect(parseOffers('not json')).toEqual([]);
        expect(parseOffers('{')).toEqual([]);
    });

    it('returns an empty array when the parsed value is not an array', () =>
    {
        expect(parseOffers('null')).toEqual([]);
        expect(parseOffers('{}')).toEqual([]);
        expect(parseOffers('42')).toEqual([]);
        expect(parseOffers('"hello"')).toEqual([]);
    });

    it('returns an empty array unchanged', () =>
    {
        expect(parseOffers('[]')).toEqual([]);
    });

    it('migrates the v2 number[] format into IFavoriteOffer[] with offerId only', () =>
    {
        expect(parseOffers('[101, 202, 303]')).toEqual([
            { offerId: 101 },
            { offerId: 202 },
            { offerId: 303 }
        ]);
    });

    it('passes through a well-formed v3 IFavoriteOffer[] unchanged', () =>
    {
        const v3 = [
            { offerId: 5, name: 'red sofa', iconUrl: 'http://example.com/sofa.png' },
            { offerId: 9 }
        ];

        expect(parseOffers(JSON.stringify(v3))).toEqual(v3);
    });

    it('only triggers migration when the first element is a number (mixed arrays go through as-is)', () =>
    {
        const mixed = [ { offerId: 1 }, { offerId: 2 } ];

        expect(parseOffers(JSON.stringify(mixed))).toEqual(mixed);
    });
});

describe('parsePages', () =>
{
    it('returns an empty array on invalid JSON', () =>
    {
        expect(parsePages('not json')).toEqual([]);
        expect(parsePages('}{')).toEqual([]);
    });

    it('returns an empty array when the parsed value is not an array', () =>
    {
        expect(parsePages('null')).toEqual([]);
        expect(parsePages('{ "pages": [1, 2] }')).toEqual([]);
        expect(parsePages('"42"')).toEqual([]);
    });

    it('returns the parsed array as-is', () =>
    {
        expect(parsePages('[]')).toEqual([]);
        expect(parsePages('[1, 2, 3]')).toEqual([ 1, 2, 3 ]);
    });
});
