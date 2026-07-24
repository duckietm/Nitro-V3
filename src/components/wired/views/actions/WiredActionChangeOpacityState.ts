import { FURNI_SOURCES, USER_SOURCES } from '../WiredSourcesSelector';

export const WIRED_OPACITY_VISIBILITY_SOURCE_USERS = 0;
export const WIRED_OPACITY_VISIBILITY_EVERYONE = 1;
export const WIRED_OPACITY_EASING_INSTANT = 0;
export const WIRED_OPACITY_MINIMUM = 0;
export const WIRED_OPACITY_MAXIMUM = 100;
export const WIRED_OPACITY_MINIMUM_DURATION = 1;
export const WIRED_OPACITY_MAXIMUM_DURATION = 10;
// 0 = server default transition (400 ms); explicit 1-10 s still supported.
export const WIRED_OPACITY_DEFAULT_DURATION = 0;
export const WIRED_OPACITY_SELECTED_FURNI_SOURCE = 100;
export const WIRED_OPACITY_TRIGGER_USER_SOURCE = 0;

export interface WiredActionChangeOpacityState {
    visibility: number;
    opacity: number;
    easing: number;
    duration: number;
    furniSource: number;
    userSource: number;
    clickThrough: boolean;
}

const clampInteger = (value: number, minimum: number, maximum: number) => {
    const normalized = Number.isFinite(value) ? Math.round(value) : minimum;

    return Math.min(maximum, Math.max(minimum, normalized));
};

const hasSource = (options: { value: number }[], value: number) => options.some((option) => option.value === value);

const normalizeDuration = (value: number) => {
    const normalized = Number.isFinite(value) ? Math.round(value) : WIRED_OPACITY_DEFAULT_DURATION;

    if (normalized <= WIRED_OPACITY_DEFAULT_DURATION) return WIRED_OPACITY_DEFAULT_DURATION;

    return Math.min(WIRED_OPACITY_MAXIMUM_DURATION, Math.max(WIRED_OPACITY_MINIMUM_DURATION, normalized));
};

export const normalizeWiredActionChangeOpacity = (intData: readonly number[] = []): WiredActionChangeOpacityState => ({
    visibility: intData[0] === WIRED_OPACITY_VISIBILITY_EVERYONE ? WIRED_OPACITY_VISIBILITY_EVERYONE : WIRED_OPACITY_VISIBILITY_SOURCE_USERS,
    opacity: clampInteger(intData[1] ?? WIRED_OPACITY_MAXIMUM, WIRED_OPACITY_MINIMUM, WIRED_OPACITY_MAXIMUM),
    easing: clampInteger(intData[2] ?? WIRED_OPACITY_EASING_INSTANT, 0, 4),
    duration: normalizeDuration(intData[3] ?? WIRED_OPACITY_DEFAULT_DURATION),
    furniSource: hasSource(FURNI_SOURCES, intData[4]) ? intData[4] : WIRED_OPACITY_SELECTED_FURNI_SOURCE,
    userSource: hasSource(USER_SOURCES, intData[5]) ? intData[5] : WIRED_OPACITY_TRIGGER_USER_SOURCE,
    clickThrough: intData[6] === 1
});

export const serializeWiredActionChangeOpacity = (state: WiredActionChangeOpacityState) => {
    const normalized = normalizeWiredActionChangeOpacity([
        state.visibility,
        state.opacity,
        state.easing,
        state.duration,
        state.furniSource,
        state.userSource,
        state.clickThrough ? 1 : 0
    ]);

    return [
        normalized.visibility,
        normalized.opacity,
        normalized.easing,
        normalized.duration,
        normalized.furniSource,
        normalized.userSource,
        normalized.clickThrough ? 1 : 0
    ];
};
