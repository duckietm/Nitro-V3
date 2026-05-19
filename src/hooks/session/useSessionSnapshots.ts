import { GetEventDispatcher, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, IRoomSessionSnapshot, IRoomUserData, ISoundVolumesSnapshot, IUserDataSnapshot, NitroEventType, SecurityLevel } from '@nitrots/nitro-renderer';
import { useMemo } from 'react';
import { useExternalSnapshot } from '../events/useExternalSnapshot';

/**
 * React-side consumers for the referentially-stable snapshot getters
 * the renderer exposes (Nitro_Render_V3 v2.1.0+ pattern).
 *
 * Every hook here is a thin `useSyncExternalStore` wrapper: it subscribes
 * to the corresponding `NitroEventType.*_UPDATED` invalidation event and
 * reads the matching `getXxxSnapshot()`. Because the renderer guarantees
 * snapshot reference invariance until invalidation, React's bailout logic
 * skips re-renders when the snapshot is unchanged — so widgets that read
 * the same slice across many components share a single subscription and
 * only re-paint when the underlying state actually changes.
 *
 * Prefer these over reaching into the manager directly with
 * `GetSessionDataManager().userId` etc., which never trigger a re-render
 * when the value changes.
 *
 * The hooks are intentionally defensive: every call site is wrapped in a
 * "is this method available?" guard so a renderer-version mismatch
 * (e.g. a stale `dist/` shadowing the source) degrades to a stable empty
 * fallback instead of crashing the React tree with `(intermediate value)()
 * is undefined` during the first paint.
 */

// Module-level frozen defaults — referentially stable so the React bailout
// keeps working when a manager method is unavailable.
const NOOP_UNSUBSCRIBE = (): void => undefined;

const DEFAULT_USER_DATA: Readonly<IUserDataSnapshot> = Object.freeze({
    userId: 0,
    userName: '',
    figure: '',
    gender: '',
    realName: '',
    respectsReceived: 0,
    respectsLeft: 0,
    respectsPetLeft: 0,
    canChangeName: false,
    clubLevel: 0,
    securityLevel: 0,
    isAmbassador: false,
    isEmailVerified: false,
    isNoob: false,
    isAuthenticHabbo: false,
    isSystemOpen: false,
    isSystemShutdown: false,
    uiFlags: 0,
    tags: Object.freeze<string[]>([]) as ReadonlyArray<string>
}) as Readonly<IUserDataSnapshot>;

const EMPTY_IGNORED_LIST: ReadonlyArray<string> = Object.freeze<string[]>([]) as ReadonlyArray<string>;
const EMPTY_GROUP_BADGES: ReadonlyMap<number, string> = new Map();
const EMPTY_USER_LIST: ReadonlyArray<IRoomUserData> = Object.freeze<IRoomUserData[]>([]) as ReadonlyArray<IRoomUserData>;

const DEFAULT_VOLUMES: Readonly<ISoundVolumesSnapshot> = Object.freeze({
    system: 0.5,
    furni: 0.5,
    trax: 0.5
}) as Readonly<ISoundVolumesSnapshot>;

const subscribeTo = (eventType: string) => (onChange: () => void): (() => void) =>
{
    const dispatcher = GetEventDispatcher();

    // Stale renderer (no v2.1.0 subscribe API) — return a no-op
    // unsubscribe so useSyncExternalStore stays mounted cleanly.
    if(!dispatcher || typeof dispatcher.subscribe !== 'function') return NOOP_UNSUBSCRIBE;

    return dispatcher.subscribe(eventType, onChange);
};

export const useUserDataSnapshot = (): Readonly<IUserDataSnapshot> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.SESSION_DATA_UPDATED),
        () =>
        {
            const manager = GetSessionDataManager();

            if(!manager || typeof manager.getUserDataSnapshot !== 'function') return DEFAULT_USER_DATA;

            return manager.getUserDataSnapshot();
        }
    );

export const useActiveRoomSessionSnapshot = (): Readonly<IRoomSessionSnapshot> | null =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.ROOM_SESSION_UPDATED),
        () =>
        {
            const manager = GetRoomSessionManager();

            if(!manager || typeof manager.getActiveRoomSessionSnapshot !== 'function') return null;

            return manager.getActiveRoomSessionSnapshot();
        }
    );

export const useIgnoredUsersSnapshot = (): ReadonlyArray<string> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.IGNORED_USERS_UPDATED),
        () =>
        {
            const inner = GetSessionDataManager()?.ignoredUsersManager;

            if(!inner || typeof inner.getIgnoredUsersSnapshot !== 'function') return EMPTY_IGNORED_LIST;

            return inner.getIgnoredUsersSnapshot();
        }
    );

/**
 * Reactive predicate built on top of `useIgnoredUsersSnapshot`.
 * Re-renders only when the array reference flips (i.e. someone is added
 * or removed) — not on unrelated session updates.
 */
export const useIsUserIgnored = (name: string): boolean =>
{
    const list = useIgnoredUsersSnapshot();

    return useMemo(() => list.includes(name), [ list, name ]);
};

/**
 * Reactive equivalent of `GetSessionDataManager().isModerator`. Derives
 * from `useUserDataSnapshot().securityLevel` so any future
 * promote/demote that flips the SESSION_DATA_UPDATED event re-renders
 * the consumer without an F5. Mirrors the renderer-side getter at
 * `SessionDataManager.ts:684` (`securityLevel >= SecurityLevel.MODERATOR`).
 */
export const useIsModerator = (): boolean =>
{
    const userData = useUserDataSnapshot();

    return userData.securityLevel >= SecurityLevel.MODERATOR;
};

export const useGroupBadgesSnapshot = (): ReadonlyMap<number, string> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.GROUP_BADGES_UPDATED),
        () =>
        {
            const inner = GetSessionDataManager()?.groupInformationManager;

            if(!inner || typeof inner.getGroupBadgesSnapshot !== 'function') return EMPTY_GROUP_BADGES;

            return inner.getGroupBadgesSnapshot();
        }
    );

/**
 * Returns the badge id for a given group, reactive. Empty string when
 * the badge isn't known (matches the legacy `getGroupBadge` fallback).
 */
export const useGroupBadge = (groupId: number): string =>
{
    const badges = useGroupBadgesSnapshot();

    return useMemo(() => badges.get(groupId) ?? '', [ badges, groupId ]);
};

export const useVolumesSnapshot = (): Readonly<ISoundVolumesSnapshot> =>
    useExternalSnapshot(
        subscribeTo(NitroEventType.SOUND_VOLUMES_UPDATED),
        () =>
        {
            const manager = GetSoundManager();

            if(!manager || typeof manager.getVolumesSnapshot !== 'function') return DEFAULT_VOLUMES;

            return manager.getVolumesSnapshot();
        }
    );

/**
 * Returns the active room's user list, reactive. Returns an empty
 * frozen array when no room session is active (or when the renderer
 * doesn't expose the snapshot getter yet).
 *
 * Subscribes to BOTH `ROOM_USER_LIST_UPDATED` (join/leave/update inside
 * the active session) AND `ROOM_SESSION_UPDATED` (because the underlying
 * `userDataManager` reference flips when the active room changes).
 */
export const useRoomUserListSnapshot = (): ReadonlyArray<IRoomUserData> =>
    useExternalSnapshot(
        (onChange) =>
        {
            const dispatcher = GetEventDispatcher();

            if(!dispatcher || typeof dispatcher.subscribe !== 'function') return NOOP_UNSUBSCRIBE;

            const offList = dispatcher.subscribe(NitroEventType.ROOM_USER_LIST_UPDATED, onChange);
            const offSession = dispatcher.subscribe(NitroEventType.ROOM_SESSION_UPDATED, onChange);

            return () =>
            {
                offList();
                offSession();
            };
        },
        () =>
        {
            const userDataManager = GetRoomSessionManager()?.getActiveRoomSessionSnapshot?.()?.session?.userDataManager;

            if(!userDataManager || typeof userDataManager.getRoomUserListSnapshot !== 'function') return EMPTY_USER_LIST;

            return userDataManager.getRoomUserListSnapshot();
        }
    );
