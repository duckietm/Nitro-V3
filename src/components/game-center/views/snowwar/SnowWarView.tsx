import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import { useGameCenter, useSnowWar } from '../../../../hooks';
import { SnowWarArenaView } from './SnowWarArenaView';
import { SnowWarResultsView } from './SnowWarResultsView';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return text && text !== key ? text : fallback;
};

const ERROR_TEXTS: Record<number, [string, string]> = {
    1: ['snowwar.error.queue_full', 'The queue is full, try again soon!'],
    2: ['snowwar.error.already_in_game', 'You are already in a game.'],
    3: ['snowwar.error.not_enough_players', 'Not enough players to start.'],
    4: ['snowwar.error.no_tickets', 'You have no games left.'],
    5: ['snowwar.error.internal', 'Something went wrong, try again.'],
};

/**
 * SnowWar top-level overlay. Mounted in MainView (independent of the game
 * center dialog) so a running match survives closing the game center.
 */
export const SnowWarView: FC = () =>
{
    const { phase, queuePosition, queueSize, lobbySeconds, errorCode, leaveQueue } = useSnowWar();
    const { isVisible: gameCenterVisible } = useGameCenter();

    if (phase === 'idle')
    {
        // While the game center hub is open its SnowWar tile shows the error.
        if (!errorCode || gameCenterVisible) return null;
        const [key, fallback] = ERROR_TEXTS[errorCode] ?? ERROR_TEXTS[5];
        return <div className="snowwar-toast snowwar-toast--error">{localizeWithFallback(key, fallback)}</div>;
    }

    if (phase === 'queued' || phase === 'lobby')
    {
        // Queue status lives in the game center tile; the floating toast only
        // covers the case where the hub was closed while waiting.
        if (gameCenterVisible) return null;
        return (
            <div className="snowwar-toast">
                <div className="snowwar-toast__title">
                    {localizeWithFallback('snowwar.queue.title', 'SnowStorm')}
                </div>
                {phase === 'queued' && (
                    <div>
                        {localizeWithFallback('snowwar.queue.position', 'In queue: %position% / %size%')
                            .replace('%position%', queuePosition.toString())
                            .replace('%size%', queueSize.toString())}
                    </div>
                )}
                {phase === 'lobby' && (
                    <div>
                        {localizeWithFallback('snowwar.queue.starting', 'Game starts in %seconds%s...')
                            .replace('%seconds%', lobbySeconds.toString())}
                    </div>
                )}
                <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => leaveQueue()}>
                    {localizeWithFallback('snowwar.queue.leave', 'Leave queue')}
                </button>
            </div>
        );
    }

    return (
        <div className="snowwar-overlay">
            <SnowWarArenaView />
            {phase === 'results' && <SnowWarResultsView />}
        </div>
    );
};
