import { FC, useEffect, useState } from 'react';
import { localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { ChestFurniIconPreview } from '../ChestFurniIconPreview';
import { normalizeWiredComparison, WiredComparisonOperator, WIRED_CMP_DEFAULT } from '../WiredComparisonOperator';
import { WiredConditionBaseView } from './WiredConditionBaseView';

// Server contract (WiredConditionChestHasItemType): intData[0] = baseItemId, intData[1] = amount,
// intData[2] = comparison op. baseItemId stays at [0] for back-compat; old saves (2 ints) read the
// comparison as the default (>=), preserving the previous hard-coded ">=" behaviour.
export const WiredConditionChestHasItemTypeView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [baseItemId, setBaseItemId] = useState(0);
    const [amount, setAmount] = useState(1);
    const [comparison, setComparison] = useState(WIRED_CMP_DEFAULT);

    useEffect(() => {
        if (!trigger) return;

        setBaseItemId(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        setAmount(trigger.intData.length > 1 ? Math.max(1, trigger.intData[1]) : 1);
        setComparison(trigger.intData.length > 2 ? normalizeWiredComparison(trigger.intData[2]) : WIRED_CMP_DEFAULT);
    }, [trigger]);

    const save = () => setIntParams([Math.max(0, baseItemId), Math.max(1, amount), comparison]);

    return (
        <WiredConditionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>{localizeWithFallback('wiredfurni.chest.condition.has_item_type', 'Pick the chest above. Passes when it holds this furni:')}</Text>
                <ChestFurniIconPreview baseItemId={baseItemId} />
                <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={baseItemId}
                    onChange={(event) => setBaseItemId(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <Text bold>{localizeWithFallback('wiredfurni.chest.condition.amount', 'Amount')}</Text>
                <WiredComparisonOperator name="chestHasItemTypeComparison" value={comparison} onChange={setComparison} />
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
