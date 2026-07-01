import { FC, useEffect, useState } from 'react';
import { localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

// Wire contract (WiredEffectGiveFurniFromChest): intData = [amount, userSource].
// userSource is resolved server-side via WiredSourceUtil.resolveUsers (TRIGGER / SELECTOR / SIGNAL).
const SOURCE_TRIGGER = 0;
const SOURCE_SELECTOR = 200;
const SOURCE_SIGNAL = 201;

const SOURCE_OPTIONS: { value: number; key: string; fallback: string }[] = [
    { value: SOURCE_TRIGGER, key: 'wiredfurni.params.source.trigger', fallback: 'The user who triggered' },
    { value: SOURCE_SELECTOR, key: 'wiredfurni.params.source.selector', fallback: 'Users picked by a selector' },
    { value: SOURCE_SIGNAL, key: 'wiredfurni.params.source.signal', fallback: 'Users forwarded by a signal' },
];

const normalizeSource = (value: number): number =>
    SOURCE_OPTIONS.some((option) => option.value === value) ? value : SOURCE_TRIGGER;

export const WiredActionGiveFurniFromChestView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [amount, setAmount] = useState(1);
    const [userSource, setUserSource] = useState(SOURCE_TRIGGER);

    useEffect(() => {
        if (!trigger) return;

        const data = trigger.intData ?? [];
        setAmount(data.length > 0 ? Math.max(1, data[0]) : 1);
        setUserSource(data.length > 1 ? normalizeSource(data[1]) : SOURCE_TRIGGER);
    }, [trigger]);

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
                        {SOURCE_OPTIONS.map((option) => (
                            <label key={option.value} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    name="giveFurniFromChestSource"
                                    checked={userSource === option.value}
                                    onChange={() => setUserSource(option.value)}
                                />
                                <Text>{localizeWithFallback(option.key, option.fallback)}</Text>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
