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

// Scale factor per zoom level: 0 = zoomed out, 1 = normal, 2 = zoomed in.
const ZOOM_LEVELS = [1, 2, 3];

/** Server rule: normal throws reach 5 tiles, long throws 15. */
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
        walkTo,
        throwAtLocation,
        throwAtPlayer,
        createSnowball,
        exitGame,
        editRoom,
        sendChat,
        requestFullStatus,
    } = useSnowWar();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    // Wall-clock of the last animation frame; doubles as the re-render tick.
    const [frameNow, setFrameNow] = useState(0);
    const [chatInput, setChatInput] = useState('');
    // Three zoom levels like the original game (:zoom 0/1/2); every game
    // starts fully zoomed out.
    const [zoomLevel, setZoomLevel] = useState(0);
    const zoom = ZOOM_LEVELS[zoomLevel];
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    // Bumped a few seconds after level load: remounts the furni images so
    // any that rendered the "still downloading" placeholder retry against
    // the now-cached assets.
    const [furniRetryTick, setFurniRetryTick] = useState(0);
    // Set when a throw is blocked for being out of range; shows a short hint.
    const [rangeWarningAt, setRangeWarningAt] = useState(0);
    const ownUserId = GetSessionDataManager()?.userId ?? 0;

    const mapRows = useMemo(() => levelData?.heightmapRows ?? [], [levelData]);
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

    // Static floor: tiles + obstacles drawn once per level.
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

        for (const item of (levelData?.items ?? []))
        {
            // Hotel furniture saved by the arena editor is rendered as its
            // real furni image in the DOM layer below - only the classic
            // SnowWar props are drawn as canvas shapes.
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
                // Generic block / fence / obstacle: raised cube.
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
    }, [levelData, mapHeight, mapWidth, mapRows, toScreen]);

    // Drive the simulation clock + re-render at display rate.
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

    // Track the viewport size; the camera transform is computed from it.
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

    // Furni image retry passes (see furniRetryTick).
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

    // Periodic authoritative resync.
    useEffect(() =>
    {
        if (phase !== 'playing') return;
        const interval = setInterval(() => requestFullStatus(), 10000);
        return () => clearInterval(interval);
    }, [phase, requestFullStatus]);

    const screenToTile = useCallback((event: MouseEvent<HTMLDivElement>) =>
    {
        // Measure the floor canvas itself, NOT the viewport: the world is
        // centered inside a scrollable viewport, so the viewport rect is
        // offset from the isometric origin and clicks landed on the wrong
        // tile (or outside the map) whenever the arena didn't exactly fill it.
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

    const onArenaClick = useCallback((event: MouseEvent<HTMLDivElement>) =>
    {
        const { tileX, tileY } = screenToTile(event);
        if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return;

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
    }, [mapHeight, mapWidth, screenToTile, simulation, ownUserId, throwAtLocation, walkTo]);

    const ownAvatar = simulation.getAvatarByUserId(ownUserId);
    const alpha = simulation.interpolationAlpha;

    // First room-ad furni's image becomes the full-arena backdrop.
    const arenaBackground = levelData?.items.find(item => item.imageUrl)?.imageUrl ?? null;

    // Camera as a GPU transform (translate + scale) instead of scrolling the
    // viewport: no per-frame layout work, so walking stays smooth. Level 0
    // centers the whole floor; levels 1-2 follow the own avatar, clamped to
    // the world edges.
    const scaledWidth = canvasWidth * zoom;
    const scaledHeight = canvasHeight * zoom;
    let cameraX = (viewportSize.width - scaledWidth) / 2;
    let cameraY = (viewportSize.height - scaledHeight) / 2;

    if (zoomLevel > 0 && ownAvatar && viewportSize.width > 0)
    {
        const followX = ownAvatar.prevWorldX + (ownAvatar.worldX - ownAvatar.prevWorldX) * alpha;
        const followY = ownAvatar.prevWorldY + (ownAvatar.worldY - ownAvatar.prevWorldY) * alpha;
        const { x, y } = worldToScreen(followX, followY);

        if (scaledWidth > viewportSize.width)
        {
            cameraX = Math.min(0, Math.max(viewportSize.width - scaledWidth, (viewportSize.width / 2) - (x * zoom)));
        }
        if (scaledHeight > viewportSize.height)
        {
            cameraY = Math.min(0, Math.max(viewportSize.height - scaledHeight, (viewportSize.height / 2) - (y * zoom)));
        }
    }

    const teamScores = useMemo(() =>
    {
        const scores = new Map<number, number>();
        for (const avatar of simulation.avatars.values())
        {
            scores.set(avatar.teamId, (scores.get(avatar.teamId) ?? 0) + avatar.score);
        }
        return [...scores.entries()].sort((a, b) => a[0] - b[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <div className="snowwar-hud__zoom" title={localizeWithFallback('snowwar.hud.zoom', 'Zoom')}>
                    <span>🔍</span>
                    {ZOOM_LEVELS.map((factor, level) => (
                        <button
                            key={level}
                            className={'snowwar-hud__zoom-level' + (zoomLevel === level ? ' snowwar-hud__zoom-level--active' : '')}
                            type="button"
                            onClick={() => setZoomLevel(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
                <div className="snowwar-hud__actions">
                    <button
                        type="button"
                        className="snowwar-button"
                        disabled={!ownAvatar || ownAvatar.activityState === SNOWWAR_STATE_CREATING || ownAvatar.snowballCount >= 5}
                        onClick={() => createSnowball()}
                    >
                        {localizeWithFallback('snowwar.make_snowball', 'Make snowball')}
                    </button>
                    {levelData.canEditRoom && (
                        <button type="button" className="snowwar-button" onClick={() => editRoom()}>
                            {localizeWithFallback('snowwar.edit_room', 'Edit Room')}
                        </button>
                    )}
                    <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => exitGame()}>
                        {localizeWithFallback('snowwar.leave', 'Leave game')}
                    </button>
                </div>
            </div>

            {phase === 'preparing' && (
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

            <div
                ref={viewportRef}
                className="snowwar-viewport"
                onClick={onArenaClick}
                onContextMenu={onArenaClick}
            >
                {arenaBackground && (
                    <img
                        alt=""
                        className="snowwar-arena-bg"
                        draggable={false}
                        src={arenaBackground}
                    />
                )}
                <div
                    className="snowwar-world"
                    style={{ width: canvasWidth, height: canvasHeight, transform: `translate(${cameraX}px, ${cameraY}px) scale(${zoom})`, transformOrigin: '0 0' }}
                >
                    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="snowwar-floor" />

                    {levelData.items.filter(item => !isClassicItem(item.name) && !item.imageUrl).map((item, index) =>
                    {
                        const { x, y } = toScreen(item.x, item.y);

                        // Room-ad (ads_bg) furni are drawn as the full-arena
                        // backdrop (arenaBackground) rather than a tile sprite.
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

                    {levelData.machines.map(machine =>
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

                    {[...simulation.snowballs.values()].map(ball =>
                    {
                        const lx = ball.prevLocH + (ball.locH - ball.prevLocH) * alpha;
                        const ly = ball.prevLocV + (ball.locV - ball.prevLocV) * alpha;
                        const lh = Math.max(0, ball.prevHeight + (ball.height - ball.prevHeight) * alpha);
                        const { x, y } = worldToScreen(lx, ly);
                        // Rendered arc = height above the throwing hand (world
                        // 3000), amplified so the 10x flatter/steeper parabola
                        // between normal (traj 1) and long (traj 2) throws is
                        // actually visible; the ball also grows near its peak.
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

            <div className="snowwar-help">
                {localizeWithFallback('snowwar.help', 'Click: walk • Click enemy: throw • Shift+click: lob • Right-click: long throw')}
            </div>
        </div>
    );
};
