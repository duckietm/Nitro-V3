import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

// Term encoding (server InteractionWiredContract): intParams = [count, dir, type, amount, ...]. dir 0=PAY.
const DIR_PAY = 0;
const CURRENCY_OPTIONS: { value: number; label: string }[] = [
    { value: -1, label: 'Credits' },
    { value: 0, label: 'Duckets' },
    { value: 5, label: 'Diamonds' },
];

export const WiredContractPaymentView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [currencyType, setCurrencyType] = useState(-1);
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        const data = trigger.intData ?? [];
        // [count, dir, type, amount]
        if (data.length >= 4) {
            setCurrencyType(data[2]);
            setAmount(Math.max(0, data[3]));
        }
    }, [trigger]);

    const save = () => {
        setIntParams([1, DIR_PAY, currencyType, Math.max(0, amount)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 380 }}>
            <div className="flex flex-col gap-2">
                <Text bold>The user must PAY:</Text>
                <Text bold>Currency type</Text>
                <div className="flex flex-col gap-1">
                    {CURRENCY_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                            <input
                                type="radio"
                                className="form-check-input"
                                name="paymentCurrencyType"
                                checked={currencyType === option.value}
                                onChange={() => setCurrencyType(option.value)}
                            />
                            <Text small>{option.label}</Text>
                        </label>
                    ))}
                </div>
                <Text bold>Amount</Text>
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={amount}
                    onChange={(event) => setAmount(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text small>Optional: pick a chest above to deposit the payment into (else it is removed).</Text>
            </div>
        </WiredExtraBaseView>
    );
};
