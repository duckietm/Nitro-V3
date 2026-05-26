import { describe, it, expect } from 'vitest';
import {
    areaCount,
    brushChar,
    tileFill,
    defaultEmptyTilemap
} from './selectors';
import { HEIGHT_SCHEME } from './constants';

describe('areaCount', () =>
{
    it('returns zeros for empty grid', () =>
    {
        expect(areaCount([])).toEqual({ total: 0, walkable: 0 });
    });

    it('counts total = walkable when no blocked tiles', () =>
    {
        const grid = [
            [{ h: 0, blocked: false }, { h: 1, blocked: false }],
            [{ h: 2, blocked: false }, { h: 3, blocked: false }]
        ];
        expect(areaCount(grid)).toEqual({ total: 4, walkable: 4 });
    });

    it('excludes blocked from walkable but counts in total', () =>
    {
        const grid = [
            [{ h: 0, blocked: false }, { h: 0, blocked: true }],
            [{ h: 2, blocked: false }, { h: 3, blocked: false }]
        ];
        expect(areaCount(grid)).toEqual({ total: 3, walkable: 3 });
    });

    it('treats blocked tiles as non-tiles (per existing UI semantics)', () =>
    {
        const grid = [
            [{ h: 0, blocked: true }, { h: 0, blocked: true }, { h: 0, blocked: true }],
            [{ h: 0, blocked: false }, { h: 1, blocked: false }, { h: 0, blocked: true }]
        ];
        expect(areaCount(grid)).toEqual({ total: 2, walkable: 2 });
    });
});

describe('brushChar', () =>
{
    it('h=0 → "0"', () => expect(brushChar(0)).toBe('0'));
    it('h=26 → "q"', () => expect(brushChar(26)).toBe('q'));
    it('clamps below to "0"', () => expect(brushChar(-5)).toBe('0'));
    it('clamps above to "q"', () => expect(brushChar(99)).toBe('q'));
});

describe('tileFill', () =>
{
    it('returns COLORMAP entry for non-blocked tile', () =>
    {
        const fill = tileFill({ h: 0, blocked: false });
        expect(fill).toBe('#0065ff');
    });

    it('returns COLORMAP entry for blocked tile', () =>
    {
        expect(tileFill({ h: 5, blocked: true })).toBe('#101010');
    });
});

describe('defaultEmptyTilemap', () =>
{
    it('returns a rows×cols grid of blocked tiles', () =>
    {
        const grid = defaultEmptyTilemap(3, 4);
        expect(grid).toHaveLength(3);
        expect(grid[0]).toHaveLength(4);
        expect(grid[0][0]).toEqual({ h: 0, blocked: true });
        expect(grid[2][3]).toEqual({ h: 0, blocked: true });
    });
});
