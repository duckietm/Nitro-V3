import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FloorplanTile } from './FloorplanTile';

const svg = (children: React.ReactNode) => <svg>{children}</svg>;

describe('FloorplanTile', () => {
    it('renders nothing for blocked tile by default', () => {
        const { container } = render(svg(<FloorplanTile row={0} col={0} tile={{ h: 0, blocked: true }} selected={false} isDoor={false} />));
        expect(container.querySelector('polygon')).toBeNull();
    });

    it('renders a polygon for non-blocked tile', () => {
        const { container } = render(svg(<FloorplanTile row={0} col={0} tile={{ h: 3, blocked: false }} selected={false} isDoor={false} />));
        const poly = container.querySelector('polygon');
        expect(poly).toBeTruthy();
        expect(poly?.getAttribute('fill')).toMatch(/^#/);
        expect(poly?.getAttribute('points')?.split(' ')).toHaveLength(4);
    });

    it('renders a door marker when isDoor=true', () => {
        const { container } = render(svg(<FloorplanTile row={1} col={1} tile={{ h: 0, blocked: false }} selected={false} isDoor={true} />));
        expect(container.querySelector('[data-testid="door-marker"]')).toBeTruthy();
    });

    it('applies selection ring when selected', () => {
        const { container } = render(svg(<FloorplanTile row={0} col={0} tile={{ h: 0, blocked: false }} selected={true} isDoor={false} />));
        expect(container.querySelector('[data-testid="selection-ring"]')).toBeTruthy();
    });

    it('renders south + west side walls when h > neighbour heights', () => {
        const { container } = render(
            svg(<FloorplanTile row={0} col={0} tile={{ h: 4, blocked: false }} selected={false} isDoor={false} southH={0} westH={0} />)
        );
        expect(container.querySelector('[data-testid="tile-south-wall"]')).toBeTruthy();
        expect(container.querySelector('[data-testid="tile-west-wall"]')).toBeTruthy();
    });

    it('omits south wall when south neighbour is at or above the tile height', () => {
        const { container } = render(
            svg(<FloorplanTile row={0} col={0} tile={{ h: 3, blocked: false }} selected={false} isDoor={false} southH={3} westH={0} />)
        );
        expect(container.querySelector('[data-testid="tile-south-wall"]')).toBeNull();
        expect(container.querySelector('[data-testid="tile-west-wall"]')).toBeTruthy();
    });

    it('omits all walls for ground-level tiles', () => {
        const { container } = render(
            svg(<FloorplanTile row={0} col={0} tile={{ h: 0, blocked: false }} selected={false} isDoor={false} southH={0} westH={0} />)
        );
        expect(container.querySelector('[data-testid="tile-south-wall"]')).toBeNull();
        expect(container.querySelector('[data-testid="tile-west-wall"]')).toBeNull();
    });
});
