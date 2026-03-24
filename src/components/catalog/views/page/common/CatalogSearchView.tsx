import { GetSessionDataManager, IFurnitureData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { CatalogPage, CatalogType, FilterCatalogNode, FurnitureOffer, GetOfferNodes, ICatalogNode, ICatalogPage, IPurchasableOffer, LocalizeText, PageLocalization, SearchResult } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';

export const CatalogSearchView: FC<{}> = () =>
{
    const [ searchValue, setSearchValue ] = useState('');
    const { currentType = null, rootNode = null, offersToNodes = null, searchResult = null, setSearchResult = null, setCurrentPage = null } = useCatalog();

    useEffect(() =>
    {
        let search = searchValue?.toLocaleLowerCase().replace(' ', '');

        if(!search || !search.length)
        {
            setSearchResult(null);

            return;
        }

        const timeout = setTimeout(() =>
        {
            const furnitureDatas = GetSessionDataManager().getAllFurnitureData();

            if(!furnitureDatas || !furnitureDatas.length) return;

            const foundFurniture: IFurnitureData[] = [];
            const foundFurniLines: string[] = [];

            for(const furniture of furnitureDatas)
            {
                if((currentType === CatalogType.BUILDER) && !furniture.availableForBuildersClub) continue;

                if((currentType === CatalogType.NORMAL) && furniture.excludeDynamic) continue;

                const searchValues = [ furniture.className, furniture.name, furniture.description ].join(' ').replace(/ /gi, '').toLowerCase();

                if((currentType === CatalogType.BUILDER) && (furniture.purchaseOfferId === -1) && (furniture.rentOfferId === -1))
                {
                    if((furniture.furniLine !== '') && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        if(searchValues.indexOf(search) >= 0) foundFurniLines.push(furniture.furniLine);
                    }
                }
                else
                {
                    const foundNodes = [
                        ...GetOfferNodes(offersToNodes, furniture.purchaseOfferId),
                        ...GetOfferNodes(offersToNodes, furniture.rentOfferId)
                    ];

                    if(foundNodes.length)
                    {
                        if(searchValues.indexOf(search) >= 0) foundFurniture.push(furniture);

                        if(foundFurniture.length === 250) break;
                    }
                }
            }

            const offers: IPurchasableOffer[] = [];

            for(const furniture of foundFurniture) offers.push(new FurnitureOffer(furniture));

            let nodes: ICatalogNode[] = [];

            FilterCatalogNode(search, foundFurniLines, rootNode, nodes);

            setSearchResult(new SearchResult(search, offers, nodes.filter(node => (node.isVisible))));
            setCurrentPage((new CatalogPage(-1, 'default_3x3', new PageLocalization([], []), offers, false, 1) as ICatalogPage));
        }, 300);

        return () => clearTimeout(timeout);
    }, [ offersToNodes, currentType, rootNode, searchValue, setCurrentPage, setSearchResult ]);

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
