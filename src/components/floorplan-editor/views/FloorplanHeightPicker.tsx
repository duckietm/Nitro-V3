import { FC, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HEIGHT_BRUSH_MAX, HEIGHT_BRUSH_MIN } from '../state/constants';
import { tileFill } from '../state/selectors';

type Props = {
    selectedH: number;
    onSelect: (h: number) => void;
};

const TRACK_W = 18;
const TRACK_H = 260;
const THUMB_DIAM = 28;
const RAIL_GUTTER = 4;

const isLightColor = (hex: string): boolean => {
    const c = hex.replace('#', '');

    if (c.length !== 6) return true;

    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    return luma > 160;
};

export const FloorplanHeightPicker: FC<Props> = ({ selectedH, onSelect }) => {
    const count = HEIGHT_BRUSH_MAX - HEIGHT_BRUSH_MIN + 1;
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const gradient = useMemo(() => {
        const stops: string[] = [];
        for (let i = 0; i < count; i++) {
            const h = HEIGHT_BRUSH_MAX - i;
            const fill = tileFill({ h, blocked: false });
            const startPct = (i / count) * 100;
            const endPct = ((i + 1) / count) * 100;

            stops.push(`${fill} ${startPct.toFixed(2)}%`);
            stops.push(`${fill} ${endPct.toFixed(2)}%`);
        }

        return `linear-gradient(to bottom, ${stops.join(', ')})`;
    }, [count]);

    const heightFromClientY = useCallback(
        (clientY: number): number | null => {
            const track = trackRef.current;

            if (!track) return null;

            const rect = track.getBoundingClientRect();

            if (rect.height === 0) return null;

            const local = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
            const idx = Math.round(local * (count - 1));

            return HEIGHT_BRUSH_MAX - idx;
        },
        [count]
    );

    const onPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (e.button !== 0) return;

            const next = heightFromClientY(e.clientY);

            if (next !== null && next !== selectedH) onSelect(next);

            setIsDragging(true);
        },
        [heightFromClientY, onSelect, selectedH]
    );

    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e: PointerEvent) => {
            const next = heightFromClientY(e.clientY);
            if (next !== null && next !== selectedH) onSelect(next);
        };
        const onUp = () => setIsDragging(false);

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [isDragging, heightFromClientY, onSelect, selectedH]);

    const thumbPct = ((HEIGHT_BRUSH_MAX - selectedH) / (count - 1)) * 100;
    const thumbColor = tileFill({ h: selectedH, blocked: false });
    const thumbTextDark = isLightColor(thumbColor);

    return (
        <div
            className="relative shrink-0 select-none touch-none flex flex-col items-center"
            style={{ width: THUMB_DIAM + RAIL_GUTTER * 2, height: TRACK_H + 32 }}
            role="slider"
            aria-label="Brush height"
            aria-valuemin={HEIGHT_BRUSH_MIN}
            aria-valuemax={HEIGHT_BRUSH_MAX}
            aria-valuenow={selectedH}
        >
            <span className="text-[9px] font-bold tabular-nums text-zinc-500 leading-none mb-1">{HEIGHT_BRUSH_MAX}</span>
            <div className="relative flex-1" style={{ width: THUMB_DIAM }}>
                <div
                    ref={trackRef}
                    data-testid="height-track"
                    className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 rounded-full border border-zinc-400 cursor-pointer overflow-hidden transition-shadow ${isHovering || isDragging ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4),0_0_0_2px_rgba(250,204,21,0.35)]' : 'shadow-inner'}`}
                    style={{
                        width: TRACK_W,
                        background: gradient
                    }}
                    onPointerDown={onPointerDown}
                    onPointerEnter={() => setIsHovering(true)}
                    onPointerLeave={() => setIsHovering(false)}
                />
                <div
                    data-testid="height-thumb"
                    data-thumb-color={thumbColor}
                    className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums pointer-events-none transition-[box-shadow,transform] ${thumbTextDark ? 'text-zinc-900' : 'text-white'} ${isDragging ? 'ring-2 ring-zinc-900 scale-110' : isHovering ? 'ring-2 ring-white' : ''}`}
                    style={{
                        width: THUMB_DIAM,
                        height: THUMB_DIAM,
                        top: `${thumbPct}%`,
                        background: `radial-gradient(circle at 32% 28%, ${thumbTextDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.55)'} 0%, ${thumbColor} 45%, ${thumbColor} 78%, rgba(0, 0, 0, 0.25) 100%)`,
                        border: '2px solid rgba(0, 0, 0, 0.55)',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35), inset 0 -2px 3px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                        textShadow: thumbTextDark ? '0 1px 0 rgba(255, 255, 255, 0.6)' : '0 1px 1px rgba(0, 0, 0, 0.55)'
                    }}
                >
                    {selectedH}
                </div>
            </div>
            <span className="text-[9px] font-bold tabular-nums text-zinc-500 leading-none mt-1">{HEIGHT_BRUSH_MIN}</span>
        </div>
    );
};
