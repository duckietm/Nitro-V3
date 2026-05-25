import { useFriends } from '../../friends';

/**
 * Imperative actions for the friend-request widget. Stateless — split
 * from useFriendRequestState so a component that only needs to dismiss
 * a request doesn't subscribe to the user-added/removed lifecycle.
 *
 * The actual dismissal flag lives in the shared friends store
 * (via `setDismissedRequestIds`), so this hook is a thin adapter.
 */
export const useFriendRequestActions = () =>
{
    const { setDismissedRequestIds = null } = useFriends();

    return {
        hideFriendRequest: (userId: number): void =>
        {
            if(!setDismissedRequestIds) return;

            setDismissedRequestIds(prevValue =>
            {
                if(prevValue.indexOf(userId) >= 0) return prevValue;

                return [ ...prevValue, userId ];
            });
        }
    };
};
