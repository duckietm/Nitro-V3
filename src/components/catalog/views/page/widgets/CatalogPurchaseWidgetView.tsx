import { CreateLinkEvent, PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { BuilderFurniPlaceableStatus, CatalogPurchaseState, CatalogType, DispatchUiEvent, GetClubMemberLevel, LocalStorageKeys, LocalizeText, NotificationBubbleType, Offer, ProductTypeEnum, SendMessageComposer } from '../../../../../api';
import { Button, LayoutLoadingSpinnerView, Text } from '../../../../../common';
import { CatalogEvent, CatalogInitGiftEvent, CatalogPurchaseFailureEvent, CatalogPurchaseNotAllowedEvent, CatalogPurchaseSoldOutEvent, CatalogPurchasedEvent } from '../../../../../events';
import { useCatalog, useLocalStorage, useNotification, usePurse, useUiEvent } from '../../../../../hooks';

interface CatalogPurchaseWidgetViewProps
{
    noGiftOption?: boolean;
    purchaseCallback?: () => void;
}

let isPurchasingCatalogItem = false;

export const CatalogPurchaseWidgetView: FC<CatalogPurchaseWidgetViewProps> = props =>
{
    const { noGiftOption = false, purchaseCallback = null } = props;
    const [ builderPlaceableRefreshTick, setBuilderPlaceableRefreshTick ] = useState(0);
    const [ purchaseWillBeGift, setPurchaseWillBeGift ] = useState(false);
    const [ purchaseState, setPurchaseState ] = useState(CatalogPurchaseState.NONE);
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useLocalStorage(LocalStorageKeys.CATALOG_SKIP_PURCHASE_CONFIRMATION, false);
    const { currentOffer = null, currentPage = null, currentType = CatalogType.NORMAL, purchaseOptions = null, setPurchaseOptions = null, requestOfferToMover = null, setCatalogPlaceMultipleObjects = null, getBuilderFurniPlaceableStatus = null } = useCatalog();
    const { getCurrencyAmount = null } = usePurse();
    const { showSingleBubble = null } = useNotification();

    const onCatalogEvent = useCallback((event: CatalogEvent) =>
    {
        switch(event.type)
        {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                isPurchasingCatalogItem = false;
                setPurchaseState(CatalogPurchaseState.NONE);
                return;
            case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
                isPurchasingCatalogItem = false;
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseNotAllowedEvent.NOT_ALLOWED:
                isPurchasingCatalogItem = false;
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseSoldOutEvent.SOLD_OUT:
                isPurchasingCatalogItem = false;
                setPurchaseState(CatalogPurchaseState.SOLD_OUT);
                return;
        }
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);
    useUiEvent(CatalogPurchaseNotAllowedEvent.NOT_ALLOWED, onCatalogEvent);
    useUiEvent(CatalogPurchaseSoldOutEvent.SOLD_OUT, onCatalogEvent);

    const isLimitedSoldOut = useMemo(() =>
    {
        if(!currentOffer) return false;

        if(purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) return false;

        if(currentOffer.pricingModel === Offer.PRICING_MODEL_SINGLE)
        {
            const product = currentOffer.product;

            if(product && product.isUniqueLimitedItem) return !product.uniqueLimitedItemsLeft;
        }

        return false;
    }, [ currentOffer, purchaseOptions ]);

    const purchase = (isGift: boolean = false) =>
    {
        if(!currentOffer || isPurchasingCatalogItem) return;

        if(GetClubMemberLevel() < currentOffer.clubLevel)
        {
            CreateLinkEvent('habboUI/open/hccenter');

            return;
        }

        if(isGift)
        {
            DispatchUiEvent(new CatalogInitGiftEvent(currentOffer.page.pageId, currentOffer.offerId, purchaseOptions.extraData));

            return;
        }

        isPurchasingCatalogItem = true;
        setPurchaseState(CatalogPurchaseState.PURCHASE);

        setTimeout(() => { isPurchasingCatalogItem = false; }, 10000);

        if(purchaseCallback)
        {
            purchaseCallback();

            return;
        }

        let pageId = currentOffer.page.pageId;

        // if(pageId === -1)
        // {
        //     const nodes = getNodesByOfferId(currentOffer.offerId);

        //     if(nodes) pageId = nodes[0].pageId;
        // }

        SendMessageComposer(new PurchaseFromCatalogComposer(pageId, currentOffer.offerId, purchaseOptions.extraData, purchaseOptions.quantity));
    };

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseState(CatalogPurchaseState.NONE);
    }, [ currentOffer, setPurchaseOptions ]);

    useEffect(() =>
    {
        let timeout: ReturnType<typeof setTimeout> = null;

        if((purchaseState === CatalogPurchaseState.CONFIRM) || (purchaseState === CatalogPurchaseState.FAILED))
        {
            timeout = setTimeout(() => setPurchaseState(CatalogPurchaseState.NONE), 3000);
        }

        return () =>
        {
            if(timeout) clearTimeout(timeout);
        };
    }, [ purchaseState ]);

    if(!currentOffer) return null;

    const isBuildersClubOffer = (currentType === CatalogType.BUILDER);
    const isBuildersClubPlaceable = isBuildersClubOffer
        && !!currentOffer.product
        && ((currentOffer.product.productType === ProductTypeEnum.FLOOR) || (currentOffer.product.productType === ProductTypeEnum.WALL));
    const builderPlaceableStatus = useMemo(() =>
    {
        if(!isBuildersClubPlaceable || !getBuilderFurniPlaceableStatus) return BuilderFurniPlaceableStatus.OKAY;

        return getBuilderFurniPlaceableStatus(currentOffer);
    }, [ currentOffer, getBuilderFurniPlaceableStatus, isBuildersClubPlaceable, builderPlaceableRefreshTick ]);
    const buildersClubPlaceOneButtonStyle = useMemo(() => ({
        background: 'linear-gradient(180deg, #d89f2d 0%, #c68515 100%)',
        borderColor: '#d79d2e',
        color: '#ffffff'
    }), []);

    useEffect(() =>
    {
        if(!isBuildersClubPlaceable) return;

        const interval = setInterval(() => setBuilderPlaceableRefreshTick(prevValue => (prevValue + 1)), 500);

        return () => clearInterval(interval);
    }, [ isBuildersClubPlaceable ]);

    const PurchaseButton = () =>
    {
        if(isBuildersClubPlaceable)
        {
            const hasMissingExtraParam = (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length));
            const isBlockedByVisitors = (builderPlaceableStatus === BuilderFurniPlaceableStatus.VISITORS_IN_ROOM);
            const isDisabled = hasMissingExtraParam
                || isBlockedByVisitors
                || (builderPlaceableStatus === BuilderFurniPlaceableStatus.MISSING_OFFER)
                || (builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_IN_ROOM)
                || (builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_ROOM_OWNER)
                || (builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_GROUP_ADMIN);
            const startBuilderPlacement = (placeMultiple: boolean) =>
            {
                if(builderPlaceableStatus === BuilderFurniPlaceableStatus.FURNI_LIMIT_REACHED)
                {
                    showSingleBubble(LocalizeText('room.error.max_furniture'), NotificationBubbleType.INFO);
                    return;
                }

                if(isDisabled) return;

                setCatalogPlaceMultipleObjects(placeMultiple);
                requestOfferToMover(currentOffer);
            };

            return (
                <div className="flex flex-col gap-1.5 items-start">
                    <div className="flex gap-1.5 flex-wrap">
                        <Button disabled={ isDisabled } onClick={ () => startBuilderPlacement(true) }>
                            { LocalizeText('builder.placement_widget.place_many') }
                        </Button>
                        <Button disabled={ isDisabled } onClick={ () => startBuilderPlacement(false) } style={ buildersClubPlaceOneButtonStyle }>
                            { LocalizeText('builder.placement_widget.place_one') }
                        </Button>
                    </div>
                    { isBlockedByVisitors &&
                        <Text className="max-w-full" small variant="danger">
                            { LocalizeText('builder.placement_widget.error.visitors') }
                        </Text> }
                    { (builderPlaceableStatus === BuilderFurniPlaceableStatus.NOT_GROUP_ADMIN) &&
                        <Text className="max-w-full" small variant="danger">
                            { LocalizeText('builder.placement_widget.error.not_group_admin') }
                        </Text> }
                </div>
            );
        }

        const priceCredits = (currentOffer.priceInCredits * purchaseOptions.quantity);
        const pricePoints = (currentOffer.priceInActivityPoints * purchaseOptions.quantity);

        if(GetClubMemberLevel() < currentOffer.clubLevel) return <Button disabled variant="danger">{ LocalizeText('catalog.alert.hc.required') }</Button>;

        if(isLimitedSoldOut) return <Button disabled variant="danger">{ LocalizeText('catalog.alert.limited_edition_sold_out.title') }</Button>;

        if(priceCredits > getCurrencyAmount(-1)) return <Button disabled variant="danger">{ LocalizeText('catalog.alert.notenough.title') }</Button>;

        if(pricePoints > getCurrencyAmount(currentOffer.activityPointType)) return <Button disabled variant="danger">{ LocalizeText('catalog.alert.notenough.activitypoints.title.' + currentOffer.activityPointType) }</Button>;

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return <Button variant="warning" onClick={ event => purchase() }>{ LocalizeText('catalog.marketplace.confirm_title') }</Button>;
            case CatalogPurchaseState.PURCHASE:
                return <Button disabled><LayoutLoadingSpinnerView /></Button>;
            case CatalogPurchaseState.FAILED:
                return <Button variant="danger">{ LocalizeText('generic.failed') }</Button>;
            case CatalogPurchaseState.SOLD_OUT:
                return <Button variant="danger">{ LocalizeText('generic.failed') + ' - ' + LocalizeText('catalog.alert.limited_edition_sold_out.title') }</Button>;
            case CatalogPurchaseState.NONE:
            default:
                return <Button disabled={ (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) } onClick={ event => setPurchaseState(CatalogPurchaseState.CONFIRM) }>{ LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy')) }</Button>;
        }
    };

    return (
        <>
            <PurchaseButton />
            { (!isBuildersClubOffer && !noGiftOption && !currentOffer.isRentOffer) &&
                <Button disabled={ ((purchaseOptions.quantity > 1) || !currentOffer.giftable || isLimitedSoldOut || (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length))) } onClick={ event => purchase(true) }>
                    { LocalizeText('catalog.purchase_confirmation.gift') }
                </Button> }
        </>
    );
};
