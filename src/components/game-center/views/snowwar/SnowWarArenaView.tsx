import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetSessionDataManager, LocalizeText } from '../../../../api';
import {
    SNOWWAR_STATE_CREATING,
    SNOWWAR_STATE_INVINCIBLE,
    SNOWWAR_STATE_STUNNED,
    THROW_RANGE_LONG,
    THROW_RANGE_NORMAL,
    TILE_SIZE_WORLD,
    tileToWorld,
} from '../../../../api/snowwar';
import { LayoutFurniImageView } from '../../../../common';
import { useSnowWar } from '../../../../hooks';
import { SnowWarAvatarView } from './SnowWarAvatarView';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return text && text !== key ? text : fallback;
};

const TILE_HALF_W = 12;
const TILE_HALF_H = 6;
const TEAM_COLORS = ['#e64545', '#4577e6', '#3fb550', '#e6c245'];
const ZOOM = 2;
const DESIGN_W = 1920;
const DESIGN_H = 1080;
const CAMERA_DEADZONE = 0.2;
const CAMERA_EASE = 0.15;

interface EditItem { name: string; x: number; y: number; rotation: number; imageUrl: string; offsetZ: number }

const EDITOR_PALETTE = [
    'sw_tree1', 'sw_tree2', 'sw_tree3', 'sw_tree4',
    'block_basic', 'block_basic2', 'block_basic3', 'block_small',
    'block_ice', 'block_ice2', 'obst_duck', 'obst_snowman',
    'sw_fence', 'snowball_machine',
];

const isThrowInRange = (fromX: number, fromY: number, toX: number, toY: number, trajectory: number) =>
{
    const maxRange = (trajectory === 2) ? THROW_RANGE_LONG : THROW_RANGE_NORMAL;
    const dx = toX - fromX;
    const dy = toY - fromY;
    return ((dx * dx) + (dy * dy)) <= (maxRange * maxRange);
};

/** Classic SnowWar props drawn as canvas shapes; everything else is furni. */
const isClassicItem = (name: string) =>
    name.startsWith('sw_') || name.startsWith('block_') || name.startsWith('obst_') || name.startsWith('snowball_machine');

export const SnowWarArenaView: FC = () =>
{
    const {
        phase,
        levelData,
        secondsLeft,
        preparingSeconds,
        chatMessages,
        simulation,
        editing,
        walkTo,
        throwAtLocation,
        throwAtPlayer,
        createSnowball,
        exitGame,
        startEditing,
        saveArena,
        stopEditing,
        sendChat,
        requestFullStatus,
    } = useSnowWar();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef({ x: 0, y: 0, frame: -1, recenterX: false, recenterY: false, initialized: false });
    const [frameNow, setFrameNow] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const zoom = ZOOM;
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [furniRetryTick, setFurniRetryTick] = useState(0);
    const [rangeWarningAt, setRangeWarningAt] = useState(0);
    const ownUserId = GetSessionDataManager()?.userId ?? 0;
    const [editItems, setEditItems] = useState<EditItem[]>([]);
    const [editSpawns, setEditSpawns] = useState<{ x: number; y: number }[]>([]);
    const [editHeightmap, setEditHeightmap] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [paletteSel, setPaletteSel] = useState<string | null>(null);
    const [furniSearch, setFurniSearch] = useState('');
    const [savedAt, setSavedAt] = useState(0);
    const furniMatches = useMemo(() =>
    {
        const term = furniSearch.trim().toLowerCase();
        if (term.length < 2) return [];
        const all = GetSessionDataManager()?.getAllFurnitureData?.() ?? [];
        return all
            .filter(furni => furni.type === 'S' && (
                furni.className?.toLowerCase().includes(term) || furni.name?.toLowerCase().includes(term)))
            .slice(0, 40);
    }, [furniSearch]);

    useEffect(() =>
    {
        if (!editing) return;
        setEditItems((levelData?.items ?? []).map(item => ({
            name: item.name, x: item.x, y: item.y, rotation: item.rotation, imageUrl: item.imageUrl, offsetZ: item.offsetZ ?? 0,
        })));
        setEditSpawns([]);
        setEditHeightmap([...(levelData?.heightmapRows ?? [])]);
        setSelectedIndex(-1);
        setPaletteSel(null);
        setFurniSearch('');
    }, [editing]);

    const displayItems = editing ? editItems : (levelData?.items ?? []);

    const mapRows = editing ? editHeightmap : (levelData?.heightmapRows ?? []);
    const mapHeight = mapRows.length;
    const mapWidth = mapHeight > 0 ? mapRows[0].length : 0;

    const originX = mapHeight * TILE_HALF_W;
    const canvasWidth = (mapWidth + mapHeight) * TILE_HALF_W;
    const canvasHeight = (mapWidth + mapHeight) * TILE_HALF_H + 40;

    const toScreen = useCallback((tileX: number, tileY: number) => ({
        x: originX + (tileX - tileY) * TILE_HALF_W,
        y: (tileX + tileY) * TILE_HALF_H,
    }), [originX]);

    const worldToScreen = useCallback((worldX: number, worldY: number) =>
    {
        const tx = worldX / TILE_SIZE_WORLD;
        const ty = worldY / TILE_SIZE_WORLD;
        return {
            x: originX + (tx - ty) * TILE_HALF_W,
            y: (tx + ty) * TILE_HALF_H,
        };
    }, [originX]);

    useEffect(() =>
    {
        const canvas = canvasRef.current;
        if (!canvas || !mapHeight) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < mapHeight; y++)
        {
            for (let x = 0; x < mapWidth; x++)
            {
                const char = mapRows[y]?.charAt(x);
                if (char !== '0') continue;

                const { x: sx, y: sy } = toScreen(x, y);
                context.beginPath();
                context.moveTo(sx, sy);
                context.lineTo(sx + TILE_HALF_W, sy + TILE_HALF_H);
                context.lineTo(sx, sy + TILE_HALF_H * 2);
                context.lineTo(sx - TILE_HALF_W, sy + TILE_HALF_H);
                context.closePath();
                context.fillStyle = ((x + y) % 2) ? '#eef5fb' : '#e4eef7';
                context.fill();
                context.strokeStyle = '#c8d8e6';
                context.lineWidth = 1;
                context.stroke();
            }
        }

        for (const item of displayItems)
        {
            if (!isClassicItem(item.name)) continue;

            const { x: sx, y: sy } = toScreen(item.x, item.y);
            const centerY = sy + TILE_HALF_H;

            if (item.name.startsWith('sw_tree'))
            {
                context.fillStyle = '#7a5230';
                context.fillRect(sx - 2, centerY - 8, 4, 8);
                context.beginPath();
                context.moveTo(sx, centerY - 34);
                context.lineTo(sx + 12, centerY - 8);
                context.lineTo(sx - 12, centerY - 8);
                context.closePath();
                context.fillStyle = '#2f7a43';
                context.fill();
                context.strokeStyle = '#215a30';
                context.stroke();
            }
            else if (item.name.startsWith('obst_snowman'))
            {
                context.fillStyle = '#ffffff';
                context.strokeStyle = '#b9c9d6';
                context.beginPath();
                context.arc(sx, centerY - 6, 8, 0, Math.PI * 2);
                context.fill();
                context.stroke();
                context.beginPath();
                context.arc(sx, centerY - 18, 6, 0, Math.PI * 2);
                context.fill();
                context.stroke();
            }
            else
            {
                const height = item.name.includes('3') ? 26 : item.name.includes('2') ? 18 : 10;
                const isIce = item.name.includes('ice');
                context.beginPath();
                context.moveTo(sx, centerY - height - TILE_HALF_H);
                context.lineTo(sx + TILE_HALF_W, centerY - height);
                context.lineTo(sx + TILE_HALF_W, centerY);
                context.lineTo(sx, centerY + TILE_HALF_H);
                context.lineTo(sx - TILE_HALF_W, centerY);
                context.lineTo(sx - TILE_HALF_W, centerY - height);
                context.closePath();
                context.fillStyle = isIce ? '#bfe3f5' : '#cfd6dd';
                context.fill();
                context.strokeStyle = isIce ? '#8fc3de' : '#9aa5b0';
                context.stroke();
            }
        }
    }, [displayItems, mapHeight, mapWidth, mapRows, toScreen]);

    useEffect(() =>
    {
        let running = true;
        let rafId = 0;

        const loop = (now: number) =>
        {
            if (!running) return;
            simulation.update(now);
            setFrameNow(Date.now());
            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () =>
        {
            running = false;
            cancelAnimationFrame(rafId);
        };
    }, [simulation]);

    useEffect(() =>
    {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const update = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
        update();

        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [levelData]);

    useEffect(() =>
    {
        if (!levelData) return;
        setFurniRetryTick(0);
        const timers = [
            setTimeout(() => setFurniRetryTick(1), 4000),
            setTimeout(() => setFurniRetryTick(2), 10000),
        ];
        return () => timers.forEach(timer => clearTimeout(timer));
    }, [levelData]);

    useEffect(() =>
    {
        if (phase !== 'playing') return;
        const interval = setInterval(() => requestFullStatus(), 10000);
        return () => clearInterval(interval);
    }, [phase, requestFullStatus]);

    const screenToTile = useCallback((event: MouseEvent<HTMLDivElement>) =>
    {
        const canvas = canvasRef.current;
        if (!canvas) return { tileX: -1, tileY: -1 };

        const bounds = canvas.getBoundingClientRect();
        const scaleX = bounds.width > 0 ? canvasWidth / bounds.width : 1;
        const px = (event.clientX - bounds.left) * scaleX - originX;
        const py = (event.clientY - bounds.top) * scaleX;

        const tileX = Math.floor(((px / TILE_HALF_W) + (py / TILE_HALF_H)) / 2);
        const tileY = Math.floor(((py / TILE_HALF_H) - (px / TILE_HALF_W)) / 2);
        return { tileX, tileY };
    }, [canvasWidth, originX]);

    const applyEditClick = useCallback((tileX: number, tileY: number) =>
    {
        if (paletteSel === 'floor')
        {
            setEditHeightmap(rows => rows.map((row, ry) =>
            {
                if (ry !== tileY || tileX >= row.length) return row;
                const cell = row.charAt(tileX);
                const next = (cell === 'x' || cell === 'X') ? '0' : 'x';
                return row.substring(0, tileX) + next + row.substring(tileX + 1);
            }));
            return;
        }

        if (paletteSel === 'spawn')
        {
            setEditSpawns(spawns =>
            {
                const index = spawns.findIndex(spawn => spawn.x === tileX && spawn.y === tileY);
                return index >= 0 ? spawns.filter((_, i) => i !== index) : [...spawns, { x: tileX, y: tileY }];
            });
            return;
        }

        if (paletteSel)
        {
            setEditItems(items => [...items, { name: paletteSel, x: tileX, y: tileY, rotation: 0, imageUrl: '', offsetZ: 0 }]);
            return;
        }

        let hitIndex = -1;
        for (let i = editItems.length - 1; i >= 0; i--)
        {
            if (editItems[i].x === tileX && editItems[i].y === tileY) { hitIndex = i; break; }
        }

        if (hitIndex >= 0) { setSelectedIndex(hitIndex); return; }

        if (selectedIndex >= 0)
        {
            setEditItems(items => items.map((item, i) => (i === selectedIndex ? { ...item, x: tileX, y: tileY } : item)));
            return;
        }

        setSelectedIndex(-1);
    }, [paletteSel, editItems, selectedIndex]);

    const onArenaClick = useCallback((event: MouseEvent<HTMLDivElement>) =>
    {
        const { tileX, tileY } = screenToTile(event);
        if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return;

        if (editing)
        {
            event.preventDefault();
            applyEditClick(tileX, tileY);
            return;
        }

        if (event.shiftKey || event.type === 'contextmenu')
        {
            event.preventDefault();
            const trajectory = event.type === 'contextmenu' ? 2 : 1;
            const own = simulation.getAvatarByUserId(ownUserId);
            if (own && !isThrowInRange(own.tileX, own.tileY, tileX, tileY, trajectory))
            {
                setRangeWarningAt(Date.now());
                return;
            }
            throwAtLocation(tileToWorld(tileX), tileToWorld(tileY), trajectory);
            return;
        }

        walkTo(tileToWorld(tileX), tileToWorld(tileY));
    }, [editing, applyEditClick, mapHeight, mapWidth, screenToTile, simulation, ownUserId, throwAtLocation, walkTo]);

    const rotateSelected = useCallback(() =>
        setEditItems(items => items.map((item, i) => (i === selectedIndex ? { ...item, rotation: (item.rotation + 2) % 8 } : item))),
    [selectedIndex]);

    const deleteSelected = useCallback(() =>
    {
        setEditItems(items => items.filter((_, i) => i !== selectedIndex));
        setSelectedIndex(-1);
    }, [selectedIndex]);

    const setBackdropUrl = useCallback((url: string) =>
        setEditItems(items =>
        {
            const trimmed = url;
            const index = items.findIndex(item => item.imageUrl);
            if (!trimmed) return items.filter(item => !item.imageUrl);
            if (index >= 0) return items.map((item, i) => (i === index ? { ...item, imageUrl: trimmed } : item));
            return [...items, { name: 'ads_background', x: 0, y: 0, rotation: 0, imageUrl: trimmed, offsetZ: 0 }];
        }), []);

    const setBackdropOffsetZ = useCallback((offsetZ: number) =>
        setEditItems(items => items.map(item => (item.imageUrl ? { ...item, offsetZ } : item))), []);

    const clearAllItems = useCallback(() =>
    {
        setEditItems([]);
        setSelectedIndex(-1);
    }, []);

    const saveEditor = useCallback(() =>
    {
        if (!levelData) return;
        saveArena(levelData.mapId, editItems, editSpawns, editHeightmap);
        setSavedAt(Date.now());
    }, [levelData, editItems, editSpawns, editHeightmap, saveArena]);

    const ownAvatar = simulation.getAvatarByUserId(ownUserId);
    const alpha = simulation.interpolationAlpha;
    const arenaBackdrop = displayItems.find(item => item.imageUrl) ?? null;
    const backdropOverlay = !!(arenaBackdrop && (arenaBackdrop.offsetZ ?? 0) > 0);
    const selectedItem = (editing && selectedIndex >= 0 && editItems[selectedIndex]) ? editItems[selectedIndex] : null;
    const placingFurni = (editing && paletteSel && paletteSel !== 'spawn' && paletteSel !== 'floor')
        ? GetSessionDataManager()?.getFloorItemDataByName?.(paletteSel) : null;
    const selectedFurni = selectedItem ? GetSessionDataManager()?.getFloorItemDataByName?.(selectedItem.name) : null;
    const backdropItem = editing ? (editItems.find(item => item.imageUrl) ?? null) : null;
    const floorW = canvasWidth * zoom;
    const floorH = canvasHeight * zoom;
    const stageW = Math.max(DESIGN_W, floorW);
    const stageH = Math.max(DESIGN_H, floorH);
    const floorOffsetX = (stageW - floorW) / 2;
    const floorOffsetY = (stageH - floorH) / 2;

    let cameraX = (viewportSize.width - stageW) / 2;
    let cameraY = (viewportSize.height - stageH) / 2;

    if (ownAvatar && viewportSize.width > 0)
    {
        const followX = ownAvatar.prevWorldX + (ownAvatar.worldX - ownAvatar.prevWorldX) * alpha;
        const followY = ownAvatar.prevWorldY + (ownAvatar.worldY - ownAvatar.prevWorldY) * alpha;
        const { x, y } = worldToScreen(followX, followY);
        const avatarStageX = floorOffsetX + (x * zoom);
        const avatarStageY = floorOffsetY + (y * zoom);

        const followsX = stageW > viewportSize.width;
        const followsY = stageH > viewportSize.height;
        const centeredX = Math.min(0, Math.max(viewportSize.width - stageW, (viewportSize.width / 2) - avatarStageX));
        const centeredY = Math.min(0, Math.max(viewportSize.height - stageH, (viewportSize.height / 2) - avatarStageY));

        const cam = cameraRef.current;
        if (!cam.initialized)
        {
            cam.x = followsX ? centeredX : cameraX;
            cam.y = followsY ? centeredY : cameraY;
            cam.initialized = true;
        }

        if (cam.frame !== frameNow)
        {
            cam.frame = frameNow;

            if (followsX)
            {
                const screenX = avatarStageX + cam.x;
                if (!cam.recenterX && (screenX < viewportSize.width * CAMERA_DEADZONE || screenX > viewportSize.width * (1 - CAMERA_DEADZONE)))
                    cam.recenterX = true;
                if (cam.recenterX)
                {
                    cam.x += (centeredX - cam.x) * CAMERA_EASE;
                    if (Math.abs(centeredX - cam.x) < 0.5) { cam.x = centeredX; cam.recenterX = false; }
                }
                cam.x = Math.min(0, Math.max(viewportSize.width - stageW, cam.x));
            }
            else cam.x = cameraX;

            if (followsY)
            {
                const screenY = avatarStageY + cam.y;
                if (!cam.recenterY && (screenY < viewportSize.height * CAMERA_DEADZONE || screenY > viewportSize.height * (1 - CAMERA_DEADZONE)))
                    cam.recenterY = true;
                if (cam.recenterY)
                {
                    cam.y += (centeredY - cam.y) * CAMERA_EASE;
                    if (Math.abs(centeredY - cam.y) < 0.5) { cam.y = centeredY; cam.recenterY = false; }
                }
                cam.y = Math.min(0, Math.max(viewportSize.height - stageH, cam.y));
            }
            else cam.y = cameraY;
        }

        cameraX = cam.x;
        cameraY = cam.y;
    }
    else
    {
        cameraRef.current.initialized = false;
    }

    const teamScores = useMemo(() =>
    {
        const scores = new Map<number, number>();
        for (const avatar of simulation.avatars.values())
        {
            scores.set(avatar.teamId, (scores.get(avatar.teamId) ?? 0) + avatar.score);
        }
        return [...scores.entries()].sort((a, b) => a[0] - b[0]);
    }, [simulation, simulation.subturnCount]);

    const formatClock = (totalSeconds: number) =>
    {
        const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
        const seconds = Math.max(0, totalSeconds) % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!levelData)
    {
        return (
            <div className="snowwar-arena snowwar-arena--loading">
                <div className="snowwar-banner">{localizeWithFallback('snowwar.loading', 'Loading arena...')}</div>
            </div>
        );
    }

    return (
        <div className="snowwar-arena">
            <div className="snowwar-hud">
                <div className="snowwar-hud__clock">{formatClock(secondsLeft)}</div>
                <div className="snowwar-hud__teams">
                    {teamScores.map(([teamId, score]) => (
                        <div key={teamId} className="snowwar-hud__team" style={{ borderColor: TEAM_COLORS[teamId % TEAM_COLORS.length] }}>
                            <span className="snowwar-hud__team-dot" style={{ background: TEAM_COLORS[teamId % TEAM_COLORS.length] }} />
                            {score}
                        </div>
                    ))}
                </div>
                {ownAvatar && (
                    <div className="snowwar-hud__self">
                        <span title={localizeWithFallback('snowwar.hud.health', 'Health')}>
                            {'❤'.repeat(Math.max(0, ownAvatar.health))}
                            <span className="snowwar-hud__hearts-empty">{'❤'.repeat(Math.max(0, 4 - ownAvatar.health))}</span>
                        </span>
                        <span title={localizeWithFallback('snowwar.hud.snowballs', 'Snowballs')}>
                            {'⚪'.repeat(Math.max(0, ownAvatar.snowballCount))}
                        </span>
                        <span>{localizeWithFallback('snowwar.hud.score', 'Score')}: {ownAvatar.score}</span>
                    </div>
                )}
                <div className="snowwar-hud__actions">
                    {editing ? (
                        <>
                            <button type="button" className="snowwar-button" onClick={() => saveEditor()}>
                                {localizeWithFallback('snowwar.editor.save', 'Save arena')}
                            </button>
                            <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => stopEditing()}>
                                {localizeWithFallback('snowwar.editor.exit', 'Exit editor')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="snowwar-button"
                                disabled={!ownAvatar || ownAvatar.activityState === SNOWWAR_STATE_CREATING || ownAvatar.snowballCount >= 5}
                                onClick={() => createSnowball()}
                            >
                                {localizeWithFallback('snowwar.make_snowball', 'Make snowball')}
                            </button>
                            {levelData.canEditRoom && (
                                <button type="button" className="snowwar-button" onClick={() => startEditing()}>
                                    {localizeWithFallback('snowwar.edit_room', 'Edit Room')}
                                </button>
                            )}
                            <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => exitGame()}>
                                {localizeWithFallback('snowwar.leave', 'Leave game')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editing && (
                <div className="snowwar-editor">
                    <div className="snowwar-editor__hint">
                        {localizeWithFallback('snowwar.editor.hint', 'Pick a piece (or search furniture) then click a tile to place it. Floor tile paints/erases the arena floor. Select/Move: click a piece then an empty tile to move it.')}
                    </div>
                    <div className="snowwar-editor__tools">
                        <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => clearAllItems()}>
                            {localizeWithFallback('snowwar.editor.clear', 'Clear all furni')}
                        </button>
                    </div>
                    <div className="snowwar-editor__palette">
                        <button
                            type="button"
                            className={'snowwar-editor__chip' + (paletteSel === null ? ' snowwar-editor__chip--active' : '')}
                            onClick={() => setPaletteSel(null)}
                        >
                            {localizeWithFallback('snowwar.editor.select', 'Select / Move')}
                        </button>
                        {EDITOR_PALETTE.map(name => (
                            <button
                                key={name}
                                type="button"
                                className={'snowwar-editor__chip' + (paletteSel === name ? ' snowwar-editor__chip--active' : '')}
                                onClick={() => { setPaletteSel(name); setSelectedIndex(-1); }}
                            >
                                {name.replace('block_', '').replace('obst_', '').replace('sw_', '')}
                            </button>
                        ))}
                        <button
                            type="button"
                            className={'snowwar-editor__chip snowwar-editor__chip--spawn' + (paletteSel === 'spawn' ? ' snowwar-editor__chip--active' : '')}
                            onClick={() => { setPaletteSel('spawn'); setSelectedIndex(-1); }}
                        >
                            {localizeWithFallback('snowwar.editor.spawn', 'Spawn tile')}
                        </button>
                        <button
                            type="button"
                            className={'snowwar-editor__chip snowwar-editor__chip--floor' + (paletteSel === 'floor' ? ' snowwar-editor__chip--active' : '')}
                            onClick={() => { setPaletteSel('floor'); setSelectedIndex(-1); }}
                        >
                            {localizeWithFallback('snowwar.editor.floor', 'Floor tile')}
                        </button>
                    </div>
                    <input
                        type="text"
                        className="snowwar-editor__search"
                        value={furniSearch}
                        placeholder={localizeWithFallback('snowwar.editor.furni_search', 'Search furniture to place...')}
                        onChange={event => setFurniSearch(event.target.value)}
                    />
                    {furniMatches.length > 0 && (
                        <div className="snowwar-editor__palette snowwar-editor__palette--furni">
                            {furniMatches.map(furni => (
                                <button
                                    key={furni.id}
                                    type="button"
                                    title={furni.className}
                                    className={'snowwar-editor__chip' + (paletteSel === furni.className ? ' snowwar-editor__chip--active' : '')}
                                    onClick={() => { setPaletteSel(furni.className); setSelectedIndex(-1); }}
                                >
                                    {(furni.name && furni.name.trim()) || furni.className}
                                </button>
                            ))}
                        </div>
                    )}
                    {placingFurni && (
                        <div className="snowwar-editor__preview">
                            <span className="snowwar-editor__preview-label">{localizeWithFallback('snowwar.editor.placing', 'Placing')}:</span>
                            <LayoutFurniImageView direction={2} productClassId={placingFurni.id} productType="s" style={{ transform: 'scale(0.5)' }} />
                            <span>{(placingFurni.name && placingFurni.name.trim()) || paletteSel}</span>
                        </div>
                    )}
                    {selectedItem && (
                        <div className="snowwar-editor__selected">
                            <div className="snowwar-editor__preview">
                                {selectedFurni
                                    ? <LayoutFurniImageView direction={selectedItem.rotation} productClassId={selectedFurni.id} productType="s" style={{ transform: 'scale(0.5)' }} />
                                    : <div className="snowwar-furni__fallback" />}
                                <span>{(selectedFurni?.name && selectedFurni.name.trim()) || selectedItem.name}</span>
                            </div>
                            <div className="snowwar-editor__tools">
                                <button type="button" className="snowwar-button" onClick={() => rotateSelected()}>
                                    {localizeWithFallback('snowwar.editor.rotate', 'Rotate')}
                                </button>
                                <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => deleteSelected()}>
                                    {localizeWithFallback('snowwar.editor.delete', 'Delete')}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="snowwar-editor__selected">
                        <div className="snowwar-editor__field snowwar-editor__field--stack">
                            <span>{localizeWithFallback('snowwar.editor.bg', 'Arena background (ads_bg)')}</span>
                            <input
                                type="text"
                                className="snowwar-editor__search"
                                value={backdropItem?.imageUrl ?? ''}
                                placeholder={localizeWithFallback('snowwar.editor.bg_url', 'Full-screen background image URL...')}
                                onChange={event => setBackdropUrl(event.target.value)}
                            />
                        </div>
                        {backdropItem && (
                            <label className="snowwar-editor__field">
                                {localizeWithFallback('snowwar.editor.overlay', 'Overlay floor tiles (hide tiles behind image)')}
                                <input
                                    type="checkbox"
                                    checked={(backdropItem.offsetZ ?? 0) > 0}
                                    onChange={event => setBackdropOffsetZ(event.target.checked ? 1 : 0)}
                                />
                            </label>
                        )}
                    </div>
                </div>
            )}
            {(frameNow - savedAt) < 2500 && savedAt > 0 && (
                <div className="snowwar-banner snowwar-banner--saved">
                    {localizeWithFallback('snowwar.editor.saved', 'Arena saved! The next game uses the new layout.')}
                </div>
            )}

            {phase === 'preparing' && !editing && (
                <div className="snowwar-banner snowwar-banner--countdown">
                    {localizeWithFallback('snowwar.get_ready', 'Get ready!')} {preparingSeconds > 0 ? preparingSeconds : ''}
                </div>
            )}
            {(frameNow - rangeWarningAt) < 2000 && rangeWarningAt > 0 && (
                <div className="snowwar-banner snowwar-banner--warning">
                    {localizeWithFallback('snowwar.throw.too_far', 'Too far away! Use a long throw or move closer.')}
                </div>
            )}
            {phase === 'ending' && (
                <div className="snowwar-banner snowwar-banner--countdown">
                    {localizeWithFallback('snowwar.time_up', 'Time is up!')}
                </div>
            )}

            <div className="snowwar-viewport-wrap">
            <div
                ref={viewportRef}
                className="snowwar-viewport"
                onClick={onArenaClick}
                onContextMenu={onArenaClick}
            >
                <div
                    className="snowwar-world"
                    style={{ width: stageW, height: stageH, transform: `translate(${cameraX}px, ${cameraY}px)`, transformOrigin: '0 0' }}
                >
                    {arenaBackdrop && !backdropOverlay && (
                        <img
                            alt=""
                            className="snowwar-arena-bg"
                            draggable={false}
                            src={arenaBackdrop.imageUrl}
                        />
                    )}
                    <div
                        className="snowwar-floor-layer"
                        style={{ left: floorOffsetX, top: floorOffsetY, width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})`, transformOrigin: '0 0' }}
                    >
                        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="snowwar-floor" />

                    {arenaBackdrop && backdropOverlay && (
                        <img
                            alt=""
                            className="snowwar-arena-bg-overlay"
                            draggable={false}
                            src={arenaBackdrop.imageUrl}
                            style={{ width: canvasWidth, height: canvasHeight }}
                        />
                    )}

                    {displayItems.filter(item => !isClassicItem(item.name) && !item.imageUrl).map((item, index) =>
                    {
                        const { x, y } = toScreen(item.x, item.y);
                        const furniData = GetSessionDataManager()?.getFloorItemDataByName?.(item.name);
                        return (
                            <div
                                key={`furni-${index}-${furniRetryTick}`}
                                className="snowwar-furni"
                                style={{ left: x, top: y + (TILE_HALF_H * 2), zIndex: 100 + Math.round(y + TILE_HALF_H) }}
                            >
                                {furniData
                                    ? <LayoutFurniImageView
                                        direction={item.rotation}
                                        productClassId={furniData.id}
                                        productType="s"
                                        style={{ position: 'absolute', transform: 'translate(-50%, -80%) scale(0.375)' }}
                                    />
                                    : <div className="snowwar-furni__fallback" />}
                            </div>
                        );
                    })}

                    {!editing && levelData.machines.map(machine =>
                    {
                        const state = simulation.machines.get(machine.objectId);
                        const { x, y } = toScreen(machine.x, machine.y);
                        return (
                            <div key={machine.objectId} className="snowwar-machine" style={{ left: x, top: y }}>
                                <div className="snowwar-machine__body" />
                                <div className="snowwar-machine__count">{state?.snowballCount ?? 0}</div>
                            </div>
                        );
                    })}

                    {editing && editSpawns.map((spawn, index) =>
                    {
                        const { x, y } = toScreen(spawn.x, spawn.y);
                        return <div key={`spawn-${index}`} className="snowwar-edit-spawn" style={{ left: x, top: y + TILE_HALF_H }} />;
                    })}

                    {editing && editItems.map((item, index) => item.imageUrl
                        ? (() =>
                        {
                            const { x, y } = toScreen(item.x, item.y);
                            return <div key={`admarker-${index}`} className="snowwar-edit-admarker" style={{ left: x, top: y + TILE_HALF_H }}>🖼</div>;
                        })()
                        : null)}

                    {editing && selectedIndex >= 0 && editItems[selectedIndex] && (() =>
                    {
                        const { x, y } = toScreen(editItems[selectedIndex].x, editItems[selectedIndex].y);
                        return <div className="snowwar-edit-selection" style={{ left: x, top: y + TILE_HALF_H }} />;
                    })()}

                    {[...simulation.snowballs.values()].map(ball =>
                    {
                        const lx = ball.prevLocH + (ball.locH - ball.prevLocH) * alpha;
                        const ly = ball.prevLocV + (ball.locV - ball.prevLocV) * alpha;
                        const lh = Math.max(0, ball.prevHeight + (ball.height - ball.prevHeight) * alpha);
                        const { x, y } = worldToScreen(lx, ly);
                        const rise = 6 + Math.min(120, Math.max(0, lh - 3000) / 60);
                        const peakScale = 1 + Math.min(0.8, Math.max(0, lh - 3000) / 8000);
                        return (
                            <div
                                key={ball.objectId}
                                className={'snowwar-snowball' + (ball.trajectory === 2 ? ' snowwar-snowball--long' : '')}
                                style={{ left: x, top: y }}
                            >
                                <div className="snowwar-snowball__shadow" />
                                <div className="snowwar-snowball__ball" style={{ transform: `translateY(${-rise}px) scale(${peakScale})` }} />
                            </div>
                        );
                    })}

                    {[...simulation.avatars.values()].map(avatar =>
                    {
                        const ax = avatar.prevWorldX + (avatar.worldX - avatar.prevWorldX) * alpha;
                        const ay = avatar.prevWorldY + (avatar.worldY - avatar.prevWorldY) * alpha;
                        const { x, y } = worldToScreen(ax, ay);
                        const isOwn = avatar.userId === ownUserId;
                        const walking = (avatar.worldX !== avatar.prevWorldX) || (avatar.worldY !== avatar.prevWorldY);
                        const stunned = avatar.activityState === SNOWWAR_STATE_STUNNED;
                        const invincible = avatar.activityState === SNOWWAR_STATE_INVINCIBLE;
                        const chat = chatMessages.filter(message => message.objectId === avatar.objectId).slice(-1)[0];
                        const showChat = chat && (frameNow - chat.receivedAt) < 5000;

                        return (
                            <div
                                key={avatar.objectId}
                                className={
                                    'snowwar-avatar' +
                                    (stunned ? ' snowwar-avatar--stunned' : '') +
                                    (invincible ? ' snowwar-avatar--invincible' : '') +
                                    (simulation.subturnCount < avatar.hitFlashUntilSubturn ? ' snowwar-avatar--hit' : '')
                                }
                                style={{ left: x, top: y, zIndex: 100 + Math.round(y) }}
                                onClick={event =>
                                {
                                    if (isOwn || !ownAvatar || avatar.teamId === ownAvatar.teamId) return;
                                    event.stopPropagation();
                                    const trajectory = event.shiftKey ? 2 : 1;
                                    if (!isThrowInRange(ownAvatar.tileX, ownAvatar.tileY, avatar.tileX, avatar.tileY, trajectory))
                                    {
                                        setRangeWarningAt(Date.now());
                                        return;
                                    }
                                    throwAtPlayer(avatar.objectId, trajectory);
                                }}
                            >
                                {showChat && <div className="snowwar-avatar__chat">{chat.message}</div>}
                                <div
                                    className={'snowwar-avatar__name' + (isOwn ? ' snowwar-avatar__name--own' : '')}
                                    style={{ color: TEAM_COLORS[avatar.teamId % TEAM_COLORS.length] }}
                                >
                                    {avatar.name}
                                </div>
                                <SnowWarAvatarView
                                    figure={avatar.figure}
                                    gender={avatar.gender}
                                    direction={avatar.rotation}
                                    walking={walking && !stunned}
                                    frameNow={frameNow}
                                    scale={0.5}
                                />
                                {stunned && <div className="snowwar-avatar__stars">{'⭐⭐⭐'}</div>}
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>
            </div>

            {!editing && (
            <div className="snowwar-chat">
                <div className="snowwar-chat__log">
                    {chatMessages.slice(-4).map(message => (
                        <div key={message.id} className="snowwar-chat__line">
                            <b>{message.name}:</b> {message.message}
                        </div>
                    ))}
                </div>
                <input
                    type="text"
                    className="snowwar-chat__input"
                    value={chatInput}
                    maxLength={100}
                    placeholder={localizeWithFallback('snowwar.chat.placeholder', 'Say something...')}
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event =>
                    {
                        if (event.key !== 'Enter') return;
                        sendChat(chatInput);
                        setChatInput('');
                    }}
                />
            </div>
            )}

            <div className="snowwar-help">
                {editing
                    ? localizeWithFallback('snowwar.editor.help', 'Editor: pick a piece then click a tile • click a piece to select, then an empty tile to move • Floor paints tiles')
                    : localizeWithFallback('snowwar.help', 'Click: walk • Click enemy: throw • Shift+click: lob • Right-click: long throw')}
            </div>
        </div>
    );
};
