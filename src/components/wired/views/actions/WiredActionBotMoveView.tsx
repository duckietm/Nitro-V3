import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { NitroInput } from '../../../../layout';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionBotMoveView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const { trigger = null, furniIds = [], setFurniIds = null, setStringParam = null, setIntParams = null } = useWired();

    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length >= 1) return trigger.intData[0];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ furniSource ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setBotName(trigger.stringData);

        if(trigger.intData.length >= 1) setFurniSource(trigger.intData[0]);
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
                <Text bold>{ LocalizeText('wiredfurni.params.bot.name') }</Text>
                <NitroInput maxLength={ 32 } type="text" value={ botName } onChange={ event => setBotName(event.target.value) } />
            </div>
        </WiredActionBaseView>
    );
};
