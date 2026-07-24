import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const OPACITY_MIN = 0;
const OPACITY_MAX = 100;

const EASING_OPTIONS = [
    { value: 0, label: 'Instant' },
    { value: 1, label: 'Linear' },
    { value: 2, label: 'Ease in' },
    { value: 3, label: 'Ease out' },
    { value: 4, label: 'Ease in/out' }
];

export const WiredActionFurniOpacityView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [opacity, setOpacity] = useState(OPACITY_MAX);
    const [visibility, setVisibility] = useState(0);
    const [clickThrough, setClickThrough] = useState(false);
    const [easing, setEasing] = useState(0);
    const [furniSource, setFurniSource] = useState(0);

    useEffect(() => {
        const params = trigger?.intData ?? [];

        setOpacity(Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, params[0] ?? OPACITY_MAX)));
        setVisibility(params[1] === 1 ? 1 : 0);
        setClickThrough(params[2] === 1);
        setEasing(EASING_OPTIONS.some(option => option.value === params[3]) ? params[3] : 0);
        setFurniSource(params[4] ?? ((trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0));
    }, [trigger]);

    const save = () => setIntParams([opacity, visibility, clickThrough ? 1 : 0, easing, furniSource]);

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>Opacity visibility</Text>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input checked={visibility === 1} className="form-check-input" name="opacity-visibility" type="radio" onChange={() => setVisibility(1)} />
                        <Text>Only the user</Text>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input checked={visibility === 0} className="form-check-input" name="opacity-visibility" type="radio" onChange={() => setVisibility(0)} />
                        <Text>Everyone</Text>
                    </label>
                </div>
                <div className="nitro-wired__divider" />
                <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1" htmlFor="wired-opacity-value">
                        <Text bold>Set opacity:</Text>
                        <input
                            className="form-control form-control-sm w-20"
                            id="wired-opacity-value"
                            max={OPACITY_MAX}
                            min={OPACITY_MIN}
                            type="number"
                            value={opacity}
                            onChange={event => setOpacity(Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, Number(event.target.value) || 0)))}
                        />
                    </label>
                    <Slider max={OPACITY_MAX} min={OPACITY_MIN} step={1} value={opacity} onChange={value => setOpacity(value as number)} />
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input checked={clickThrough} className="form-check-input" type="checkbox" onChange={event => setClickThrough(event.target.checked)} />
                        <Text>Allow click-through</Text>
                    </label>
                </div>
                <div className="nitro-wired__divider" />
                <label className="flex flex-col gap-1" htmlFor="wired-opacity-easing">
                    <Text bold>Easing function</Text>
                    <select className="form-select form-select-sm" id="wired-opacity-easing" value={easing} onChange={event => setEasing(Number(event.target.value))}>
                        {EASING_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
            </div>
        </WiredActionBaseView>
    );
};
