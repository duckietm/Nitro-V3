import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetSessionDataManager, LocalizeText } from '../../../../api';
import {
    SNOWWAR_STATE_CREATING,
    SNOWWAR_STATE_INVINCIBLE,
    SNOWWAR_STATE_STUNNED,
    TILE_SIZE_WORLD,
    tileToWorld,
} from '../../../../api/snowwar';
import { LayoutAvatarImageView } from '../../../../common';
import { useSnowWar } from '../../../../hooks';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return text && text !== key ? text : fallback;
};

const TILE_HALF_W = 12;
const TILE_HALF_H = 6;

const TEAM_COLORS = ['#e64545', '#4577e6', '#3fb550', '#e6c245'];

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
        sendChat,
        requestFullStatus,
    } = useSnowWar();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Wall-clock of the last animation frame; doubles as the re-render tick.
    const [frameNow, setFrameNow] = useState(0);
    const [chatInput, setChatInput] = useState('');
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

    // Periodic authoritative resync.
    useEffect(() =>
    {
        if (phase !== 'playing') return;
        const interval = setInterval(() => requestFullStatus(), 10000);
        return () => clearInterval(interval);
    }, [phase, requestFullStatus]);

    const screenToTile = useCallback((event: MouseEvent<HTMLDivElement>) =>
    {
        const bounds = (event.currentTarget).getBoundingClientRect();
        const scaleX = canvasWidth / bounds.width;
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
            throwAtLocation(tileToWorld(tileX), tileToWorld(tileY), event.type === 'contextmenu' ? 2 : 1);
            return;
        }

        walkTo(tileToWorld(tileX), tileToWorld(tileY));
    }, [mapHeight, mapWidth, screenToTile, throwAtLocation, walkTo]);

    const ownAvatar = simulation.getAvatarByUserId(ownUserId);
    const alpha = simulation.interpolationAlpha;

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
                <div className="snowwar-hud__actions">
                    <button
                        type="button"
                        className="snowwar-button"
                        disabled={!ownAvatar || ownAvatar.activityState === SNOWWAR_STATE_CREATING || ownAvatar.snowballCount >= 5}
                        onClick={() => createSnowball()}
                    >
                        {localizeWithFallback('snowwar.make_snowball', 'Make snowball')}
                    </button>
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
            {phase === 'ending' && (
                <div className="snowwar-banner snowwar-banner--countdown">
                    {localizeWithFallback('snowwar.time_up', 'Time is up!')}
                </div>
            )}

            <div
                className="snowwar-viewport"
                onClick={onArenaClick}
                onContextMenu={onArenaClick}
            >
                <div className="snowwar-world" style={{ width: canvasWidth, height: canvasHeight }}>
                    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="snowwar-floor" />

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
                        return (
                            <div key={ball.objectId} className="snowwar-snowball" style={{ left: x, top: y }}>
                                <div className="snowwar-snowball__shadow" />
                                <div className="snowwar-snowball__ball" style={{ transform: `translateY(${-6 - (lh / 250)}px)` }} />
                            </div>
                        );
                    })}

                    {[...simulation.avatars.values()].map(avatar =>
                    {
                        const ax = avatar.prevWorldX + (avatar.worldX - avatar.prevWorldX) * alpha;
                        const ay = avatar.prevWorldY + (avatar.worldY - avatar.prevWorldY) * alpha;
                        const { x, y } = worldToScreen(ax, ay);
                        const isOwn = avatar.userId === ownUserId;
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
                                    throwAtPlayer(avatar.objectId, event.shiftKey ? 2 : 1);
                                }}
                            >
                                {showChat && <div className="snowwar-avatar__chat">{chat.message}</div>}
                                <div
                                    className={'snowwar-avatar__name' + (isOwn ? ' snowwar-avatar__name--own' : '')}
                                    style={{ color: TEAM_COLORS[avatar.teamId % TEAM_COLORS.length] }}
                                >
                                    {avatar.name}
                                </div>
                                <LayoutAvatarImageView
                                    figure={avatar.figure}
                                    gender={avatar.gender}
                                    direction={avatar.rotation}
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
