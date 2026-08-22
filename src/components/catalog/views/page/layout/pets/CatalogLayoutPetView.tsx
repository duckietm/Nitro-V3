import {
    ApproveNameMessageComposer,
    ApproveNameMessageEvent,
    ColorConverter,
    GetRoomEngine,
    PurchaseFromCatalogComposer,
    SellablePetPaletteData
} from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { DispatchUiEvent, GetPetAvailableColors, GetPetIndexFromLocalization, LocalizeText, SendMessageComposer } from '../../../../../../api';
import { LayoutPetImageView } from '../../../../../../common';
import { CatalogPurchasedEvent, CatalogPurchaseFailureEvent } from '../../../../../../events';
import { useCatalogData, useCatalogUiState, useMessageEvent, useSellablePetPalette, useUiEvent } from '../../../../../../hooks';
import { CatalogScrollAreaView } from '../../common/CatalogScrollAreaView';
import { CatalogAddOnBadgeWidgetView } from '../../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogTotalPriceWidget } from '../../widgets/CatalogTotalPriceWidget';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import {
    buildNewPetPaletteChoices,
    buildPetPurchaseExtraData,
    filterPetPalettes,
    getPetNameMaxLength,
    isLegacyPetType,
} from './petCatalog.helpers';

interface PendingPetPurchase {
    extraData: string;
    offerId: number;
    pageId: number;
}

export const CatalogLayoutPetView: FC<CatalogLayoutProps> = ({ page = null }) => {
    const [petIndex, setPetIndex] = useState(-1);
    const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(-1);
    const [selectedColorIndex, setSelectedColorIndex] = useState(-1);
    const [petName, setPetName] = useState('');
    const [approvalPending, setApprovalPending] = useState(false);
    const [purchasePending, setPurchasePending] = useState(false);
    const [approvalResult, setApprovalResult] = useState(-1);
    const pendingPurchaseRef = useRef<PendingPetPurchase | null>(null);
    const purchasePendingRef = useRef(false);
    const activePageIdRef = useRef(page?.pageId ?? -1);
    activePageIdRef.current = page?.pageId ?? -1;
    const { currentOffer = null } = useCatalogData();
    const { setCurrentOffer = null } = useCatalogUiState();
    const breed = (currentOffer?.product?.productData?.type as unknown as string) ?? '';
    const { data: petPalette = null } = useSellablePetPalette(breed);
    const legacyPet = isLegacyPetType(petIndex);

    const sellablePalettes = useMemo(
        () => filterPetPalettes(petIndex, petPalette?.palettes ?? []),
        [petIndex, petPalette]
    );

    const newPetChoices = useMemo(
        () =>
            legacyPet
                ? []
                : buildNewPetPaletteChoices(petIndex, sellablePalettes, (type, paletteId) =>
                      GetRoomEngine().getPetColorResult(type, paletteId)
                  ),
        [legacyPet, petIndex, sellablePalettes]
    );

    const selectablePalettes = useMemo(
        () => (legacyPet ? sellablePalettes : newPetChoices.map((choice) => choice.palette)),
        [legacyPet, newPetChoices, sellablePalettes]
    );

    const legacyColors = useMemo(
        () => (legacyPet ? GetPetAvailableColors(petIndex, sellablePalettes as SellablePetPaletteData[]) : []),
        [legacyPet, petIndex, sellablePalettes]
    );

    const selectedPalette = selectedPaletteIndex >= 0 ? selectablePalettes[selectedPaletteIndex] : null;
    const selectedColor = legacyPet
        ? (legacyColors[selectedColorIndex]?.[0] ?? 0xffffff)
        : (newPetChoices[selectedPaletteIndex]?.colors[0] ?? 0xffffff);

    const purchaseExtraData = useMemo(() => {
        if (!petName || !selectedPalette) return '';
        if (legacyPet && selectedColorIndex < 0) return '';

        return buildPetPurchaseExtraData(petName, petIndex, selectedPalette, selectedColor);
    }, [legacyPet, petIndex, petName, selectedColor, selectedColorIndex, selectedPalette]);

    const validationErrorMessage = useMemo(() => {
        const errorKeys: Record<number, string> = {
            1: 'catalog.alert.petname.long',
            2: 'catalog.alert.petname.short',
            3: 'catalog.alert.petname.chars',
            4: 'catalog.alert.petname.bobba'
        };
        const key = errorKeys[approvalResult];

        return key ? LocalizeText(key) : '';
    }, [approvalResult]);

    const requestPurchase = useCallback(() => {
        if (approvalPending || purchasePendingRef.current || !page || !currentOffer || !purchaseExtraData) return;

        pendingPurchaseRef.current = {
            extraData: purchaseExtraData,
            offerId: currentOffer.offerId,
            pageId: page.pageId
        };
        setApprovalPending(true);
        setApprovalResult(-1);
        SendMessageComposer(new ApproveNameMessageComposer(petName, 1));
    }, [approvalPending, currentOffer, page, petName, purchaseExtraData]);

    useMessageEvent<ApproveNameMessageEvent>(ApproveNameMessageEvent, (event) => {
        const pendingPurchase = pendingPurchaseRef.current;

        if (!pendingPurchase) return;

        if (pendingPurchase.pageId !== activePageIdRef.current) {
            pendingPurchaseRef.current = null;
            setApprovalPending(false);
            return;
        }

        const parser = event.getParser();

        pendingPurchaseRef.current = null;
        setApprovalPending(false);
        setApprovalResult(parser.result);

        if (parser.result === 0) {
            purchasePendingRef.current = true;
            setPurchasePending(true);
            SendMessageComposer(
                new PurchaseFromCatalogComposer(pendingPurchase.pageId, pendingPurchase.offerId, pendingPurchase.extraData, 1)
            );
        } else {
            DispatchUiEvent(new CatalogPurchaseFailureEvent(-1));
        }
    });

    const finishPurchase = useCallback(() => {
        if (!purchasePendingRef.current) return;

        purchasePendingRef.current = false;
        setPurchasePending(false);
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, finishPurchase);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, finishPurchase);

    useEffect(() => {
        if (!page?.offers.length) return;

        const offer = page.offers[0];

        setCurrentOffer(offer);
        setPetIndex(GetPetIndexFromLocalization(offer.localizationId));
    }, [page, setCurrentOffer]);

    useEffect(() => {
        pendingPurchaseRef.current = null;
        purchasePendingRef.current = false;
        setApprovalPending(false);
        setPurchasePending(false);
        setApprovalResult(-1);
        setPetName('');
    }, [page?.pageId]);

    useEffect(() => {
        setSelectedPaletteIndex(selectablePalettes.length ? 0 : -1);
    }, [selectablePalettes]);

    useEffect(() => {
        setSelectedColorIndex(legacyColors.length ? 0 : -1);
    }, [legacyColors]);

    useEffect(() => {
        if (approvalPending) return;

        setApprovalResult(-1);
    }, [approvalPending, petName]);

    if (!currentOffer) return null;

    const controlsDisabled = approvalPending || purchasePending;
    const colorLabel = LocalizeText('catalog.pets.choose.color');

    return (
        <div
            className={`nitro-catalog-pet-layout ${legacyPet ? 'nitro-catalog-pet-layout--legacy' : 'nitro-catalog-pet-layout--new'}`}
        >
            <div className="nitro-catalog-pet-preview relative h-[240px] min-h-[240px] overflow-hidden">
                {selectedPalette && (
                    <div className="nitro-catalog-pet-preview-image">
                        <LayoutPetImageView
                            direction={legacyPet || petIndex === 15 ? 2 : 3}
                            paletteId={selectedPalette.paletteId}
                            petColor={legacyPet ? selectedColor : 0xffffff}
                            scale={petIndex === 15 ? 1 : 2}
                            typeId={petIndex}
                        />
                    </div>
                )}
                <CatalogAddOnBadgeWidgetView className="nitro-catalog-pet-preview-badge" />
                <div className="nitro-catalog-pet-preview-price">
                    <CatalogTotalPriceWidget />
                </div>
            </div>

            <div className="nitro-catalog-pet-editor">
                {legacyPet ? (
                    <>
                        <div className="nitro-catalog-pet-field">
                            <span>{colorLabel}</span>
                            <CatalogScrollAreaView
                                className="nitro-catalog-pet-color-grid"
                                contentClassName="nitro-catalog-pet-color-grid-content"
                                aria-label={colorLabel}
                                role="group"
                            >
                                {legacyColors.map((colors, index) => (
                                    <button
                                        key={`${colors[0]}-${index}`}
                                        aria-label={`${colorLabel} ${index + 1}`}
                                        aria-pressed={selectedColorIndex === index}
                                        className="nitro-catalog-pet-color-swatch"
                                        disabled={controlsDisabled}
                                        style={{ backgroundColor: ColorConverter.int2rgb(colors[0]) }}
                                        type="button"
                                        onClick={() => setSelectedColorIndex(index)}
                                    />
                                ))}
                            </CatalogScrollAreaView>
                        </div>
                        {sellablePalettes.length > 1 && (
                            <label className="nitro-catalog-pet-breed-selector">
                                <span>{LocalizeText('catalog.pets.choose.breed')}</span>
                                <select
                                    value={selectedPaletteIndex}
                                    disabled={controlsDisabled}
                                    onChange={(event) => setSelectedPaletteIndex(Number(event.target.value))}
                                >
                                    {sellablePalettes.map((palette, index) => (
                                        <option key={palette.paletteId} value={index}>
                                            {LocalizeText(`pet.breed.${petIndex}.${palette.breedId}`)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </>
                ) : (
                    <div className="nitro-catalog-pet-field">
                        <span>{colorLabel}</span>
                        <CatalogScrollAreaView
                            className="nitro-catalog-pet-color-grid"
                            contentClassName="nitro-catalog-pet-color-grid-content"
                            aria-label={colorLabel}
                            role="group"
                        >
                            {newPetChoices.map((choice, index) => {
                                const colors = choice.colors.map((color) => ColorConverter.int2rgb(color));
                                const style = {
                                    background:
                                        colors.length > 1
                                            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)`
                                            : colors[0]
                                };

                                return (
                                    <button
                                        key={choice.palette.paletteId}
                                        aria-label={`${colorLabel} ${index + 1}`}
                                        aria-pressed={selectedPaletteIndex === index}
                                        className="nitro-catalog-pet-color-swatch"
                                        disabled={controlsDisabled}
                                        style={style}
                                        type="button"
                                        onClick={() => setSelectedPaletteIndex(index)}
                                    />
                                );
                            })}
                        </CatalogScrollAreaView>
                    </div>
                )}

                <div className="nitro-catalog-pet-purchase mt-auto">
                    <label className="nitro-catalog-pet-name-field">
                        <span>{LocalizeText('widgets.petpackage.name.title')}</span>
                        <span className="relative flex-1">
                            <input
                                disabled={controlsDisabled}
                                maxLength={getPetNameMaxLength(petIndex)}
                                placeholder={LocalizeText('widgets.petpackage.name.title')}
                                type="text"
                                value={petName}
                                onChange={(event) => setPetName(event.target.value)}
                            />
                            {approvalResult === 0 && <FaCheck className="nitro-catalog-pet-name-status text-success" />}
                            {approvalResult > 0 && <FaTimes className="nitro-catalog-pet-name-status text-danger" />}
                        </span>
                    </label>
                    {approvalResult > 0 && <span className="nitro-catalog-pet-name-error">{validationErrorMessage}</span>}
                    <div className="nitro-catalog-pet-purchase-row">
                        <button
                            className="nitro-catalog-standard-button nitro-catalog-standard-buy-button"
                            disabled={controlsDisabled || !purchaseExtraData}
                            onClick={requestPurchase}
                        >
                            {LocalizeText('catalog.purchase_confirmation.buy')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
