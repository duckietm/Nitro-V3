import { useHousekeepingActions } from './useHousekeepingActions';
import { useHousekeepingStore } from './useHousekeepingStore';

/**
 * Single facade for the in-client housekeeping panel — composes the
 * shared store with the imperative actions. Consumers that only need
 * one side can still import `useHousekeepingStore` /
 * `useHousekeepingActions` directly; this hook exists for the panel
 * views that need both.
 */
export const useHousekeeping = () => {
    const store = useHousekeepingStore();
    const actions = useHousekeepingActions();

    return { ...store, ...actions };
};
