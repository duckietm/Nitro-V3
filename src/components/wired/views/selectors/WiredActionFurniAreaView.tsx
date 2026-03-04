import { GetRoomEngine, RoomAreaSelectionManager } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from '../actions/WiredActionBaseView';

export const WiredActionFurniAreaView: FC<{}> = props =>
{
    const [ rootX, setRootX ] = useState(0);
    const [ rootY, setRootY ] = useState(0);
    const [ areaWidth, setAreaWidth ] = useState(0);
    const [ areaHeight, setAreaHeight ] = useState(0);
    const { trigger = null, setIntParams } = useWired();

    const save = useCallback(() =>
    {
        setIntParams([ rootX, rootY, areaWidth, areaHeight ]);
    }, [ rootX, rootY, areaWidth, areaHeight, setIntParams ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const callback = (x: number, y: number, w: number, h: number) =>
        {
            setRootX(x);
            setRootY(y);
            setAreaWidth(w);
            setAreaHeight(h);
        };

        const activated = GetRoomEngine().areaSelectionManager.activate(callback, RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN);

        if(activated)
        {
            if(trigger.intData.length >= 4 && trigger.intData[2] > 0 && trigger.intData[3] > 0)
            {
                GetRoomEngine().areaSelectionManager.setHighlight(
                    trigger.intData[0],
                    trigger.intData[1],
                    trigger.intData[2],
                    trigger.intData[3]
                );
            }
        }

        return () =>
        {
            GetRoomEngine().areaSelectionManager.deactivate();
        };
    }, [ trigger ]);

    useEffect(() =>
    {
        if(!trigger) return;

        if(trigger.intData.length >= 4)
        {
            setRootX(trigger.intData[0]);
            setRootY(trigger.intData[1]);
            setAreaWidth(trigger.intData[2]);
            setAreaHeight(trigger.intData[3]);
        }
        else
        {
            setRootX(0);
            setRootY(0);
            setAreaWidth(0);
            setAreaHeight(0);
        }
    }, [ trigger ]);

    const hasArea = areaWidth > 0 && areaHeight > 0;

    return (
        <WiredActionBaseView hasSpecialInput={ true } requiresFurni={ 0 } save={ save } cardStyle={ { width: '385px', height: '365px' } }>
            <div className="flex flex-col gap-2">
                <Text bold>{ LocalizeText('wiredfurni.params.area_selection') }</Text>
                <Text small>{ LocalizeText('wiredfurni.params.area_selection.info') }</Text>

                { hasArea &&
                    <Text small>
                        { LocalizeText('wiredfurni.params.area_selection.selected', [ 'x', 'y', 'w', 'h' ], [ rootX.toString(), rootY.toString(), areaWidth.toString(), areaHeight.toString() ]) }
                    </Text> }

                <div className="flex gap-1">
                    <Button fullWidth variant="primary" onClick={ () => GetRoomEngine().areaSelectionManager.startSelecting() }>
                        { LocalizeText('wiredfurni.params.area_selection.select') }
                    </Button>
                    <Button fullWidth variant="secondary" onClick={ () => GetRoomEngine().areaSelectionManager.clearHighlight() }>
                        { LocalizeText('wiredfurni.params.area_selection.clear') }
                    </Button>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
