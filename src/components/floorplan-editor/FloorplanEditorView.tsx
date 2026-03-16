import { AddLinkEventTracker, FloorHeightMapEvent, ILinkEventTracker, RemoveLinkEventTracker, RoomEngineEvent, RoomVisualizationSettingsEvent, UpdateFloorPropertiesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../api';
import { Button, ButtonGroup, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useNitroEvent } from '../../hooks';
import { FloorplanEditorContextProvider } from './FloorplanEditorContext';
import { FloorplanEditor } from '@nitrots/nitro-renderer';
import { IFloorplanSettings } from '@nitrots/nitro-renderer';
import { IVisualizationSettings } from '@nitrots/nitro-renderer';
import { convertNumbersForSaving, convertSettingToNumber, FloorAction, HEIGHT_SCHEME } from '@nitrots/nitro-renderer';
import { FloorplanCanvasView } from './views/FloorplanCanvasView';
import { FloorplanImportExportView } from './views/FloorplanImportExportView';
import { FloorplanOptionsView } from './views/FloorplanOptionsView';
import { FloorplanHeightSelector } from './views/FloorplanHeightSelector';
import { FloorplanPreviewView } from './views/FloorplanPreviewView';

const MIN_WALL_HEIGHT = 0;
const MAX_WALL_HEIGHT = 16;

export const FloorplanEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ importExportVisible, setImportExportVisible ] = useState(false);
    const [ originalFloorplanSettings, setOriginalFloorplanSettings ] = useState<IFloorplanSettings>({
        tilemap: '',
        reservedTiles: [],
        entryPoint: [ 0, 0 ],
        entryPointDir: 2,
        wallHeight: -1,
        thicknessWall: 1,
        thicknessFloor: 1
    });
    const [ visualizationSettings, setVisualizationSettings ] = useState<IVisualizationSettings>({
        entryPointDir: 2,
        wallHeight: -1,
        thicknessWall: 1,
        thicknessFloor: 1
    });
    const [ floorHeight, setFloorHeight ] = useState(0);
    const [ floorAction, setFloorAction ] = useState(FloorAction.SET);
    const [ tilemapVersion, setTilemapVersion ] = useState(0);
    const [ areaInfo, setAreaInfo ] = useState({ total: 0, walkable: 0 });

    const calculateArea = useCallback(() =>
    {
        const tilemap = FloorplanEditor.instance.tilemap;

        if(!tilemap || tilemap.length === 0)
        {
            setAreaInfo({ total: 0, walkable: 0 });

            return;
        }

        let total = 0;
        let walkable = 0;

        for(let y = 0; y < tilemap.length; y++)
        {
            if(!tilemap[y]) continue;

            for(let x = 0; x < tilemap[y].length; x++)
            {
                if(!tilemap[y][x] || tilemap[y][x].height === 'x') continue;

                total++;

                if(!tilemap[y][x].isBlocked) walkable++;
            }
        }

        setAreaInfo({ total, walkable });
    }, []);

    // sync floorHeight/floorAction changes to the FloorplanEditor instance
    useEffect(() =>
    {
        FloorplanEditor.instance.actionSettings.currentAction = floorAction;
        FloorplanEditor.instance.actionSettings.currentHeight = floorHeight.toString(36);
    }, [ floorHeight, floorAction ]);

    // register onTilemapChange callback
    useEffect(() =>
    {
        if(!isVisible) return;

        FloorplanEditor.instance.onTilemapChange = () =>
        {
            setTilemapVersion(prev => prev + 1);
            calculateArea();
        };

        return () =>
        {
            FloorplanEditor.instance.onTilemapChange = null;
        };
    }, [ isVisible, calculateArea ]);

    const saveFloorChanges = () =>
    {
        SendMessageComposer(new UpdateFloorPropertiesMessageComposer(
            FloorplanEditor.instance.getCurrentTilemapString(),
            FloorplanEditor.instance.doorLocation.x,
            FloorplanEditor.instance.doorLocation.y,
            visualizationSettings.entryPointDir,
            convertNumbersForSaving(visualizationSettings.thicknessWall),
            convertNumbersForSaving(visualizationSettings.thicknessFloor),
            (visualizationSettings.wallHeight - 1)
        ));
    };

    const revertChanges = () =>
    {
        setVisualizationSettings({ wallHeight: originalFloorplanSettings.wallHeight, thicknessWall: originalFloorplanSettings.thicknessWall, thicknessFloor: originalFloorplanSettings.thicknessFloor, entryPointDir: originalFloorplanSettings.entryPointDir });

        FloorplanEditor.instance.doorLocation = { x: originalFloorplanSettings.entryPoint[0], y: originalFloorplanSettings.entryPoint[1] };
        FloorplanEditor.instance.setTilemap(originalFloorplanSettings.tilemap, originalFloorplanSettings.reservedTiles);
        FloorplanEditor.instance.renderTiles();
    };

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
    };

    const increaseWallHeight = () =>
    {
        let height = (visualizationSettings.wallHeight + 1);

        if(height > MAX_WALL_HEIGHT) height = MAX_WALL_HEIGHT;

        onWallHeightChange(height);
    };

    const decreaseWallHeight = () =>
    {
        let height = (visualizationSettings.wallHeight - 1);

        if(height <= 0) height = MIN_WALL_HEIGHT;

        onWallHeightChange(height);
    };

    useNitroEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED, event => setIsVisible(false));

    useMessageEvent<FloorHeightMapEvent>(FloorHeightMapEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.tilemap = parser.model;
            newValue.wallHeight = (parser.wallHeight + 1);

            return newValue;
        });

        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.wallHeight = (parser.wallHeight + 1);

            return newValue;
        });
    });

    useMessageEvent<RoomVisualizationSettingsEvent>(RoomVisualizationSettingsEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessFloor = convertSettingToNumber(parser.thicknessFloor);
            newValue.thicknessWall = convertSettingToNumber(parser.thicknessWall);

            return newValue;
        });

        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.thicknessFloor = convertSettingToNumber(parser.thicknessFloor);
            newValue.thicknessWall = convertSettingToNumber(parser.thicknessWall);

            return newValue;
        });
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'floor-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    return (
        <FloorplanEditorContextProvider value={ {
            originalFloorplanSettings,
            setOriginalFloorplanSettings,
            visualizationSettings,
            setVisualizationSettings,
            floorHeight,
            setFloorHeight,
            floorAction,
            setFloorAction,
            tilemapVersion,
            areaInfo
        } }>
            { isVisible &&
                <NitroCardView uniqueKey="floorpan-editor" className="w-[1100px] h-[600px]" theme="primary-slim">
                    <NitroCardHeaderView headerText={ LocalizeText('floor.plan.editor.title') } onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardContentView overflow="hidden" className="flex flex-col">
                        <FloorplanOptionsView />
                        <Flex gap={ 2 } className="flex-1 min-h-0">
                            <FloorplanHeightSelector />
                            <FloorplanCanvasView overflow="hidden" />
                            <Column gap={ 2 } className="w-[380px] min-w-[380px]">
                                <FloorplanPreviewView />
                                <Flex gap={ 1 } alignItems="center">
                                    <Text bold small>{ LocalizeText('floor.editor.wall.height') }</Text>
                                    <FaCaretLeft className="cursor-pointer fa-icon" onClick={ decreaseWallHeight } />
                                    <input type="number" className="form-control form-control-sm w-[49px]" value={ visualizationSettings.wallHeight } onChange={ event => onWallHeightChange(event.target.valueAsNumber) } />
                                    <FaCaretRight className="cursor-pointer fa-icon" onClick={ increaseWallHeight } />
                                </Flex>
                                <Text bold small className="text-center">
                                    Area: { areaInfo.total } ({ areaInfo.walkable } caselle)
                                </Text>
                            </Column>
                        </Flex>
                        <Flex justifyContent="between">
                            <Button variant="danger" onClick={ revertChanges }>{ LocalizeText('floor.plan.editor.reload') }</Button>
                            <ButtonGroup>
                                <Button onClick={ event => setImportExportVisible(true) }>{ LocalizeText('floor.plan.editor.import.export') }</Button>
                                <Button onClick={ saveFloorChanges }>{ LocalizeText('floor.plan.editor.save') }</Button>
                            </ButtonGroup>
                        </Flex>
                    </NitroCardContentView>
                </NitroCardView> }
            { importExportVisible &&
                <FloorplanImportExportView onCloseClick={ () => setImportExportVisible(false) } /> }
        </FloorplanEditorContextProvider>
    );
};
