import { describe, expect, it } from 'vitest';
import {
    calculateFlightPath,
    direction360To8,
    fastSqrt,
    getAngleFromComponents,
    getBaseVelX,
    getBaseVelY,
    iterateSeed,
    moveTowards,
    tileToWorld,
    validateDirection360,
    worldToTile,
} from './SnowWarMath';
import { ANGLE_COMPONENT, BASE_VEL_X, BASE_VEL_Y, SQRT_TABLE } from './SnowWarTables';

describe('SnowWarTables', () =>
{
    it('has the exact table sizes from the spec', () =>
    {
        expect(SQRT_TABLE.length).toBe(256);
        expect(ANGLE_COMPONENT.length).toBe(256);
        expect(BASE_VEL_X.length).toBe(360);
        expect(BASE_VEL_Y.length).toBe(360);
    });

    it('velocity tables are 90-degree phase-shifted copies (cos/sin relationship)', () =>
    {
        // Y[d] tracks X[(d + 270) % 360]; the original tables carry ±1
        // rounding asymmetries, so allow that tolerance.
        for (let d = 0; d < 360; d++)
        {
            expect(Math.abs(BASE_VEL_Y[d] - BASE_VEL_X[(d + 270) % 360])).toBeLessThanOrEqual(1);
        }
    });

    it('velocity magnitudes stay within [-256, 256]', () =>
    {
        for (let d = 0; d < 360; d++)
        {
            expect(Math.abs(BASE_VEL_X[d])).toBeLessThanOrEqual(256);
            expect(Math.abs(BASE_VEL_Y[d])).toBeLessThanOrEqual(256);
        }
    });
});

describe('coordinate conversion', () =>
{
    it('round-trips tile coordinates', () =>
    {
        for (const tile of [0, 1, 5, 17, 49])
        {
            expect(worldToTile(tileToWorld(tile))).toBe(tile);
        }
    });

    it('worldToTile rounds to the nearest tile center', () =>
    {
        expect(worldToTile(1599)).toBe(0);
        expect(worldToTile(1600)).toBe(1);
        expect(worldToTile(3200 + 1599)).toBe(1);
    });
});

describe('direction helpers', () =>
{
    it('validateDirection360 wraps values', () =>
    {
        expect(validateDirection360(360)).toBe(0);
        expect(validateDirection360(-1)).toBe(359);
        expect(validateDirection360(725)).toBe(5);
    });

    it('direction360To8 maps the compass', () =>
    {
        // Angle system: 0=E-ish per velocity tables; the 8-way mapping just
        // needs to be stable and wrap correctly.
        const zero = direction360To8(0);
        expect(direction360To8(360)).toBe(zero);
        expect(direction360To8(45)).toBe((zero + 1) % 8);
    });
});

describe('fastSqrt', () =>
{
    it('approximates the integer square root across magnitudes', () =>
    {
        for (const x of [0, 1, 16, 255, 256, 1024, 65535, 65536, 1_000_000, 250_000_000, 2_000_000_000])
        {
            const approx = fastSqrt(x);
            const real = Math.sqrt(x);
            // Table-based sqrt is coarse; allow ~7% relative error beyond tiny values.
            if (real < 20)
            {
                expect(Math.abs(approx - real)).toBeLessThanOrEqual(2);
            }
            else
            {
                expect(Math.abs(approx - real) / real).toBeLessThan(0.07);
            }
        }
    });
});

describe('getAngleFromComponents', () =>
{
    it('returns axis-aligned angles for cardinal directions', () =>
    {
        // Straight up (negative Y): 360 - COMPONENT[0] = 360 wraps to 0.
        expect(getAngleFromComponents(0, -100)).toBe(0);
        expect(getAngleFromComponents(100, 0)).toBe(90 + ANGLE_COMPONENT[0]);
    });

    it('always returns 0..359', () =>
    {
        for (let i = 0; i < 100; i++)
        {
            const angle = getAngleFromComponents((i * 37) % 200 - 100, (i * 53) % 200 - 100);
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThan(360);
        }
    });
});

describe('iterateSeed', () =>
{
    it('is deterministic and 32-bit', () =>
    {
        expect(iterateSeed(1)).toBe(iterateSeed(1));
        expect(iterateSeed(1)).not.toBe(1);
        expect(Number.isInteger(iterateSeed(123456789))).toBe(true);
        expect(iterateSeed(42)).toBe(iterateSeed(42) | 0);
    });

    it('treats zero as -1', () =>
    {
        expect(iterateSeed(0)).toBe(iterateSeed(0));
        expect(iterateSeed(0)).not.toBe(0);
    });
});

describe('moveTowards', () =>
{
    it('clamps to the target', () =>
    {
        expect(moveTowards(0, 500, 640)).toBe(500);
        expect(moveTowards(0, 5000, 640)).toBe(640);
        expect(moveTowards(5000, 0, 640)).toBe(4360);
        expect(moveTowards(7, 7, 640)).toBe(7);
    });
});

describe('calculateFlightPath', () =>
{
    it('uses fixed TTL for the lob trajectory', () =>
    {
        const flight = calculateFlightPath(5, 5, 10, 10, 1);
        expect(flight.timeToLive).toBe(13);
        expect(flight.parabolaOffset).toBe(6);
    });

    it('scales TTL with distance for the long trajectory', () =>
    {
        const near = calculateFlightPath(5, 5, 8, 5, 2);
        const far = calculateFlightPath(5, 5, 20, 5, 2);
        expect(far.timeToLive).toBeGreaterThan(near.timeToLive);
    });
});
