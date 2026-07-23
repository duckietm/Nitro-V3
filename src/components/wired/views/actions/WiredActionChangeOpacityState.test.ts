import { describe, expect, it } from 'vitest';
import {
    normalizeWiredActionChangeOpacity,
    serializeWiredActionChangeOpacity,
    WIRED_OPACITY_DEFAULT_DURATION,
    WIRED_OPACITY_EASING_INSTANT,
    WIRED_OPACITY_MAXIMUM,
    WIRED_OPACITY_SELECTED_FURNI_SOURCE,
    WIRED_OPACITY_TRIGGER_USER_SOURCE,
    WIRED_OPACITY_VISIBILITY_SOURCE_USERS
} from './WiredActionChangeOpacityState';

describe('WiredActionChangeOpacityState', () => {
    it('uses conservative defaults for a legacy empty payload', () => {
        expect(normalizeWiredActionChangeOpacity()).toEqual({
            visibility: WIRED_OPACITY_VISIBILITY_SOURCE_USERS,
            opacity: WIRED_OPACITY_MAXIMUM,
            easing: WIRED_OPACITY_EASING_INSTANT,
            duration: WIRED_OPACITY_DEFAULT_DURATION,
            furniSource: WIRED_OPACITY_SELECTED_FURNI_SOURCE,
            userSource: WIRED_OPACITY_TRIGGER_USER_SOURCE,
            clickThrough: false
        });
    });

    it('clamps malformed numeric input and rejects unsupported sources', () => {
        expect(normalizeWiredActionChangeOpacity([99, -12, 90, 44, 999, -8, 7])).toEqual({
            visibility: WIRED_OPACITY_VISIBILITY_SOURCE_USERS,
            opacity: 0,
            easing: 4,
            duration: 10,
            furniSource: WIRED_OPACITY_SELECTED_FURNI_SOURCE,
            userSource: WIRED_OPACITY_TRIGGER_USER_SOURCE,
            clickThrough: false
        });
    });

    it('preserves every valid server parameter in wire order', () => {
        expect(normalizeWiredActionChangeOpacity([1, 35, 3, 7, 200, 201, 1])).toEqual({
            visibility: 1,
            opacity: 35,
            easing: 3,
            duration: 7,
            furniSource: 200,
            userSource: 201,
            clickThrough: true
        });
    });

    it('normalizes state again when serializing the seven-value payload', () => {
        expect(
            serializeWiredActionChangeOpacity({
                visibility: 1,
                opacity: 51.8,
                easing: 2,
                duration: Number.NaN,
                furniSource: 100,
                userSource: 0,
                clickThrough: true
            })
        ).toEqual([1, 52, 2, WIRED_OPACITY_DEFAULT_DURATION, 100, 0, 1]);
    });

    it('keeps duration 0 as the server-default transition and floors negatives to it', () => {
        expect(normalizeWiredActionChangeOpacity([0, 100, 2, 0, 100, 0, 0]).duration).toBe(WIRED_OPACITY_DEFAULT_DURATION);
        expect(normalizeWiredActionChangeOpacity([0, 100, 2, -3, 100, 0, 0]).duration).toBe(WIRED_OPACITY_DEFAULT_DURATION);
        expect(normalizeWiredActionChangeOpacity([0, 100, 2, 7, 100, 0, 0]).duration).toBe(7);
    });
});
