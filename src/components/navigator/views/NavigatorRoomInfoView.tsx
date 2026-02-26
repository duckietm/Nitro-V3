import { CreateLinkEvent, GetCustomRoomFilterMessageComposer, GetGuestRoomMessageComposer, GetSessionDataManager, NavigatorSearchComposer, RemoveOwnRoomRightsRoomMessageComposer, RoomControllerLevel, RoomMuteComposer, RoomSettingsComposer, SecurityLevel, ToggleStaffPickMessageComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FaLink, FaSignOutAlt } from 'react-icons/fa';
import { DispatchUiEvent, GetGroupInformation, LocalizeText, ReportType, SendMessageComposer, ToggleFavoriteRoom } from '../../../api';
import { Button, Column, Flex, LayoutBadgeImageView, LayoutRoomThumbnailView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text, UserProfileIconView } from '../../../common';
import { RoomWidgetThumbnailEvent } from '../../../events';
import { useHelp, useNavigator, useRoom } from '../../../hooks';
import { classNames } from '../../../layout';

export interface NavigatorRoomInfoViewProps {
    onCloseClick: () => void;
}

export const NavigatorRoomInfoView: FC<NavigatorRoomInfoViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const [ isRoomPicked, setIsRoomPicked ] = useState(false);
    const [ isRoomMuted, setIsRoomMuted ] = useState(false);
    const { report = null } = useHelp();
    const { navigatorData = null, favouriteRoomIds = [] } = useNavigator();
    const { roomSession = null } = useRoom();

    const enteredRoomId = navigatorData?.enteredGuestRoom?.roomId ?? 0;

    useEffect(() =>
    {
        if(!enteredRoomId) return;
        SendMessageComposer(new GetGuestRoomMessageComposer(enteredRoomId, false, false));
    }, [ enteredRoomId ]);

    const isRoomInFavouritesList = useMemo(() =>
    {
        if(!enteredRoomId) return false;

        return favouriteRoomIds.some((id: any) =>
        {
            if(id && typeof id === 'object')
            {
                if('roomId' in id) return Number(id.roomId) === enteredRoomId;
                if('id' in id) return Number(id.id) === enteredRoomId;
            }

            return String(id) === String(enteredRoomId);
        });
    }, [ favouriteRoomIds, enteredRoomId ]);

    const hasPermission = (permission: string) =>
    {
        if(!navigatorData?.enteredGuestRoom) return false;

        switch(permission)
        {
            case 'settings':
                return (GetSessionDataManager().userId === navigatorData.enteredGuestRoom.ownerId || GetSessionDataManager().isModerator);
            case 'staff_pick':
                return GetSessionDataManager().securityLevel >= SecurityLevel.COMMUNITY;
            case 'floor':
                return roomSession?.controllerLevel >= RoomControllerLevel.GUEST;
            case 'guest':
                return roomSession?.controllerLevel === RoomControllerLevel.GUEST;
            default: return false;
        }
    };

    const processAction = (action: string, value?: string) =>
    {
        if(!navigatorData?.enteredGuestRoom) return;

        const roomId = navigatorData.enteredGuestRoom.roomId;

        switch(action)
        {
            case 'set_home_room':
            {
                let newRoomId = -1;
                if(navigatorData.homeRoomId !== roomId) newRoomId = roomId;
                if(newRoomId > 0) SendMessageComposer(new UpdateHomeRoomMessageComposer(newRoomId));
                return;
            }
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${ value }`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${ value }`));
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
                setIsRoomPicked(prev => !prev);
                SendMessageComposer(new ToggleStaffPickMessageComposer(roomId));
                SendMessageComposer(new GetGuestRoomMessageComposer(roomId, false, false));
                return;
            case 'toggle_mute':
                setIsRoomMuted(prev => !prev);
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
                ToggleFavoriteRoom(roomId, isRoomInFavouritesList);
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

    useEffect(() =>
    {
        if(!navigatorData) return;
        setIsRoomPicked(navigatorData.currentRoomIsStaffPick);
        if(navigatorData.enteredGuestRoom) setIsRoomMuted(navigatorData.enteredGuestRoom.allInRoomMuted);
    }, [ navigatorData ]);

    if(!navigatorData?.enteredGuestRoom) return null;

    return (
        <NitroCardView className="nitro-room-info" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('navigator.roomsettings.roominfo') } onCloseClick={ () => processAction('close') } />
            <NitroCardContentView className="text-black">
                <Flex gap={ 2 } overflow="hidden">
                    <LayoutRoomThumbnailView customUrl={ navigatorData.enteredGuestRoom.officialRoomPicRef } roomId={ navigatorData.enteredGuestRoom.roomId }>
                        { hasPermission('settings') && <i className="top-0 m-1 cursor-pointer nitro-icon icon-camera-small absolute b-0 r-0" onClick={ () => processAction('open_room_thumbnail_camera') } /> }
                    </LayoutRoomThumbnailView>
                    <Column grow gap={ 1 } overflow="hidden">
                        <div className="flex gap-1">
                            <Column grow gap={ 0 }>
                                <div className="flex gap-1">
                                    <Text bold wrap>{ navigatorData.enteredGuestRoom.roomName }</Text>
                                </div>
                                { navigatorData.enteredGuestRoom.showOwner &&
                                    <div className="flex items-center gap-1">
                                        <Text small bold variant="muted">{ LocalizeText('navigator.roomownercaption') }</Text>
                                        <div className="flex items-center gap-1">
                                            <UserProfileIconView userId={ navigatorData.enteredGuestRoom.ownerId } />
                                            <Text small>{ navigatorData.enteredGuestRoom.ownerName }</Text>
                                        </div>
                                    </div> }
                                <div className="flex items-center gap-1">
                                    <Text small bold variant="muted">{ LocalizeText('navigator.roomrating') }</Text>
                                    <Text small>{ navigatorData.currentRoomRating }</Text>
                                </div>
                                { (navigatorData.enteredGuestRoom.tags.length > 0) &&
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                        { navigatorData.enteredGuestRoom.tags.map(tag => (
                                            <Text key={ tag } pointer className="px-1 rounded bg-muted cursor-pointer text-xs" onClick={ () => processAction('navigator_search_tag', tag) }>
                                                #{ tag }
                                            </Text>
                                        )) }
                                    </div> }
                            </Column>
                            <Column alignItems="center" gap={ 1 }>
                                <i
                                    className={ classNames('shrink-0 nitro-icon icon-house-small cursor-pointer', ((navigatorData.homeRoomId !== navigatorData.enteredGuestRoom.roomId) && 'gray')) }
                                    title={ LocalizeText('navigator.room.popup.room.info.home') }
                                    onClick={ () => processAction('set_home_room') }
                                />
                                { GetSessionDataManager().userId !== navigatorData.enteredGuestRoom.ownerId &&
                                    <i
                                        className={ classNames('shrink-0 nitro-icon cursor-pointer', isRoomInFavouritesList ? 'icon-group-favorite' : 'icon-group-not-favorite') }
                                        title={ LocalizeText('navigator.room.popup.room.info.favorite') }
                                        onClick={ () => processAction('room_favourite') }
                                    /> }
                                { hasPermission('settings') &&
                                    <i className="cursor-pointer nitro-icon icon-cog" title={ LocalizeText('navigator.room.popup.info.room.settings') } onClick={ () => processAction('open_room_settings') } /> }
                                <FaLink className="cursor-pointer fa-icon" title={ LocalizeText('navigator.embed.caption') } onClick={ () => processAction('toggle_room_link') } />
                                { hasPermission('guest') &&
                                    <FaSignOutAlt className="cursor-pointer fa-icon" title={ LocalizeText('navigator.roominfo.removerights.tooltip') } onClick={ () => processAction('remove_rights') } /> }
                            </Column>
                        </div>
                        <Text small overflow="auto" style={ { maxHeight: 50 } }>{ navigatorData.enteredGuestRoom.description }</Text>
                        { (navigatorData.enteredGuestRoom.habboGroupId > 0) &&
                            <Flex pointer alignItems="center" gap={ 1 } onClick={ () => processAction('open_group_info') }>
                                <LayoutBadgeImageView badgeCode={ navigatorData.enteredGuestRoom.groupBadgeCode } className="flex-none" isGroup={ true } />
                                <Text small underline>
                                    { LocalizeText('navigator.guildbase', [ 'groupName' ], [ navigatorData.enteredGuestRoom.groupName ]) }
                                </Text>
                            </Flex> }
                    </Column>
                </Flex>
                <div className="flex flex-col gap-1 mt-1">
                    { hasPermission('staff_pick') &&
                        <Button onClick={ () => processAction('toggle_pick') }>
                            { LocalizeText(isRoomPicked ? 'navigator.staffpicks.unpick' : 'navigator.staffpicks.pick') }
                        </Button> }
                    <Button variant="danger" onClick={ () => processAction('report_room') }>
                        { LocalizeText('help.emergency.main.report.room') }
                    </Button>
                    { hasPermission('settings') &&
                        <>
                            <Button onClick={ () => processAction('toggle_mute') }>
                                { LocalizeText(isRoomMuted ? 'navigator.muteall_on' : 'navigator.muteall_off') }
                            </Button>
                            <Button onClick={ () => processAction('room_filter') }>
                                { LocalizeText('navigator.roomsettings.roomfilter') }
                            </Button>
                            <Button onClick={ () => processAction('open_floorplan_editor') }>
                                { LocalizeText('open.floor.plan.editor') }
                            </Button>
                        </> }
                    { hasPermission('floor') && !hasPermission('settings') &&
                        <Button onClick={ () => processAction('open_floorplan_editor') }>
                            { LocalizeText('open.floor.plan.editor') }
                        </Button> }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
