import { beforeEach, describe, expect, it } from 'vitest';
import { tileToWorld } from './SnowWarMath';
import {
    SNOWWAR_EVENT_CREATE_SNOWBALL,
    SNOWWAR_EVENT_DELETE_OBJECT,
    SNOWWAR_EVENT_HIT,
    SNOWWAR_EVENT_LAUNCH_SNOWBALL,
    SNOWWAR_EVENT_MACHINE_TRANSFER,
    SNOWWAR_EVENT_MOVE,
    SNOWWAR_EVENT_STUN,
    SNOWWAR_OBJECT_AVATAR,
    SNOWWAR_OBJECT_MACHINE,
    SNOWWAR_STATE_CREATING,
    SNOWWAR_STATE_INVINCIBLE,
    SNOWWAR_STATE_NORMAL,
    SNOWWAR_STATE_STUNNED,
    SnowWarSimEvent,
    SnowWarSimulation,
} from './SnowWarSimulation';

const avatarObject = (objectId: number, userId: number, tileX: number, tileY: number) => ({
    objectType: SNOWWAR_OBJECT_AVATAR,
    objectId,
    userId,
    teamId: objectId % 2,
    name: `user${userId}`,
    figure: 'hd-180-1',
    gender: 'M',
    worldX: tileToWorld(tileX),
    worldY: tileToWorld(tileY),
    rotation: 0,
    health: 4,
    snowballCount: 5,
    activityTimer: 0,
    activityState: SNOWWAR_STATE_NORMAL,
    score: 0,
});

const event = (type: number, p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0): SnowWarSimEvent =>
    ({ type, p1, p2, p3, p4, p5 });

describe('SnowWarSimulation', () =>
{
    let sim: SnowWarSimulation;
    let clock: number;

    /** Queue one server tick (5 subturns, events in the first) and play it out. */
    const applyTick = (events: SnowWarSimEvent[] = []) =>
    {
        const lists: SnowWarSimEvent[][] = [events, [], [], [], []];
        sim.queueGameStatus(lists);
        for (let i = 0; i < 5; i++)
        {
            clock += 60;
            sim.update(clock);
        }
    };

    beforeEach(() =>
    {
        sim = new SnowWarSimulation();
        clock = 0;
        sim.applyFullStatus([
            avatarObject(1, 100, 5, 5),
            avatarObject(2, 200, 10, 5),
            {
                objectType: SNOWWAR_OBJECT_MACHINE,
                objectId: 50,
                worldX: tileToWorld(8),
                worldY: tileToWorld(2),
                snowballCount: 3,
            },
        ]);
        sim.update(clock); // prime the clock
    });

    it('applies a full status snapshot', () =>
    {
        expect(sim.avatars.size).toBe(2);
        expect(sim.machines.get(50)?.tileX).toBe(8);
        expect(sim.getAvatarByUserId(200)?.objectId).toBe(2);
    });

    it('moves an avatar toward its move target at 640 units per subturn', () =>
    {
        const startX = tileToWorld(5);
        applyTick([event(SNOWWAR_EVENT_MOVE, 1, tileToWorld(7), tileToWorld(5))]);

        const avatar = sim.avatars.get(1);
        // 5 subturns of one tick = 5 * 640 units toward the goal.
        expect(avatar.worldX).toBe(startX + 5 * 640);
        expect(avatar.prevWorldX).toBe(startX + 4 * 640);
        expect(avatar.worldY).toBe(tileToWorld(5));

        // 2 tiles = 6400 units = 10 subturns; two more ticks are plenty.
        applyTick();
        applyTick();
        expect(avatar.worldX).toBe(tileToWorld(7));
        expect(avatar.walkGoalX).toBeNull();
    });

    it('paths around blocked tiles instead of walking through them', () =>
    {
        // 11x11 open map with a single wall tile at (6,5), directly between
        // the avatar (5,5) and its goal (7,5).
        const rows: string[] = [];
        for (let y = 0; y < 11; y++)
        {
            rows.push(y === 5 ? '000000x0000' : '00000000000');
        }
        sim.setLevel(rows, [], []);

        applyTick([event(SNOWWAR_EVENT_MOVE, 1, tileToWorld(7), tileToWorld(5))]);

        const avatar = sim.avatars.get(1);
        let steppedOnWall = false;
        for (let i = 0; i < 10; i++)
        {
            applyTick();
            if (avatar.tileX === 6 && avatar.tileY === 5) steppedOnWall = true;
        }

        expect(steppedOnWall).toBe(false);
        expect(avatar.worldX).toBe(tileToWorld(7));
        expect(avatar.worldY).toBe(tileToWorld(5));
        expect(avatar.walkGoalX).toBeNull();
    });

    it('stops at the closest reachable tile instead of oscillating at an unreachable goal', () =>
    {
        // Goal tile (7,5) is fully walled in; the avatar at (5,5) cannot
        // get closer than its own tile and must stop instead of bouncing
        // between equally-distant neighbours.
        const rows: string[] = [];
        for (let y = 0; y < 11; y++)
        {
            if (y >= 4 && y <= 6) rows.push('000000xxx00');
            else rows.push('00000000000');
        }
        sim.setLevel(rows, [], []);

        applyTick([event(SNOWWAR_EVENT_MOVE, 1, tileToWorld(7), tileToWorld(5))]);

        const avatar = sim.avatars.get(1);
        for (let i = 0; i < 6; i++) applyTick();

        expect(avatar.worldX).toBe(tileToWorld(5));
        expect(avatar.worldY).toBe(tileToWorld(5));
        expect(avatar.walkGoalX).toBeNull();
    });

    it('handles the create-snowball state machine', () =>
    {
        const avatar = sim.avatars.get(1);
        avatar.snowballCount = 0;

        applyTick([event(SNOWWAR_EVENT_CREATE_SNOWBALL, 1)]);
        expect(avatar.activityState).toBe(SNOWWAR_STATE_CREATING);
        expect(avatar.activityTimer).toBe(15); // 20 frames minus 5 elapsed

        // 20-frame creation timer expires within 4 more ticks.
        for (let i = 0; i < 4; i++) applyTick();
        expect(avatar.activityState).toBe(SNOWWAR_STATE_NORMAL);
        expect(avatar.snowballCount).toBe(1);
    });

    it('spawns, flies and deletes snowballs', () =>
    {
        applyTick([event(SNOWWAR_EVENT_LAUNCH_SNOWBALL, 99, 1, tileToWorld(10), tileToWorld(5), 2)]);

        const ball = sim.snowballs.get(99);
        expect(ball).toBeDefined();
        expect(sim.avatars.get(1).snowballCount).toBe(4);

        applyTick([event(SNOWWAR_EVENT_DELETE_OBJECT, 99)]);
        expect(sim.snowballs.has(99)).toBe(false);
    });

    it('snowballs expire on their own when TTL runs out', () =>
    {
        // Lob trajectory has a fixed 13-frame TTL.
        applyTick([event(SNOWWAR_EVENT_LAUNCH_SNOWBALL, 99, 1, tileToWorld(6), tileToWorld(5), 1)]);
        expect(sim.snowballs.has(99)).toBe(true);

        applyTick();
        applyTick();
        expect(sim.snowballs.has(99)).toBe(false);
    });

    it('applies hits and stuns with scores', () =>
    {
        applyTick([event(SNOWWAR_EVENT_HIT, 1, 2, 90)]);
        expect(sim.avatars.get(2).health).toBe(3);
        expect(sim.avatars.get(1).score).toBe(1);

        applyTick([event(SNOWWAR_EVENT_STUN, 2, 1, 90)]);
        const stunned = sim.avatars.get(2);
        expect(stunned.activityState).toBe(SNOWWAR_STATE_STUNNED);
        expect(stunned.snowballCount).toBe(0);
        expect(sim.avatars.get(1).score).toBe(6);

        // 125 stun frames -> invincible with restored health (5 already elapsed).
        for (let i = 0; i < 25; i++) applyTick();
        expect(stunned.activityState).toBe(SNOWWAR_STATE_INVINCIBLE);
        expect(stunned.health).toBe(4);

        // 60 invincibility frames -> normal.
        for (let i = 0; i < 13; i++) applyTick();
        expect(stunned.activityState).toBe(SNOWWAR_STATE_NORMAL);
    });

    it('transfers snowballs from machines', () =>
    {
        const avatar = sim.avatars.get(1);
        avatar.snowballCount = 0;

        applyTick([event(SNOWWAR_EVENT_MACHINE_TRANSFER, 1, 50)]);
        expect(avatar.snowballCount).toBe(1);
        expect(sim.machines.get(50).snowballCount).toBe(2);
    });

    it('fast-forwards when the backlog exceeds two server ticks', () =>
    {
        for (let i = 0; i < 4; i++)
        {
            sim.queueGameStatus([[], [], [], [], []]);
        }
        // 20 subturns queued; cap is 10 => 10 were fast-forwarded already.
        expect(sim.subturnCount).toBe(10);
    });
});
