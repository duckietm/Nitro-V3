import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue, LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionChatView: FC<{}> = props =>
{
    const [ message, setMessage ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 1) return trigger.intData[0];
        return 0;
    });

    const save = () =>
    {
        setStringParam(message);
        setIntParams([ userSource ]);
    };

    useEffect(() =>
    {
        setMessage(trigger.stringData);
        if(trigger.intData.length >= 1) setUserSource(trigger.intData[0]);
        else setUserSource(0);
    }, [ trigger ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.message') }</Text>
                <NitroInput maxLength={ GetConfigurationValue<number>('wired.action.chat.max.length', 100) } type="text" value={ message } onChange={ event => setMessage(event.target.value) } />
            </div>
        </WiredActionBaseView>
    );
};
