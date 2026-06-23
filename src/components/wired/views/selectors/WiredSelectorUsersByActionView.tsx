import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const ACTION_WAVE = 1;
const ACTION_BLOW_KISS = 2;
const ACTION_LAUGH = 3;
const ACTION_AWAKE = 4;
const ACTION_RELAX = 5;
const ACTION_SIT = 6;
const ACTION_STAND = 7;
const ACTION_LAY = 8;
const ACTION_SIGN = 9;
const ACTION_DANCE = 10;
const ACTION_THUMB_UP = 11;

const ACTION_OPTIONS = [
    { value: ACTION_WAVE, label: 'widget.memenu.wave' },
    { value: ACTION_BLOW_KISS, label: 'widget.memenu.blow' },
    { value: ACTION_LAUGH, label: 'widget.memenu.laugh' },
    { value: ACTION_THUMB_UP, label: 'widget.memenu.thumb' },
    { value: ACTION_AWAKE, label: 'wiredfurni.params.action.4' },
    { value: ACTION_RELAX, label: 'avatar.widget.random_walk' },
    { value: ACTION_SIT, label: 'widget.memenu.sit' },
    { value: ACTION_STAND, label: 'widget.memenu.stand' },
    { value: ACTION_LAY, label: 'wiredfurni.params.action.8' },
    { value: ACTION_SIGN, label: 'widget.memenu.sign' },
    { value: ACTION_DANCE, label: 'widget.memenu.dance' }
];

const SIGN_OPTIONS = Array.from({ length: 18 }, (_, value) => ({
    value,
    label: `wiredfurni.params.action.sign.${value}`
}));

const DANCE_OPTIONS = [
    { value: 1, label: 'widget.memenu.dance1' },
    { value: 2, label: 'widget.memenu.dance2' },
    { value: 3, label: 'widget.memenu.dance3' },
    { value: 4, label: 'widget.memenu.dance4' }
];

export const WiredSelectorUsersByActionView: FC<{}> = () => {
    const [selectedAction, setSelectedAction] = useState(ACTION_WAVE);
    const [signFilterEnabled, setSignFilterEnabled] = useState(false);
    const [signId, setSignId] = useState(0);
    const [danceFilterEnabled, setDanceFilterEnabled] = useState(false);
    const [danceId, setDanceId] = useState(1);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const params = trigger.intData;

        setSelectedAction(params.length > 0 ? params[0] : ACTION_WAVE);
        setSignFilterEnabled(params.length > 1 ? params[1] === 1 : false);
        setSignId(params.length > 2 ? params[2] : 0);
        setDanceFilterEnabled(params.length > 3 ? params[3] === 1 : false);
        setDanceId(params.length > 4 ? params[4] : 1);
        setFilterExisting(params.length > 5 ? params[5] === 1 : false);
        setInvert(params.length > 6 ? params[6] === 1 : false);
    }, [trigger]);

    const save = useCallback(() => {
        setIntParams([selectedAction, signFilterEnabled ? 1 : 0, signId, danceFilterEnabled ? 1 : 0, danceId, filterExisting ? 1 : 0, invert ? 1 : 0]);
    }, [selectedAction, signFilterEnabled, signId, danceFilterEnabled, danceId, filterExisting, invert, setIntParams]);

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={0} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>Action</Text>
                    <select className="form-select form-select-sm" value={selectedAction} onChange={(event) => setSelectedAction(parseInt(event.target.value))}>
                        {ACTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {LocalizeText(option.label)}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedAction === ACTION_SIGN && (
                    <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1">
                            <input
                                checked={signFilterEnabled}
                                className="form-check-input"
                                type="checkbox"
                                onChange={(event) => setSignFilterEnabled(event.target.checked)}
                            />
                            <Text>{LocalizeText('wiredfurni.params.sign_filter')}</Text>
                        </label>
                        {signFilterEnabled && (
                            <select className="form-select form-select-sm" value={signId} onChange={(event) => setSignId(parseInt(event.target.value))}>
                                {SIGN_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {LocalizeText(option.label)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {selectedAction === ACTION_DANCE && (
                    <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1">
                            <input
                                checked={danceFilterEnabled}
                                className="form-check-input"
                                type="checkbox"
                                onChange={(event) => setDanceFilterEnabled(event.target.checked)}
                            />
                            <Text>{LocalizeText('wiredfurni.params.dance_filter')}</Text>
                        </label>
                        {danceFilterEnabled && (
                            <select className="form-select form-select-sm" value={danceId} onChange={(event) => setDanceId(parseInt(event.target.value))}>
                                {DANCE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {LocalizeText(option.label)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <hr className="m-0 bg-dark" />

                <Text bold>{LocalizeText('wiredfurni.params.selector_options_selector')}</Text>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={filterExisting}
                        onChange={(event) => setFilterExisting(event.target.checked)}
                    />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.0')}</Text>
                </label>

                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={invert} onChange={(event) => setInvert(event.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.1')}</Text>
                </label>
            </div>
        </WiredSelectorBaseView>
    );
};
