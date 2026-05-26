import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFloorplanReducer } from './useFloorplanReducer';

describe('useFloorplanReducer', () =>
{
    it('starts with initialState', () =>
    {
        const { result } = renderHook(() => useFloorplanReducer());
        expect(result.current.state.tiles).toEqual([]);
        expect(result.current.state.brush.action).toBe('SET');
    });

    it('loadFromServer seeds tiles + door + wallHeight', () =>
    {
        const { result } = renderHook(() => useFloorplanReducer());
        act(() =>
        {
            result.current.loadFromServer({
                tilemap: '00\rxq',
                entryPoint: [ 1, 0 ],
                entryPointDir: 4,
                thicknessWall: 1,
                thicknessFloor: 0,
                wallHeight: 5
            });
        });
        expect(result.current.state.tiles).toHaveLength(2);
        expect(result.current.state.door).toEqual({ x: 1, y: 0, dir: 4 });
        expect(result.current.state.thickness).toEqual({ wall: 1, floor: 0 });
        expect(result.current.state.wallHeight).toBe(5);
    });

    it('dispatch updates state synchronously', () =>
    {
        const { result } = renderHook(() => useFloorplanReducer());
        act(() =>
        {
            result.current.dispatch({ type: 'BRUSH_SET', action: 'DOOR' });
        });
        expect(result.current.state.brush.action).toBe('DOOR');
    });
});
