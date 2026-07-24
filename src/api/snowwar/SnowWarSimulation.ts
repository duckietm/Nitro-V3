import {
    SUBTURN_MOVEMENT,
    SUBTURN_MS,
    calculateFlightPath,
    direction360To8,
    getAngleFromComponents,
    getBaseVelX,
    getBaseVelY,
    moveTowards,
    tileToWorld,
    worldToTile,
} from './SnowWarMath';

/**
 * Client-side SnowWar world state.
 *
 * The server is authoritative: it streams one GameStatus packet per 300ms
 * tick containing 5 subturns of events, plus FullGameStatus snapshots on
 * demand. This class replays those events at the same 60ms/subturn cadence
 * using the same integer math as the server, and keeps the previous subturn
 * position of every mobile object so the view can interpolate between
 * subturns for smooth animation.
 */

export const SNOWWAR_OBJECT_AVATAR = 1;
export const SNOWWAR_OBJECT_SNOWBALL = 2;
export const SNOWWAR_OBJECT_MACHINE = 3;

export const SNOWWAR_EVENT_MOVE = 2;
export const SNOWWAR_EVENT_CREATE_SNOWBALL = 3;
export const SNOWWAR_EVENT_LAUNCH_SNOWBALL = 4;
export const SNOWWAR_EVENT_HIT = 5;
export const SNOWWAR_EVENT_MACHINE_ADD = 6;
export const SNOWWAR_EVENT_MACHINE_TRANSFER = 7;
export const SNOWWAR_EVENT_DELETE_OBJECT = 8;
export const SNOWWAR_EVENT_STUN = 9;

export const SNOWWAR_STATE_NORMAL = 0;
export const SNOWWAR_STATE_CREATING = 1;
export const SNOWWAR_STATE_STUNNED = 2;
export const SNOWWAR_STATE_INVINCIBLE = 3;

const INITIAL_HEALTH = 4;
const CREATING_TIMER = 20;
const STUNNED_TIMER = 125;
const INVINCIBILITY_TIMER = 60;

export interface SnowWarSimEvent {
    type: number;
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
}

export interface SnowWarAvatarState {
    objectId: number;
    userId: number;
    teamId: number;
    name: string;
    figure: string;
    gender: string;
    worldX: number;
    worldY: number;
    prevWorldX: number;
    prevWorldY: number;
    rotation: number;
    health: number;
    snowballCount: number;
    activityState: number;
    activityTimer: number;
    score: number;
    tileX: number;
    tileY: number;
    walkGoalX: number | null;
    walkGoalY: number | null;
    nextGoalX: number | null;
    nextGoalY: number | null;
    pathfindIterations: number;
    hitFlashUntilSubturn: number;
}

export interface SnowWarSnowballState {
    objectId: number;
    throwerObjectId: number;
    locH: number;
    locV: number;
    prevLocH: number;
    prevLocV: number;
    height: number;
    prevHeight: number;
    direction: number;
    trajectory: number;
    timeToLive: number;
    parabolaOffset: number;
}

export interface SnowWarMachineState {
    objectId: number;
    tileX: number;
    tileY: number;
    snowballCount: number;
}

interface FullStatusObject {
    objectType: number;
    objectId: number;
    // avatar
    worldX?: number;
    worldY?: number;
    rotation?: number;
    health?: number;
    snowballCount?: number;
    activityTimer?: number;
    activityState?: number;
    score?: number;
    userId?: number;
    teamId?: number;
    name?: string;
    figure?: string;
    gender?: string;
    // snowball
    locH?: number;
    locV?: number;
    height?: number;
    direction?: number;
    trajectory?: number;
    timeToLive?: number;
    throwerObjectId?: number;
    parabolaOffset?: number;
}

const MAX_PATHFIND_ITERATIONS = 50;

// Same order as the server's SnowWarPathfinder.DIAGONAL_MOVE_POINTS - the
// greedy step tie-breaks by this order via stable sort on both sides.
const DIAGONAL_MOVE_POINTS: [number, number][] = [
    [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

export class SnowWarSimulation
{
    public readonly avatars: Map<number, SnowWarAvatarState> = new Map();
    public readonly snowballs: Map<number, SnowWarSnowballState> = new Map();
    public readonly machines: Map<number, SnowWarMachineState> = new Map();

    private _blockedTiles: boolean[][] = [];
    private _mapWidth = 0;
    private _mapHeight = 0;

    private _pendingSubturns: SnowWarSimEvent[][] = [];
    private _subturnClock = 0; // ms accumulated toward the next subturn
    private _subturnCount = 0; // total subturns processed (monotonic)
    private _lastAdvanceAt: number | null = null;

    // The server delivers one whole tick (SUBTURNS_PER_TICK subturns) every
    // SERVER_TICK_MS, and the client plays them back at exactly that rate, so
    // there is no buffer to hide network jitter: a packet that lands a few ms
    // late leaves the interpolation with nothing to advance toward and motion
    // freezes for a frame or two. It is barely visible with a static camera,
    // but a clear stutter once the camera follows the avatar. Rather than add a
    // playout buffer (which would read as input lag), we let the interpolation
    // extrapolate a little past the last known subturn - continuing existing
    // motion through the gap. A stopped avatar has prev == cur, so it never
    // drifts; only genuinely-moving entities coast, and they correct on the
    // next packet. Capped so a longer stall settles instead of sliding away.
    private static readonly MAX_EXTRAPOLATION_ALPHA = 2;

    public get subturnCount(): number
    {
        return this._subturnCount;
    }

    /**
     * Progress between the last processed subturn and the next. 0..1 during
     * normal playback; allowed up to MAX_EXTRAPOLATION_ALPHA while starved so
     * brief jitter reads as continued motion instead of a freeze.
     */
    public get interpolationAlpha(): number
    {
        return Math.min(SnowWarSimulation.MAX_EXTRAPOLATION_ALPHA, this._subturnClock / SUBTURN_MS);
    }

    public reset(): void
    {
        this.avatars.clear();
        this.snowballs.clear();
        this.machines.clear();
        this._pendingSubturns = [];
        this._subturnClock = 0;
        this._subturnCount = 0;
        this._lastAdvanceAt = null;
        this._blockedTiles = [];
        this._mapWidth = 0;
        this._mapHeight = 0;
    }

    /**
     * Build the walkability grid from LevelData - the mirror of the server's
     * SnowWarMap tile construction: heightmap x/X tiles are blocked, a tile is
     * blocked only when it carries a solid item (walkableHeight > 0) so walkable
     * props (rugs/tiles) stay walkable, and each machine occupies (x,y)..(x+2,y).
     */
    public setLevel(
        heightmapRows: string[],
        items: { x: number; y: number; rotation?: number; walkableHeight?: number; width?: number; length?: number }[],
        machines: { x: number; y: number }[]): void
    {
        this._mapHeight = heightmapRows.length;
        this._mapWidth = this._mapHeight > 0 ? heightmapRows[0].length : 0;
        this._blockedTiles = heightmapRows.map(row =>
        {
            const cells: boolean[] = [];
            for (let x = 0; x < this._mapWidth; x++)
            {
                const tile = x < row.length ? row.charAt(x) : 'x';
                cells.push(tile === 'x' || tile === 'X');
            }
            return cells;
        });

        const block = (x: number, y: number) =>
        {
            if (x >= 0 && y >= 0 && x < this._mapWidth && y < this._mapHeight) this._blockedTiles[y][x] = true;
        };

        // Only solid furni block a tile; walkable props (walkableHeight 0, e.g.
        // rugs/ice) stay walkable, matching the server's SnowWarTile. Default to
        // blocking if the height is missing (older packet) to stay safe. A furni
        // blocks its WHOLE footprint (width x length, extending +x/+y from its
        // origin, swapped for the 90/270 rotations) - the same rectangle the
        // server's SnowWarMap blocks - so a 3x3 prop blocks all nine tiles.
        for (const item of items)
        {
            if ((item.walkableHeight ?? 3) <= 0) continue;
            const swap = item.rotation === 2 || item.rotation === 6;
            const effW = Math.max(1, (swap ? item.length : item.width) ?? 1);
            const effL = Math.max(1, (swap ? item.width : item.length) ?? 1);
            for (let dx = 0; dx < effW; dx++)
                for (let dy = 0; dy < effL; dy++)
                    block(item.x + dx, item.y + dy);
        }
        for (const machine of machines)
        {
            block(machine.x, machine.y);
            block(machine.x + 1, machine.y);
            block(machine.x + 2, machine.y);
        }
    }

    /** Rebuild the whole world from a FullGameStatus snapshot. */
    public applyFullStatus(objects: FullStatusObject[]): void
    {
        this.avatars.clear();
        this.snowballs.clear();
        this.machines.clear();
        this._pendingSubturns = [];

        for (const object of objects)
        {
            switch (object.objectType)
            {
                case SNOWWAR_OBJECT_AVATAR:
                    this.avatars.set(object.objectId, {
                        objectId: object.objectId,
                        userId: object.userId ?? 0,
                        teamId: object.teamId ?? 0,
                        name: object.name ?? '',
                        figure: object.figure ?? '',
                        gender: object.gender ?? 'M',
                        worldX: object.worldX ?? 0,
                        worldY: object.worldY ?? 0,
                        prevWorldX: object.worldX ?? 0,
                        prevWorldY: object.worldY ?? 0,
                        rotation: object.rotation ?? 0,
                        health: object.health ?? INITIAL_HEALTH,
                        snowballCount: object.snowballCount ?? 0,
                        activityState: object.activityState ?? SNOWWAR_STATE_NORMAL,
                        activityTimer: object.activityTimer ?? 0,
                        score: object.score ?? 0,
                        tileX: worldToTile(object.worldX ?? 0),
                        tileY: worldToTile(object.worldY ?? 0),
                        walkGoalX: null,
                        walkGoalY: null,
                        nextGoalX: null,
                        nextGoalY: null,
                        pathfindIterations: 0,
                        hitFlashUntilSubturn: 0,
                    });
                    break;
                case SNOWWAR_OBJECT_SNOWBALL:
                    this.snowballs.set(object.objectId, {
                        objectId: object.objectId,
                        throwerObjectId: object.throwerObjectId ?? 0,
                        locH: object.locH ?? 0,
                        locV: object.locV ?? 0,
                        prevLocH: object.locH ?? 0,
                        prevLocV: object.locV ?? 0,
                        height: object.height ?? 0,
                        prevHeight: object.height ?? 0,
                        direction: object.direction ?? 0,
                        trajectory: object.trajectory ?? 1,
                        timeToLive: object.timeToLive ?? 0,
                        parabolaOffset: object.parabolaOffset ?? 0,
                    });
                    break;
                case SNOWWAR_OBJECT_MACHINE:
                    this.machines.set(object.objectId, {
                        objectId: object.objectId,
                        tileX: worldToTile(object.worldX ?? 0),
                        tileY: worldToTile(object.worldY ?? 0),
                        snowballCount: object.snowballCount ?? 0,
                    });
                    break;
            }
        }
    }

    /** Queue one server tick worth of subturn event lists. */
    public queueGameStatus(subturns: SnowWarSimEvent[][]): void
    {
        for (const subturn of subturns) this._pendingSubturns.push(subturn);

        // Never let a laggy tab build an unbounded backlog: when more than 2
        // ticks (10 subturns) are queued, fast-forward the oldest ones.
        while (this._pendingSubturns.length > 10) this.advanceSubturn();
    }

    /** Advance real time; processes queued subturns at 60ms cadence. */
    public update(nowMs: number): void
    {
        if (this._lastAdvanceAt === null)
        {
            this._lastAdvanceAt = nowMs;
            return;
        }

        this._subturnClock += Math.min(500, Math.max(0, nowMs - this._lastAdvanceAt));
        this._lastAdvanceAt = nowMs;

        while (this._subturnClock >= SUBTURN_MS && this._pendingSubturns.length > 0)
        {
            this._subturnClock -= SUBTURN_MS;
            this.advanceSubturn();
        }

        // Starved (no pending data): let the clock run a little past one subturn
        // so interpolationAlpha extrapolates the current motion through short
        // network jitter instead of hard-freezing, then cap it so a longer
        // stall settles at a bounded lead rather than sliding away.
        const maxClock = SUBTURN_MS * SnowWarSimulation.MAX_EXTRAPOLATION_ALPHA;
        if (this._pendingSubturns.length === 0 && this._subturnClock > maxClock)
        {
            this._subturnClock = maxClock;
        }
    }

    private advanceSubturn(): void
    {
        const events = this._pendingSubturns.shift() ?? [];
        this._subturnCount++;

        for (const event of events) this.applyEvent(event);

        for (const avatar of this.avatars.values()) this.stepAvatar(avatar);
        for (const ball of [...this.snowballs.values()]) this.stepSnowball(ball);
    }

    private applyEvent(event: SnowWarSimEvent): void
    {
        switch (event.type)
        {
            case SNOWWAR_EVENT_MOVE: {
                const avatar = this.avatars.get(event.p1);
                if (!avatar) return;
                const goalTileX = worldToTile(event.p2);
                const goalTileY = worldToTile(event.p3);
                if (avatar.walkGoalX !== goalTileX || avatar.walkGoalY !== goalTileY)
                {
                    avatar.walkGoalX = goalTileX;
                    avatar.walkGoalY = goalTileY;
                    avatar.pathfindIterations = 0;
                }
                return;
            }
            case SNOWWAR_EVENT_CREATE_SNOWBALL: {
                const avatar = this.avatars.get(event.p1);
                if (!avatar) return;
                avatar.activityState = SNOWWAR_STATE_CREATING;
                avatar.activityTimer = CREATING_TIMER;
                this.stopAvatarWalk(avatar);
                return;
            }
            case SNOWWAR_EVENT_LAUNCH_SNOWBALL: {
                const thrower = this.avatars.get(event.p2);
                const startX = thrower ? thrower.worldX : event.p3;
                const startY = thrower ? thrower.worldY : event.p4;
                const flight = calculateFlightPath(
                    worldToTile(startX), worldToTile(startY),
                    worldToTile(event.p3), worldToTile(event.p4), event.p5);

                if (thrower)
                {
                    thrower.snowballCount = Math.max(0, thrower.snowballCount - 1);
                    thrower.rotation = direction360To8(getAngleFromComponents(
                        event.p3 - thrower.worldX, event.p4 - thrower.worldY));
                    this.stopAvatarWalk(thrower);
                }

                this.snowballs.set(event.p1, {
                    objectId: event.p1,
                    throwerObjectId: event.p2,
                    locH: tileToWorld(worldToTile(startX)),
                    locV: tileToWorld(worldToTile(startY)),
                    prevLocH: tileToWorld(worldToTile(startX)),
                    prevLocV: tileToWorld(worldToTile(startY)),
                    height: 0,
                    prevHeight: 0,
                    direction: flight.direction,
                    trajectory: event.p5,
                    timeToLive: flight.timeToLive,
                    parabolaOffset: flight.parabolaOffset,
                });
                return;
            }
            case SNOWWAR_EVENT_HIT: {
                const target = this.avatars.get(event.p2);
                const thrower = this.avatars.get(event.p1);
                if (target)
                {
                    target.health = Math.max(0, target.health - 1);
                    target.hitFlashUntilSubturn = this._subturnCount + 8;
                }
                if (thrower) thrower.score += 1;
                return;
            }
            case SNOWWAR_EVENT_MACHINE_ADD: {
                const machine = this.machines.get(event.p1);
                if (machine) machine.snowballCount = Math.min(5, machine.snowballCount + 1);
                return;
            }
            case SNOWWAR_EVENT_MACHINE_TRANSFER: {
                const avatar = this.avatars.get(event.p1);
                const machine = this.machines.get(event.p2);
                if (machine) machine.snowballCount = Math.max(0, machine.snowballCount - 1);
                if (avatar) avatar.snowballCount = Math.min(5, avatar.snowballCount + 1);
                return;
            }
            case SNOWWAR_EVENT_DELETE_OBJECT: {
                this.snowballs.delete(event.p1);
                return;
            }
            case SNOWWAR_EVENT_STUN: {
                const target = this.avatars.get(event.p1);
                const thrower = this.avatars.get(event.p2);
                if (target)
                {
                    target.activityState = SNOWWAR_STATE_STUNNED;
                    target.activityTimer = STUNNED_TIMER;
                    target.snowballCount = 0;
                    target.health = 0;
                    this.stopAvatarWalk(target);
                }
                if (thrower) thrower.score += 5;
                return;
            }
        }
    }

    private stepAvatar(avatar: SnowWarAvatarState): void
    {
        avatar.prevWorldX = avatar.worldX;
        avatar.prevWorldY = avatar.worldY;

        if (avatar.activityTimer > 0)
        {
            avatar.activityTimer--;

            if (avatar.activityTimer === 0)
            {
                switch (avatar.activityState)
                {
                    case SNOWWAR_STATE_CREATING:
                        avatar.activityState = SNOWWAR_STATE_NORMAL;
                        avatar.snowballCount = Math.min(5, avatar.snowballCount + 1);
                        break;
                    case SNOWWAR_STATE_STUNNED:
                        avatar.activityState = SNOWWAR_STATE_INVINCIBLE;
                        avatar.activityTimer = INVINCIBILITY_TIMER;
                        avatar.health = INITIAL_HEALTH;
                        break;
                    case SNOWWAR_STATE_INVINCIBLE:
                        avatar.activityState = SNOWWAR_STATE_NORMAL;
                        break;
                }
            }
        }

        if (avatar.walkGoalX === null || avatar.walkGoalY === null) return;
        if (avatar.activityState === SNOWWAR_STATE_STUNNED) return;

        // Mirror of the server's SnowWarAvatarObject.moveOneFrame: walk the
        // tile grid via the same greedy pathfinder instead of sliding in a
        // straight line, so avatars never cross blocked tiles ("walk in air")
        // and the client position matches the server's path exactly.
        const targetWorldX = tileToWorld(avatar.walkGoalX);
        const targetWorldY = tileToWorld(avatar.walkGoalY);

        if (avatar.worldX === targetWorldX && avatar.worldY === targetWorldY)
        {
            this.stopAvatarWalk(avatar);
            return;
        }

        if (avatar.nextGoalX === null || avatar.nextGoalY === null)
        {
            avatar.pathfindIterations++;
            if (avatar.pathfindIterations > MAX_PATHFIND_ITERATIONS)
            {
                this.stopAvatarWalk(avatar);
                return;
            }

            const next = this.getNextDirection(avatar);
            if (!next)
            {
                this.stopAvatarWalk(avatar);
                return;
            }

            avatar.nextGoalX = next.x;
            avatar.nextGoalY = next.y;
            avatar.rotation = direction360To8(getAngleFromComponents(
                tileToWorld(next.x) - avatar.worldX, tileToWorld(next.y) - avatar.worldY));
        }

        const nextWorldX = tileToWorld(avatar.nextGoalX);
        const nextWorldY = tileToWorld(avatar.nextGoalY);

        avatar.worldX = moveTowards(avatar.worldX, nextWorldX, SUBTURN_MOVEMENT);
        avatar.worldY = moveTowards(avatar.worldY, nextWorldY, SUBTURN_MOVEMENT);

        avatar.tileX = worldToTile(avatar.worldX);
        avatar.tileY = worldToTile(avatar.worldY);

        if (avatar.worldX === nextWorldX && avatar.worldY === nextWorldY)
        {
            avatar.nextGoalX = null;
            avatar.nextGoalY = null;
        }

        if (avatar.worldX === targetWorldX && avatar.worldY === targetWorldY)
        {
            this.stopAvatarWalk(avatar);
        }
    }

    private stopAvatarWalk(avatar: SnowWarAvatarState): void
    {
        avatar.walkGoalX = null;
        avatar.walkGoalY = null;
        avatar.nextGoalX = null;
        avatar.nextGoalY = null;
    }

    /** Mirror of the server's SnowWarPathfinder.getNextDirection. */
    private getNextDirection(avatar: SnowWarAvatarState): { x: number; y: number } | null
    {
        if (avatar.walkGoalX === null || avatar.walkGoalY === null) return null;

        const positions: { x: number; y: number }[] = [];

        for (const [dx, dy] of DIAGONAL_MOVE_POINTS)
        {
            const x = avatar.tileX + dx;
            const y = avatar.tileY + dy;
            if (this.isValidStep(avatar, x, y)) positions.push({ x, y });
        }

        if (!positions.length) return null;

        const goalX = avatar.walkGoalX;
        const goalY = avatar.walkGoalY;
        const distanceSquared = (p: { x: number; y: number }) =>
            ((p.x - goalX) * (p.x - goalX)) + ((p.y - goalY) * (p.y - goalY));

        // Stable sort keeps the server's neighbour-order tie-breaking.
        positions.sort((a, b) => distanceSquared(a) - distanceSquared(b));

        // Only step if it brings us strictly closer to the goal; otherwise
        // stop where we are (mirrors the server's oscillation guard).
        if (distanceSquared(positions[0]) >= distanceSquared({ x: avatar.tileX, y: avatar.tileY })) return null;

        return positions[0];
    }

    /** Mirror of the server's SnowWarPathfinder.isValidTile. */
    private isValidStep(avatar: SnowWarAvatarState, x: number, y: number): boolean
    {
        if (!this.isTileWalkable(x, y)) return false;

        for (const other of this.avatars.values())
        {
            if (other.objectId === avatar.objectId) continue;

            if (other.nextGoalX !== null && other.nextGoalY !== null)
            {
                if (other.nextGoalX === x && other.nextGoalY === y) return false;
            }
            else if (other.tileX === x && other.tileY === y)
            {
                return false;
            }
        }

        return true;
    }

    private isTileWalkable(x: number, y: number): boolean
    {
        // Without level data (tests, pre-LevelData packets) fall back to the
        // pre-map behaviour of unrestricted movement.
        if (!this._mapHeight) return true;
        if (x < 0 || y < 0 || x >= this._mapWidth || y >= this._mapHeight) return false;
        return !this._blockedTiles[y][x];
    }

    private stepSnowball(ball: SnowWarSnowballState): void
    {
        ball.prevLocH = ball.locH;
        ball.prevLocV = ball.locV;
        ball.prevHeight = ball.height;

        ball.timeToLive--;

        ball.locH = (ball.locH + (((getBaseVelX(ball.direction) * 2000) / 255) | 0)) | 0;
        ball.locV = (ball.locV + (((getBaseVelY(ball.direction) * 2000) / 255) | 0)) | 0;

        let distanceFromPeak = ball.timeToLive - ball.parabolaOffset;
        let heightMultiplier: number;
        let baseHeight: number;

        switch (ball.trajectory)
        {
            case 0:
                if (ball.timeToLive > 3) distanceFromPeak = 3 - ball.parabolaOffset;
                heightMultiplier = 4;
                baseHeight = 4000;
                break;
            case 2:
                heightMultiplier = 100;
                baseHeight = 3000;
                break;
            default:
                heightMultiplier = 10;
                baseHeight = 3000;
                break;
        }

        ball.height = (baseHeight + heightMultiplier
            * ((ball.parabolaOffset * ball.parabolaOffset) - (distanceFromPeak * distanceFromPeak))) | 0;

        if (ball.height < 0 || ball.timeToLive <= 0) this.snowballs.delete(ball.objectId);
    }

    public getAvatarByUserId(userId: number): SnowWarAvatarState | null
    {
        for (const avatar of this.avatars.values())
        {
            if (avatar.userId === userId) return avatar;
        }
        return null;
    }
}
