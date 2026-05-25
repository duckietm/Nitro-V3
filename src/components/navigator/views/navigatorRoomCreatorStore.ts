import { createNitroStore } from '../../../state/createNitroStore';

const CREATE_LOCKOUT_MS = 5000;

interface RoomCreatorState
{
    isCreating: boolean;
    /**
     * Latch `isCreating` to true and auto-clear after CREATE_LOCKOUT_MS.
     * Acts as a debounce so duplicate clicks on the Create button can't
     * dispatch the composer twice.
     */
    beginCreate: () => void;
}

/**
 * Replaces the previous `let isCreatingRoom` / `let createRoomTimeout`
 * module-level pair (anti-pattern flagged by the React Compiler:
 * "Writing to a variable defined outside a component or hook").
 *
 * The timer handle lives in the store's closure so a remount of the
 * view doesn't reset the in-flight lockout, and so React strict-mode's
 * double-mount no longer schedules two pending timers.
 */
export const useRoomCreatorStore = createNitroStore<RoomCreatorState>()((set) =>
{
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    return {
        isCreating: false,
        beginCreate: () =>
        {
            if(timeoutHandle !== null) clearTimeout(timeoutHandle);

            set({ isCreating: true });

            timeoutHandle = setTimeout(() =>
            {
                timeoutHandle = null;
                set({ isCreating: false });
            }, CREATE_LOCKOUT_MS);
        }
    };
});
