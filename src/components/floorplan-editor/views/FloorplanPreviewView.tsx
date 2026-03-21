import { FC, useEffect, useRef } from 'react';
import { COLORMAP, HEIGHT_SCHEME, FloorplanEditor } from '@nitrots/nitro-renderer';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

const colormap = COLORMAP as Record<string, string>;

const PREVIEW_TILE_W = 16;
const PREVIEW_TILE_H = 8;
const PREVIEW_BLOCK_H = 5;
const WALL_HEIGHT_PX = 40;
const WALL_COLOR = '#6B7B5E';
const WALL_SIDE_COLOR = '#5A6A4F';
const WALL_TOP_COLOR = '#7D8E6F';

function hexToRgb(hex: string): [number, number, number]
{
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [ r, g, b ];
}

function rgbToHex(r: number, g: number, b: number): string
{
    return `#${ ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) }`;
}

function darken(hex: string, factor: number): string
{
    const [ r, g, b ] = hexToRgb(hex);

    return rgbToHex(
        Math.floor(r * factor),
        Math.floor(g * factor),
        Math.floor(b * factor)
    );
}

function getTilemapBounds(tilemap: any[][]): { minX: number; minY: number; maxX: number; maxY: number }
{
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for(let y = 0; y < tilemap.length; y++)
    {
        if(!tilemap[y]) continue;

        for(let x = 0; x < tilemap[y].length; x++)
        {
            if(!tilemap[y][x] || tilemap[y][x].height === 'x') continue;

            if(x < minX) minX = x;
            if(x > maxX) maxX = x;
            if(y < minY) minY = y;
            if(y > maxY) maxY = y;
        }
    }

    if(minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    return { minX, minY, maxX, maxY };
}

function renderPreview(canvas: HTMLCanvasElement, wallHeight: number): void
{
    const ctx = canvas.getContext('2d');
    const tilemap = FloorplanEditor.instance.tilemap;

    if(!ctx || !tilemap || tilemap.length === 0)
    {
        if(ctx)
        {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        return;
    }

    const bounds = getTilemapBounds(tilemap);
    const tilesW = bounds.maxX - bounds.minX + 1;
    const tilesH = bounds.maxY - bounds.minY + 1;

    // find max height for offset calculation
    let maxTileHeight = 0;

    for(let y = bounds.minY; y <= bounds.maxY; y++)
    {
        for(let x = bounds.minX; x <= bounds.maxX; x++)
        {
            if(!tilemap[y] || !tilemap[y][x] || tilemap[y][x].height === 'x') continue;

            const hi = HEIGHT_SCHEME.indexOf(tilemap[y][x].height) - 1;

            if(hi > maxTileHeight) maxTileHeight = hi;
        }
    }

    // calculate isometric bounds
    const isoW = (tilesW + tilesH) * PREVIEW_TILE_W;
    const isoH = (tilesW + tilesH) * PREVIEW_TILE_H + maxTileHeight * PREVIEW_BLOCK_H + WALL_HEIGHT_PX;

    // scale to fit canvas
    const scaleX = (canvas.width - 20) / isoW;
    const scaleY = (canvas.height - 20) / isoH;
    const scale = Math.min(scaleX, scaleY, 3);

    const offsetX = (canvas.width - isoW * scale) / 2;
    const offsetY = (canvas.height - isoH * scale) / 2 + WALL_HEIGHT_PX * scale * 0.5;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const tw = PREVIEW_TILE_W;
    const th = PREVIEW_TILE_H;

    function isoX(gx: number, gy: number): number
    {
        return (gx - bounds.minX - gy + bounds.minY) * tw + (tilesH - 1) * tw;
    }

    function isoY(gx: number, gy: number): number
    {
        return (gx - bounds.minX + gy - bounds.minY) * th;
    }

    function hasActiveTile(gx: number, gy: number): boolean
    {
        return tilemap[gy] && tilemap[gy][gx] && tilemap[gy][gx].height !== 'x';
    }

    function getTileHeight(gx: number, gy: number): number
    {
        if(!hasActiveTile(gx, gy)) return 0;

        return Math.max(0, HEIGHT_SCHEME.indexOf(tilemap[gy][gx].height) - 1);
    }

    // draw walls on north and west edges
    const wallH = wallHeight > 0 ? wallHeight * PREVIEW_BLOCK_H + WALL_HEIGHT_PX * 0.3 : WALL_HEIGHT_PX * 0.6;

    for(let y = bounds.minY; y <= bounds.maxY; y++)
    {
        for(let x = bounds.minX; x <= bounds.maxX; x++)
        {
            if(!hasActiveTile(x, y)) continue;

            const tileH = getTileHeight(x, y) * PREVIEW_BLOCK_H;
            const cx = isoX(x, y);
            const cy = isoY(x, y) - tileH;

            // west wall (no tile to the left)
            if(!hasActiveTile(x - 1, y))
            {
                ctx.beginPath();
                ctx.moveTo(cx, cy + th);
                ctx.lineTo(cx, cy + th - wallH);
                ctx.lineTo(cx + tw, cy - wallH);
                ctx.lineTo(cx + tw, cy);
                ctx.closePath();
                ctx.fillStyle = WALL_SIDE_COLOR;
                ctx.fill();
                ctx.strokeStyle = '#4A5A3F';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // north wall (no tile above)
            if(!hasActiveTile(x, y - 1))
            {
                ctx.beginPath();
                ctx.moveTo(cx + tw, cy);
                ctx.lineTo(cx + tw, cy - wallH);
                ctx.lineTo(cx + tw * 2, cy + th - wallH);
                ctx.lineTo(cx + tw * 2, cy + th);
                ctx.closePath();
                ctx.fillStyle = WALL_COLOR;
                ctx.fill();
                ctx.strokeStyle = '#4A5A3F';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // wall top cap - corner
            if(!hasActiveTile(x - 1, y) && !hasActiveTile(x, y - 1))
            {
                ctx.beginPath();
                ctx.moveTo(cx + tw, cy - wallH);
                ctx.lineTo(cx + tw + tw * 0.3, cy - wallH - th * 0.3);
                ctx.lineTo(cx + tw, cy - wallH - th * 0.6);
                ctx.lineTo(cx + tw - tw * 0.3, cy - wallH - th * 0.3);
                ctx.closePath();
                ctx.fillStyle = WALL_TOP_COLOR;
                ctx.fill();
            }
        }
    }

    // draw tiles back-to-front
    for(let y = bounds.minY; y <= bounds.maxY; y++)
    {
        for(let x = bounds.minX; x <= bounds.maxX; x++)
        {
            if(!hasActiveTile(x, y)) continue;

            const tile = tilemap[y][x];
            const heightIndex = HEIGHT_SCHEME.indexOf(tile.height) - 1;
            const tileH = Math.max(0, heightIndex) * PREVIEW_BLOCK_H;

            const cx = isoX(x, y);
            const cy = isoY(x, y) - tileH;

            const heightChar = tile.height;
            const baseColor = colormap[heightChar] || 'aaaaaa';
            const topColor = `#${ baseColor }`;
            const leftColor = darken(baseColor, 0.65);
            const rightColor = darken(baseColor, 0.80);

            // draw side faces if tile has height
            const blockH = Math.max(0, heightIndex) * PREVIEW_BLOCK_H;

            // left face (visible when no neighbor to south or neighbor is shorter)
            const southH = getTileHeight(x, y + 1);
            const leftExpose = hasActiveTile(x, y + 1) ? Math.max(0, heightIndex - southH) * PREVIEW_BLOCK_H : blockH + PREVIEW_BLOCK_H;

            if(leftExpose > 0)
            {
                ctx.beginPath();
                ctx.moveTo(cx, cy + th);
                ctx.lineTo(cx + tw, cy + th * 2);
                ctx.lineTo(cx + tw, cy + th * 2 + leftExpose);
                ctx.lineTo(cx, cy + th + leftExpose);
                ctx.closePath();
                ctx.fillStyle = leftColor;
                ctx.fill();
            }

            // right face
            const eastH = getTileHeight(x + 1, y);
            const rightExpose = hasActiveTile(x + 1, y) ? Math.max(0, heightIndex - eastH) * PREVIEW_BLOCK_H : blockH + PREVIEW_BLOCK_H;

            if(rightExpose > 0)
            {
                ctx.beginPath();
                ctx.moveTo(cx + tw * 2, cy + th);
                ctx.lineTo(cx + tw, cy + th * 2);
                ctx.lineTo(cx + tw, cy + th * 2 + rightExpose);
                ctx.lineTo(cx + tw * 2, cy + th + rightExpose);
                ctx.closePath();
                ctx.fillStyle = rightColor;
                ctx.fill();
            }

            // top face
            ctx.beginPath();
            ctx.moveTo(cx + tw, cy);
            ctx.lineTo(cx + tw * 2, cy + th);
            ctx.lineTo(cx + tw, cy + th * 2);
            ctx.lineTo(cx, cy + th);
            ctx.closePath();
            ctx.fillStyle = topColor;
            ctx.fill();

            // door indicator
            const door = FloorplanEditor.instance.doorLocation;

            if(door.x === x && door.y === y)
            {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    ctx.restore();
}

export const FloorplanPreviewView: FC<{}> = () =>
{
    const { tilemapVersion, visualizationSettings } = useFloorplanEditorContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() =>
    {
        if(!canvasRef.current) return;

        if(rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() =>
        {
            const canvas = canvasRef.current;

            if(!canvas) return;

            const parent = canvas.parentElement;

            if(parent)
            {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            renderPreview(canvas, visualizationSettings?.wallHeight ?? 0);
        });

        return () =>
        {
            if(rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ tilemapVersion, visualizationSettings?.wallHeight ]);

    return (
        <div className="flex-1 relative rounded overflow-hidden border-2 border-muted" style={ { minHeight: 200, backgroundColor: '#1a1a1a' } }>
            <canvas
                ref={ canvasRef }
                className="w-full h-full"
            />
        </div>
    );
};
