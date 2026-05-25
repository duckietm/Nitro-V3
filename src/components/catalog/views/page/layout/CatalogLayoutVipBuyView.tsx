import { ClubOfferData, GiftReceiverNotFoundEvent, PurchaseFromCatalogAsGiftComposer, PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CatalogPurchaseState, LocalizeText, SanitizeHtml, SendMessageComposer } from '../../../../../api';
import { AutoGrid, Button, Column, Flex, Grid, LayoutCurrencyIcon, LayoutLoadingSpinnerView, Text } from '../../../../../common';
import { CatalogEvent, CatalogPurchaseFailureEvent, CatalogPurchasedEvent } from '../../../../../events';
import { useCatalogData, useClubOffers, useMessageEvent, usePurse, useUiEvent, useUserDataSnapshot } from '../../../../../hooks';
import { CatalogLayoutProps } from './CatalogLayout.types';

const VIP_WINDOW_ID = 1;

export const CatalogLayoutVipBuyView: FC<CatalogLayoutProps> = props =>
{
    const [ pendingOffer, setPendingOffer ] = useState<ClubOfferData>(null);
    const [ purchaseState, setPurchaseState ] = useState(CatalogPurchaseState.NONE);
    const [ giftMode, setGiftMode ] = useState(false);
    const [ giftRecipient, setGiftRecipient ] = useState('');
    const [ giftError, setGiftError ] = useState<string | null>(null);
    const [ giftSuccess, setGiftSuccess ] = useState(false);
    const { currentPage = null } = useCatalogData();
    const { purse = null, getCurrencyAmount = null } = usePurse();
    const { data: offers = null } = useClubOffers(VIP_WINDOW_ID);
    const { userName: ownUserName = '' } = useUserDataSnapshot();
    const isPurchasingRef = useRef<boolean>(false);
    const wasGiftPurchaseRef = useRef<boolean>(false);
    const giftSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSelfGift = giftMode && !!ownUserName && giftRecipient.trim().toLowerCase() === ownUserName.toLowerCase();

    const onCatalogEvent = useCallback((event: CatalogEvent) =>
    {
        switch(event.type)
        {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                isPurchasingRef.current = false;
                setPurchaseState(CatalogPurchaseState.NONE);
                setGiftError(null);
                if(wasGiftPurchaseRef.current)
                {
                    wasGiftPurchaseRef.current = false;
                    setGiftRecipient('');
                    setGiftMode(false);
                    setGiftSuccess(true);
                    if(giftSuccessTimerRef.current) clearTimeout(giftSuccessTimerRef.current);
                    giftSuccessTimerRef.current = setTimeout(() => setGiftSuccess(false), 3500);
                }
                return;
            case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
                isPurchasingRef.current = false;
                wasGiftPurchaseRef.current = false;
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
        }
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);

    useEffect(() => () =>
    {
        if(giftSuccessTimerRef.current) clearTimeout(giftSuccessTimerRef.current);
    }, []);

    const handleGiftReceiverNotFound = useCallback(() =>
    {
        if(!isPurchasingRef.current) return;
        isPurchasingRef.current = false;
        setPurchaseState(CatalogPurchaseState.NONE);
        setGiftError(LocalizeText('catalog.gift_wrapping.receiver_not_found.title'));
    }, []);

    useMessageEvent<GiftReceiverNotFoundEvent>(GiftReceiverNotFoundEvent, handleGiftReceiverNotFound);

    const getOfferText = useCallback((offer: ClubOfferData) =>
    {
        let offerText = '';

        if(offer.months > 0)
        {
            offerText = LocalizeText('catalog.vip.item.header.months', [ 'num_months' ], [ offer.months.toString() ]);
        }

        if(offer.extraDays > 0)
        {
            if(offerText !== '') offerText += ' ';

            offerText += (' ' + LocalizeText('catalog.vip.item.header.days', [ 'num_days' ], [ offer.extraDays.toString() ]));
        }

        return offerText;
    }, []);

    const getPurchaseHeader = useCallback(() =>
    {
        if(!purse) return '';

        const extensionOrSubscription = (purse.clubDays > 0 || purse.clubPeriods > 0) ? 'extension.' : 'subscription.';
        const daysOrMonths = ((pendingOffer.months === 0) ? 'days' : 'months');
        const daysOrMonthsText = ((pendingOffer.months === 0) ? pendingOffer.extraDays : pendingOffer.months);
        const locale = LocalizeText('catalog.vip.buy.confirm.' + extensionOrSubscription + daysOrMonths);

        return locale.replace('%NUM_' + daysOrMonths.toUpperCase() + '%', daysOrMonthsText.toString());
    }, [ pendingOffer, purse ]);

    const getPurchaseValidUntil = useCallback(() =>
    {
        let locale = LocalizeText('catalog.vip.buy.confirm.end_date');

        locale = locale.replace('%month%', pendingOffer.month.toString());
        locale = locale.replace('%day%', pendingOffer.day.toString());
        locale = locale.replace('%year%', pendingOffer.year.toString());

        return locale;
    }, [ pendingOffer ]);

    const getSubscriptionDetails = useMemo(() =>
    {
        const clubDays = purse.clubDays;
        const clubPeriods = purse.clubPeriods;
        const totalDays = (clubPeriods * 31) + clubDays;

        return LocalizeText('catalog.vip.extend.info', [ 'days' ], [ totalDays.toString() ]);
    }, [ purse ]);

    const purchaseSubscription = useCallback(() =>
    {
        if(!pendingOffer || isPurchasingRef.current) return;
        if(giftMode && !giftRecipient.trim()) return;
        if(isSelfGift) return;

        isPurchasingRef.current = true;
        wasGiftPurchaseRef.current = giftMode;
        setPurchaseState(CatalogPurchaseState.PURCHASE);
        setGiftError(null);
        setGiftSuccess(false);

        if(giftMode)
        {
            SendMessageComposer(new PurchaseFromCatalogAsGiftComposer(currentPage.pageId, pendingOffer.offerId, '', giftRecipient.trim(), '', 0, 0, 0, false));
        }
        else
        {
            SendMessageComposer(new PurchaseFromCatalogComposer(currentPage.pageId, pendingOffer.offerId, null, 1));
        }
    }, [ pendingOffer, currentPage, giftMode, giftRecipient, isSelfGift ]);

    const setOffer = useCallback((offer: ClubOfferData) =>
    {
        setPurchaseState(CatalogPurchaseState.NONE);
        setPendingOffer(offer);
        setGiftError(null);
        setGiftSuccess(false);
        if(!offer?.giftable) setGiftMode(false);
    }, []);

    const onGiftRecipientChange = useCallback((value: string) =>
    {
        setGiftRecipient(value);
        setGiftError(null);
        setGiftSuccess(false);
    }, []);

    const getPurchaseButton = useCallback(() =>
    {
        if(!pendingOffer) return null;

        if(pendingOffer.priceCredits > getCurrencyAmount(-1))
        {
            return <Button fullWidth variant="danger">{ LocalizeText('catalog.alert.notenough.title') }</Button>;
        }

        if(pendingOffer.priceActivityPoints > getCurrencyAmount(pendingOffer.priceActivityPointsType))
        {
            return <Button fullWidth variant="danger">{ LocalizeText('catalog.alert.notenough.activitypoints.title.' + pendingOffer.priceActivityPointsType) }</Button>;
        }

        const giftBlocked = giftMode && (!giftRecipient.trim() || isSelfGift);
        const buyLabel = giftMode ? LocalizeText('catalog.gift_wrapping.give_gift') : LocalizeText('buy');

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return <Button disabled={ giftBlocked } fullWidth variant="warning" onClick={ purchaseSubscription }>{ LocalizeText('catalog.marketplace.confirm_title') }</Button>;
            case CatalogPurchaseState.PURCHASE:
                return <Button disabled fullWidth variant="primary"><LayoutLoadingSpinnerView /></Button>;
            case CatalogPurchaseState.FAILED:
                return <Button disabled fullWidth variant="danger">{ LocalizeText('generic.failed') }</Button>;
            case CatalogPurchaseState.NONE:
            default:
                return <Button disabled={ giftBlocked } fullWidth variant="success" onClick={ () => setPurchaseState(CatalogPurchaseState.CONFIRM) }>{ buyLabel }</Button>;
        }
    }, [ pendingOffer, purchaseState, purchaseSubscription, getCurrencyAmount, giftMode, giftRecipient, isSelfGift ]);

    return (
        <Grid>
            <Column fullHeight justifyContent="between" overflow="hidden" size={ 7 }>
                <AutoGrid className="nitro-catalog-layout-vip-buy-grid" columnCount={ 1 }>
                    { offers && (offers.length > 0) && offers.map((offer, index) =>
                    {
                        const isActive = (pendingOffer === offer);

                        return (
                            <div key={ index } className={ 'nitro-vip-buy-offer flex flex-col gap-1.5 p-2 rounded-md border-2 cursor-pointer ' + (isActive ? 'active border-[#7a5500] bg-[#ffe066]' : 'border-[#b48a18] bg-[#fffbe7] hover:bg-[#fff5c4] hover:border-[#9c7610]') } onClick={ () => setOffer(offer) }>
                                <div className="vip-offer-header flex items-center gap-2 pb-1.5 border-b border-dashed border-[#b48a18]">
                                    <span className="vip-offer-banner inline-flex items-center justify-center shrink-0 w-[34px] h-[20px]">
                                        <i className="nitro-icon icon-hc-banner" style={ { width: '34px', height: '20px', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } } />
                                    </span>
                                    <span className="vip-offer-title flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[1.05rem] leading-tight text-[#2c2a25]">{ getOfferText(offer) }</span>
                                </div>
                                <div className="vip-offer-prices flex flex-col gap-1">
                                    { (offer.priceCredits > 0) &&
                                    <span className="vip-offer-price flex items-center gap-1.5 font-bold text-[0.95rem] leading-tight text-[#4a473e] whitespace-nowrap">
                                        <LayoutCurrencyIcon type={ -1 } />
                                        <span>{ offer.priceCredits }</span>
                                    </span> }
                                    { (offer.priceActivityPoints > 0) &&
                                    <span className="vip-offer-price flex items-center gap-1.5 font-bold text-[0.95rem] leading-tight text-[#4a473e] whitespace-nowrap">
                                        <LayoutCurrencyIcon type={ offer.priceActivityPointsType } />
                                        <span>{ offer.priceActivityPoints }</span>
                                    </span> }
                                </div>
                            </div>
                        );
                    }) }
                </AutoGrid>
                <Text center dangerouslySetInnerHTML={ { __html: SanitizeHtml(LocalizeText('catalog.vip.buy.hccenter')) } }></Text>
            </Column>
            <Column overflow="hidden" size={ 5 }>
                <Column center fullHeight overflow="hidden">
                    { currentPage.localization.getImage(1) && <img alt="" src={ currentPage.localization.getImage(1) } /> }
                    <Text center dangerouslySetInnerHTML={ { __html: SanitizeHtml(getSubscriptionDetails) } } overflow="auto" />
                </Column>
                { pendingOffer &&
                    <Column fullWidth grow justifyContent="end">
                        <Flex alignItems="end">
                            <Column grow gap={ 0 }>
                                <Text fontWeight="bold">{ giftMode ? LocalizeText('catalog.purchase_confirmation.gift') : getPurchaseHeader() }</Text>
                                <Text>{ getPurchaseValidUntil() }</Text>
                            </Column>
                            <div className="flex flex-col gap-1">
                                { (pendingOffer.priceCredits > 0) &&
                                    <Flex alignItems="center" gap={ 1 } justifyContent="end">
                                        <Text>{ pendingOffer.priceCredits }</Text>
                                        <LayoutCurrencyIcon type={ -1 } />
                                    </Flex> }
                                { (pendingOffer.priceActivityPoints > 0) &&
                                    <Flex alignItems="center" gap={ 1 } justifyContent="end">
                                        <Text>{ pendingOffer.priceActivityPoints }</Text>
                                        <LayoutCurrencyIcon type={ pendingOffer.priceActivityPointsType } />
                                    </Flex> }
                            </div>
                        </Flex>
                        { pendingOffer.giftable &&
                            <Column className="mt-1" gap={ 1 }>
                                <Flex alignItems="center" gap={ 2 }>
                                    <label className="flex items-center gap-1 cursor-pointer text-sm">
                                        <input checked={ giftMode } className="cursor-pointer" type="checkbox" onChange={ event => { setGiftMode(event.target.checked); setGiftError(null); setGiftSuccess(false); } } />
                                        <span>{ LocalizeText('catalog.purchase_confirmation.gift') }</span>
                                    </label>
                                    { giftMode &&
                                        <input
                                            className="flex-1 min-w-0 border border-[#b48a18] bg-white rounded px-2 py-1 text-sm"
                                            placeholder={ LocalizeText('catalog.gift_wrapping.receiver') }
                                            type="text"
                                            value={ giftRecipient }
                                            onChange={ event => onGiftRecipientChange(event.target.value) } /> }
                                </Flex>
                                { giftMode && isSelfGift &&
                                    <Text className="text-[#b00020] text-xs">{ LocalizeText('catalog.gift_wrapping.cannot_send_to_self') }</Text> }
                                { giftMode && giftError && !isSelfGift &&
                                    <Text className="text-[#b00020] text-xs">{ giftError }</Text> }
                                { giftSuccess &&
                                    <Text className="text-[#1f7a1f] text-sm font-bold">{ LocalizeText('catalog.gift_wrapping.gift_sent') }</Text> }
                            </Column> }
                        { getPurchaseButton() }
                    </Column> }
            </Column>
        </Grid>
    );
};
