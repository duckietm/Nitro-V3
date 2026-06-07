// Date/time helpers for the mentions box. Kept framework-free and pure so they
// are unit-testable. Timestamps are unix SECONDS (as carried on the wire).

export type MentionDateGroup = 'today' | 'yesterday' | 'older';

const DAY_MS = 86_400_000;

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const pad = (n: number): string => (n < 10 ? `0${ n }` : `${ n }`);

/**
 * Bucket a mention timestamp into today / yesterday / older relative to `now`.
 */
export const getMentionDateGroup = (timestampSeconds: number, now: Date = new Date()): MentionDateGroup =>
{
    if(!timestampSeconds || timestampSeconds <= 0) return 'older';

    const ts = timestampSeconds * 1000;
    const todayStart = startOfDay(now);

    if(ts >= todayStart) return 'today';
    if(ts >= (todayStart - DAY_MS)) return 'yesterday';

    return 'older';
};

/**
 * Compact per-row time label: HH:MM for today/yesterday (the section header
 * disambiguates the day), DD-MM for older entries. Empty string when unknown.
 */
export const formatMentionTime = (timestampSeconds: number, now: Date = new Date()): string =>
{
    if(!timestampSeconds || timestampSeconds <= 0) return '';

    const d = new Date(timestampSeconds * 1000);

    if(getMentionDateGroup(timestampSeconds, now) === 'older') return `${ pad(d.getDate()) }-${ pad(d.getMonth() + 1) }`;

    return `${ pad(d.getHours()) }:${ pad(d.getMinutes()) }`;
};
