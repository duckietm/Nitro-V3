import { AddLinkEventTracker, AvatarExpressionEnum, FigureUpdateEvent, FurnitureFloorUpdateEvent, FurnitureMultiStateComposer, FurnitureWallMultiStateComposer, FurnitureWallUpdateComposer, FurnitureWallUpdateEvent, GetLocalizationManager, GetRoomEngine, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker, RoomControllerLevel, RoomObjectCategory, RoomObjectType, RoomObjectVariable, RoomUnitDanceEvent, RoomUnitEffectEvent, RoomUnitExpressionEvent, RoomUnitHandItemEvent, RoomUnitInfoEvent, RoomUnitStatusEvent, UpdateFurniturePositionComposer, Vector3d, WiredUserInspectMoveComposer } from '@nitrots/nitro-renderer';
import { WiredMonitorDataEvent, WiredMonitorRequestComposer } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import furniInspectionIcon from '../../assets/images/wiredtools/furni.png';
import globalInspectionIcon from '../../assets/images/wiredtools/global.png';
import userInspectionIcon from '../../assets/images/wiredtools/user.png';
import contextInspectionIcon from '../../assets/images/wiredtools/context.png';
import wiredGlobalPlaceholderImage from '../../assets/images/wiredtools/wired_global_placeholder.png';
import wiredMonitorImage from '../../assets/images/wiredtools/wired_monitor.png';
import { AvatarInfoFurni, AvatarInfoUtilities, LocalizeText, NotificationAlertType, SendMessageComposer } from '../../api';
import { Button, DraggableWindowPosition, LayoutAvatarImageView, LayoutPetImageView, LayoutRoomObjectImageView, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useInventoryTrade, useMessageEvent, useNotification, useObjectSelectedEvent, useRoom, useWiredTools } from '../../hooks';
import { WiredToolsSettingsTabView } from './WiredToolsSettingsTabView';

type WiredToolsTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';
type InspectionElementType = 'furni' | 'user' | 'global';
type VariablesElementType = InspectionElementType | 'context';

interface InspectionElementButton
{
    key: InspectionElementType;
    label: string;
    icon: string;
}

interface VariablesElementButton
{
    key: VariablesElementType;
    label: string;
    icon: string;
    disabled?: boolean;
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
    latestReason: string;
    latestSourceId: number;
    latestSourceLabel: string;
}

interface MonitorSnapshot
{
    usageCurrentWindow: number;
    usageLimitPerWindow: number;
    isHeavy: boolean;
    delayedEventsPending: number;
    delayedEventsLimit: number;
    averageExecutionMs: number;
    peakExecutionMs: number;
    recursionDepthCurrent: number;
    recursionDepthLimit: number;
    killedRemainingSeconds: number;
    usageWindowMs: number;
    overloadAverageThresholdMs: number;
    overloadPeakThresholdMs: number;
    heavyUsageThresholdPercent: number;
    heavyConsecutiveWindowsThreshold: number;
    overloadConsecutiveWindowsThreshold: number;
    heavyDelayedThresholdPercent: number;
    logs: Array<{
        amount: number;
        latestOccurrenceSeconds: number;
        latestReason: string;
        latestSourceId: number;
        latestSourceLabel: string;
        severity: string;
        type: string;
    }>;
    history: Array<{
        occurredAtSeconds: number;
        reason: string;
        sourceId: number;
        sourceLabel: string;
        severity: string;
        type: string;
    }>;
}

interface MonitorLogDetails
{
    amount?: string;
    latest?: string;
    occurredAt?: string;
    reason: string;
    severity: string;
    sourceId: number;
    sourceLabel: string;
    type: string;
}

interface InspectionVariable
{
    key: string;
    value: string;
    editable?: boolean;
    valueClassName?: string;
}

interface VariableDefinition
{
    key: string;
    itemId?: number;
    target: 'Furni' | 'User' | 'Global' | 'Context';
    type: string;
    hasValue: boolean;
    isReadOnly?: boolean;
    availability: string;
    canWriteTo: boolean;
    canCreateDelete: boolean;
    canIntercept: boolean;
    hasCreationTime: boolean;
    hasUpdateTime: boolean;
    isTextConnected: boolean;
    isAlwaysAvailable?: boolean;
}

interface VariableTextValue
{
    value: string;
    text: string;
}

interface VariableManageEntry
{
    categoryLabel: string;
    createdAt: number;
    entityId: number;
    entityName: string;
    manageLabel: string;
    updatedAt: number;
    value: number | null;
}

interface ManagedHolderVariableEntry
{
    availability: string;
    createdAt: number;
    hasValue: boolean;
    name: string;
    isReadOnly?: boolean;
    updatedAt: number;
    value: number | null;
    variableItemId: number;
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

const MONITOR_LOG_ORDER: string[] = [
    'EXECUTION_CAP',
    'DELAYED_EVENTS_CAP',
    'EXECUTOR_OVERLOAD',
    'MARKED_AS_HEAVY',
    'KILLED',
    'RECURSION_TIMEOUT'
];

const WIRED_MONITOR_ACTION_FETCH = 0;
const WIRED_MONITOR_ACTION_CLEAR_LOGS = 1;
const WIRED_MONITOR_POLL_MS = 50;
const WIRED_VARIABLES_POLL_MS = 50;
const WIRED_INSPECTION_REFRESH_MS = 50;
const WIRED_CLOCK_REFRESH_MS = 50;

const MONITOR_ERROR_INFO: Record<string, { description: string[]; severity: string; title: string; }> = {
    EXECUTION_CAP: {
        title: 'EXECUTION_CAP',
        severity: 'ERROR',
        description: [
            'This error occurs when the maximum Wired usage limit is about to be exceeded by a Wired execution.',
            'When this happens, the current execution is cancelled so the room never goes over the configured usage budget.',
            'If this happens too often, it usually means the setup is too complex for the amount of triggers firing in a short time.'
        ]
    },
    DELAYED_EVENTS_CAP: {
        title: 'DELAYED_EVENTS_CAP',
        severity: 'ERROR',
        description: [
            'Delayed Wired events happen when effects are scheduled to run later.',
            'There is a limit to how many delayed events can be pending at the same time. Once the limit is reached, new delayed executions are refused.',
            'If this appears often, the setup is likely relying too heavily on delayed effects and should be simplified.'
        ]
    },
    EXECUTOR_OVERLOAD: {
        title: 'EXECUTOR_OVERLOAD',
        severity: 'ERROR',
        description: [
            'This error occurs when the Wired engine is receiving a lot of instructions and the room cannot keep up with the execution time.',
            'This can be a sign of server pressure or of a setup that is too expensive to evaluate repeatedly.',
            'If the room is also marked as heavy, it is a good sign that the setup should be reduced or optimized.'
        ]
    },
    MARKED_AS_HEAVY: {
        title: 'MARKED_AS_HEAVY',
        severity: 'WARNING',
        description: [
            'The room is being considered heavy because its Wired usage stays high across multiple monitor windows.',
            'This is not a fatal error by itself, but it means the room is consuming a significant portion of the execution budget.',
            'If the room is not intentionally complex, it is worth reviewing the setup before it starts triggering harder limits.'
        ]
    },
    KILLED: {
        title: 'KILLED',
        severity: 'ERROR',
        description: [
            'This happens when the room is temporarily halted by the protection layer because the Wired flow looks abusive or unstable.',
            'While the room is killed, Wired execution is paused for a cooldown period.',
            'This is usually caused by loops, event spam, or repeated limit violations.'
        ]
    },
    RECURSION_TIMEOUT: {
        title: 'RECURSION_TIMEOUT',
        severity: 'ERROR',
        description: [
            'Recursive Wired events happen when signals keep re-triggering other stacks in the same room.',
            'When the recursion depth limit is reached, execution is stopped to prevent runaway loops.',
            'In most cases this means two or more stacks are indirectly calling each other too many times.'
        ]
    }
};

const INSPECTION_ELEMENTS: InspectionElementButton[] = [
    { key: 'furni', label: 'Furni', icon: furniInspectionIcon },
    { key: 'user', label: 'User', icon: userInspectionIcon },
    { key: 'global', label: 'Global', icon: globalInspectionIcon }
];

const VARIABLES_ELEMENTS: VariablesElementButton[] = [
    { key: 'furni', label: 'Furni', icon: furniInspectionIcon },
    { key: 'user', label: 'User', icon: userInspectionIcon },
    { key: 'global', label: 'Global', icon: globalInspectionIcon },
    { key: 'context', label: 'Context', icon: contextInspectionIcon }
];

const EDITABLE_FURNI_VARIABLES: string[] = [ '@position_x', '@position_y', '@rotation', '@altitude', '@state', '@wallitem_offset' ];
const EDITABLE_USER_VARIABLES: string[] = [ '@position_x', '@position_y', '@direction' ];
const createVariableDefinition = (key: string, target: 'Furni' | 'User' | 'Global' | 'Context', availability: string = 'Always', canWriteTo = false): VariableDefinition =>
({
    key,
    target,
    type: 'Internal',
    hasValue: true,
    availability,
    canWriteTo,
    canCreateDelete: false,
    canIntercept: false,
    hasCreationTime: false,
    hasUpdateTime: false,
    isTextConnected: false,
    isAlwaysAvailable: (availability === 'Always')
});
const VARIABLE_DEFINITIONS: Record<VariablesElementType, VariableDefinition[]> = {
    furni: [
        createVariableDefinition('~teleport.target_id', 'Furni', 'Conditional'),
        createVariableDefinition('@id', 'Furni'),
        createVariableDefinition('@class_id', 'Furni'),
        createVariableDefinition('@height', 'Furni'),
        createVariableDefinition('@state', 'Furni', 'Always', true),
        createVariableDefinition('@position_x', 'Furni', 'Always', true),
        createVariableDefinition('@position_y', 'Furni', 'Always', true),
        createVariableDefinition('@rotation', 'Furni', 'Always', true),
        createVariableDefinition('@altitude', 'Furni', 'Always', true),
        createVariableDefinition('@is_invisible', 'Furni', 'Conditional'),
        createVariableDefinition('@wallitem_offset', 'Furni', 'Conditional', true),
        createVariableDefinition('@type', 'Furni'),
        createVariableDefinition('@can_sit_on', 'Furni', 'Conditional'),
        createVariableDefinition('@can_lay_on', 'Furni', 'Conditional'),
        createVariableDefinition('@can_stand_on', 'Furni', 'Conditional'),
        createVariableDefinition('@is_stackable', 'Furni', 'Conditional'),
        createVariableDefinition('@dimensions.x', 'Furni'),
        createVariableDefinition('@dimensions.y', 'Furni'),
        createVariableDefinition('@owner_id', 'Furni')
    ],
    user: [
        createVariableDefinition('@index', 'User'),
        createVariableDefinition('@type', 'User'),
        createVariableDefinition('@gender', 'User'),
        createVariableDefinition('@level', 'User'),
        createVariableDefinition('@achievement_score', 'User'),
        createVariableDefinition('@is_hc', 'User', 'Conditional'),
        createVariableDefinition('@has_rights', 'User', 'Conditional'),
        createVariableDefinition('@is_owner', 'User', 'Conditional'),
        createVariableDefinition('@is_group_admin', 'User', 'Conditional'),
        createVariableDefinition('@is_muted', 'User', 'Conditional'),
        createVariableDefinition('@is_trading', 'User', 'Conditional'),
        createVariableDefinition('@is_frozen', 'User', 'Conditional'),
        createVariableDefinition('@effect_id', 'User', 'Conditional'),
        createVariableDefinition('@team_score', 'User', 'Conditional'),
        createVariableDefinition('@team_color', 'User', 'Conditional'),
        createVariableDefinition('@team_type', 'User', 'Conditional'),
        createVariableDefinition('@sign', 'User', 'Conditional'),
        createVariableDefinition('@dance', 'User', 'Conditional'),
        createVariableDefinition('@is_idle', 'User', 'Conditional'),
        createVariableDefinition('@handitem_id', 'User', 'Conditional'),
        createVariableDefinition('@position_x', 'User', 'Always', true),
        createVariableDefinition('@position_y', 'User', 'Always', true),
        createVariableDefinition('@direction', 'User', 'Always', true),
        createVariableDefinition('@altitude', 'User'),
        createVariableDefinition('@favourite_group_id', 'User', 'Conditional'),
        createVariableDefinition('@room_entry.method', 'User', 'Conditional'),
        createVariableDefinition('@room_entry.teleport_id', 'User', 'Conditional'),
        createVariableDefinition('@user_id', 'User', 'Conditional'),
        createVariableDefinition('@bot_id', 'User', 'Conditional'),
        createVariableDefinition('@pet_id', 'User', 'Conditional'),
        createVariableDefinition('@pet_owner_id', 'User', 'Conditional')
    ],
    global: [
        createVariableDefinition('@furni_count', 'Global'),
        createVariableDefinition('@user_count', 'Global'),
        createVariableDefinition('@wired_timer', 'Global'),
        createVariableDefinition('@team_red_score', 'Global'),
        createVariableDefinition('@team_green_score', 'Global'),
        createVariableDefinition('@team_blue_score', 'Global'),
        createVariableDefinition('@team_yellow_score', 'Global'),
        createVariableDefinition('@team_red_size', 'Global'),
        createVariableDefinition('@team_green_size', 'Global'),
        createVariableDefinition('@team_blue_size', 'Global'),
        createVariableDefinition('@team_yellow_size', 'Global'),
        createVariableDefinition('@room_id', 'Global'),
        createVariableDefinition('@group_id', 'Global'),
        createVariableDefinition('@timezone_server', 'Global'),
        createVariableDefinition('@timezone_client', 'Global'),
        createVariableDefinition('@current_time', 'Global'),
        createVariableDefinition('@current_time.millisecond_of_second', 'Global'),
        createVariableDefinition('@current_time.seconds_of_minute', 'Global'),
        createVariableDefinition('@current_time.minute_of_hour', 'Global'),
        createVariableDefinition('@current_time.hour_of_day', 'Global'),
        createVariableDefinition('@current_time.day_of_week', 'Global'),
        createVariableDefinition('@current_time.day_of_month', 'Global'),
        createVariableDefinition('@current_time.day_of_year', 'Global'),
        createVariableDefinition('@current_time.week_of_year', 'Global'),
        createVariableDefinition('@current_time.month_of_year', 'Global'),
        createVariableDefinition('@current_time.year', 'Global')
    ],
    context: [
        createVariableDefinition('@selector_furni_count', 'Context', 'Conditional'),
        createVariableDefinition('@selector_user_count', 'Context', 'Conditional'),
        createVariableDefinition('@signal_furni_count', 'Context', 'Conditional'),
        createVariableDefinition('@signal_user_count', 'Context', 'Conditional'),
        createVariableDefinition('@antenna_id', 'Context', 'Conditional'),
        createVariableDefinition('@chat_type', 'Context', 'Conditional'),
        createVariableDefinition('@chat_style', 'Context', 'Conditional')
    ]
};
const WIRED_FREEZE_EFFECT_IDS: Set<number> = new Set([ 218, 12, 11, 53, 163 ]);
const TEAM_COLOR_NAMES: Record<number, string> = {
    1: 'red',
    2: 'green',
    3: 'blue',
    4: 'yellow'
};
const WEEKDAY_NAMES: string[] = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];
const MONTH_NAMES: string[] = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
const DIRECTION_NAMES: string[] = [ 'North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West' ];
const HOTEL_TIME_FORMATTERS: Map<string, Intl.DateTimeFormat> = new Map();

const createEmptyMonitorSnapshot = (): MonitorSnapshot =>
({
    usageCurrentWindow: 0,
    usageLimitPerWindow: 0,
    isHeavy: false,
    delayedEventsPending: 0,
    delayedEventsLimit: 0,
    averageExecutionMs: 0,
    peakExecutionMs: 0,
    recursionDepthCurrent: 0,
    recursionDepthLimit: 0,
    killedRemainingSeconds: 0,
    usageWindowMs: 0,
    overloadAverageThresholdMs: 0,
    overloadPeakThresholdMs: 0,
    heavyUsageThresholdPercent: 0,
    heavyConsecutiveWindowsThreshold: 0,
    overloadConsecutiveWindowsThreshold: 0,
    heavyDelayedThresholdPercent: 0,
    logs: [],
    history: []
});

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

const formatMonitorLatestOccurrence = (latestOccurrenceSeconds: number, nowMs: number): string =>
{
    if(latestOccurrenceSeconds <= 0) return '/';

    const diffMs = Math.max(0, (nowMs - (latestOccurrenceSeconds * 1000)));
    const diffSeconds = Math.floor(diffMs / 1000);

    if(diffSeconds < 5) return 'Just now';
    if(diffSeconds < 60) return `${ diffSeconds }s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);

    if(diffMinutes < 60) return `${ diffMinutes }m ago`;

    const diffHours = Math.floor(diffMinutes / 60);

    if(diffHours < 24) return `${ diffHours }h ago`;

    const diffDays = Math.floor(diffHours / 24);

    return `${ diffDays }d ago`;
};

const formatMonitorHistoryOccurrence = (occurredAtSeconds: number): string =>
{
    if(occurredAtSeconds <= 0) return '/';

    return new Date(occurredAtSeconds * 1000).toLocaleString('en-GB');
};

const formatVariableTimestamp = (timestamp: number): string =>
{
    if(!timestamp || (timestamp <= 0)) return '/';

    return new Date(timestamp * 1000).toLocaleString('en-GB');
};

const formatMonitorSource = (sourceLabel: string, sourceId: number): string =>
{
    const normalizedLabel = (sourceLabel || '').trim();

    if(!normalizedLabel && !(sourceId > 0)) return 'Room monitor';
    if(sourceId > 0) return `${ normalizedLabel || 'wired' } (#${ sourceId })`;

    return normalizedLabel;
};

const normalizeMonitorReason = (reason: string): string =>
{
    const normalizedReason = (reason || '').trim();

    return normalizedReason || 'No detailed reason was recorded for this entry.';
};

export const WiredCreatorToolsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<WiredToolsTab>('monitor');
    const [ inspectionType, setInspectionType ] = useState<InspectionElementType>('furni');
    const [ variablesType, setVariablesType ] = useState<VariablesElementType>('furni');
    const [ keepSelected, setKeepSelected ] = useState(false);
    const [ selectedFurni, setSelectedFurni ] = useState<InspectionFurniSelection>(null);
    const [ selectedFurniLiveState, setSelectedFurniLiveState ] = useState<InspectionFurniLiveState>(null);
    const [ selectedUser, setSelectedUser ] = useState<InspectionUserSelection>(null);
    const [ selectedUserLiveState, setSelectedUserLiveState ] = useState<InspectionUserLiveState>(null);
    const [ selectedUserActionVersion, setSelectedUserActionVersion ] = useState(0);
    const [ globalClock, setGlobalClock ] = useState(Date.now());
    const [ roomEnteredAt, setRoomEnteredAt ] = useState(Date.now());
    const [ monitorSnapshot, setMonitorSnapshot ] = useState<MonitorSnapshot>(() => createEmptyMonitorSnapshot());
    const [ selectedMonitorErrorType, setSelectedMonitorErrorType ] = useState<string>(null);
    const [ selectedMonitorLogDetails, setSelectedMonitorLogDetails ] = useState<MonitorLogDetails>(null);
    const [ isMonitorHistoryOpen, setIsMonitorHistoryOpen ] = useState(false);
    const [ isMonitorInfoOpen, setIsMonitorInfoOpen ] = useState(false);
    const [ monitorHistorySeverityFilter, setMonitorHistorySeverityFilter ] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
    const [ monitorHistoryTypeFilter, setMonitorHistoryTypeFilter ] = useState<string>('ALL');
    const [ editingVariable, setEditingVariable ] = useState<string>(null);
    const [ editingValue, setEditingValue ] = useState('');
    const [ selectedInspectionVariableKeys, setSelectedInspectionVariableKeys ] = useState<Record<InspectionElementType, string>>({
        furni: '',
        user: '',
        global: ''
    });
    const [ isInspectionGiveOpen, setIsInspectionGiveOpen ] = useState(false);
    const [ inspectionGiveVariableItemId, setInspectionGiveVariableItemId ] = useState(0);
    const [ inspectionGiveValue, setInspectionGiveValue ] = useState('0');
    const [ isVariableManageOpen, setIsVariableManageOpen ] = useState(false);
    const [ variableManageTypeFilter, setVariableManageTypeFilter ] = useState<string>('ALL');
    const [ variableManageSort, setVariableManageSort ] = useState<string>('highest_value');
    const [ variableManagePage, setVariableManagePage ] = useState(1);
    const [ selectedManagedVariableEntry, setSelectedManagedVariableEntry ] = useState<VariableManageEntry>(null);
    const [ selectedManagedHolderVariableId, setSelectedManagedHolderVariableId ] = useState(0);
    const [ editingManagedHolderVariableId, setEditingManagedHolderVariableId ] = useState(0);
    const [ editingManagedHolderValue, setEditingManagedHolderValue ] = useState('');
    const [ isManagedGiveOpen, setIsManagedGiveOpen ] = useState(false);
    const [ managedGiveVariableItemId, setManagedGiveVariableItemId ] = useState(0);
    const [ managedGiveValue, setManagedGiveValue ] = useState('0');
    const shouldPauseVariableSnapshotRefresh = (!!editingVariable || !!editingManagedHolderVariableId || isInspectionGiveOpen || isManagedGiveOpen);
    const [ selectedVariableKeys, setSelectedVariableKeys ] = useState<Record<VariablesElementType, string>>({
        furni: VARIABLE_DEFINITIONS.furni[0].key,
        user: VARIABLE_DEFINITIONS.user[0].key,
        global: VARIABLE_DEFINITIONS.global[0].key,
        context: VARIABLE_DEFINITIONS.context[0].key
    });
    const { roomSession = null } = useRoom();
    const { ownUser: tradeOwnUser = null, otherUser: tradeOtherUser = null, isTrading = false } = useInventoryTrade();
    const { roomSettings, userVariableDefinitions, userVariableAssignments, furniVariableDefinitions, furniVariableAssignments, roomVariableDefinitions, roomVariableAssignments, contextVariableDefinitions, requestUserVariables, assignUserVariable, removeUserVariable, updateUserVariableValue, assignFurniVariable, removeFurniVariable, updateFurniVariableValue, updateRoomVariableValue } = useWiredTools();
    const { simpleAlert = null } = useNotification();

    const getFurniLiveState = useCallback((objectId: number, category: number): InspectionFurniLiveState =>
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
    }, [ roomSession ]);

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

    const getRoomEntryMethodNumericValue = (value: string): number =>
    {
        switch((value || '').trim().toLowerCase())
        {
            case 'door': return 1;
            case 'teleport': return 2;
            case 'unknown':
            case '': return 0;
            default: return 3;
        }
    };

    const getTimeZoneOffsetMinutes = (epochMs: number, timeZone: string): number =>
    {
        try
        {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone,
                timeZoneName: 'shortOffset',
                hour: '2-digit',
                minute: '2-digit'
            });
            const timeZonePart = formatter.formatToParts(new Date(epochMs)).find(part => (part.type === 'timeZoneName'))?.value ?? 'GMT';
            const match = timeZonePart.match(/^GMT(?:(\+|-)(\d{1,2})(?::?(\d{2}))?)?$/i);

            if(!match?.[1]) return 0;

            const sign = (match[1] === '-') ? -1 : 1;
            const hours = parseInt(match[2] ?? '0', 10);
            const minutes = parseInt(match[3] ?? '0', 10);

            return (sign * ((hours * 60) + minutes));
        }
        catch
        {
            return 0;
        }
    };

    const getVariableAvailabilityLabel = (value: number, targetType: 'user' | 'furni' | 'global' | 'context'): string =>
    {
        if(targetType === 'context') return 'Current wired execution';

        if(value === 11)
        {
            const localizedValue = LocalizeText('wiredfurni.params.variables.availability.11');

            return ((localizedValue && (localizedValue !== 'wiredfurni.params.variables.availability.11')) ? localizedValue : 'Permanent, shared between rooms');
        }

        if(value === 10) return 'Permanent';

        return ((targetType === 'furni') || (targetType === 'global')) ? 'While the room is active' : 'While the user is in the room';
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

    const getUserLiveState = useCallback((roomIndex: number): InspectionUserLiveState =>
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
    }, [ roomSession ]);

    const refreshSelectedUser = useCallback((roomIndex: number = selectedUser?.roomIndex) =>
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
    }, [ getUserLiveState, roomSession, selectedUser?.roomIndex ]);

    const refreshSelectedFurni = useCallback((objectId: number = selectedFurni?.objectId, category: number = selectedFurni?.category) =>
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
    }, [ getFurniLiveState, selectedFurni?.category, selectedFurni?.objectId ]);

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

    useMessageEvent<WiredMonitorDataEvent>(WiredMonitorDataEvent, event =>
    {
        const parser = event.getParser();

        setMonitorSnapshot({
            usageCurrentWindow: Number(parser.usageCurrentWindow ?? 0),
            usageLimitPerWindow: Number(parser.usageLimitPerWindow ?? 0),
            isHeavy: !!parser.isHeavy,
            delayedEventsPending: Number(parser.delayedEventsPending ?? 0),
            delayedEventsLimit: Number(parser.delayedEventsLimit ?? 0),
            averageExecutionMs: Number(parser.averageExecutionMs ?? 0),
            peakExecutionMs: Number(parser.peakExecutionMs ?? 0),
            recursionDepthCurrent: Number(parser.recursionDepthCurrent ?? 0),
            recursionDepthLimit: Number(parser.recursionDepthLimit ?? 0),
            killedRemainingSeconds: Number(parser.killedRemainingSeconds ?? 0),
            usageWindowMs: Number(parser.usageWindowMs ?? 0),
            overloadAverageThresholdMs: Number(parser.overloadAverageThresholdMs ?? 0),
            overloadPeakThresholdMs: Number(parser.overloadPeakThresholdMs ?? 0),
            heavyUsageThresholdPercent: Number(parser.heavyUsageThresholdPercent ?? 0),
            heavyConsecutiveWindowsThreshold: Number(parser.heavyConsecutiveWindowsThreshold ?? 0),
            overloadConsecutiveWindowsThreshold: Number(parser.overloadConsecutiveWindowsThreshold ?? 0),
            heavyDelayedThresholdPercent: Number(parser.heavyDelayedThresholdPercent ?? 0),
            logs: [ ...(parser.logs ?? []) ],
            history: [ ...(parser.history ?? []) ]
        });
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
        }, WIRED_INSPECTION_REFRESH_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, inspectionType, selectedUser, roomSession ]);

    useEffect(() =>
    {
        const shouldTick = isVisible;

        if(!shouldTick) return;

        setGlobalClock(Date.now());

        const interval = window.setInterval(() => setGlobalClock(Date.now()), WIRED_CLOCK_REFRESH_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, activeTab, inspectionType, roomSession?.roomId ]);

    useEffect(() =>
    {
        if(!roomSession?.roomId) return;

        setRoomEnteredAt(Date.now());
    }, [ roomSession?.roomId ]);

    useEffect(() =>
    {
        setMonitorSnapshot(createEmptyMonitorSnapshot());
        setSelectedMonitorErrorType(null);
        setSelectedMonitorLogDetails(null);
        setIsMonitorHistoryOpen(false);
        setIsMonitorInfoOpen(false);
        setMonitorHistorySeverityFilter('ALL');
        setMonitorHistoryTypeFilter('ALL');
    }, [ roomSession?.roomId ]);

    useEffect(() =>
    {
        if(activeTab === 'monitor') return;

        setSelectedMonitorErrorType(null);
        setSelectedMonitorLogDetails(null);
        setIsMonitorHistoryOpen(false);
        setIsMonitorInfoOpen(false);
    }, [ activeTab ]);

    useEffect(() =>
    {
        if(selectedMonitorErrorType) return;

        setSelectedMonitorLogDetails(null);
    }, [ selectedMonitorErrorType ]);

    useEffect(() =>
    {
        if(!isVisible || (activeTab !== 'monitor') || !roomSession?.roomId) return;

        const requestSnapshot = () => SendMessageComposer(new WiredMonitorRequestComposer(WIRED_MONITOR_ACTION_FETCH));

        requestSnapshot();

        const interval = window.setInterval(requestSnapshot, WIRED_MONITOR_POLL_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, activeTab, roomSession?.roomId ]);

    useEffect(() =>
    {
        if(!isVisible || !roomSession?.roomId || !roomSettings.canInspect || shouldPauseVariableSnapshotRefresh) return;

        requestUserVariables();

        const interval = window.setInterval(requestUserVariables, WIRED_VARIABLES_POLL_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, roomSession?.roomId, roomSettings.canInspect, requestUserVariables, shouldPauseVariableSnapshotRefresh ]);

    useEffect(() =>
    {
        if(!isVisible || (activeTab !== 'inspection')) return;

        const refreshInspectionState = () =>
        {
            if((inspectionType === 'furni') && selectedFurni)
            {
                const nextLiveState = getFurniLiveState(selectedFurni.objectId, selectedFurni.category);

                setSelectedFurniLiveState(previousValue =>
                {
                    if((previousValue?.positionX === nextLiveState?.positionX)
                        && (previousValue?.positionY === nextLiveState?.positionY)
                        && (previousValue?.altitude === nextLiveState?.altitude)
                        && (previousValue?.rotation === nextLiveState?.rotation)
                        && (previousValue?.state === nextLiveState?.state)) return previousValue;

                    return nextLiveState;
                });

                return;
            }

            if((inspectionType === 'user') && selectedUser)
            {
                const nextLiveState = getUserLiveState(selectedUser.roomIndex);

                setSelectedUserLiveState(previousValue =>
                {
                    if((previousValue?.positionX === nextLiveState?.positionX)
                        && (previousValue?.positionY === nextLiveState?.positionY)
                        && (previousValue?.altitude === nextLiveState?.altitude)
                        && (previousValue?.direction === nextLiveState?.direction)) return previousValue;

                    return nextLiveState;
                });

                setSelectedUserActionVersion(previousValue => (previousValue + 1));
            }
        };

        refreshInspectionState();

        const interval = window.setInterval(refreshInspectionState, WIRED_INSPECTION_REFRESH_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, activeTab, inspectionType, selectedFurni, selectedUser, getFurniLiveState, getUserLiveState ]);

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
                        setActiveTab('monitor');
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue =>
                        {
                            const nextValue = !prevValue;

                            if(nextValue) setActiveTab('monitor');

                            return nextValue;
                        });
                        return;
                    case 'invalid':
                        if(simpleAlert) simpleAlert(LocalizeText('wiredmenu.invalid_room.desc'), NotificationAlertType.ALERT, null, null, LocalizeText('generic.alert.title'));
                        return;
                    case 'inspection':
                        if(parts.length > 3)
                        {
                            switch(parts[2])
                            {
                                case 'furni': {
                                    const objectId = parseInt(parts[3], 10);
                                    const category = parseInt(parts[4] ?? '-1', 10);

                                    if(Number.isInteger(objectId) && Number.isInteger(category))
                                    {
                                        setInspectionType('furni');
                                        refreshSelectedFurni(objectId, category);
                                        setActiveTab('inspection');
                                        setIsVisible(true);
                                    }
                                    return;
                                }
                                case 'user': {
                                    const roomIndex = parseInt(parts[3], 10);

                                    if(Number.isInteger(roomIndex))
                                    {
                                        setInspectionType('user');
                                        refreshSelectedUser(roomIndex);
                                        setActiveTab('inspection');
                                        setIsVisible(true);
                                    }
                                    return;
                                }
                            }
                        }
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
    }, [ refreshSelectedFurni, refreshSelectedUser, simpleAlert ]);

    useEffect(() =>
    {
        if(!isVisible || !roomSession?.roomId || !roomSettings.isLoaded || roomSettings.canInspect) return;

        setIsVisible(false);
    }, [ isVisible, roomSession?.roomId, roomSettings.isLoaded, roomSettings.canInspect ]);

    const selectedRoomObject = ((roomSession && selectedFurni)
        ? GetRoomEngine().getRoomObject(roomSession.roomId, selectedFurni.objectId, selectedFurni.category)
        : null);
    const selectedUserRoomObject = ((roomSession && selectedUser)
        ? GetRoomEngine().getRoomObject(roomSession.roomId, selectedUser.roomIndex, RoomObjectCategory.UNIT)
        : null);

    const currentTabLabel = useMemo(() => TABS.find(tab => tab.key === activeTab)?.label ?? 'Monitor', [ activeTab ]);
    const selectedMonitorErrorInfo = useMemo(() =>
    {
        if(!selectedMonitorErrorType) return null;

        return MONITOR_ERROR_INFO[selectedMonitorErrorType] ?? null;
    }, [ selectedMonitorErrorType ]);
    const monitorRoomStats = useMemo(() =>
    {
        if(!roomSession)
        {
            return {
                roomFurniCount: 0,
                roomItemLimit: 0,
                wallFurniCount: 0,
                permanentFurniVariables: 0
            };
        }

        const roomId = roomSession.roomId;
        const floorObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.FLOOR);
        const wallObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.WALL);

        return {
            roomFurniCount: (floorObjects.length + wallObjects.length),
            roomItemLimit: Number(roomSession.roomItemLimit ?? 0),
            wallFurniCount: wallObjects.length,
            permanentFurniVariables: [ ...floorObjects, ...wallObjects ].reduce((total, roomObject) =>
            {
                if(!roomObject) return total;

                const customVariables = roomObject.model.getValue<string[]>(RoomObjectVariable.FURNITURE_CUSTOM_VARIABLES);

                return (total + (customVariables?.length ?? 0));
            }, 0)
        };
    }, [ roomSession, globalClock ]);
    const selectedMonitorDetailSource = useMemo(() =>
    {
        if(!selectedMonitorLogDetails) return '';

        return formatMonitorSource(selectedMonitorLogDetails.sourceLabel, selectedMonitorLogDetails.sourceId);
    }, [ selectedMonitorLogDetails ]);
    const monitorHistoryTypeOptions = useMemo(() =>
    {
        return [ 'ALL', ...Array.from(new Set([ ...MONITOR_LOG_ORDER, ...monitorSnapshot.history.map(entry => entry.type) ])) ];
    }, [ monitorSnapshot.history ]);
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
                { label: 'Wired usage', value: '0/0' },
                { label: 'Is heavy', value: 'No' },
                { label: 'Room furni', value: '0/0' },
                { label: 'Wall furni', value: '0/0' },
                { label: 'Delayed events', value: '0/0' },
                { label: 'Average execution', value: '0ms' },
                { label: 'Peak execution', value: '0ms' },
                { label: 'Recursion', value: '0/0' },
                { label: 'Killed remaining', value: '0s' },
                { label: 'Permanent furni vars', value: '0/60' }
            ];
        }

        const roomFurniValue = (monitorRoomStats.roomItemLimit > 0) ? `${ monitorRoomStats.roomFurniCount }/${ monitorRoomStats.roomItemLimit }` : String(monitorRoomStats.roomFurniCount);
        const wallFurniValue = (monitorRoomStats.roomItemLimit > 0) ? `${ monitorRoomStats.wallFurniCount }/${ monitorRoomStats.roomItemLimit }` : String(monitorRoomStats.wallFurniCount);
        const usageValue = `${ monitorSnapshot.usageCurrentWindow }/${ Math.max(0, monitorSnapshot.usageLimitPerWindow) }`;
        const delayedValue = `${ monitorSnapshot.delayedEventsPending }/${ Math.max(0, monitorSnapshot.delayedEventsLimit) }`;

        return [
            { label: 'Wired usage', value: usageValue },
            { label: 'Is heavy', value: monitorSnapshot.isHeavy ? 'Yes' : 'No' },
            { label: 'Room furni', value: roomFurniValue },
            { label: 'Wall furni', value: wallFurniValue },
            { label: 'Delayed events', value: delayedValue },
            { label: 'Average execution', value: `${ monitorSnapshot.averageExecutionMs }ms` },
            { label: 'Peak execution', value: `${ monitorSnapshot.peakExecutionMs }ms` },
            { label: 'Recursion', value: `${ monitorSnapshot.recursionDepthCurrent }/${ Math.max(0, monitorSnapshot.recursionDepthLimit) }` },
            { label: 'Killed remaining', value: `${ Math.max(0, monitorSnapshot.killedRemainingSeconds) }s` },
            { label: 'Permanent furni vars', value: `${ monitorRoomStats.permanentFurniVariables }/60` }
        ];
    }, [ roomSession, monitorRoomStats, monitorSnapshot ]);
    const monitorLogs = useMemo<MonitorLog[]>(() =>
    {
        return MONITOR_LOG_ORDER.map(type =>
        {
            const log = monitorSnapshot.logs.find(entry => entry.type === type);
            const fallbackInfo = MONITOR_ERROR_INFO[type];
            const amount = Number(log?.amount ?? 0);

            return {
                type,
                category: String(log?.severity ?? fallbackInfo?.severity ?? 'ERROR'),
                amount: String(amount),
                latest: (amount > 0) ? formatMonitorLatestOccurrence(Number(log?.latestOccurrenceSeconds ?? 0), globalClock) : '/',
                latestReason: normalizeMonitorReason(log?.latestReason),
                latestSourceLabel: String(log?.latestSourceLabel ?? ''),
                latestSourceId: Number(log?.latestSourceId ?? 0)
            };
        });
    }, [ monitorSnapshot.logs, globalClock ]);
    const monitorHistoryRows = useMemo(() =>
    {
        return monitorSnapshot.history.map((entry, index) => ({
            id: `${ entry.type }-${ entry.occurredAtSeconds }-${ index }`,
            type: entry.type,
            category: entry.severity,
            occurredAt: formatMonitorHistoryOccurrence(Number(entry.occurredAtSeconds ?? 0)),
            occurredAtSeconds: Number(entry.occurredAtSeconds ?? 0),
            reason: normalizeMonitorReason(entry.reason),
            sourceLabel: String(entry.sourceLabel ?? ''),
            sourceId: Number(entry.sourceId ?? 0)
        }));
    }, [ monitorSnapshot.history ]);
    const filteredMonitorHistoryRows = useMemo(() =>
    {
        return monitorHistoryRows.filter(row =>
        {
            if((monitorHistorySeverityFilter !== 'ALL') && (row.category !== monitorHistorySeverityFilter)) return false;
            if((monitorHistoryTypeFilter !== 'ALL') && (row.type !== monitorHistoryTypeFilter)) return false;

            return true;
        });
    }, [ monitorHistoryRows, monitorHistorySeverityFilter, monitorHistoryTypeFilter ]);
    const monitorInfoSections = useMemo(() =>
    {
        return [
            {
                title: 'Wired usage',
                lines: [
                    `Current value: ${ monitorSnapshot.usageCurrentWindow }/${ Math.max(0, monitorSnapshot.usageLimitPerWindow) }`,
                    `This is the room execution budget used inside a ${ Math.max(0, monitorSnapshot.usageWindowMs) }ms server window.`,
                    'Each triggered stack consumes cost based on conditions, selectors, effects, delayed effects, and recursion depth.'
                ]
            },
            {
                title: 'Heavy / overload',
                lines: [
                    `Heavy warning starts when usage stays above ${ Math.max(0, monitorSnapshot.heavyUsageThresholdPercent) }% for ${ Math.max(0, monitorSnapshot.heavyConsecutiveWindowsThreshold) } consecutive window(s).`,
                    `Delayed pressure also contributes when the queue stays above ${ Math.max(0, monitorSnapshot.heavyDelayedThresholdPercent) }% of its limit.`,
                    `Overload is tracked from execution time and currently trips after ${ Math.max(0, monitorSnapshot.overloadConsecutiveWindowsThreshold) } consecutive overloaded window(s).`
                ]
            },
            {
                title: 'Execution times',
                lines: [
                    `Average execution: ${ monitorSnapshot.averageExecutionMs }ms (threshold ${ Math.max(0, monitorSnapshot.overloadAverageThresholdMs) }ms)`,
                    `Peak execution: ${ monitorSnapshot.peakExecutionMs }ms (threshold ${ Math.max(0, monitorSnapshot.overloadPeakThresholdMs) }ms)`,
                    'These values reset with each server usage window.'
                ]
            },
            {
                title: 'Other numbers',
                lines: [
                    `Delayed events: ${ monitorSnapshot.delayedEventsPending }/${ Math.max(0, monitorSnapshot.delayedEventsLimit) } pending scheduled execution(s).`,
                    `Recursion: ${ monitorSnapshot.recursionDepthCurrent }/${ Math.max(0, monitorSnapshot.recursionDepthLimit) } nested wired call(s).`,
                    `Killed remaining: ${ Math.max(0, monitorSnapshot.killedRemainingSeconds) } second(s) of room cooldown when protection has halted execution.`
                ]
            },
            {
                title: 'Room counters',
                lines: [
                    `Room furni: ${ monitorRoomStats.roomFurniCount }/${ Math.max(0, monitorRoomStats.roomItemLimit) || 0 }`,
                    `Wall furni: ${ monitorRoomStats.wallFurniCount }/${ Math.max(0, monitorRoomStats.roomItemLimit) || 0 }`,
                    `Permanent furni vars: ${ monitorRoomStats.permanentFurniVariables }/60 renderer-side custom variable entries currently attached to room items.`
                ]
            }
        ];
    }, [ monitorSnapshot, monitorRoomStats ]);
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
    const canEditInspection = roomSettings.canModify;
    const roomVariableAssignmentMap = useMemo(() =>
    {
        return new Map(roomVariableAssignments.map(assignment => [ assignment.variableItemId, assignment ]));
    }, [ roomVariableAssignments ]);
    const roomCustomVariableDefinitions = useMemo(() =>
    {
        return [ ...roomVariableDefinitions ]
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || (left.itemId - right.itemId));
    }, [ roomVariableDefinitions ]);
    const roomCustomVariableDefinitionMap = useMemo(() =>
    {
        return new Map(roomCustomVariableDefinitions.map(definition => [ definition.name, definition ]));
    }, [ roomCustomVariableDefinitions ]);
    const selectedFurniAssignments = useMemo(() =>
    {
        if(!selectedFurni) return [];

        return furniVariableAssignments[selectedFurni.objectId] ?? [];
    }, [ selectedFurni, furniVariableAssignments ]);
    const selectedFurniAssignmentMap = useMemo(() =>
    {
        return new Map(selectedFurniAssignments.map(assignment => [ assignment.variableItemId, assignment ]));
    }, [ selectedFurniAssignments ]);
    const selectedFurniCustomVariableDefinitions = useMemo(() =>
    {
        if(!selectedFurniAssignments.length) return [];

        return furniVariableDefinitions
            .filter(definition => selectedFurniAssignmentMap.has(definition.itemId))
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || (left.itemId - right.itemId));
    }, [ selectedFurniAssignments, selectedFurniAssignmentMap, furniVariableDefinitions ]);
    const selectedFurniCustomVariableDefinitionMap = useMemo(() =>
    {
        return new Map(selectedFurniCustomVariableDefinitions.map(definition => [ definition.name, definition ]));
    }, [ selectedFurniCustomVariableDefinitions ]);
    const furniVariables = useMemo(() =>
    {
        if(!selectedFurni || !selectedRoomObject) return [];

        const classId = selectedRoomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
        const tileSizeZ = Number(selectedFurnitureData?.tileSizeZ ?? 0);
        const liveState = selectedFurniLiveState ?? getFurniLiveState(selectedFurni.objectId, selectedFurni.category);

        const dynamicFlags: InspectionVariable[] = [];

        if(selectedFurni.info?.allowSit) dynamicFlags.push({ key: '@can_sit_on', value: '' });
        if(selectedFurni.info?.allowLay) dynamicFlags.push({ key: '@can_lay_on', value: '' });
        if(selectedFurni.info?.allowWalk) dynamicFlags.push({ key: '@can_stand_on', value: '' });
        if(selectedFurni.info?.allowStack) dynamicFlags.push({ key: '@is_stackable', value: '' });

        const customVariables: InspectionVariable[] = selectedFurniCustomVariableDefinitions.map(definition =>
        {
            const assignment = selectedFurniAssignmentMap.get(definition.itemId);

            return {
                key: definition.name,
                value: (definition.hasValue ? String(assignment?.value ?? 0) : ''),
                editable: (canEditInspection && definition.hasValue)
            };
        });

        const variables: InspectionVariable[] = [
            ...customVariables,
            ...((Number(selectedFurni.info?.teleportTargetId ?? 0) > 0)
                ? [ { key: '~teleport.target_id', value: String(selectedFurni.info.teleportTargetId) } ]
                : []),
            { key: '@id', value: String(selectedFurni.objectId) },
            { key: '@class_id', value: String(classId) },
            { key: '@height', value: String(Math.round(tileSizeZ * 100)) },
            { key: '@state', value: String(liveState?.state ?? 0), editable: canEditInspection },
            { key: '@position_x', value: String(liveState?.positionX ?? 0), editable: canEditInspection },
            { key: '@position_y', value: String(liveState?.positionY ?? 0), editable: canEditInspection },
            { key: '@rotation', value: String(liveState?.rotation ?? 0), editable: canEditInspection },
            { key: '@altitude', value: String(Math.round((liveState?.altitude ?? 0) * 100)), editable: canEditInspection },
            { key: '@is_invisible', value: '0' },
            ...(wallItemOffset ? [ { key: '@wallitem_offset', value: wallItemOffset, editable: canEditInspection } ] : []),
            { key: '@type', value: `${ selectedFurnitureData?.availableForBuildersClub ? 1 : 0 }${ selectedFurnitureData?.availableForBuildersClub ? ' (BC)' : ' (Normal)' }` },
            ...dynamicFlags,
            { key: '@dimensions.x', value: String(selectedFurni.info?.tileSizeX ?? 0) },
            { key: '@dimensions.y', value: String(selectedFurni.info?.tileSizeY ?? 0) },
            { key: '@owner_id', value: String(selectedFurni.info?.ownerId ?? 0) }
        ];

        return variables;
    }, [ selectedFurni, selectedFurniLiveState, selectedRoomObject, selectedFurnitureData, wallItemOffset, canEditInspection, selectedFurniCustomVariableDefinitions, selectedFurniAssignmentMap ]);
    const canEditSelectedUser = useMemo(() =>
    {
        return !!selectedUser && !!roomSession && roomSettings.canModify;
    }, [ selectedUser, roomSession, roomSettings.canModify ]);
    const selectedUserAssignments = useMemo(() =>
    {
        if(!selectedUser) return [];

        return userVariableAssignments[selectedUser.userId] ?? [];
    }, [ selectedUser, userVariableAssignments ]);
    const selectedUserAssignmentMap = useMemo(() =>
    {
        return new Map(selectedUserAssignments.map(assignment => [ assignment.variableItemId, assignment ]));
    }, [ selectedUserAssignments ]);
    const selectedUserCustomVariableDefinitions = useMemo(() =>
    {
        if(!selectedUserAssignments.length) return [];

        return userVariableDefinitions
            .filter(definition => selectedUserAssignmentMap.has(definition.itemId))
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || (left.itemId - right.itemId));
    }, [ selectedUserAssignments.length, selectedUserAssignmentMap, userVariableDefinitions ]);
    const selectedUserCustomVariableDefinitionMap = useMemo(() =>
    {
        return new Map(selectedUserCustomVariableDefinitions.map(definition => [ definition.name, definition ]));
    }, [ selectedUserCustomVariableDefinitions ]);
    const userVariables = useMemo(() =>
    {
        if(!selectedUser) return [];

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
        const petOwnerId = ((selectedUser.kind === 'pet') ? Number(roomSession?.userDataManager.getPetData(selectedUser.userId)?.ownerId ?? 0) : 0);
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
        if(isSelectedUserMuted) dynamicUserFlags.push({ key: '@is_muted', value: '' });
        if(isSelectedUserTrading) dynamicUserFlags.push({ key: '@is_trading', value: '' });
        if(WIRED_FREEZE_EFFECT_IDS.has(effectValue)) dynamicUserFlags.push({ key: '@is_frozen', value: '' });
        if(effectValue > 0) dynamicUserActions.push({ key: '@effect_id', value: `${ effectValue } (${ getEffectDisplayName(effectValue) })` });
        if(teamData) dynamicUserActions.push({ key: '@team_score', value: String(teamData.score) });
        if(teamData) dynamicUserActions.push({ key: '@team_color', value: `${ teamData.colorId } (${ getTeamColorDisplayName(teamData.colorId) })` });
        if(teamData) dynamicUserActions.push({ key: '@team_type', value: `${ teamData.typeId } (${ getTeamTypeDisplayName(teamData.typeId) })` });
        if(signValue >= 0) dynamicUserActions.push({ key: '@sign', value: `${ signValue } (${ getSignDisplayName(signValue) })` });
        if(danceValue > 0) dynamicUserActions.push({ key: '@dance', value: `${ danceValue } (${ getDanceDisplayName(danceValue) })` });
        if(expressionValue === AvatarExpressionEnum.IDLE.ordinal) dynamicUserActions.push({ key: '@is_idle', value: '' });
        if(handItemValue > 0) dynamicUserActions.push({ key: '@handitem_id', value: `${ handItemValue } (${ getHandItemDisplayName(handItemValue) })` });

        const customVariables: InspectionVariable[] = selectedUserCustomVariableDefinitions.map(definition =>
        {
            const assignment = selectedUserAssignmentMap.get(definition.itemId);

            return {
                key: definition.name,
                value: (definition.hasValue ? String(assignment?.value ?? 0) : ''),
                editable: (canEditSelectedUser && definition.hasValue)
            };
        });

        return [
            ...customVariables,
            { key: '@index', value: String(selectedUser.roomIndex) },
            { key: '@type', value: `${ (selectedUser.kind === 'user') ? 1 : ((selectedUser.kind === 'pet') ? 2 : 4) } (${ selectedUser.kind })` },
            { key: '@gender', value: `${ (selectedUser.gender === 'F') ? 1 : ((selectedUser.gender === 'M') ? 0 : -1) } (${ selectedUser.gender || 'U' })` },
            { key: '@level', value: String(currentControllerLevel) },
            { key: '@achievement_score', value: String(selectedUser.achievementScore ?? 0) },
            ...dynamicUserFlags,
            ...dynamicUserActions,
            { key: '@position_x', value: String(liveState?.positionX ?? 0), editable: canEditSelectedUser },
            { key: '@position_y', value: String(liveState?.positionY ?? 0), editable: canEditSelectedUser },
            { key: '@direction', value: String(liveState?.direction ?? 0), editable: canEditSelectedUser },
            { key: '@altitude', value: String(Math.round((liveState?.altitude ?? 0) * 100)) },
            ...((Number(selectedUser.favouriteGroupId ?? 0) > 0)
                ? [ { key: '@favourite_group_id', value: String(selectedUser.favouriteGroupId) } ]
                : []),
            ...((selectedUser.roomEntryMethod && (selectedUser.roomEntryMethod !== 'unknown'))
                ? [ { key: '@room_entry.method', value: `${ getRoomEntryMethodNumericValue(selectedUser.roomEntryMethod) } (${ selectedUser.roomEntryMethod })` } ]
                : []),
            ...(((selectedUser.roomEntryMethod === 'teleport') && (Number(selectedUser.roomEntryTeleportId ?? 0) > 0))
                ? [ { key: '@room_entry.teleport_id', value: String(selectedUser.roomEntryTeleportId) } ]
                : []),
            { key: identityKey, value: String(selectedUser.userId ?? 0) },
            ...((petOwnerId > 0)
                ? [ { key: '@pet_owner_id', value: String(petOwnerId) } ]
                : [])
        ];
    }, [ selectedUser, selectedUserLiveState, canEditSelectedUser, selectedUserRoomObject, selectedUserActionVersion, roomSession, isTrading, tradeOwnUser, tradeOtherUser, selectedUserCustomVariableDefinitions, selectedUserAssignmentMap ]);
    const globalVariables = useMemo(() =>
    {
        if(!roomSession) return [];

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
        const hotelTimeZoneOffsetMinutes = getTimeZoneOffsetMinutes(hotelCurrentTimeMs, hotelTimeZone);
        const clientTimeZoneOffsetMinutes = getTimeZoneOffsetMinutes(hotelCurrentTimeMs, clientTimeZone);
        const weekdayIndex = getMondayBasedWeekday(hotelNow);
        const monthIndex = hotelNow.month;
        const customVariables: InspectionVariable[] = roomCustomVariableDefinitions.map(definition =>
        {
            const assignment = roomVariableAssignmentMap.get(definition.itemId);

            return {
                key: definition.name,
                value: String(assignment?.value ?? 0),
                editable: canEditInspection
            };
        });

        return [
            ...customVariables,
            { key: '@furni_count', value: String(floorObjects.length + wallObjects.length) },
            { key: '@user_count', value: String(userCount) },
            { key: '@wired_timer', value: String(Math.max(0, Math.floor((globalClock - roomEnteredAt) / 500))) },
            { key: '@team_red_score', value: String(getRoomTeamScore(1)) },
            { key: '@team_green_score', value: String(getRoomTeamScore(2)) },
            { key: '@team_blue_score', value: String(getRoomTeamScore(3)) },
            { key: '@team_yellow_score', value: String(getRoomTeamScore(4)) },
            { key: '@team_red_size', value: String(teamSizes[1]) },
            { key: '@team_green_size', value: String(teamSizes[2]) },
            { key: '@team_blue_size', value: String(teamSizes[3]) },
            { key: '@team_yellow_size', value: String(teamSizes[4]) },
            { key: '@room_id', value: String(roomId) },
            { key: '@group_id', value: String(Number(roomSession.groupId ?? 0)) },
            { key: '@timezone_server', value: `${ hotelTimeZoneOffsetMinutes } (${ hotelTimeZone })` },
            { key: '@timezone_client', value: `${ clientTimeZoneOffsetMinutes } (${ clientTimeZone })` },
            { key: '@current_time', value: String(Math.floor(hotelCurrentTimeMs / 1000)) },
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
    }, [ roomSession, globalClock, roomEnteredAt, roomCustomVariableDefinitions, roomVariableAssignmentMap, canEditInspection ]);
    const displayedVariables = ((inspectionType === 'user')
        ? userVariables
        : ((inspectionType === 'global')
            ? globalVariables
            : furniVariables));
    const selectedInspectionVariableKey = (selectedInspectionVariableKeys[inspectionType] ?? '');
    const currentVariableMaps = useMemo(() => ({
        furni: new Map<string, InspectionVariable>(furniVariables.map(variable => [ variable.key, variable ])),
        user: new Map<string, InspectionVariable>(userVariables.map(variable => [ variable.key, variable ])),
        global: new Map<string, InspectionVariable>(globalVariables.map(variable => [ variable.key, variable ]))
    }), [ furniVariables, userVariables, globalVariables ]);
    const selectedInspectionCustomDefinition = useMemo(() =>
    {
        if(!selectedInspectionVariableKey) return null;

        switch(inspectionType)
        {
            case 'user':
                return (selectedUserCustomVariableDefinitionMap.get(selectedInspectionVariableKey) ?? null);
            case 'global':
                return (roomCustomVariableDefinitionMap.get(selectedInspectionVariableKey) ?? null);
            default:
                return (selectedFurniCustomVariableDefinitionMap.get(selectedInspectionVariableKey) ?? null);
        }
    }, [ inspectionType, selectedInspectionVariableKey, selectedUserCustomVariableDefinitionMap, roomCustomVariableDefinitionMap, selectedFurniCustomVariableDefinitionMap ]);
    const availableInspectionDefinitions = useMemo(() =>
    {
        if(inspectionType === 'global') return [];
        if((inspectionType === 'user') && !selectedUser) return [];
        if((inspectionType === 'furni') && !selectedFurni) return [];

        const definitions = ((inspectionType === 'user') ? userVariableDefinitions : furniVariableDefinitions);
        const assignments = ((inspectionType === 'user') ? selectedUserAssignments : selectedFurniAssignments);
        const assignedIds = new Set(assignments.map(assignment => assignment.variableItemId));

        return definitions
            .filter(definition => !assignedIds.has(definition.itemId) && !definition.isReadOnly)
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || (left.itemId - right.itemId));
    }, [ inspectionType, selectedUser, selectedFurni, userVariableDefinitions, furniVariableDefinitions, selectedUserAssignments, selectedFurniAssignments ]);
    const selectedInspectionGiveDefinition = useMemo(() =>
    {
        if(!availableInspectionDefinitions.length) return null;

        return (availableInspectionDefinitions.find(definition => (definition.itemId === inspectionGiveVariableItemId)) ?? availableInspectionDefinitions[0]);
    }, [ availableInspectionDefinitions, inspectionGiveVariableItemId ]);
    const canManageInspectionVariableAssignments = useMemo(() =>
    {
        if(!roomSettings.canModify) return false;

        if(inspectionType === 'user') return !!selectedUser;
        if(inspectionType === 'furni') return !!selectedFurni;

        return false;
    }, [ roomSettings.canModify, inspectionType, selectedUser, selectedFurni ]);
    const canRemoveInspectionVariable = (canManageInspectionVariableAssignments && !!selectedInspectionCustomDefinition && !selectedInspectionCustomDefinition.isReadOnly);
    const canGiveInspectionVariable = (canManageInspectionVariableAssignments && !!availableInspectionDefinitions.length);
    const variableDefinitionsByType = useMemo<Record<VariablesElementType, VariableDefinition[]>>(() =>
    {
        const customUserDefinitions: VariableDefinition[] = userVariableDefinitions
            .map(definition => ({
                key: definition.name,
                itemId: definition.itemId,
                target: 'User' as const,
                type: 'Custom',
                hasValue: definition.hasValue,
                isReadOnly: !!definition.isReadOnly,
                availability: getVariableAvailabilityLabel(definition.availability, 'user'),
                canWriteTo: (definition.hasValue && !definition.isReadOnly),
                canCreateDelete: false,
                canIntercept: false,
                hasCreationTime: true,
                hasUpdateTime: true,
                isTextConnected: definition.isTextConnected,
                isAlwaysAvailable: false
            }))
            .sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' }));
        const customFurniDefinitions: VariableDefinition[] = furniVariableDefinitions
            .map(definition => ({
                key: definition.name,
                itemId: definition.itemId,
                target: 'Furni' as const,
                type: 'Custom',
                hasValue: definition.hasValue,
                isReadOnly: !!definition.isReadOnly,
                availability: getVariableAvailabilityLabel(definition.availability, 'furni'),
                canWriteTo: (definition.hasValue && !definition.isReadOnly),
                canCreateDelete: false,
                canIntercept: false,
                hasCreationTime: true,
                hasUpdateTime: true,
                isTextConnected: definition.isTextConnected,
                isAlwaysAvailable: false
            }))
            .sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' }));
        const customRoomDefinitions: VariableDefinition[] = roomVariableDefinitions
            .map(definition => ({
                key: definition.name,
                itemId: definition.itemId,
                target: 'Global' as const,
                type: 'Custom',
                hasValue: definition.hasValue,
                isReadOnly: !!definition.isReadOnly,
                availability: getVariableAvailabilityLabel(definition.availability, 'global'),
                canWriteTo: !definition.isReadOnly,
                canCreateDelete: false,
                canIntercept: false,
                hasCreationTime: false,
                hasUpdateTime: true,
                isTextConnected: definition.isTextConnected,
                isAlwaysAvailable: false
            }))
            .sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' }));
        const customContextDefinitions: VariableDefinition[] = contextVariableDefinitions
            .map(definition => ({
                key: definition.name,
                itemId: definition.itemId,
                target: 'Context' as const,
                type: 'Custom',
                hasValue: definition.hasValue,
                isReadOnly: !!definition.isReadOnly,
                availability: getVariableAvailabilityLabel(definition.availability, 'context'),
                canWriteTo: (definition.hasValue && !definition.isReadOnly),
                canCreateDelete: true,
                canIntercept: !!definition.hasValue,
                hasCreationTime: true,
                hasUpdateTime: true,
                isTextConnected: definition.isTextConnected,
                isAlwaysAvailable: false
            }))
            .sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' }));

        return {
            furni: [ ...customFurniDefinitions, ...VARIABLE_DEFINITIONS.furni ],
            user: [ ...customUserDefinitions, ...VARIABLE_DEFINITIONS.user ],
            global: [ ...customRoomDefinitions, ...VARIABLE_DEFINITIONS.global ],
            context: [ ...customContextDefinitions, ...VARIABLE_DEFINITIONS.context ]
        };
    }, [ contextVariableDefinitions, userVariableDefinitions, furniVariableDefinitions, roomVariableDefinitions ]);
    const variablePickerDefinitions = variableDefinitionsByType[variablesType];

    useEffect(() =>
    {
        setSelectedVariableKeys(prevValue =>
        {
            let didChange = false;
            const nextValue = { ...prevValue };

            for(const type of [ 'furni', 'user', 'global', 'context' ] as VariablesElementType[])
            {
                const definitions = variableDefinitionsByType[type];

                if(!definitions.length)
                {
                    if(nextValue[type] !== '')
                    {
                        nextValue[type] = '';
                        didChange = true;
                    }

                    continue;
                }

                if(!definitions.some(definition => (definition.key === nextValue[type])))
                {
                    nextValue[type] = definitions[0].key;
                    didChange = true;
                }
            }

            return (didChange ? nextValue : prevValue);
        });
    }, [ variableDefinitionsByType ]);
    useEffect(() =>
    {
        setVariableManageTypeFilter('ALL');
        setVariableManageSort('highest_value');
        setVariableManagePage(1);
        setSelectedManagedVariableEntry(null);
    }, [ variablesType, selectedVariableKeys[variablesType] ]);
    useEffect(() =>
    {
        if(isVariableManageOpen) return;

        setSelectedManagedVariableEntry(null);
    }, [ isVariableManageOpen ]);

    const selectedVariableDefinition = useMemo(() =>
    {
        const selectedKey = selectedVariableKeys[variablesType];

        return (variablePickerDefinitions.find(variable => (variable.key === selectedKey)) ?? variablePickerDefinitions[0] ?? null);
    }, [ variablesType, selectedVariableKeys, variablePickerDefinitions ]);
    const selectedVariableHasInspectionValue = useMemo(() =>
    {
        if(!selectedVariableDefinition) return false;

        if(variablesType === 'context') return !!selectedVariableDefinition.hasValue;

        return currentVariableMaps[variablesType].has(selectedVariableDefinition.key);
    }, [ selectedVariableDefinition, currentVariableMaps, variablesType ]);
    const selectedVariableProperties = useMemo(() =>
    {
        if(!selectedVariableDefinition) return [];

        return [
            { key: 'Name', value: selectedVariableDefinition.key },
            { key: 'Type', value: selectedVariableDefinition.type },
            { key: 'Target', value: selectedVariableDefinition.target },
            { key: 'Availability', value: selectedVariableDefinition.availability },
            { key: 'Has value', value: (selectedVariableHasInspectionValue ? 'Yes' : 'No') },
            { key: 'Can write to', value: ((selectedVariableDefinition.canWriteTo && roomSettings.canModify) ? 'Yes' : 'No') },
            { key: 'Can create/delete', value: (selectedVariableDefinition.canCreateDelete ? 'Yes' : 'No') },
            { key: 'Can intercept', value: (selectedVariableDefinition.canIntercept ? 'Yes' : 'No') },
            { key: 'Is always available', value: (selectedVariableDefinition.isAlwaysAvailable ? 'Yes' : 'No') },
            { key: 'Has creation time', value: (selectedVariableDefinition.hasCreationTime ? 'Yes' : 'No') },
            { key: 'Has update time', value: (selectedVariableDefinition.hasUpdateTime ? 'Yes' : 'No') },
            { key: 'Is text connected', value: (selectedVariableDefinition.isTextConnected ? 'Yes' : 'No') }
        ];
    }, [ selectedVariableDefinition, selectedVariableHasInspectionValue, roomSettings.canModify ]);
    const selectedVariableTextValues = useMemo((): VariableTextValue[] =>
    {
        if(!selectedVariableDefinition) return [];

        const localization = GetLocalizationManager();
        const variableKey = selectedVariableDefinition.key;
        const textValues: VariableTextValue[] = [];
        const pushIfLocalized = (value: string, localizationKey: string, fallback: string = null) =>
        {
            if(localization?.hasValue(localizationKey))
            {
                textValues.push({ value, text: localization.getValue(localizationKey) });
                return;
            }

            if(fallback) textValues.push({ value, text: fallback });
        };

        switch(variableKey)
        {
            case '@gender':
                return [
                    { value: '-1', text: 'Unknown' },
                    { value: '0', text: 'M' },
                    { value: '1', text: 'F' }
                ];
            case '@type':
                if(variablesType === 'furni')
                {
                    return [
                        { value: '1', text: 'floor' },
                        { value: '2', text: 'wall' }
                    ];
                }

                if(variablesType === 'user')
                {
                    return [
                        { value: 'user', text: 'User' },
                        { value: 'bot', text: 'Bot' },
                        { value: 'rentable_bot', text: 'Rentable bot' },
                        { value: 'pet', text: 'Pet' }
                    ];
                }

                return [];
            case '@direction':
                return DIRECTION_NAMES.map((name, index) => ({ value: index.toString(), text: name }));
            case '@room_entry.method':
                return [
                    { value: 'door', text: 'Door' },
                    { value: 'teleport', text: 'Teleport' }
                ];
            case '@team_color':
                return [ 1, 2, 3, 4 ].map(value => ({
                    value: value.toString(),
                    text: getTeamColorDisplayName(value)
                }));
            case '@team_type':
                return [ 0, 1, 2 ].map(value => ({
                    value: value.toString(),
                    text: getTeamTypeDisplayName(value)
                }));
            case '@sign':
                for(let value = 0; value <= 17; value++)
                {
                    textValues.push({
                        value: value.toString(),
                        text: getSignDisplayName(value)
                    });
                }

                return textValues;
            case '@dance':
                pushIfLocalized('0', 'widget.memenu.dance.stop', 'Stop');

                for(let value = 1; value <= 4; value++)
                {
                    textValues.push({
                        value: value.toString(),
                        text: getDanceDisplayName(value)
                    });
                }

                return textValues;
            case '@handitem_id':
                for(let value = 1; value <= 5000; value++)
                {
                    const localizationKey = `handitem${ value }`;

                    if(!localization?.hasValue(localizationKey)) continue;

                    textValues.push({
                        value: value.toString(),
                        text: localization.getValue(localizationKey)
                    });
                }

                return textValues;
            case '@effect_id':
                for(let value = 1; value <= 500; value++)
                {
                    const localizationKey = `fx_${ value }`;

                    if(!localization?.hasValue(localizationKey)) continue;

                    textValues.push({
                        value: value.toString(),
                        text: localization.getValue(localizationKey)
                    });
                }

                return textValues;
            case '@current_time.day_of_week':
                return WEEKDAY_NAMES.map((name, index) => ({
                    value: (index + 1).toString(),
                    text: name
                }));
            case '@current_time.month_of_year':
                return MONTH_NAMES.map((name, index) => ({
                    value: (index + 1).toString(),
                    text: name
                }));
            case '@chat_type':
                return [
                    { value: '0', text: 'Talk' },
                    { value: '1', text: 'Shout' },
                    { value: '2', text: 'Whisper' }
                ];
            default:
                return [];
        }
    }, [ selectedVariableDefinition, variablesType ]);
    const variableManageEntries = useMemo((): VariableManageEntry[] =>
    {
        if(!selectedVariableDefinition?.itemId || (selectedVariableDefinition.type !== 'Custom') || !roomSession) return [];
        if(variablesType === 'context') return [];

        if(variablesType === 'user')
        {
            const entries: VariableManageEntry[] = [];

            for(const [ userIdString, assignments ] of Object.entries(userVariableAssignments))
            {
                const userId = Number(userIdString);
                const assignment = assignments.find(entry => (entry.variableItemId === selectedVariableDefinition.itemId));

                if(!assignment) continue;

                const userData = roomSession.userDataManager.getUserData(userId)
                    ?? roomSession.userDataManager.getBotData(userId)
                    ?? roomSession.userDataManager.getRentableBotData(userId)
                    ?? roomSession.userDataManager.getPetData(userId);

                let categoryLabel = 'Unknown';
                let entityName = `#${ userId }`;

                if(userData)
                {
                    entityName = userData.name || entityName;

                    switch(userData.type)
                    {
                        case RoomObjectType.USER:
                            categoryLabel = 'Habbo';
                            break;
                        case RoomObjectType.BOT:
                            categoryLabel = 'Bot';
                            break;
                        case RoomObjectType.RENTABLE_BOT:
                            categoryLabel = 'Rentable bot';
                            break;
                        case RoomObjectType.PET:
                            categoryLabel = 'Pet';
                            break;
                    }
                }

                entries.push({
                    entityId: userId,
                    entityName,
                    categoryLabel,
                    createdAt: Number(assignment.createdAt ?? 0),
                    updatedAt: Number(assignment.updatedAt ?? 0),
                    value: assignment.value,
                    manageLabel: 'Manage'
                });
            }

            return entries;
        }

        if(variablesType === 'furni')
        {
            const entries: VariableManageEntry[] = [];

            for(const [ furniIdString, assignments ] of Object.entries(furniVariableAssignments))
            {
                const furniId = Number(furniIdString);
                const assignment = assignments.find(entry => (entry.variableItemId === selectedVariableDefinition.itemId));

                if(!assignment) continue;

                const floorObject = GetRoomEngine().getRoomObject(roomSession.roomId, furniId, RoomObjectCategory.FLOOR);
                const wallObject = floorObject ? null : GetRoomEngine().getRoomObject(roomSession.roomId, furniId, RoomObjectCategory.WALL);
                const roomObject = floorObject ?? wallObject;
                const category = floorObject ? RoomObjectCategory.FLOOR : (wallObject ? RoomObjectCategory.WALL : -1);
                const typeId = roomObject?.model?.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
                const furnitureData = ((category === RoomObjectCategory.WALL) ? GetSessionDataManager().getWallItemData(typeId) : GetSessionDataManager().getFloorItemData(typeId));

                entries.push({
                    entityId: furniId,
                    entityName: furnitureData?.name || furnitureData?.className || `#${ furniId }`,
                    categoryLabel: (category === RoomObjectCategory.WALL) ? 'Wall furni' : 'Floor furni',
                    createdAt: Number(assignment.createdAt ?? 0),
                    updatedAt: Number(assignment.updatedAt ?? 0),
                    value: assignment.value,
                    manageLabel: 'Manage'
                });
            }

            return entries;
        }

        const assignment = roomVariableAssignmentMap.get(selectedVariableDefinition.itemId);

        return [ {
            entityId: roomSession.roomId,
            entityName: `Room #${ roomSession.roomId }`,
            categoryLabel: 'Global',
            createdAt: 0,
            updatedAt: Number(assignment?.updatedAt ?? 0),
            value: assignment?.value ?? 0,
            manageLabel: 'Manage'
        } ];
    }, [ selectedVariableDefinition, variablesType, roomSession, userVariableAssignments, furniVariableAssignments, roomVariableAssignmentMap ]);
    const variableManageTypeOptions = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'user':
                return [ 'ALL', 'Habbo', 'Bot', 'Rentable bot', 'Pet' ];
            case 'furni':
                return [ 'ALL', 'Floor furni', 'Wall furni' ];
            case 'context':
                return [ 'ALL', 'Execution' ];
            default:
                return [ 'ALL', 'Global' ];
        }
    }, [ variablesType ]);
    const filteredVariableManageEntries = useMemo(() =>
    {
        const filtered = variableManageEntries.filter(entry =>
        {
            if((variableManageTypeFilter !== 'ALL') && (entry.categoryLabel !== variableManageTypeFilter)) return false;

            return true;
        });

        filtered.sort((left, right) =>
        {
            switch(variableManageSort)
            {
                case 'lowest_value':
                    return Number(left.value ?? 0) - Number(right.value ?? 0);
                case 'newest_update':
                    return Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0);
                case 'oldest_update':
                    return Number(left.updatedAt ?? 0) - Number(right.updatedAt ?? 0);
                case 'newest_creation':
                    return Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0);
                case 'oldest_creation':
                    return Number(left.createdAt ?? 0) - Number(right.createdAt ?? 0);
                case 'name':
                    return left.entityName.localeCompare(right.entityName, undefined, { sensitivity: 'base' });
                default:
                    return Number(right.value ?? 0) - Number(left.value ?? 0);
            }
        });

        return filtered;
    }, [ variableManageEntries, variableManageTypeFilter, variableManageSort ]);
    const userVariableDefinitionsById = useMemo(() => new Map(userVariableDefinitions.map(definition => [ definition.itemId, definition ])), [ userVariableDefinitions ]);
    const furniVariableDefinitionsById = useMemo(() => new Map(furniVariableDefinitions.map(definition => [ definition.itemId, definition ])), [ furniVariableDefinitions ]);
    const managedHolderVariableEntries = useMemo((): ManagedHolderVariableEntry[] =>
    {
        if(!selectedManagedVariableEntry) return [];

        switch(variablesType)
        {
            case 'user':
                return [ ...(userVariableAssignments[selectedManagedVariableEntry.entityId] || []) ]
                    .map((assignment): ManagedHolderVariableEntry | null =>
                    {
                        const definition = userVariableDefinitionsById.get(assignment.variableItemId);

                        if(!definition) return null;

                        return {
                            variableItemId: assignment.variableItemId,
                            name: definition.name,
                            hasValue: definition.hasValue,
                            isReadOnly: !!definition.isReadOnly,
                            value: assignment.value,
                            availability: getVariableAvailabilityLabel(definition.availability, 'user'),
                            createdAt: Number(assignment.createdAt ?? 0),
                            updatedAt: Number(assignment.updatedAt ?? 0)
                        };
                    })
                    .filter((entry): entry is ManagedHolderVariableEntry => !!entry)
                    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
            case 'furni':
                return [ ...(furniVariableAssignments[selectedManagedVariableEntry.entityId] || []) ]
                    .map((assignment): ManagedHolderVariableEntry | null =>
                    {
                        const definition = furniVariableDefinitionsById.get(assignment.variableItemId);

                        if(!definition) return null;

                        return {
                            variableItemId: assignment.variableItemId,
                            name: definition.name,
                            hasValue: definition.hasValue,
                            isReadOnly: !!definition.isReadOnly,
                            value: assignment.value,
                            availability: getVariableAvailabilityLabel(definition.availability, 'furni'),
                            createdAt: Number(assignment.createdAt ?? 0),
                            updatedAt: Number(assignment.updatedAt ?? 0)
                        };
                    })
                    .filter((entry): entry is ManagedHolderVariableEntry => !!entry)
                    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
            case 'context':
                return [];
            default:
                return [ ...roomVariableDefinitions ]
                    .map(definition =>
                    {
                        const assignment = roomVariableAssignmentMap.get(definition.itemId);

                        return {
                            variableItemId: definition.itemId,
                            name: definition.name,
                            hasValue: definition.hasValue,
                            isReadOnly: !!definition.isReadOnly,
                            value: assignment?.value ?? 0,
                            availability: getVariableAvailabilityLabel(definition.availability, 'global'),
                            createdAt: 0,
                            updatedAt: Number(assignment?.updatedAt ?? 0)
                        };
                    })
                    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
        }
    }, [ selectedManagedVariableEntry, variablesType, userVariableAssignments, userVariableDefinitionsById, furniVariableAssignments, furniVariableDefinitionsById, roomVariableDefinitions, roomVariableAssignmentMap ]);
    const selectedManagedHolderVariableEntry = useMemo(() =>
    {
        if(!managedHolderVariableEntries.length) return null;

        return (managedHolderVariableEntries.find(entry => (entry.variableItemId === selectedManagedHolderVariableId)) ?? managedHolderVariableEntries[0]);
    }, [ managedHolderVariableEntries, selectedManagedHolderVariableId ]);
    const availableManagedHolderDefinitions = useMemo(() =>
    {
        if(!selectedManagedVariableEntry || (variablesType === 'global') || (variablesType === 'context')) return [];

        const assignedIds = new Set(managedHolderVariableEntries.map(entry => entry.variableItemId));
        const definitions = ((variablesType === 'user') ? userVariableDefinitions : furniVariableDefinitions);

        return definitions
            .filter(definition => !assignedIds.has(definition.itemId) && !definition.isReadOnly)
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
    }, [ selectedManagedVariableEntry, variablesType, managedHolderVariableEntries, userVariableDefinitions, furniVariableDefinitions ]);
    const selectedManagedGiveDefinition = useMemo(() =>
    {
        if(!availableManagedHolderDefinitions.length) return null;

        return (availableManagedHolderDefinitions.find(definition => (definition.itemId === managedGiveVariableItemId)) ?? availableManagedHolderDefinitions[0]);
    }, [ availableManagedHolderDefinitions, managedGiveVariableItemId ]);
    const variableManageTypeLabel = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'furni':
                return 'Furni type';
            case 'global':
                return 'Scope';
            case 'context':
                return 'Execution scope';
            default:
                return 'User type';
        }
    }, [ variablesType ]);
    const variableManageCategoryHeader = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'furni':
                return 'Furni type';
            case 'global':
                return 'Scope';
            case 'context':
                return 'Execution scope';
            default:
                return 'User type';
        }
    }, [ variablesType ]);
    const managedHolderPanelTitle = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'furni':
                return 'Manage Furni Variables';
            case 'global':
                return 'Manage Global Variables';
            case 'context':
                return 'Manage Context Variables';
            default:
                return 'Manage User Variables';
        }
    }, [ variablesType ]);
    const managedHolderInfoLines = useMemo(() =>
    {
        if(!selectedManagedVariableEntry || !roomSession) return [];

        if(variablesType === 'user')
        {
            const userData = roomSession.userDataManager.getUserData(selectedManagedVariableEntry.entityId)
                ?? roomSession.userDataManager.getBotData(selectedManagedVariableEntry.entityId)
                ?? roomSession.userDataManager.getRentableBotData(selectedManagedVariableEntry.entityId)
                ?? roomSession.userDataManager.getPetData(selectedManagedVariableEntry.entityId);

            return [
                `${ variableManageCategoryHeader }: ${ selectedManagedVariableEntry.categoryLabel }`,
                `Name: ${ selectedManagedVariableEntry.entityName }`,
                `User id: ${ selectedManagedVariableEntry.entityId }`,
                ...(userData?.type === RoomObjectType.PET ? [ `Pet level: ${ Number(userData.petLevel ?? 0) }` ] : [])
            ];
        }

        if(variablesType === 'furni')
        {
            return [
                `${ variableManageCategoryHeader }: ${ selectedManagedVariableEntry.categoryLabel }`,
                `Name: ${ selectedManagedVariableEntry.entityName }`,
                `Furni id: ${ selectedManagedVariableEntry.entityId }`
            ];
        }

        if(variablesType === 'context')
        {
            return [
                `${ variableManageCategoryHeader }: Current execution`,
                `Name: ${ selectedManagedVariableEntry.entityName }`,
                `Context id: ${ selectedManagedVariableEntry.entityId }`
            ];
        }

        return [
            `${ variableManageCategoryHeader }: Room`,
            `Name: Room #${ roomSession.roomId }`,
            `Room id: ${ roomSession.roomId }`
        ];
    }, [ selectedManagedVariableEntry, roomSession, variablesType, variableManageCategoryHeader ]);
    const managedHolderWarningText = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'furni':
                return 'Use this tool only for furni that are currently loaded in the room. Reload the panel after major room changes.';
            case 'global':
                return 'Global variables are room-scoped. Only the latest update time is tracked for these values.';
            case 'context':
                return 'Context variables only live inside the current wired execution. They are shared through the signal chain until a branch overrides them.';
            default:
                return 'Do not use this tool for users who are currently in the room/using the changed variable in another room.';
        }
    }, [ variablesType ]);
    const managedHolderUserData = useMemo(() =>
    {
        if((variablesType !== 'user') || !selectedManagedVariableEntry || !roomSession) return null;

        return roomSession.userDataManager.getUserData(selectedManagedVariableEntry.entityId)
            ?? roomSession.userDataManager.getBotData(selectedManagedVariableEntry.entityId)
            ?? roomSession.userDataManager.getRentableBotData(selectedManagedVariableEntry.entityId)
            ?? roomSession.userDataManager.getPetData(selectedManagedVariableEntry.entityId);
    }, [ variablesType, selectedManagedVariableEntry, roomSession ]);
    const managedHolderFurniCategory = useMemo(() =>
    {
        if((variablesType !== 'furni') || !selectedManagedVariableEntry) return RoomObjectCategory.FLOOR;

        return (selectedManagedVariableEntry.categoryLabel === 'Wall furni') ? RoomObjectCategory.WALL : RoomObjectCategory.FLOOR;
    }, [ variablesType, selectedManagedVariableEntry ]);
    const canManageHolderVariables = roomSettings.canModify && !!selectedManagedVariableEntry;
    const canRemoveManagedHolderVariable = canManageHolderVariables && (variablesType !== 'global') && (variablesType !== 'context') && !!selectedManagedHolderVariableEntry && !selectedManagedHolderVariableEntry.isReadOnly;
    const canGiveManagedHolderVariable = canManageHolderVariables && (variablesType !== 'global') && (variablesType !== 'context') && !!availableManagedHolderDefinitions.length;
    useEffect(() =>
    {
        if(!selectedManagedVariableEntry)
        {
            setSelectedManagedHolderVariableId(0);
            setEditingManagedHolderVariableId(0);
            setEditingManagedHolderValue('');
            setIsManagedGiveOpen(false);

            return;
        }

        setEditingManagedHolderVariableId(0);
        setEditingManagedHolderValue('');
        setIsManagedGiveOpen(false);
    }, [ selectedManagedVariableEntry ]);
    useEffect(() =>
    {
        if(!managedHolderVariableEntries.length)
        {
            setSelectedManagedHolderVariableId(0);
            return;
        }

        if(managedHolderVariableEntries.some(entry => (entry.variableItemId === selectedManagedHolderVariableId))) return;

        const preferredItemId = Number(selectedVariableDefinition?.itemId ?? 0);
        const preferredEntry = managedHolderVariableEntries.find(entry => (entry.variableItemId === preferredItemId));

        setSelectedManagedHolderVariableId(preferredEntry?.variableItemId ?? managedHolderVariableEntries[0].variableItemId);
    }, [ managedHolderVariableEntries, selectedManagedHolderVariableId, selectedVariableDefinition?.itemId ]);
    useEffect(() =>
    {
        if(!availableManagedHolderDefinitions.length)
        {
            setManagedGiveVariableItemId(0);
            return;
        }

        if(availableManagedHolderDefinitions.some(definition => (definition.itemId === managedGiveVariableItemId))) return;

        setManagedGiveVariableItemId(availableManagedHolderDefinitions[0].itemId);
    }, [ availableManagedHolderDefinitions, managedGiveVariableItemId ]);
    useEffect(() =>
    {
        if(!selectedManagedHolderVariableEntry || !editingManagedHolderVariableId) return;
        if(selectedManagedHolderVariableEntry.variableItemId !== editingManagedHolderVariableId) return;

        setEditingManagedHolderValue(String(selectedManagedHolderVariableEntry.value ?? 0));
    }, [ selectedManagedHolderVariableEntry, editingManagedHolderVariableId ]);
    const variableManageDescription = useMemo(() =>
    {
        switch(variablesType)
        {
            case 'furni':
                return 'This tool lists every furni in the room that currently holds the selected variable.';
            case 'global':
                return 'This tool shows the current room-level state for the selected global variable.';
            case 'context':
                return 'Context variables live only inside a wired execution. Use the Variables tab to inspect their definitions, text mappings and execution-only behavior.';
            default:
                return 'This tool lists every user in the room that currently holds the selected variable.';
        }
    }, [ variablesType ]);
    const variableManageSortOptions = useMemo(() =>
    {
        const options = [
            { value: 'highest_value', label: 'Highest value' },
            { value: 'lowest_value', label: 'Lowest value' },
            { value: 'newest_update', label: 'Most recently updated' },
            { value: 'oldest_update', label: 'Least recently updated' },
            { value: 'name', label: 'Name' }
        ];

        if(selectedVariableDefinition?.hasCreationTime)
        {
            options.splice(4, 0,
                { value: 'newest_creation', label: 'Newest creation' },
                { value: 'oldest_creation', label: 'Oldest creation' });
        }

        return options;
    }, [ selectedVariableDefinition?.hasCreationTime ]);
    const variableManagePageSize = 12;
    const variableManagePageCount = Math.max(1, Math.ceil(filteredVariableManageEntries.length / variableManagePageSize));
    const clampedVariableManagePage = Math.min(variableManagePage, variableManagePageCount);
    useEffect(() =>
    {
        if(variableManagePage <= variableManagePageCount) return;

        setVariableManagePage(variableManagePageCount);
    }, [ variableManagePage, variableManagePageCount ]);
    const pagedVariableManageEntries = useMemo(() =>
    {
        const startIndex = ((clampedVariableManagePage - 1) * variableManagePageSize);

        return filteredVariableManageEntries.slice(startIndex, (startIndex + variableManagePageSize));
    }, [ clampedVariableManagePage, filteredVariableManageEntries ]);
    const variableManageNoValueLabel = (selectedVariableDefinition?.hasValue ? '/' : 'Not supported');
    const variableManageCanOpen = !!selectedVariableDefinition && (selectedVariableDefinition.type === 'Custom') && (variablesType !== 'context');
    const commitManagedHolderValueEdit = useCallback(() =>
    {
        if(!selectedManagedVariableEntry || !selectedManagedHolderVariableEntry || !roomSettings.canModify || selectedManagedHolderVariableEntry.isReadOnly) return;
        if(!selectedManagedHolderVariableEntry.hasValue) return;
        if(variablesType === 'context') return;

        const parsedValue = Number(editingManagedHolderValue.trim());
        const nextValue = (Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0);

        switch(variablesType)
        {
            case 'user':
                updateUserVariableValue(selectedManagedVariableEntry.entityId, selectedManagedHolderVariableEntry.variableItemId, nextValue);
                break;
            case 'furni':
                updateFurniVariableValue(selectedManagedVariableEntry.entityId, selectedManagedHolderVariableEntry.variableItemId, nextValue);
                break;
            default:
                updateRoomVariableValue(selectedManagedHolderVariableEntry.variableItemId, nextValue);
                break;
        }

        setEditingManagedHolderVariableId(0);
    }, [ selectedManagedVariableEntry, selectedManagedHolderVariableEntry, roomSettings.canModify, editingManagedHolderValue, variablesType, updateUserVariableValue, updateFurniVariableValue, updateRoomVariableValue ]);
    const giveManagedHolderVariable = useCallback(() =>
    {
        if(!selectedManagedVariableEntry || !selectedManagedGiveDefinition || !roomSettings.canModify) return;
        if((variablesType === 'global') || (variablesType === 'context')) return;

        const parsedValue = Number(managedGiveValue.trim());
        const nextValue = (Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0);

        if(variablesType === 'user') assignUserVariable(selectedManagedVariableEntry.entityId, selectedManagedGiveDefinition.itemId, nextValue);
        else assignFurniVariable(selectedManagedVariableEntry.entityId, selectedManagedGiveDefinition.itemId, nextValue);

        setSelectedManagedHolderVariableId(selectedManagedGiveDefinition.itemId);
        setManagedGiveValue('0');
        setIsManagedGiveOpen(false);
    }, [ selectedManagedVariableEntry, selectedManagedGiveDefinition, roomSettings.canModify, variablesType, managedGiveValue, assignUserVariable, assignFurniVariable ]);
    const removeManagedHolderVariable = useCallback(() =>
    {
        if(!selectedManagedVariableEntry || !selectedManagedHolderVariableEntry || !roomSettings.canModify || selectedManagedHolderVariableEntry.isReadOnly) return;
        if((variablesType === 'global') || (variablesType === 'context')) return;

        if(variablesType === 'user') removeUserVariable(selectedManagedVariableEntry.entityId, selectedManagedHolderVariableEntry.variableItemId);
        else removeFurniVariable(selectedManagedVariableEntry.entityId, selectedManagedHolderVariableEntry.variableItemId);

        setEditingManagedHolderVariableId(0);
    }, [ selectedManagedVariableEntry, selectedManagedHolderVariableEntry, roomSettings.canModify, variablesType, removeUserVariable, removeFurniVariable ]);

    const clearMonitorLogs = () =>
    {
        setSelectedMonitorErrorType(null);
        setSelectedMonitorLogDetails(null);
        setIsMonitorHistoryOpen(false);
        setIsMonitorInfoOpen(false);
        SendMessageComposer(new WiredMonitorRequestComposer(WIRED_MONITOR_ACTION_CLEAR_LOGS));
    };

    const openMonitorLogDetails = (type: string, details: Partial<MonitorLogDetails>) =>
    {
        setSelectedMonitorErrorType(type);
        setSelectedMonitorLogDetails({
            type,
            severity: String(details.severity ?? MONITOR_ERROR_INFO[type]?.severity ?? 'ERROR'),
            reason: normalizeMonitorReason(details.reason),
            sourceLabel: String(details.sourceLabel ?? ''),
            sourceId: Number(details.sourceId ?? 0),
            amount: details.amount ? String(details.amount) : undefined,
            latest: details.latest ? String(details.latest) : undefined,
            occurredAt: details.occurredAt ? String(details.occurredAt) : undefined
        });
    };

    const beginVariableEdit = (variable: InspectionVariable) =>
    {
        if(!variable.editable) return;

        if((inspectionType === 'furni'))
        {
            const isEditableBuiltIn = EDITABLE_FURNI_VARIABLES.includes(variable.key);
            const customDefinition = selectedFurniCustomVariableDefinitionMap.get(variable.key);
            const isEditableCustom = !!customDefinition?.hasValue && !customDefinition?.isReadOnly;

            if(!isEditableBuiltIn && !isEditableCustom) return;
        }
        if((inspectionType === 'user'))
        {
            const isEditableBuiltIn = EDITABLE_USER_VARIABLES.includes(variable.key);
            const customDefinition = selectedUserCustomVariableDefinitionMap.get(variable.key);
            const isEditableCustom = !!customDefinition?.hasValue && !customDefinition?.isReadOnly;

            if(!isEditableBuiltIn && !isEditableCustom) return;
        }
        if(inspectionType === 'global')
        {
            const customDefinition = roomCustomVariableDefinitionMap.get(variable.key);
            const isEditableCustom = !!customDefinition && !customDefinition.isReadOnly;

            if(!isEditableCustom) return;
        }

        setEditingVariable(variable.key);
        setEditingValue(variable.value);
    };

    const commitVariableEdit = () =>
    {
        if(inspectionType === 'global')
        {
            const customDefinition = roomCustomVariableDefinitionMap.get(editingVariable);

            if(!customDefinition || customDefinition.isReadOnly)
            {
                cancelVariableEdit();
                return;
            }

            const parsed = parseInt(editingValue.trim(), 10);

            if(Number.isNaN(parsed))
            {
                cancelVariableEdit();
                return;
            }

            const currentValue = roomVariableAssignmentMap.get(customDefinition.itemId)?.value ?? 0;

            if(currentValue === parsed)
            {
                cancelVariableEdit();
                return;
            }

            updateRoomVariableValue(customDefinition.itemId, parsed);
            setEditingVariable(null);
            setEditingValue('');
            return;
        }

        if((inspectionType === 'user') && selectedUser)
        {
            const customDefinition = selectedUserCustomVariableDefinitionMap.get(editingVariable);

            if(customDefinition?.hasValue && !customDefinition.isReadOnly)
            {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    cancelVariableEdit();
                    return;
                }

                const assignment = selectedUserAssignmentMap.get(customDefinition.itemId);

                if(!assignment || (assignment.value === parsed))
                {
                    cancelVariableEdit();
                    return;
                }

                updateUserVariableValue(selectedUser.userId, customDefinition.itemId, parsed);
                setEditingVariable(null);
                setEditingValue('');
                return;
            }

            if(!roomSession)
            {
                cancelVariableEdit();
                return;
            }

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
                case '@position_x': {
                    const parsed = parseInt(editingValue.trim(), 10);

                    if(Number.isNaN(parsed))
                    {
                        isValid = false;
                        break;
                    }

                    nextX = parsed;
                    break;
                }
                case '@position_y': {
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

            SendMessageComposer(new WiredUserInspectMoveComposer(selectedUser.roomIndex, nextX, nextY, nextDirection));

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

        const customFurniDefinition = selectedFurniCustomVariableDefinitionMap.get(editingVariable);

        if(customFurniDefinition?.hasValue && !customFurniDefinition.isReadOnly)
        {
            const parsed = parseInt(editingValue.trim(), 10);

            if(Number.isNaN(parsed))
            {
                cancelVariableEdit();
                return;
            }

            const assignment = selectedFurniAssignmentMap.get(customFurniDefinition.itemId);

            if(!assignment || (assignment.value === parsed))
            {
                cancelVariableEdit();
                return;
            }

            updateFurniVariableValue(selectedFurni.objectId, customFurniDefinition.itemId, parsed);
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
                case '@position_x': {
                const parsed = parseInt(editingValue.trim(), 10);

                if(Number.isNaN(parsed))
                {
                    isValid = false;
                    break;
                }

                nextX = parsed;
                break;
            }
                case '@position_y': {
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
    const giveInspectionVariable = useCallback(() =>
    {
        if(!canManageInspectionVariableAssignments || !selectedInspectionGiveDefinition) return;

        const parsedValue = Number(inspectionGiveValue.trim());
        const nextValue = Number.isFinite(parsedValue) ? parsedValue : 0;

        if((inspectionType === 'user') && selectedUser)
        {
            assignUserVariable(selectedUser.userId, selectedInspectionGiveDefinition.itemId, nextValue);
            setSelectedInspectionVariableKeys(prev => ({ ...prev, user: selectedInspectionGiveDefinition.name }));
        }
        else if((inspectionType === 'furni') && selectedFurni)
        {
            assignFurniVariable(selectedFurni.objectId, selectedInspectionGiveDefinition.itemId, nextValue);
            setSelectedInspectionVariableKeys(prev => ({ ...prev, furni: selectedInspectionGiveDefinition.name }));
        }

        setInspectionGiveValue('0');
        setIsInspectionGiveOpen(false);
    }, [ canManageInspectionVariableAssignments, selectedInspectionGiveDefinition, inspectionGiveValue, inspectionType, selectedUser, assignUserVariable, selectedFurni, assignFurniVariable ]);
    const removeInspectionVariable = useCallback(() =>
    {
        if(!canManageInspectionVariableAssignments || !selectedInspectionCustomDefinition || selectedInspectionCustomDefinition.isReadOnly) return;

        cancelVariableEdit();

        if((inspectionType === 'user') && selectedUser)
        {
            removeUserVariable(selectedUser.userId, selectedInspectionCustomDefinition.itemId);
            setSelectedInspectionVariableKeys(prev => ({ ...prev, user: '' }));
        }
        else if((inspectionType === 'furni') && selectedFurni)
        {
            removeFurniVariable(selectedFurni.objectId, selectedInspectionCustomDefinition.itemId);
            setSelectedInspectionVariableKeys(prev => ({ ...prev, furni: '' }));
        }

        setIsInspectionGiveOpen(false);
    }, [ canManageInspectionVariableAssignments, selectedInspectionCustomDefinition, inspectionType, selectedUser, removeUserVariable, selectedFurni, removeFurniVariable ]);

    const onVariableInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        event.stopPropagation();

        switch(event.key)
        {
            case 'Enter':
            case 'NumpadEnter':
                event.preventDefault();
                commitVariableEdit();
                window.requestAnimationFrame(() => event.currentTarget.blur());
                return;
            case 'Escape':
                event.preventDefault();
                cancelVariableEdit();
                window.requestAnimationFrame(() => event.currentTarget.blur());
                return;
        }
    };
    const onManagedHolderValueInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        event.stopPropagation();

        switch(event.key)
        {
            case 'Enter':
            case 'NumpadEnter':
                event.preventDefault();
                commitManagedHolderValueEdit();
                window.requestAnimationFrame(() => event.currentTarget.blur());
                return;
            case 'Escape':
                event.preventDefault();
                setEditingManagedHolderVariableId(0);
                window.requestAnimationFrame(() => event.currentTarget.blur());
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
        if(!displayedVariables.length)
        {
            if(selectedInspectionVariableKey)
            {
                setSelectedInspectionVariableKeys(prev => ({ ...prev, [inspectionType]: '' }));
            }

            return;
        }

        if(displayedVariables.some(variable => (variable.key === selectedInspectionVariableKey))) return;

        setSelectedInspectionVariableKeys(prev => ({ ...prev, [inspectionType]: displayedVariables[0].key }));
    }, [ displayedVariables, inspectionType, selectedInspectionVariableKey ]);
    useEffect(() =>
    {
        if(!availableInspectionDefinitions.length)
        {
            setInspectionGiveVariableItemId(0);
            return;
        }

        if(availableInspectionDefinitions.some(definition => (definition.itemId === inspectionGiveVariableItemId))) return;

        setInspectionGiveVariableItemId(availableInspectionDefinitions[0].itemId);
    }, [ availableInspectionDefinitions, inspectionGiveVariableItemId ]);
    useEffect(() =>
    {
        setIsInspectionGiveOpen(false);
        setInspectionGiveValue('0');
    }, [ inspectionType, selectedUser?.userId, selectedFurni?.objectId ]);

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
        <>
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
                        <div className="p-3 flex flex-col gap-3 relative">
                            <div className="grid grid-cols-[190px_1fr] gap-3">
                                <div className="bg-white rounded border border-[#b9b3a5] p-2 flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Text bold>Statistics:</Text>
                                        <button className="rounded border border-[#7f7f7f] bg-[#ece9e1] px-2 py-[2px] text-[11px] text-[#333] hover:bg-[#e3ded2]" type="button" onClick={ () => setIsMonitorInfoOpen(true) }>Info</button>
                                    </div>
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
                                                <th className="text-left px-2 py-1">Severity</th>
                                                <th className="text-left px-2 py-1">Amount</th>
                                                <th className="text-left px-2 py-1">Latest occurrence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            { monitorLogs.map((log, index) => (
                                                <tr
                                                    key={ log.type }
                                                    className={ `${ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' } cursor-pointer hover:bg-[#e8eefc]` }
                                                    onClick={ () => openMonitorLogDetails(log.type, {
                                                        severity: log.category,
                                                        amount: log.amount,
                                                        latest: log.latest,
                                                        reason: log.latestReason,
                                                        sourceLabel: log.latestSourceLabel,
                                                        sourceId: log.latestSourceId
                                                    }) }>
                                                    <td className="px-2 py-1 text-[#1b57b2] underline-offset-2 hover:underline">{ log.type }</td>
                                                    <td className="px-2 py-1">{ log.category }</td>
                                                    <td className="px-2 py-1">{ log.amount }</td>
                                                    <td className="px-2 py-1">{ log.latest }</td>
                                                </tr>
                                            )) }
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <Button disabled={ !monitorHistoryRows.length && !monitorLogs.some(log => log.amount !== '0') } variant="danger" onClick={ clearMonitorLogs }>Clear all</Button>
                                    <Button disabled={ !monitorHistoryRows.length } variant="secondary" onClick={ () => setIsMonitorHistoryOpen(true) }>View full logs</Button>
                                </div>
                            </div>
                            { false && isMonitorHistoryOpen &&
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
                                    <div className="w-[760px] rounded border border-[#6b8ca0] overflow-hidden shadow-lg bg-[#f4efe3]">
                                        <div className="h-[32px] bg-[#3b8bb5] text-white flex items-center justify-between px-3">
                                            <Text bold>Wired Monitor Logs</Text>
                                            <button className="w-[20px] h-[20px] rounded bg-[#c9482e] text-white leading-none" type="button" onClick={ () => setIsMonitorHistoryOpen(false) }>×</button>
                                        </div>
                                        <div className="p-3 flex flex-col gap-3">
                                            <div className="flex flex-wrap items-center gap-2 text-[12px]">
                                                <span className="text-[#555]">Severity:</span>
                                                { [ 'ALL', 'WARNING', 'ERROR' ].map(severity => (
                                                    <button
                                                        key={ severity }
                                                        className={ `rounded border px-2 py-[2px] ${ (monitorHistorySeverityFilter === severity) ? 'border-[#4d7892] bg-[#dbeaf4] text-[#1a4d68]' : 'border-[#b8b2a4] bg-white text-[#555]' }` }
                                                        type="button"
                                                        onClick={ () => setMonitorHistorySeverityFilter(severity as 'ALL' | 'ERROR' | 'WARNING') }>
                                                        { severity }
                                                    </button>
                                                )) }
                                                <span className="ml-2 text-[#555]">Type:</span>
                                                <select
                                                    className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                                                    value={ monitorHistoryTypeFilter }
                                                    onChange={ event => setMonitorHistoryTypeFilter(event.target.value) }>
                                                    { monitorHistoryTypeOptions.map(type => (
                                                        <option key={ type } value={ type }>
                                                            { type }
                                                        </option>
                                                    )) }
                                                </select>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto border border-[#d1ccbf] rounded bg-white">
                                                <table className="w-full text-[12px]">
                                                    <thead className="bg-[#efede5] sticky top-0">
                                                        <tr>
                                                            <th className="text-left px-2 py-1">Type</th>
                                                            <th className="text-left px-2 py-1">Severity</th>
                                                            <th className="text-left px-2 py-1">Trigger</th>
                                                            <th className="text-left px-2 py-1">Motivation</th>
                                                            <th className="text-left px-2 py-1">Occurred at</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        { !filteredMonitorHistoryRows.length &&
                                                            <tr>
                                                                <td className="px-2 py-3 text-center text-[#8b8678]" colSpan={ 5 }>No log history for the current filters</td>
                                                            </tr> }
                                                        { filteredMonitorHistoryRows.map((row, index) => (
                                                            <tr
                                                                key={ row.id }
                                                                className={ `${ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' } cursor-pointer hover:bg-[#e8eefc]` }
                                                                onClick={ () => openMonitorLogDetails(row.type, {
                                                                    severity: row.category,
                                                                    occurredAt: row.occurredAt,
                                                                    reason: row.reason,
                                                                    sourceLabel: row.sourceLabel,
                                                                    sourceId: row.sourceId
                                                                }) }>
                                                                <td className="px-2 py-1 text-[#1b57b2]">{ row.type }</td>
                                                                <td className="px-2 py-1">{ row.category }</td>
                                                                <td className="px-2 py-1">{ formatMonitorSource(row.sourceLabel, row.sourceId) }</td>
                                                                <td className="px-2 py-1 text-[#555]">{ row.reason }</td>
                                                                <td className="px-2 py-1">{ row.occurredAt }</td>
                                                            </tr>
                                                        )) }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div> }
                            { false && isMonitorInfoOpen &&
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
                                    <div className="w-[560px] rounded border border-[#6b8ca0] overflow-hidden shadow-lg bg-[#f4efe3]">
                                        <div className="h-[32px] bg-[#3b8bb5] text-white flex items-center justify-between px-3">
                                            <Text bold>Wired Monitor Information</Text>
                                            <button className="w-[20px] h-[20px] rounded bg-[#c9482e] text-white leading-none" type="button" onClick={ () => setIsMonitorInfoOpen(false) }>Ã—</button>
                                        </div>
                                        <div className="p-4 flex flex-col gap-4 text-[12px] text-[#222]">
                                            { monitorInfoSections.map(section => (
                                                <div key={ section.title } className="flex flex-col gap-1">
                                                    <Text bold>{ section.title }</Text>
                                                    { section.lines.map((line, index) => (
                                                        <Text key={ `${ section.title }-${ index }` }>{ line }</Text>
                                                    )) }
                                                </div>
                                            )) }
                                        </div>
                                    </div>
                                </div> }
                            { false && !!selectedMonitorErrorInfo &&
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
                                    <div className="w-[470px] rounded border border-[#6b8ca0] overflow-hidden shadow-lg bg-[#f4efe3]">
                                        <div className="h-[32px] bg-[#3b8bb5] text-white flex items-center justify-between px-3">
                                            <Text bold>Wired Error Information</Text>
                                            <button className="w-[20px] h-[20px] rounded bg-[#c9482e] text-white leading-none" type="button" onClick={ () => setSelectedMonitorErrorType(null) }>×</button>
                                        </div>
                                        <div className="p-4 flex flex-col gap-3 text-[12px] text-[#222]">
                                            <div className="flex items-start justify-between gap-3">
                                                <Text bold>{ selectedMonitorErrorInfo.title }</Text>
                                                <span className={ `rounded px-2 py-[2px] text-[10px] font-semibold ${ ((selectedMonitorLogDetails?.severity ?? selectedMonitorErrorInfo.severity) === 'WARNING') ? 'bg-[#d4f0d0] text-[#2a6a24]' : 'bg-[#f6d7d7] text-[#8c2424]' }` }>
                                                    { selectedMonitorLogDetails?.severity ?? selectedMonitorErrorInfo.severity }
                                                </span>
                                            </div>
                                            { !!selectedMonitorLogDetails &&
                                                <div className="rounded border border-[#d8d2c3] bg-white/60 p-3 flex flex-col gap-1">
                                                    <Text><b>Trigger:</b> { selectedMonitorDetailSource }</Text>
                                                    <Text><b>Motivation:</b> { selectedMonitorLogDetails.reason }</Text>
                                                    { !!selectedMonitorLogDetails.amount && <Text><b>Amount:</b> { selectedMonitorLogDetails.amount }</Text> }
                                                    { !!selectedMonitorLogDetails.latest && <Text><b>Latest occurrence:</b> { selectedMonitorLogDetails.latest }</Text> }
                                                    { !!selectedMonitorLogDetails.occurredAt && <Text><b>Occurred at:</b> { selectedMonitorLogDetails.occurredAt }</Text> }
                                                </div> }
                                            { selectedMonitorErrorInfo.description.map((paragraph, index) => (
                                                <Text key={ index }>{ paragraph }</Text>
                                            )) }
                                        </div>
                                    </div>
                                </div> }
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
                                                <img alt={ element.label } className="w-auto h-auto max-w-[22px] max-h-[22px] object-contain" src={ element.icon } />
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
                                                                className={ `${ (selectedInspectionVariableKey === variable.key) ? 'bg-[#d7dfea]' : ((index % 2 === 0) ? 'bg-white' : 'bg-[#f3f3f3]') } ${ variable.editable ? 'cursor-pointer hover:bg-[#e8eefc]' : 'cursor-pointer' }` }
                                                                onClick={ () =>
                                                                {
                                                                    setSelectedInspectionVariableKeys(prev => ({ ...prev, [inspectionType]: variable.key }));
                                                                    beginVariableEdit(variable);
                                                                } }>
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
                                                                            onBlur={ cancelVariableEdit }
                                                                            onChange={ event => setEditingValue(event.target.value) }
                                                                            onKeyDownCapture={ onVariableInputKeyDown } /> }
                                                                    { (editingVariable !== variable.key) && !variable.editable && <span className={ variable.valueClassName }>{ variable.value }</span> }
                                                                            { (editingVariable !== variable.key) && variable.editable &&
                                                                        <button
                                                                            className={ `w-full cursor-pointer rounded px-1 text-right text-[#1b57b2] hover:underline ${ variable.valueClassName ?? '' }` }
                                                                            type="button"
                                                                            onClick={ event =>
                                                                            {
                                                                                event.stopPropagation();
                                                                                setSelectedInspectionVariableKeys(prev => ({ ...prev, [inspectionType]: variable.key }));
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
                                <div className="relative flex justify-between gap-2">
                                    { isInspectionGiveOpen &&
                                        <div className="absolute right-0 bottom-full mb-2 w-[210px] rounded border border-[#8d887a] bg-[#efede5] p-3 shadow-[0_2px_8px_rgba(0,0,0,.25)] z-10 flex flex-col gap-2">
                                            <Text bold>Variable:</Text>
                                            <select
                                                className="rounded border border-[#b8b2a4] bg-white px-2 py-[3px] text-[12px]"
                                                value={ selectedInspectionGiveDefinition?.itemId ?? 0 }
                                                onChange={ event => setInspectionGiveVariableItemId(Number(event.target.value)) }>
                                                { !availableInspectionDefinitions.length && <option value={ 0 }>No variables available</option> }
                                                { availableInspectionDefinitions.map(definition => (
                                                    <option key={ definition.itemId } value={ definition.itemId }>
                                                        { definition.name }
                                                    </option>
                                                )) }
                                            </select>
                                            <Text bold>Value:</Text>
                                            <input
                                                className="w-[96px] rounded border border-[#b8b2a4] bg-white px-2 py-[3px] text-[12px] disabled:opacity-60"
                                                disabled={ !selectedInspectionGiveDefinition?.hasValue }
                                                type="number"
                                                value={ inspectionGiveValue }
                                                onChange={ event => setInspectionGiveValue(event.target.value) } />
                                            <Button disabled={ !canGiveInspectionVariable } variant="secondary" onClick={ () => giveInspectionVariable() }>Create</Button>
                                        </div> }
                                    <Button disabled={ !canRemoveInspectionVariable } variant="secondary" onClick={ () => removeInspectionVariable() }>Remove variable</Button>
                                    <Button
                                        disabled={ !canGiveInspectionVariable }
                                        variant="secondary"
                                        onClick={ () => setIsInspectionGiveOpen(value => !value) }>
                                        Give variable
                                    </Button>
                                </div>
                            </div>
                        </div> }
                    { (activeTab === 'variables') &&
                        <div className="p-3 min-h-[360px] flex gap-4">
                            <div className="w-[205px] shrink-0 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <Text bold>Variable type:</Text>
                                    <div className="flex gap-1">
                                        { VARIABLES_ELEMENTS.map(element => (
                                            <button
                                                key={ element.key }
                                                type="button"
                                                className={ `w-[42px] h-[38px] rounded border flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,.7)] ${ element.disabled ? 'border-[#b7b7b7] bg-[#e7e3da] opacity-60 cursor-not-allowed' : ((variablesType === element.key) ? 'border-[#222] bg-[#d9d6cf]' : 'border-[#7f7f7f] bg-[#ece9e1]') }` }
                                                disabled={ element.disabled }
                                                onClick={ () => !element.disabled && setVariablesType(element.key) }
                                                title={ element.label }>
                                                <img alt={ element.label } className="w-auto h-auto max-w-[22px] max-h-[22px] object-contain" src={ element.icon } />
                                            </button>
                                        )) }
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 min-h-0 grow">
                                    <Text bold>Variable picker:</Text>
                                    <div className="grow rounded border border-[#bdb8ab] bg-white overflow-hidden">
                                        <div className="max-h-[408px] overflow-y-auto">
                                            <table className="w-full text-[12px]">
                                                <tbody>
                                                    { variablePickerDefinitions.map((variable, index) => (
                                                        <tr
                                                            key={ variable.key }
                                                            className={ `cursor-pointer ${ (selectedVariableDefinition?.key === variable.key) ? 'bg-[#d7dfea]' : ((index % 2 === 0) ? 'bg-white' : 'bg-[#f3f3f3]') } hover:bg-[#e8eefc]` }
                                                            onClick={ () => setSelectedVariableKeys(prev => ({ ...prev, [variablesType]: variable.key })) }>
                                                            <td className="px-3 py-1 text-[#444]">{ variable.key }</td>
                                                        </tr>
                                                    )) }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button disabled variant="secondary">Highlight</Button>
                                    <Button
                                        disabled={ !variableManageCanOpen }
                                        variant="secondary"
                                        onClick={ () =>
                                        {
                                            requestUserVariables();
                                            setVariableManagePage(1);
                                            setSelectedManagedVariableEntry(null);
                                            setIsVariableManageOpen(true);
                                        } }>
                                        Manage
                                    </Button>
                                </div>
                            </div>
                            <div className="min-w-0 grow flex flex-col gap-3">
                                { (variablesType === 'context') &&
                                    <div className="rounded border border-[#c8b98f] bg-[#fff7df] px-3 py-2 text-[12px] text-[#6a5d33]">
                                        Context variables live only during the current wired execution. This tab shows their definitions, text mappings and execution-scoped capabilities, but not live values from a running stack.
                                    </div> }
                                <div className="flex flex-col gap-1">
                                    <Text bold>Properties:</Text>
                                    <div className="rounded border border-[#bdb8ab] bg-white overflow-hidden">
                                        <div className="grid grid-cols-[1fr_120px] border-b border-[#d8d4c8] bg-[#f5f2ea] px-3 py-2 text-[12px] font-bold text-[#333]">
                                            <span>Property</span>
                                            <span>Value</span>
                                        </div>
                                        <div className="max-h-[210px] overflow-y-auto">
                                            <table className="w-full text-[12px]">
                                                <tbody>
                                                    { selectedVariableProperties.map((property, index) => (
                                                        <tr key={ property.key } className={ (index % 2 === 0) ? 'bg-white' : 'bg-[#f3f3f3]' }>
                                                            <td className="px-3 py-1 text-[#444]">{ property.key }</td>
                                                            <td className="px-3 py-1 text-[#222]">{ property.value }</td>
                                                        </tr>
                                                    )) }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 min-h-0 grow">
                                    <Text bold>Text values:</Text>
                                    <div className="grow rounded border border-[#bdb8ab] bg-white overflow-hidden">
                                        <div className="grid grid-cols-[120px_1fr] border-b border-[#d8d4c8] bg-[#f5f2ea] px-3 py-2 text-[12px] font-bold text-[#333]">
                                            <span>Value</span>
                                            <span>Text</span>
                                        </div>
                                        { !selectedVariableTextValues.length &&
                                            <div className="h-[calc(100%-37px)] flex items-center justify-center text-[#b1aca2] text-[20px]">
                                                <Text>Nothing to display</Text>
                                            </div> }
                                        { !!selectedVariableTextValues.length &&
                                            <div className="max-h-[178px] overflow-y-auto">
                                                <table className="w-full text-[12px]">
                                                    <tbody>
                                                        { selectedVariableTextValues.map((entry, index) => (
                                                            <tr key={ `${ entry.value }-${ index }` } className={ (index % 2 === 0) ? 'bg-white' : 'bg-[#f3f3f3]' }>
                                                                <td className="px-3 py-1 text-[#444]">{ entry.value }</td>
                                                                <td className="px-3 py-1 text-[#222]">{ entry.text }</td>
                                                            </tr>
                                                        )) }
                                                    </tbody>
                                                </table>
                                            </div> }
                                    </div>
                                </div>
                            </div>
                        </div> }
                    { (activeTab === 'settings') && <WiredToolsSettingsTabView /> }
                    { (activeTab !== 'monitor') &&
                      (activeTab !== 'inspection') &&
                      (activeTab !== 'variables') &&
                      (activeTab !== 'settings') &&
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
        { isMonitorHistoryOpen &&
            <NitroCardView className="min-w-[760px] max-w-[760px] max-h-[520px]" theme="primary-slim" uniqueKey="wired-monitor-history" windowPosition={ DraggableWindowPosition.TOP_LEFT } offsetLeft={ 560 } offsetTop={ 40 }>
                <NitroCardHeaderView headerText="Wired Monitor Logs" onCloseClick={ () => setIsMonitorHistoryOpen(false) } />
                <NitroCardContentView className="text-black bg-[#f4efe3] p-3 flex flex-col gap-3" overflow="hidden">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="text-[#555]">Severity:</span>
                        { [ 'ALL', 'WARNING', 'ERROR' ].map(severity => (
                            <button
                                key={ severity }
                                className={ `rounded border px-2 py-[2px] ${ (monitorHistorySeverityFilter === severity) ? 'border-[#4d7892] bg-[#dbeaf4] text-[#1a4d68]' : 'border-[#b8b2a4] bg-white text-[#555]' }` }
                                type="button"
                                onClick={ () => setMonitorHistorySeverityFilter(severity as 'ALL' | 'ERROR' | 'WARNING') }>
                                { severity }
                            </button>
                        )) }
                        <span className="ml-2 text-[#555]">Type:</span>
                        <select
                            className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                            value={ monitorHistoryTypeFilter }
                            onChange={ event => setMonitorHistoryTypeFilter(event.target.value) }>
                            { monitorHistoryTypeOptions.map(type => (
                                <option key={ type } value={ type }>
                                    { type }
                                </option>
                            )) }
                        </select>
                    </div>
                    <div className="grow overflow-y-auto border border-[#d1ccbf] rounded bg-white">
                        <table className="w-full text-[12px]">
                            <thead className="bg-[#efede5] sticky top-0">
                                <tr>
                                    <th className="text-left px-2 py-1">Type</th>
                                    <th className="text-left px-2 py-1">Severity</th>
                                    <th className="text-left px-2 py-1">Trigger</th>
                                    <th className="text-left px-2 py-1">Motivation</th>
                                    <th className="text-left px-2 py-1">Occurred at</th>
                                </tr>
                            </thead>
                            <tbody>
                                { !filteredMonitorHistoryRows.length &&
                                    <tr>
                                        <td className="px-2 py-3 text-center text-[#8b8678]" colSpan={ 5 }>No log history for the current filters</td>
                                    </tr> }
                                { filteredMonitorHistoryRows.map((row, index) => (
                                    <tr
                                        key={ row.id }
                                        className={ `${ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' } cursor-pointer hover:bg-[#e8eefc]` }
                                        onClick={ () => openMonitorLogDetails(row.type, {
                                            severity: row.category,
                                            occurredAt: row.occurredAt,
                                            reason: row.reason,
                                            sourceLabel: row.sourceLabel,
                                            sourceId: row.sourceId
                                        }) }>
                                        <td className="px-2 py-1 text-[#1b57b2]">{ row.type }</td>
                                        <td className="px-2 py-1">{ row.category }</td>
                                        <td className="px-2 py-1">{ formatMonitorSource(row.sourceLabel, row.sourceId) }</td>
                                        <td className="px-2 py-1 text-[#555]">{ row.reason }</td>
                                        <td className="px-2 py-1">{ row.occurredAt }</td>
                                    </tr>
                                )) }
                            </tbody>
                        </table>
                    </div>
                </NitroCardContentView>
            </NitroCardView> }
        { isMonitorInfoOpen &&
            <NitroCardView className="min-w-[560px] max-w-[560px] max-h-[520px]" theme="primary-slim" uniqueKey="wired-monitor-info" windowPosition={ DraggableWindowPosition.TOP_LEFT } offsetLeft={ 610 } offsetTop={ 80 }>
                <NitroCardHeaderView headerText="Wired Monitor Information" onCloseClick={ () => setIsMonitorInfoOpen(false) } />
                <NitroCardContentView className="text-black bg-[#f4efe3] p-4 flex flex-col gap-4 overflow-y-auto">
                    { monitorInfoSections.map(section => (
                        <div key={ section.title } className="flex flex-col gap-1">
                            <Text bold>{ section.title }</Text>
                            { section.lines.map((line, index) => (
                                <Text key={ `${ section.title }-${ index }` }>{ line }</Text>
                            )) }
                        </div>
                    )) }
                </NitroCardContentView>
            </NitroCardView> }
        { isVariableManageOpen && !!selectedVariableDefinition &&
            <NitroCardView className="min-w-[860px] max-w-[860px] max-h-[620px]" theme="primary-slim" uniqueKey="wired-variable-management" windowPosition={ DraggableWindowPosition.TOP_LEFT } offsetLeft={ 540 } offsetTop={ 60 }>
                <NitroCardHeaderView headerText="Variable Management" onCloseClick={ () => setIsVariableManageOpen(false) } />
                <NitroCardContentView className="text-black bg-[#f4efe3] p-3 flex flex-col gap-3" overflow="hidden">
                    <div className="rounded border border-[#c8c2b2] bg-white p-3 flex items-center justify-between gap-3">
                        <div className="grow flex flex-col items-center text-center">
                            <Text>{ variableManageDescription }</Text>
                            <Text><b>Variable name:</b> { selectedVariableDefinition.key }</Text>
                        </div>
                        <Button variant="secondary" onClick={ () => requestUserVariables() }>Refresh</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[12px]">
                        <div className="flex items-center gap-2">
                            <Text>{ variableManageTypeLabel }:</Text>
                            <select
                                className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                                value={ variableManageTypeFilter }
                                onChange={ event =>
                                {
                                    setVariableManageTypeFilter(event.target.value);
                                    setVariableManagePage(1);
                                } }>
                                { variableManageTypeOptions.map(type => (
                                    <option key={ type } value={ type }>
                                        { (type === 'ALL')
                                            ? ((variablesType === 'global') ? 'All entries' : 'All types')
                                            : type }
                                    </option>
                                )) }
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Text>Sort by:</Text>
                            <select
                                className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                                value={ variableManageSort }
                                onChange={ event =>
                                {
                                    setVariableManageSort(event.target.value);
                                    setVariableManagePage(1);
                                } }>
                                { variableManageSortOptions.map(option => (
                                    <option key={ option.value } value={ option.value }>
                                        { option.label }
                                    </option>
                                )) }
                            </select>
                        </div>
                    </div>
                    <div className="grow overflow-y-auto border border-[#d1ccbf] rounded bg-white">
                        <table className="w-full text-[12px]">
                            <thead className="bg-[#efede5] sticky top-0">
                                <tr>
                                    <th className="text-left px-2 py-1">{ variableManageCategoryHeader }</th>
                                    <th className="text-left px-2 py-1">Name</th>
                                    { !!selectedVariableDefinition.hasCreationTime && <th className="text-left px-2 py-1">Creation time</th> }
                                    { !!selectedVariableDefinition.hasUpdateTime && <th className="text-left px-2 py-1">Last update time</th> }
                                    <th className="text-left px-2 py-1">Value</th>
                                    <th className="text-left px-2 py-1">Manage</th>
                                </tr>
                            </thead>
                            <tbody>
                                { !pagedVariableManageEntries.length &&
                                    <tr>
                                        <td className="px-2 py-3 text-center text-[#8b8678]" colSpan={ (selectedVariableDefinition.hasCreationTime ? 6 : 5) }>No entries found for the current filters</td>
                                    </tr> }
                                { pagedVariableManageEntries.map((entry, index) => (
                                    <tr key={ `${ entry.entityId }-${ index }` } className={ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' }>
                                        <td className="px-2 py-1">{ entry.categoryLabel }</td>
                                        <td className="px-2 py-1 text-[#1b57b2] underline underline-offset-2">{ entry.entityName }</td>
                                        { !!selectedVariableDefinition.hasCreationTime && <td className="px-2 py-1">{ formatVariableTimestamp(entry.createdAt) }</td> }
                                        { !!selectedVariableDefinition.hasUpdateTime && <td className="px-2 py-1">{ formatVariableTimestamp(entry.updatedAt) }</td> }
                                        <td className="px-2 py-1">{ (entry.value ?? variableManageNoValueLabel) }</td>
                                        <td className="px-2 py-1">
                                            <button
                                                className="text-[#1b57b2] underline underline-offset-2"
                                                type="button"
                                                onClick={ () => setSelectedManagedVariableEntry(entry) }>
                                                { entry.manageLabel }
                                            </button>
                                        </td>
                                    </tr>
                                )) }
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                            <button
                                className="min-w-[36px] rounded border border-[#b8b2a4] bg-white px-2 py-1 text-[12px] disabled:opacity-40"
                                disabled={ clampedVariableManagePage <= 1 }
                                type="button"
                                onClick={ () => setVariableManagePage(1) }>
                                &laquo;
                            </button>
                            <button
                                className="min-w-[36px] rounded border border-[#b8b2a4] bg-white px-2 py-1 text-[12px] disabled:opacity-40"
                                disabled={ clampedVariableManagePage <= 1 }
                                type="button"
                                onClick={ () => setVariableManagePage(value => Math.max(1, (value - 1))) }>
                                &lsaquo;
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#555]">
                            <span>{ `${ filteredVariableManageEntries.length } entr${ (filteredVariableManageEntries.length === 1) ? 'y' : 'ies' } found. Showing page` }</span>
                            <input
                                className="w-[42px] rounded border border-[#b8b2a4] bg-white px-1 py-[2px] text-center text-[12px]"
                                type="number"
                                min={ 1 }
                                max={ variableManagePageCount }
                                value={ clampedVariableManagePage }
                                onChange={ event =>
                                {
                                    const nextPage = Number(event.target.value || 1);

                                    setVariableManagePage(Math.min(variableManagePageCount, Math.max(1, nextPage)));
                                } } />
                            <span>{ `of ${ variableManagePageCount }` }</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="min-w-[36px] rounded border border-[#b8b2a4] bg-white px-2 py-1 text-[12px] disabled:opacity-40"
                                disabled={ clampedVariableManagePage >= variableManagePageCount }
                                type="button"
                                onClick={ () => setVariableManagePage(value => Math.min(variableManagePageCount, (value + 1))) }>
                                &rsaquo;
                            </button>
                            <button
                                className="min-w-[36px] rounded border border-[#b8b2a4] bg-white px-2 py-1 text-[12px] disabled:opacity-40"
                                disabled={ clampedVariableManagePage >= variableManagePageCount }
                                type="button"
                                onClick={ () => setVariableManagePage(variableManagePageCount) }>
                                &raquo;
                            </button>
                        </div>
                        </div>
                </NitroCardContentView>
            </NitroCardView> }
        { !!selectedManagedVariableEntry && !!selectedVariableDefinition &&
            <NitroCardView className="min-w-[430px] max-w-[430px] max-h-[620px]" theme="primary-slim" uniqueKey="wired-variable-management-entry" windowPosition={ DraggableWindowPosition.TOP_LEFT } offsetLeft={ 890 } offsetTop={ 110 }>
                <NitroCardHeaderView headerText={ managedHolderPanelTitle } onCloseClick={ () => setSelectedManagedVariableEntry(null) } />
                <NitroCardContentView className="text-black bg-[#f4efe3] p-3 flex flex-col gap-3 relative" overflow="hidden">
                    <div className="rounded border border-[#c8c2b2] bg-white p-3 flex items-center justify-between gap-3">
                        <div className="grow text-center">
                            <Text>{ managedHolderWarningText }</Text>
                        </div>
                        <Button variant="secondary" onClick={ () => requestUserVariables() }>Refresh</Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Text bold>Holder info:</Text>
                        <div className="flex gap-4">
                            <div className="w-[140px] h-[110px] rounded border border-[#d8d2c3] bg-[#dedede] flex items-center justify-center overflow-hidden">
                                { (variablesType === 'furni') && roomSession &&
                                    <LayoutRoomObjectImageView category={ managedHolderFurniCategory } objectId={ selectedManagedVariableEntry.entityId } roomId={ roomSession.roomId } /> }
                                { (variablesType === 'user') && managedHolderUserData &&
                                    <>
                                        { (managedHolderUserData.type === RoomObjectType.PET)
                                            ? <LayoutPetImageView direction={ 2 } figure={ managedHolderUserData.figure } />
                                            : <LayoutAvatarImageView direction={ 2 } figure={ managedHolderUserData.figure } /> }
                                    </> }
                                { (variablesType === 'global') &&
                                    <img alt="Global placeholder" className="max-w-full max-h-full object-contain p-3" src={ wiredGlobalPlaceholderImage } /> }
                            </div>
                            <div className="grow rounded border border-[#d8d2c3] bg-white p-3 flex flex-col gap-1 text-[12px]">
                                { managedHolderInfoLines.map((line, index) => (
                                    <Text key={ `${ line }-${ index }` }>{ line }</Text>
                                )) }
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 min-h-0 grow">
                        <Text bold>{ (variablesType === 'global') ? 'Room variables:' : 'Assigned variables:' }</Text>
                        <div className="grow rounded border border-[#d1ccbf] bg-white overflow-y-auto">
                            <table className="w-full text-[12px]">
                                <thead className="bg-[#efede5] sticky top-0">
                                    <tr>
                                        <th className="text-left px-2 py-1">Variable</th>
                                        <th className="text-left px-2 py-1">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { !managedHolderVariableEntries.length &&
                                        <tr>
                                            <td className="px-2 py-3 text-center text-[#8b8678]" colSpan={ 2 }>No variables currently assigned</td>
                                        </tr> }
                                    { managedHolderVariableEntries.map((entry, index) =>
                                    {
                                        const isSelected = (selectedManagedHolderVariableEntry?.variableItemId === entry.variableItemId);
                                        const isEditing = (editingManagedHolderVariableId === entry.variableItemId);

                                        return (
                                            <tr
                                                key={ entry.variableItemId }
                                                className={ `${ isSelected ? 'bg-[#d7dfea]' : ((index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]') } cursor-pointer hover:bg-[#e8eefc]` }
                                                onClick={ () => setSelectedManagedHolderVariableId(entry.variableItemId) }>
                                                <td className="px-2 py-1">
                                                    <div className="flex flex-col">
                                                        <span>{ entry.name }</span>
                                                        <span className="text-[10px] text-[#8a8476]">{ entry.availability }</span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    { !entry.hasValue && <span className="text-[#8a8476]">/</span> }
                                                    { !!entry.hasValue && !isEditing &&
                                                        <button
                                                            className={ `rounded px-1 py-[1px] ${ (roomSettings.canModify && !entry.isReadOnly) ? 'text-[#1b57b2] underline underline-offset-2' : 'text-[#222]' }` }
                                                            disabled={ !roomSettings.canModify || entry.isReadOnly }
                                                            type="button"
                                                            onClick={ event =>
                                                            {
                                                                event.stopPropagation();

                                                                if(!roomSettings.canModify || entry.isReadOnly) return;

                                                                setSelectedManagedHolderVariableId(entry.variableItemId);
                                                                setEditingManagedHolderVariableId(entry.variableItemId);
                                                                setEditingManagedHolderValue(String(entry.value ?? 0));
                                                            } }>
                                                            { entry.value ?? 0 }
                                                        </button> }
                                                    { !!entry.hasValue && isEditing &&
                                                        <input
                                                            autoFocus
                                                            className="w-[72px] rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                                                            type="number"
                                                            value={ editingManagedHolderValue }
                                                            onBlur={ () => setEditingManagedHolderVariableId(0) }
                                                            onChange={ event => setEditingManagedHolderValue(event.target.value) }
                                                            onClick={ event => event.stopPropagation() }
                                                            onKeyDownCapture={ onManagedHolderValueInputKeyDown } /> }
                                                </td>
                                            </tr>
                                        );
                                    }) }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="relative flex items-center justify-between gap-3 pt-1">
                        { isManagedGiveOpen &&
                            <div className="absolute right-0 bottom-full mb-2 w-[210px] rounded border border-[#8d887a] bg-[#efede5] p-3 shadow-[0_2px_8px_rgba(0,0,0,.25)] z-10 flex flex-col gap-2">
                                <Text bold>Variable:</Text>
                                <select
                                    className="rounded border border-[#b8b2a4] bg-white px-2 py-[3px] text-[12px]"
                                    value={ selectedManagedGiveDefinition?.itemId ?? 0 }
                                    onChange={ event => setManagedGiveVariableItemId(Number(event.target.value)) }>
                                    { !availableManagedHolderDefinitions.length && <option value={ 0 }>No variables available</option> }
                                    { availableManagedHolderDefinitions.map(definition => (
                                        <option key={ definition.itemId } value={ definition.itemId }>
                                            { definition.name }
                                        </option>
                                    )) }
                                </select>
                                <Text bold>Value:</Text>
                                <input
                                    className="w-[96px] rounded border border-[#b8b2a4] bg-white px-2 py-[3px] text-[12px] disabled:opacity-60"
                                    disabled={ !selectedManagedGiveDefinition?.hasValue }
                                    type="number"
                                    value={ managedGiveValue }
                                    onChange={ event => setManagedGiveValue(event.target.value) } />
                                <Button disabled={ !canGiveManagedHolderVariable } variant="secondary" onClick={ () => giveManagedHolderVariable() }>Create</Button>
                            </div> }
                        <Button disabled={ !canRemoveManagedHolderVariable } variant="secondary" onClick={ () => removeManagedHolderVariable() }>Remove variable</Button>
                        <Button
                            disabled={ !canGiveManagedHolderVariable }
                            variant="secondary"
                            onClick={ () => setIsManagedGiveOpen(value => !value) }>
                            Give variable
                        </Button>
                    </div>
                </NitroCardContentView>
            </NitroCardView> }
        { !!selectedMonitorErrorInfo &&
            <NitroCardView className="min-w-[470px] max-w-[470px] max-h-[500px]" theme="primary-slim" uniqueKey="wired-monitor-error-info" windowPosition={ DraggableWindowPosition.TOP_LEFT } offsetLeft={ 660 } offsetTop={ 120 }>
                <NitroCardHeaderView
                    headerText="Wired Error Information"
                    onCloseClick={ () =>
                    {
                        setSelectedMonitorErrorType(null);
                        setSelectedMonitorLogDetails(null);
                    } } />
                <NitroCardContentView className="text-black bg-[#f4efe3] p-4 flex flex-col gap-3 overflow-y-auto">
                    <div className="flex items-start justify-between gap-3">
                        <Text bold>{ selectedMonitorErrorInfo.title }</Text>
                        <span className={ `rounded px-2 py-[2px] text-[10px] font-semibold ${ ((selectedMonitorLogDetails?.severity ?? selectedMonitorErrorInfo.severity) === 'WARNING') ? 'bg-[#d4f0d0] text-[#2a6a24]' : 'bg-[#f6d7d7] text-[#8c2424]' }` }>
                            { selectedMonitorLogDetails?.severity ?? selectedMonitorErrorInfo.severity }
                        </span>
                    </div>
                    { !!selectedMonitorLogDetails &&
                        <div className="rounded border border-[#d8d2c3] bg-white/60 p-3 flex flex-col gap-1">
                            <Text><b>Trigger:</b> { selectedMonitorDetailSource }</Text>
                            <Text><b>Motivation:</b> { selectedMonitorLogDetails.reason }</Text>
                            { !!selectedMonitorLogDetails.amount && <Text><b>Amount:</b> { selectedMonitorLogDetails.amount }</Text> }
                            { !!selectedMonitorLogDetails.latest && <Text><b>Latest occurrence:</b> { selectedMonitorLogDetails.latest }</Text> }
                            { !!selectedMonitorLogDetails.occurredAt && <Text><b>Occurred at:</b> { selectedMonitorLogDetails.occurredAt }</Text> }
                        </div> }
                    { selectedMonitorErrorInfo.description.map((paragraph, index) => (
                        <Text key={ index }>{ paragraph }</Text>
                    )) }
                </NitroCardContentView>
            </NitroCardView> }
        </>
    );
};
