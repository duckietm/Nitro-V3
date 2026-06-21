import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const COUNTER_INTERACTION_TYPES = ['game_upcounter', 'game_timer', 'wf_game_upcounter*', 'fball_counter', 'bb_counter', 'es_counter'];

const CONTROL_OPTIONS = [
    { value: 0, label: 'wiredfurni.params.clock_control.0' },
    { value: 1, label: 'wiredfurni.params.clock_control.1' },
    { value: 2, label: 'wiredfurni.params.clock_control.2' },
    { value: 3, label: 'wiredfurni.params.clock_control.3' },
    { value: 4, label: 'wiredfurni.params.clock_control.4' }
];

const normalizeControl = (value: number) => {
    if (value < 0 || value > 4) return 0;

    return value;
};

export const WiredActionControlClockView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setAllowedInteractionTypes = null, setAllowedInteractionErrorKey = null } = useWired();
    const [control, setControl] = useState(0);
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => {
        setIntParams([control, furniSource]);
    };

    useEffect(() => {
        if (!trigger) return;

        setControl(trigger.intData.length > 0 ? normalizeControl(trigger.intData[0]) : 0);
        setFurniSource(trigger.intData.length > 1 ? trigger.intData[1] : (trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
    }, [trigger]);

    useEffect(() => {
        setAllowedInteractionTypes(COUNTER_INTERACTION_TYPES);
        setAllowedInteractionErrorKey('wiredfurni.error.require_counter_furni');

        return () => {
            setAllowedInteractionTypes(null);
            setAllowedInteractionErrorKey(null);
        };
    }, [setAllowedInteractionErrorKey, setAllowedInteractionTypes]);

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-2">
                {CONTROL_OPTIONS.map((option) => {
                    return (
                        <div key={option.value} className="flex items-center gap-1">
                            <input
                                checked={control === option.value}
                                className="form-check-input"
                                id={`controlClock${option.value}`}
                                name="controlClock"
                                type="radio"
                                onChange={() => setControl(option.value)}
                            />
                            <Text>{LocalizeText(option.label)}</Text>
                        </div>
                    );
                })}
            </div>
        </WiredActionBaseView>
    );
};
