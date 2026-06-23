import { FC } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 99;

export const CatalogSpinnerWidgetView: FC<{}> = (props) => {
    const { currentOffer = null } = useCatalogData();
    const { purchaseOptions = null, setPurchaseOptions = null } = useCatalogUiState();
    const { quantity = 1 } = purchaseOptions;

    const updateQuantity = (value: number) => {
        if (isNaN(value)) value = 1;

        value = Math.max(value, MIN_VALUE);
        value = Math.min(value, MAX_VALUE);

        if (value === quantity) return;

        setPurchaseOptions((prevValue) => {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    };

    if (!currentOffer || !currentOffer.bundlePurchaseAllowed) return null;

    return (
        <div className="nitro-catalog-swf-spinner">
            <span className="nitro-catalog-swf-spinner-label">{LocalizeText('catalog.bundlewidget.quantity')}</span>
            <div className="nitro-catalog-swf-spinner-control">
                <button className="nitro-catalog-swf-spinner-button nitro-catalog-swf-spinner-button-less" onClick={(event) => updateQuantity(quantity - 1)}>
                    <FaMinus />
                </button>
                <input
                    className="nitro-catalog-swf-spinner-input"
                    type="number"
                    value={quantity}
                    onChange={(event) => updateQuantity(event.target.valueAsNumber)}
                />
                <button className="nitro-catalog-swf-spinner-button nitro-catalog-swf-spinner-button-more" onClick={(event) => updateQuantity(quantity + 1)}>
                    <FaPlus />
                </button>
            </div>
        </div>
    );
};
