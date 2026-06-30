import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionQuickBopperView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ playOrStop, setPlayOrStop ] = useState<number>(1);
    const [ trackIndex, setTrackIndex ] = useState<number>(0);

    useEffect(() =>
    {
        if(!trigger) return;

        setPlayOrStop((trigger.intData?.length ?? 0) > 0 ? trigger.intData[0] : 1);
        setTrackIndex((trigger.intData?.length ?? 0) > 1 ? trigger.intData[1] : 0);
    }, [ trigger ]);

    const save = () => setIntParams([ playOrStop, trackIndex ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }>
            <div className="flex flex-col gap-1">
                <Text bold>Music action</Text>
                <select
                    className="form-select form-select-sm"
                    value={ playOrStop }
                    onChange={ event => setPlayOrStop(parseInt(event.target.value, 10) || 0) }>
                    <option value={ 1 }>Play</option>
                    <option value={ 0 }>Stop</option>
                </select>
            </div>
            { playOrStop === 1 &&
                <div className="flex flex-col gap-1">
                    <Text bold>Track number</Text>
                    <Text small>Playlist position to start from (0 = first track)</Text>
                    <input
                        className="form-control form-control-sm"
                        type="number"
                        min={ 0 }
                        value={ trackIndex }
                        onChange={ event => setTrackIndex(Math.max(0, parseInt(event.target.value, 10) || 0)) } />
                </div> }
        </WiredActionBaseView>
    );
};
