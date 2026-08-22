import { GetSessionDataManager, RoomDataParser } from '@nitrots/nitro-renderer';
import React, { FC, KeyboardEvent, MouseEvent, useEffect, useRef } from 'react';
import { CreateRoomSession, DoorStateType, TryVisitRoom } from '../../../../api';
import { Column, Flex, LayoutBadgeImageView, LayoutGridItemProps, LayoutRoomThumbnailView, Text } from '../../../../common';
import { useDoorState } from '../../../../hooks';
import { NavigatorSearchResultItemInfoView } from './NavigatorSearchResultItemInfoView';
import { NavigatorUserCountView } from './NavigatorUserCountView';

export interface NavigatorSearchResultItemViewProps extends LayoutGridItemProps {
    roomData: RoomDataParser;
    thumbnail?: boolean;
    selectedRoomId?: number | null;
    setSelectedRoomId?: React.Dispatch<React.SetStateAction<number | null>>;
    isPopoverActive?: boolean;
    setIsPopoverActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = (props) => {
    const { roomData = null, children = null, thumbnail = false, selectedRoomId, setSelectedRoomId, isPopoverActive, setIsPopoverActive, ...rest } = props;
    const { setSnapshot: setDoorData } = useDoorState();
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const selectedRoomIdRef = useRef(selectedRoomId);

    selectedRoomIdRef.current = selectedRoomId;

    const cancelPopoverClose = () => {
        if (!closeTimeoutRef.current) return;

        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
    };

    const schedulePopoverClose = () => {
        if (!setSelectedRoomId || !setIsPopoverActive) return;

        cancelPopoverClose();
        closeTimeoutRef.current = setTimeout(() => {
            closeTimeoutRef.current = null;
            if (selectedRoomIdRef.current !== roomData.roomId) return;

            setSelectedRoomId(null);
            setIsPopoverActive(false);
        }, 150);
    };

    const handleMouseEnter = () => {
        if (!setSelectedRoomId || !setIsPopoverActive) return;

        cancelPopoverClose();
        setSelectedRoomId(roomData.roomId);
        setIsPopoverActive(true);
    };

    const handleInfoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cancelPopoverClose();

        if (setIsPopoverActive && setSelectedRoomId) {
            if (!isPopoverActive) {
                setSelectedRoomId(roomData.roomId);
                setIsPopoverActive(true);
            } else if (selectedRoomId === roomData.roomId) {
                setSelectedRoomId(null);
                setIsPopoverActive(false);
            } else {
                setSelectedRoomId(roomData.roomId);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            const target = event.target as HTMLElement;
            const navigatorItem = target.closest('.navigator-item');

            if (!navigatorItem && setIsPopoverActive && setSelectedRoomId) {
                setIsPopoverActive(false);
                setSelectedRoomId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        const handleEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape' || !setIsPopoverActive || !setSelectedRoomId) return;

            setIsPopoverActive(false);
            setSelectedRoomId(null);
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [setIsPopoverActive, setSelectedRoomId]);

    const doorClass = () => {
        if (roomData.doorMode === RoomDataParser.DOORBELL_STATE) return 'nitro-navigator-air__door nitro-navigator-air__door--doorbell';
        if (roomData.doorMode === RoomDataParser.PASSWORD_STATE) return 'nitro-navigator-air__door nitro-navigator-air__door--password';
        if (roomData.doorMode === RoomDataParser.INVISIBLE_STATE) return 'nitro-navigator-air__door nitro-navigator-air__door--invisible';

        return '';
    };

    const visitRoom = (event: MouseEvent) => {
        if (roomData.ownerId !== GetSessionDataManager().userId) {
            if (roomData.habboGroupId !== 0) {
                TryVisitRoom(roomData.roomId);
                return;
            }

            switch (roomData.doorMode) {
                case RoomDataParser.DOORBELL_STATE:
                    setDoorData((prevValue) => {
                        const newValue = { ...prevValue };
                        newValue.roomInfo = roomData;
                        newValue.state = DoorStateType.START_DOORBELL;
                        return newValue;
                    });
                    return;
                case RoomDataParser.PASSWORD_STATE:
                    setDoorData((prevValue) => {
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

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        visitRoom(event as unknown as MouseEvent);
    };

    if (thumbnail)
        return (
            <Column
                pointer
                overflow="hidden"
                alignItems="center"
                className="navigator-item nitro-navigator-air__tile nitro-card-row small mb-1 flex-col"
                role="button"
                tabIndex={0}
                aria-label={roomData.roomName}
                gap={0}
                onClick={visitRoom}
                onKeyDown={handleKeyDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={schedulePopoverClose}
                {...rest}
            >
                <LayoutRoomThumbnailView className="nitro-navigator-air__tile-thumb" customUrl={roomData.officialRoomPicRef} roomId={roomData.roomId}>
                    {roomData.habboGroupId > 0 && (
                        <LayoutBadgeImageView
                            badgeCode={roomData.groupBadgeCode}
                            className="absolute! bottom-0 left-1/2 z-10 mb-1 -translate-x-1/2"
                            isGroup={true}
                        />
                    )}
                    <NavigatorUserCountView userCount={roomData.userCount} maxUserCount={roomData.maxUserCount} />
                    {roomData.doorMode !== RoomDataParser.OPEN_STATE && <i className={`absolute inset-e-0 mb-1 me-1 ${doorClass()}`} />}
                </LayoutRoomThumbnailView>
                <Flex className="nitro-navigator-air__tile-name">
                    <Text truncate className="grow!">
                        {roomData.roomName}
                    </Text>
                    <Flex reverse alignItems="center" gap={1}>
                        <NavigatorSearchResultItemInfoView
                            isVisible={selectedRoomId === roomData.roomId}
                            onToggle={handleInfoClick}
                            onHoverEnter={cancelPopoverClose}
                            onHoverLeave={schedulePopoverClose}
                            setIsPopoverActive={setIsPopoverActive}
                            roomData={roomData}
                        />
                    </Flex>
                    {children}
                </Flex>
            </Column>
        );

    return (
        <Flex
            pointer
            alignItems="center"
            className="navigator-item px-2 py-1 small"
            role="button"
            tabIndex={0}
            aria-label={roomData.roomName}
            gap={2}
            overflow="hidden"
            onClick={visitRoom}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={schedulePopoverClose}
            {...rest}
        >
            <NavigatorUserCountView userCount={roomData.userCount} maxUserCount={roomData.maxUserCount} />
            <Text grow truncate className="min-w-0">
                {roomData.roomName}
            </Text>
            <Flex reverse alignItems="center" gap={1} className="shrink-0">
                <NavigatorSearchResultItemInfoView
                    isVisible={selectedRoomId === roomData.roomId && isPopoverActive}
                    onToggle={handleInfoClick}
                    onHoverEnter={cancelPopoverClose}
                    onHoverLeave={schedulePopoverClose}
                    setIsPopoverActive={setIsPopoverActive}
                    roomData={roomData}
                />
                {roomData.habboGroupId > 0 && <i className="nitro-navigator-air__group" />}
                {roomData.doorMode !== RoomDataParser.OPEN_STATE && <i className={doorClass()} />}
            </Flex>
            {children}
        </Flex>
    );
};
