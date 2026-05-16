import { describe, expect, it } from 'vitest';
import { ColorUtils } from './ColorUtils';
import { FixedSizeStack } from './FixedSizeStack';
import { LocalizeFormattedNumber } from './LocalizeFormattedNumber';

describe('LocalizeFormattedNumber', () =>
{
    it('returns "0" for zero / NaN / null / undefined', () =>
    {
        expect(LocalizeFormattedNumber(0)).toBe('0');
        expect(LocalizeFormattedNumber(NaN)).toBe('0');
        expect(LocalizeFormattedNumber(null)).toBe('0');
        expect(LocalizeFormattedNumber(undefined as unknown as number)).toBe('0');
    });

    it('keeps numbers under 1000 unchanged', () =>
    {
        expect(LocalizeFormattedNumber(42)).toBe('42');
        expect(LocalizeFormattedNumber(999)).toBe('999');
    });

    it('inserts a thin space every 3 digits for >=1000', () =>
    {
        expect(LocalizeFormattedNumber(1000)).toBe('1 000');
        expect(LocalizeFormattedNumber(1_234_567)).toBe('1 234 567');
        expect(LocalizeFormattedNumber(10_000_000)).toBe('10 000 000');
    });
});

describe('ColorUtils', () =>
{
    describe('makeColorHex', () =>
    {
        it('prepends "#" to the given color string', () =>
        {
            expect(ColorUtils.makeColorHex('ff0000')).toBe('#ff0000');
            expect(ColorUtils.makeColorHex('abc')).toBe('#abc');
        });
    });

    describe('makeColorNumberHex', () =>
    {
        it('pads to 6 hex chars and prepends "#"', () =>
        {
            expect(ColorUtils.makeColorNumberHex(0xff0000)).toBe('#ff0000');
            expect(ColorUtils.makeColorNumberHex(0x00ff00)).toBe('#00ff00');
            expect(ColorUtils.makeColorNumberHex(0)).toBe('#000000');
        });

        it('pads short hex values with leading zeros', () =>
        {
            expect(ColorUtils.makeColorNumberHex(0xff)).toBe('#0000ff');
            expect(ColorUtils.makeColorNumberHex(1)).toBe('#000001');
        });
    });

    describe('convertFromHex', () =>
    {
        it('parses a "#"-prefixed hex string to a number', () =>
        {
            expect(ColorUtils.convertFromHex('#ff0000')).toBe(0xff0000);
            expect(ColorUtils.convertFromHex('#000000')).toBe(0);
            expect(ColorUtils.convertFromHex('#ffffff')).toBe(0xffffff);
        });

        it('also handles strings without the leading "#"', () =>
        {
            expect(ColorUtils.convertFromHex('00ff00')).toBe(0x00ff00);
        });
    });

    describe('int_to_8BitVals / eight_bitVals_to_int', () =>
    {
        it('roundtrips: int -> [a,r,g,b] -> int', () =>
        {
            const original = 0x12345678;
            const [ a, b, c, d ] = ColorUtils.int_to_8BitVals(original);
            expect(a).toBe(0x12);
            expect(b).toBe(0x34);
            expect(c).toBe(0x56);
            expect(d).toBe(0x78);
            expect(ColorUtils.eight_bitVals_to_int(a, b, c, d)).toBe(original);
        });

        it('roundtrips zero', () =>
        {
            const parts = ColorUtils.int_to_8BitVals(0);
            expect(parts).toEqual([ 0, 0, 0, 0 ]);
            expect(ColorUtils.eight_bitVals_to_int(0, 0, 0, 0)).toBe(0);
        });
    });

    describe('int2rgb', () =>
    {
        it('produces rgba(r,g,b,1) for an RGB integer', () =>
        {
            expect(ColorUtils.int2rgb(0xff0000)).toBe('rgba(255,0,0,1)');
            expect(ColorUtils.int2rgb(0x00ff00)).toBe('rgba(0,255,0,1)');
            expect(ColorUtils.int2rgb(0x0000ff)).toBe('rgba(0,0,255,1)');
        });

        it('returns black for 0', () =>
        {
            expect(ColorUtils.int2rgb(0)).toBe('rgba(0,0,0,1)');
        });
    });
});

describe('FixedSizeStack', () =>
{
    it('grows up to maxSize then overwrites the oldest entry', () =>
    {
        const stack = new FixedSizeStack(3);

        stack.addValue(10);
        stack.addValue(20);
        stack.addValue(30);

        expect(stack.getMax()).toBe(30);
        expect(stack.getMin()).toBe(10);

        // Capacity hit — 40 overwrites 10
        stack.addValue(40);
        expect(stack.getMin()).toBe(20);
        expect(stack.getMax()).toBe(40);

        // 50 overwrites 20
        stack.addValue(50);
        expect(stack.getMin()).toBe(30);
        expect(stack.getMax()).toBe(50);
    });

    it('reset clears all values', () =>
    {
        const stack = new FixedSizeStack(2);

        stack.addValue(100);
        stack.addValue(200);

        expect(stack.getMax()).toBe(200);

        stack.reset();

        stack.addValue(7);
        expect(stack.getMax()).toBe(7);
        expect(stack.getMin()).toBe(7);
    });

    it('getMax with maxSize > inserted entries returns the inserted value', () =>
    {
        // FixedSizeStack iterates the whole maxSize window but the
        // unfilled slots are `undefined` which fail `> currentMax`, so
        // the inserted value wins.
        const stack = new FixedSizeStack(5);
        stack.addValue(42);

        expect(stack.getMax()).toBe(42);
    });

    it('getMax on an empty stack returns Number.MIN_VALUE', () =>
    {
        const stack = new FixedSizeStack(3);
        expect(stack.getMax()).toBe(Number.MIN_VALUE);
    });
});
