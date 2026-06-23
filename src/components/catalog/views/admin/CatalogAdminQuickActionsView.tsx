import { FC } from 'react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalogAdmin } from '../../CatalogAdminContext';

type CatalogAdminOffer = Parameters<NonNullable<ReturnType<typeof useCatalogAdmin>>['setEditingOffer']>[0];

interface CatalogAdminQuickActionsViewProps {
    currentOffer?: CatalogAdminOffer;
    className?: string;
}

export const CatalogAdminQuickActionsView: FC<CatalogAdminQuickActionsViewProps> = (props) => {
    const { currentOffer = null, className = '' } = props;
    const catalogAdmin = useCatalogAdmin();

    if (!catalogAdmin?.adminMode || catalogAdmin.editingPageData) return null;

    const editPage = () => {
        catalogAdmin.setEditingPageNode(null);
        catalogAdmin.setEditingRootPage(false);
        catalogAdmin.setEditingPageData(true);
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <button className="flex items-center gap-1 text-[10px] text-primary hover:text-dark transition-colors cursor-pointer" onClick={editPage}>
                <FaEdit className="text-[10px]" /> {LocalizeText('catalog.admin.edit.page')}
            </button>
            <button
                className="flex items-center gap-1 text-[10px] text-success hover:text-green-800 transition-colors cursor-pointer"
                onClick={() =>
                    catalogAdmin.setEditingOffer({
                        offerId: -1,
                        product: { productClassId: 0, productType: 'i', productCount: 1, extraParam: '' }
                    } as CatalogAdminOffer)
                }
            >
                <FaPlus className="text-[10px]" /> {LocalizeText('catalog.admin.offer.new')}
            </button>
            {currentOffer && (
                <button
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-dark transition-colors cursor-pointer"
                    title={`${LocalizeText('catalog.admin.offer.edit')} - Class ${currentOffer.product.productClassId} / Offer ${currentOffer.offerId}`}
                    onClick={() => catalogAdmin.setEditingOffer(currentOffer)}
                >
                    <FaEdit className="text-[10px]" /> {LocalizeText('catalog.admin.offer.edit')}
                    <span className="font-mono text-[9px] text-dark font-semibold">
                        #{currentOffer.product.productClassId}/{currentOffer.offerId}
                    </span>
                </button>
            )}
        </div>
    );
};
