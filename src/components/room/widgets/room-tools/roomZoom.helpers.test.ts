import { describe, expect, it } from 'vitest';
import { getRoomZoomLevel, getRoomZoomScale, stepRoomZoom } from './roomZoom.helpers';

describe('AIR room zoom levels', () => {
    it.each([
        [0, 0.5],
        [1, 1],
        [2, 2],
        [3, 4]
    ])('maps level %i to renderer scale %f', (level, scale) => {
        expect(getRoomZoomScale(level)).toBe(scale);
        expect(getRoomZoomLevel(scale)).toBe(level);
    });

    it('clamps zoom steps between 0.5x and 4x', () => {
        expect(stepRoomZoom(0.5, -1)).toBe(0.5);
        expect(stepRoomZoom(0.5, 1)).toBe(1);
        expect(stepRoomZoom(1, 1)).toBe(2);
        expect(stepRoomZoom(2, 1)).toBe(4);
        expect(stepRoomZoom(4, 1)).toBe(4);
        expect(stepRoomZoom(4, -1)).toBe(2);
    });
});
