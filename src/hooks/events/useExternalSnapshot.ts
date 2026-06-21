import { useSyncExternalStore } from 'react';

/**
 * useSyncExternalStore wrapper for the Nitro renderer's subscribe + snapshot
 * getter contract.
 *
 * Pair with EventDispatcher.subscribe() (Nitro_Render_V3 v2.1.0+) and a
 * referentially-stable snapshot getter such as
 * SessionDataManager.getUserDataSnapshot() or
 * RoomSessionManager.getActiveRoomSessionSnapshot().
 *
 *   const userData = useExternalSnapshot(
 *       cb => GetEventDispatcher().subscribe(NitroEventType.SESSION_DATA_UPDATED, cb),
 *       () => GetSessionDataManager().getUserDataSnapshot()
 *   );
 *
 * Snapshot reference invariance is guaranteed by the renderer: the same
 * object is returned across reads until the corresponding *_UPDATED event
 * dispatches.
 */
export const useExternalSnapshot = <T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot ?? getSnapshot);
