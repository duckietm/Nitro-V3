import { COLORMAP, HEIGHT_BRUSH_MAX, HEIGHT_BRUSH_MIN, HEIGHT_SCHEME } from './constants';
import { Tile } from './types';

export const areaCount = (tiles: Tile[][]): { total: number; walkable: number } => {
    let total = 0;
    let walkable = 0;
    for (const row of tiles) {
        for (const tile of row) {
            if (tile.blocked) continue;
            total++;
            walkable++;
        }
    }
    return { total, walkable };
};

export const brushChar = (h: number): string => {
    const clamped = Math.max(HEIGHT_BRUSH_MIN, Math.min(HEIGHT_BRUSH_MAX, h));
    return HEIGHT_SCHEME.charAt(clamped + 1);
};

export const tileFill = (tile: Tile): string => {
    const ch = tile.blocked ? 'x' : HEIGHT_SCHEME.charAt(Math.max(0, Math.min(26, tile.h)) + 1);
    const hex = (COLORMAP as Record<string, string>)[ch] ?? '101010';
    return `#${hex}`;
};

export const defaultEmptyTilemap = (rows: number, cols: number): Tile[][] => {
    const grid: Tile[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: Tile[] = [];
        for (let c = 0; c < cols; c++) row.push({ h: 0, blocked: true });
        grid.push(row);
    }
    return grid;
};
