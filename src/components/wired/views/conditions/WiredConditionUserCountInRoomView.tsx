import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredConditionUserCountInRoomView: FC<{}> = props =>
{
    const [ min, setMin ] = useState(1);
    const [ max, setMax ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 2) return trigger.intData[2];
        return 0;
    });

    const save = () => setIntParams([ min, max, userSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setMin(trigger.intData[0]);
            setMax(trigger.intData[1]);
        }
        else
        {
            setMin(1);
            setMax(0);
        }
        if(trigger.intData.length > 2) setUserSource(trigger.intData[2]);
        else setUserSource(0);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.usercountmin', [ 'value' ], [ min.toString() ]) }</Text>
                <Slider
                    max={ 50 }
                    min={ 1 }
                    value={ min }
                    onChange={ event => setMin(event) } />
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.usercountmax', [ 'value' ], [ max.toString() ]) }</Text>
                <Slider
                    max={ 125 }
                    min={ 0 }
                    value={ max }
                    onChange={ event => setMax(event) } />
            </div>
        </WiredConditionBaseView>
    );
};
