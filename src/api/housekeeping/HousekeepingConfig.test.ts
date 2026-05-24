import { describe, expect, it } from 'vitest';
import { HousekeepingTabId } from './HousekeepingActionType';
import { housekeepingTabsForMode, isHousekeepingTabAvailable, resolveHousekeepingMode } from './HousekeepingConfig';

describe('resolveHousekeepingMode', () =>
{
    it('returns "light" only for the exact "light" string', () =>
    {
        expect(resolveHousekeepingMode('light')).toBe('light');
    });

    it('falls back to "full" for any other value (unknown strings, typos, non-strings)', () =>
    {
        expect(resolveHousekeepingMode('full')).toBe('full');
        expect(resolveHousekeepingMode('FULL')).toBe('full');
        expect(resolveHousekeepingMode('Light')).toBe('full');
        expect(resolveHousekeepingMode('')).toBe('full');
        expect(resolveHousekeepingMode(undefined)).toBe('full');
        expect(resolveHousekeepingMode(null)).toBe('full');
        expect(resolveHousekeepingMode(42)).toBe('full');
        expect(resolveHousekeepingMode({})).toBe('full');
    });
});

describe('isHousekeepingTabAvailable', () =>
{
    it('exposes every tab in full mode', () =>
    {
        expect(isHousekeepingTabAvailable(HousekeepingTabId.DASHBOARD, 'full')).toBe(true);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.USERS, 'full')).toBe(true);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.ROOMS, 'full')).toBe(true);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.ECONOMY, 'full')).toBe(true);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.AUDIT, 'full')).toBe(true);
    });

    it('exposes only Users + Rooms in light mode', () =>
    {
        expect(isHousekeepingTabAvailable(HousekeepingTabId.USERS, 'light')).toBe(true);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.ROOMS, 'light')).toBe(true);

        expect(isHousekeepingTabAvailable(HousekeepingTabId.DASHBOARD, 'light')).toBe(false);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.ECONOMY, 'light')).toBe(false);
        expect(isHousekeepingTabAvailable(HousekeepingTabId.AUDIT, 'light')).toBe(false);
    });
});

describe('housekeepingTabsForMode', () =>
{
    it('returns the full ordered tab list in full mode', () =>
    {
        expect(housekeepingTabsForMode('full')).toEqual([
            HousekeepingTabId.DASHBOARD,
            HousekeepingTabId.USERS,
            HousekeepingTabId.ROOMS,
            HousekeepingTabId.ECONOMY,
            HousekeepingTabId.AUDIT
        ]);
    });

    it('returns Users + Rooms (in that order) for light mode', () =>
    {
        expect(housekeepingTabsForMode('light')).toEqual([
            HousekeepingTabId.USERS,
            HousekeepingTabId.ROOMS
        ]);
    });
});
