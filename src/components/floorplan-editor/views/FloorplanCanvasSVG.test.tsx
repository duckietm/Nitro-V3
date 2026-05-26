import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { FloorplanCanvasSVG } from './FloorplanCanvasSVG';
import { initialState } from '../state/reducer';

describe('FloorplanCanvasSVG', () =>
{
    it('renders one polygon per non-blocked tile', () =>
    {
        const state = {
            ...initialState,
            tiles: [
                [{ h: 0, blocked: false }, { h: 1, blocked: true }],
                [{ h: 2, blocked: false }, { h: 3, blocked: false }]
            ]
        };
        const { container } = render(<FloorplanCanvasSVG state={ state } dispatch={ () => {} } />);
        const polys = container.querySelectorAll('polygon');
        expect(polys.length).toBeGreaterThanOrEqual(3);
    });

    it('renders door marker on the door tile', () =>
    {
        const state = {
            ...initialState,
            tiles: [[{ h: 0, blocked: false }, { h: 0, blocked: false }]],
            door: { x: 1, y: 0, dir: 2 as const }
        };
        const { container } = render(<FloorplanCanvasSVG state={ state } dispatch={ () => {} } />);
        expect(container.querySelector('[data-testid="door-marker"]')).toBeTruthy();
    });

    it('forwards pointer events to a tool dispatch (PAINT_TILE with brush)', () =>
    {
        const state = {
            ...initialState,
            tiles: [[{ h: 0, blocked: false }]],
            brush: { h: 0, action: 'SET' as const }
        };
        const dispatch = vi.fn();
        const { container } = render(<FloorplanCanvasSVG state={ state } dispatch={ dispatch } />);
        const svg = container.querySelector('svg') as SVGSVGElement;
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, right: 2048, bottom: 1024, width: 2048, height: 1024, x: 0, y: 0, toJSON: () => ({}) });
        fireEvent.pointerDown(svg, { clientX: 1024, clientY: 0, pointerId: 1 });
        expect(dispatch).toHaveBeenCalled();
        const call = dispatch.mock.calls[0][0];
        expect(call.type).toBe('PAINT_TILE');
    });

    it('zoom in/out buttons adjust the viewBox', () =>
    {
        const { container } = render(<FloorplanCanvasSVG state={ initialState } dispatch={ () => {} } />);
        const svg = container.querySelector('svg') as SVGSVGElement;
        const initialVB = svg.getAttribute('viewBox');
        fireEvent.click(container.querySelector('[data-testid="zoom-in"]') as Element);
        expect(svg.getAttribute('viewBox')).not.toBe(initialVB);
    });
});
