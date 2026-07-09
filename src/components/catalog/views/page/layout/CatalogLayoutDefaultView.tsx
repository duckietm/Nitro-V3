import { FC } from 'react';
import { FaExchangeAlt, FaSyncAlt } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText, ProductTypeEnum, SanitizeHtml } from '../../../../../api';
import { Text } from '../../../../../common';
import { useCatalogData } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = (props) => {
    const { page = null } = props;
    const { currentOffer = null, currentPage = null, roomPreviewer = null } = useCatalogData();
    const offerName = currentOffer?.localizationName?.replace(/\s*\([^)]*\)\s*$/g, '');

    return (
        <div className="nitro-catalog-default-layout flex flex-col h-full gap-2">
            <div className="nitro-catalog-product-view">
                {currentOffer && (
                    <div className="nitro-catalog-offer-panel flex gap-0">
                        <div
                            className={`nitro-catalog-offer-preview relative flex items-center justify-center ${currentOffer.product.productType === ProductTypeEnum.BADGE ? 'is-badge' : ''}`}
                        >
                            <Text className="nitro-catalog-preview-title">{offerName}</Text>
                            {currentOffer.product.productType !== ProductTypeEnum.BADGE && (
                                <>
                                    <button
                                        className="nitro-catalog-preview-btn nitro-catalog-preview-rotate"
                                        onClick={() => roomPreviewer?.changeRoomObjectDirection()}
                                    >
                                        <FaSyncAlt />
                                    </button>
                                    <button
                                        className="nitro-catalog-preview-btn nitro-catalog-preview-state"
                                        onClick={() => roomPreviewer?.changeRoomObjectState()}
                                    >
                                        <FaExchangeAlt />
                                    </button>
                                    <CatalogViewProductWidgetView />
                                    <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 right-1 absolute" />
                                </>
                            )}
                            {currentOffer.product.productType === ProductTypeEnum.BADGE && <CatalogAddOnBadgeWidgetView className="scale-200" />}
                        </div>
                        <div className="nitro-catalog-offer-info flex flex-col flex-1 min-w-0 gap-2">
                            <div>
                                <Text className="text-[13px]! font-bold text-dark leading-tight">{offerName}</Text>
                                <CatalogLimitedItemWidgetView />
                            </div>
                        </div>
                    </div>
                )}

                {!currentOffer && (
                    <div className="nitro-catalog-welcome flex items-center gap-3">
                        {!!page.localization.getImage(1) && (
                            <img alt="" className="w-[70px] h-[70px] object-contain rounded shrink-0" src={page.localization.getImage(1)} />
                        )}
                        <Text className="text-[11px]! text-muted" dangerouslySetInnerHTML={{ __html: SanitizeHtml(page.localization.getText(0)) }} />
                    </div>
                )}
            </div>

            <div className="nitro-catalog-grid-shell flex-1 overflow-auto min-h-0">
                {GetConfigurationValue('catalog.headers') && <CatalogHeaderView imageUrl={currentPage.localization.getImage(0)} />}
                <CatalogItemGridWidgetView className="nitro-catalog-grid" columnCount={6} columnMinHeight={80} columnMinWidth={55} />
            </div>

            {currentOffer && (
                <div className="nitro-catalog-price-row flex items-center justify-between gap-2">
                    <div className="nitro-catalog-spinner-slot">
                        <CatalogSpinnerWidgetView />
                    </div>
                    <div className="nitro-catalog-total-price-slot">
                        <span className="nitro-catalog-total-price-label">{LocalizeText('catalog.bundlewidget.price')}</span>
                        <CatalogTotalPriceWidget />
                    </div>
                </div>
            )}

            {currentOffer && (
                <div className="nitro-catalog-purchase-row flex items-start justify-end">
                    <div className="nitro-catalog-offer-actions flex gap-1.5">
                        <CatalogPurchaseWidgetView />
                    </div>
                </div>
            )}
        </div>
    );
};
