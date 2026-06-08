import { GetConfigurationValue, IPurchasableOffer, ProductTypeEnum } from '../../../../../api';

// Su questo renderer product.getIconUrl() ritorna un path che va in 404 (icone
// dcr/hof_furni mancanti). Per floor/wall costruiamo l'URL icona dalla config
// furni.asset.icon.url (%libname%/%param%), come fa il catalogo classico; per il
// resto (badge, robot, ecc.) si torna al getIconUrl del renderer.
export const getFurniIconUrl = (product: any, offer: IPurchasableOffer = null): string =>
{
    if(!product) return null;

    if((product.productType === ProductTypeEnum.FLOOR) || (product.productType === ProductTypeEnum.WALL))
    {
        const className = product.furnitureData?.className;

        if(className?.length)
        {
            let param = '';

            if(product.productType === ProductTypeEnum.WALL && product.extraParam?.length)
            {
                param = `_${ product.extraParam }`;
            }
            else if(product.productType === ProductTypeEnum.FLOOR && product.furnitureData?.hasIndexedColor && (product.furnitureData.colorIndex > 0))
            {
                param = `_${ product.furnitureData.colorIndex }`;
            }

            const configuredIconUrl = GetConfigurationValue<string>('furni.asset.icon.url', '');

            if(configuredIconUrl?.length)
            {
                return configuredIconUrl
                    .replace('%libname%', className)
                    .replace('%param%', param);
            }
        }
    }

    return product.getIconUrl(offer) ?? null;
};
