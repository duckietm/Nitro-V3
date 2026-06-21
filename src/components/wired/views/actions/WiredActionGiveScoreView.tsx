import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionGiveScoreView: FC<{}> = (props) => {
    const [points, setPoints] = useState(1);
    const [operation, setOperation] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [userSource, setUserSource] = useState<number>(() => {
        if (trigger?.intData?.length > 2) return trigger.intData[2];
        return 0;
    });

    const save = () => setIntParams([points, operation, userSource]);

    useEffect(() => {
        if (trigger.intData.length >= 2) {
            setPoints(trigger.intData[0]);
            setOperation(trigger.intData[1]);
        } else {
            setPoints(1);
            setOperation(0);
        }

        setUserSource(trigger.intData.length > 2 ? trigger.intData[2] : 0);
    }, [trigger]);

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE}
            save={save}
            footer={<WiredSourcesSelector showUsers={true} userSource={userSource} onChangeUsers={setUserSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.setpoints', ['points'], [points.toString()])}</Text>
                <Slider max={100} min={1} value={points} onChange={(event) => setPoints(event)} />
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.choose_type')}</Text>
                {[0, 1].map((value) => (
                    <label key={value} className="flex items-center gap-1">
                        <input
                            checked={operation === value}
                            className="form-check-input"
                            name="pointsOperation"
                            type="radio"
                            onChange={() => setOperation(value)}
                        />
                        <Text>{LocalizeText(`wiredfurni.params.points_operation.${value}`)}</Text>
                    </label>
                ))}
            </div>
        </WiredActionBaseView>
    );
};
