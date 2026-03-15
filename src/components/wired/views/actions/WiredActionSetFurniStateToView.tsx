import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionSetFurniStateToView: FC<{}> = props =>
{
    const [ stateFlag, setStateFlag ] = useState(0);
    const [ directionFlag, setDirectionFlag ] = useState(0);
    const [ positionFlag, setPositionFlag ] = useState(0);
    const { trigger = null, furniIds = [], setFurniIds = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 3) return trigger.intData[3];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => setIntParams([ stateFlag, directionFlag, positionFlag, furniSource ]);

    useEffect(() =>
    {
        setStateFlag(trigger.getBoolean(0) ? 1 : 0);
        setDirectionFlag(trigger.getBoolean(1) ? 1 : 0);
        setPositionFlag(trigger.getBoolean(2) ? 1 : 0);

        if(trigger.intData.length > 3) setFurniSource(trigger.intData[3]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
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

    const requiresFurni = (furniSource === 100)
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ requiresFurni }
            save={ save }
            footer={ <WiredSourcesSelector showFurni={ true } furniSource={ furniSource } onChangeFurni={ onChangeFurniSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.conditions') }</Text>
                <div className="flex items-center gap-1">
                    <input checked={ !!stateFlag } className="form-check-input" id="stateFlag" type="checkbox" onChange={ event => setStateFlag(event.target.checked ? 1 : 0) } />
                    <Text>{ LocalizeText('wiredfurni.params.condition.state') }</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input checked={ !!directionFlag } className="form-check-input" id="directionFlag" type="checkbox" onChange={ event => setDirectionFlag(event.target.checked ? 1 : 0) } />
                    <Text>{ LocalizeText('wiredfurni.params.condition.direction') }</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input checked={ !!positionFlag } className="form-check-input" id="positionFlag" type="checkbox" onChange={ event => setPositionFlag(event.target.checked ? 1 : 0) } />
                    <Text>{ LocalizeText('wiredfurni.params.condition.position') }</Text>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
