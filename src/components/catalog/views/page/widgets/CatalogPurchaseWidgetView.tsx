import { CreateLinkEvent, PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    BuilderFurniPlaceableStatus,
    CatalogPurchaseState,
    CatalogType,
    DispatchUiEvent,
    GetClubMemberLevel,
    LocalizeText,
    NotificationBubbleType,
    Offer,
    ProductTypeEnum,
    SendMessageComposer
} from '../../../../../api';
import { Button, LayoutLoadingSpinnerView, Text } from '../../../../../common';
import {
    CatalogEvent,
    CatalogInitGiftEvent,
    CatalogPurchasedEvent,
    CatalogPurchaseFailureEvent,
    CatalogPurchaseNotAllowedEvent,
    CatalogPurchaseSoldOutEvent
} from '../../../../../events';
import {
    useCatalogActions,
    useCatalogData,
    useCatalogSkipPurchaseConfirmation,
    useCatalogUiState,
    useNotification,
    usePurse,
    useUiEvent
} from '../../../../../hooks';
import { CatalogPurchaseConfirmView } from '../../CatalogPurchaseConfirmView';
import { CatalogClubUpgradeButton } from './CatalogClubUpgradeButton';
import { canPurchaseCatalogOffer } from './catalogPurchase.helpers';

interface CatalogPurchaseWidgetViewProps {
    noGiftOption?: boolean;
    purchaseCallback?: () => void;
}

export const CatalogPurchaseWidgetView: FC<CatalogPurchaseWidgetViewProps> = (props) => {
    const { noGiftOption = false, purchaseCallback = null } = props;
    const [builderPlaceableRefreshTick, setBuilderPlaceableRefreshTick] = useState(0);
    const [purchaseWillBeGift, setPurchaseWillBeGift] = useState(false);
    const [purchaseState, setPurchaseState] = useState(CatalogPurchaseState.NONE);
    const purchasePendingRef = useRef(false);
    const purchaseGuardTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [catalogSkipPurchaseConfirmation] = useCatalogSkipPurchaseConfirmation();
    const { currentOffer = null, currentPage = null } = useCatalogData();
    const { currentType = CatalogType.NORMAL, purchaseOptions = null, setPurchaseOptions = null, setCatalogPlaceMultipleObjects = null } = useCatalogUiState();
    const { requestOfferToMover = null, getBuilderFurniPlaceableStatus = null, getNodesByOfferId = null } = useCatalogActions();
    const { getCurrencyAmount = null } = usePurse();
    const { showSingleBubble = null } = useNotification();

    const resetPurchaseGuard = useCallback(() => {
        purchasePendingRef.current = false;

        if (purchaseGuardTimeoutRef.current) clearTimeout(purchaseGuardTimeoutRef.current);

        purchaseGuardTimeoutRef.current = null;
    }, []);

    const onCatalogEvent = useCallback(
        (event: CatalogEvent) => {
            switch (event.type) {
                case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                    resetPurchaseGuard();
                    setPurchaseState(CatalogPurchaseState.NONE);
                    return;
                case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
                    resetPurchaseGuard();
                    setPurchaseState(CatalogPurchaseState.FAILED);
                    return;
                case CatalogPurchaseNotAllowedEvent.NOT_ALLOWED:
                    resetPurchaseGuard();
                    setPurchaseState(CatalogPurchaseState.FAILED);
                    return;
                case CatalogPurchaseSoldOutEvent.SOLD_OUT:
                    resetPurchaseGuard();
                    setPurchaseState(CatalogPurchaseState.SOLD_OUT);
                    return;
            }
        },
        [resetPurchaseGuard]
    );

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);
    useUiEvent(CatalogPurchaseNotAllowedEvent.NOT_ALLOWED, onCatalogEvent);
    useUiEvent(CatalogPurchaseSoldOutEvent.SOLD_OUT, onCatalogEvent);

    const isLimitedSoldOut = useMemo(() => {
        if (!currentOffer) return false;

        if (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) return false;

        if (currentOffer.pricingModel === Offer.PRICING_MODEL_SINGLE) {
            const product = currentOffer.product;

            if (product && product.isUniqueLimitedItem) return !product.uniqueLimitedItemsLeft;
        }

        return false;
    }, [currentOffer, purchaseOptions]);

    const purchase = (isGift: boolean = false) => {
        if (!canPurchaseCatalogOffer(currentOffer) || purchasePendingRef.current) return;

        if (GetClubMemberLevel() < currentOffer.clubLevel) {
            CreateLinkEvent('habboUI/open/hccenter');

            return;
        }

        if (isGift) {
            DispatchUiEvent(new CatalogInitGiftEvent(currentOffer.page.pageId, currentOffer.offerId, purchaseOptions.extraData));

            return;
        }

        purchasePendingRef.current = true;
        setPurchaseState(CatalogPurchaseState.PURCHASE);

        purchaseGuardTimeoutRef.current = setTimeout(resetPurchaseGuard, 10000);

        if (purchaseCallback) {
            purchaseCallback();

            return;
        }

        let pageId = currentOffer.page.pageId;

        if (pageId === -1 && getNodesByOfferId) {
            const nodes = getNodesByOfferId(currentOffer.offerId);
            if (nodes && nodes.length) pageId = nodes[0].pageId;
        }

        SendMessageComposer(new PurchaseFromCatalogComposer(pageId, currentOffer.offerId, purchaseOptions.extraData, purchaseOptions.quantity));
    };

    useEffect(() => {
        if (!currentOffer) return;

        resetPurchaseGuard();
        setPurchaseState(CatalogPurchaseState.NONE);
    }, [currentOffer, resetPurchaseGuard, setPurchaseOptions]);

    useEffect(() => resetPurchaseGuard, [resetPurchaseGuard]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> = null;

        if (purchaseState === CatalogPurchaseState.FAILED) {
            timeout = setTimeout(() => setPurchaseState(CatalogPurchaseState.NONE), 3000);
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [purchaseState]);

    const isBuildersClubOffer = currentType === CatalogType.BUILDER;
    const isBuildersClubPlaceable =
        isBuildersClubOffer &&
        !!currentOffer &&
        !!currentOffer.product &&
        (currentOffer.product.productType === ProductTypeEnum.FLOOR || currentOffer.product.productType === ProductTypeEnum.WALL);
    const builderPlaceableStatus = useMemo(() => {
        if (!isBuildersClubPlaceable || !getBuilderFurniPlaceableStatus || !currentOffer) return BuilderFurniPlaceableStatus.OKAY;

        return getBuilderFurniPlaceableStatus(currentOffer);
    }, [currentOffer, getBuilderFurniPlaceableStatus, isBuildersClubPlaceable, builderPlaceableRefreshTick]);
    const buildersClubPlaceOneButtonStyle = useMemo(
        () => ({
            background: 'linear-gradient(180deg, #d89f2d 0%, #c68515 100%)',
            borderColor: '#d79d2e',
            color: '#ffffff'
        }),
        []
    );

    useEffect(() => {
        if (!isBuildersClubPlaceable) return;

        const interval = setInterval(() => setBuilderPlaceableRefreshTick((prevValue) => prevValue + 1), 500);

        return () => clearInterval(interval);
    }, [isBuildersClubPlaceable]);

    if (!currentOffer) return null;

    const isLimitedEditionOffer = !!(currentOffer.product && currentOffer.product.isUniqueLimitedItem);
    const isOfferUnavailable = !canPurchaseCatalogOffer(currentOffer);

    const PurchaseButton = () => {
        const standardButtonClassNames = ['nitro-catalog-standard-button'];

        if (isBuildersClubPlaceable) {
            const hasMissingExtraParam = purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length);
            const isBlockedByVisitors = builderPlaceableStatus === BuilderFurniPlaceableStatus.VISITORS_IN_ROOM;
            const isDisabled =
                hasMissingExtraParam ||
                isBlockedByVisitors ||
                builderPlaceableStatus === BuilderFurniPlaceableStatus.MISSING_OFFER ||
                builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_IN_ROOM ||
                builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_ROOM_OWNER ||
                builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_GROUP_ADMIN;
            const startBuilderPlacement = (placeMultiple: boolean) => {
                if (builderPlaceableStatus === BuilderFurniPlaceableStatus.FURNI_LIMIT_REACHED) {
                    showSingleBubble(LocalizeText('room.error.max_furniture'), NotificationBubbleType.INFO);
                    return;
                }

                if (isDisabled) return;

                setCatalogPlaceMultipleObjects(placeMultiple);
                requestOfferToMover(currentOffer);
            };

            return (
                <div className="flex flex-col gap-1.5 items-start">
                    <div className="flex gap-1.5 flex-wrap">
                        <Button classNames={standardButtonClassNames} disabled={isDisabled} onClick={() => startBuilderPlacement(true)}>
                            {LocalizeText('builder.placement_widget.place_many')}
                        </Button>
                        <Button
                            classNames={standardButtonClassNames}
                            disabled={isDisabled}
                            onClick={() => startBuilderPlacement(false)}
                            style={buildersClubPlaceOneButtonStyle}
                        >
                            {LocalizeText('builder.placement_widget.place_one')}
                        </Button>
                    </div>
                    {isBlockedByVisitors && (
                        <Text className="max-w-full" small variant="danger">
                            {LocalizeText('builder.placement_widget.error.visitors')}
                        </Text>
                    )}
                    {builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_GROUP_ADMIN && (
                        <Text className="max-w-full" small variant="danger">
                            {LocalizeText('builder.placement_widget.error.not_group_admin')}
                        </Text>
                    )}
                </div>
            );
        }

        const priceCredits = currentOffer.priceInCredits * purchaseOptions.quantity;
        const pricePoints = currentOffer.priceInActivityPoints * purchaseOptions.quantity;

        if (isOfferUnavailable)
            return (
                <Button classNames={standardButtonClassNames} disabled>
                    {currentOffer.isLazy ? LocalizeText('generic.loading') : LocalizeText('catalog.alert.not_available')}
                </Button>
            );

        if (GetClubMemberLevel() < currentOffer.clubLevel) return <CatalogClubUpgradeButton />;

        if (isLimitedSoldOut)
            return (
                <Button classNames={standardButtonClassNames} disabled variant="danger">
                    {LocalizeText('catalog.alert.limited_edition_sold_out.title')}
                </Button>
            );

        if (priceCredits > getCurrencyAmount(-1))
            return (
                <Button classNames={standardButtonClassNames} disabled variant="danger">
                    {LocalizeText('catalog.alert.notenough.title')}
                </Button>
            );

        if (pricePoints > getCurrencyAmount(currentOffer.activityPointType))
            return (
                <Button classNames={standardButtonClassNames} disabled variant="danger">
                    {LocalizeText('catalog.alert.notenough.activitypoints.title.' + currentOffer.activityPointType)}
                </Button>
            );

        switch (purchaseState) {
            case CatalogPurchaseState.CONFIRM:
                return (
                    <Button classNames={[...standardButtonClassNames, 'nitro-catalog-standard-buy-button', 'pointer-events-none']} variant="success">
                        {LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy'))}
                    </Button>
                );
            case CatalogPurchaseState.PURCHASE:
                return (
                    <Button classNames={standardButtonClassNames} disabled>
                        <LayoutLoadingSpinnerView />
                    </Button>
                );
            case CatalogPurchaseState.FAILED:
                return (
                    <Button classNames={standardButtonClassNames} variant="danger">
                        {LocalizeText('generic.failed')}
                    </Button>
                );
            case CatalogPurchaseState.SOLD_OUT:
                return (
                    <Button classNames={standardButtonClassNames} variant="danger">
                        {LocalizeText('generic.failed') + ' - ' + LocalizeText('catalog.alert.limited_edition_sold_out.title')}
                    </Button>
                );
            case CatalogPurchaseState.NONE:
            default:
                return (
                    <Button
                        classNames={[...standardButtonClassNames, 'nitro-catalog-standard-buy-button']}
                        variant="success"
                        disabled={purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)}
                        onClick={(event) =>
                            catalogSkipPurchaseConfirmation && !isLimitedEditionOffer ? purchase() : setPurchaseState(CatalogPurchaseState.CONFIRM)
                        }
                    >
                        {LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy'))}
                    </Button>
                );
        }
    };

    return (
        <>
            {!isBuildersClubOffer && !noGiftOption && !currentOffer.isRentOffer && (
                <Button
                    variant="secondary"
                    classNames={['nitro-catalog-standard-button', 'nitro-catalog-standard-gift-button']}
                    disabled={
                        purchaseOptions.quantity > 1 ||
                        isOfferUnavailable ||
                        !currentOffer.giftable ||
                        isLimitedSoldOut ||
                        (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length))
                    }
                    onClick={(event) => purchase(true)}
                >
                    {LocalizeText('catalog.purchase_confirmation.gift')}
                </Button>
            )}
            <PurchaseButton />
            {purchaseState === CatalogPurchaseState.CONFIRM && (
                <CatalogPurchaseConfirmView
                    offer={currentOffer}
                    quantity={purchaseOptions.quantity}
                    onCancel={() => setPurchaseState(CatalogPurchaseState.NONE)}
                    onConfirm={() => purchase()}
                />
            )}
        </>
    );
};
