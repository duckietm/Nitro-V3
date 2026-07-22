import { FC } from 'react';
import { LocalizeText, MessengerRequest } from '../../../../../api';
import { UserProfileIconView } from '../../../../../common';
import { useFriends } from '../../../../../hooks';

export const FriendsListRequestItemView: FC<{ request: MessengerRequest }> = (props) => {
    const { request = null } = props;
    const { requestResponse = null } = useFriends();

    if (!request) return null;

    return (
        <div className="hfl-request">
                <div className="hfl-request-profile">
                    <UserProfileIconView userId={request.requesterUserId} />
                </div>
                <span className="hfl-request-name">{request.name}</span>
            <div className="hfl-request-actions">
                <button type="button" className="accept" title={LocalizeText('friendlist.request_accept')} onClick={() => requestResponse(request.id, true)} />
                <button type="button" className="decline" title={LocalizeText('friendlist.request_decline')} onClick={() => requestResponse(request.id, false)} />
            </div>
        </div>
    );
};
