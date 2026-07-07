import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { CONTRACT_DIR_PAY, ContractTermRow, parseContractTerms, serializeContractTerms } from './contractTermWire';
import { WiredContractTermRow } from './WiredContractTermRow';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const MAX_TERMS = 8;

export const WiredCustomContractView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [rows, setRows] = useState<ContractTermRow[]>([
        { direction: CONTRACT_DIR_PAY, kind: 0, currencyType: -1, wallItem: false, baseItemId: 0, amount: 0 },
    ]);

    useEffect(() => {
        if (!trigger) return;
        const parsed = parseContractTerms(trigger.intData ?? [], trigger.stringData ?? '');
        if (parsed.length) setRows(parsed);
    }, [trigger]);

    const update = (index: number, patch: Partial<ContractTermRow>) =>
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    const addRow = () =>
        setRows((prev) =>
            prev.length >= MAX_TERMS
                ? prev
                : [...prev, { direction: CONTRACT_DIR_PAY, kind: 0, currencyType: -1, wallItem: false, baseItemId: 0, amount: 0 }],
        );

    const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

    const save = () => {
        const payload = serializeContractTerms(rows);
        setIntParams(payload.intParams);
        setStringParam(payload.stringParam);
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 420 }}>
            <div className="flex flex-col gap-2">
                <Text bold>Contract terms (PAY = user pays, RECEIVE = user gets):</Text>
                {rows.map((row, index) => (
                    <div key={index} className="flex gap-1">
                        <div className="flex-1">
                            <WiredContractTermRow row={row} showDirection onChange={(patch) => update(index, patch)} />
                        </div>
                        <Button variant="danger" onClick={() => removeRow(index)}>×</Button>
                    </div>
                ))}
                {rows.length < MAX_TERMS && <Button variant="secondary" onClick={addRow}>+ Add term</Button>}
                <Text small>Pick a chest above to deposit PAY into / source RECEIVE from its pool.</Text>
            </div>
        </WiredExtraBaseView>
    );
};
