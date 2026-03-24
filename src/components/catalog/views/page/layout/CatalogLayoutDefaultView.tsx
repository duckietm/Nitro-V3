import { FC } from 'react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText, ProductTypeEnum, SanitizeHtml } from '../../../../../api';
import { Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { useCatalogAdmin } from '../../../CatalogAdminContext';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null, currentPage = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;

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

            { /* Product detail card */ }
            { currentOffer &&
                <div className="flex gap-0 bg-white rounded border-2 border-card-grid-item-border overflow-hidden">
                    { /* Preview area */ }
                    <div className="w-[140px] min-w-[140px] bg-card-grid-item relative flex items-center justify-center border-r-2 border-card-grid-item-border">
                        { (currentOffer.product.productType !== ProductTypeEnum.BADGE) &&
                            <>
                                <CatalogViewProductWidgetView />
                                <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 right-1 absolute" />
                            </> }
                        { (currentOffer.product.productType === ProductTypeEnum.BADGE) &&
                            <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                    </div>
                    { /* Product info + purchase */ }
                    <div className="flex flex-col flex-1 min-w-0 p-2.5 gap-2">
                        { /* Title row */ }
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <Text className="text-[13px]! font-bold text-dark leading-tight">{ currentOffer.localizationName }</Text>
                                { adminMode &&
                                    <FaEdit
                                        className="text-primary text-[11px] cursor-pointer hover:text-dark transition-colors shrink-0 mt-0.5"
                                        title={ LocalizeText('catalog.admin.offer.edit') }
                                        onClick={ () => catalogAdmin.setEditingOffer(currentOffer) }
                                    /> }
                            </div>
                            { adminMode &&
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <span className="text-[8px] font-mono text-white bg-gray-600 px-1 py-px rounded">ID: { currentOffer.product.productClassId }</span>
                                    <span className="text-[8px] font-mono text-white bg-primary px-1 py-px rounded">Offer: { currentOffer.offerId }</span>
                                    <span className="text-[8px] font-mono text-white bg-secondary px-1 py-px rounded">{ currentOffer.product.productType.toUpperCase() }</span>
                                </div> }
                            <CatalogLimitedItemWidgetView />
                        </div>
                        { /* Price */ }
                        <CatalogTotalPriceWidget />
                        { /* Spinner */ }
                        <CatalogSpinnerWidgetView />
                        { /* Actions */ }
                        <div className="flex gap-1.5 mt-auto">
                            <CatalogPurchaseWidgetView />
                        </div>
                    </div>
                </div> }

            { /* Welcome/description card */ }
            { !currentOffer &&
                <div className="flex items-center gap-3 p-2.5 bg-white rounded border-2 border-card-grid-item-border">
                    { !!page.localization.getImage(1) &&
                        <img className="w-[70px] h-[70px] object-contain rounded shrink-0" src={ page.localization.getImage(1) } /> }
                    <Text className="text-[11px]! text-muted" dangerouslySetInnerHTML={ { __html: SanitizeHtml(page.localization.getText(0)) } } />
                </div> }

            { /* Item grid */ }
            <div className="flex-1 overflow-auto min-h-0">
                { GetConfigurationValue('catalog.headers') &&
                    <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) } /> }
                <CatalogItemGridWidgetView columnCount={ 7 } columnMinHeight={ 50 } columnMinWidth={ 50 } />
            </div>
        </div>
    );
};
