import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionChestHasItemsView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [amount, setAmount] = useState(1);

    useEffect(() => {
        if (!trigger) return;

        setAmount(trigger.intData.length > 0 ? Math.max(0, trigger.intData[0]) : 1);
    }, [trigger]);

    const save = () => setIntParams([Math.max(0, amount)]);

    return (
        <WiredConditionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>Pick the chest above. Passes when it holds at least:</Text>
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={amount}
                    onChange={(event) => setAmount(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
            </div>
        </WiredConditionBaseView>
    );
};
