import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceOption, WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const COUNTER_INTERACTION_TYPES = ['game_upcounter'];
const MINUTES_MIN = 0;
const MINUTES_MAX = 99;
const HALF_SECONDS_MIN = 0;
const HALF_SECONDS_MAX = 119;
const TRIGGER_FURNI_SOURCES: WiredSourceOption[] = [
    { value: 100, label: 'wiredfurni.params.sources.furni.100' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' }
];

const normalizeMinutes = (value: number) => Math.max(MINUTES_MIN, Math.min(MINUTES_MAX, value));
const normalizeHalfSeconds = (value: number) => Math.max(HALF_SECONDS_MIN, Math.min(HALF_SECONDS_MAX, value));
const normalizeFurniSource = (value: number) => (TRIGGER_FURNI_SOURCES.some((option) => option.value === value) ? value : 100);

const formatSeconds = (halfSeconds: number) => {
    const value = normalizeHalfSeconds(halfSeconds) / 2;
    const text = value.toFixed(1);

    return text.endsWith('.0') ? text.slice(0, -2) : text;
};

export const WiredTriggerClockCounterView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setAllowedInteractionTypes = null, setAllowedInteractionErrorKey = null } = useWired();
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 2) return normalizeFurniSource(trigger.intData[2]);
        return 100;
    });
    const [minutes, setMinutes] = useState(0);
    const [halfSeconds, setHalfSeconds] = useState(0);

    const secondsLabel = useMemo(() => formatSeconds(halfSeconds), [halfSeconds]);

    const save = () => {
        setIntParams([normalizeMinutes(minutes), normalizeHalfSeconds(halfSeconds), normalizeFurniSource(furniSource)]);
    };

    useEffect(() => {
        if (!trigger) return;

        setMinutes(trigger.intData.length > 0 ? normalizeMinutes(trigger.intData[0]) : 0);
        setHalfSeconds(trigger.intData.length > 1 ? normalizeHalfSeconds(trigger.intData[1]) : 0);
        setFurniSource(trigger.intData.length > 2 ? normalizeFurniSource(trigger.intData[2]) : 100);
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
        <WiredTriggerBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} furniSources={TRIGGER_FURNI_SOURCES} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.clock_minutes_elapsed', ['minutes'], [minutes.toString()])}</Text>
                <Slider max={MINUTES_MAX} min={MINUTES_MIN} step={1} value={minutes} onChange={(event) => setMinutes(normalizeMinutes(event as number))} />
                <Text small>{minutes}</Text>
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.clock_seconds_elapsed', ['seconds'], [secondsLabel])}</Text>
                <Slider
                    max={HALF_SECONDS_MAX}
                    min={HALF_SECONDS_MIN}
                    step={1}
                    value={halfSeconds}
                    onChange={(event) => setHalfSeconds(normalizeHalfSeconds(event as number))}
                />
                <Text small>{secondsLabel}</Text>
            </div>
        </WiredTriggerBaseView>
    );
};
