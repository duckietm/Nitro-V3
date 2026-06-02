import { describe, expect, it } from 'vitest';
import { CREDITS_RARE_THRESHOLD, getPrizeTier, POINTS_RARE_THRESHOLD } from './wheelPrizeTier';

const makePrize = (overrides: Partial<{ type: string; amount: number }>) => ({
    id: 1,
    type: 'credits',
    spriteId: 0,
    badgeCode: '',
    amount: 0,
    pointsType: -1,
    label: '',
    ...overrides
}) as any;

describe('getPrizeTier', () =>
{
    it('returns "common" for a null prize (defensive default)', () =>
    {
        expect(getPrizeTier(null)).toBe('common');
    });

    it('classifies the "nothing" slice as "none"', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'nothing' }))).toBe('none');
    });

    it('classifies items and badges as "rare"', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'item' }))).toBe('rare');
        expect(getPrizeTier(makePrize({ type: 'badge' }))).toBe('rare');
    });

    it('classifies a free spin as "common"', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'spin', amount: 1 }))).toBe('common');
    });

    it('tiers credits by the threshold', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'credits', amount: CREDITS_RARE_THRESHOLD - 1 }))).toBe('common');
        expect(getPrizeTier(makePrize({ type: 'credits', amount: CREDITS_RARE_THRESHOLD }))).toBe('rare');
        expect(getPrizeTier(makePrize({ type: 'credits', amount: CREDITS_RARE_THRESHOLD + 1000 }))).toBe('rare');
    });

    it('tiers points by the threshold', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'points', amount: POINTS_RARE_THRESHOLD - 1 }))).toBe('common');
        expect(getPrizeTier(makePrize({ type: 'points', amount: POINTS_RARE_THRESHOLD }))).toBe('rare');
    });

    it('falls back to "common" for unknown prize types', () =>
    {
        expect(getPrizeTier(makePrize({ type: 'mystery-future-type' }))).toBe('common');
    });
});
