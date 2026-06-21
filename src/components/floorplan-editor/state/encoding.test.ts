import { describe, expect, it } from 'vitest';
import { charToTile, parseTilemap, serializeTilemap, tileToChar } from './encoding';

describe('charToTile', () => {
    it('returns blocked for x', () => {
        expect(charToTile('x')).toEqual({ h: 0, blocked: true });
    });

    it('returns h=0 for "0"', () => {
        expect(charToTile('0')).toEqual({ h: 0, blocked: false });
    });

    it('returns h=9 for "9"', () => {
        expect(charToTile('9')).toEqual({ h: 9, blocked: false });
    });

    it('returns h=10 for "a"', () => {
        expect(charToTile('a')).toEqual({ h: 10, blocked: false });
    });

    it('returns h=26 for "q"', () => {
        expect(charToTile('q')).toEqual({ h: 26, blocked: false });
    });

    it('treats uppercase X as blocked', () => {
        expect(charToTile('X')).toEqual({ h: 0, blocked: true });
    });

    it('returns blocked for any unknown char (defensive)', () => {
        expect(charToTile('?')).toEqual({ h: 0, blocked: true });
    });
});

describe('tileToChar', () => {
    it('returns x for blocked tile', () => {
        expect(tileToChar({ h: 5, blocked: true })).toBe('x');
    });

    it('returns "0" for h=0 non-blocked', () => {
        expect(tileToChar({ h: 0, blocked: false })).toBe('0');
    });

    it('returns "q" for h=26 non-blocked', () => {
        expect(tileToChar({ h: 26, blocked: false })).toBe('q');
    });

    it('clamps out-of-range h to nearest valid', () => {
        expect(tileToChar({ h: -1, blocked: false })).toBe('0');
        expect(tileToChar({ h: 99, blocked: false })).toBe('q');
    });

    it('treats NaN h as h=0 on non-blocked tile (does not collapse to blocked)', () => {
        expect(tileToChar({ h: NaN, blocked: false })).toBe('0');
    });
});

describe('parseTilemap', () => {
    it('returns empty grid for empty string', () => {
        expect(parseTilemap('')).toEqual([]);
    });

    it('parses a single row', () => {
        expect(parseTilemap('00x0')).toEqual([
            [
                { h: 0, blocked: false },
                { h: 0, blocked: false },
                { h: 0, blocked: true },
                { h: 0, blocked: false }
            ]
        ]);
    });

    it('parses multiple rows separated by \\r', () => {
        const raw = '00\rxx\r12';
        const grid = parseTilemap(raw);
        expect(grid).toHaveLength(3);
        expect(grid[0]).toHaveLength(2);
        expect(grid[1][0].blocked).toBe(true);
        expect(grid[2][1]).toEqual({ h: 2, blocked: false });
    });

    it('also accepts \\r\\n as row separator', () => {
        const raw = '00\r\nxx';
        const grid = parseTilemap(raw);
        expect(grid).toHaveLength(2);
        expect(grid[1][1].blocked).toBe(true);
    });

    it('also accepts \\n alone as row separator (textarea normalization)', () => {
        const raw = '00\nxq';
        const grid = parseTilemap(raw);
        expect(grid).toHaveLength(2);
        expect(grid[0]).toHaveLength(2);
        expect(grid[1][1]).toEqual({ h: 26, blocked: false });
    });

    it('pads short rows with blocked tiles so the grid is rectangular', () => {
        const raw = '000\rx';
        const grid = parseTilemap(raw);
        expect(grid[1]).toHaveLength(3);
        expect(grid[1][1]).toEqual({ h: 0, blocked: true });
        expect(grid[1][2]).toEqual({ h: 0, blocked: true });
    });
});

describe('serializeTilemap', () => {
    it('returns empty string for empty grid', () => {
        expect(serializeTilemap([])).toBe('');
    });

    it('serializes a single row with no separator', () => {
        const grid = [
            [
                { h: 0, blocked: false },
                { h: 1, blocked: false },
                { h: 0, blocked: true }
            ]
        ];
        expect(serializeTilemap(grid)).toBe('01x');
    });

    it('separates rows with \\r', () => {
        const grid = [
            [
                { h: 0, blocked: false },
                { h: 0, blocked: false }
            ],
            [
                { h: 0, blocked: true },
                { h: 26, blocked: false }
            ]
        ];
        expect(serializeTilemap(grid)).toBe('00\rxq');
    });

    it('round-trips parse → serialize', () => {
        const raw = '0123\rxxqq\r1234';
        expect(serializeTilemap(parseTilemap(raw))).toBe(raw);
    });

    it('jagged-row round-trip normalizes short rows with x-padding', () => {
        const raw = '000\rx';
        expect(serializeTilemap(parseTilemap(raw))).toBe('000\rxxx');
    });
});
