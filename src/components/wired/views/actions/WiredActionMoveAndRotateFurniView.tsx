import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

const directionOptions: { value: number, icon: string }[] = [
    {
        value: 0,
        icon: 'ne'
    },
    {
        value: 2,
        icon: 'se'
    },
    {
        value: 4,
        icon: 'sw'
    },
    {
        value: 6,
        icon: 'nw'
    }
];

const rotationOptions: number[] = [ 0, 1, 2, 3, 4, 5, 6 ];

export const WiredActionMoveAndRotateFurniView: FC<{}> = props =>
{
    const [ movement, setMovement ] = useState(-1);
    const [ rotation, setRotation ] = useState(-1);
    const { trigger = null, furniIds = [], setFurniIds = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 2) return trigger.intData[2];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => setIntParams([ movement, rotation, furniSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setMovement(trigger.intData[0]);
            setRotation(trigger.intData[1]);
        }
        else
        {
            setMovement(-1);
            setRotation(-1);
        }

        if(trigger.intData.length > 2) setFurniSource(trigger.intData[2]);
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
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ requiresFurni }
            save={ save }
            footer={ <WiredSourcesSelector showFurni={ true } furniSource={ furniSource } onChangeFurni={ onChangeFurniSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.startdir') }</Text>
                <div className="flex gap-1">
                    { directionOptions.map(option =>
                    {
                        return (
                            <div key={ option.value } className="flex items-center gap-1">
                                <input checked={ (movement === option.value) } className="form-check-input" id={ `movement${ option.value }` } name="movement" type="radio" onChange={ event => setMovement(option.value) } />
                                <Text>
                                    <i className={ `icon icon-${ option.icon }` } />
                                </Text>
                            </div>
                        );
                    }) }
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.turn') }</Text>
                { rotationOptions.map(option =>
                {
                    return (
                        <div key={ option } className="flex items-center gap-1">
                            <input checked={ (rotation === option) } className="form-check-input" id={ `rotation${ option }` } name="rotation" type="radio" onChange={ event => setRotation(option) } />
                            <Text>{ LocalizeText(`wiredfurni.params.turn.${ option }`) }</Text>
                        </div>
                    );
                }) }
            </div>
        </WiredActionBaseView>
    );
};
