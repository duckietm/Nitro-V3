import { describe, expect, it } from 'vitest';
import {
    HK_MAX_BAN_HOURS, HK_MAX_GIVE_AMOUNT, HK_MAX_RANK, HK_MIN_RANK, HousekeepingErrorKey,
    validateAmount, validateBanHours, validatePositiveId, validateRank, validateReason, validateUsername
} from './HousekeepingValidation';

describe('validateUsername', () =>
{
    it('rejects empty / whitespace-only input', () =>
    {
        expect(validateUsername('')).toBe(HousekeepingErrorKey.EMPTY_USERNAME);
        expect(validateUsername('   ')).toBe(HousekeepingErrorKey.EMPTY_USERNAME);
        expect(validateUsername(null)).toBe(HousekeepingErrorKey.EMPTY_USERNAME);
    });

    it('accepts any non-empty trimmed value (server is source of truth for valid chars)', () =>
    {
        expect(validateUsername('alice')).toBe(HousekeepingErrorKey.NONE);
        expect(validateUsername(' Bob ')).toBe(HousekeepingErrorKey.NONE);
    });
});

describe('validatePositiveId', () =>
{
    it('rejects non-positive / non-integer / NaN / non-finite', () =>
    {
        expect(validatePositiveId(0, 'user')).toBe(HousekeepingErrorKey.INVALID_USER_ID);
        expect(validatePositiveId(-1, 'user')).toBe(HousekeepingErrorKey.INVALID_USER_ID);
        expect(validatePositiveId(1.5, 'user')).toBe(HousekeepingErrorKey.INVALID_USER_ID);
        expect(validatePositiveId(NaN, 'user')).toBe(HousekeepingErrorKey.INVALID_USER_ID);
        expect(validatePositiveId(Infinity, 'user')).toBe(HousekeepingErrorKey.INVALID_USER_ID);
    });

    it('emits INVALID_ROOM_ID for the room kind', () =>
    {
        expect(validatePositiveId(0, 'room')).toBe(HousekeepingErrorKey.INVALID_ROOM_ID);
        expect(validatePositiveId(-2, 'room')).toBe(HousekeepingErrorKey.INVALID_ROOM_ID);
    });

    it('accepts positive integers', () =>
    {
        expect(validatePositiveId(1, 'user')).toBe(HousekeepingErrorKey.NONE);
        expect(validatePositiveId(99999, 'room')).toBe(HousekeepingErrorKey.NONE);
    });
});

describe('validateAmount', () =>
{
    it('rejects non-positive / non-integer / non-finite', () =>
    {
        expect(validateAmount(0)).toBe(HousekeepingErrorKey.INVALID_AMOUNT);
        expect(validateAmount(-5)).toBe(HousekeepingErrorKey.INVALID_AMOUNT);
        expect(validateAmount(1.5)).toBe(HousekeepingErrorKey.INVALID_AMOUNT);
        expect(validateAmount(NaN)).toBe(HousekeepingErrorKey.INVALID_AMOUNT);
        expect(validateAmount(Infinity)).toBe(HousekeepingErrorKey.INVALID_AMOUNT);
    });

    it('rejects amounts above the cap', () =>
    {
        expect(validateAmount(HK_MAX_GIVE_AMOUNT + 1)).toBe(HousekeepingErrorKey.AMOUNT_TOO_LARGE);
    });

    it('accepts the cap itself and any positive integer below it', () =>
    {
        expect(validateAmount(1)).toBe(HousekeepingErrorKey.NONE);
        expect(validateAmount(1000)).toBe(HousekeepingErrorKey.NONE);
        expect(validateAmount(HK_MAX_GIVE_AMOUNT)).toBe(HousekeepingErrorKey.NONE);
    });
});

describe('validateReason', () =>
{
    it('rejects empty / whitespace-only', () =>
    {
        expect(validateReason('')).toBe(HousekeepingErrorKey.EMPTY_REASON);
        expect(validateReason('   ')).toBe(HousekeepingErrorKey.EMPTY_REASON);
        expect(validateReason(null)).toBe(HousekeepingErrorKey.EMPTY_REASON);
    });

    it('accepts any non-empty reason', () =>
    {
        expect(validateReason('spam')).toBe(HousekeepingErrorKey.NONE);
    });
});

describe('validateBanHours', () =>
{
    it('rejects non-positive / non-finite', () =>
    {
        expect(validateBanHours(0)).toBe(HousekeepingErrorKey.INVALID_HOURS);
        expect(validateBanHours(-1)).toBe(HousekeepingErrorKey.INVALID_HOURS);
        expect(validateBanHours(NaN)).toBe(HousekeepingErrorKey.INVALID_HOURS);
        expect(validateBanHours(Infinity)).toBe(HousekeepingErrorKey.INVALID_HOURS);
    });

    it('rejects values above the 100-year cap', () =>
    {
        expect(validateBanHours(HK_MAX_BAN_HOURS + 1)).toBe(HousekeepingErrorKey.INVALID_HOURS);
    });

    it('accepts the cap and any positive value below it (fractional included — minutes / partial hours)', () =>
    {
        expect(validateBanHours(1)).toBe(HousekeepingErrorKey.NONE);
        expect(validateBanHours(0.5)).toBe(HousekeepingErrorKey.NONE);
        expect(validateBanHours(HK_MAX_BAN_HOURS)).toBe(HousekeepingErrorKey.NONE);
    });
});

describe('validateRank', () =>
{
    it('rejects out-of-range values (sub-min, above-max, non-integer, non-finite)', () =>
    {
        expect(validateRank(HK_MIN_RANK - 1)).toBe(HousekeepingErrorKey.INVALID_RANK);
        expect(validateRank(HK_MAX_RANK + 1)).toBe(HousekeepingErrorKey.INVALID_RANK);
        expect(validateRank(1.5)).toBe(HousekeepingErrorKey.INVALID_RANK);
        expect(validateRank(NaN)).toBe(HousekeepingErrorKey.INVALID_RANK);
    });

    it('accepts boundary values', () =>
    {
        expect(validateRank(HK_MIN_RANK)).toBe(HousekeepingErrorKey.NONE);
        expect(validateRank(HK_MAX_RANK)).toBe(HousekeepingErrorKey.NONE);
        expect(validateRank(5)).toBe(HousekeepingErrorKey.NONE);
    });
});
