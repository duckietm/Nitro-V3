import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    CONTRACT_DIR_PAY,
    CONTRACT_DIR_RECEIVE,
    CONTRACT_KIND_CURRENCY,
    ContractTermRow,
    parseContractTerms,
    serializeContractTerms,
} from './contractTermWire';
import { WiredContractTermRow } from './WiredContractTermRow';
import { WiredExtraBaseView } from './WiredExtraBaseView';

export const WiredContractTradeView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [payRow, setPayRow] = useState<ContractTermRow>({
        direction: CONTRACT_DIR_PAY,
        kind: CONTRACT_KIND_CURRENCY,
        currencyType: -1,
        wallItem: false,
        baseItemId: 0,
        amount: 0,
    });
    const [receiveRow, setReceiveRow] = useState<ContractTermRow>({
        direction: CONTRACT_DIR_RECEIVE,
        kind: CONTRACT_KIND_CURRENCY,
        currencyType: 0,
        wallItem: false,
        baseItemId: 0,
        amount: 0,
    });

    useEffect(() => {
        if (!trigger) return;
        const parsed = parseContractTerms(trigger.intData ?? [], trigger.stringData ?? '');
        for (const row of parsed) {
            if (row.direction === CONTRACT_DIR_PAY) setPayRow(row);
            else setReceiveRow(row);
        }
    }, [trigger]);

    const save = () => {
        const payload = serializeContractTerms([
            { ...payRow, direction: CONTRACT_DIR_PAY },
            { ...receiveRow, direction: CONTRACT_DIR_RECEIVE },
        ]);
        setIntParams(payload.intParams);
        setStringParam(payload.stringParam);
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <Text bold>The user PAYS:</Text>
                <WiredContractTermRow row={payRow} onChange={(patch) => setPayRow((prev) => ({ ...prev, ...patch }))} />
                <div className="nitro-wired__divider" />
                <Text bold>The user RECEIVES:</Text>
                <WiredContractTermRow row={receiveRow} onChange={(patch) => setReceiveRow((prev) => ({ ...prev, ...patch }))} />
                <Text small>Pick a chest above: payment is deposited and the reward sourced from its pool.</Text>
            </div>
        </WiredExtraBaseView>
    );
};
