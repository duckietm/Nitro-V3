import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, cleanup } from '@testing-library/react';
import { FloorplanOptionsPanel } from './FloorplanOptionsPanel';
import { initialState } from '../state/reducer';

describe('FloorplanOptionsPanel', () =>
{
    afterEach(() => cleanup());
    it('clicking entry direction cycles 0..7', () =>
    {
        const dispatch = vi.fn();
        const state = { ...initialState, door: { x: 0, y: 0, dir: 2 as const } };
        const { getByTestId } = render(<FloorplanOptionsPanel state={ state } dispatch={ dispatch } />);
        fireEvent.click(getByTestId('entry-dir'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DOOR_DIR', dir: 3, source: 'local' });
    });

    it('wraps from 7 back to 0', () =>
    {
        const dispatch = vi.fn();
        const state = { ...initialState, door: { x: 0, y: 0, dir: 7 as const } };
        const { getByTestId } = render(<FloorplanOptionsPanel state={ state } dispatch={ dispatch } />);
        fireEvent.click(getByTestId('entry-dir'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DOOR_DIR', dir: 0, source: 'local' });
    });

    it('wall thickness button dispatches SET_THICKNESS', () =>
    {
        const dispatch = vi.fn();
        const { getByTestId } = render(<FloorplanOptionsPanel state={ initialState } dispatch={ dispatch } />);
        fireEvent.click(getByTestId('wall-thickness-3'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_THICKNESS', wall: 3, source: 'local' });
    });

    it('floor thickness button dispatches SET_THICKNESS', () =>
    {
        const dispatch = vi.fn();
        const { getByTestId } = render(<FloorplanOptionsPanel state={ initialState } dispatch={ dispatch } />);
        fireEvent.click(getByTestId('floor-thickness-0'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_THICKNESS', floor: 0, source: 'local' });
    });
});
