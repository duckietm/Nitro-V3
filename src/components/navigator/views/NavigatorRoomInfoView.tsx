import {
    CreateLinkEvent,
    GetCustomRoomFilterMessageComposer,
    GetGuestRoomMessageComposer,
    GetSessionDataManager,
    NavigatorSearchComposer,
    RemoveOwnRoomRightsRoomMessageComposer,
    RoomControllerLevel,
    RoomMuteComposer,
    RoomSettingsComposer,
    ToggleStaffPickMessageComposer,
    UpdateHomeRoomMessageComposer
} from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { DispatchUiEvent, GetGroupInformation, LocalizeText, ReportType, SendMessageComposer } from '../../../api';
import {
    Button,
    Column,
    Flex,
    LayoutBadgeImageView,
    LayoutRoomThumbnailView,
    NitroCardContentView,
    NitroCardHeaderView,
    NitroCardView,
    Text,
    UserProfileIconView
} from '../../../common';
import { RoomWidgetThumbnailEvent } from '../../../events';
import { useHasPermission, useHelp, useNavigatorData, useNavigatorFavourite, useRoom } from '../../../hooks';
import { classNames } from '../../../layout';

export interface NavigatorRoomInfoViewProps {
    onCloseClick: () => void;
}

export const NavigatorRoomInfoView: FC<NavigatorRoomInfoViewProps> = (props) => {
    const { onCloseClick = null } = props;
    const [isRoomPicked, setIsRoomPicked] = useState(false);
    const [isRoomMuted, setIsRoomMuted] = useState(false);
    const { report = null } = useHelp();
    const { navigatorData } = useNavigatorData();
    const { roomSession = null } = useRoom();
    const canManageAnyRoom = useHasPermission('acc_anyroomowner');
    const canStaffPick = useHasPermission('acc_staff_pick');

    const enteredRoomId = navigatorData?.enteredGuestRoom?.roomId ?? 0;
    const { isFavourite: isRoomInFavouritesList, toggle: toggleFavourite } = useNavigatorFavourite(enteredRoomId);

    useEffect(() => {
        if (!enteredRoomId) return;
        SendMessageComposer(new GetGuestRoomMessageComposer(enteredRoomId, false, false));
    }, [enteredRoomId]);

    const hasPermission = (permission: string) => {
        if (!navigatorData?.enteredGuestRoom) return false;

        switch (permission) {
            case 'settings':
                return GetSessionDataManager().userId === navigatorData.enteredGuestRoom.ownerId || canManageAnyRoom;
            case 'staff_pick':
                return canStaffPick;
            case 'floor':
                return roomSession?.controllerLevel >= RoomControllerLevel.GUEST;
            case 'guest':
                return roomSession?.controllerLevel === RoomControllerLevel.GUEST;
            default:
                return false;
        }
    };

    const processAction = (action: string, value?: string) => {
        if (!navigatorData?.enteredGuestRoom) return;

        const roomId = navigatorData.enteredGuestRoom.roomId;

        switch (action) {
            case 'set_home_room': {
                let newRoomId = -1;
                if (navigatorData.homeRoomId !== roomId) newRoomId = roomId;
                if (newRoomId > 0) SendMessageComposer(new UpdateHomeRoomMessageComposer(newRoomId));
                return;
            }
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${value}`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${value}`));
                return;
            case 'open_room_thumbnail_camera':
                DispatchUiEvent(new RoomWidgetThumbnailEvent(RoomWidgetThumbnailEvent.TOGGLE_THUMBNAIL));
                return;
            case 'open_group_info':
                GetGroupInformation(navigatorData.enteredGuestRoom.habboGroupId);
                return;
            case 'toggle_room_link':
                CreateLinkEvent('navigator/toggle-room-link');
                return;
            case 'open_room_settings':
                SendMessageComposer(new RoomSettingsComposer(roomId));
                return;
            case 'toggle_pick':
                setIsRoomPicked((prev) => !prev);
                SendMessageComposer(new ToggleStaffPickMessageComposer(roomId));
                SendMessageComposer(new GetGuestRoomMessageComposer(roomId, false, false));
                return;
            case 'toggle_mute':
                setIsRoomMuted((prev) => !prev);
                SendMessageComposer(new RoomMuteComposer());
                SendMessageComposer(new GetGuestRoomMessageComposer(roomId, false, false));
                return;
            case 'room_filter':
                SendMessageComposer(new GetCustomRoomFilterMessageComposer(roomId));
                return;
            case 'open_floorplan_editor':
                CreateLinkEvent('floor-editor/toggle');
                return;
            case 'report_room':
                report(ReportType.ROOM, { roomId, roomName: navigatorData.enteredGuestRoom.roomName });
                return;
            case 'room_favourite':
                toggleFavourite();
                SendMessageComposer(new GetGuestRoomMessageComposer(roomId, false, false));
                return;
            case 'remove_rights':
                SendMessageComposer(new RemoveOwnRoomRightsRoomMessageComposer(roomId));
                return;
            case 'close':
                onCloseClick();
                return;
        }
    };

    useEffect(() => {
        if (!navigatorData) return;
        setIsRoomPicked(navigatorData.currentRoomIsStaffPick);
        if (navigatorData.enteredGuestRoom) setIsRoomMuted(navigatorData.enteredGuestRoom.allInRoomMuted);
    }, [navigatorData]);

    if (!navigatorData?.enteredGuestRoom) return null;

    return (
        <NitroCardView
            className="nitro-room-info min-w-0 w-[min(230px,calc(100vw-16px))] max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]"
            isResizable={false}
            theme="primary-slim"
        >
            <NitroCardHeaderView headerText={LocalizeText('navigator.roomsettings.roominfo')} onCloseClick={() => processAction('close')} />
            <NitroCardContentView className="nitro-room-info__content text-black max-h-[calc(100vh-72px)]" overflow="auto">
                <div className="nitro-room-info__heading">
                    <Text bold>{navigatorData.enteredGuestRoom.roomName}</Text>
                    <i
                        className={classNames(
                            'shrink-0 nitro-icon icon-house-small cursor-pointer',
                            navigatorData.homeRoomId !== navigatorData.enteredGuestRoom.roomId && 'gray'
                        )}
                        title={LocalizeText('navigator.room.popup.room.info.home')}
                        onClick={() => processAction('set_home_room')}
                    />
                </div>
                {navigatorData.enteredGuestRoom.showOwner && (
                    <Flex alignItems="center" gap={1} className="nitro-room-info__meta">
                        <Text small bold variant="muted">{LocalizeText('navigator.roomownercaption')}</Text>
                        <UserProfileIconView userId={navigatorData.enteredGuestRoom.ownerId} />
                        <Text small>{navigatorData.enteredGuestRoom.ownerName}</Text>
                    </Flex>
                )}
                <Flex alignItems="center" gap={1} className="nitro-room-info__meta">
                    <Text small bold variant="muted">{LocalizeText('navigator.roomrating')}</Text>
                    <Text small>{navigatorData.currentRoomRating}</Text>
                </Flex>
                <Text className="nitro-room-info__description">{navigatorData.enteredGuestRoom.description}</Text>
                <LayoutRoomThumbnailView className="nitro-room-info__thumbnail" customUrl={navigatorData.enteredGuestRoom.officialRoomPicRef} roomId={navigatorData.enteredGuestRoom.roomId}>
                    {hasPermission('settings') && (
                        <i className="m-1 cursor-pointer nitro-icon icon-camera-small absolute b-0 r-0" onClick={() => processAction('open_room_thumbnail_camera')} />
                    )}
                </LayoutRoomThumbnailView>
                <Flex className="nitro-room-info__quick-actions" gap={1} justifyContent="center">
                    {GetSessionDataManager().userId !== navigatorData.enteredGuestRoom.ownerId && (
                        <i
                            className={classNames('nitro-icon cursor-pointer', isRoomInFavouritesList ? 'icon-group-favorite' : 'icon-group-not-favorite')}
                            title={LocalizeText('navigator.room.popup.room.info.favorite')}
                            onClick={() => processAction('room_favourite')}
                        />
                    )}
                    {hasPermission('guest') && <FaSignOutAlt className="cursor-pointer fa-icon" title={LocalizeText('navigator.roominfo.removerights.tooltip')} onClick={() => processAction('remove_rights')} />}
                </Flex>
                <Flex pointer alignItems="center" gap={1} className="nitro-room-info__room-link" onClick={() => processAction('toggle_room_link')}>
                    <Text bold>»</Text>
                    <Text small underline>{LocalizeText('navigator.embed.caption')}</Text>
                </Flex>
                {navigatorData.enteredGuestRoom.habboGroupId > 0 && (
                    <Flex pointer alignItems="center" gap={1} className="nitro-room-info__group" onClick={() => processAction('open_group_info')}>
                        <LayoutBadgeImageView badgeCode={navigatorData.enteredGuestRoom.groupBadgeCode} className="flex-none" isGroup={true} />
                        <Text small underline>{LocalizeText('navigator.guildbase', ['groupName'], [navigatorData.enteredGuestRoom.groupName])}</Text>
                    </Flex>
                )}
                <div className="nitro-room-info__actions">
                    {hasPermission('settings') && <Button onClick={() => processAction('open_room_settings')}>{LocalizeText('navigator.roomsettings')}</Button>}
                    {hasPermission('settings') && <Button onClick={() => processAction('room_filter')}>{LocalizeText('navigator.roomsettings.roomfilter')}</Button>}
                    {(hasPermission('settings') || hasPermission('floor')) && <Button onClick={() => processAction('open_floorplan_editor')}>{LocalizeText('open.floor.plan.editor')}</Button>}
                    {hasPermission('staff_pick') && (
                        <Button onClick={() => processAction('toggle_pick')}>
                            {LocalizeText(isRoomPicked ? 'navigator.staffpicks.unpick' : 'navigator.staffpicks.pick')}
                        </Button>
                    )}
                    <Button variant="danger" onClick={() => processAction('report_room')}>
                        {LocalizeText('help.emergency.main.report.room')}
                    </Button>
                    {hasPermission('settings') && <Button onClick={() => processAction('toggle_mute')}>{LocalizeText(isRoomMuted ? 'navigator.muteall_on' : 'navigator.muteall_off')}</Button>}
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
