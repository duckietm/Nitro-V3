import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RoomToolsWidgetView AIR toolbar', () => {
const source = readFileSync(join(process.cwd(), 'src/components/room/widgets/room-tools/RoomToolsWidgetView.tsx'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/css/room/RoomWidgets.css'), 'utf8');

    it('renders level controls and a collapsible side rail', () => {
        expect(source).toContain('room-tools-zoom-level');
        expect(source).toContain('room-tools-zoom-in');
        expect(source).toContain('room-tools-zoom-out');
        expect(source).toContain('nitro-room-tools-toggle');
    });

    it('keeps renderer zoom side effects outside React state updaters', () => {
        expect(source).not.toMatch(/setZoomLevel\s*\([^)]*=>[\s\S]{0,500}setRoomInstanceRenderingCanvasScale/);
        expect(source).toContain('stepRoomZoom(currentScale, direction)');
    });

    it('tracks zoom changes triggered outside the toolbar', () => {
        expect(source).toContain('RoomEngineEvent.ROOM_ZOOMED');
        expect(source).toContain('syncZoomLevel');
    });

    it('keeps the toolbar mounted while collapsing it', () => {
        expect(source).toContain('className="flex flex-col nitro-room-tools"');
        expect(source).not.toContain('initial={{ opacity: 0, x: -12 }}');
    });

    it('anchors the collapsed handle to the viewport edge', () => {
        expect(css).toMatch(/&\.is-collapsed\s+\.nitro-room-tools-rail\s*\{[^}]*width:\s*0;/s);
        expect(css).toMatch(/&\.is-collapsed\s+\.nitro-room-tools-toggle\s*\{[^}]*left:\s*0;/s);
    });
});
