import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionLeaveTeamView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 1) return trigger.intData[0];
        return 0;
    });

    useEffect(() =>
    {
        if(!trigger) return;
        if(trigger.intData.length >= 1) setUserSource(trigger.intData[0]);
        else setUserSource(0);
    }, [ trigger ]);

    const save = () => setIntParams([ userSource ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> } />
    );
};
