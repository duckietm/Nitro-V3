import { GetSessionDataManager, RequestFriendComposer, UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FriendlyTime, LocalizeText, SendMessageComposer } from '../../api';
import { LayoutAvatarImageView, Text } from '../../common';

export const UserContainerView: FC<{
    userProfile: UserProfileParser;
}> = props =>
{
    const { userProfile = null } = props;
    const [ requestSent, setRequestSent ] = useState(userProfile.requestSent);
    const isOwnProfile = (userProfile.id === GetSessionDataManager().userId);
    const canSendFriendRequest = !requestSent && (!isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent);

    const infostandBackgroundClass = `background-${userProfile.backgroundId ?? 'default'}`;
    const infostandStandClass = `stand-${userProfile.standId ?? 'default'}`;
    const infostandOverlayClass = `overlay-${userProfile.overlayId ?? 'default'}`;

    const addFriend = () =>
    {
        setRequestSent(true);

        SendMessageComposer(new RequestFriendComposer(userProfile.username));
    };

    useEffect(() =>
    {
        setRequestSent(userProfile.requestSent);
    }, [ userProfile ]);

    return (
        <div className="flex gap-2">
            <div className={`flex flex-col justify-center items-center w-[75px] h-[120px] rounded-sm relative overflow-hidden profile-background ${infostandBackgroundClass}`}>
                <div className={`absolute inset-0 profile-stand ${infostandStandClass}`} />
                <LayoutAvatarImageView direction={ 2 } figure={ userProfile.figure } />
                <div className={`absolute inset-0 profile-overlay ${infostandOverlayClass}`} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0">
                    <p className="leading-tight font-bold">{ userProfile.username }</p>
                    <p className="text-sm italic leading-tight">{ userProfile.motto }</p>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-sm leading-none" dangerouslySetInnerHTML={{ __html: LocalizeText('extendedprofile.created', ['created'], [userProfile.registration]) }} />
                    <p className="text-sm leading-none" dangerouslySetInnerHTML={{ __html: LocalizeText('extendedprofile.last.login', ['lastlogin'], [FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2)]) }} />
                    <p className="text-sm leading-none">
                        <b>{ LocalizeText('extendedprofile.achievementscore') }</b> { userProfile.achievementPoints }
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    { userProfile.isOnline &&
                        <i className="nitro-icon icon-pf-online" /> }
                    { !userProfile.isOnline &&
                        <i className="nitro-icon icon-pf-offline" /> }
                    <div className="flex items-center gap-1">
                        { canSendFriendRequest &&
                            <Text pointer small underline onClick={ addFriend }>{ LocalizeText('extendedprofile.addasafriend') }</Text> }
                        { !canSendFriendRequest &&
                            <>
                                <i className="nitro-icon icon-pf-tick" />
                                { isOwnProfile &&
                                    <p>{ LocalizeText('extendedprofile.me') }</p> }
                                { userProfile.isMyFriend &&
                                    <p>{ LocalizeText('extendedprofile.friend') }</p> }
                                { (requestSent || userProfile.requestSent) &&
                                    <p>{ LocalizeText('extendedprofile.friendrequestsent') }</p> }
                            </> }
                    </div>
                </div>
            </div>
        </div>
    );
};
