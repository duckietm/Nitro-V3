import { FriendCategoryData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { countFriendsByCategory, LocalizeText, MessengerFriend } from '../../../../api';
import { Flex } from '../../../../common';

interface FriendsListGroupChipsViewProps {
    categories: FriendCategoryData[];
    friends: MessengerFriend[];
    selectedCategoryId: number;
    setSelectedCategoryId: (id: number) => void;
    onManageClick: () => void;
}

export const FriendsListGroupChipsView: FC<FriendsListGroupChipsViewProps> = (props) => {
    const { categories = [], friends = [], selectedCategoryId = 0, setSelectedCategoryId = null, onManageClick = null } = props;

    const counts = countFriendsByCategory(friends);

    return (
        <Flex alignItems="center" className="friends-group-chips px-2 py-1" gap={1}>
            <Flex alignItems="center" className="friends-group-chips-scroll" gap={1}>
                <div className={`friends-group-chip${selectedCategoryId === 0 ? ' active' : ''}`} onClick={() => setSelectedCategoryId(0)}>
                    {LocalizeText('friendlist.friends')} ({friends.length})
                </div>
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`friends-group-chip${selectedCategoryId === category.id ? ' active' : ''}`}
                        onClick={() => setSelectedCategoryId(category.id)}
                    >
                        {category.name} ({counts.get(category.id) ?? 0})
                    </div>
                ))}
            </Flex>
            <div className="friends-group-chip friends-group-chip-manage ms-auto" title={LocalizeText('friendlist.friends')} onClick={onManageClick}>
                {'⚙'}
            </div>
        </Flex>
    );
};
