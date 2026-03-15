import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionGiveScoreView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ time, setTime ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 2) return trigger.intData[2];
        return 0;
    });

    const save = () => setIntParams([ points, time, userSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setPoints(trigger.intData[0]);
            setTime(trigger.intData[1]);
        }
        else
        {
            setPoints(1);
            setTime(1);
        }

        setUserSource((trigger.intData.length > 2) ? trigger.intData[2] : 0);
    }, [ trigger ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.setpoints', [ 'points' ], [ points.toString() ]) }</Text>
                <Slider
                    max={ 100 }
                    min={ 1 }
                    value={ points }
                    onChange={ event => setPoints(event) } />
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.settimesingame', [ 'times' ], [ time.toString() ]) }</Text>
                <Slider
                    max={ 10 }
                    min={ 1 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </div>
        </WiredActionBaseView>
    );
};
