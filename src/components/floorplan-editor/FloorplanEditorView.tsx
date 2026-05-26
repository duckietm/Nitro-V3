import { AddLinkEventTracker, convertNumbersForSaving, convertSettingToNumber, FloorHeightMapEvent, GetRoomEntryTileMessageComposer, ILinkEventTracker, RemoveLinkEventTracker, RoomEngineEvent, RoomEntryTileMessageEvent, RoomVisualizationSettingsEvent, UpdateFloorPropertiesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaBolt, FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../api';
import { Button, ButtonGroup, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useNitroEvent } from '../../hooks';
import { useFloorplanLiveSync } from '../../hooks/rooms/widgets/useFloorplanLiveSync';
import { MAX_WALL_HEIGHT, MIN_WALL_HEIGHT } from './state/constants';
import { EntryDir, ThicknessLevel } from './state/types';
import { areaCount } from './state/selectors';
import { serializeTilemap } from './state/encoding';
import { useFloorplanReducer } from './hooks/useFloorplanReducer';
import { FloorplanCanvasSVG } from './views/FloorplanCanvasSVG';
import { FloorplanHeightPicker } from './views/FloorplanHeightPicker';
import { FloorplanToolbar } from './views/FloorplanToolbar';
import { FloorplanOptionsPanel } from './views/FloorplanOptionsPanel';
import { FloorplanImportExport } from './views/FloorplanImportExport';

const clampThickness = (v: number): ThicknessLevel =>
{
    if(v <= 0) return 0;
    if(v >= 3) return 3;
    return (v | 0) as ThicknessLevel;
};

export const FloorplanEditorView: FC = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ importExportVisible, setImportExportVisible ] = useState(false);
    const [ liveSync, setLiveSync ] = useState(true);
    const [ panMode, setPanMode ] = useState(false);
    const { state, dispatch, loadFromServer, undo, redo, canUndo, canRedo } = useFloorplanReducer();
    const originalRef = useRef<{
        tilemap: string;
        entryPoint: [number, number];
        entryPointDir: number;
        thicknessWall: ThicknessLevel;
        thicknessFloor: ThicknessLevel;
        wallHeight: number;
    } | null>(null);

    const area = useMemo(() => areaCount(state.tiles), [ state.tiles ]);

    const { setBaseline, revert: revertLivePreview } = useFloorplanLiveSync({ enabled: liveSync && isVisible, state });

    useNitroEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED, () => setIsVisible(false));

    useEffect(() =>
    {
        if(!isVisible) return;
        SendMessageComposer(new GetRoomEntryTileMessageComposer());
    }, [ isVisible ]);

    useMessageEvent<RoomEntryTileMessageEvent>(RoomEntryTileMessageEvent, event =>
    {
        const parser = event.getParser();
        originalRef.current = {
            tilemap: originalRef.current?.tilemap ?? '',
            entryPoint: [ parser.x, parser.y ],
            entryPointDir: parser.direction,
            thicknessWall: originalRef.current?.thicknessWall ?? 1,
            thicknessFloor: originalRef.current?.thicknessFloor ?? 1,
            wallHeight: originalRef.current?.wallHeight ?? -1
        };
        dispatch({ type: 'SET_DOOR', x: parser.x, y: parser.y, source: 'remote' });
        dispatch({ type: 'SET_DOOR_DIR', dir: ((parser.direction | 0) & 7) as EntryDir, source: 'remote' });
    });

    useMessageEvent<FloorHeightMapEvent>(FloorHeightMapEvent, event =>
    {
        const parser = event.getParser();
        originalRef.current = {
            tilemap: parser.model,
            entryPoint: originalRef.current?.entryPoint ?? [ 0, 0 ],
            entryPointDir: originalRef.current?.entryPointDir ?? 2,
            thicknessWall: originalRef.current?.thicknessWall ?? 1,
            thicknessFloor: originalRef.current?.thicknessFloor ?? 1,
            wallHeight: parser.wallHeight + 1
        };
        loadFromServer({
            tilemap: parser.model,
            entryPoint: originalRef.current.entryPoint,
            entryPointDir: originalRef.current.entryPointDir,
            thicknessWall: originalRef.current.thicknessWall,
            thicknessFloor: originalRef.current.thicknessFloor,
            wallHeight: parser.wallHeight + 1
        });
        setBaseline({
            tilemap: parser.model,
            doorX: originalRef.current.entryPoint[0],
            doorY: originalRef.current.entryPoint[1],
            doorDir: originalRef.current.entryPointDir,
            thicknessWall: originalRef.current.thicknessWall,
            thicknessFloor: originalRef.current.thicknessFloor,
            wallHeight: parser.wallHeight + 1
        });
    });

    useMessageEvent<RoomVisualizationSettingsEvent>(RoomVisualizationSettingsEvent, event =>
    {
        const parser = event.getParser();
        const wall = clampThickness(convertSettingToNumber(parser.thicknessWall));
        const floor = clampThickness(convertSettingToNumber(parser.thicknessFloor));
        originalRef.current = {
            tilemap: originalRef.current?.tilemap ?? '',
            entryPoint: originalRef.current?.entryPoint ?? [ 0, 0 ],
            entryPointDir: originalRef.current?.entryPointDir ?? 2,
            thicknessWall: wall,
            thicknessFloor: floor,
            wallHeight: originalRef.current?.wallHeight ?? -1
        };
        dispatch({ type: 'SET_THICKNESS', wall, floor, source: 'remote' });
    });

    useEffect(() =>
    {
        if(!isVisible) return;
        const handler = (e: KeyboardEvent) =>
        {
            if(!(e.ctrlKey || e.metaKey)) return;
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if(tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
            const key = e.key.toLowerCase();
            if(key === 'z' && !e.shiftKey)
            {
                e.preventDefault();
                undo();
            }
            else if((key === 'z' && e.shiftKey) || key === 'y')
            {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [ isVisible, undo, redo ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(v => !v); return;
                }
            },
            eventUrlPrefix: 'floor-editor/'
        };
        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const onWallHeightChange = (value: number) =>
    {
        if(isNaN(value) || value <= 0) value = MIN_WALL_HEIGHT;
        if(value > MAX_WALL_HEIGHT) value = MAX_WALL_HEIGHT;
        dispatch({ type: 'SET_WALL_HEIGHT', value, source: 'local' });
    };

    const saveFloorChanges = () =>
    {
        SendMessageComposer(new UpdateFloorPropertiesMessageComposer(
            serializeTilemap(state.tiles),
            state.door.x,
            state.door.y,
            state.door.dir,
            convertNumbersForSaving(state.thickness.wall),
            convertNumbersForSaving(state.thickness.floor),
            state.wallHeight - 1
        ));
    };

    const revertChanges = () =>
    {
        const o = originalRef.current;
        if(!o) return;
        loadFromServer(o);
        if(liveSync) revertLivePreview();
    };

    return (
        <>
            { isVisible && (
                <NitroCardView uniqueKey="floorpan-editor" className="w-[820px] h-[620px]" theme="primary-slim">
                    <NitroCardHeaderView headerText={ LocalizeText('floor.plan.editor.title') } onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardContentView overflow="hidden" className="flex flex-col gap-2">
                        <FloorplanToolbar
                            state={ state }
                            dispatch={ dispatch }
                            canUndo={ canUndo }
                            canRedo={ canRedo }
                            onUndo={ undo }
                            onRedo={ redo }
                            panMode={ panMode }
                            setPanMode={ setPanMode }
                        />
                        <FloorplanOptionsPanel state={ state } dispatch={ dispatch } />
                        <Flex gap={ 2 } className="flex-1 min-h-0">
                            <FloorplanHeightPicker selectedH={ state.brush.h } onSelect={ h => dispatch({ type: 'BRUSH_SET', h }) } />
                            <FloorplanCanvasSVG state={ state } dispatch={ dispatch } panMode={ panMode } />
                        </Flex>
                        <Flex gap={ 3 } alignItems="center" className="px-1">
                            <Flex gap={ 1 } alignItems="center">
                                <Text bold small className="text-zinc-700">{ LocalizeText('floor.editor.wall.height') }</Text>
                                <FaCaretLeft className="cursor-pointer fa-icon text-zinc-600" onClick={ () => onWallHeightChange(state.wallHeight - 1) } />
                                <input
                                    type="number"
                                    className="form-control form-control-sm w-[49px] text-center"
                                    value={ state.wallHeight }
                                    onChange={ e => onWallHeightChange(e.target.valueAsNumber) }
                                />
                                <FaCaretRight className="cursor-pointer fa-icon text-zinc-600" onClick={ () => onWallHeightChange(state.wallHeight + 1) } />
                            </Flex>
                            <Text bold small className="text-zinc-700">
                                Area: <span className="tabular-nums">{ area.total }</span> ({ area.walkable } tiles)
                            </Text>
                            <Flex
                                alignItems="center"
                                gap={ 1 }
                                className={ `ml-auto border rounded px-2 py-1 cursor-pointer select-none ${ liveSync ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700' : 'border-zinc-400 text-zinc-600' }` }
                                onClick={ () => setLiveSync(v => !v) }
                                title="Local in-room preview while drawing (does not save to server)"
                            >
                                <FaBolt className={ liveSync ? 'text-emerald-600' : 'text-zinc-500' } />
                                <Text bold small>{ liveSync ? 'Live preview ON' : 'Live preview OFF' }</Text>
                            </Flex>
                        </Flex>
                        <Flex justifyContent="between">
                            <Button variant="danger" onClick={ revertChanges }>{ LocalizeText('floor.plan.editor.reload') }</Button>
                            <ButtonGroup>
                                <Button onClick={ () => setImportExportVisible(true) }>{ LocalizeText('floor.plan.editor.import.export') }</Button>
                                <Button onClick={ saveFloorChanges }>{ LocalizeText('floor.plan.editor.save') }</Button>
                            </ButtonGroup>
                        </Flex>
                    </NitroCardContentView>
                </NitroCardView>
            ) }
            { importExportVisible && (
                <FloorplanImportExport
                    state={ state }
                    dispatch={ dispatch }
                    onClose={ () => setImportExportVisible(false) }
                    onSaveFromText={ raw =>
                    {
                        SendMessageComposer(new UpdateFloorPropertiesMessageComposer(
                            raw,
                            state.door.x,
                            state.door.y,
                            state.door.dir,
                            convertNumbersForSaving(state.thickness.wall),
                            convertNumbersForSaving(state.thickness.floor),
                            state.wallHeight - 1
                        ));
                    } }
                    onRevertText={ () => originalRef.current?.tilemap ?? serializeTilemap(state.tiles) }
                />
            ) }
        </>
    );
};
