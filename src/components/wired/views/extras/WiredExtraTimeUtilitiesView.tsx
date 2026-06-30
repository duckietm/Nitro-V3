import { FC, useEffect, useState } from 'react';
import { WiredFurniType, localizeWithFallback } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const UNIT_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: 'Milliseconds' },
    { value: 1, label: 'Seconds' },
    { value: 2, label: 'Minutes' },
    { value: 3, label: 'Hours' }
];

const normalizeUnit = (value: number) => {
    if (isNaN(value)) return 1;
    return Math.max(0, Math.min(3, value));
};

export const WiredExtraTimeUtilitiesView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [timeUnit, setTimeUnit] = useState(1);

    useEffect(() => {
        if (!trigger) return;

        setTimeUnit(normalizeUnit(trigger.intData.length > 0 ? trigger.intData[0] : 1));
    }, [trigger]);

    const save = () => {
        setIntParams([normalizeUnit(timeUnit)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save} cardStyle={{ width: 380 }}>
            <div className="flex flex-col gap-2">
                <Text bold>{localizeWithFallback('wiredfurni.params.choose_type', 'Time unit')}</Text>
                <div className="flex flex-col gap-1">
                    {UNIT_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                            <input
                                type="radio"
                                className="form-check-input"
                                name="timeUnit"
                                checked={timeUnit === option.value}
                                onChange={() => setTimeUnit(option.value)}
                            />
                            <Text small>{option.label}</Text>
                        </label>
                    ))}
                </div>
            </div>
        </WiredExtraBaseView>
    );
};
