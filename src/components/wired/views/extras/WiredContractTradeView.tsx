import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

// Term encoding (server InteractionWiredContract): intParams = [count, dir, type, amount, ...]. 0=PAY, 1=RECEIVE.
const DIR_PAY = 0;
const DIR_RECEIVE = 1;
const CURRENCY_OPTIONS: { value: number; label: string }[] = [
    { value: -1, label: 'Credits' },
    { value: 0, label: 'Duckets' },
    { value: 5, label: 'Diamonds' },
];

const CurrencySelect: FC<{ name: string; value: number; onChange: (v: number) => void }> = ({ name, value, onChange }) => (
    <div className="flex gap-2">
        {CURRENCY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1">
                <input
                    type="radio"
                    className="form-check-input"
                    name={name}
                    checked={value === option.value}
                    onChange={() => onChange(option.value)}
                />
                <Text small>{option.label}</Text>
            </label>
        ))}
    </div>
);

export const WiredContractTradeView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [payType, setPayType] = useState(-1);
    const [payAmount, setPayAmount] = useState(0);
    const [receiveType, setReceiveType] = useState(0);
    const [receiveAmount, setReceiveAmount] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        const data = trigger.intData ?? [];
        // [count, dir, type, amount] * count — parse PAY and RECEIVE by direction.
        const count = data.length > 0 ? data[0] : 0;
        for (let i = 0; i < count; i++) {
            const base = 1 + i * 3;
            if (base + 2 >= data.length) break;
            const dir = data[base];
            const type = data[base + 1];
            const amount = Math.max(0, data[base + 2]);
            if (dir === DIR_PAY) {
                setPayType(type);
                setPayAmount(amount);
            } else {
                setReceiveType(type);
                setReceiveAmount(amount);
            }
        }
    }, [trigger]);

    const save = () => {
        setIntParams([2, DIR_PAY, payType, Math.max(0, payAmount), DIR_RECEIVE, receiveType, Math.max(0, receiveAmount)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 380 }}>
            <div className="flex flex-col gap-2">
                <Text bold>The user PAYS:</Text>
                <CurrencySelect name="tradePayType" value={payType} onChange={setPayType} />
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={payAmount}
                    onChange={(event) => setPayAmount(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <div className="nitro-wired__divider" />
                <Text bold>The user RECEIVES:</Text>
                <CurrencySelect name="tradeReceiveType" value={receiveType} onChange={setReceiveType} />
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={receiveAmount}
                    onChange={(event) => setReceiveAmount(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text small>Pick a chest above: the payment is deposited into it and the reward sourced from its pool.</Text>
            </div>
        </WiredExtraBaseView>
    );
};
