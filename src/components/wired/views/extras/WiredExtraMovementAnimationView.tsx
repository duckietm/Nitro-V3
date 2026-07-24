import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const EFFECT_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: 'Default' },
    { value: 1, label: 'Ease in' },
    { value: 2, label: 'Ease out' },
    { value: 3, label: 'Ease in / out' },
    { value: 4, label: 'Bounce' },
    { value: 5, label: 'Elastic' },
    { value: 6, label: 'Drop' }
];

const normalizeEffect = (value: number) => {
    if (isNaN(value)) return 0;

    return Math.max(0, Math.min(6, value));
};

const normalizeArcIntensity = (value: number) => {
    if (isNaN(value)) return 0;

    return Math.max(0, Math.min(100, Math.round(value)));
};

export const WiredExtraMovementAnimationView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [animationEffect, setAnimationEffect] = useState(0);
    const [arcIntensity, setArcIntensity] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        setAnimationEffect(normalizeEffect(trigger.intData.length > 0 ? trigger.intData[0] : 0));
        setArcIntensity(normalizeArcIntensity(trigger.intData.length > 1 ? trigger.intData[1] : 0));
    }, [trigger]);

    const save = () => {
        setIntParams([normalizeEffect(animationEffect), normalizeArcIntensity(arcIntensity)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save} cardStyle={{ width: 390 }}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <Text bold>Movement animation</Text>
                    <div className="grid grid-cols-2 gap-1">
                        {EFFECT_OPTIONS.map((option) => (
                            <label key={option.value} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    name="movementAnimationEffect"
                                    checked={animationEffect === option.value}
                                    onChange={() => setAnimationEffect(option.value)}
                                />
                                <Text small>{option.label}</Text>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Text bold>Arc intensity: {arcIntensity}</Text>
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={arcIntensity}
                        onChange={(value) => setArcIntensity(normalizeArcIntensity(Array.isArray(value) ? value[0] : Number(value)))}
                    />
                </div>
            </div>
        </WiredExtraBaseView>
    );
};
