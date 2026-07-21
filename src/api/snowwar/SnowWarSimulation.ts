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
    moveTargetX: number | null;
    moveTargetY: number | null;
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

export class SnowWarSimulation
{
    public readonly avatars: Map<number, SnowWarAvatarState> = new Map();
    public readonly snowballs: Map<number, SnowWarSnowballState> = new Map();
    public readonly machines: Map<number, SnowWarMachineState> = new Map();

    private _pendingSubturns: SnowWarSimEvent[][] = [];
    private _subturnClock = 0; // ms accumulated toward the next subturn
    private _subturnCount = 0; // total subturns processed (monotonic)
    private _lastAdvanceAt: number | null = null;

    public get subturnCount(): number
    {
        return this._subturnCount;
    }

    /** 0..1 progress between the last processed subturn and the next. */
    public get interpolationAlpha(): number
    {
        return Math.min(1, this._subturnClock / SUBTURN_MS);
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
                        moveTargetX: null,
                        moveTargetY: null,
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

        // Idle (no pending data): freeze the clock so alpha caps at 1.
        if (this._pendingSubturns.length === 0 && this._subturnClock > SUBTURN_MS)
        {
            this._subturnClock = SUBTURN_MS;
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
                avatar.moveTargetX = event.p2;
                avatar.moveTargetY = event.p3;
                avatar.rotation = direction360To8(
                    getAngleFromComponents(event.p2 - avatar.worldX, event.p3 - avatar.worldY));
                return;
            }
            case SNOWWAR_EVENT_CREATE_SNOWBALL: {
                const avatar = this.avatars.get(event.p1);
                if (!avatar) return;
                avatar.activityState = SNOWWAR_STATE_CREATING;
                avatar.activityTimer = CREATING_TIMER;
                avatar.moveTargetX = null;
                avatar.moveTargetY = null;
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
                    thrower.moveTargetX = null;
                    thrower.moveTargetY = null;
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
                    target.moveTargetX = null;
                    target.moveTargetY = null;
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

        if (avatar.moveTargetX === null || avatar.moveTargetY === null) return;
        if (avatar.activityState === SNOWWAR_STATE_STUNNED) return;

        avatar.worldX = moveTowards(avatar.worldX, avatar.moveTargetX, SUBTURN_MOVEMENT);
        avatar.worldY = moveTowards(avatar.worldY, avatar.moveTargetY, SUBTURN_MOVEMENT);

        if (avatar.worldX === avatar.moveTargetX && avatar.worldY === avatar.moveTargetY)
        {
            avatar.moveTargetX = null;
            avatar.moveTargetY = null;
        }
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
