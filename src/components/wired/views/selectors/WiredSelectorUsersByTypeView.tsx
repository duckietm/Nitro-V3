import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const USER_TYPES = [1, 2, 4];

export const WiredSelectorUsersByTypeView: FC<{}> = () => {
    const [userType, setUserType] = useState(1);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const params = trigger.intData;

        setUserType(params.length > 0 ? params[0] : 1);
        setFilterExisting(params.length > 1 ? params[1] === 1 : false);
        setInvert(params.length > 2 ? params[2] === 1 : false);
    }, [trigger]);

    const save = useCallback(() => {
        setIntParams([userType, filterExisting ? 1 : 0, invert ? 1 : 0]);
    }, [userType, filterExisting, invert, setIntParams]);

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={0} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.usertype')}</Text>
                    {USER_TYPES.map((value) => (
                        <label key={value} className="flex items-center gap-1">
                            <input
                                checked={userType === value}
                                className="form-check-input"
                                name="usersByTypeSelector"
                                type="radio"
                                onChange={() => setUserType(value)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.usertype.${value}`)}</Text>
                        </label>
                    ))}
                </div>

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
