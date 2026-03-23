import { FC } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 99;

export const CatalogSpinnerWidgetView: FC<{}> = props =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { quantity = 1 } = purchaseOptions;

    const updateQuantity = (value: number) =>
    {
        if(isNaN(value)) value = 1;

        value = Math.max(value, MIN_VALUE);
        value = Math.min(value, MAX_VALUE);

        if(value === quantity) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    };

    if(!currentOffer || !currentOffer.bundlePurchaseAllowed) return null;

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted whitespace-nowrap">{ LocalizeText('catalog.bundlewidget.spinner.select.amount') }</span>
            <div className="flex items-center rounded overflow-hidden border-2 border-card-grid-item-border">
                <button
                    className="w-[24px] h-[24px] flex items-center justify-center bg-card-grid-item hover:bg-card-grid-item-active transition-colors cursor-pointer border-r border-card-grid-item-border"
                    onClick={ event => updateQuantity(quantity - 1) }
                >
                    <FaMinus className="text-[7px] text-dark" />
                </button>
                <input
                    className="w-[40px] h-[24px] text-center text-[11px] font-bold bg-white border-x border-card-grid-item-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                    type="number"
                    value={ quantity }
                    onChange={ event => updateQuantity(event.target.valueAsNumber) }
                />
                <button
                    className="w-[24px] h-[24px] flex items-center justify-center bg-card-grid-item hover:bg-card-grid-item-active transition-colors cursor-pointer border-l border-card-grid-item-border"
                    onClick={ event => updateQuantity(quantity + 1) }
                >
                    <FaPlus className="text-[7px] text-dark" />
                </button>
            </div>
        </div>
    );
};
