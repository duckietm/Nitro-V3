import { Tile } from './types';
import { HEIGHT_SCHEME } from './constants';

const VALID_CHARS = HEIGHT_SCHEME;
const HMIN = 0;
const HMAX = VALID_CHARS.length - 2;

export const charToTile = (ch: string): Tile =>
{
    const lower = ch.toLowerCase();
    const idx = VALID_CHARS.indexOf(lower);
    if(idx <= 0) return { h: 0, blocked: true };
    return { h: idx - 1, blocked: false };
};

export const tileToChar = (tile: Tile): string =>
{
    if(tile.blocked) return 'x';
    const h = Number.isFinite(tile.h)
        ? Math.max(HMIN, Math.min(HMAX, tile.h))
        : HMIN;
    return VALID_CHARS.charAt(h + 1);
};

export const parseTilemap = (raw: string): Tile[][] =>
{
    if(!raw) return [];
    const cleaned = raw.split(/\r\n|\r|\n/).filter(r => r.length > 0);
    if(cleaned.length === 0) return [];
    const width = cleaned.reduce((m, r) => Math.max(m, r.length), 0);
    return cleaned.map(rowStr =>
    {
        const cells: Tile[] = [];
        for(let i = 0; i < width; i++)
        {
            cells.push(i < rowStr.length ? charToTile(rowStr.charAt(i)) : { h: 0, blocked: true });
        }
        return cells;
    });
};

export const serializeTilemap = (tiles: Tile[][]): string =>
{
    if(!tiles || tiles.length === 0) return '';
    return tiles.map(row => row.map(tileToChar).join('')).join('\r');
};
