import { FC, useMemo } from 'react';
import { FloorplanState, Tile } from '../state/types';
import { tileFill } from '../state/selectors';
import { TILE_SIZE } from '../state/constants';
import { tileToScreen } from '../hooks/usePointerToTile';

const WALL_FILL_LEFT = '#8a8a8a';
const WALL_FILL_BACK = '#cfcfcf';

const diamond = (row: number, col: number, h: number): string =>
{
    const [ cx, cyBase ] = tileToScreen(row, col);
    const cy = cyBase - h * (TILE_SIZE / 8);
    const half = TILE_SIZE / 2;
    const quarter = TILE_SIZE / 4;
    return `${ cx },${ cy - quarter } ${ cx + half },${ cy } ${ cx },${ cy + quarter } ${ cx - half },${ cy }`;
};

const wallBack = (row: number, col: number, wallH: number): string =>
{
    const [ cx, cyBase ] = tileToScreen(row, col);
    const half = TILE_SIZE / 2;
    const quarter = TILE_SIZE / 4;
    const top = cyBase - quarter;
    const wallPx = wallH * TILE_SIZE;
    return `${ cx },${ top } ${ cx + half },${ top + quarter } ${ cx + half },${ top + quarter - wallPx } ${ cx },${ top - wallPx }`;
};

const wallLeft = (row: number, col: number, wallH: number): string =>
{
    const [ cx, cyBase ] = tileToScreen(row, col);
    const half = TILE_SIZE / 2;
    const quarter = TILE_SIZE / 4;
    const top = cyBase - quarter;
    const wallPx = wallH * TILE_SIZE;
    return `${ cx - half },${ top + quarter } ${ cx },${ top } ${ cx },${ top - wallPx } ${ cx - half },${ top + quarter - wallPx }`;
};

const isPlaced = (t: Tile | undefined): boolean => !!t && !t.blocked;

export const FloorplanPreviewSVG: FC<{ state: FloorplanState }> = ({ state }) =>
{
    const elements = useMemo(() =>
    {
        const out: React.ReactNode[] = [];
        for(let r = 0; r < state.tiles.length; r++)
        {
            const row = state.tiles[r];
            for(let c = 0; c < row.length; c++)
            {
                const t = row[c];
                if(!isPlaced(t)) continue;
                out.push(<polygon key={ `f-${ r }-${ c }` } data-role="floor" points={ diamond(r, c, t.h) } fill={ tileFill(t) } stroke="#222" strokeWidth={ 0.4 } />);
                if(state.wallHeight > 0)
                {
                    const above = state.tiles[r - 1]?.[c];
                    const left = state.tiles[r]?.[c - 1];
                    if(!isPlaced(above))
                    {
                        out.push(<polygon key={ `wb-${ r }-${ c }` } data-role="wall" points={ wallBack(r, c, state.wallHeight) } fill={ WALL_FILL_BACK } stroke="#333" strokeWidth={ 0.4 } />);
                    }
                    if(!isPlaced(left))
                    {
                        out.push(<polygon key={ `wl-${ r }-${ c }` } data-role="wall" points={ wallLeft(r, c, state.wallHeight) } fill={ WALL_FILL_LEFT } stroke="#333" strokeWidth={ 0.4 } />);
                    }
                }
            }
        }
        return out;
    }, [ state.tiles, state.wallHeight ]);

    return (
        <svg viewBox="0 0 2048 1024" className="w-full h-full bg-black">
            { elements }
        </svg>
    );
};
