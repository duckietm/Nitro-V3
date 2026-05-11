import { ClubGiftInfoParser, MarketplaceConfigurationMessageParser } from '@nitrots/nitro-renderer';
import { CatalogPetPalette } from './CatalogPetPalette';

export interface ICatalogOptions
{
    petPalettes?: CatalogPetPalette[];
    clubGifts?: ClubGiftInfoParser;
    marketplaceConfiguration?: MarketplaceConfigurationMessageParser;
}
