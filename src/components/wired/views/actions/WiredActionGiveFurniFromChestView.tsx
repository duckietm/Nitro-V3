import { FC, useEffect, useState } from 'react';
import { localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

// Server saveData expects [amount, userSource]; userSource 0 = triggering user (v1 default).
const USER_SOURCE_TRIGGER = 0;

export const WiredActionGiveFurniFromChestView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [amount, setAmount] = useState(1);

    useEffect(() => {
        if (!trigger) return;

        setAmount(trigger.intData.length > 0 ? Math.max(1, trigger.intData[0]) : 1);
    }, [trigger]);

    const save = () => setIntParams([Math.max(1, amount), USER_SOURCE_TRIGGER]);

    return (
        <WiredActionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>Pick the furni chest above, then how many to give per trigger:</Text>
                <Text bold>{localizeWithFallback('wiredfurni.params.amount_to_give', 'Amount')}</Text>
                <input
                    type="number"
                    min={1}
                    className="form-control form-control-sm"
                    value={amount}
                    onChange={(event) => setAmount(Math.max(1, parseInt(event.target.value, 10) || 1))}
                />
            </div>
        </WiredActionBaseView>
    );
};
