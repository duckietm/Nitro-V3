export interface IHousekeepingUser
{
    id: number;
    username: string;
    motto: string;
    figure: string;
    rank: number;
    rankName: string;
    online: boolean;
    lastOnlineAt: number | null;
    creditsBalance: number;
    ducketsBalance: number;
    diamondsBalance: number;
    email: string;
    ipLast: string;
    isBanned: boolean;
    isMuted: boolean;
    isTradeLocked: boolean;
}

export interface IHousekeepingRoom
{
    id: number;
    name: string;
    description: string;
    ownerId: number;
    ownerName: string;
    userCount: number;
    maxUsers: number;
    isLocked: boolean;
    isMuted: boolean;
    isPublic: boolean;
    createdAt: number;
}

export interface IHousekeepingActionResult
{
    ok: boolean;
    actionId: number | null;
    message: string;
}

export interface IHousekeepingActionLogEntry
{
    id: number;
    timestamp: number;
    actorId: number;
    actorName: string;
    targetType: 'user' | 'room' | 'hotel';
    targetId: number | null;
    targetLabel: string;
    action: string;
    detail: string;
    success: boolean;
}

export interface IHousekeepingUserSummary
{
    id: number;
    username: string;
    figure: string;
    online: boolean;
    rank: number;
}

export interface IHousekeepingRoomSummary
{
    id: number;
    name: string;
    userCount: number;
    ownerName: string;
}

export interface IHousekeepingDashboard
{
    onlineUsers: number;
    totalUsers: number;
    activeRooms: number;
    totalRooms: number;
    peakOnlineToday: number;
    peakOnlineAllTime: number;
    pendingTickets: number;
    sanctionsLast24h: number;
    serverUptimeSeconds: number;
    serverVersion: string;
}
