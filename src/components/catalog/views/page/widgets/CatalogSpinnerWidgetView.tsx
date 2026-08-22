import { FC } from 'react';
import spinnerArrowDown from '../../../../../assets/images/catalog/buttons/spinner-arrow-down.png';
import spinnerArrowUp from '../../../../../assets/images/catalog/buttons/spinner-arrow-up.png';
import { LocalizeText } from '../../../../../api';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 100;

export const clampCatalogPurchaseQuantity = (value: number): number => {
    if (isNaN(value)) return MIN_VALUE;

    return Math.min(Math.max(Math.trunc(value), MIN_VALUE), MAX_VALUE);
};

export const CatalogSpinnerWidgetView: FC<{}> = (props) => {
    const { currentOffer = null } = useCatalogData();
    const { purchaseOptions = null, setPurchaseOptions = null } = useCatalogUiState();
    const { quantity = 1 } = purchaseOptions;

    const updateQuantity = (value: number) => {
        value = clampCatalogPurchaseQuantity(value);

        if (value === quantity) return;

        setPurchaseOptions((prevValue) => {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    };

    if (!currentOffer) return null;

    return (
        <div className="nitro-catalog-standard-spinner">
            <span className="nitro-catalog-standard-spinner-label">{LocalizeText('catalog.bundlewidget.spinner.select.amount')}</span>
            <button
                type="button"
                className="nitro-catalog-standard-spinner-button nitro-catalog-standard-spinner-button-more"
                aria-label="+"
                disabled={quantity >= MAX_VALUE}
                onClick={() => updateQuantity(quantity + 1)}
            >
                <img src={spinnerArrowUp} alt="" />
            </button>
            <button
                type="button"
                className="nitro-catalog-standard-spinner-button nitro-catalog-standard-spinner-button-less"
                aria-label="-"
                disabled={quantity <= MIN_VALUE}
                onClick={() => updateQuantity(quantity - 1)}
            >
                <img src={spinnerArrowDown} alt="" />
            </button>
            <span className="nitro-catalog-standard-spinner-value">{quantity}</span>
        </div>
    );
};
