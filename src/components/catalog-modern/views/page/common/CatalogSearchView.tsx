import { GetSessionDataManager, IFurnitureData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { CatalogPage, CatalogType, FilterCatalogNode, FurnitureOffer, ICatalogNode, ICatalogPage, IPurchasableOffer, LocalizeText, PageLocalization, SearchResult } from '../../../../../api';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

export const CatalogSearchView: FC<{}> = () =>
{
    const [ searchValue, setSearchValue ] = useState('');
    const { rootNode = null, searchResult = null } = useCatalogData();
    const { currentType = null, setSearchResult = null, setCurrentPage = null } = useCatalogUiState();

    const normalizeSearchText = (value: string) => (value || '')
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    useEffect(() =>
    {
        const search = normalizeSearchText(searchValue);

        if(!search || !search.length)
        {
            setSearchResult(null);

            return;
        }

        const timeout = setTimeout(() =>
        {
            if(!rootNode) return;

            const furnitureDatas = GetSessionDataManager().getAllFurnitureData();

            if(!furnitureDatas || !furnitureDatas.length) return;

            const foundFurniture: IFurnitureData[] = [];
            const foundFurniLines: string[] = [];

            for(const furniture of furnitureDatas)
            {
                if(!furniture) continue;

                if((currentType === CatalogType.BUILDER) && !furniture.availableForBuildersClub) continue;

                if((currentType === CatalogType.NORMAL) && furniture.excludeDynamic) continue;

                const name = normalizeSearchText(furniture.name || '');
                const matchesSearch = name.includes(search);
                const isBuyable = (furniture.purchaseOfferId > -1) || (furniture.rentOfferId > -1);

                if((currentType === CatalogType.BUILDER) && (furniture.purchaseOfferId === -1) && (furniture.rentOfferId === -1))
                {
                    if((furniture.furniLine !== '') && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        if(matchesSearch) foundFurniLines.push(furniture.furniLine);
                    }
                }
                else if(matchesSearch && isBuyable)
                {
                    foundFurniture.push(furniture);

                    if(furniture.furniLine && furniture.furniLine.length && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        foundFurniLines.push(furniture.furniLine);
                    }

                    if(foundFurniture.length === 250) break;
                }
                else if(matchesSearch && furniture.furniLine && furniture.furniLine.length && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                {
                    foundFurniLines.push(furniture.furniLine);
                }
            }

            const offers: IPurchasableOffer[] = [];

            for(const furniture of foundFurniture)
            {
                offers.push(new FurnitureOffer(furniture));
            }

            let nodes: ICatalogNode[] = [];

            FilterCatalogNode(search, foundFurniLines, rootNode, nodes);

            setSearchResult(new SearchResult(search, offers, nodes.filter(node => (node.isVisible))));
            setCurrentPage((new CatalogPage(-1, 'default_3x3', new PageLocalization([], []), offers, false, 1)));
        }, 300);

        return () => clearTimeout(timeout);
    }, [ currentType, rootNode, searchValue, setCurrentPage, setSearchResult ]);

    return (
        <div className="relative w-full">
            <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted pointer-events-none" />
            <input
                className="w-full pl-6 pr-6 py-[3px] text-[11px] rounded border-2 border-card-grid-item-border bg-white text-dark placeholder-muted focus:outline-none focus:border-primary transition-colors"
                placeholder={ LocalizeText('generic.search') }
                type="text"
                value={ searchValue }
                onChange={ e => setSearchValue(e.target.value) }
            />
            { searchValue && searchValue.length > 0 &&
                <button
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted hover:text-danger cursor-pointer transition-colors"
                    onClick={ () => setSearchValue('') }
                >
                    <FaTimes />
                </button> }
        </div>
    );
};
