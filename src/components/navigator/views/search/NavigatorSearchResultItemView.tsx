import { GetSessionDataManager, RoomDataParser } from '@nitrots/nitro-renderer';
import React, { FC, MouseEvent, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { CreateRoomSession, DoorStateType, TryVisitRoom } from '../../../../api';
import { Column, Flex, LayoutBadgeImageView, LayoutGridItemProps, LayoutRoomThumbnailView, Text } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import { NavigatorSearchResultItemInfoView } from './NavigatorSearchResultItemInfoView';

export interface NavigatorSearchResultItemViewProps extends LayoutGridItemProps
{
    roomData: RoomDataParser;
    thumbnail?: boolean;
    selectedRoomId?: number | null;
    setSelectedRoomId?: React.Dispatch<React.SetStateAction<number | null>>;
    isPopoverActive?: boolean;
    setIsPopoverActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = props =>
{
    const { roomData = null, children = null, thumbnail = false, selectedRoomId, setSelectedRoomId, isPopoverActive, setIsPopoverActive, ...rest } = props;
    const { setDoorData = null } = useNavigator();

    const handleMouseEnter = () =>
    {
        if(isPopoverActive && setSelectedRoomId) setSelectedRoomId(roomData.roomId);
    };

    const handleMouseLeave = () =>
    {
        if(setSelectedRoomId && setIsPopoverActive)
        {
            setSelectedRoomId(null);
            setIsPopoverActive(false);
        }
    };

    const handleInfoClick = (e: React.MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();

        if(setIsPopoverActive && setSelectedRoomId)
        {
            if(!isPopoverActive)
            {
                setSelectedRoomId(roomData.roomId);
                setIsPopoverActive(true);
            }
            else if(selectedRoomId === roomData.roomId)
            {
                setSelectedRoomId(null);
                setIsPopoverActive(false);
            }
            else
            {
                setSelectedRoomId(roomData.roomId);
            }
        }
    };

    useEffect(() =>
    {
        const handleClickOutside = (event: Event) =>
        {
            const target = event.target as HTMLElement;
            const navigatorItem = target.closest('.navigator-item');

            if(!navigatorItem && setIsPopoverActive && setSelectedRoomId)
            {
                setIsPopoverActive(false);
                setSelectedRoomId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [ setIsPopoverActive, setSelectedRoomId ]);

    const getUserCounterColor = () =>
    {
        const num: number = (100 * (roomData.userCount / roomData.maxUserCount));

        if(num >= 92) return 'bg-danger';
        if(num >= 50) return 'bg-warning';
        if(num > 0) return 'bg-success';

        return 'bg-primary';
    };

    const visitRoom = (event: MouseEvent) =>
    {
        if(roomData.ownerId !== GetSessionDataManager().userId)
        {
            if(roomData.habboGroupId !== 0)
            {
                TryVisitRoom(roomData.roomId);
                return;
            }

            switch(roomData.doorMode)
            {
                case RoomDataParser.DOORBELL_STATE:
                    setDoorData(prevValue =>
                    {
                        const newValue = { ...prevValue };
                        newValue.roomInfo = roomData;
                        newValue.state = DoorStateType.START_DOORBELL;
                        return newValue;
                    });
                    return;
                case RoomDataParser.PASSWORD_STATE:
                    setDoorData(prevValue =>
                    {
                        const newValue = { ...prevValue };
                        newValue.roomInfo = roomData;
                        newValue.state = DoorStateType.START_PASSWORD;
                        return newValue;
                    });
                    return;
            }
        }

        CreateRoomSession(roomData.roomId);
    };

    if(thumbnail) return (
        <Column
            pointer
            overflow="hidden"
            alignItems="center"
            className="navigator-item p-1 bg-light rounded-3 small mb-1 flex-col border border-muted"
            gap={ 0 }
            onClick={ visitRoom }
            onMouseEnter={ handleMouseEnter }
            onMouseLeave={ handleMouseLeave }
            { ...rest }
        >
            <LayoutRoomThumbnailView className="flex flex-col items-center justify-end mb-1" customUrl={ roomData.officialRoomPicRef } roomId={ roomData.roomId }>
                { roomData.habboGroupId > 0 && <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } className="absolute top-0 inset-s-0 m-1" isGroup={ true } /> }
                <Flex center className={ 'inline-block px-[.65em] py-[.35em] text-[.75em] font-bold leading-none text-white text-center whitespace-nowrap align-baseline rounded-[.25rem] p-1 absolute m-1 ' + getUserCounterColor() } gap={ 1 }>
                    <FaUser className="fa-icon" />
                    { roomData.userCount }
                </Flex>
                { (roomData.doorMode !== RoomDataParser.OPEN_STATE) &&
                    <i className={ ('absolute inset-e-0 mb-1 me-1 icon icon-navigator-room-' + ((roomData.doorMode === RoomDataParser.DOORBELL_STATE) ? 'locked' : (roomData.doorMode === RoomDataParser.PASSWORD_STATE) ? 'password' : (roomData.doorMode === RoomDataParser.INVISIBLE_STATE) ? 'invisible' : '')) } /> }
            </LayoutRoomThumbnailView>
            <Flex className="w-full">
                <Text truncate className="grow!">{ roomData.roomName }</Text>
                <Flex reverse alignItems="center" gap={ 1 }>
                    <NavigatorSearchResultItemInfoView
                        isVisible={ selectedRoomId === roomData.roomId }
                        onToggle={ handleInfoClick }
                        setIsPopoverActive={ setIsPopoverActive }
                        roomData={ roomData }
                    />
                </Flex>
                { children }
            </Flex>
        </Column>
    );

    return (
        <Flex
            pointer
            alignItems="center"
            className="navigator-item px-2 py-1 small"
            gap={ 2 }
            overflow="hidden"
            onClick={ visitRoom }
            onMouseEnter={ handleMouseEnter }
            onMouseLeave={ handleMouseLeave }
            { ...rest }
        >
            <Flex center className={ 'inline-block px-[.65em] py-[.35em] text-[.75em] font-bold leading-none text-white text-center whitespace-nowrap align-baseline rounded-[.25rem] p-1 ' + getUserCounterColor() } gap={ 1 }>
                <FaUser className="fa-icon" />
                { roomData.userCount }
            </Flex>
            <Text grow truncate className="min-w-0">{ roomData.roomName }</Text>
            <Flex reverse alignItems="center" gap={ 1 } className="shrink-0">
                <NavigatorSearchResultItemInfoView
                    isVisible={ selectedRoomId === roomData.roomId && isPopoverActive }
                    onToggle={ handleInfoClick }
                    setIsPopoverActive={ setIsPopoverActive }
                    roomData={ roomData }
                />
                { roomData.habboGroupId > 0 && <i className="nitro-icon icon-navigator-room-group" /> }
                { (roomData.doorMode !== RoomDataParser.OPEN_STATE) &&
                    <i className={ ('nitro-icon icon-navigator-room-' + ((roomData.doorMode === RoomDataParser.DOORBELL_STATE) ? 'locked' : (roomData.doorMode === RoomDataParser.PASSWORD_STATE) ? 'password' : (roomData.doorMode === RoomDataParser.INVISIBLE_STATE) ? 'invisible' : '')) } /> }
            </Flex>
            { children }
        </Flex>
    );
};
