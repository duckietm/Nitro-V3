import { ClubGiftInfoParser, ClubOfferData, HabboGroupEntryData, MarketplaceConfigurationMessageParser } from '@nitrots/communication';
import { CatalogPetPalette } from './CatalogPetPalette';
import { GiftWrappingConfiguration } from './GiftWrappingConfiguration';

export interface ICatalogOptions
{
    groups?: HabboGroupEntryData[];
    petPalettes?: CatalogPetPalette[];
    clubOffers?: ClubOfferData[];
    clubGifts?: ClubGiftInfoParser;
    giftConfiguration?: GiftWrappingConfiguration;
    marketplaceConfiguration?: MarketplaceConfigurationMessageParser;
}
