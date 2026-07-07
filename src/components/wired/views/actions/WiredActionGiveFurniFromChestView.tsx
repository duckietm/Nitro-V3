import { FC, useEffect, useMemo, useState } from 'react';
import { localizeWithFallback, LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { sortWiredSourceOptions, USER_SOURCES, useAvailableUserSources } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

// Wire contract (WiredEffectGiveFurniFromChest): intData = [amount, userSource].
// userSource is resolved server-side via WiredSourceUtil.resolveUsers — TRIGGER(0)/SELECTOR(200)/
// SIGNAL(201), plus CLICKED_USER(11) when a click-user trigger sits in the stack.
const SOURCE_TRIGGER = 0;

export const WiredActionGiveFurniFromChestView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [amount, setAmount] = useState(1);
    const [userSource, setUserSource] = useState(SOURCE_TRIGGER);
    const rawAvailableSources = useAvailableUserSources(trigger, USER_SOURCES);
    const availableSources = useMemo(() => sortWiredSourceOptions(rawAvailableSources, 'users'), [rawAvailableSources]);

    useEffect(() => {
        if (!trigger) return;

        const data = trigger.intData ?? [];
        setAmount(data.length > 0 ? Math.max(1, data[0]) : 1);
        setUserSource(data.length > 1 ? data[1] : SOURCE_TRIGGER);
    }, [trigger]);

    // Fall back to the triggering user if the chosen source is no longer offered (e.g. click-user trigger removed).
    useEffect(() => {
        if (!availableSources.some((option) => option.value === userSource)) setUserSource(SOURCE_TRIGGER);
    }, [availableSources, userSource]);

    const save = () => setIntParams([Math.max(1, amount), userSource]);

    return (
        <WiredActionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-3">
                <Text small className="text-black/60">
                    {localizeWithFallback(
                        'wiredfurni.chest.give_furni.help',
                        'Pick the furni chest above. On each trigger it dispenses the number of items below from the chest to the chosen users’ inventory.'
                    )}
                </Text>

                <div className="flex flex-col gap-1">
                    <Text bold>{localizeWithFallback('wiredfurni.params.amount_to_give', 'Items per trigger')}</Text>
                    <input
                        type="number"
                        min={1}
                        className="form-control form-control-sm"
                        style={{ maxWidth: 140 }}
                        value={amount}
                        onChange={(event) => setAmount(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <Text bold>{localizeWithFallback('wiredfurni.params.give_to', 'Give to')}</Text>
                    <div className="flex flex-col gap-1">
                        {availableSources.map((option) => (
                            <label key={option.value} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    name="giveFurniFromChestSource"
                                    checked={userSource === option.value}
                                    onChange={() => setUserSource(option.value)}
                                />
                                <Text>{LocalizeText(option.label)}</Text>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
