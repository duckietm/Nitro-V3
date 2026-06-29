import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

// Server saveData expects [baseItemId, amount] + the selected chest furni.
export const WiredConditionChestHasItemTypeView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [baseItemId, setBaseItemId] = useState(0);
    const [amount, setAmount] = useState(1);

    useEffect(() => {
        if (!trigger) return;

        setBaseItemId(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        setAmount(trigger.intData.length > 1 ? Math.max(1, trigger.intData[1]) : 1);
    }, [trigger]);

    const save = () => setIntParams([Math.max(0, baseItemId), Math.max(1, amount)]);

    return (
        <WiredConditionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>Pick the chest above. Passes when it holds the furni type:</Text>
                <Text bold>Furni base item id</Text>
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={baseItemId}
                    onChange={(event) => setBaseItemId(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text bold>Minimum amount</Text>
                <input
                    type="number"
                    min={1}
                    className="form-control form-control-sm"
                    value={amount}
                    onChange={(event) => setAmount(Math.max(1, parseInt(event.target.value, 10) || 1))}
                />
            </div>
        </WiredConditionBaseView>
    );
};
