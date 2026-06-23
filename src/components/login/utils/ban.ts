export interface BanInfo {
    type: 'account' | 'ip' | 'machine' | 'super' | string;
    reason: string;
    permanent: boolean;
    expiresAt?: number;
}

export const parseBan = (payload: Record<string, unknown>): BanInfo | null => {
    const raw = payload?.ban;
    if (!raw || typeof raw !== 'object') return null;
    const ban = raw as Record<string, unknown>;
    const type = typeof ban.type === 'string' ? ban.type : 'account';
    const reason = typeof ban.reason === 'string' ? ban.reason : '';
    const permanent = ban.permanent === true || ban.permanent === 'true';
    const expiresAt = typeof ban.expiresAt === 'number' ? ban.expiresAt : undefined;
    return { type, reason, permanent, expiresAt };
};

export const formatRemaining = (epochSeconds: number): string => {
    const totalSeconds = Math.max(0, epochSeconds - Math.floor(Date.now() / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};
