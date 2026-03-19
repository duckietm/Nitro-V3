import { FC } from 'react';
import { LocalizeText } from '../../../api';
import { Flex, LayoutGridItem, Text } from '../../../common';
import { FloorAction } from '@nitrots/nitro-renderer';
import { FloorplanEditor } from '@nitrots/nitro-renderer';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

interface FloorplanOptionsViewProps
{
}

export const FloorplanOptionsView: FC<FloorplanOptionsViewProps> = props =>
{
    const { visualizationSettings = null, setVisualizationSettings = null, floorAction, setFloorAction } = useFloorplanEditorContext();
    const isSquareSelectMode = FloorplanEditor.instance.isSquareSelectMode;

    const selectAction = (action: number) =>
    {
        setFloorAction(action);

        FloorplanEditor.instance.actionSettings.currentAction = action;
    };

    const toggleSquareSelectMode = () =>
    {
        FloorplanEditor.instance.toggleSquareSelectMode();
        // force re-render by toggling action to same value
        setFloorAction(prev => prev);
    };

    const changeDoorDirection = () =>
    {
        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            if(newValue.entryPointDir < 7)
            {
                ++newValue.entryPointDir;
            }
            else
            {
                newValue.entryPointDir = 0;
            }

            return newValue;
        });
    };

    const onWallThicknessChange = (value: number) =>
    {
        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessWall = value;

            return newValue;
        });
    };

    const onFloorThicknessChange = (value: number) =>
    {
        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessFloor = value;

            return newValue;
        });
    };

    return (
        <Flex gap={ 2 } alignItems="center">
            <Flex gap={ 1 } alignItems="center">
                <Text bold small>{ LocalizeText('floor.plan.editor.draw.mode') }</Text>
                <Flex gap={ 1 }>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.SET) } onClick={ () => selectAction(FloorAction.SET) }>
                        <i className="nitro-icon icon-set-tile" />
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.UNSET) } onClick={ () => selectAction(FloorAction.UNSET) }>
                        <i className="nitro-icon icon-unset-tile" />
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.UP) } onClick={ () => selectAction(FloorAction.UP) }>
                        <i className="nitro-icon icon-increase-height" />
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.DOWN) } onClick={ () => selectAction(FloorAction.DOWN) }>
                        <i className="nitro-icon icon-decrease-height" />
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.DOOR) } onClick={ () => selectAction(FloorAction.DOOR) }>
                        <i className="nitro-icon icon-set-door" />
                    </LayoutGridItem>
                    <LayoutGridItem onClick={ () => FloorplanEditor.instance.toggleSelectAll() }>
                        <i className={ `nitro-icon ${ floorAction === FloorAction.UNSET ? 'icon-set-deselect' : 'icon-set-select' }` } />
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ isSquareSelectMode } onClick={ toggleSquareSelectMode }>
                        <i className={ `nitro-icon ${ isSquareSelectMode ? 'icon-set-active-squaresselect' : 'icon-set-squaresselect' }` } />
                    </LayoutGridItem>
                </Flex>
            </Flex>
            <Flex gap={ 1 } alignItems="center">
                <Text bold small>{ LocalizeText('floor.plan.editor.enter.direction') }</Text>
                <i className={ `nitro-icon icon-door-direction-${ visualizationSettings.entryPointDir } cursor-pointer` } onClick={ changeDoorDirection } />
            </Flex>
            <Flex gap={ 1 } alignItems="center" className="ml-auto">
                <select className="form-control form-control-sm" value={ visualizationSettings.thicknessWall } onChange={ event => onWallThicknessChange(parseInt(event.target.value)) }>
                    <option value={ 0 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</option>
                    <option value={ 1 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</option>
                    <option value={ 2 }>{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</option>
                    <option value={ 3 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</option>
                </select>
                <select className="form-control form-control-sm" value={ visualizationSettings.thicknessFloor } onChange={ event => onFloorThicknessChange(parseInt(event.target.value)) }>
                    <option value={ 0 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</option>
                    <option value={ 1 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</option>
                    <option value={ 2 }>{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</option>
                    <option value={ 3 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</option>
                </select>
            </Flex>
        </Flex>
    );
};
