export const HousekeepingSanctionType = {
    BAN: 'ban',
    MUTE: 'mute',
    KICK: 'kick',
    TRADE_LOCK: 'trade_lock'
} as const;

export type HousekeepingSanctionType = (typeof HousekeepingSanctionType)[keyof typeof HousekeepingSanctionType];

export interface HousekeepingSanctionTemplate {
    id: string;
    /** Display name (LocalizeText key OR plain label fallback). */
    name: string;
    type: HousekeepingSanctionType;
    /** Duration in hours for BAN / TRADE_LOCK, minutes for MUTE; ignored for KICK. */
    durationValue: number;
    /** Pre-canned reason — overridable from the UI textarea. */
    defaultReason: string;
}

/**
 * Pre-canned sanction shortcuts. Lifted from the shape of mod-tools'
 * `MOD_ACTION_DEFINITIONS` (see `ModActionDefinition.ts`) but
 * simplified — HK doesn't need the CFH topic / sanctionTypeId
 * indirection because the HK HTTP API takes plain `(userId, reason,
 * duration)` triples.
 *
 * Operators that need different presets can mirror this file and
 * inject through the UI config layer down the road; for now keep
 * a flat default set covering the common cases.
 */
export const HK_SANCTION_TEMPLATES: HousekeepingSanctionTemplate[] = [
    { id: 'kick', name: 'Kick', type: HousekeepingSanctionType.KICK, durationValue: 0, defaultReason: 'Removed from session' },
    { id: 'mute_5m', name: 'Mute 5m', type: HousekeepingSanctionType.MUTE, durationValue: 5, defaultReason: 'Cool down — chat flood' },
    { id: 'mute_60m', name: 'Mute 60m', type: HousekeepingSanctionType.MUTE, durationValue: 60, defaultReason: 'Mute — repeat offender' },
    { id: 'ban_1h', name: 'Ban 1h', type: HousekeepingSanctionType.BAN, durationValue: 1, defaultReason: 'Temporary ban — rule violation' },
    { id: 'ban_24h', name: 'Ban 24h', type: HousekeepingSanctionType.BAN, durationValue: 24, defaultReason: '24h ban — rule violation' },
    { id: 'ban_7d', name: 'Ban 7d', type: HousekeepingSanctionType.BAN, durationValue: 168, defaultReason: '7-day ban — serious violation' },
    { id: 'ban_30d', name: 'Ban 30d', type: HousekeepingSanctionType.BAN, durationValue: 720, defaultReason: '30-day ban — final warning' },
    { id: 'ban_perm', name: 'Ban permanent', type: HousekeepingSanctionType.BAN, durationValue: 24 * 365 * 100, defaultReason: 'Permanent ban' },
    { id: 'tlock_7d', name: 'Trade lock 7d', type: HousekeepingSanctionType.TRADE_LOCK, durationValue: 168, defaultReason: 'Trade lock — suspected scam' },
    {
        id: 'tlock_perm',
        name: 'Trade lock perm',
        type: HousekeepingSanctionType.TRADE_LOCK,
        durationValue: 24 * 365 * 100,
        defaultReason: 'Permanent trade lock'
    }
];

export const findTemplateById = (id: string): HousekeepingSanctionTemplate | null => HK_SANCTION_TEMPLATES.find((t) => t.id === id) ?? null;

export const templatesByType = (type: HousekeepingSanctionType): HousekeepingSanctionTemplate[] => HK_SANCTION_TEMPLATES.filter((t) => t.type === type);
