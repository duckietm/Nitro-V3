export const HousekeepingErrorKey = {
    NONE: 'none',
    EMPTY_USERNAME: 'empty_username',
    INVALID_USER_ID: 'invalid_user_id',
    INVALID_ROOM_ID: 'invalid_room_id',
    INVALID_AMOUNT: 'invalid_amount',
    AMOUNT_TOO_LARGE: 'amount_too_large',
    EMPTY_REASON: 'empty_reason',
    INVALID_HOURS: 'invalid_hours',
    INVALID_RANK: 'invalid_rank'
} as const;

export type HousekeepingErrorKey = (typeof HousekeepingErrorKey)[keyof typeof HousekeepingErrorKey];

export const HK_MAX_GIVE_AMOUNT = 1_000_000_000;
export const HK_MAX_BAN_HOURS = 24 * 365 * 100;
export const HK_MIN_RANK = 1;
export const HK_MAX_RANK = 12;

export const validateUsername = (raw: string): HousekeepingErrorKey => {
    if (!raw || raw.trim().length === 0) return HousekeepingErrorKey.EMPTY_USERNAME;

    return HousekeepingErrorKey.NONE;
};

export const validatePositiveId = (raw: number, kind: 'user' | 'room'): HousekeepingErrorKey => {
    if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw <= 0) {
        return kind === 'user' ? HousekeepingErrorKey.INVALID_USER_ID : HousekeepingErrorKey.INVALID_ROOM_ID;
    }

    return HousekeepingErrorKey.NONE;
};

export const validateAmount = (raw: number): HousekeepingErrorKey => {
    if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw <= 0) return HousekeepingErrorKey.INVALID_AMOUNT;
    if (raw > HK_MAX_GIVE_AMOUNT) return HousekeepingErrorKey.AMOUNT_TOO_LARGE;

    return HousekeepingErrorKey.NONE;
};

export const validateReason = (raw: string): HousekeepingErrorKey => {
    if (!raw || raw.trim().length === 0) return HousekeepingErrorKey.EMPTY_REASON;

    return HousekeepingErrorKey.NONE;
};

export const validateBanHours = (raw: number): HousekeepingErrorKey => {
    if (!Number.isFinite(raw) || raw <= 0) return HousekeepingErrorKey.INVALID_HOURS;
    if (raw > HK_MAX_BAN_HOURS) return HousekeepingErrorKey.INVALID_HOURS;

    return HousekeepingErrorKey.NONE;
};

export const validateRank = (raw: number): HousekeepingErrorKey => {
    if (!Number.isFinite(raw) || !Number.isInteger(raw)) return HousekeepingErrorKey.INVALID_RANK;
    if (raw < HK_MIN_RANK || raw > HK_MAX_RANK) return HousekeepingErrorKey.INVALID_RANK;

    return HousekeepingErrorKey.NONE;
};
