import { AddLinkEventTracker, AvatarExpressionEnum, FigureUpdateEvent, FurnitureFloorUpdateEvent, FurnitureMultiStateComposer, FurnitureWallMultiStateComposer, FurnitureWallUpdateComposer, FurnitureWallUpdateEvent, GetRoomEngine, GetSessionDataManager, ILinkEventTracker, PetMoveComposer, RemoveLinkEventTracker, RoomControllerLevel, RoomObjectCategory, RoomObjectType, RoomObjectVariable, RoomUnitDanceEvent, RoomUnitEffectEvent, RoomUnitExpressionEvent, RoomUnitHandItemEvent, RoomUnitInfoEvent, RoomUnitLookComposer, RoomUnitStatusEvent, RoomUnitWalkComposer, UpdateFurniturePositionComposer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import furniInspectionIcon from '../../assets/images/wiredtools/furni.png';
import globalInspectionIcon from '../../assets/images/wiredtools/global.png';
import userInspectionIcon from '../../assets/images/wiredtools/user.png';
import wiredGlobalPlaceholderImage from '../../assets/images/wiredtools/wired_global_placeholder.png';
import wiredMonitorImage from '../../assets/images/wiredtools/wired_monitor.png';
import { AvatarInfoFurni, AvatarInfoUtilities, LocalizeText, SendMessageComposer } from '../../api';
import { Button, DraggableWindowPosition, LayoutAvatarImageView, LayoutPetImageView, LayoutRoomObjectImageView, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useInventoryTrade, useMessageEvent, useObjectSelectedEvent, useRoom } from '../../hooks';

type WiredToolsTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';
type InspectionElementType = 'furni' | 'user' | 'global';

interface InspectionElementButton
{
    key: InspectionElementType;
    label: string;
    icon: string;
}

interface InspectionFurniSelection
{
    objectId: number;
    category: number;
    info: AvatarInfoFurni;
}

interface InspectionFurniLiveState
{
    positionX: number;
    positionY: number;
    altitude: number;
    rotation: number;
    state: number;
}

interface InspectionUserSelection
{
    kind: 'user' | 'bot' | 'rentable_bot' | 'pet';
    roomIndex: number;
    name: string;
    figure: string;
    gender: string;
    userId: number;
    level: number;
    achievementScore: number;
    isHC: boolean;
    hasRights: boolean;
    isOwner: boolean;
    favouriteGroupId: number;
    roomEntryMethod: string;
    roomEntryTeleportId: number;
    posture?: string;
}

interface InspectionUserLiveState
{
    positionX: number;
    positionY: number;
    altitude: number;
    direction: number;
}

interface MonitorStat
{
    label: string;
    value: string;
}

interface MonitorLog
{
    type: string;
    category: string;
    amount: string;
    latest: string;
}

interface InspectionVariable
{
    key: string;
    value: string;
    editable?: boolean;
    valueClassName?: string;
}

interface InspectionUserTeamData
{
    colorId: number;
    typeId: number;
    score: number;
}

interface TeamEffectData
{
    colorId: number;
    typeId: number;
}

interface ParsedWallLocation
{
    width: number;
    height: number;
    localX: number;
    localY: number;
    direction: string;
}

interface HotelDateTimeParts
{
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}

const TABS: Array<{ key: WiredToolsTab; label: string; }> = [
    { key: 'monitor', label: 'Monitor' },
    { key: 'variables', label: 'Variables' },
    { key: 'inspection', label: 'Inspection' },
    { key: 'chests', label: 'Chests' },
    { key: 'settings', label: 'Settings' }
];

const MONITOR_LOGS: MonitorLog[] = [
    { type: 'EXECUTION_CAP', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'DELAYED_EVENTS_CAP', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'EXECUTOR_OVERLOAD', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'MARKED_AS_HEAVY', category: 'WARNING', amount: '0', latest: '/' },
    { type: 'KILLED', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'RECURSION_TIMEOUT', category: 'ERROR', amount: '0', latest: '/' }
];

const INSPECTION_ELEMENTS: InspectionElementButton[] = [
    { key: 'furni', label: 'Furni', icon: furniInspectionIcon },
    { key: 'user', label: 'User', icon: userInspectionIcon },
    { key: 'global', label: 'Global', icon: globalInspectionIcon }
];

const EDITABLE_FURNI_VARIABLES: string[] = [ '@position.x', '@position.y', '@rotation', '@altitude', '@state', '@wallitem_offset' ];
const EDITABLE_USER_VARIABLES: string[] = [ '@position.x', '@position.y', '@direction' ];
const USER_DIRECTION_VECTORS: Array<{ x: number; y: number; }> = [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 }
];
const WIRED_FREEZE_EFFECT_IDS: Set<number> = new Set([ 218, 12, 11, 53, 163 ]);
const TEAM_COLOR_NAMES: Record<number, string> = {
    1: 'red',
    2: 'green',
    3: 'blue',
    4: 'yellow'
};
const WEEKDAY_NAMES: string[] = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];
const MONTH_NAMES: string[] = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
const HOTEL_TIME_FORMATTERS: Map<string, Intl.DateTimeFormat> = new Map();

const getHotelTimeFormatter = (timeZone: string): Intl.DateTimeFormat =>
{
    const formatterTimeZone = (timeZone || 'UTC');
    const existingFormatter = HOTEL_TIME_FORMATTERS.get(formatterTimeZone);

    if(existingFormatter) return existingFormatter;

    let formatter: Intl.DateTimeFormat = null;

    try
    {
        formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: formatterTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
    }
    catch
    {
        formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
    }

    HOTEL_TIME_FORMATTERS.set(formatterTimeZone, formatter);

    return formatter;
};

const getHotelDateTimeParts = (epochMs: number, timeZone: string): HotelDateTimeParts =>
{
    const normalizedEpochMs = Number.isFinite(epochMs) ? epochMs : Date.now();
    const date = new Date(normalizedEpochMs);
    const formatter = getHotelTimeFormatter(timeZone);
    const formattedParts = formatter.formatToParts(date);
    const partsMap = new Map<string, string>();

    for(const part of formattedParts)
    {
        if(part.type === 'literal') continue;

        partsMap.set(part.type, part.value);
    }

    return {
        year: Number(partsMap.get('year') ?? date.getUTCFullYear()),
        month: Number(partsMap.get('month') ?? (date.getUTCMonth() + 1)),
        day: Number(partsMap.get('day') ?? date.getUTCDate()),
        hour: Number(partsMap.get('hour') ?? date.getUTCHours()),
        minute: Number(partsMap.get('minute') ?? date.getUTCMinutes()),
        second: Number(partsMap.get('second') ?? date.getUTCSeconds()),
        millisecond: (((normalizedEpochMs % 1000) + 1000) % 1000)
    };
};

export const WiredCreatorToolsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<WiredToolsTab>('inspection');
    const [ inspectionType, setInspectionType ] = useState<InspectionElementType>('furni');
    const [ keepSelected, setKeepSelected ] = useState(false);
    const [ selectedFurni, setSelectedFurni ] = useState<InspectionFurniSelection>(null);
    const [ selectedFurniLiveState, setSelectedFurniLiveState ] = useState<InspectionFurniLiveState>(null);
    const [ selectedUser, setSelectedUser ] = useState<InspectionUserSelection>(null);
    const [ selectedUserLiveState, setSelectedUserLiveState ] = useState<InspectionUserLiveState>(null);
    const [ selectedUserActionVersion, setSelectedUserActionVersion ] = useState(0);
    const [ globalClock, setGlobalClock ] = useState(Date.now());
    const [ roomEnteredAt, setRoomEnteredAt ] = useState(Date.now());
    const [ editingVariable, setEditingVariable ] = useState<string>(null);
    const [ editingValue, setEditingValue ] = useState('');
    const { roomSession = null } = useRoom();
    const { ownUser: tradeOwnUser = null, otherUser: tradeOtherUser = null, isTrading = false } = useInventoryTrade();

    const getFurniLiveState = (objectId: number, category: number): InspectionFurniLiveState =>
    {
        if(!roomSession) return null;

        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, objectId, category);

        if(!roomObject) return null;

        const location = roomObject.getLocation();
        const rawRotation = Math.round(roomObject.getDirection().x / 45);

        return {
            positionX: Math.round(location?.x ?? 0),
            positionY: Math.round(location?.y ?? 0),
            altitude: Math.round(Number(location?.z ?? 0) * 100),
            rotation: ((((rawRotation % 8) + 8) % 8)),
            state: Number(roomObject.getState(0) ?? 0)
        };
    };

    const parseWallLocation = (wallLocation: string): ParsedWallLocation =>
    {
        if(!wallLocation) return null;

        const match = wallLocation.match(/^:w=(-?\d+),(-?\d+)\s+l=(-?\d+),(-?\d+)\s+([^\s]+)$/i);

        if(!match) return null;

        return {
            width: parseInt(match[1], 10),
            height: parseInt(match[2], 10),
            localX: parseInt(match[3], 10),
            localY: parseInt(match[4], 10),
            direction: match[5]
        };
    };

    const getSignDisplayName = (value: number): string =>
    {
        if(value < 0) return '';

        const localizationKey = `wiredfurni.params.action.sign.${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        return `Sign ${ value }`;
    };

    const getDanceDisplayName = (value: number): string =>
    {
        if(value <= 0) return '';

        const localizationKey = `widget.memenu.dance${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        return `Dance ${ value }`;
    };

    const getHandItemDisplayName = (value: number): string =>
    {
        if(value <= 0) return '';

        const localizationKey = `handitem${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        return `Item ${ value }`;
    };

    const getEffectDisplayName = (value: number): string =>
    {
        if(value <= 0) return '';

        const localizationKey = `fx_${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        return `Effect ${ value }`;
    };

    const getTeamColorDisplayName = (value: number): string =>
    {
        if(value <= 0) return '';

        const localizationKey = `wiredfurni.params.team.${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        return TEAM_COLOR_NAMES[value] ?? `Team ${ value }`;
    };

    const getTeamTypeDisplayName = (value: number): string =>
    {
        const localizationKey = `wiredfurni.params.team_type.${ value }`;
        const localizedName = LocalizeText(localizationKey);

        if(localizedName && (localizedName !== localizationKey)) return localizedName;

        switch(value)
        {
            case 1: return 'Battle Banzai';
            case 2: return 'Freeze';
            default: return 'Wired';
        }
    };

    const getTeamEffectData = (effectValue: number): TeamEffectData =>
    {
        if(!roomSession || (effectValue <= 0)) return null;

        let teamType = -1;
        let teamColor = 0;

        if((effectValue >= 223) && (effectValue <= 226))
        {
            teamType = 0;
            teamColor = (effectValue - 222);
        }
        else if((effectValue >= 33) && (effectValue <= 36))
        {
            teamType = 1;
            teamColor = (effectValue - 32);
        }
        else if((effectValue >= 40) && (effectValue <= 43))
        {
            teamType = 2;
            teamColor = (effectValue - 39);
        }

        if((teamType < 0) || !(teamColor in TEAM_COLOR_NAMES)) return null;

        return {
            colorId: teamColor,
            typeId: teamType
        };
    };

    const getRoomTeamScore = (colorId: number): number =>
    {
        if(!roomSession || !(colorId in TEAM_COLOR_NAMES)) return 0;

        const classNames = [
            `battlebanzai_counter_${ TEAM_COLOR_NAMES[colorId] }`,
            `freeze_counter_${ TEAM_COLOR_NAMES[colorId] }`,
            `football_counter_${ TEAM_COLOR_NAMES[colorId] }`
        ];

        const roomObjects = GetRoomEngine().getRoomObjects(roomSession.roomId, RoomObjectCategory.FLOOR);

        for(const targetClassName of classNames)
        {
            for(const roomObject of roomObjects)
            {
                if(!roomObject) continue;

                const typeId = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
                const furnitureData = GetSessionDataManager().getFloorItemData(typeId);

                if(!furnitureData || (furnitureData.className !== targetClassName)) continue;

                return Number(roomObject.getState(0) ?? 0);
            }
        }

        return 0;
    };

    const getSelectedUserTeamData = (effectValue: number): InspectionUserTeamData =>
    {
        const teamData = getTeamEffectData(effectValue);

        if(!teamData) return null;

        return {
            colorId: teamData.colorId,
            typeId: teamData.typeId,
            score: (teamData.typeId === 0) ? 0 : getRoomTeamScore(teamData.colorId)
        };
    };

    const createUtcDateFromHotelParts = (parts: HotelDateTimeParts): Date =>
    {
        return new Date(Date.UTC(parts.year, (parts.month - 1), parts.day, parts.hour, parts.minute, parts.second, parts.millisecond));
    };

    const getMondayBasedWeekday = (parts: HotelDateTimeParts): number =>
    {
        const jsDay = createUtcDateFromHotelParts(parts).getUTCDay();
        return ((jsDay === 0) ? 7 : jsDay);
    };

    const getDayOfYear = (parts: HotelDateTimeParts): number =>
    {
        const currentDate = createUtcDateFromHotelParts(parts);
        const startOfYear = new Date(Date.UTC(parts.year, 0, 1));
        const millisecondsPerDay = 86400000;

        return Math.floor((currentDate.getTime() - startOfYear.getTime()) / millisecondsPerDay) + 1;
    };

    const getIsoWeekOfYear = (parts: HotelDateTimeParts): number =>
    {
        const utcDate = new Date(Date.UTC(parts.year, (parts.month - 1), parts.day));
        const dayOfWeek = utcDate.getUTCDay() || 7;

        utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);

        const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));

        return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const getUserLiveState = (roomIndex: number): InspectionUserLiveState =>
    {
        if(!roomSession) return null;

        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, roomIndex, RoomObjectCategory.UNIT);

        if(!roomObject) return null;

        const location = roomObject.getLocation();
        const rawDirection = Math.round(roomObject.getDirection().x / 45);

        return {
            positionX: Math.round(location?.x ?? 0),
            positionY: Math.round(location?.y ?? 0),
            altitude: Math.round(Number(location?.z ?? 0) * 100),
            direction: ((((rawDirection % 8) + 8) % 8))
        };
    };

    const refreshSelectedUser = (roomIndex: number = selectedUser?.roomIndex) =>
    {
        if((roomIndex === null) || (roomIndex === undefined) || !roomSession) return;

        const userData = roomSession.userDataManager.getUserDataByIndex(roomIndex);

        if(!userData) return;

        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, roomIndex, RoomObjectCategory.UNIT);
        const gender = String(userData.sex || roomObject?.model.getValue<string>(RoomObjectVariable.GENDER) || 'U').toUpperCase();
        const isOwnUser = (userData.webID === GetSessionDataManager().userId);
        const roomOwnerLevel = (isOwnUser ? roomSession.controllerLevel : Number(roomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_FLAT_CONTROL) ?? 0));
        const hasRights = (roomOwnerLevel >= RoomControllerLevel.GUEST);
        const isOwner = ((isOwnUser && roomSession.isRoomOwner) || (roomOwnerLevel >= RoomControllerLevel.ROOM_OWNER));
        const roomEntryMethod = (userData.roomEntryMethod || 'unknown');
        const roomEntryTeleportId = Number(userData.roomEntryTeleportId ?? 0);

        switch(userData.type)
        {
            case RoomObjectType.USER: {
                const info = AvatarInfoUtilities.getUserInfo(RoomObjectCategory.UNIT, userData);

                if(!info) return;

                setSelectedUser({
                    kind: 'user',
                    roomIndex,
                    name: info.name,
                    figure: info.figure,
                    gender,
                    userId: info.webID,
                    level: (isOwnUser ? info.roomControllerLevel : info.targetRoomControllerLevel),
                    achievementScore: info.achievementScore,
                    isHC: (isOwnUser && (GetSessionDataManager().clubLevel > 0)),
                    hasRights,
                    isOwner,
                    favouriteGroupId: info.groupId,
                    roomEntryMethod,
                    roomEntryTeleportId
                });
                break;
            }
            case RoomObjectType.BOT: {
                const info = AvatarInfoUtilities.getBotInfo(RoomObjectCategory.UNIT, userData);

                if(!info) return;

                setSelectedUser({
                    kind: 'bot',
                    roomIndex,
                    name: info.name,
                    figure: info.figure,
                    gender,
                    userId: info.webID,
                    level: 0,
                    achievementScore: 0,
                    isHC: false,
                    hasRights: false,
                    isOwner: false,
                    favouriteGroupId: 0,
                    roomEntryMethod,
                    roomEntryTeleportId
                });
                break;
            }
            case RoomObjectType.RENTABLE_BOT: {
                const info = AvatarInfoUtilities.getRentableBotInfo(RoomObjectCategory.UNIT, userData);

                if(!info) return;

                setSelectedUser({
                    kind: 'rentable_bot',
                    roomIndex,
                    name: info.name,
                    figure: info.figure,
                    gender,
                    userId: info.webID,
                    level: 0,
                    achievementScore: 0,
                    isHC: false,
                    hasRights: false,
                    isOwner: false,
                    favouriteGroupId: 0,
                    roomEntryMethod,
                    roomEntryTeleportId
                });
                break;
            }
            case RoomObjectType.PET:
                setSelectedUser({
                    kind: 'pet',
                    roomIndex,
                    name: userData.name,
                    figure: userData.figure,
                    gender,
                    userId: userData.webID,
                    level: Number(userData.petLevel ?? 0),
                    achievementScore: 0,
                    isHC: false,
                    hasRights: false,
                    isOwner: false,
                    favouriteGroupId: 0,
                    roomEntryMethod,
                    roomEntryTeleportId,
                    posture: 'std'
                });
                break;
        }

        setSelectedUserLiveState(getUserLiveState(roomIndex));
    };

    const refreshSelectedFurni = (objectId: number = selectedFurni?.objectId, category: number = selectedFurni?.category) =>
    {
        if(!objectId && (objectId !== 0)) return;

        const info = AvatarInfoUtilities.getFurniInfo(objectId, category);

        if(!info) return;

        setSelectedFurni({
            objectId,
            category,
            info
        });

        setSelectedFurniLiveState(getFurniLiveState(objectId, category));
    };

    useObjectSelectedEvent(event =>
    {
        if(keepSelected || !roomSession) return;

        if((inspectionType === 'furni') && ((event.category === RoomObjectCategory.FLOOR) || (event.category === RoomObjectCategory.WALL)))
        {
            refreshSelectedFurni(event.id, event.category);

            return;
        }

        if((inspectionType !== 'user') || (event.category !== RoomObjectCategory.UNIT)) return;

        refreshSelectedUser(event.id);
    });

    useMessageEvent<FurnitureFloorUpdateEvent>(FurnitureFloorUpdateEvent, event =>
    {
        if(!selectedFurni) return;

        const parser = event.getParser();

        if(parser.item.itemId !== selectedFurni.objectId) return;

        refreshSelectedFurni(selectedFurni.objectId, selectedFurni.category);
    });

    useMessageEvent<FurnitureFloorUpdateEvent>(FurnitureFloorUpdateEvent, () =>
    {
        if((inspectionType !== 'user') || !selectedUser) return;

        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useMessageEvent<FurnitureWallUpdateEvent>(FurnitureWallUpdateEvent, event =>
    {
        if(!selectedFurni || (selectedFurni.category !== RoomObjectCategory.WALL)) return;

        const parser = event.getParser();

        if(parser.item.itemId !== selectedFurni.objectId) return;

        refreshSelectedFurni(selectedFurni.objectId, selectedFurni.category);
    });

    useMessageEvent<RoomUnitStatusEvent>(RoomUnitStatusEvent, event =>
    {
        if(!selectedUser) return;

        const parser = event.getParser();

        if(!parser?.statuses?.some(status => status.id === selectedUser.roomIndex)) return;

        setSelectedUserLiveState(getUserLiveState(selectedUser.roomIndex));
        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useMessageEvent<RoomUnitInfoEvent>(RoomUnitInfoEvent, event =>
    {
        if(!selectedUser) return;

        const parser = event.getParser();

        if(parser.unitId !== selectedUser.roomIndex) return;

        refreshSelectedUser(selectedUser.roomIndex);
    });

    useMessageEvent<FigureUpdateEvent>(FigureUpdateEvent, () =>
    {
        if(!selectedUser || (selectedUser.kind !== 'user') || !roomSession) return;

        if(selectedUser.roomIndex !== roomSession.ownRoomIndex) return;

        refreshSelectedUser(selectedUser.roomIndex);
    });

    useMessageEvent<RoomUnitDanceEvent>(RoomUnitDanceEvent, event =>
    {
        if(!selectedUser) return;

        if(event.getParser().unitId !== selectedUser.roomIndex) return;

        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useMessageEvent<RoomUnitEffectEvent>(RoomUnitEffectEvent, event =>
    {
        if(!selectedUser) return;

        if(event.getParser().unitId !== selectedUser.roomIndex) return;

        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useMessageEvent<RoomUnitHandItemEvent>(RoomUnitHandItemEvent, event =>
    {
        if(!selectedUser) return;

        if(event.getParser().unitId !== selectedUser.roomIndex) return;

        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useMessageEvent<RoomUnitExpressionEvent>(RoomUnitExpressionEvent, event =>
    {
        if(!selectedUser) return;

        if(event.getParser().unitId !== selectedUser.roomIndex) return;

        setSelectedUserActionVersion(previousValue => (previousValue + 1));
    });

    useEffect(() =>
    {
        if(!isVisible || (inspectionType !== 'user') || !selectedUser || !roomSession) return;

        let lastMutedValue = Number(GetRoomEngine().getRoomObject(roomSession.roomId, selectedUser.roomIndex, RoomObjectCategory.UNIT)?.model.getValue<number>(RoomObjectVariable.FIGURE_IS_MUTED) ?? 0);

        const interval = window.setInterval(() =>
        {
            const currentMutedValue = Number(GetRoomEngine().getRoomObject(roomSession.roomId, selectedUser.roomIndex, RoomObjectCategory.UNIT)?.model.getValue<number>(RoomObjectVariable.FIGURE_IS_MUTED) ?? 0);

            if(currentMutedValue === lastMutedValue) return;

            lastMutedValue = currentMutedValue;

            setSelectedUserActionVersion(previousValue => (previousValue + 1));
        }, 250);

        return () => window.clearInterval(interval);
    }, [ isVisible, inspectionType, selectedUser, roomSession ]);

    useEffect(() =>
    {
        const shouldTick = isVisible && ((activeTab === 'monitor') || ((activeTab === 'inspection') && (inspectionType === 'global')));

        if(!shouldTick) return;

        setGlobalClock(Date.now());

        const interval = window.setInterval(() => setGlobalClock(Date.now()), 100);

        return () => window.clearInterval(interval);
    }, [ isVisible, activeTab, inspectionType, roomSession?.roomId ]);

    useEffect(() =>
    {
        if(!roomSession?.roomId) return;

        setRoomEnteredAt(Date.now());
    }, [ roomSession?.roomId ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'tab':
                        if(parts.length > 2)
                        {
                            const tab = parts[2] as WiredToolsTab;

                            if(TABS.some(entry => entry.key === tab)) setActiveTab(tab);
                        }
                        setIsVisible(true);
                        return;
                }
            },
            eventUrlPrefix: 'wired-tools/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const selectedRoomObject = ((roomSession && selectedFurni)
        ? GetRoomEngine().getRoomObject(roomSession.roomId, selectedFurni.objectId, selectedFurni.category)
        : null);
    const selectedUserRoomObject = ((roomSession && selectedUser)
        ? GetRoomEngine().getRoomObject(roomSession.roomId, selectedUser.roomIndex, RoomObjectCategory.UNIT)
        : null);

    const currentTabLabel = useMemo(() => TABS.find(tab => tab.key === activeTab)?.label ?? 'Monitor', [ activeTab ]);
    const previewPlaceholder = useMemo(() =>
    {
        switch(inspectionType)
        {
            case 'furni':
                return 'Select a furni';
            case 'user':
                return 'Select a user';
            default:
                return 'Nothing to display';
        }
    }, [ inspectionType ]);
    const monitorStats = useMemo<MonitorStat[]>(() =>
    {
        if(!roomSession)
        {
            return [
                { label: 'Wired usage', value: '0/10000' },
                { label: 'Is heavy', value: 'No' },
                { label: 'Room furni', value: '0/0' },
                { label: 'Wall furni', value: '0/0' },
                { label: 'Permanent furni vars', value: '0/60' }
            ];
        }

        const roomId = roomSession.roomId;
        const floorObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.FLOOR);
        const wallObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.WALL);
        const roomFurniCount = (floorObjects.length + wallObjects.length);
        const roomItemLimit = Number(roomSession.roomItemLimit ?? 0);
        const roomFurniValue = (roomItemLimit > 0) ? `${ roomFurniCount }/${ roomItemLimit }` : String(roomFurniCount);
        const wallFurniValue = (roomItemLimit > 0) ? `${ wallObjects.length }/${ roomItemLimit }` : String(wallObjects.length);

        return [
            { label: 'Wired usage', value: '0/10000' },
            { label: 'Is heavy', value: 'No' },
            { label: 'Room furni', value: roomFurniValue },
            { label: 'Wall furni', value: wallFurniValue },
            { label: 'Permanent furni vars', value: '0/60' }
        ];
    }, [ roomSession, globalClock ]);
    const selectedFurnitureData = useMemo(() =>
    {
        if(!selectedRoomObject || !selectedFurni) return null;

        const typeId = selectedRoomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);

        if(selectedFurni.category === RoomObjectCategory.WALL) return GetSessionDataManager().getWallItemData(typeId);

        return GetSessionDataManager().getFloorItemData(typeId);
    }, [ selectedRoomObject, selectedFurni ]);
    const currentWallLocationString = useMemo(() =>
    {
        if(!roomSession || !selectedFurni || (selectedFurni.category !== RoomObjectCategory.WALL) || !selectedRoomObject) return null;

        const wallGeometry = GetRoomEngine().getLegacyWallGeometry(roomSession.roomId);

        if(!wallGeometry) return null;

        const angle = ((((Math.round(selectedRoomObject.getDirection().x / 45) % 8) + 8) % 8) * 45);

        return wallGeometry.getOldLocationString(selectedRoomObject.getLocation(), angle);
    }, [ roomSession, selectedFurni, selectedRoomObject, selectedFurniLiveState ]);
    const parsedWallLocation = useMemo(() => parseWallLocation(currentWallLocationString), [ currentWallLocationString ]);
    const wallItemOffset = useMemo(() =>
    {
        if(!parsedWallLocation) return null;

        return `${ parsedWallLocation.localX },${ parsedWallLocation.localY }`;
    }, [ parsedWallLocation ]);
    const furniVariables = useMemo(() =>
    {
        if((inspectionType !== 'furni') || !selectedFurni || !selectedRoomObject) return [];

        const classId = selectedRoomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
        const tileSizeZ = Number(selectedFurnitureData?.tileSizeZ ?? 0);
        const liveState = selectedFurniLiveState ?? getFurniLiveState(selectedFurni.objectId, selectedFurni.category);

        const dynamicFlags: InspectionVariable[] = [];

        if(selectedFurni.info?.allowSit) dynamicFlags.push({ key: '@can_sit_on', value: '' });
        if(selectedFurni.info?.allowLay) dynamicFlags.push({ key: '@can_lay_on', value: '' });
        if(selectedFurni.info?.allowWalk) dynamicFlags.push({ key: '@can_stand_on', value: '' });
        if(selectedFurni.info?.allowStack) dynamicFlags.push({ key: '@is_stackable', value: '' });

        const variables: InspectionVariable[] = [
            ...((Number(selectedFurni.info?.teleportTargetId ?? 0) > 0)
                ? [ { key: '~teleport.target_id', value: String(selectedFurni.info.teleportTargetId) } ]
                : []),
            { key: '@id', value: String(selectedFurni.objectId) },
            { key: '@class_id', value: String(classId) },
            { key: '@height', value: String(Math.round(tileSizeZ * 100)) },
            { key: '@state', value: String(liveState?.state ?? 0), editable: true },
            { key: '@position.x', value: String(liveState?.positionX ?? 0), editable: true },
            { key: '@position.y', value: String(liveState?.positionY ?? 0), editable: true },
            { key: '@rotation', value: String(liveState?.rotation ?? 0), editable: true },
            { key: '@altitude', value: String(liveState?.altitude ?? 0), editable: true },
            ...(wallItemOffset ? [ { key: '@wallitem_offset', value: wallItemOffset, editable: true } ] : []),
            { key: '@type', value: `${ (selectedFurni.category === RoomObjectCategory.WALL) ? 'wall' : 'floor' }${ selectedFurnitureData?.availableForBuildersClub ? ' (BC)' : '' }` },
            ...dynamicFlags,
            { key: '@dimensions.x', value: String(selectedFurni.info?.tileSizeX ?? 0) },
            { key: '@dimensions.y', value: String(selectedFurni.info?.tileSizeY ?? 0) },
            { key: '@owner_id', value: String(selectedFurni.info?.ownerId ?? 0) }
        ];

        return variables;
    }, [ inspectionType, selectedFurni, selectedFurniLiveState, selectedRoomObject, selectedFurnitureData, wallItemOffset ]);
    const canEditSelectedUser = useMemo(() =>
    {
        if(!selectedUser || !roomSession) return false;

        if(selectedUser.kind === 'pet') return true;

        return ((selectedUser.kind === 'user') && (selectedUser.roomIndex === roomSession.ownRoomIndex));
    }, [ selectedUser, roomSession ]);
    const userVariables = useMemo(() =>
    {
        if((inspectionType !== 'user') || !selectedUser) return [];

        const liveState = selectedUserLiveState ?? getUserLiveState(selectedUser.roomIndex);
        const currentControllerLevel = ((selectedUser.kind === 'user')
            ? ((selectedUser.roomIndex === roomSession?.ownRoomIndex)
                ? (roomSession?.controllerLevel ?? selectedUser.level ?? 0)
                : Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_FLAT_CONTROL) ?? selectedUser.level ?? 0))
            : Number(selectedUser.level ?? 0));
        const isSelectedUserOwner = ((selectedUser.kind === 'user')
            ? (((selectedUser.roomIndex === roomSession?.ownRoomIndex) && !!roomSession?.isRoomOwner) || (currentControllerLevel >= RoomControllerLevel.ROOM_OWNER))
            : !!selectedUser.isOwner);
        const hasSelectedUserRights = ((selectedUser.kind === 'user')
            ? (currentControllerLevel >= RoomControllerLevel.GUEST)
            : !!selectedUser.hasRights);
        const isSelectedUserGroupAdmin = ((selectedUser.kind === 'user') && !!roomSession?.isGuildRoom && (currentControllerLevel >= RoomControllerLevel.GUILD_ADMIN));
        const isSelectedUserMuted = (Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_IS_MUTED) ?? 0) > 0);
        const isSelectedUserTrading = (!!isTrading
            && (selectedUser.kind === 'user')
            && ((tradeOwnUser?.userId === selectedUser.userId) || (tradeOtherUser?.userId === selectedUser.userId)));
        const signValue = Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_SIGN) ?? -1);
        const danceValue = Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_DANCE) ?? 0);
        const handItemValue = Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_CARRY_OBJECT) ?? 0);
        const expressionValue = Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_EXPRESSION) ?? 0);
        const effectValue = Number(selectedUserRoomObject?.model.getValue<number>(RoomObjectVariable.FIGURE_EFFECT) ?? 0);
        const identityKey = ((selectedUser.kind === 'pet')
            ? '@pet_id'
            : ((selectedUser.kind === 'bot') || (selectedUser.kind === 'rentable_bot'))
                ? '@bot_id'
                : '@user_id');
        const teamData = getSelectedUserTeamData(effectValue);
        const dynamicUserFlags: InspectionVariable[] = [];
        const dynamicUserActions: InspectionVariable[] = [];

        if(selectedUser.isHC) dynamicUserFlags.push({ key: '@is_hc', value: '' });
        if(hasSelectedUserRights) dynamicUserFlags.push({ key: '@has_rights', value: '' });
        if(isSelectedUserOwner) dynamicUserFlags.push({ key: '@is_owner', value: '' });
        if(isSelectedUserGroupAdmin) dynamicUserFlags.push({ key: '@is_group_admin', value: '' });
        if(isSelectedUserMuted) dynamicUserFlags.push({ key: '@is_mute', value: '' });
        if(isSelectedUserTrading) dynamicUserFlags.push({ key: '@is_trading', value: '' });
        if(WIRED_FREEZE_EFFECT_IDS.has(effectValue)) dynamicUserFlags.push({ key: '@is_frozen', value: '' });
        if(effectValue > 0) dynamicUserActions.push({ key: '@effect', value: `${ effectValue } (${ getEffectDisplayName(effectValue) })` });
        if(teamData) dynamicUserActions.push({ key: '@team_score', value: String(teamData.score) });
        if(teamData) dynamicUserActions.push({ key: '@team_color', value: `${ teamData.colorId } (${ getTeamColorDisplayName(teamData.colorId) })` });
        if(teamData) dynamicUserActions.push({ key: '@team_type', value: `${ teamData.typeId } (${ getTeamTypeDisplayName(teamData.typeId) })` });
        if(signValue >= 0) dynamicUserActions.push({ key: '@sign', value: `${ signValue } (${ getSignDisplayName(signValue) })` });
        if(danceValue > 0) dynamicUserActions.push({ key: '@dance', value: `${ danceValue } (${ getDanceDisplayName(danceValue) })` });
        if(expressionValue === AvatarExpressionEnum.IDLE.ordinal) dynamicUserActions.push({ key: '@is_idle', value: '' });
        if(handItemValue > 0) dynamicUserActions.push({ key: '@handitems', value: `${ handItemValue } (${ getHandItemDisplayName(handItemValue) })` });

        return [
            { key: '@index', value: String(selectedUser.roomIndex) },
            { key: '@type', value: selectedUser.kind },
            { key: '@gender', value: (selectedUser.gender || 'U') },
            { key: '@level', value: String(currentControllerLevel) },
            { key: '@achievement_score', value: String(selectedUser.achievementScore ?? 0) },
            ...dynamicUserFlags,
            ...dynamicUserActions,
            { key: '@position.x', value: String(liveState?.positionX ?? 0), editable: canEditSelectedUser },
            { key: '@position.y', value: String(liveState?.positionY ?? 0), editable: canEditSelectedUser },
            { key: '@direction', value: String(liveState?.direction ?? 0), editable: canEditSelectedUser },
            { key: '@altitude', value: String(liveState?.altitude ?? 0) },
            ...((Number(selectedUser.favouriteGroupId ?? 0) > 0)
                ? [ { key: '@favourite_group_id', value: String(selectedUser.favouriteGroupId) } ]
                : []),
            ...((selectedUser.roomEntryMethod && (selectedUser.roomEntryMethod !== 'unknown'))
                ? [ { key: '@room_entry', value: selectedUser.roomEntryMethod } ]
                : []),
            ...(((selectedUser.roomEntryMethod === 'teleport') && (Number(selectedUser.roomEntryTeleportId ?? 0) > 0))
                ? [ { key: '@room_entry.teleport_id', value: String(selectedUser.roomEntryTeleportId) } ]
                : []),
            { key: identityKey, value: String(selectedUser.userId ?? 0) }
        ];
    }, [ inspectionType, selectedUser, selectedUserLiveState, canEditSelectedUser, selectedUserRoomObject, selectedUserActionVersion, roomSession, isTrading, tradeOwnUser, tradeOtherUser ]);
    const globalVariables = useMemo(() =>
    {
        if((inspectionType !== 'global') || !roomSession) return [];

        const roomId = roomSession.roomId;
        const unitObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.UNIT);
        const floorObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.FLOOR);
        const wallObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.WALL);

        const teamSizes: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0
        };

        let userCount = 0;

        for(const roomObject of unitObjects)
        {
            if(!roomObject) continue;

            const userData = roomSession.userDataManager.getUserDataByIndex(roomObject.id);

            if(!userData || (userData.type !== RoomObjectType.USER)) continue;

            userCount++;

            const effectValue = Number(roomObject.model.getValue<number>(RoomObjectVariable.FIGURE_EFFECT) ?? 0);
            const teamData = getTeamEffectData(effectValue);

            if(!teamData) continue;

            teamSizes[teamData.colorId] = (teamSizes[teamData.colorId] + 1);
        }

        const hotelTimeZone = (roomSession.hotelTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        const hotelTimeSnapshotMs = Number(roomSession.hotelTimeSnapshotMs ?? 0);
        const hotelTimeSyncMs = Number(roomSession.hotelTimeSyncMs ?? 0);
        const hotelCurrentTimeMs = ((hotelTimeSnapshotMs > 0) && (hotelTimeSyncMs > 0))
            ? (hotelTimeSnapshotMs + Math.max(0, (globalClock - hotelTimeSyncMs)))
            : globalClock;
        const hotelNow = getHotelDateTimeParts(hotelCurrentTimeMs, hotelTimeZone);
        const clientTimeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        const weekdayIndex = getMondayBasedWeekday(hotelNow);
        const monthIndex = hotelNow.month;

        return [
            { key: '@furni_count', value: String(floorObjects.length + wallObjects.length) },
            { key: '@user_count', value: String(userCount) },
            { key: '@wired_timer', value: String(Math.max(0, Math.floor((globalClock - roomEnteredAt) / 1000))) },
            { key: '@teams.red.score', value: String(getRoomTeamScore(1)) },
            { key: '@teams.green.score', value: String(getRoomTeamScore(2)) },
            { key: '@teams.blue.score', value: String(getRoomTeamScore(3)) },
            { key: '@teams.yellow.score', value: String(getRoomTeamScore(4)) },
            { key: '@teams.red.size', value: String(teamSizes[1]) },
            { key: '@teams.green.size', value: String(teamSizes[2]) },
            { key: '@teams.blue.size', value: String(teamSizes[3]) },
            { key: '@teams.yellow.size', value: String(teamSizes[4]) },
            { key: '@room_id', value: String(roomId) },
            { key: '@group_id', value: String(Number(roomSession.groupId ?? 0)) },
            { key: '@timezone_server', value: hotelTimeZone },
            { key: '@timezone_client', value: clientTimeZone },
            { key: '@current_time', value: 'Hidden', valueClassName: 'text-[#d97b78]' },
            { key: '@current_time.millisecond_of_second', value: String(hotelNow.millisecond) },
            { key: '@current_time.seconds_of_minute', value: String(hotelNow.second) },
            { key: '@current_time.minute_of_hour', value: String(hotelNow.minute) },
            { key: '@current_time.hour_of_day', value: String(hotelNow.hour) },
            { key: '@current_time.day_of_week', value: `${ weekdayIndex } (${ WEEKDAY_NAMES[weekdayIndex - 1] })` },
            { key: '@current_time.day_of_month', value: String(hotelNow.day) },
            { key: '@current_time.day_of_year', value: String(getDayOfYear(hotelNow)) },
            { key: '@current_time.week_of_year', value: String(getIsoWeekOfYear(hotelNow)) },
            { key: '@current_time.month_of_year', value: `${ monthIndex } (${ MONTH_NAMES[monthIndex - 1] })` },
            { key: '@current_time.year', value: String(hotelNow.year) }
        ];
    }, [ inspectionType, roomSession, globalClock, roomEnteredAt ]);
    const displayedVariables = ((inspectionType === 'user')
        ? userVariables
        : ((inspectionType === 'global')
            ? globalVariables
            : furniVariables));

    const beginVariableEdit = (variable: InspectionVariable) =>
    {
        if(!variable.editable) return;

        if((inspectionType === 'furni') && !EDITABLE_FURNI_VARIABLES.includes(variable.key)) return;
        if((inspectionType === 'user') && !EDITABLE_USER_VARIABLES.includes(variable.key)) return;

        setEditingVariable(variable.key);
        setEditingValue(variable.value);
    };

    const commitVariableEdit = () =>
    {
        if((inspectionType === 'user') && selectedUser && roomSession)
        {
            const currentLiveState = (selectedUserLiveState ?? getUserLiveState(selectedUser.roomIndex));

            if(!currentLiveState)
            {
                cancelVariableEdit();
                return;
            }

            let nextX = currentLiveState.positionX;
            let nextY = currentLiveState.positionY;
            let nextDirection = currentLiveState.direction;
            let isValid = true;

            switch(editingVariable)
            {
                case '@position.x': {
                    const parsed = parseInt(editingValue.trim(), 10);

                    if(Number.isNaN(parsed))
                    {
                        isValid = false;
                        break;
                    }

                    nextX = parsed;
                    break;
                }
                case '@position.y': {
                    const parsed = parseInt(editingValue.trim(), 10);

                    if(Number.isNaN(parsed))
                    {
                        isValid = false;
                        break;
                    }

                    nextY = parsed;
                    break;
                }
                case '@direction': {
                    const parsed = parseInt(editingValue.trim(), 10);

                    if(Number.isNaN(parsed))
                    {
                        isValid = false;
                        break;
                    }

                    nextDirection = ((((parsed % 8) + 8) % 8));
                    break;
                }
                default:
                    isValid = false;
                    break;
            }

            if(!isValid)
            {
                cancelVariableEdit();
                return;
            }

            if((nextX === currentLiveState.positionX) && (nextY === currentLiveState.positionY) && (nextDirection === currentLiveState.direction))
            {
                cancelVariableEdit();
                return;
            }

            if(selectedUser.kind === 'pet')
            {
                SendMessageComposer(new PetMoveComposer(selectedUser.userId, nextX, nextY, nextDirection));
            }
            else if((selectedUser.kind === 'user') && (selectedUser.roomIndex === roomSession.ownRoomIndex))
            {
                if(editingVariable === '@direction')
                {
                    const directionVector = USER_DIRECTION_VECTORS[nextDirection] ?? USER_DIRECTION_VECTORS[0];

                    SendMessageComposer(new RoomUnitLookComposer((currentLiveState.positionX + directionVector.x), (currentLiveState.positionY + directionVector.y)));
                }
                else
                {
                    SendMessageComposer(new RoomUnitWalkComposer(nextX, nextY));
                }
            }
            else
            {
                cancelVariableEdit();
                return;
            }

            setSelectedUserLiveState({
                ...currentLiveState,
                positionX: nextX,
                positionY: nextY,
                direction: nextDirection
            });

            setEditingVariable(null);
            setEditingValue('');
            return;
        }

        if(!editingVariable || !selectedFurni || !selectedRoomObject || !roomSession) return;

        const currentLiveState = (selectedFurniLiveState ?? getFurniLiveState(selectedFurni.objectId, selectedFurni.category));

        if(!currentLiveState)
        {
            cancelVariableEdit();
            return;
        }

        let nextX = currentLiveState.positionX;
        let nextY = currentLiveState.positionY;
        let nextZ = (currentLiveState.altitude / 100);
        let nextRotation = currentLiveState.rotation;
        let nextState: number = null;
        let nextWallOffsetX: number = null;
        let nextWallOffsetY: number = null;
        let isValid = true;

        switch(editingVariable)
        {
            case '@position.x': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextX = parsed;
                break;
            }
            case '@position.y': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextY = parsed;
                break;
            }
            case '@rotation': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextRotation = ((((parsed % 8) + 8) % 8));
                break;
            }
            case '@altitude': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextZ = Math.max(0, Math.min(40, (parsed / 100)));
                break;
            }
            case '@state': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextState = parsed;
                break;
            }
            case '@wallitem_offset': {
                if(selectedFurni.category !== RoomObjectCategory.WALL)
                {
                    isValid = false;
                    break;
                }

                const match = editingValue.trim().match(/^(-?\d+)\s*,\s*(-?\d+)$/);

                if(!match)
                {
                    isValid = false;
                    break;
                }

                nextWallOffsetX = parseInt(match[1], 10);
                nextWallOffsetY = parseInt(match[2], 10);
                break;
            }
        }

        if(!isValid)
        {
            cancelVariableEdit();
            return;
        }

        if(editingVariable === '@state')
        {
            if(nextState === currentLiveState.state)
            {
                cancelVariableEdit();
                return;
            }

            setSelectedFurniLiveState(previousValue =>
            {
                if(!previousValue) return previousValue;

                return { ...previousValue, state: nextState };
            });

            if(selectedFurni.category === RoomObjectCategory.WALL) SendMessageComposer(new FurnitureWallMultiStateComposer(selectedFurni.objectId, nextState));
            else SendMessageComposer(new FurnitureMultiStateComposer(selectedFurni.objectId, nextState));

            setEditingVariable(null);
            setEditingValue('');
            return;
        }

        if(editingVariable === '@wallitem_offset')
        {
            if((selectedFurni.category !== RoomObjectCategory.WALL) || !parsedWallLocation)
            {
                cancelVariableEdit();
                return;
            }

            if((nextWallOffsetX === parsedWallLocation.localX) && (nextWallOffsetY === parsedWallLocation.localY))
            {
                cancelVariableEdit();
                return;
            }

            const wallGeometry = GetRoomEngine().getLegacyWallGeometry(roomSession.roomId);

            if(!wallGeometry)
            {
                cancelVariableEdit();
                return;
            }

            const nextWallLocationString = `:w=${parsedWallLocation.width},${parsedWallLocation.height} l=${nextWallOffsetX},${nextWallOffsetY} ${parsedWallLocation.direction}`;
            const nextLocation = wallGeometry.getLocation(parsedWallLocation.width, parsedWallLocation.height, nextWallOffsetX, nextWallOffsetY, parsedWallLocation.direction);
            const nextAngle = wallGeometry.getDirection(parsedWallLocation.direction);
            const currentExtra = (selectedFurni.info?.stuffData?.getLegacyString?.() ?? selectedFurni.info?.extraParam ?? '0');

            if(!nextLocation)
            {
                cancelVariableEdit();
                return;
            }

            GetRoomEngine().updateRoomObjectWall(roomSession.roomId, selectedFurni.objectId, nextLocation, new Vector3d(nextAngle), currentLiveState.state, currentExtra);

            setSelectedFurniLiveState(previousValue =>
            {
                if(!previousValue) return previousValue;

                return {
                    ...previousValue,
                    positionX: Math.round(nextLocation.x),
                    positionY: Math.round(nextLocation.y),
                    altitude: Math.round(nextLocation.z * 100),
                    rotation: ((((Math.round(nextAngle / 45) % 8) + 8) % 8))
                };
            });

            SendMessageComposer(new FurnitureWallUpdateComposer(selectedFurni.objectId, nextWallLocationString));
            setEditingVariable(null);
            setEditingValue('');
            return;
        }

        if((nextX === currentLiveState.positionX) && (nextY === currentLiveState.positionY) && (Math.round(nextZ * 100) === currentLiveState.altitude) && (nextRotation === currentLiveState.rotation))
        {
            cancelVariableEdit();
            return;
        }

        setSelectedFurniLiveState(previousValue =>
        {
            if(!previousValue) return previousValue;

            return {
                ...previousValue,
                positionX: nextX,
                positionY: nextY,
                altitude: Math.round(nextZ * 100),
                rotation: nextRotation
            };
        });

        if(selectedFurni.category === RoomObjectCategory.WALL)
        {
            const wallGeometry = GetRoomEngine().getLegacyWallGeometry(roomSession.roomId);

            if(!wallGeometry)
            {
                cancelVariableEdit();
                return;
            }

            const currentLocation = selectedRoomObject.getLocation();
            const currentExtra = (selectedFurni.info?.stuffData?.getLegacyString?.() ?? selectedFurni.info?.extraParam ?? '0');
            const nextLocation = new Vector3d(nextX, nextY, nextZ);
            const nextAngle = (nextRotation * 45);
            const wallLocation = wallGeometry.getOldLocationString(nextLocation, nextAngle);

            if(!wallLocation)
            {
                cancelVariableEdit();
                return;
            }

            GetRoomEngine().updateRoomObjectWall(roomSession.roomId, selectedFurni.objectId, nextLocation, new Vector3d(nextAngle), currentLiveState.state, currentExtra);

            if(currentLocation)
            {
                setSelectedFurniLiveState(previousValue =>
                {
                    if(!previousValue) return previousValue;

                    return {
                        ...previousValue,
                        positionX: Math.round(nextLocation.x),
                        positionY: Math.round(nextLocation.y),
                        altitude: Math.round(nextLocation.z * 100),
                        rotation: nextRotation
                    };
                });
            }

            SendMessageComposer(new FurnitureWallUpdateComposer(selectedFurni.objectId, wallLocation));
            setEditingVariable(null);
            setEditingValue('');
            return;
        }

        SendMessageComposer(new UpdateFurniturePositionComposer(selectedFurni.objectId, nextX, nextY, Math.round(nextZ * 10000), nextRotation));

        setEditingVariable(null);
        setEditingValue('');
    };

    const cancelVariableEdit = () =>
    {
        setEditingVariable(null);
        setEditingValue('');
    };

    const onVariableInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        event.stopPropagation();

        if(event.nativeEvent.stopImmediatePropagation) event.nativeEvent.stopImmediatePropagation();

        switch(event.key)
        {
            case 'Enter':
                event.preventDefault();
                commitVariableEdit();
                return;
            case 'Escape':
                event.preventDefault();
                cancelVariableEdit();
                return;
        }
    };

    useEffect(() =>
    {
        setEditingVariable(null);
        setEditingValue('');
    }, [ selectedFurni?.objectId, selectedUser?.roomIndex, inspectionType ]);

    useEffect(() =>
    {
        if((inspectionType !== 'furni') || !selectedFurni)
        {
            setSelectedFurniLiveState(null);

            return;
        }

        setSelectedFurniLiveState(getFurniLiveState(selectedFurni.objectId, selectedFurni.category));
    }, [ inspectionType, selectedFurni?.objectId, selectedFurni?.category ]);

    useEffect(() =>
    {
        if((inspectionType !== 'user') || !selectedUser)
        {
            setSelectedUserLiveState(null);

            return;
        }

        setSelectedUserLiveState(getUserLiveState(selectedUser.roomIndex));
    }, [ inspectionType, selectedUser?.roomIndex ]);

    if(!isVisible) return null;

    return (
        <NitroCardView className="min-w-[520px] max-w-[520px]" theme="primary-slim" uniqueKey="wired-creator-tools" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText="Wired Creator Tools (:wired)" onCloseClick={ () => setIsVisible(false) } />
            <NitroCardTabsView justifyContent="start">
                { TABS.map(tab => (
                    <NitroCardTabsItemView key={ tab.key } isActive={ (activeTab === tab.key) } onClick={ () => setActiveTab(tab.key) }>
                        <Text>{ tab.label }</Text>
                    </NitroCardTabsItemView>
                )) }
            </NitroCardTabsView>
            <NitroCardContentView className="text-black bg-[#e9e6d9]" gap={ 3 }>
                    { (activeTab === 'monitor') &&
                        <div className="p-3 flex flex-col gap-3">
                            <div className="text-[11px] text-[#666] italic">
                                This is the initial shell for the Wired Creator Tools. We can now build the real functionality tab by tab.
                            </div>
                            <div className="grid grid-cols-[190px_1fr] gap-3">
                                <div className="bg-white rounded border border-[#b9b3a5] p-2 flex flex-col gap-1">
                                    <Text bold>Statistics:</Text>
                                    { monitorStats.map(stat => (
                                        <div key={ stat.label } className="flex justify-between gap-2 text-[12px]">
                                            <span>{ stat.label }:</span>
                                            <span>{ stat.value }</span>
                                        </div>
                                    )) }
                                </div>
                                <div className="min-h-[140px] flex items-center justify-center px-4">
                                    <img alt="Monitor preview" className="max-w-full max-h-[180px] object-contain" src={ wiredMonitorImage } />
                                </div>
                            </div>
                            <div className="bg-white rounded border border-[#b9b3a5] p-2 flex flex-col gap-2">
                                <Text bold>Logs:</Text>
                                <div className="max-h-[180px] overflow-y-auto border border-[#d1ccbf] rounded">
                                    <table className="w-full text-[12px]">
                                        <thead className="bg-[#efede5] sticky top-0">
                                            <tr>
                                                <th className="text-left px-2 py-1">Type</th>
                                                <th className="text-left px-2 py-1">Category</th>
                                                <th className="text-left px-2 py-1">Amount</th>
                                                <th className="text-left px-2 py-1">Latest occurrence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            { MONITOR_LOGS.map((log, index) => (
                                                <tr key={ log.type } className={ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' }>
                                                    <td className="px-2 py-1 text-[#1b57b2]">{ log.type }</td>
                                                    <td className="px-2 py-1">{ log.category }</td>
                                                    <td className="px-2 py-1">{ log.amount }</td>
                                                    <td className="px-2 py-1">{ log.latest }</td>
                                                </tr>
                                            )) }
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <Button disabled variant="danger">Clear all</Button>
                                    <Button disabled variant="secondary">View full logs</Button>
                                </div>
                            </div>
                        </div> }
                    { (activeTab === 'inspection') &&
                        <div className="p-3 min-h-[360px] flex gap-4">
                            <div className="w-[145px] shrink-0 flex flex-col gap-2">
                                <div className="flex flex-col gap-1">
                                    <Text bold>Element type:</Text>
                                    <div className="flex gap-1">
                                        { INSPECTION_ELEMENTS.map(element => (
                                            <button
                                                key={ element.key }
                                                type="button"
                                                className={ `w-[42px] h-[38px] rounded border flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,.7)] ${ (inspectionType === element.key) ? 'border-[#222] bg-[#d9d6cf]' : 'border-[#7f7f7f] bg-[#ece9e1]' }` }
                                                onClick={ () => setInspectionType(element.key) }
                                                title={ element.label }>
                                                <img alt={ element.label } className="max-w-[22px] max-h-[22px] object-contain" src={ element.icon } />
                                            </button>
                                        )) }
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Text bold>Preview:</Text>
                                    <div className="relative h-[224px] rounded border border-[#c0bdb4] bg-[#d7d7d7] overflow-hidden">
                                        { (inspectionType === 'furni') && selectedFurni && roomSession &&
                                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                                <LayoutRoomObjectImageView category={ selectedFurni.category } objectId={ selectedFurni.objectId } roomId={ roomSession.roomId } />
                                            </div> }
                                        { (inspectionType === 'user') && selectedUser &&
                                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                                { (selectedUser.kind === 'pet')
                                                    ? <LayoutPetImageView direction={ 2 } figure={ selectedUser.figure } posture={ selectedUser.posture } />
                                                    : <LayoutAvatarImageView direction={ 2 } figure={ selectedUser.figure } /> }
                                            </div> }
                                        { (inspectionType === 'global') &&
                                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                                <img alt="Global placeholder" className="max-w-full max-h-full object-contain" src={ wiredGlobalPlaceholderImage } />
                                            </div> }
                                        { (((inspectionType === 'furni') && !selectedFurni) || ((inspectionType === 'user') && !selectedUser) || (inspectionType === 'global')) &&
                                            <div className={ `absolute inset-0 flex items-center justify-center px-3 text-center text-[#666] text-[12px] ${ (inspectionType === 'global') ? 'hidden' : '' }` }>
                                                { previewPlaceholder }
                                            </div> }
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-[12px] text-[#111]">
                                    <input checked={ keepSelected } className="form-check-input mt-0" type="checkbox" onChange={ event => setKeepSelected(event.target.checked) } />
                                    <span>Keep selected</span>
                                </label>
                            </div>
                            <div className="min-w-0 grow flex flex-col gap-2">
                                <div className="flex flex-col gap-1 grow min-h-0">
                                    <Text bold>Variables:</Text>
                                    <div className="grow rounded border border-[#bdb8ab] bg-white overflow-hidden">
                                        <div className="grid grid-cols-[1fr_120px] border-b border-[#d8d4c8] bg-[#f5f2ea] px-3 py-2 text-[12px] text-[#666]">
                                            <span>Variable</span>
                                            <span>Value</span>
                                        </div>
                                        { !displayedVariables.length &&
                                            <div className="h-[calc(100%-37px)] flex items-center justify-center text-[#b1aca2] text-[20px]">
                                                <Text>Nothing to display</Text>
                                            </div> }
                                        { !!displayedVariables.length &&
                                            <div className="max-h-[290px] overflow-y-auto">
                                                <table className="w-full text-[12px]">
                                                    <tbody>
                                                        { displayedVariables.map((variable, index) => (
                                                            <tr
                                                                key={ variable.key }
                                                                className={ `${ (index % 2 === 0) ? 'bg-white' : 'bg-[#f3f3f3]' } ${ variable.editable ? 'cursor-pointer hover:bg-[#e8eefc]' : '' }` }
                                                                onClick={ () => beginVariableEdit(variable) }>
                                                                <td className="px-3 py-1 text-[#444]">{ variable.key }</td>
                                                                <td className="px-3 py-1 text-right text-[#222]">
                                                                    { (editingVariable === variable.key) &&
                                                                        <input
                                                                            autoFocus
                                                                            className="w-[170px] rounded border border-[#8d8d8d] px-2 py-1 text-right text-[12px]"
                                                                            spellCheck={ false }
                                                                            type="text"
                                                                            value={ editingValue }
                                                                            onClick={ event => event.stopPropagation() }
                                                                            onBlur={ commitVariableEdit }
                                                                            onChange={ event => setEditingValue(event.target.value) }
                                                                            onKeyDownCapture={ event =>
                                                                            {
                                                                                event.stopPropagation();

                                                                                if(event.nativeEvent.stopImmediatePropagation) event.nativeEvent.stopImmediatePropagation();
                                                                            } }
                                                                            onKeyDown={ onVariableInputKeyDown } /> }
                                                                    { (editingVariable !== variable.key) && !variable.editable && <span className={ variable.valueClassName }>{ variable.value }</span> }
                                                                    { (editingVariable !== variable.key) && variable.editable &&
                                                                        <button
                                                                            className={ `w-full cursor-pointer rounded px-1 text-right text-[#1b57b2] hover:underline ${ variable.valueClassName ?? '' }` }
                                                                            type="button"
                                                                            onClick={ event =>
                                                                            {
                                                                                event.stopPropagation();
                                                                                beginVariableEdit(variable);
                                                                            } }>
                                                                            { variable.value }
                                                                        </button> }
                                                                </td>
                                                            </tr>
                                                        )) }
                                                    </tbody>
                                                </table>
                                            </div> }
                                    </div>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <Button disabled variant="secondary">Remove variable</Button>
                                    <Button disabled variant="secondary">Give variable</Button>
                                </div>
                            </div>
                        </div> }
                    { (activeTab !== 'monitor') &&
                      (activeTab !== 'inspection') &&
                        <div className="p-4 min-h-[360px] flex items-center justify-center text-center text-[#555]">
                            <div className="max-w-[320px]">
                                <Text bold>{ currentTabLabel }</Text>
                                <div className="mt-2 text-[12px]">
                                    This tab is now ready to be wired into the new `:wired` tools flow.
                                </div>
                            </div>
                        </div> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
