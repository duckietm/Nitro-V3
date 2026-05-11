import { useFriendRequestActions } from './useFriendRequestActions';
import { useFriendRequestState } from './useFriendRequestState';

/**
 * @deprecated Use `useFriendRequestState` and `useFriendRequestActions`
 * directly. This shim preserves the
 * `{ displayedRequests, hideFriendRequest }` shape for existing consumers.
 */
export const useFriendRequestWidget = () =>
{
    const { displayedRequests } = useFriendRequestState();
    const { hideFriendRequest } = useFriendRequestActions();

    return { displayedRequests, hideFriendRequest };
};
