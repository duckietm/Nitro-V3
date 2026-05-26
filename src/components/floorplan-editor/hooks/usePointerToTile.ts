import { RefObject, useCallback, useMemo } from 'react';
import { TILE_SIZE } from '../state/constants';

const X_OFFSET = 1024;

export const tileToScreen = (row: number, col: number): [number, number] =>
{
    const x = (col * TILE_SIZE / 2) - (row * TILE_SIZE / 2) + X_OFFSET;
    const y = (col * TILE_SIZE / 4) + (row * TILE_SIZE / 4);
    return [ x, y ];
};

export const screenToTile = (x: number, y: number): [number, number] =>
{
    const tx = x - X_OFFSET;
    const col = ((tx / (TILE_SIZE / 2)) + (y / (TILE_SIZE / 4))) / 2;
    const row = ((y / (TILE_SIZE / 4)) - (tx / (TILE_SIZE / 2))) / 2;
    return [ row, col ];
};

type ViewBox = { width: number; height: number; x?: number; y?: number };

export type PointerProjection = {
    fromClient: (clientX: number, clientY: number) => { row: number; col: number } | null;
};

export const usePointerToTile = (
    svgRef: RefObject<SVGSVGElement | null>,
    viewBox: ViewBox
): PointerProjection =>
{
    void viewBox;

    const fromClient = useCallback((clientX: number, clientY: number) =>
    {
        const svg = svgRef.current;
        if(!svg) return null;

        if(typeof document !== 'undefined' && typeof document.elementFromPoint === 'function')
        {
            const hit = document.elementFromPoint(clientX, clientY) as SVGElement | null;
            if(hit)
            {
                const r = hit.getAttribute('data-row');
                const c = hit.getAttribute('data-col');
                if(r !== null && c !== null)
                {
                    const row = parseInt(r, 10);
                    const col = parseInt(c, 10);
                    if(Number.isFinite(row) && Number.isFinite(col)) return { row, col };
                }
            }
        }

        const ctm = svg.getScreenCTM();
        if(!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const local = pt.matrixTransform(ctm.inverse());

        const [ row, col ] = screenToTile(local.x, local.y);
        return { row: Math.round(row), col: Math.round(col) };
    }, [ svgRef ]);

    return useMemo(() => ({ fromClient }), [ fromClient ]);
};
