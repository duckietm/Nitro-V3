import { FC, useEffect, useState } from 'react';
import { FaEdit, FaPen, FaPlus, FaTrophy } from 'react-icons/fa';
import { LocalizeText, ProductTypeEnum } from '../../../../../api';
import { Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { useCatalogAdmin } from '../../../CatalogAdminContext';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutTrophiesView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ trophyText, setTrophyText ] = useState<string>('');
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.extraData = trophyText;

            return newValue;
        });
    }, [ currentOffer, trophyText, setPurchaseOptions ]);

    const canPurchase = currentOffer && trophyText.trim().length > 0;

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

            { /* Selected trophy card */ }
            { currentOffer
                ? <div className="flex gap-0 bg-white rounded border-2 border-warning/40 overflow-hidden" style={ { boxShadow: '0 0 8px rgba(255,193,7,0.15)' } }>
                    { /* Preview */ }
                    <div className="w-[120px] min-w-[120px] relative flex items-center justify-center border-r-2 border-warning/30" style={ { background: 'linear-gradient(180deg, #fff9e6 0%, #fff3cc 100%)' } }>
                        { (currentOffer.product.productType !== ProductTypeEnum.BADGE)
                            ? <>
                                <CatalogViewProductWidgetView />
                                <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 right-1 absolute" />
                            </>
                            : <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                    </div>
                    { /* Info */ }
                    <div className="flex flex-col flex-1 min-w-0 p-2 gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <FaTrophy className="text-warning text-[11px]" />
                            <Text className="text-[12px]! font-bold text-dark leading-tight">{ currentOffer.localizationName }</Text>
                            { adminMode &&
                                <FaEdit
                                    className="text-primary text-[11px] cursor-pointer hover:text-dark transition-colors shrink-0"
                                    title={ LocalizeText('catalog.admin.offer.edit') }
                                    onClick={ () => catalogAdmin.setEditingOffer(currentOffer) }
                                /> }
                        </div>
                        { adminMode &&
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[8px] font-mono text-white bg-gray-600 px-1 py-px rounded">ID: { currentOffer.product.productClassId }</span>
                                <span className="text-[8px] font-mono text-white bg-primary px-1 py-px rounded">Offer: { currentOffer.offerId }</span>
                            </div> }
                        <CatalogTotalPriceWidget />
                        { !canPurchase &&
                            <span className="text-[9px] text-warning italic">{ LocalizeText('catalog.trophies.write.hint') }</span> }
                        <div className="flex gap-1.5 mt-auto">
                            <CatalogPurchaseWidgetView />
                        </div>
                    </div>
                </div>
                : <div className="flex items-start gap-3 p-2.5 bg-white rounded border-2 border-card-grid-item-border">
                    { !!page.localization.getImage(1) &&
                        <img className="w-[50px] h-[50px] object-contain rounded shrink-0 mt-0.5" src={ page.localization.getImage(1) } /> }
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <FaTrophy className="text-warning text-[11px]" />
                            <span className="text-[12px] font-bold">{ LocalizeText('catalog.trophies.title') }</span>
                        </div>
                        <Text className="text-[10px]! text-muted leading-relaxed" dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                    </div>
                </div> }

            { /* Trophy inscription */ }
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <FaPen className="text-[8px] text-warning" />
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{ LocalizeText('catalog.trophies.inscription') }</span>
                    <span className={ `text-[9px] ml-auto ${ trophyText.length > 180 ? 'text-danger font-bold' : 'text-muted' }` }>{ trophyText.length }/200</span>
                </div>
                <div className="relative">
                    <textarea
                        className="w-full h-[60px] text-[11px] rounded p-2 pr-3 resize-none focus:outline-none transition-all border-2"
                        maxLength={ 200 }
                        placeholder={ LocalizeText('catalog.trophies.inscription.placeholder') }
                        style={ {
                            background: trophyText.length > 0 ? 'linear-gradient(180deg, #fffdf5 0%, #fff8e8 100%)' : '#fff',
                            borderColor: trophyText.length > 0 ? 'rgba(255,193,7,0.4)' : undefined
                        } }
                        value={ trophyText }
                        onChange={ event => setTrophyText(event.target.value) }
                    />
                    { trophyText.length > 0 &&
                        <FaTrophy className="absolute top-2 right-2 text-[10px] text-warning/30" /> }
                </div>
            </div>

            { /* Trophy grid */ }
            <div className="flex-1 overflow-auto min-h-0">
                <CatalogItemGridWidgetView columnCount={ 7 } columnMinHeight={ 50 } columnMinWidth={ 50 } />
            </div>
        </div>
    );
};
