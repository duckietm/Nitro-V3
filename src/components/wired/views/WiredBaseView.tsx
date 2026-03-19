import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../api';
import { Button, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../common';
import { useWired } from '../../../hooks';
import { WiredFurniSelectorView } from './WiredFurniSelectorView';

export interface WiredBaseViewProps
{
    wiredType: string;
    requiresFurni: number;
    hasSpecialInput: boolean;
    save: () => void;
    validate?: () => boolean;
    cardStyle?: CSSProperties;
    footer?: ReactNode;
}

export const WiredBaseView: FC<PropsWithChildren<WiredBaseViewProps>> = props =>
{
    const { wiredType = '', requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, validate = null, children = null, hasSpecialInput = false, cardStyle = undefined, footer = null } = props;
    const [ wiredName, setWiredName ] = useState<string>(null);
    const [ wiredDescription, setWiredDescription ] = useState<string>(null);
    const [ needsSave, setNeedsSave ] = useState<boolean>(false);
    const { trigger = null, setTrigger = null, setIntParams = null, setStringParam = null, setFurniIds = null, setAllowsFurni = null, saveWired = null } = useWired();

    const onClose = () =>
    {
        WiredSelectionVisualizer.clearAllSelectionShaders();
        setTrigger(null);
    };

    const onSave = () =>
    {
        if(validate && !validate()) return;

        if(save) save();

        setNeedsSave(true);
    };

    useEffect(() =>
    {
        if(!needsSave) return;

        saveWired();

        setNeedsSave(false);
    }, [ needsSave, saveWired ]);

    useEffect(() =>
    {
        if(!trigger) return;

        WiredSelectionVisualizer.clearAllSelectionShaders();

        const spriteId = (trigger.spriteId || -1);
        const furniData = GetSessionDataManager().getFloorItemData(spriteId);

        if(!furniData)
        {
            setWiredName(('NAME: ' + spriteId));
            setWiredDescription(('NAME: ' + spriteId));
        }
        else
        {
            setWiredName(furniData.name);
            setWiredDescription(furniData.description);
        }

        if(hasSpecialInput)
        {
            setIntParams(trigger.intData);
            setStringParam(trigger.stringData);
        }

        if(requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE)
        {
            setFurniIds(prevValue =>
            {
                if(prevValue && prevValue.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prevValue);

                if(trigger.selectedItems && trigger.selectedItems.length)
                {
                    WiredSelectionVisualizer.applySelectionShaderToFurni(trigger.selectedItems);

                    return trigger.selectedItems;
                }

                return [];
            });
        }
    }, [ trigger, hasSpecialInput, setIntParams, setStringParam, setFurniIds ]);

    useEffect(() =>
    {
        if(!trigger) return;

        setAllowsFurni(requiresFurni);
    }, [ trigger, requiresFurni, setAllowsFurni ]);

    return (
        <NitroCardView className="nitro-wired" theme="primary-slim" uniqueKey="nitro-wired" style={ cardStyle }>
            <NitroCardHeaderView headerText={ LocalizeText('wiredfurni.title') } onCloseClick={ onClose } />
            <NitroCardContentView>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <i className={ `icon icon-wired-${ wiredType }` } />
                        <Text bold>{ wiredName }</Text>
                    </div>
                    <Text small>{ wiredDescription }</Text>
                </div>
                { !!children && <hr className="m-0 bg-dark" /> }
                { children }
                { (requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE) &&
                    <>
                        <hr className="m-0 bg-dark" />
                        <WiredFurniSelectorView />
                    </> }
                { footer &&
                    <>
                        <hr className="m-0 bg-dark" />
                        { footer }
                    </> }
                <div className="flex items-center gap-1">
                    <Button fullWidth variant="success" onClick={ onSave }>{ LocalizeText('wiredfurni.ready') }</Button>
                    <Button fullWidth variant="secondary" onClick={ onClose }>{ LocalizeText('cancel') }</Button>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
