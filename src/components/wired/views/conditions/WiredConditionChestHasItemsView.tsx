import { FC, useEffect, useState } from 'react';
import { localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { normalizeWiredComparison, WiredComparisonOperator, WIRED_CMP_DEFAULT } from '../WiredComparisonOperator';
import { WiredConditionBaseView } from './WiredConditionBaseView';

// Server contract (WiredConditionChestHasItems): intData[0] = amount, intData[1] = comparison op.
// The comparison operator value encoding is owned by WiredComparisonOperator and mirrored by the
// Java `compare()` switch. Old saves (1 int) read comparison as the default (>=), preserving behaviour.
export const WiredConditionChestHasItemsView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [amount, setAmount] = useState(1);
    const [comparison, setComparison] = useState(WIRED_CMP_DEFAULT);

    useEffect(() => {
        if (!trigger) return;

        setAmount(trigger.intData.length > 0 ? Math.max(0, trigger.intData[0]) : 1);
        setComparison(trigger.intData.length > 1 ? normalizeWiredComparison(trigger.intData[1]) : WIRED_CMP_DEFAULT);
    }, [trigger]);

    const save = () => setIntParams([Math.max(0, amount), comparison]);

    return (
        <WiredConditionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>{localizeWithFallback('wiredfurni.chest.condition.has_items', 'Pick the chest above. Passes when its total contents compare:')}</Text>
                <WiredComparisonOperator name="chestHasItemsComparison" value={comparison} onChange={setComparison} />
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
