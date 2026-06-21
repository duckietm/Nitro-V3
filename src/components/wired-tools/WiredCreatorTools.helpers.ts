import type { HotelDateTimeParts, MonitorSnapshot } from './WiredCreatorTools.types';

const HOTEL_TIME_FORMATTERS: Map<string, Intl.DateTimeFormat> = new Map();

export const createEmptyMonitorSnapshot = (): MonitorSnapshot => ({
    usageCurrentWindow: 0,
    usageLimitPerWindow: 0,
    isHeavy: false,
    delayedEventsPending: 0,
    delayedEventsLimit: 0,
    averageExecutionMs: 0,
    peakExecutionMs: 0,
    recursionDepthCurrent: 0,
    recursionDepthLimit: 0,
    killedRemainingSeconds: 0,
    usageWindowMs: 0,
    overloadAverageThresholdMs: 0,
    overloadPeakThresholdMs: 0,
    heavyUsageThresholdPercent: 0,
    heavyConsecutiveWindowsThreshold: 0,
    overloadConsecutiveWindowsThreshold: 0,
    heavyDelayedThresholdPercent: 0,
    logs: [],
    history: []
});

export const getHotelTimeFormatter = (timeZone: string): Intl.DateTimeFormat => {
    const formatterTimeZone = timeZone || 'UTC';
    const existingFormatter = HOTEL_TIME_FORMATTERS.get(formatterTimeZone);

    if (existingFormatter) return existingFormatter;

    let formatter: Intl.DateTimeFormat = null;

    try {
        formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: formatterTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
    } catch {
        formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
    }

    HOTEL_TIME_FORMATTERS.set(formatterTimeZone, formatter);

    return formatter;
};

export const getHotelDateTimeParts = (epochMs: number, timeZone: string): HotelDateTimeParts => {
    const normalizedEpochMs = Number.isFinite(epochMs) ? epochMs : Date.now();
    const date = new Date(normalizedEpochMs);
    const formatter = getHotelTimeFormatter(timeZone);
    const formattedParts = formatter.formatToParts(date);
    const partsMap = new Map<string, string>();

    for (const part of formattedParts) {
        if (part.type === 'literal') continue;

        partsMap.set(part.type, part.value);
    }

    return {
        year: Number(partsMap.get('year') ?? date.getUTCFullYear()),
        month: Number(partsMap.get('month') ?? date.getUTCMonth() + 1),
        day: Number(partsMap.get('day') ?? date.getUTCDate()),
        hour: Number(partsMap.get('hour') ?? date.getUTCHours()),
        minute: Number(partsMap.get('minute') ?? date.getUTCMinutes()),
        second: Number(partsMap.get('second') ?? date.getUTCSeconds()),
        millisecond: ((normalizedEpochMs % 1000) + 1000) % 1000
    };
};

export const formatMonitorLatestOccurrence = (latestOccurrenceSeconds: number, nowMs: number): string => {
    if (latestOccurrenceSeconds <= 0) return '/';

    const diffMs = Math.max(0, nowMs - latestOccurrenceSeconds * 1000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);

    return `${diffDays}d ago`;
};

export const formatMonitorHistoryOccurrence = (occurredAtSeconds: number): string => {
    if (occurredAtSeconds <= 0) return '/';

    return new Date(occurredAtSeconds * 1000).toLocaleString('en-GB');
};

export const formatVariableTimestamp = (timestamp: number): string => {
    if (!timestamp || timestamp <= 0) return '/';

    return new Date(timestamp * 1000).toLocaleString('en-GB');
};

export const formatMonitorSource = (sourceLabel: string, sourceId: number): string => {
    const normalizedLabel = (sourceLabel || '').trim();

    if (!normalizedLabel && !(sourceId > 0)) return 'Room monitor';
    if (sourceId > 0) return `${normalizedLabel || 'wired'} (#${sourceId})`;

    return normalizedLabel;
};

export const normalizeMonitorReason = (reason: string): string => {
    const normalizedReason = (reason || '').trim();

    return normalizedReason || 'No detailed reason was recorded for this entry.';
};
