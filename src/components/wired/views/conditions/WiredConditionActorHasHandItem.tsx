import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

const ALLOWED_HAND_ITEM_IDS: number[] = [ 2, 5, 7, 8, 9, 10, 27 ];

export const WiredConditionActorHasHandItemView: FC<{}> = props =>
{
    const [ handItemId, setHandItemId ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 1) return trigger.intData[1];
        return 0;
    });

    const save = () => setIntParams([ handItemId, userSource ]);

    useEffect(() =>
    {
        setHandItemId((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        setUserSource((trigger.intData.length > 1) ? trigger.intData[1] : 0);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.handitem') }</Text>
                <select className="form-select form-select-sm" value={ handItemId } onChange={ event => setHandItemId(parseInt(event.target.value)) }>
                    { ALLOWED_HAND_ITEM_IDS.map(value =>
                    {
                        return <option key={ value } value={ value }>{ LocalizeText(`handitem${ value }`) }</option>;
                    }) }
                </select>
            </div>
        </WiredConditionBaseView>
    );
};
