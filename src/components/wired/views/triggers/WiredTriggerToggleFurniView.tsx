import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceOption, WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const FURNI_SOURCE_OPTIONS: WiredSourceOption[] = [
    { value: 100, label: 'wiredfurni.params.sources.furni.100' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' }
];

const normalizeFurniSource = (value: number) => (FURNI_SOURCE_OPTIONS.some((option) => option.value === value) ? value : 100);

export const WiredTriggerToggleFurniView: FC<{}> = () => {
    const [triggerMode, setTriggerMode] = useState(0);
    const [furniSource, setFurniSource] = useState(100);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([triggerMode, furniSource]);

    useEffect(() => {
        setTriggerMode(trigger?.intData?.length > 0 ? trigger.intData[0] : 0);
        setFurniSource(trigger?.intData?.length > 1 ? normalizeFurniSource(trigger.intData[1]) : 100);
    }, [trigger]);

    return (
        <WiredTriggerBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} furniSources={FURNI_SOURCE_OPTIONS} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.condition.state')}</Text>
                <div className="flex items-center gap-1">
                    <input
                        checked={triggerMode === 1}
                        className="form-check-input"
                        id="stateTrigger1"
                        name="stateTrigger"
                        type="radio"
                        onChange={() => setTriggerMode(1)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.state_trigger.1')}</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        checked={triggerMode === 0}
                        className="form-check-input"
                        id="stateTrigger0"
                        name="stateTrigger"
                        type="radio"
                        onChange={() => setTriggerMode(0)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.state_trigger.0')}</Text>
                </div>
            </div>
        </WiredTriggerBaseView>
    );
};
