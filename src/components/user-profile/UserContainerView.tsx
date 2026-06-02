import { CreateLinkEvent, GetSessionDataManager, RelationshipStatusInfoMessageParser, RequestFriendComposer, UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FriendlyTime, LocalizeText, SanitizeHtml, SendMessageComposer } from '../../api';
import { LayoutAvatarImageView, LayoutBadgeImageView, Text, UserIdentityView } from '../../common';
import { badgeEmblemDefault } from '../../assets/images/leaderboard_badge';
import { level as profileLevelIcon, rooms as profileRoomsIcon } from '../../assets/images/user-profile';
import { RelationshipsContainerView } from './RelationshipsContainerView';

interface UserContainerViewProps
{
    userProfile: UserProfileParser;
    userBadges?: string[];
    userRelationships?: RelationshipStatusInfoMessageParser;
    onOpenRooms?: () => void;
}

export const UserContainerView: FC<UserContainerViewProps> = props =>
{
    const { userProfile = null, userBadges = [], userRelationships = null, onOpenRooms = null } = props;

    const [ requestSent, setRequestSent ] = useState(userProfile.requestSent);
    const isOwnProfile = (userProfile.id === GetSessionDataManager().userId);
    const canSendFriendRequest = !requestSent && (!isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent);
    const infostandBackgroundClass = `background-${ userProfile.backgroundId ?? 'default' }`;
    const infostandStandClass = `stand-${ userProfile.standId ?? 'default' }`;
    const infostandOverlayClass = `overlay-${ userProfile.overlayId ?? 'default' }`;
    const selectedBadges = useMemo(() => [ ...userBadges ].slice(0, 5), [ userBadges ]);
    const totalBadges = ((userProfile as any).totalBadges ?? userBadges.length ?? 0);

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
        <div className="nitro-extended-profile">
            <div className="nitro-extended-profile__top">
                <div className="nitro-extended-profile__left">
                    <div className="nitro-extended-profile__identity">
                        <div className={ `nitro-extended-profile__avatar-shell profile-background ${ infostandBackgroundClass }` }>
                            <div className={ `nitro-extended-profile__avatar-stand profile-stand ${ infostandStandClass }` } />
                            <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } classNames={ [ 'nitro-extended-profile__avatar-image' ] } />
                            <div className={ `nitro-extended-profile__avatar-overlay profile-overlay ${ infostandOverlayClass }` } />
                        </div>
                        <div className="nitro-extended-profile__identity-copy">
                            <UserIdentityView
                                className="nitro-extended-profile__username"
                                displayOrder={ userProfile.displayOrder }
                                nickIcon={ userProfile.nickIcon }
                                prefixColor={ userProfile.prefixColor }
                                prefixEffect={ userProfile.prefixEffect }
                                prefixFont={ userProfile.prefixFont }
                                prefixIcon={ userProfile.prefixIcon }
                                prefixText={ userProfile.prefixText }
                                username={ userProfile.username } />
                            <p className="nitro-extended-profile__motto">{ userProfile.motto || '\u00A0' }</p>
                            <p className="nitro-extended-profile__meta">
                                <span dangerouslySetInnerHTML={ { __html: SanitizeHtml(LocalizeText('extendedprofile.created').replace(/%\w+%/g, '').trim()) } } /> { userProfile.registration }
                            </p>
                            <p className="nitro-extended-profile__meta">
                                <span dangerouslySetInnerHTML={ { __html: SanitizeHtml(LocalizeText('extendedprofile.last.login').replace(/%\w+%/g, '').trim()) } } /> { FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                            </p>
                            <p className="nitro-extended-profile__meta nitro-extended-profile__meta--strong">
                                <b>{ LocalizeText('extendedprofile.achievementscore') }</b> { userProfile.achievementPoints }
                            </p>
                            <div className="nitro-extended-profile__status">
                                <div className="nitro-extended-profile__presence">
                                    <i className={ `nitro-icon ${ userProfile.isOnline ? 'icon-pf-online' : 'icon-pf-offline' }` } />
                                </div>
                                <div className="nitro-extended-profile__status-copy">
                                    { canSendFriendRequest &&
                                        <button className="nitro-extended-profile__friend-button" type="button" onClick={ addFriend }>
                                            { LocalizeText('extendedprofile.addasafriend') }
                                        </button> }
                                    { !canSendFriendRequest &&
                                        <>
                                            <i className="nitro-icon icon-pf-tick" />
                                            <span className="nitro-extended-profile__status-text">
                                                { isOwnProfile && LocalizeText('extendedprofile.me') }
                                                { userProfile.isMyFriend && LocalizeText('extendedprofile.friend') }
                                                { (requestSent || userProfile.requestSent) && LocalizeText('extendedprofile.friendrequestsent') }
                                            </span>
                                        </> }
                                </div>
                            </div>
                        </div>
                    </div>

                    { isOwnProfile &&
                        <div className="nitro-extended-profile__actions">
                            <button className="nitro-extended-profile__link" type="button" onClick={ () => CreateLinkEvent('avatar-editor/show') }>
                                { LocalizeText('extended.profile.change.looks') }
                            </button>
                            <button className="nitro-extended-profile__link" type="button" onClick={ () => CreateLinkEvent('inventory/show/badges') }>
                                { LocalizeText('extended.profile.change.badges') }
                            </button>
                        </div> }

                    <div className="nitro-extended-profile__badges">
                        { [ 0, 1, 2, 3, 4 ].map(index => (
                            <button key={ index } className="nitro-extended-profile__badge-slot" type="button">
                                { selectedBadges[index] && <LayoutBadgeImageView badgeCode={ selectedBadges[index] } highlightRarity showInfo showRarityInfo /> }
                            </button>
                        )) }
                    </div>
                </div>

                <div className="nitro-extended-profile__separator" />

                <div className="nitro-extended-profile__right">
                    <p
                        className="text-sm leading-none"
                        dangerouslySetInnerHTML={{
                            __html: SanitizeHtml(LocalizeText(
                                'extendedprofile.friends.count',
                                ['count'],
                                [userProfile.friendsCount.toString()]
                            ))
                        }}
                    />
                    <p className="nitro-extended-profile__relationships-label">{ LocalizeText('extendedprofile.relstatus') }</p>
                    { userRelationships &&
                        <RelationshipsContainerView relationships={ userRelationships } /> }
                    { !userRelationships &&
                        <Text small variant="muted">{ LocalizeText('generic.loading') }</Text> }
                </div>
            </div>

            <div className="nitro-extended-profile__summary-bar">
                <button className="nitro-extended-profile__summary-button" type="button" onClick={ onOpenRooms }>
                    <img className="nitro-extended-profile__summary-icon" src={ profileRoomsIcon } alt="" />
                    <span className="nitro-extended-profile__summary-label">{ LocalizeText('extendedprofile.rooms') }</span>
                </button>
                <button className="nitro-extended-profile__summary-button nitro-extended-profile__summary-button--center" type="button" onClick={ () => CreateLinkEvent('badge-leaderboard/show') }>
                    <img className="nitro-extended-profile__summary-icon nitro-extended-profile__summary-icon--badge" src={ badgeEmblemDefault } alt="" />
                    <span className="nitro-extended-profile__summary-label">{ LocalizeText('inventory.badges') }</span>
                    <span className="nitro-extended-profile__summary-value">{ totalBadges }</span>
                </button>
                <button className="nitro-extended-profile__summary-button nitro-extended-profile__summary-button--center" type="button" onClick={ () => CreateLinkEvent('achievements/toggle') }>
                    <img className="nitro-extended-profile__summary-icon" src={ profileLevelIcon } alt="" />
                    <span className="nitro-extended-profile__summary-label">{ LocalizeText('extendedprofile.achievementscore') }</span>
                    <span className="nitro-extended-profile__summary-value">{ userProfile.achievementPoints }</span>
                </button>
            </div>
        </div>
    );
};
