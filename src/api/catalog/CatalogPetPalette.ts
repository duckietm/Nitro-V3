import { SellablePetPaletteData } from '@nitrots/communication';

export class CatalogPetPalette
{
    constructor(
        public readonly breed: string,
        public readonly palettes: SellablePetPaletteData[]
    )
    {}
}
