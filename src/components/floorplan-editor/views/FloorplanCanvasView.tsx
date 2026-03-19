import { GetOccupiedTilesMessageComposer, GetRoomEntryTileMessageComposer, RoomEntryTileMessageEvent, RoomOccupiedTilesMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { SendMessageComposer } from '../../../api';
import { Base, Column, ColumnProps } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';
import { FloorplanEditor } from '@nitrots/nitro-renderer';

interface FloorplanCanvasViewProps extends ColumnProps
{
}

export const FloorplanCanvasView: FC<FloorplanCanvasViewProps> = props =>
{
    const { gap = 1, children = null, ...rest } = props;
    const [ occupiedTilesReceived, setOccupiedTilesReceived ] = useState(false);
    const [ entryTileReceived, setEntryTileReceived ] = useState(false);
    const [ zoomLevel, setZoomLevel ] = useState(1.0);
    const { originalFloorplanSettings = null, setOriginalFloorplanSettings = null, setVisualizationSettings = null } = useFloorplanEditorContext();
    const elementRef = useRef<HTMLDivElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);

    useMessageEvent<RoomOccupiedTilesMessageEvent>(RoomOccupiedTilesMessageEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.reservedTiles = parser.blockedTilesMap;

            FloorplanEditor.instance.setTilemap(newValue.tilemap, newValue.reservedTiles);

            return newValue;
        });

        setOccupiedTilesReceived(true);

        elementRef.current.scrollTo((FloorplanEditor.instance.renderer.canvas.width / 3), 0);
    });

    useMessageEvent<RoomEntryTileMessageEvent>(RoomEntryTileMessageEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.entryPoint = [ parser.x, parser.y ];
            newValue.entryPointDir = parser.direction;

            return newValue;
        });

        setVisualizationSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.entryPointDir = parser.direction;

            return newValue;
        });

        FloorplanEditor.instance.doorLocation = { x: parser.x, y: parser.y };

        setEntryTileReceived(true);
    });

    const onPointerEvent = (event: PointerEvent) =>
    {
        event.preventDefault();

        switch(event.type)
        {
            case 'pointerout':
            case 'pointerup':
                FloorplanEditor.instance.onPointerRelease(event);
                break;
            case 'pointerdown':
                FloorplanEditor.instance.onPointerDown(event);
                break;
            case 'pointermove':
                FloorplanEditor.instance.onPointerMove(event);
                break;
        }
    };

    const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.0));
    const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    useEffect(() =>
    {
        return () =>
        {
            FloorplanEditor.instance.clear();

            setVisualizationSettings(prevValue =>
            {
                return {
                    wallHeight: originalFloorplanSettings.wallHeight,
                    thicknessWall: originalFloorplanSettings.thicknessWall,
                    thicknessFloor: originalFloorplanSettings.thicknessFloor,
                    entryPointDir: prevValue.entryPointDir
                };
            });
        };
    }, [ originalFloorplanSettings.thicknessFloor, originalFloorplanSettings.thicknessWall, originalFloorplanSettings.wallHeight, setVisualizationSettings ]);

    useEffect(() =>
    {
        if(!entryTileReceived || !occupiedTilesReceived) return;

        FloorplanEditor.instance.renderTiles();
    }, [ entryTileReceived, occupiedTilesReceived ]);

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomEntryTileMessageComposer());
        SendMessageComposer(new GetOccupiedTilesMessageComposer());

        const currentElement = elementRef.current;

        if(!currentElement) return;

        const wrapper = canvasWrapperRef.current;

        if(wrapper) wrapper.appendChild(FloorplanEditor.instance.renderer.canvas);

        currentElement.addEventListener('pointerup', onPointerEvent);
        currentElement.addEventListener('pointerout', onPointerEvent);
        currentElement.addEventListener('pointerdown', onPointerEvent);
        currentElement.addEventListener('pointermove', onPointerEvent);

        return () =>
        {
            if(currentElement)
            {
                currentElement.removeEventListener('pointerup', onPointerEvent);
                currentElement.removeEventListener('pointerout', onPointerEvent);
                currentElement.removeEventListener('pointerdown', onPointerEvent);
                currentElement.removeEventListener('pointermove', onPointerEvent);
            }
        };
    }, []);

    return (
        <Column gap={ gap } { ...rest } className="relative flex-1">
            <Base overflow="auto" innerRef={ elementRef } className="flex-1">
                <div
                    ref={ canvasWrapperRef }
                    style={ {
                        transform: `scale(${ zoomLevel })`,
                        transformOrigin: '0 0'
                    } }
                />
            </Base>
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                <button
                    className="w-[28px] h-[28px] flex items-center justify-center rounded bg-[#1e7295] text-white border border-transparent shadow cursor-pointer hover:brightness-110"
                    onClick={ zoomIn }
                    title="Zoom in"
                >
                    <FaPlus size={ 10 } />
                </button>
                <button
                    className="w-[28px] h-[28px] flex items-center justify-center rounded bg-[#1e7295] text-white border border-transparent shadow cursor-pointer hover:brightness-110"
                    onClick={ zoomOut }
                    title="Zoom out"
                >
                    <FaMinus size={ 10 } />
                </button>
            </div>
            { children }
        </Column>
    );
};
