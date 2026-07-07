import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const CURVE_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: 'Linear' },
    { value: 1, label: 'Ease in' },
    { value: 2, label: 'Ease out' },
    { value: 3, label: 'Ease in / out' }
];

const normalizeCurve = (value: number) => {
    if (isNaN(value)) return 0;
    return Math.max(0, Math.min(3, value));
};

export const WiredExtraMovementCurveView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [curveType, setCurveType] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        setCurveType(normalizeCurve(trigger.intData.length > 0 ? trigger.intData[0] : 0));
    }, [trigger]);

    const save = () => {
        setIntParams([normalizeCurve(curveType)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save} cardStyle={{ width: 380 }}>
            <div className="flex flex-col gap-2">
                <Text bold>Movement curve</Text>
                <div className="flex flex-col gap-1">
                    {CURVE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                            <input
                                type="radio"
                                className="form-check-input"
                                name="curveType"
                                checked={curveType === option.value}
                                onChange={() => setCurveType(option.value)}
                            />
                            <Text small>{option.label}</Text>
                        </label>
                    ))}
                </div>
            </div>
        </WiredExtraBaseView>
    );
};
