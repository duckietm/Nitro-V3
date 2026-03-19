import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggerToggleFurniView: FC<{}> = () =>
{
    const [ triggerMode, setTriggerMode ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ triggerMode ]);

    useEffect(() =>
    {
        setTriggerMode((trigger?.intData?.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } save={ save }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.condition.state') }</Text>
                <div className="flex items-center gap-1">
                    <input checked={ (triggerMode === 1) } className="form-check-input" id="stateTrigger1" name="stateTrigger" type="radio" onChange={ () => setTriggerMode(1) } />
                    <Text>{ LocalizeText('wiredfurni.params.state_trigger.1') }</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input checked={ (triggerMode === 0) } className="form-check-input" id="stateTrigger0" name="stateTrigger" type="radio" onChange={ () => setTriggerMode(0) } />
                    <Text>{ LocalizeText('wiredfurni.params.state_trigger.0') }</Text>
                </div>
            </div>
        </WiredTriggerBaseView>
    );
};
