import { FC, MouseEvent, useState } from 'react';
import { LocalizeText, MessengerFriend, OpenMessengerChat } from '../../../../../api';
import { LayoutAvatarImageView, NitroCardAccordionItemView, UserProfileIconView } from '../../../../../common';
import { useFriends } from '../../../../../hooks';
import { resolveAvatarFigure } from '../resolveAvatarFigure';
import { resolveAvatarGender } from '../resolveAvatarGender';

export const FriendsListGroupItemView: FC<{ friend: MessengerFriend; selected: boolean; selectFriend: (userId: number) => void }> = (props) => {
    const { friend = null, selected = false, selectFriend = null } = props;
    const [isRelationshipOpen, setIsRelationshipOpen] = useState<boolean>(false);
    const { followFriend = null, updateRelationship = null, moveFriendToCategory = null, settings = null } = useFriends();
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState<boolean>(false);
    const categories = settings?.categories ?? [];

    const clickFollowFriend = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        followFriend(friend);
    };

    const openMessengerChat = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        OpenMessengerChat(friend.id);
    };

    const openRelationship = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        setIsRelationshipOpen(true);
    };

    const clickUpdateRelationship = (event: MouseEvent<HTMLDivElement>, type: number) => {
        event.stopPropagation();

        updateRelationship(friend, type);

        setIsRelationshipOpen(false);
    };

    const getCurrentRelationshipName = () => {
        if (!friend) return 'none';

        switch (friend.relationshipStatus) {
            case MessengerFriend.RELATIONSHIP_HEART:
                return 'heart';
            case MessengerFriend.RELATIONSHIP_SMILE:
                return 'smile';
            case MessengerFriend.RELATIONSHIP_BOBBA:
                return 'bobba';
            default:
                return 'none';
        }
    };

    if (!friend) return null;

    return (
        <NitroCardAccordionItemView
            className={`friends-list-item ${selected ? 'selected' : ''}`}
            justifyContent="between"
            onClick={(event) => selectFriend(friend.id)}
        >
            <div className="friends-list-user">
                <div className="friends-list-avatar">
                    <LayoutAvatarImageView
                        figure={resolveAvatarFigure(friend.figure, friend.gender)}
                        gender={resolveAvatarGender(friend.gender)}
                        headOnly={true}
                        direction={2}
                    />
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                    <UserProfileIconView userId={friend.id} />
                </div>
                <div className="friends-list-name">{friend.name}</div>
            </div>
            <div className="friends-list-actions">
                {!isRelationshipOpen && (
                    <>
                        {friend.online && (
                            <div
                                className="nitro-friends-spritesheet icon-follow cursor-pointer"
                                title={LocalizeText('friendlist.tip.follow')}
                                onClick={clickFollowFriend}
                            />
                        )}
                        {friend.online && (
                            <div
                                className="nitro-friends-spritesheet icon-chat cursor-pointer"
                                title={LocalizeText('friendlist.tip.im')}
                                onClick={openMessengerChat}
                            />
                        )}
                        {friend.id > 0 && categories.length > 0 && (
                            <div className="friends-list-group-assign position-relative">
                                <div
                                    className="friends-list-group-toggle cursor-pointer"
                                    title={LocalizeText('friendlist.friends')}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsGroupMenuOpen((prev) => !prev);
                                    }}
                                >
                                    {'📁'}
                                </div>
                                {isGroupMenuOpen && (
                                    <div className="friends-list-group-menu">
                                        <div
                                            className={`friends-list-group-menu-item${friend.categoryId === 0 ? ' active' : ''}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                moveFriendToCategory(friend.id, 0);
                                                setIsGroupMenuOpen(false);
                                            }}
                                        >
                                            {LocalizeText('friendlist.friends')}
                                        </div>
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className={`friends-list-group-menu-item${friend.categoryId === category.id ? ' active' : ''}`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    moveFriendToCategory(friend.id, category.id);
                                                    setIsGroupMenuOpen(false);
                                                }}
                                            >
                                                {category.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {friend.id > 0 && (
                            <div
                                className={`nitro-friends-spritesheet icon-${getCurrentRelationshipName()} cursor-pointer`}
                                title={LocalizeText('infostand.link.relationship')}
                                onClick={openRelationship}
                            />
                        )}
                    </>
                )}
                {isRelationshipOpen && (
                    <>
                        <div
                            className="nitro-friends-spritesheet icon-heart cursor-pointer"
                            onClick={(event) => clickUpdateRelationship(event, MessengerFriend.RELATIONSHIP_HEART)}
                        />
                        <div
                            className="nitro-friends-spritesheet icon-smile cursor-pointer"
                            onClick={(event) => clickUpdateRelationship(event, MessengerFriend.RELATIONSHIP_SMILE)}
                        />
                        <div
                            className="nitro-friends-spritesheet icon-bobba cursor-pointer"
                            onClick={(event) => clickUpdateRelationship(event, MessengerFriend.RELATIONSHIP_BOBBA)}
                        />
                        <div
                            className="nitro-friends-spritesheet icon-none cursor-pointer"
                            onClick={(event) => clickUpdateRelationship(event, MessengerFriend.RELATIONSHIP_NONE)}
                        />
                    </>
                )}
            </div>
        </NitroCardAccordionItemView>
    );
};
