import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

// Free-form contract: an arbitrary list of PAY/RECEIVE currency terms.
// Term encoding (server InteractionWiredContract): intParams = [count, dir, type, amount, ...].
const DIR_PAY = 0;
const DIR_RECEIVE = 1;
const MAX_TERMS = 8;
const CURRENCY_OPTIONS: { value: number; label: string }[] = [
    { value: -1, label: 'Credits' },
    { value: 0, label: 'Duckets' },
    { value: 5, label: 'Diamonds' },
];

interface TermRow {
    direction: number;
    currencyType: number;
    amount: number;
}

export const WiredCustomContractView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [rows, setRows] = useState<TermRow[]>([{ direction: DIR_PAY, currencyType: -1, amount: 0 }]);

    useEffect(() => {
        if (!trigger) return;

        const data = trigger.intData ?? [];
        const count = data.length > 0 ? data[0] : 0;
        const parsed: TermRow[] = [];
        for (let i = 0; i < count; i++) {
            const base = 1 + i * 3;
            if (base + 2 >= data.length) break;
            parsed.push({ direction: data[base], currencyType: data[base + 1], amount: Math.max(0, data[base + 2]) });
        }
        if (parsed.length) setRows(parsed);
    }, [trigger]);

    const update = (index: number, patch: Partial<TermRow>) =>
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    const addRow = () => setRows((prev) => (prev.length >= MAX_TERMS ? prev : [...prev, { direction: DIR_PAY, currencyType: -1, amount: 0 }]));
    const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

    const save = () => {
        const valid = rows.filter((row) => row.amount > 0).slice(0, MAX_TERMS);
        const params: number[] = [valid.length];
        for (const row of valid) params.push(row.direction, row.currencyType, Math.max(0, row.amount));
        setIntParams(params);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 420 }}>
            <div className="flex flex-col gap-2">
                <Text bold>Contract terms (PAY = user pays, RECEIVE = user gets):</Text>
                {rows.map((row, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <select
                            className="form-select form-select-sm"
                            value={row.direction}
                            onChange={(event) => update(index, { direction: parseInt(event.target.value, 10) })}
                        >
                            <option value={DIR_PAY}>PAY</option>
                            <option value={DIR_RECEIVE}>RECEIVE</option>
                        </select>
                        <select
                            className="form-select form-select-sm"
                            value={row.currencyType}
                            onChange={(event) => update(index, { currencyType: parseInt(event.target.value, 10) })}
                        >
                            {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min={0}
                            className="form-control form-control-sm"
                            value={row.amount}
                            onChange={(event) => update(index, { amount: Math.max(0, parseInt(event.target.value, 10) || 0) })}
                        />
                        <Button variant="danger" onClick={() => removeRow(index)}>×</Button>
                    </div>
                ))}
                {rows.length < MAX_TERMS && (
                    <Button variant="secondary" onClick={addRow}>+ Add term</Button>
                )}
                <Text small>Pick a chest above to deposit PAY into / source RECEIVE from its pool.</Text>
            </div>
        </WiredExtraBaseView>
    );
};
