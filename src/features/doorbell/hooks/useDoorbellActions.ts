import { GetRoomSession } from '../../../api';

/**
 * Imperative actions for the doorbell. Stateless on purpose — split from
 * useDoorbellState (proposal #4) so components that only need to dispatch
 * an answer don't subscribe to the events.
 */
export const useDoorbellActions = () => ({
    answer: (userName: string, flag: boolean): void =>
    {
        GetRoomSession()?.sendDoorbellApprovalMessage(userName, flag);
    }
});
