import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const SOURCE_FURNI_PICKED = 0;

export const WiredSelectorFurniByTypeView: FC<{}> = () => {
    const [matchState, setMatchState] = useState(false);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);

    const { trigger = null, setIntParams } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const p = trigger.intData;
        if (p.length >= 2) setMatchState(p[1] === 1);
        if (p.length >= 3) setFilterExisting(p[2] === 1);
        if (p.length >= 4) setInvert(p[3] === 1);
    }, [trigger]);

    const save = useCallback(() => {
        setIntParams([SOURCE_FURNI_PICKED, matchState ? 1 : 0, filterExisting ? 1 : 0, invert ? 1 : 0]);
    }, [matchState, filterExisting, invert, setIntParams]);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID;

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={requiresFurni} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={matchState} onChange={(e) => setMatchState(e.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.state_match')}</Text>
                </label>

                <hr className="m-0 bg-dark" />

                <Text bold>{LocalizeText('wiredfurni.params.selector_options_selector')}</Text>

                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={filterExisting} onChange={(e) => setFilterExisting(e.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.0')}</Text>
                </label>

                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.1')}</Text>
                </label>
            </div>
        </WiredSelectorBaseView>
    );
};
