import { FC } from 'react';
import { useFriends } from '../../../../../hooks';
import { FriendsListRequestItemView } from './FriendsListRequestItemView';

export const FriendsListRequestView: FC = () => {
    const { requests = [] } = useFriends();

    return (
        <div className="hfl-requests">
            <div className="hfl-request-list">
                {requests.map((request) => <FriendsListRequestItemView key={request.id} request={request} />)}
            </div>
        </div>
    );
};
