import { FC, useEffect, useState } from 'react';
import { WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredConditionActorIsOnFurniView: FC<{}> = props =>
{
    const { trigger = null, furniIds = [], setFurniIds = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 0) return trigger.intData[0];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 1) return trigger.intData[1];
        return 0;
    });

    useEffect(() =>
    {
        if(!trigger) return;

        if(trigger.intData.length > 0) setFurniSource(trigger.intData[0]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);

        if(trigger.intData.length > 1) setUserSource(trigger.intData[1]);
        else setUserSource(0);
    }, [ trigger ]);

    const onChangeFurniSource = (next: number) =>
    {
        if(furniIds.length && setFurniIds)
        {
            setFurniIds(prev =>
            {
                if(prev && prev.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prev);
                return [];
            });
        }

        setFurniSource(next);
    };

    const save = () => setIntParams([ furniSource, userSource ]);

    const requiresFurni = (furniSource === 100)
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ requiresFurni }
            save={ save }
            footer={ (
                <WiredSourcesSelector
                    showFurni={ true }
                    showUsers={ true }
                    furniSource={ furniSource }
                    userSource={ userSource }
                    onChangeFurni={ onChangeFurniSource }
                    onChangeUsers={ setUserSource } />
            ) } />
    );
};
