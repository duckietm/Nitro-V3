import { FC } from 'react';
import { LocalizeText, MessengerRequest } from '../../../../../api';
import { Button, LayoutAvatarImageView, NitroCardAccordionItemView, UserProfileIconView } from '../../../../../common';
import { useFriends } from '../../../../../hooks';
import { resolveAvatarFigure } from '../resolveAvatarFigure';
import { resolveAvatarGender } from '../resolveAvatarGender';

export const FriendsListRequestItemView: FC<{ request: MessengerRequest }> = (props) => {
    const { request = null } = props;
    const { requestResponse = null } = useFriends();

    if (!request) return null;

    return (
        <NitroCardAccordionItemView className="friends-list-item px-2 py-1" justifyContent="between">
            <div className="friends-list-user">
                <div className="friends-list-avatar">
                    <LayoutAvatarImageView
                        figure={resolveAvatarFigure(request.figureString)}
                        gender={resolveAvatarGender(undefined)}
                        headOnly={true}
                        direction={2}
                    />
                </div>
                <div>
                    <UserProfileIconView userId={request.requesterUserId} />
                </div>
                <div className="friends-list-name">{request.name}</div>
            </div>
            <div className="flex items-center gap-1">
                <Button size="sm" onClick={(event) => requestResponse(request.id, true)}>
                    {LocalizeText('friendlist.request_accept')}
                </Button>
                <Button size="sm" variant="danger" onClick={(event) => requestResponse(request.id, false)}>
                    {LocalizeText('friendlist.request_decline')}
                </Button>
            </div>
        </NitroCardAccordionItemView>
    );
};
