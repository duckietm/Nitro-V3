import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { CONTRACT_DIR_PAY, ContractTermRow, parseContractTerms, serializeContractTerms } from './contractTermWire';
import { WiredContractTermRow } from './WiredContractTermRow';
import { WiredExtraBaseView } from './WiredExtraBaseView';

export const WiredContractPaymentView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [row, setRow] = useState<ContractTermRow>({
        direction: CONTRACT_DIR_PAY,
        kind: 0,
        currencyType: -1,
        wallItem: false,
        baseItemId: 0,
        amount: 0,
    });

    useEffect(() => {
        if (!trigger) return;
        const parsed = parseContractTerms(trigger.intData ?? [], trigger.stringData ?? '');
        if (parsed.length > 0) setRow(parsed[0]);
    }, [trigger]);

    const save = () => {
        const payload = serializeContractTerms([{ ...row, direction: CONTRACT_DIR_PAY }]);
        setIntParams(payload.intParams);
        setStringParam(payload.stringParam);
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save} cardStyle={{ width: 380 }}>
            <div className="flex flex-col gap-2">
                <Text bold>The user must PAY:</Text>
                <WiredContractTermRow row={row} onChange={(patch) => setRow((prev) => ({ ...prev, ...patch }))} />
                <Text small>Optional: pick a chest above to deposit the payment into (else it is removed).</Text>
            </div>
        </WiredExtraBaseView>
    );
};
