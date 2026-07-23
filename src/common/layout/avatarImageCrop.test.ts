import { describe, expect, it } from 'vitest';
import { findOpaqueBounds, fitBoundsIntoSquare } from './avatarImageCrop';

describe('findOpaqueBounds', () =>
{
    it('returns the tight rectangle containing non-transparent pixels', () =>
    {
        const pixels = new Uint8ClampedArray(4 * 4 * 4);
        const setAlpha = (x: number, y: number) => { pixels[((y * 4) + x) * 4 + 3] = 255; };
        setAlpha(1, 1);
        setAlpha(2, 1);
        setAlpha(2, 3);

        expect(findOpaqueBounds(pixels, 4, 4)).toEqual({ x: 1, y: 1, width: 2, height: 3 });
    });

    it('returns the full image when every pixel is transparent', () =>
    {
        expect(findOpaqueBounds(new Uint8ClampedArray(3 * 2 * 4), 3, 2)).toEqual({ x: 0, y: 0, width: 3, height: 2 });
    });
});

describe('fitBoundsIntoSquare', () =>
{
    it('centers the cropped head in a 22px thumbnail without browser-side scaling', () =>
    {
        expect(fitBoundsIntoSquare({ x: 0, y: 0, width: 40, height: 20 }, 22, 1)).toEqual({ x: 1, y: 6, width: 20, height: 10 });
    });
});
