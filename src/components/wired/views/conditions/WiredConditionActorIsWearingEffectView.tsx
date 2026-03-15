import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredConditionActorIsWearingEffectView: FC<{}> = props =>
{
    const [ effect, setEffect ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 1) return trigger.intData[1];
        return 0;
    });

    const save = () => setIntParams([ effect, userSource ]);

    useEffect(() =>
    {
        setEffect(trigger?.intData[0] ?? 0);
        if(trigger?.intData?.length > 1) setUserSource(trigger.intData[1]);
        else setUserSource(0);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.tooltip.effectid') }</Text>
                <NitroInput type="number" value={ effect } onChange={ event => setEffect(parseInt(event.target.value)) } />
            </div>
        </WiredConditionBaseView>
    );
};
