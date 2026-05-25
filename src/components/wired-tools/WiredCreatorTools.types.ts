import type { AvatarInfoFurni } from '../../api';

export type WiredToolsTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';
export type InspectionElementType = 'furni' | 'user' | 'global';
export type VariablesElementType = InspectionElementType | 'context';

export interface InspectionElementButton
{
    key: InspectionElementType;
    label: string;
    icon: string;
}

export interface VariablesElementButton
{
    key: VariablesElementType;
    label: string;
    icon: string;
    disabled?: boolean;
}

export interface InspectionFurniSelection
{
    objectId: number;
    category: number;
    info: AvatarInfoFurni;
}

export interface InspectionFurniLiveState
{
    positionX: number;
    positionY: number;
    altitude: number;
    rotation: number;
    state: number;
}

export interface InspectionUserSelection
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

export interface InspectionUserLiveState
{
    positionX: number;
    positionY: number;
    altitude: number;
    direction: number;
}

export interface MonitorStat
{
    label: string;
    value: string;
}

export interface MonitorLog
{
    type: string;
    category: string;
    amount: string;
    latest: string;
    latestReason: string;
    latestSourceId: number;
    latestSourceLabel: string;
}

export interface MonitorSnapshot
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

export interface MonitorLogDetails
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

export interface InspectionVariable
{
    key: string;
    value: string;
    editable?: boolean;
    valueClassName?: string;
}

export interface VariableDefinition
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

export interface VariableTextValue
{
    value: string;
    text: string;
}

export interface VariableManageEntry
{
    categoryLabel: string;
    createdAt: number;
    entityId: number;
    entityName: string;
    manageLabel: string;
    updatedAt: number;
    value: number | null;
}

export interface VariableHighlightTarget
{
    category: number;
    hasValue: boolean;
    objectId: number;
    value: number | null;
}

export interface VariableHighlightOverlay extends VariableHighlightTarget
{
    key: string;
    x: number;
    y: number;
}

export interface ManagedHolderVariableEntry
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

export interface InspectionUserTeamData
{
    colorId: number;
    typeId: number;
    score: number;
}

export interface TeamEffectData
{
    colorId: number;
    typeId: number;
}

export interface ParsedWallLocation
{
    width: number;
    height: number;
    localX: number;
    localY: number;
    direction: string;
}

export interface HotelDateTimeParts
{
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}
