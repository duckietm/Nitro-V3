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

export const WiredTriggerReceiveSignalView: FC<{}> = () => {
    const [senderCount, setSenderCount] = useState(0);
    const [channel, setChannel] = useState(0);
    const [furniSource, setFurniSource] = useState(100);

    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([channel, furniSource]);

    useEffect(() => {
        if (!trigger) return;

        const p = trigger.intData;
        if (p.length >= 1) setChannel(p[0]);
        if (p.length >= 2) setSenderCount(p[1]);
        if (p.length >= 4) setFurniSource(normalizeFurniSource(p[3]));
        else setFurniSource(100);
    }, [trigger]);

    return (
        <WiredTriggerBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} furniSources={FURNI_SOURCE_OPTIONS} onChangeFurni={setFurniSource} />}
        >
            <div className="flex items-center justify-between">
                <Text small>{LocalizeText('wiredfurni.params.signal.senders_connected')}</Text>
                <Text bold small>
                    {senderCount}
                </Text>
            </div>
        </WiredTriggerBaseView>
    );
};
