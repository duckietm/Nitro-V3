import { CreateLinkEvent, GetGuestRoomResultEvent, GetRoomEngine, NavigatorSearchComposer, RateFlatMessageComposer, RoomEngineEvent } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaMinus, FaPlus } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText, SendMessageComposer, SetLocalStorage, TryVisitRoom } from '../../../../api';
import { Text } from '../../../../common';
import { useMessageEvent, useNavigatorData, useNitroEvent, useRoom } from '../../../../hooks';
import { classNames } from '../../../../layout';
import { getRegisteredPlugins, INitroPlugin, subscribePlugins } from '../../../plugins/NitroPluginApi';
import { getRoomZoomLevel, stepRoomZoom } from './roomZoom.helpers';

interface RoomHistoryEntry {
    roomId: number;
    roomName: string;
}

const ROOM_HISTORY_KEY = 'nitro.room.history';
const ROOM_HISTORY_MAX = 10;
const ROOM_NAME_MAX = 80;

const readRoomHistory = (): RoomHistoryEntry[] => {
    try {
        const raw = window.localStorage.getItem(ROOM_HISTORY_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((entry) => entry && Number.isInteger(entry.roomId) && entry.roomId > 0 && typeof entry.roomName === 'string')
            .slice(-ROOM_HISTORY_MAX)
            .map((entry) => ({ roomId: entry.roomId, roomName: entry.roomName.slice(0, ROOM_NAME_MAX) }));
    } catch {
        return [];
    }
};

export const RoomToolsWidgetView: FC<{}> = (props) => {
    const [areBubblesMuted, setAreBubblesMuted] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [roomName, setRoomName] = useState<string>(null);
    const [roomOwner, setRoomOwner] = useState<string>(null);
    const [roomTags, setRoomTags] = useState<string[]>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isOpenHistory, setIsOpenHistory] = useState<boolean>(false);
    const [roomHistory, setRoomHistory] = useState<RoomHistoryEntry[]>([]);
    const [plugins, setPlugins] = useState<INitroPlugin[]>([]);
    const { navigatorData } = useNavigatorData();
    const { roomSession = null } = useRoom();

    useEffect(() => {
        setPlugins(getRegisteredPlugins());
        return subscribePlugins(() => setPlugins(getRegisteredPlugins()));
    }, []);

    const syncZoomLevel = () => {
        if (!roomSession) return;
        setZoomLevel(getRoomZoomLevel(GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1)));
    };

    useEffect(() => {
        syncZoomLevel();
    }, [roomSession?.roomId]);

    useNitroEvent<RoomEngineEvent>(RoomEngineEvent.ROOM_ZOOMED, (event) => {
        if (!roomSession || event.roomId !== roomSession.roomId) return;
        syncZoomLevel();
    });

    const changeZoom = (direction: -1 | 1) => {
        if (!roomSession || !GetConfigurationValue('room.zoom.enabled', true)) return;

        const currentScale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);
        const nextScale = stepRoomZoom(currentScale, direction);
        if (nextScale === currentScale) return;

        GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, nextScale);
        setZoomLevel(getRoomZoomLevel(nextScale));
    };

    const handleToolClick = (action: string, value?: string) => {
        if (!roomSession) return;

        switch (action) {
            case 'settings':
                CreateLinkEvent('navigator/toggle-room-info');
                return;
            case 'chat_history':
                CreateLinkEvent('chat-history/toggle');
                return;
            case 'hiddenbubbles':
                CreateLinkEvent('nitrobubblehidden/toggle');
                setAreBubblesMuted((prev) => !prev);
                return;
            case 'like_room':
                SendMessageComposer(new RateFlatMessageComposer(1));
                return;
            case 'toggle_room_link':
                CreateLinkEvent('navigator/toggle-room-link');
                return;
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${value}`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${value}`));
                return;
            case 'room_history':
                if (roomHistory.length > 0) setIsOpenHistory((prev) => !prev);
                return;
            case 'room_history_back':
                const prevIndex = roomHistory.findIndex((room) => room.roomId === navigatorData.currentRoomId) - 1;
                if (prevIndex >= 0) TryVisitRoom(roomHistory[prevIndex].roomId);
                return;
            case 'room_history_next':
                const nextIndex = roomHistory.findIndex((room) => room.roomId === navigatorData.currentRoomId) + 1;
                if (nextIndex < roomHistory.length) TryVisitRoom(roomHistory[nextIndex].roomId);
                return;
        }
    };

    const currentRoomHistoryIndex = navigatorData ? roomHistory.findIndex((room) => room.roomId === navigatorData.currentRoomId) : -1;
    const hasHistory = roomHistory.length > 0;
    const canGoBack = currentRoomHistoryIndex > 0;
    const canGoNext = currentRoomHistoryIndex !== -1 && currentRoomHistoryIndex < roomHistory.length - 1;

    const onChangeRoomHistory = (roomId: number, roomName: string) => {
        if (!Number.isInteger(roomId) || roomId <= 0) return;

        let newStorage = readRoomHistory();
        if (newStorage.some((room) => room.roomId === roomId)) return;

        if (newStorage.length >= ROOM_HISTORY_MAX) newStorage.shift();
        newStorage = [...newStorage, { roomId, roomName: (roomName || '').slice(0, ROOM_NAME_MAX) }];

        setRoomHistory(newStorage);
        SetLocalStorage(ROOM_HISTORY_KEY, newStorage);
    };

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, (event) => {
        const parser = event.getParser();
        if (!parser.roomEnter || parser.data.roomId !== roomSession.roomId) return;

        if (roomName !== parser.data.roomName) setRoomName(parser.data.roomName);
        if (roomOwner !== parser.data.ownerName) setRoomOwner(parser.data.ownerName);
        if (roomTags !== parser.data.tags) setRoomTags(parser.data.tags);
        onChangeRoomHistory(parser.data.roomId, parser.data.roomName);
    });

    useEffect(() => {
        setIsOpen(true);
        const timeout = setTimeout(() => setIsOpen(false), 5000);
        return () => clearTimeout(timeout);
    }, [roomName, roomOwner, roomTags]);

    useEffect(() => {
        setRoomHistory(readRoomHistory());
    }, []);

    const tools = [
        { action: 'settings', icon: 'icon-cog', label: LocalizeText('room.settings.button.text') },
        { action: 'chat_history', icon: 'icon-chat-history', label: LocalizeText('room.chathistory.button.text') },
        {
            action: 'hiddenbubbles',
            icon: areBubblesMuted ? 'icon-chat-disablebubble' : 'icon-chat-enablebubble',
            label: areBubblesMuted ? LocalizeText('room.unmute.button.text') : LocalizeText('room.mute.button.text')
        },
        ...(navigatorData.canRate ? [{ action: 'like_room', icon: 'icon-like-room', label: LocalizeText('room.like.button.text') }] : []),
        { action: 'toggle_room_link', icon: 'icon-room-link', label: LocalizeText('navigator.embed.caption') }
    ];

    return (
        <div className={classNames('nitro-room-tools-container', isCollapsed && 'is-collapsed')}>
            <div className="nitro-room-tools-rail">
                <div className="flex flex-col nitro-room-tools" aria-hidden={isCollapsed}>
                            <div className="room-tools-zoom-row">
                                <Text noWrap small variant="white" className="room-tools-zoom-level">
                                    Zoom: {zoomLevel}
                                </Text>
                                <div className="room-tools-zoom-buttons">
                                    <button
                                        type="button"
                                        className="room-tools-zoom-button room-tools-zoom-in"
                                        disabled={zoomLevel >= 3}
                                        onClick={() => changeZoom(1)}
                                        aria-label="Zoom in"
                                    >
                                        <FaPlus />
                                    </button>
                                    <button
                                        type="button"
                                        className="room-tools-zoom-button room-tools-zoom-out"
                                        disabled={zoomLevel <= 0}
                                        onClick={() => changeZoom(-1)}
                                        aria-label="Zoom out"
                                    >
                                        <FaMinus />
                                    </button>
                                </div>
                            </div>
                            {tools.map((tool) => (
                                <div
                                    key={tool.action}
                                    className="flex items-center gap-2 cursor-pointer room-tool-row"
                                    title={tool.label}
                                    onClick={() => handleToolClick(tool.action)}
                                >
                                    <div className="flex justify-center w-6 shrink-0">
                                        <div className={classNames('nitro-icon', tool.icon)} />
                                    </div>
                                    <Text noWrap small variant="white" className="room-tool-label">
                                        {tool.label}
                                    </Text>
                                </div>
                            ))}
                            {plugins.map((plugin) => (
                                <div
                                    key={plugin.name}
                                    className="flex items-center gap-2 cursor-pointer room-tool-row"
                                    title={plugin.label}
                                    onClick={() => plugin.onOpen()}
                                >
                                    <div className="flex justify-center w-6 shrink-0">
                                        <div className={classNames('nitro-icon', plugin.icon || 'icon-cog')} />
                                    </div>
                                    <Text noWrap small variant="white" className="room-tool-label">
                                        {plugin.label}
                                    </Text>
                                </div>
                            ))}
                            <div className="room-history-controls">
                                <div
                                    className={classNames(
                                        'nitro-icon',
                                        canGoBack ? 'cursor-pointer icon-room-history-back-enabled' : 'icon-room-history-back-disabled'
                                    )}
                                    title={LocalizeText('room.history.button.back.tooltip')}
                                    onClick={() => canGoBack && handleToolClick('room_history_back')}
                                />
                                <div
                                    className={classNames('nitro-icon', hasHistory ? 'cursor-pointer icon-room-history-enabled' : 'icon-room-history-disabled')}
                                    title={LocalizeText('room.history.button.tooltip')}
                                    onClick={() => hasHistory && handleToolClick('room_history')}
                                />
                                <div
                                    className={classNames(
                                        'nitro-icon',
                                        canGoNext ? 'cursor-pointer icon-room-history-next-enabled' : 'icon-room-history-next-disabled'
                                    )}
                                    title={LocalizeText('room.history.button.forward.tooltip')}
                                    onClick={() => canGoNext && handleToolClick('room_history_next')}
                                />
                            </div>
                </div>
                <button
                    type="button"
                    className={classNames('nitro-room-tools-toggle', !isCollapsed && 'is-open')}
                    onClick={() => {
                        setIsCollapsed((value) => !value);
                        if (!isCollapsed) setIsOpenHistory(false);
                    }}
                    aria-label={isCollapsed ? 'Open room tools' : 'Close room tools'}
                >
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
            </div>
            {!isCollapsed && (
                <div className="flex flex-col justify-center">
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div initial={{ x: -100 }} animate={{ x: 0 }} exit={{ x: -100 }} transition={{ duration: 0.3 }}>
                                <div className="flex flex-col items-center justify-center">
                                    <div className="flex flex-col px-3 py-2 rounded nitro-room-tools-info">
                                        <div className="flex flex-col gap-1">
                                            <Text wrap fontSize={4} variant="white">
                                                {roomName}
                                            </Text>
                                            <Text fontSize={5} variant="gray">
                                                {roomOwner}
                                            </Text>
                                        </div>
                                        {roomTags && roomTags.length > 0 && (
                                            <div className="flex gap-2">
                                                {roomTags.map((tag, index) => (
                                                    <Text
                                                        key={index}
                                                        pointer
                                                        small
                                                        className="p-1 rounded bg-primary"
                                                        variant="white"
                                                        onClick={() => handleToolClick('navigator_search_tag', tag)}
                                                    >
                                                        #{tag}
                                                    </Text>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {isOpenHistory && (
                            <motion.div
                                initial={{ x: -100 }}
                                animate={{ x: 0 }}
                                exit={{ x: -100 }}
                                transition={{ duration: 0.3 }}
                                className="nitro-room-tools-history"
                            >
                                <div className="flex flex-col px-3 py-2 rounded nitro-room-history">
                                    {roomHistory.map((history) => (
                                        <Text
                                            key={history.roomId}
                                            bold={history.roomId === navigatorData.currentRoomId}
                                            variant="white"
                                            pointer
                                            className={classNames(
                                                'room-history-item',
                                                history.roomId === navigatorData.currentRoomId && 'room-history-item--current'
                                            )}
                                            onClick={() => TryVisitRoom(history.roomId)}
                                        >
                                            {history.roomName}
                                        </Text>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
