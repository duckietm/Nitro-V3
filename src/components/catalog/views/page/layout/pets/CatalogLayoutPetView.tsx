import { ApproveNameMessageComposer, ApproveNameMessageEvent, ColorConverter, GetSellablePetPalettesComposer, PurchaseFromCatalogComposer, SellablePetPaletteData } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaEdit, FaFillDrip, FaPaw, FaPlus, FaTimes } from 'react-icons/fa';
import { DispatchUiEvent, GetPetAvailableColors, GetPetIndexFromLocalization, LocalizeText, SanitizeHtml, SendMessageComposer } from '../../../../../../api';
import { LayoutGridItem, LayoutPetImageView } from '../../../../../../common';
import { CatalogPurchaseFailureEvent } from '../../../../../../events';
import { useCatalog, useMessageEvent } from '../../../../../../hooks';
import { useCatalogAdmin } from '../../../../CatalogAdminContext';
import { CatalogAddOnBadgeWidgetView } from '../../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogTotalPriceWidget } from '../../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from '../CatalogLayout.types';

export const CatalogLayoutPetView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ petIndex, setPetIndex ] = useState(-1);
    const [ sellablePalettes, setSellablePalettes ] = useState<SellablePetPaletteData[]>([]);
    const [ selectedPaletteIndex, setSelectedPaletteIndex ] = useState(-1);
    const [ sellableColors, setSellableColors ] = useState<number[][]>([]);
    const [ selectedColorIndex, setSelectedColorIndex ] = useState(-1);
    const [ colorsShowing, setColorsShowing ] = useState(false);
    const [ petName, setPetName ] = useState('');
    const [ approvalPending, setApprovalPending ] = useState(true);
    const [ approvalResult, setApprovalResult ] = useState(-1);
    const { currentOffer = null, setCurrentOffer = null, setPurchaseOptions = null, catalogOptions = null, roomPreviewer = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const { petPalettes = null } = catalogOptions;

    const getColor = useMemo(() =>
    {
        if(!sellableColors.length || (selectedColorIndex === -1)) return 0xFFFFFF;

        return sellableColors[selectedColorIndex][0];
    }, [ sellableColors, selectedColorIndex ]);

    const petBreedName = useMemo(() =>
    {
        if((petIndex === -1) || !sellablePalettes.length || (selectedPaletteIndex === -1)) return '';

        return LocalizeText(`pet.breed.${ petIndex }.${ sellablePalettes[selectedPaletteIndex].breedId }`);
    }, [ petIndex, sellablePalettes, selectedPaletteIndex ]);

    const petPurchaseString = useMemo(() =>
    {
        if(!sellablePalettes.length || (selectedPaletteIndex === -1)) return '';

        const paletteId = sellablePalettes[selectedPaletteIndex].paletteId;

        let color = 0xFFFFFF;

        if(petIndex <= 7)
        {
            if(selectedColorIndex === -1) return '';

            color = sellableColors[selectedColorIndex][0];
        }

        let colorString = color.toString(16).toUpperCase();

        while(colorString.length < 6) colorString = ('0' + colorString);

        return `${ paletteId }\n${ colorString }`;
    }, [ sellablePalettes, selectedPaletteIndex, petIndex, sellableColors, selectedColorIndex ]);

    const validationErrorMessage = useMemo(() =>
    {
        let key: string = '';

        switch(approvalResult)
        {
            case 1:
                key = 'catalog.alert.petname.long';
                break;
            case 2:
                key = 'catalog.alert.petname.short';
                break;
            case 3:
                key = 'catalog.alert.petname.chars';
                break;
            case 4:
                key = 'catalog.alert.petname.bobba';
                break;
        }

        if(!key || !key.length) return '';

        return LocalizeText(key);
    }, [ approvalResult ]);

    const purchasePet = useCallback(() =>
    {
        if(approvalResult === -1)
        {
            SendMessageComposer(new ApproveNameMessageComposer(petName, 1));

            return;
        }

        if(approvalResult === 0)
        {
            SendMessageComposer(new PurchaseFromCatalogComposer(page.pageId, currentOffer.offerId, `${ petName }\n${ petPurchaseString }`, 1));

            return;
        }
    }, [ page, currentOffer, petName, petPurchaseString, approvalResult ]);

    useMessageEvent<ApproveNameMessageEvent>(ApproveNameMessageEvent, event =>
    {
        const parser = event.getParser();

        setApprovalResult(parser.result);

        if(parser.result === 0) purchasePet();
        else DispatchUiEvent(new CatalogPurchaseFailureEvent(-1));
    });

    useEffect(() =>
    {
        if(!page || !page.offers.length) return;

        const offer = page.offers[0];

        setCurrentOffer(offer);
        setPetIndex(GetPetIndexFromLocalization(offer.localizationId));
        setColorsShowing(false);
    }, [ page, setCurrentOffer ]);

    useEffect(() =>
    {
        if(!currentOffer) return;

        const productData = currentOffer.product.productData;

        if(!productData) return;

        if(petPalettes)
        {
            for(const paletteData of petPalettes)
            {
                if(paletteData.breed !== productData.type) continue;

                const palettes: SellablePetPaletteData[] = [];

                for(const palette of paletteData.palettes)
                {
                    if(!palette.sellable) continue;

                    palettes.push(palette);
                }

                setSelectedPaletteIndex((palettes.length ? 0 : -1));
                setSellablePalettes(palettes);

                return;
            }
        }

        setSelectedPaletteIndex(-1);
        setSellablePalettes([]);

        SendMessageComposer(new GetSellablePetPalettesComposer(productData.type));
    }, [ currentOffer, petPalettes ]);

    useEffect(() =>
    {
        if(petIndex === -1) return;

        const colors = GetPetAvailableColors(petIndex, sellablePalettes);

        setSelectedColorIndex((colors.length ? 0 : -1));
        setSellableColors(colors);
    }, [ petIndex, sellablePalettes ]);

    useEffect(() =>
    {
        if(!roomPreviewer) return;

        roomPreviewer.reset(false);

        if((petIndex === -1) || !sellablePalettes.length || (selectedPaletteIndex === -1)) return;

        let petFigureString = `${ petIndex } ${ sellablePalettes[selectedPaletteIndex].paletteId }`;

        if(petIndex <= 7) petFigureString += ` ${ getColor.toString(16) }`;

        roomPreviewer.addPetIntoRoom(petFigureString);
    }, [ roomPreviewer, petIndex, sellablePalettes, selectedPaletteIndex, getColor ]);

    useEffect(() =>
    {
        setApprovalResult(-1);
    }, [ petName ]);

    if(!currentOffer) return null;

    return (
        <div className="flex flex-col h-full gap-2">
            { /* Admin: quick actions */ }
            { adminMode && !catalogAdmin.editingPageData &&
                <div className="flex gap-2">
                    <button
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-dark transition-colors cursor-pointer"
                        onClick={ () => { catalogAdmin.setEditingPageNode(null); catalogAdmin.setEditingRootPage(false); catalogAdmin.setEditingPageData(true); } }
                    >
                        <FaEdit className="text-[10px]" /> { LocalizeText('catalog.admin.edit.page') }
                    </button>
                    <button
                        className="flex items-center gap-1 text-[10px] text-success hover:text-green-800 transition-colors cursor-pointer"
                        onClick={ () => catalogAdmin.setEditingOffer({ offerId: -1, product: { productClassId: 0, productType: 'i', productCount: 1, extraParam: '' } } as any) }
                    >
                        <FaPlus className="text-[10px]" /> { LocalizeText('catalog.admin.offer.new') }
                    </button>
                </div> }

            { /* Top card: preview + name + purchase */ }
            <div className="flex gap-3 p-2.5 bg-white rounded border-2 border-card-grid-item-border">
                { /* Pet preview */ }
                <div className="w-[160px] min-w-[160px] h-[140px] rounded overflow-hidden bg-card-grid-item relative flex items-center justify-center border border-card-grid-item-border">
                    <CatalogViewProductWidgetView />
                    <CatalogAddOnBadgeWidgetView className="bg-muted rounded absolute bottom-1 right-1" />
                    { ((petIndex > -1) && (petIndex <= 7)) &&
                        <button
                            className={ `absolute bottom-1 left-1 w-[28px] h-[28px] rounded flex items-center justify-center cursor-pointer transition-all border ${ colorsShowing ? 'bg-primary text-white border-primary' : 'bg-white text-dark border-card-grid-item-border hover:bg-card-grid-item-active' }` }
                            title={ LocalizeText('catalog.pets.show.colors') }
                            onClick={ () => setColorsShowing(!colorsShowing) }
                        >
                            <FaFillDrip className="text-[10px]" />
                        </button> }
                </div>

                { /* Pet info */ }
                <div className="flex flex-col flex-1 justify-between min-w-0">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <FaPaw className="text-primary text-xs" />
                            <span className="text-sm font-bold">{ petBreedName || LocalizeText('catalog.pet.breed') }</span>
                            { adminMode && currentOffer &&
                                <FaEdit
                                    className="text-primary text-[11px] cursor-pointer hover:text-dark transition-colors shrink-0"
                                    title={ LocalizeText('catalog.admin.offer.edit') }
                                    onClick={ () => catalogAdmin.setEditingOffer(currentOffer) }
                                /> }
                        </div>
                        { adminMode && currentOffer &&
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className="text-[8px] font-mono text-white bg-gray-600 px-1 py-px rounded">ID: { currentOffer.product.productClassId }</span>
                                <span className="text-[8px] font-mono text-white bg-primary px-1 py-px rounded">Offer: { currentOffer.offerId }</span>
                            </div> }
                        { !!page.localization.getText(0) &&
                            <p className="text-[10px] text-muted mt-0.5" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(0)) } } /> }
                    </div>

                    { /* Name input */ }
                    <div className="flex flex-col gap-1 mt-2">
                        <label className="text-[9px] text-muted uppercase font-bold">{ LocalizeText('widgets.petpackage.name.title') }</label>
                        <div className="relative">
                            <input
                                className={ `w-full text-[11px] border-2 rounded px-2 py-1.5 focus:outline-none transition-colors ${ approvalResult > 0 ? 'border-danger bg-danger/5' : approvalResult === 0 ? 'border-success bg-success/5' : 'border-card-grid-item-border focus:border-primary bg-white' }` }
                                placeholder={ LocalizeText('widgets.petpackage.name.title') }
                                type="text"
                                value={ petName }
                                onChange={ event => setPetName(event.target.value) }
                            />
                            { approvalResult === 0 &&
                                <FaCheck className="absolute right-2 top-1/2 -translate-y-1/2 text-success text-[10px]" /> }
                            { approvalResult > 0 &&
                                <FaTimes className="absolute right-2 top-1/2 -translate-y-1/2 text-danger text-[10px]" /> }
                        </div>
                        { (approvalResult > 0) &&
                            <span className="text-[10px] text-danger font-medium">{ validationErrorMessage }</span> }
                    </div>

                    { /* Price + buy */ }
                    <div className="flex items-center justify-between mt-2">
                        <CatalogTotalPriceWidget />
                        <button
                            className="px-3 py-1 rounded text-[11px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                            disabled={ !petName.length || (approvalResult > 0) }
                            onClick={ purchasePet }
                        >
                            { approvalResult === -1 ? LocalizeText('catalog.purchase_confirmation.buy') : LocalizeText('catalog.marketplace.confirm_title') }
                        </button>
                    </div>
                </div>
            </div>

            { /* Breed/Color grid */ }
            <div className="flex-1 overflow-auto min-h-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
                        { colorsShowing ? LocalizeText('catalog.pets.choose.color') : LocalizeText('catalog.pets.choose.breed') }
                    </span>
                    { colorsShowing &&
                        <button
                            className="text-[9px] text-primary hover:text-dark cursor-pointer transition-colors"
                            onClick={ () => setColorsShowing(false) }
                        >
                            { LocalizeText('catalog.pets.back.breeds') }
                        </button> }
                </div>
                <div className="grid grid-cols-6 gap-1">
                    { !colorsShowing && (sellablePalettes.length > 0) && sellablePalettes.map((palette, index) => (
                        <LayoutGridItem
                            key={ index }
                            className="group/pet"
                            itemActive={ (selectedPaletteIndex === index) }
                            onClick={ () => setSelectedPaletteIndex(index) }
                        >
                            <LayoutPetImageView direction={ 2 } headOnly={ true } paletteId={ palette.paletteId } typeId={ petIndex } />
                        </LayoutGridItem>
                    )) }
                    { colorsShowing && (sellableColors.length > 0) && sellableColors.map((colorSet, index) => (
                        <div
                            key={ index }
                            className={ `w-full aspect-square rounded border-2 cursor-pointer transition-all ${ selectedColorIndex === index ? 'border-primary scale-110 shadow-md' : 'border-card-grid-item-border hover:border-primary/50' }` }
                            style={ { backgroundColor: `#${ ColorConverter.int2rgb(colorSet[0]) }` } }
                            onClick={ () => setSelectedColorIndex(index) }
                        />
                    )) }
                </div>
            </div>
        </div>
    );
};
