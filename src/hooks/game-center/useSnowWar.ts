import {
    SnowWarCreateSnowballComposer,
    SnowWarEditRoomComposer,
    SnowWarExitGameComposer,
    SnowWarFullGameStatusEvent,
    SnowWarGameChatComposer,
    SnowWarGameEndedEvent,
    SnowWarGameStatusEvent,
    SnowWarGamesInformationEvent,
    SnowWarGamesLeftEvent,
    SnowWarGenericErrorEvent,
    SnowWarInitArenaEvent,
    SnowWarJoinQueueComposer,
    SnowWarLeaveQueueComposer,
    SnowWarLevelDataEvent,
    SnowWarLoadStageReadyComposer,
    SnowWarOnGameEndingEvent,
    SnowWarOnStageEndingEvent,
    SnowWarOnStageRunningEvent,
    SnowWarOnStageStartEvent,
    SnowWarPlayAgainComposer,
    SnowWarPlayerExitedArenaEvent,
    SnowWarQueuePositionEvent,
    SnowWarRejoinPreviousRoomEvent,
    SnowWarRequestFullGameStatusComposer,
    SnowWarSaveEditorComposer,
    SnowWarStartLobbyCounterEvent,
    SnowWarThrowAtLocationComposer,
    SnowWarThrowAtPlayerComposer,
    SnowWarUserChatEvent,
    SnowWarUserRematchedEvent,
    SnowWarWalkComposer,
} from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { SnowWarSimEvent, SnowWarSimulation } from '../../api/snowwar';
import { useMessageEvent } from '../events';

export type SnowWarPhase =
    | 'idle'
    | 'queued'
    | 'lobby'
    | 'loading'
    | 'preparing'
    | 'playing'
    | 'ending'
    | 'results';

export interface SnowWarLevelState {
    gameLengthSeconds: number;
    canEditRoom: boolean;
    mapId: number;
    teamCount: number;
    heightmapRows: string[];
    items: { name: string; x: number; y: number; rotation: number; imageUrl: string; offsetZ: number }[];
    machines: { objectId: number; x: number; y: number }[];
    players: { objectId: number; userId: number; teamId: number; name: string; figure: string; gender: string }[];
}

export interface SnowWarResultsState {
    secondsToResults: number;
    teams: {
        teamId: number;
        score: number;
        players: { userId: number; name: string; score: number }[];
    }[];
}

export interface SnowWarChatMessage {
    id: number;
    objectId: number;
    name: string;
    message: string;
    receivedAt: number;
}

// One shared world per session — the arena view reads it every animation frame.
const SNOWWAR_SIMULATION = new SnowWarSimulation();

let CHAT_MESSAGE_ID = 0;

export const GetSnowWarSimulation = (): SnowWarSimulation => SNOWWAR_SIMULATION;

/** Map a parsed subturn event onto the simulation's positional event shape. */
const toSimEvent = (event: {
    eventType: number;
    objectId: number;
    throwerObjectId: number;
    targetObjectId: number;
    targetX: number;
    targetY: number;
    trajectory: number;
    direction: number;
    machineObjectId: number;
    avatarObjectId: number;
}): SnowWarSimEvent =>
{
    switch (event.eventType)
    {
        case 2: return { type: 2, p1: event.objectId, p2: event.targetX, p3: event.targetY, p4: 0, p5: 0 };
        case 3: return { type: 3, p1: event.objectId, p2: 0, p3: 0, p4: 0, p5: 0 };
        case 4: return {
            type: 4,
            p1: event.objectId,
            p2: event.throwerObjectId,
            p3: event.targetX,
            p4: event.targetY,
            p5: event.trajectory,
        };
        case 5: return { type: 5, p1: event.throwerObjectId, p2: event.targetObjectId, p3: event.direction, p4: 0, p5: 0 };
        case 6: return { type: 6, p1: event.machineObjectId, p2: 0, p3: 0, p4: 0, p5: 0 };
        case 7: return { type: 7, p1: event.avatarObjectId, p2: event.machineObjectId, p3: 0, p4: 0, p5: 0 };
        case 8: return { type: 8, p1: event.objectId, p2: 0, p3: 0, p4: 0, p5: 0 };
        case 9: return { type: 9, p1: event.targetObjectId, p2: event.throwerObjectId, p3: event.direction, p4: 0, p5: 0 };
        default: return { type: event.eventType, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
    }
};

const useSnowWarState = () =>
{
    const [phase, setPhase] = useState<SnowWarPhase>('idle');
    const [queuePosition, setQueuePosition] = useState(0);
    const [queueSize, setQueueSize] = useState(0);
    const [lobbySeconds, setLobbySeconds] = useState(0);
    const [preparingSeconds, setPreparingSeconds] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [levelData, setLevelData] = useState<SnowWarLevelState>(null);
    const [results, setResults] = useState<SnowWarResultsState>(null);
    const [chatMessages, setChatMessages] = useState<SnowWarChatMessage[]>([]);
    const [rematchedUserIds, setRematchedUserIds] = useState<number[]>([]);
    const [errorCode, setErrorCode] = useState<number>(null);
    const [gamesLeft, setGamesLeft] = useState(-1);
    const [queueInfo, setQueueInfo] = useState<{ playersInQueue: number; gamesPlayed: number }>(null);
    // In-arena WYSIWYG editor: the client edits the current level snapshot and
    // publishes it with the save packet. editingRef mirrors it for the stable
    // packet callbacks (which capture [] deps).
    const [editing, setEditing] = useState(false);
    const editingRef = useRef(false);

    const resetToIdle = useCallback(() =>
    {
        SNOWWAR_SIMULATION.reset();
        editingRef.current = false;
        setEditing(false);
        setPhase('idle');
        setQueuePosition(0);
        setQueueSize(0);
        setLobbySeconds(0);
        setPreparingSeconds(0);
        setSecondsLeft(0);
        setLevelData(null);
        setResults(null);
        setChatMessages([]);
        setRematchedUserIds([]);
    }, []);

    // Lobby / preparing / game-clock countdowns tick locally between server
    // packets; the server value (lobby broadcasts, 5024 stage-running, 5016
    // full status) overwrites the local tick whenever it arrives.
    const lobbyTicking = (phase === 'lobby') && (lobbySeconds > 0);
    const preparingTicking = (phase === 'preparing') && (preparingSeconds > 0);
    const clockTicking = (phase === 'playing') && (secondsLeft > 0);

    useEffect(() =>
    {
        if (!lobbyTicking) return;
        const interval = setInterval(() => setLobbySeconds(seconds => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(interval);
    }, [lobbyTicking]);

    useEffect(() =>
    {
        if (!preparingTicking) return;
        const interval = setInterval(() => setPreparingSeconds(seconds => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(interval);
    }, [preparingTicking]);

    useEffect(() =>
    {
        if (!clockTicking) return;
        const interval = setInterval(() => setSecondsLeft(seconds => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(interval);
    }, [clockTicking]);

    useEffect(() =>
    {
        if (!errorCode) return;
        const timeout = setTimeout(() => setErrorCode(null), 5000);
        return () => clearTimeout(timeout);
    }, [errorCode]);

    // All packet handlers are useCallback-stable and read the parser into a
    // local BEFORE any setState. Both rules are load-bearing: this hook lives
    // inside a use-between scope whose useEffect implementation flushes
    // synchronously on state updates, so an unstable handler identity makes
    // useMessageEvent unregister+dispose its event (nulling the parser)
    // mid-callback — and briefly leaves the header without a listener, which
    // can drop packets from the 300ms GameStatus stream.

    const onQueuePosition = useCallback((event: SnowWarQueuePositionEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        setPhase(current => (current === 'idle' || current === 'queued' || current === 'lobby') ? 'queued' : current);
        setQueuePosition(parser.position);
        setQueueSize(parser.queueSize);
    }, []);

    const onStartLobbyCounter = useCallback((event: SnowWarStartLobbyCounterEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        const seconds = parser.secondsUntilStart;
        setPhase('lobby');
        setLobbySeconds(seconds);
    }, []);

    const onInitArena = useCallback(() =>
    {
        SNOWWAR_SIMULATION.reset();
        setResults(null);
        setRematchedUserIds([]);
        setChatMessages([]);
        setPhase('loading');
        SendMessageComposer(new SnowWarLoadStageReadyComposer());
    }, []);

    const onLevelData = useCallback((event: SnowWarLevelDataEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        // The simulation needs the walkability grid to replay the server's
        // tile pathfinding for avatar movement.
        SNOWWAR_SIMULATION.setLevel(parser.heightmapRows, parser.items, parser.machines);
        setLevelData({
            gameLengthSeconds: parser.gameLengthSeconds,
            canEditRoom: parser.canEditRoom,
            mapId: parser.mapId,
            teamCount: parser.teamCount,
            heightmapRows: parser.heightmapRows,
            items: parser.items,
            machines: parser.machines,
            players: parser.players,
        });
        setSecondsLeft(parser.gameLengthSeconds);
    }, []);

    const onFullGameStatus = useCallback((event: SnowWarFullGameStatusEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        SNOWWAR_SIMULATION.applyFullStatus(parser.objects);
        setSecondsLeft(parser.totalSecondsLeft);
    }, []);

    const onStageStart = useCallback((event: SnowWarOnStageStartEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        const seconds = parser.preparingSeconds;
        setPhase('preparing');
        setPreparingSeconds(seconds);
    }, []);

    const onGameStatus = useCallback((event: SnowWarGameStatusEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        SNOWWAR_SIMULATION.queueGameStatus(parser.subturns.map(subturn => subturn.map(toSimEvent)));
        setPhase(current => ((current === 'preparing') || (current === 'loading')) ? 'playing' : current);
    }, []);

    const onStageRunning = useCallback((event: SnowWarOnStageRunningEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        setSecondsLeft(parser.totalSecondsLeft);
        setPhase(current => ((current === 'preparing') || (current === 'loading')) ? 'playing' : current);
    }, []);

    const onStageEnding = useCallback(() => setPhase('ending'), []);

    const onGameEnding = useCallback((event: SnowWarOnGameEndingEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        const nextResults = { secondsToResults: parser.secondsToResults, teams: parser.teams };
        setResults(nextResults);
        setPhase('results');
    }, []);

    const onGameEnded = useCallback(() =>
    {
        setPhase(current => (current === 'results') ? current : 'results');
    }, []);

    const onRejoinPreviousRoom = useCallback(() =>
    {
        // Entering the editor makes the server take us out of the game, which
        // echoes a rejoin-previous-room. Swallow it while editing so the level
        // snapshot the editor works on is kept intact.
        if (editingRef.current) return;
        resetToIdle();
    }, [resetToIdle]);

    const onPlayerExitedArena = useCallback((event: SnowWarPlayerExitedArenaEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        SNOWWAR_SIMULATION.avatars.delete(parser.objectId);
    }, []);

    const onUserChat = useCallback((event: SnowWarUserChatEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        const objectId = parser.objectId;
        const message = parser.message;
        const avatar = SNOWWAR_SIMULATION.avatars.get(objectId);
        setChatMessages(messages => [
            ...messages.slice(-30),
            {
                id: ++CHAT_MESSAGE_ID,
                objectId,
                name: avatar?.name ?? '',
                message,
                receivedAt: Date.now(),
            },
        ]);
    }, []);

    const onGenericError = useCallback((event: SnowWarGenericErrorEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        setErrorCode(parser.errorCode);
    }, []);

    const onUserRematched = useCallback((event: SnowWarUserRematchedEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        const userId = parser.userId;
        setRematchedUserIds(ids => (ids.includes(userId) ? ids : [...ids, userId]));
    }, []);

    const onGamesLeft = useCallback((event: SnowWarGamesLeftEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        setGamesLeft(parser.gamesLeft);
    }, []);

    const onGamesInformation = useCallback((event: SnowWarGamesInformationEvent) =>
    {
        const parser = event.getParser();
        if (!parser) return;
        setQueueInfo({ playersInQueue: parser.playersInQueue, gamesPlayed: parser.gamesPlayed });
    }, []);

    useMessageEvent<SnowWarQueuePositionEvent>(SnowWarQueuePositionEvent, onQueuePosition);
    useMessageEvent<SnowWarStartLobbyCounterEvent>(SnowWarStartLobbyCounterEvent, onStartLobbyCounter);
    useMessageEvent<SnowWarInitArenaEvent>(SnowWarInitArenaEvent, onInitArena);
    useMessageEvent<SnowWarLevelDataEvent>(SnowWarLevelDataEvent, onLevelData);
    useMessageEvent<SnowWarFullGameStatusEvent>(SnowWarFullGameStatusEvent, onFullGameStatus);
    useMessageEvent<SnowWarOnStageStartEvent>(SnowWarOnStageStartEvent, onStageStart);
    useMessageEvent<SnowWarGameStatusEvent>(SnowWarGameStatusEvent, onGameStatus);
    useMessageEvent<SnowWarOnStageRunningEvent>(SnowWarOnStageRunningEvent, onStageRunning);
    useMessageEvent<SnowWarOnStageEndingEvent>(SnowWarOnStageEndingEvent, onStageEnding);
    useMessageEvent<SnowWarOnGameEndingEvent>(SnowWarOnGameEndingEvent, onGameEnding);
    useMessageEvent<SnowWarGameEndedEvent>(SnowWarGameEndedEvent, onGameEnded);
    useMessageEvent<SnowWarRejoinPreviousRoomEvent>(SnowWarRejoinPreviousRoomEvent, onRejoinPreviousRoom);
    useMessageEvent<SnowWarPlayerExitedArenaEvent>(SnowWarPlayerExitedArenaEvent, onPlayerExitedArena);
    useMessageEvent<SnowWarUserChatEvent>(SnowWarUserChatEvent, onUserChat);
    useMessageEvent<SnowWarGenericErrorEvent>(SnowWarGenericErrorEvent, onGenericError);
    useMessageEvent<SnowWarUserRematchedEvent>(SnowWarUserRematchedEvent, onUserRematched);
    useMessageEvent<SnowWarGamesLeftEvent>(SnowWarGamesLeftEvent, onGamesLeft);
    useMessageEvent<SnowWarGamesInformationEvent>(SnowWarGamesInformationEvent, onGamesInformation);

    const joinQueue = useCallback(() => SendMessageComposer(new SnowWarJoinQueueComposer()), []);

    const leaveQueue = useCallback(() =>
    {
        SendMessageComposer(new SnowWarLeaveQueueComposer());
        resetToIdle();
    }, [resetToIdle]);

    const startEditing = useCallback(() =>
    {
        // Server verifies acc_snowwar_edit and removes us from the running
        // game/queue; we keep the level snapshot and edit it in place.
        editingRef.current = true;
        setEditing(true);
        SendMessageComposer(new SnowWarEditRoomComposer());
    }, []);

    const saveArena = useCallback((
        mapId: number,
        items: { name: string; x: number; y: number; rotation: number; imageUrl: string; offsetZ: number }[],
        spawns: { x: number; y: number }[],
        heightmap: string[]) =>
    {
        SendMessageComposer(new SnowWarSaveEditorComposer(mapId, items, spawns, heightmap));
    }, []);

    const stopEditing = useCallback(() =>
    {
        editingRef.current = false;
        setEditing(false);
        resetToIdle();
    }, [resetToIdle]);

    const exitGame = useCallback(() =>
    {
        SendMessageComposer(new SnowWarExitGameComposer());
        resetToIdle();
    }, [resetToIdle]);

    const playAgain = useCallback(() => SendMessageComposer(new SnowWarPlayAgainComposer()), []);

    const walkTo = useCallback((worldX: number, worldY: number) =>
        SendMessageComposer(new SnowWarWalkComposer(worldX, worldY)), []);

    const throwAtLocation = useCallback((worldX: number, worldY: number, trajectory: number) =>
        SendMessageComposer(new SnowWarThrowAtLocationComposer(worldX, worldY, trajectory)), []);

    const throwAtPlayer = useCallback((targetObjectId: number, trajectory: number) =>
        SendMessageComposer(new SnowWarThrowAtPlayerComposer(targetObjectId, trajectory)), []);

    const createSnowball = useCallback(() => SendMessageComposer(new SnowWarCreateSnowballComposer()), []);

    const sendChat = useCallback((message: string) =>
    {
        const trimmed = message.trim();
        if (!trimmed.length) return;
        SendMessageComposer(new SnowWarGameChatComposer(trimmed.substring(0, 100)));
    }, []);

    const requestFullStatus = useCallback(() =>
        SendMessageComposer(new SnowWarRequestFullGameStatusComposer()), []);

    return {
        phase,
        queuePosition,
        queueSize,
        lobbySeconds,
        preparingSeconds,
        secondsLeft,
        levelData,
        results,
        chatMessages,
        rematchedUserIds,
        errorCode,
        gamesLeft,
        queueInfo,
        editing,
        simulation: SNOWWAR_SIMULATION,
        joinQueue,
        leaveQueue,
        exitGame,
        startEditing,
        saveArena,
        stopEditing,
        playAgain,
        walkTo,
        throwAtLocation,
        throwAtPlayer,
        createSnowball,
        sendChat,
        requestFullStatus,
    };
};

export const useSnowWar = () => useBetween(useSnowWarState);
