import { describe, expect, it } from 'vitest';
import { getRemainingCooldownSeconds, shouldStartOwnCooldown } from './soundboardUi.helpers';

describe('soundboard UI helpers', () => {
    it('rounds a partial remaining second up', () => {
        expect(getRemainingCooldownSeconds(61_001, 2_000)).toBe(60);
    });

    it('returns zero when the cooldown has expired', () => {
        expect(getRemainingCooldownSeconds(2_000, 2_000)).toBe(0);
        expect(getRemainingCooldownSeconds(1_000, 2_000)).toBe(0);
    });

    it('starts cooldown only for the local account', () => {
        expect(shouldStartOwnCooldown(42, 42)).toBe(true);
        expect(shouldStartOwnCooldown(42, 7)).toBe(false);
        expect(shouldStartOwnCooldown(-1, -1)).toBe(false);
    });
});
