import { GetRoomEngine, GetRoomMessageHandler } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { serializeTilemap } from '../../../components/floorplan-editor/state/encoding';
import { FloorplanState } from '../../../components/floorplan-editor/state/types';
import { useActiveRoomSessionSnapshot } from '../../session/useSessionSnapshots';

/**
 * Client-side live preview for the floor-plan editor.
 *
 * Every tile / door / thickness / wallHeight change in the editor
 * is applied IMMEDIATELY to the 3D room behind the editor card
 * via the renderer's local `RoomMessageHandler.applyFloorModelLocally`
 * (added in the renderer's `feat/floorplan-live-preview` branch).
 * Nothing is sent to the server until the user explicitly clicks
 * Save — at that point `FloorplanEditorView` fires the
 * `UpdateFloorPropertiesMessageComposer` directly.
 *
 * Closing the editor without saving leaves the live preview
 * in place visually. To restore the pre-edit room, call `revert`
 * — it re-applies the baseline payload locally. The next
 * `FloorHeightMapEvent` from the server (e.g. on room re-enter)
 * also wins and overwrites whatever preview is in place.
 *
 * Thickness changes additionally call
 * `RoomEngine.updateRoomInstancePlaneThickness` for zero-latency
 * wall/floor depth feedback (the full geometry rebuild that
 * `applyFloorModelLocally` performs already reflects the new
 * thickness in its plane data, but the dedicated thickness
 * setter is cheaper and updates instantly as a slider is dragged).
 */

export type LivePreviewPayload = {
    /** Newline-or-CR-separated tilemap (the renderer parser accepts \r). */
    tilemap: string;
    doorX: number;
    doorY: number;
    doorDir: number;
    /** Editor-space (0..3). */
    thicknessWall: number;
    thicknessFloor: number;
    /** Editor-space (1..N). Server space is `wallHeight - 1`. */
    wallHeight: number;
};

export type UseFloorplanLiveSyncOptions = {
    enabled: boolean;
    state: FloorplanState;
};

export type UseFloorplanLiveSyncApi = {
    /**
     * Mark a payload as "currently shown in the room" so subsequent
     * state diffs are computed against it. Editors call this on
     * every server-driven snapshot push (FloorHeightMapEvent,
     * RoomVisualizationSettingsEvent, …).
     */
    setBaseline: (payload: LivePreviewPayload) => void;
    /**
     * Restore the in-room preview to the recorded baseline.
     * Use when the user closes the editor without saving.
     */
    revert: () => void;
};

const THICKNESS_RENDERER_VALUE: Record<number, number> = {
    0: 0.25,
    1: 0.5,
    2: 1,
    3: 2
};

export const buildLivePreviewPayload = (state: FloorplanState): LivePreviewPayload => ({
    tilemap: serializeTilemap(state.tiles),
    doorX: state.door.x,
    doorY: state.door.y,
    doorDir: state.door.dir,
    thicknessWall: state.thickness.wall,
    thicknessFloor: state.thickness.floor,
    wallHeight: state.wallHeight
});

export const livePreviewPayloadsEqual = (a: LivePreviewPayload, b: LivePreviewPayload): boolean =>
    a.tilemap === b.tilemap
    && a.doorX === b.doorX
    && a.doorY === b.doorY
    && a.doorDir === b.doorDir
    && a.thicknessWall === b.thicknessWall
    && a.thicknessFloor === b.thicknessFloor
    && a.wallHeight === b.wallHeight;

const applyToRenderer = (payload: LivePreviewPayload, roomId: number): boolean =>
{
    const handler = GetRoomMessageHandler();

    if(!handler || typeof handler.applyFloorModelLocally !== 'function') return false;

    const ok = handler.applyFloorModelLocally(payload.tilemap, Math.max(0, (payload.wallHeight | 0) - 1), true);

    if(!ok) return false;

    if(roomId >= 0)
    {
        const engine = GetRoomEngine();
        const wall = THICKNESS_RENDERER_VALUE[payload.thicknessWall];
        const floor = THICKNESS_RENDERER_VALUE[payload.thicknessFloor];

        if(engine && typeof engine.updateRoomInstancePlaneThickness === 'function' && wall !== undefined && floor !== undefined)
        {
            engine.updateRoomInstancePlaneThickness(roomId, wall, floor);
        }
    }

    return true;
};

export const useFloorplanLiveSync = (opts: UseFloorplanLiveSyncOptions): UseFloorplanLiveSyncApi =>
{
    const { enabled, state } = opts;
    const session = useActiveRoomSessionSnapshot();
    const roomId = session?.roomId ?? -1;

    const baselineRef = useRef<LivePreviewPayload | null>(null);
    const lastAppliedRef = useRef<LivePreviewPayload | null>(null);

    // Destructure first so the memo deps stay precise without
    // triggering exhaustive-deps on `state` as a whole.
    const { tiles, door, thickness, wallHeight } = state;
    const currentPayload = useMemo<LivePreviewPayload>(() => ({
        tilemap: serializeTilemap(tiles),
        doorX: door.x,
        doorY: door.y,
        doorDir: door.dir,
        thicknessWall: thickness.wall,
        thicknessFloor: thickness.floor,
        wallHeight
    }), [ tiles, door, thickness, wallHeight ]);

    const setBaseline = useCallback((payload: LivePreviewPayload) =>
    {
        baselineRef.current = payload;
        lastAppliedRef.current = payload;
    }, []);

    const revert = useCallback(() =>
    {
        const baseline = baselineRef.current;

        if(!baseline) return;

        if(applyToRenderer(baseline, roomId)) lastAppliedRef.current = baseline;
    }, [ roomId ]);

    // Apply the current payload to the renderer whenever it
    // diverges from what's already in the room. Synchronous + no
    // debounce — the renderer pipeline is fast enough that every
    // brush stroke can land a paint.
    useEffect(() =>
    {
        if(!enabled) return;

        const previous = lastAppliedRef.current;

        if(previous && livePreviewPayloadsEqual(currentPayload, previous)) return;
        if(!previous && !baselineRef.current) return;

        if(applyToRenderer(currentPayload, roomId)) lastAppliedRef.current = currentPayload;
    }, [ enabled, currentPayload, roomId ]);

    return { setBaseline, revert };
};
