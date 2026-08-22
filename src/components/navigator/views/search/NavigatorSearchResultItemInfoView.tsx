import { RoomDataParser, RoomSettingsComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import * as Popover from '@radix-ui/react-popover';
import React, { FC, useRef, useState } from 'react';
import {
    FriendlyTime,
    GetConfigurationValue,
    GetGroupInformation,
    GetSessionDataManager,
    GetUserProfile,
    LocalizeText,
    ReportType,
    SendMessageComposer
} from '../../../../api';
import { Column, Flex, LayoutBadgeImageView, LayoutRoomThumbnailView, NitroCardContentView, Text, UserProfileIconView } from '../../../../common';
import { useHelp, useNavigatorData, useNavigatorFavourite } from '../../../../hooks';
import { classNames } from '../../../../layout';

interface NavigatorSearchResultItemInfoViewProps {
    roomData: RoomDataParser;
    isVisible?: boolean;
    onToggle?: (event: React.MouseEvent) => void;
    onHoverEnter?: () => void;
    onHoverLeave?: () => void;
    setIsPopoverActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NavigatorSearchResultItemInfoView: FC<NavigatorSearchResultItemInfoViewProps> = (props) => {
    const { roomData = null, isVisible = undefined, onToggle, onHoverEnter, onHoverLeave, setIsPopoverActive } = props;
    const elementRef = useRef<HTMLButtonElement>(null);
    const [internalVisible, setInternalVisible] = useState(false);
    const { navigatorData } = useNavigatorData();
    const { isFavourite, toggle: toggleFavourite } = useNavigatorFavourite(roomData?.roomId);
    const { report = null } = useHelp();

    const isControlled = isVisible !== undefined;
    const popoverOpen = isControlled ? isVisible : internalVisible;
    const hasGroup = roomData?.groupBadgeCode?.length > 0;
    const showOwner = roomData?.showOwner && roomData.ownerName?.length > 0;
    const hasOwnerOrGroup = showOwner || hasGroup;
    const hasActiveRoomAd = roomData?.roomAdExpiresInMin > 0;
    const rankingEnabled = GetConfigurationValue<boolean>('room.ranking.enabled', false);
    const roomReportingEnabled = GetConfigurationValue<boolean>('room.report.enabled', true);

    const handleOpenChange = (open: boolean) => {
        if (!isControlled) setInternalVisible(open);
        if (!open && setIsPopoverActive) setIsPopoverActive(false);
    };

    const processAction = (action: string) => {
        if (!navigatorData || !roomData) return;

        switch (action) {
            case 'set_home_room': {
                if (navigatorData.homeRoomId !== roomData.roomId) SendMessageComposer(new UpdateHomeRoomMessageComposer(roomData.roomId));
                return;
            }
            case 'open_room_settings':
                SendMessageComposer(new RoomSettingsComposer(roomData.roomId));
                return;
            case 'report_room':
                report?.(ReportType.ROOM, { roomId: roomData.roomId, roomName: roomData.roomName });
                return;
            case 'room_favourite':
                toggleFavourite();
                return;
        }
    };

    const handleOwnerClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        GetUserProfile(roomData.ownerId);
    };

    const handleGroupClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        GetGroupInformation(roomData.habboGroupId);
    };

    const getTradeModeText = () => {
        switch (roomData.tradeMode) {
            case 1:
                return LocalizeText('trading.mode.controller');
            case 2:
                return LocalizeText('trading.mode.free');
            default:
                return LocalizeText('trading.mode.not.allowed');
        }
    };

    const getDoorIcon = () => {
        if (roomData.doorMode === RoomDataParser.DOORBELL_STATE) return 'doorbell';
        if (roomData.doorMode === RoomDataParser.PASSWORD_STATE) return 'password';
        if (roomData.doorMode === RoomDataParser.INVISIBLE_STATE) return 'invisible';

        return '';
    };

    const handleIconClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle?.(event);
    };

    return (
        <Popover.Root open={popoverOpen} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    ref={elementRef}
                    className="nitro-navigator-air__room-info"
                    aria-label={LocalizeText('navigator.room.popup.room.info')}
                    onClick={handleIconClick}
                    onMouseOver={() => {
                        if (!isControlled) setInternalVisible(true);
                    }}
                    onMouseLeave={() => {
                        if (!isControlled) setInternalVisible(false);
                    }}
                />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="right"
                    sideOffset={10}
                    collisionPadding={8}
                    className="nitro-navigator-air__room-popover not-italic font-normal leading-normal text-left no-underline normal-case tracking-normal whitespace-normal text-[.7875rem] [word-wrap:break-word] border border-black z-[1070]"
                    style={{ width: 360, maxWidth: 'calc(100vw - 16px)' }}
                    onMouseEnter={onHoverEnter}
                    onMouseLeave={onHoverLeave}
                >
                    <NitroCardContentView
                        className="nitro-navigator-air__room-popover-body image-rendering-pixelated !p-0"
                        overflow="hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="nitro-navigator-air__room-popover-header">
                            <LayoutRoomThumbnailView
                                className="nitro-navigator-air__room-popover-thumbnail flex flex-col items-center justify-end"
                                customUrl={roomData.officialRoomPicRef}
                                roomId={roomData.roomId}
                            >
                                {hasGroup && (
                                    <LayoutBadgeImageView
                                        badgeCode={roomData.groupBadgeCode}
                                        className="absolute! bottom-0 left-1/2 z-10 mb-1 -translate-x-1/2"
                                        isGroup={true}
                                    />
                                )}
                                {roomData.doorMode !== RoomDataParser.OPEN_STATE && (
                                    <i className={`absolute inset-e-0 mb-1 me-1 nitro-navigator-air__door nitro-navigator-air__door--${getDoorIcon()}`} />
                                )}
                            </LayoutRoomThumbnailView>
                            <Column gap={1} className="nitro-navigator-air__room-popover-copy">
                                <Text bold className="nitro-navigator-air__room-popover-title">
                                    {roomData.roomName.length > 35 ? roomData.roomName.substring(0, 35) + '…' : roomData.roomName}
                                </Text>
                                {roomData.description && <Text className="nitro-navigator-air__room-popover-description">{roomData.description}</Text>}
                            </Column>
                        </div>
                        <Column gap={0} className="nitro-navigator-air__room-popover-content">
                            {hasOwnerOrGroup && (
                                <Flex alignItems="center" className="nitro-navigator-air__room-popover-owner-row">
                                    {showOwner && (
                                        <Flex onClick={handleOwnerClick} gap={1} className="items-center cursor-pointer">
                                            <UserProfileIconView userId={roomData.ownerId} />
                                            <Text pointer bold underline>
                                                {roomData.ownerName}
                                            </Text>
                                        </Flex>
                                    )}
                                    {hasGroup && (
                                        <Flex onClick={handleGroupClick} gap={1} className="items-center cursor-pointer ms-auto">
                                            <i className="nitro-navigator-air__group" />
                                            <Text bold underline className="truncate" style={{ maxWidth: 130 }}>
                                                {roomData.groupName}
                                            </Text>
                                        </Flex>
                                    )}
                                </Flex>
                            )}
                            <div className="nitro-navigator-air__room-popover-details">
                                <div className="nitro-navigator-air__room-popover-properties">
                                    <Text bold>{LocalizeText('navigator.roompopup.property.trading')}</Text>
                                    <Text>{getTradeModeText()}</Text>
                                    {rankingEnabled && (
                                        <>
                                            <Text bold>{LocalizeText('navigator.roompopup.property.ranking')}</Text>
                                            <Text>{roomData.ranking}</Text>
                                        </>
                                    )}
                                    <Text bold>{LocalizeText('navigator.roompopup.property.max_users')}</Text>
                                    <Text>{roomData.maxUserCount}</Text>
                                </div>
                                <div className="nitro-navigator-air__room-popover-actions">
                                    <button type="button" onClick={() => processAction('room_favourite')}>
                                        <i className={classNames('icon icon-navigator-favorite-room', isFavourite ? 'active' : '')} />
                                        <span>{LocalizeText('navigator.room.popup.room.info.favorite')}</span>
                                    </button>
                                    <button type="button" onClick={() => processAction('set_home_room')}>
                                        <i
                                            className={classNames('icon icon-navigator-my-room', navigatorData?.homeRoomId === roomData.roomId ? 'active' : '')}
                                        />
                                        <span>{LocalizeText('navigator.room.popup.room.info.home')}</span>
                                    </button>
                                    {GetSessionDataManager().userId === roomData.ownerId && (
                                        <button type="button" onClick={() => processAction('open_room_settings')}>
                                            <i className="icon icon-navigator-room-settings" />
                                            <span>{LocalizeText('navigator.room.popup.info.room.settings')}</span>
                                        </button>
                                    )}
                                    {roomReportingEnabled && GetSessionDataManager().userId !== roomData.ownerId && (
                                        <button type="button" onClick={() => processAction('report_room')}>
                                            <i className="icon icon-navigator-room-report" />
                                            <span>{LocalizeText('navigator.room.popup.report.room')}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {roomData.tags && roomData.tags.length > 0 && (
                                <Flex gap={1} className="nitro-navigator-air__room-popover-tags">
                                    {roomData.tags.map((tag, index) => (
                                        <Text key={index} variant="white" className="bg-orange-500 px-1 rounded text-xs">
                                            #{tag}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                            {hasActiveRoomAd && (
                                <div className="nitro-navigator-air__room-popover-event">
                                    <i className="nitro-navigator-air__room-popover-event-icon" aria-hidden="true" />
                                    <div className="nitro-navigator-air__room-popover-event-copy">
                                        <Text bold className="nitro-navigator-air__room-popover-event-name">
                                            {LocalizeText('navigator.eventsettings.name')}: {roomData.roomAdName}
                                        </Text>
                                        <Text className="nitro-navigator-air__room-popover-event-description">
                                            {LocalizeText('navigator.eventsettings.desc')}: {roomData.roomAdDescription}
                                            <br />
                                            {LocalizeText('roomad.event.expiration_time')} {FriendlyTime.format(roomData.roomAdExpiresInMin * 60)}
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </Column>
                    </NitroCardContentView>
                    <Popover.Arrow className="fill-black" width={14} height={7} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
