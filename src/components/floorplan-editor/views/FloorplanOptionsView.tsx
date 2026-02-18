import { FC, useState } from 'react';
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp, FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import ReactSlider from 'react-slider';
import { LocalizeText } from '../../../api';
import { Button, Column, Flex, LayoutGridItem, Text } from '../../../common';
import { COLORMAP, FloorAction } from '@nitrots/nitro-renderer';
import { FloorplanEditor } from '@nitrots/nitro-renderer';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

const MIN_WALL_HEIGHT: number = 0;
const MAX_WALL_HEIGHT: number = 16;

const MIN_FLOOR_HEIGHT: number = 0;
const MAX_FLOOR_HEIGHT: number = 26;

type ScrollDirection = 'up' | 'down' | 'left' | 'right';

interface FloorplanOptionsViewProps
{
    onCanvasScroll?(direction: ScrollDirection): void;
}

export const FloorplanOptionsView: FC<FloorplanOptionsViewProps> = props =>
{
    const { onCanvasScroll = () => {} } = props;
    const { visualizationSettings = null, setVisualizationSettings = null } = useFloorplanEditorContext();
    const [ floorAction, setFloorAction ] = useState(FloorAction.SET);
    const [ floorHeight, setFloorHeight ] = useState(0);
    const [ isSquareSelectMode, setSquareSelectMode ] = useState(false);
    
    const selectAction = (action: number) =>
    {
        setFloorAction(action);

        FloorplanEditor.instance.actionSettings.currentAction = action;
    }

    const toggleSquareSelectMode = () =>
    {
        const nextValue = FloorplanEditor.instance.toggleSquareSelectMode();

        setSquareSelectMode(nextValue);
    }

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
    }

    const onFloorHeightChange = (value: number) =>
    {
        if(isNaN(value) || (value <= 0)) value = 0;

        if(value > 26) value = 26;

        setFloorHeight(value);

        FloorplanEditor.instance.actionSettings.currentHeight = value.toString(36);
    }

    const onFloorThicknessChange = (value: number) =>
    {
        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessFloor = value;

            return newValue;
        });
    }

    const onWallThicknessChange = (value: number) =>
    {
        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessWall = value;
    
            return newValue;
        });
    }

    const onWallHeightChange = (value: number) =>
    {
        if(isNaN(value) || (value <= 0)) value = MIN_WALL_HEIGHT;

        if(value > MAX_WALL_HEIGHT) value = MAX_WALL_HEIGHT;

        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.wallHeight = value;

            return newValue;
        });
    }

    const increaseWallHeight = () =>
    {
        let height = (visualizationSettings.wallHeight + 1);

        if(height > MAX_WALL_HEIGHT) height = MAX_WALL_HEIGHT;

        onWallHeightChange(height);
    }

    const decreaseWallHeight = () =>
    {
        let height = (visualizationSettings.wallHeight - 1);

        if(height <= 0) height = MIN_WALL_HEIGHT;

        onWallHeightChange(height);
    }

    return (
        <Column>
            <Flex gap={ 1 }>
                <Column size={ 5 } gap={ 1 }>
                    <Text bold>{ LocalizeText('floor.plan.editor.draw.mode') }</Text>
                    <Flex gap={ 3 }>
                        <Flex gap={ 1 }>
                            <LayoutGridItem itemActive={ (floorAction === FloorAction.SET) } onClick={ event => selectAction(FloorAction.SET) }>
                                <i className="nitro-icon icon-set-tile" />
                            </LayoutGridItem>
                            <LayoutGridItem itemActive={ (floorAction === FloorAction.UNSET) } onClick={ event => selectAction(FloorAction.UNSET) }>
                                <i className="nitro-icon icon-unset-tile" />
                            </LayoutGridItem>
                        </Flex>
                        <Flex gap={ 1 }>
                            <LayoutGridItem itemActive={ (floorAction === FloorAction.UP) } onClick={ event => selectAction(FloorAction.UP) }>
                                <i className="nitro-icon icon-increase-height" />
                            </LayoutGridItem>
                            <LayoutGridItem itemActive={ (floorAction === FloorAction.DOWN) } onClick={ event => selectAction(FloorAction.DOWN) }>
                                <i className="nitro-icon icon-decrease-height" />
                            </LayoutGridItem>
                        </Flex>
                        <LayoutGridItem itemActive={ (floorAction === FloorAction.DOOR) } onClick={ event => selectAction(FloorAction.DOOR) }>
                            <i className="nitro-icon icon-set-door" />
                        </LayoutGridItem>
                        <LayoutGridItem onClick={ event => FloorplanEditor.instance.toggleSelectAll() }>
                            <i className={ `nitro-icon ${ floorAction === FloorAction.UNSET ? 'icon-set-deselect' : 'icon-set-select' }` } />
                        </LayoutGridItem>
                        <LayoutGridItem itemActive={ isSquareSelectMode } onClick={ toggleSquareSelectMode }>
                            <i className={ `nitro-icon ${ isSquareSelectMode ? 'icon-set-active-squaresselect' : 'icon-set-squaresselect' }` } />
                        </LayoutGridItem>
                    </Flex>
                </Column>
                <Column alignItems="center" size={ 4 }>
                    <Text bold>{ LocalizeText('floor.plan.editor.enter.direction') }</Text>
                    <i className={ `nitro-icon icon-door-direction-${ visualizationSettings.entryPointDir } cursor-pointer` } onClick={ changeDoorDirection } />
                </Column>
                <Column size={ 3 }>
                    <Text bold>{ LocalizeText('floor.editor.wall.height') }</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <FaCaretLeft className="cursor-pointer fa-icon" onClick={ decreaseWallHeight } />
                        <input type="number" className="form-control form-control-sm quantity-input" value={ visualizationSettings.wallHeight } onChange={ event => onWallHeightChange(event.target.valueAsNumber) } />
                        <FaCaretRight className="cursor-pointer fa-icon" onClick={ increaseWallHeight } />
                    </Flex>
                </Column>
                <Column size={ 6 }>
                    <Text bold>{ LocalizeText('floor.plan.editor.room.options') }</Text>
                    <Flex className="align-items-center">
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
                </Column>
            </Flex>
            <Flex gap={ 2 } alignItems="center" justifyContent="between">
                <Column size={ 6 }>
                    <Text bold>{ LocalizeText('floor.plan.editor.tile.height') }: { floorHeight }</Text>
                    <div style={ { width: '100%', maxWidth: 240 } }>
                        <ReactSlider
                            className="nitro-slider"
                            min={ MIN_FLOOR_HEIGHT }
                            max={ MAX_FLOOR_HEIGHT }
                            step={ 1 }
                            value={ floorHeight }
                            onChange={ event => onFloorHeightChange(event) }
                            renderThumb={ (props, state) =>
                            {
                                const { key, style, ...rest } = (props as Record<string, any>);

                                return <div key={ key } style={ { backgroundColor: `#${ COLORMAP[state.valueNow.toString(33)] }`, ...style } } { ...rest }>{ state.valueNow }</div>;
                            } } />
                    </div>
                </Column>
                <Column gap={ 1 }>
                    <Flex justifyContent="center">
                        <Button shrink onClick={ event => onCanvasScroll('up') }>
                            <FaArrowUp className="fa-icon" />
                        </Button>
                    </Flex>
                    <Flex alignItems="center" justifyContent="center" gap={ 1 }>
                        <Button shrink onClick={ event => onCanvasScroll('left') }>
                            <FaArrowLeft className="fa-icon" />
                        </Button>
                        <div style={ { width: 28 } } />
                        <Button shrink onClick={ event => onCanvasScroll('right') }>
                            <FaArrowRight className="fa-icon" />
                        </Button>
                    </Flex>
                    <Flex justifyContent="center">
                        <Button shrink onClick={ event => onCanvasScroll('down') }>
                            <FaArrowDown className="fa-icon" />
                        </Button>
                    </Flex>
                </Column>
            </Flex>
        </Column>
    );
}