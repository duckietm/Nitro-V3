import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionSetFurniStateToView: FC<{}> = (props) => {
    const [stateFlag, setStateFlag] = useState(0);
    const [directionFlag, setDirectionFlag] = useState(0);
    const [positionFlag, setPositionFlag] = useState(0);
    const [altitudeFlag, setAltitudeFlag] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 4) return trigger.intData[4];
        if (trigger?.intData?.length > 3) return trigger.intData[3];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => setIntParams([stateFlag, directionFlag, positionFlag, altitudeFlag, furniSource]);

    useEffect(() => {
        setStateFlag(trigger.getBoolean(0) ? 1 : 0);
        setDirectionFlag(trigger.getBoolean(1) ? 1 : 0);
        setPositionFlag(trigger.getBoolean(2) ? 1 : 0);
        setAltitudeFlag(trigger.intData.length > 4 && trigger.getBoolean(3) ? 1 : 0);

        if (trigger.intData.length > 4) setFurniSource(trigger.intData[4]);
        else if (trigger.intData.length > 3) setFurniSource(trigger.intData[3]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
    }, [trigger]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID;

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={requiresFurni}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={onChangeFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.conditions')}</Text>
                <div className="flex items-center gap-1">
                    <input
                        checked={!!stateFlag}
                        className="form-check-input"
                        id="stateFlag"
                        type="checkbox"
                        onChange={(event) => setStateFlag(event.target.checked ? 1 : 0)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.condition.state')}</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        checked={!!directionFlag}
                        className="form-check-input"
                        id="directionFlag"
                        type="checkbox"
                        onChange={(event) => setDirectionFlag(event.target.checked ? 1 : 0)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.condition.direction')}</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        checked={!!positionFlag}
                        className="form-check-input"
                        id="positionFlag"
                        type="checkbox"
                        onChange={(event) => setPositionFlag(event.target.checked ? 1 : 0)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.condition.position')}</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        checked={!!altitudeFlag}
                        className="form-check-input"
                        id="altitudeFlag"
                        type="checkbox"
                        onChange={(event) => setAltitudeFlag(event.target.checked ? 1 : 0)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.condition.altitude')}</Text>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
