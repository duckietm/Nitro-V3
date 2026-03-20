import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

const EFFECT_OPTIONS = [
    { value: 218, label: 'fx_218' },
    { value: 12, label: 'fx_12' },
    { value: 11, label: 'fx_11' },
    { value: 53, label: 'fx_53' },
    { value: 163, label: 'fx_163' }
];

export const WiredActionFreezeView: FC<{}> = () =>
{
    const [ effectId, setEffectId ] = useState(218);
    const [ cancelOnTeleport, setCancelOnTeleport ] = useState(false);
    const [ userSource, setUserSource ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([
        effectId,
        cancelOnTeleport ? 1 : 0,
        userSource
    ]);

    useEffect(() =>
    {
        setEffectId((trigger?.intData?.length > 0) ? trigger.intData[0] : 218);
        setCancelOnTeleport((trigger?.intData?.length > 1) ? (trigger.intData[1] === 1) : false);
        setUserSource((trigger?.intData?.length > 2) ? trigger.intData[2] : 0);
    }, [ trigger ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>Effect</Text>
                <select className="form-select form-select-sm" value={ effectId } onChange={ event => setEffectId(parseInt(event.target.value)) }>
                    { EFFECT_OPTIONS.map(option => <option key={ option.value } value={ option.value }>{ LocalizeText(option.label) }</option>) }
                </select>
            </div>
            <div className="flex items-center gap-1">
                <input checked={ cancelOnTeleport } className="form-check-input" id="freezeCancelOnTeleport" type="checkbox" onChange={ event => setCancelOnTeleport(event.target.checked) } />
                <Text>{ LocalizeText('wiredfurni.params.freeze.cancel_on_teleport') }</Text>
            </div>
        </WiredActionBaseView>
    );
};
