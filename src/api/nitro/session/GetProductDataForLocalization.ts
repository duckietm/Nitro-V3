import { IProductData } from '@nitrots/api';
import { GetSessionDataManager } from '@nitrots/session';

export function GetProductDataForLocalization(localizationId: string): IProductData
{
    if(!localizationId) return null;

    return GetSessionDataManager().getProductData(localizationId);
}
