import { FindNewFriendsMessageComposer, MouseEventType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetUserProfile, LocalizeText, MessengerFriend, OpenMessengerChat, SendMessageComposer } from '../../../../api';
import { Button, LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../common';
import { useFriends } from '../../../../hooks';

export const FriendBarItemView: FC<{ friend: MessengerFriend }> = props =>
{
    const { friend = null } = props;
    const [ isVisible, setVisible ] = useState(false);
    const { followFriend = null } = useFriends();
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const onClick = (event: MouseEvent) =>
        {
            const element = elementRef.current;

            if(!element) return;

            if((event.target !== element) && !element.contains((event.target as Node)))
            {
                setVisible(false);
            }
        };

        document.addEventListener(MouseEventType.MOUSE_CLICK, onClick);

        return () => document.removeEventListener(MouseEventType.MOUSE_CLICK, onClick);
    }, []);

    if(!friend)
    {
        return (
            <div ref={ elementRef } className={ 'friend-bar-item btn btn-secondary w-[130px] mx-[3px] my-0 z-0 relative pl-[37px] text-left friend-bar-search ' + (isVisible ? 'friend-bar-search-item-active' : '') } onClick={ () => setVisible(prev => !prev) }>
                <div className="friend-bar-item-head absolute -top-[3px] left-[5px] w-[31px] h-[34px] bg-[url('@/assets/images/toolbar/friend-search.png')]" />
                <div className="truncate text-white text-[13px]">{ LocalizeText('friend.bar.find.title') }</div>
                { isVisible &&
                    <div className="search-content mt-3">
                        <div className="bg-white text-black px-1 py-1 text-xs">{ LocalizeText('friend.bar.find.text') }</div>
                        <Button className="mt-2 mb-4" variant="secondary" onClick={ () => SendMessageComposer(new FindNewFriendsMessageComposer()) }>{ LocalizeText('friend.bar.find.button') }</Button>
                    </div> }
            </div>
        );
    }

    return (
        <div ref={ elementRef } className={ `friend-bar-item btn btn-success ${ isVisible ? 'w-[165px]' : 'w-[130px]' } mx-[3px] my-0 z-0 relative text-left${ isVisible ? ' mb-[84px]' : '' }` } style={{ paddingLeft: friend.id > 0 ? '70px' : '46px', paddingRight: isVisible ? '4px' : undefined }} onClick={ () => setVisible(prev => !prev) }>
            <div className={ `friend-bar-item-head absolute ${ friend.id > 0 ? '-top-[31px] -left-[25px]' : '-top-[5px] -left-[3.5px]' }` }>
                { (friend.id > 0) &&
                    <LayoutAvatarImageView direction={ isVisible ? 2 : 3 } figure={ friend.figure } headOnly={ !isVisible } /> }
                { (friend.id <= 0) &&
                    <LayoutBadgeImageView badgeCode="ADM" isGroup={ false } /> }
            </div>
            <div className="truncate text-white text-[13px]">{ friend.name }</div>
            { isVisible &&
                <div className="flex justify-between gap-2 mt-1">
                    <div className="cursor-pointer nitro-friends-spritesheet icon-friendbar-chat" onClick={ event => { event.stopPropagation(); OpenMessengerChat(friend.id); } } />
                    { friend.followingAllowed &&
                        <div className="cursor-pointer nitro-friends-spritesheet icon-friendbar-visit" onClick={ event => { event.stopPropagation(); followFriend(friend); } } /> }
                    <div className="cursor-pointer nitro-friends-spritesheet icon-profile" onClick={ event => { event.stopPropagation(); GetUserProfile(friend.id); } } />
                </div> }
        </div>
    );
};
