import { useDoorbellActions, useDoorbellState } from '../../../features/doorbell';

/**
 * @deprecated Use `useDoorbellState` and `useDoorbellActions` from
 * `src/features/doorbell` directly. This shim is kept so existing
 * imports via the `hooks` barrel keep working.
 */
export const useDoorbellWidget = () =>
{
    const users = useDoorbellState();
    const { answer } = useDoorbellActions();

    return { users, answer };
};
