import { AddLinkEventTracker, ILinkEventTracker, RemoveFriendComposer, RemoveLinkEventTracker, SendRoomInviteComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { filterFriendsByCategory, LocalizeText, MessengerFriend, SendMessageComposer } from '../../../../api';
import { Button, Flex, NitroCardAccordionSetView, NitroCardAccordionView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useFriends } from '../../../../hooks';
import { FriendsCategoryManagerView } from './FriendsCategoryManagerView';
import { FriendsListGroupChipsView } from './FriendsListGroupChipsView';
import { FriendsRemoveConfirmationView } from './FriendsListRemoveConfirmationView';
import { FriendsRoomInviteView } from './FriendsListRoomInviteView';
import { FriendsSearchView } from './FriendsListSearchView';
import { FriendsListGroupView } from './friends-list-group/FriendsListGroupView';
import { FriendsListRequestView } from './friends-list-request/FriendsListRequestView';

export const FriendsListView: FC<{}> = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedFriendsIds, setSelectedFriendsIds] = useState<number[]>([]);
    const [showRoomInvite, setShowRoomInvite] = useState<boolean>(false);
    const [showRemoveFriendsConfirmation, setShowRemoveFriendsConfirmation] = useState<boolean>(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [showCategoryManager, setShowCategoryManager] = useState<boolean>(false);
    const { friends = [], onlineFriends = [], offlineFriends = [], requests = [], requestFriend = null, settings = null } = useFriends();

    const categories = settings?.categories ?? [];
    const filteredOnlineFriends = filterFriendsByCategory(onlineFriends, selectedCategoryId);
    const filteredOfflineFriends = filterFriendsByCategory(offlineFriends, selectedCategoryId);

    const removeFriendsText = useMemo(() => {
        if (!selectedFriendsIds || !selectedFriendsIds.length) return '';

        const userNames: string[] = [];

        for (const userId of selectedFriendsIds) {
            let existingFriend: MessengerFriend = onlineFriends.find((f) => f.id === userId);

            if (!existingFriend) existingFriend = offlineFriends.find((f) => f.id === userId);

            if (!existingFriend) continue;

            userNames.push(existingFriend.name);
        }

        return LocalizeText('friendlist.removefriendconfirm.userlist', ['user_names'], [userNames.join('\n')]);
    }, [offlineFriends, onlineFriends, selectedFriendsIds]);

    const selectFriend = useCallback(
        (userId: number) => {
            if (userId < 0) return;

            setSelectedFriendsIds((prevValue) => {
                const newValue = [...prevValue];

                const existingUserIdIndex: number = newValue.indexOf(userId);

                if (existingUserIdIndex > -1) {
                    newValue.splice(existingUserIdIndex, 1);
                } else {
                    newValue.push(userId);
                }

                return newValue;
            });
        },
        [setSelectedFriendsIds]
    );

    const toggleSelectFriends = useCallback((friendIds: number[]) => {
        if (!friendIds.length) return;

        setSelectedFriendsIds((prevValue) => {
            const allSelected = friendIds.every((friendId) => prevValue.indexOf(friendId) >= 0);

            if (allSelected) return prevValue.filter((friendId) => friendIds.indexOf(friendId) === -1);

            const nextValue = [...prevValue];

            for (const friendId of friendIds) {
                if (nextValue.indexOf(friendId) === -1) nextValue.push(friendId);
            }

            return nextValue;
        });
    }, []);

    const sendRoomInvite = (message: string) => {
        if (!selectedFriendsIds.length || !message || !message.length || message.length > 255) return;

        SendMessageComposer(new SendRoomInviteComposer(message, selectedFriendsIds));

        setShowRoomInvite(false);
    };

    const removeSelectedFriends = () => {
        if (selectedFriendsIds.length === 0) return;

        setSelectedFriendsIds((prevValue) => {
            SendMessageComposer(new RemoveFriendComposer(...prevValue));

            return [];
        });

        setShowRemoveFriendsConfirmation(false);
    };

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible((prevValue) => !prevValue);
                        return;
                    case 'request':
                        if (parts.length < 4) return;

                        requestFriend(parseInt(parts[2]), parts[3]);
                }
            },
            eventUrlPrefix: 'friends/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [requestFriend]);

    if (!isVisible) return null;

    return (
        <>
            <NitroCardView
                className="nitro-friends min-w-0 w-[min(310px,calc(100vw-16px))] max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]"
                theme="primary-slim"
                uniqueKey="nitro-friends"
            >
                <NitroCardHeaderView headerText={LocalizeText('friendlist.friends')} onCloseClick={(event) => setIsVisible(false)} />
                <NitroCardContentView className="text-black p-0" gap={1} overflow="hidden">
                    <FriendsListGroupChipsView
                        categories={categories}
                        friends={friends}
                        selectedCategoryId={selectedCategoryId}
                        setSelectedCategoryId={setSelectedCategoryId}
                        onManageClick={() => setShowCategoryManager(true)}
                    />
                    <NitroCardAccordionView fullHeight overflow="hidden">
                        <NitroCardAccordionSetView
                            className="friends-list-section"
                            headerText={LocalizeText('friendlist.friends') + ` (${filteredOnlineFriends.length})`}
                            isExpanded={true}
                        >
                            <Flex className="friends-list-toolbar px-2 py-1" justifyContent="end">
                                <span
                                    className="friends-list-toolbar-link"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleSelectFriends(filteredOnlineFriends.map((friend) => friend.id));
                                    }}
                                >
                                    {filteredOnlineFriends.length && filteredOnlineFriends.every((friend) => selectedFriendsIds.indexOf(friend.id) >= 0)
                                        ? LocalizeText('friendlist.unselect_all')
                                        : LocalizeText('friendlist.select_all')}
                                </span>
                            </Flex>
                            <FriendsListGroupView list={filteredOnlineFriends} selectedFriendsIds={selectedFriendsIds} selectFriend={selectFriend} />
                        </NitroCardAccordionSetView>
                        <NitroCardAccordionSetView headerText={LocalizeText('friendlist.friends.offlinecaption') + ` (${filteredOfflineFriends.length})`}>
                            <Flex className="friends-list-toolbar px-2 py-1" justifyContent="end">
                                <span
                                    className="friends-list-toolbar-link"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleSelectFriends(filteredOfflineFriends.map((friend) => friend.id));
                                    }}
                                >
                                    {filteredOfflineFriends.length && filteredOfflineFriends.every((friend) => selectedFriendsIds.indexOf(friend.id) >= 0)
                                        ? LocalizeText('friendlist.unselect_all')
                                        : LocalizeText('friendlist.select_all')}
                                </span>
                            </Flex>
                            <FriendsListGroupView list={filteredOfflineFriends} selectedFriendsIds={selectedFriendsIds} selectFriend={selectFriend} />
                        </NitroCardAccordionSetView>
                        <FriendsListRequestView headerText={LocalizeText('friendlist.tab.friendrequests') + ` (${requests.length})`} isExpanded={true} />
                        <FriendsSearchView headerText={LocalizeText('people.search.title')} />
                    </NitroCardAccordionView>
                    {selectedFriendsIds && selectedFriendsIds.length > 0 && (
                        <Flex className="p-1" gap={1}>
                            <Button fullWidth onClick={() => setShowRoomInvite(true)}>
                                {LocalizeText('friendlist.tip.invite')}
                            </Button>
                            <Button fullWidth variant="danger" onClick={(event) => setShowRemoveFriendsConfirmation(true)}>
                                {LocalizeText('generic.delete')}
                            </Button>
                        </Flex>
                    )}
                </NitroCardContentView>
            </NitroCardView>
            {showRoomInvite && (
                <FriendsRoomInviteView selectedFriendsIds={selectedFriendsIds} sendRoomInvite={sendRoomInvite} onCloseClick={() => setShowRoomInvite(false)} />
            )}
            {showRemoveFriendsConfirmation && (
                <FriendsRemoveConfirmationView
                    removeFriendsText={removeFriendsText}
                    removeSelectedFriends={removeSelectedFriends}
                    selectedFriendsIds={selectedFriendsIds}
                    onCloseClick={() => setShowRemoveFriendsConfirmation(false)}
                />
            )}
            {showCategoryManager && <FriendsCategoryManagerView categories={categories} onCloseClick={() => setShowCategoryManager(false)} />}
        </>
    );
};
