import { FurnitureType, IFurnitureData } from '@nitrots/api';
import { CatalogPageMessageProductData } from '@nitrots/communication';
import { GetSessionDataManager } from '@nitrots/session';

export function GetFurnitureDataForProductOffer(offer: CatalogPageMessageProductData): IFurnitureData
{
    if (!offer) return null;

    let furniData: IFurnitureData = null;

    switch ((offer.productType) as FurnitureType)
    {
        case FurnitureType.FLOOR:
            furniData = GetSessionDataManager().getFloorItemData(offer.furniClassId);
            break;
        case FurnitureType.WALL:
            furniData = GetSessionDataManager().getWallItemData(offer.furniClassId);
            break;
    }

    return furniData;
}
