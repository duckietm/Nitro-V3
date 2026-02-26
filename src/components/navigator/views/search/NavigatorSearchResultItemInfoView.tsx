import { RoomDataParser, RoomSettingsComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import React, { FC, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { ArrowContainer, Popover } from 'react-tiny-popover';
import { GetGroupInformation, GetSessionDataManager, GetUserProfile, LocalizeText, ReportType, SendMessageComposer, ToggleFavoriteRoom } from '../../../../api';
import { Column, Flex, LayoutBadgeImageView, LayoutRoomThumbnailView, NitroCardContentView, Text, UserProfileIconView } from '../../../../common';
import { useHelp, useNavigator } from '../../../../hooks';
import { classNames } from '../../../../layout';

interface NavigatorSearchResultItemInfoViewProps
{
    roomData: RoomDataParser;
    isVisible?: boolean;
    onToggle?: (e: React.MouseEvent) => void;
    setIsPopoverActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NavigatorSearchResultItemInfoView: FC<NavigatorSearchResultItemInfoViewProps> = props =>
{
    const { roomData = null, isVisible = undefined, onToggle, setIsPopoverActive } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const [ internalVisible, setInternalVisible ] = useState(false);
    const { navigatorData = null, favouriteRoomIds = [] } = useNavigator();
    const { report = null } = useHelp();

    const isControlled = isVisible !== undefined;
    const popoverOpen = isControlled ? isVisible : internalVisible;

    const getUserCounterColor = () =>
    {
        const num: number = (100 * (roomData.userCount / roomData.maxUserCount));

        if(num >= 92) return 'bg-danger';
        if(num >= 50) return 'bg-warning';
        if(num > 0) return 'bg-success';

        return 'bg-primary';
    };

    const processAction = (action: string) =>
    {
        if(!navigatorData || !roomData) return;

        switch(action)
        {
            case 'set_home_room':
            {
                let newRoomId = -1;
                if(navigatorData.homeRoomId !== roomData.roomId) newRoomId = roomData.roomId;
                if(newRoomId > 0) SendMessageComposer(new UpdateHomeRoomMessageComposer(newRoomId));
                return;
            }
            case 'open_room_settings':
                SendMessageComposer(new RoomSettingsComposer(roomData.roomId));
                return;
            case 'report_room':
                report(ReportType.ROOM, { roomId: roomData.roomId, roomName: roomData.roomName });
                return;
            case 'room_favourite':
                ToggleFavoriteRoom(roomData.roomId, favouriteRoomIds.includes(roomData.roomId));
                return;
        }
    };

    const handleOwnerClick = (e: React.MouseEvent) =>
    {
        e.stopPropagation();
        GetUserProfile(roomData.ownerId);
    };

    const handleGroupClick = (e: React.MouseEvent) =>
    {
        e.stopPropagation();
        GetGroupInformation(roomData.habboGroupId);
    };

    const getTradeModeText = (): string =>
    {
        if(roomData.tradeMode === 1) return LocalizeText('trading.mode.free');
        return LocalizeText('trading.mode.not.allowed');
    };

    const handleIconClick = (e: React.MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        if(onToggle) onToggle(e);
    };

    return (
        <Popover
            containerClassName="max-w-[276px] not-italic font-normal leading-normal text-left no-underline text-shadow-none normal-case tracking-[normal] [word-break:normal] [word-spacing:normal] whitespace-normal text-[.7875rem] [word-wrap:break-word] bg-[#dfdfdf] bg-clip-padding border border-[solid] border-[#283F5D] rounded-[.25rem] [box-shadow:0_2px_#00000073] z-[1070]"
            content={ ({ position, childRect, popoverRect }) => (
                <ArrowContainer
                    arrowColor="black"
                    arrowSize={ 7 }
                    arrowStyle={ { left: 'calc(-.5rem - 0px)' } }
                    childRect={ childRect }
                    popoverRect={ popoverRect }
                    position={ position }
                >
                    <NitroCardContentView className="bg-transparent room-info image-rendering-pixelated" overflow="hidden" onClick={ e => e.stopPropagation() }>
                        <Flex gap={ 1 } overflow="hidden" className="p-2">
                            <LayoutRoomThumbnailView className="flex flex-col items-center justify-end mb-1" customUrl={ roomData.officialRoomPicRef } roomId={ roomData.roomId }>
                                { roomData.habboGroupId > 0 && (
                                    <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } className="absolute top-0 inset-s-0 m-1" isGroup={ true } />) }
                                { roomData.doorMode !== RoomDataParser.OPEN_STATE && (
                                    <i className={ 'absolute inset-e-0 mb-1 me-1 icon icon-navigator-room-' + (roomData.doorMode === RoomDataParser.DOORBELL_STATE ? 'locked' : roomData.doorMode === RoomDataParser.PASSWORD_STATE ? 'password' : roomData.doorMode === RoomDataParser.INVISIBLE_STATE ? 'invisible' : '') } />) }
                            </LayoutRoomThumbnailView>
                            <Column gap={ 1 }>
                                <Text bold className="grow" style={ { maxHeight: 13 } }>
                                    { roomData.roomName.length > 35 ? roomData.roomName.substring(0, 35) + '…' : roomData.roomName }
                                </Text>
                                <Text className="grow text-xs">{ roomData.description }</Text>
                            </Column>
                        </Flex>
                        <Column gap={ 0 } className="px-2 pb-2">
                            <Flex alignItems="center" className="mb-2">
                                { roomData.ownerName && roomData.ownerName.length > 0 &&
                                    <Flex onClick={ handleOwnerClick } gap={ 1 } className="w-1/2 items-center cursor-pointer">
                                        <UserProfileIconView userId={ roomData.ownerId } />
                                        <Text pointer bold underline>{ roomData.ownerName }</Text>
                                    </Flex> }
                                { roomData.habboGroupId > 0 &&
                                    <Flex onClick={ handleGroupClick } gap={ 1 } className="w-1/2 items-center cursor-pointer">
                                        <i className="icon icon-navigator-room-group" />
                                        <Text bold underline className="truncate" style={ { maxWidth: 100 } }>{ roomData.groupName }</Text>
                                    </Flex> }
                            </Flex>
                            <Flex gap={ 4 } className="w-full">
                                <Column className="w-3/5" gap={ 1 }>
                                    <Flex gap={ 2 } alignItems="center">
                                        <Text bold className="text-xs">{ LocalizeText('navigator.roompopup.property.trading') }</Text>
                                        <Text className="text-xs">{ getTradeModeText() }</Text>
                                    </Flex>
                                    <Flex gap={ 2 } alignItems="center">
                                        <Text bold className="text-xs">{ LocalizeText('navigator.roompopup.property.max_users') }</Text>
                                        <Text className="text-xs">{ roomData.maxUserCount }</Text>
                                    </Flex>
                                    <Flex gap={ 1 } alignItems="center">
                                        <Flex center className={ 'rounded px-1 py-0.5 text-xs font-bold text-white ' + getUserCounterColor() } gap={ 1 }>
                                            <FaUser className="fa-icon" />
                                            { roomData.userCount }
                                        </Flex>
                                    </Flex>
                                </Column>
                                <Column alignItems="start" gap={ 2 } className="w-2/5">
                                    <Flex pointer alignItems="center" gap={ 2 } onClick={ () => processAction('room_favourite') }>
                                        <i className={ classNames('icon icon-navigator-favorite-room', favouriteRoomIds.includes(roomData.roomId) ? 'active' : '') } />
                                        <Text className="text-xs">{ LocalizeText('navigator.room.popup.room.info.favorite') }</Text>
                                    </Flex>
                                    <Flex pointer alignItems="center" gap={ 2 } onClick={ () => processAction('set_home_room') }>
                                        <i className={ classNames('icon icon-navigator-my-room', (navigatorData?.homeRoomId !== roomData.roomId) ? '' : 'active') } />
                                        <Text className="text-xs">{ LocalizeText('navigator.room.popup.room.info.home') }</Text>
                                    </Flex>
                                    { GetSessionDataManager().userId === roomData.ownerId &&
                                        <Flex pointer alignItems="center" gap={ 2 } onClick={ () => processAction('open_room_settings') }>
                                            <i className="icon icon-navigator-room-settings" />
                                            <Text className="text-xs">{ LocalizeText('navigator.room.popup.info.room.settings') }</Text>
                                        </Flex> }
                                    { GetSessionDataManager().userId !== roomData.ownerId &&
                                        <Flex pointer alignItems="center" gap={ 2 } onClick={ () => processAction('report_room') }>
                                            <i className="icon icon-navigator-room-report" />
                                            <Text className="text-xs">{ LocalizeText('navigator.room.popup.report.room') }</Text>
                                        </Flex> }
                                </Column>
                            </Flex>
                            { roomData.tags && roomData.tags.length > 0 &&
                                <Flex gap={ 1 } className="mt-1">
                                    { roomData.tags.map((tag, i) => (
                                        <Text key={ i } variant="white" className="bg-orange-500 px-1 rounded text-xs">#{ tag }</Text>
                                    )) }
                                </Flex> }
                        </Column>
                    </NitroCardContentView>
                </ArrowContainer>
            ) }
            isOpen={ popoverOpen }
            onClickOutside={ () =>
            {
                if(!isControlled) setInternalVisible(false);
                if(setIsPopoverActive) setIsPopoverActive(false);
            } }
            padding={ 10 }
            positions={ [ 'right', 'left', 'top', 'bottom' ] }
        >
            <div
                ref={ elementRef }
                className="cursor-pointer nitro-icon icon-navigator-info"
                onClick={ handleIconClick }
                onMouseOver={ () => { if(!isControlled) setInternalVisible(true); } }
                onMouseLeave={ () => { if(!isControlled) setInternalVisible(false); } }
            />
        </Popover>
    );
};
