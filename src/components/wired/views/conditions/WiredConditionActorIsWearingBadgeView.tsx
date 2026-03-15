import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredConditionActorIsWearingBadgeView: FC<{}> = props =>
{
    const [ badge, setBadge ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 1) return trigger.intData[0];
        return 0;
    });

    const save = () =>
    {
        setStringParam(badge);
        setIntParams([ userSource ]);
    };

    useEffect(() =>
    {
        setBadge(trigger.stringData);
        if(trigger.intData.length >= 1) setUserSource(trigger.intData[0]);
        else setUserSource(0);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.badgecode') }</Text>
                <NitroInput type="text" value={ badge } onChange={ event => setBadge(event.target.value) } />
            </div>
        </WiredConditionBaseView>
    );
};
