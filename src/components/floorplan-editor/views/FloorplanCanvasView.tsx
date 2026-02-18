import { GetOccupiedTilesMessageComposer, GetRoomEntryTileMessageComposer, RoomEntryTileMessageEvent, RoomOccupiedTilesMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { SendMessageComposer } from '../../../api';
import { Base, Column, ColumnProps } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';
import { FloorplanEditor } from '@nitrots/nitro-renderer';

type ScrollDirection = 'up' | 'down' | 'left' | 'right';

interface FloorplanCanvasViewProps extends ColumnProps
{
    setScrollHandler(handler: ((direction: ScrollDirection) => void) | null): void;
}

export const FloorplanCanvasView: FC<FloorplanCanvasViewProps> = props =>
{
    const { gap = 1, children = null, setScrollHandler = null, ...rest } = props;
    const [ occupiedTilesReceived , setOccupiedTilesReceived ] = useState(false);
    const [ entryTileReceived, setEntryTileReceived ] = useState(false);
    const { originalFloorplanSettings = null, setOriginalFloorplanSettings = null, setVisualizationSettings = null } = useFloorplanEditorContext();
    const elementRef = useRef<HTMLDivElement>(null);

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

    const onClickArrowButton = (scrollDirection: ScrollDirection) =>
    {
        const element = elementRef.current;

        if(!element) return;

        switch(scrollDirection)
        {
            case 'up':
                element.scrollBy({ top: -10 });
                break;
            case 'down':
                element.scrollBy({ top: 10 });
                break;
            case 'left':
                element.scrollBy({ left: -10 });
                break;
            case 'right':
                element.scrollBy({ left: 10 });
                break;
        }
    }

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
    }

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
                }
            });
        }
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
                
        currentElement.appendChild(FloorplanEditor.instance.renderer.canvas);

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
        }
    }, []);

    useEffect(() =>
    {
        if(!setScrollHandler) return;

        setScrollHandler(() => onClickArrowButton);

        return () => setScrollHandler(null);
    }, [ setScrollHandler ]);

    return (
        <Column gap={ gap } { ...rest }>
            <Base overflow="auto" innerRef={ elementRef } />
            { children }
        </Column>
    );
}
