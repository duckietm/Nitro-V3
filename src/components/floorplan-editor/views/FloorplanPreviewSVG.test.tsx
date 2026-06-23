import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { initialState } from '../state/reducer';
import { FloorplanPreviewSVG } from './FloorplanPreviewSVG';

describe('FloorplanPreviewSVG', () => {
    it('renders nothing for empty tilemap', () => {
        const { container } = render(<FloorplanPreviewSVG state={initialState} />);
        expect(container.querySelector('polygon')).toBeNull();
    });

    it('renders a floor polygon per non-blocked tile', () => {
        const state = {
            ...initialState,
            tiles: [
                [
                    { h: 0, blocked: false },
                    { h: 0, blocked: true }
                ],
                [
                    { h: 0, blocked: false },
                    { h: 0, blocked: false }
                ]
            ]
        };
        const { container } = render(<FloorplanPreviewSVG state={state} />);
        expect(container.querySelectorAll('[data-role="floor"]')).toHaveLength(3);
    });

    it('renders wall polygons when wallHeight > 0', () => {
        const state = {
            ...initialState,
            wallHeight: 4,
            tiles: [
                [
                    { h: 0, blocked: false },
                    { h: 0, blocked: false }
                ],
                [
                    { h: 0, blocked: false },
                    { h: 0, blocked: false }
                ]
            ]
        };
        const { container } = render(<FloorplanPreviewSVG state={state} />);
        expect(container.querySelectorAll('[data-role="wall"]').length).toBeGreaterThan(0);
    });

    it('does NOT render walls when wallHeight is 0 or negative', () => {
        const state = {
            ...initialState,
            wallHeight: 0,
            tiles: [[{ h: 0, blocked: false }]]
        };
        const { container } = render(<FloorplanPreviewSVG state={state} />);
        expect(container.querySelectorAll('[data-role="wall"]')).toHaveLength(0);
    });
});
