import { FC, useEffect } from 'react';
import { LocalizeText } from '../../../../api';
import { useGameCenter, useSnowWar } from '../../../../hooks';
import { SnowWarArenaView } from './SnowWarArenaView';
import { SnowWarLeaderboardView } from './SnowWarLeaderboardView';
import { SnowWarLobbyView } from './SnowWarLobbyView';
import { SnowWarResultsView } from './SnowWarResultsView';
import { SnowWarTeamsView } from './SnowWarTeamsView';

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
    const { phase, errorCode, queueExpired, leaderboard } = useSnowWar();
    const { isVisible: gameCenterVisible, setIsVisible: setGameCenterVisible } = useGameCenter();

    // Queue wait timed out: drop the player back onto the game center main
    // screen and show the "time has passed" popup (text is UITexts-driven).
    useEffect(() =>
    {
        if (queueExpired) setGameCenterVisible(true);
    }, [queueExpired, setGameCenterVisible]);

    if (leaderboard.isOpen) return <SnowWarLeaderboardView />;

    if (queueExpired)
    {
        return (
            <div className="snowwar-toast snowwar-toast--error">
                {localizeWithFallback('snowwar.queue.timeout', 'Sorry, the waiting time has passed.')}
            </div>
        );
    }

    if (phase === 'idle')
    {
        // While the game center hub is open its SnowWar tile shows the error.
        if (!errorCode || gameCenterVisible) return null;
        const [key, fallback] = ERROR_TEXTS[errorCode] ?? ERROR_TEXTS[5];
        return <div className="snowwar-toast snowwar-toast--error">{localizeWithFallback(key, fallback)}</div>;
    }

    // From joining the queue through the lobby countdown: the pre-match
    // "getting ready" screen with the waiting players assembling into their
    // Red / Blue teams (and a live "waiting for players" / countdown status).
    if (phase === 'queued' || phase === 'lobby')
    {
        return (
            <div className="snowwar-overlay">
                <SnowWarTeamsView />
            </div>
        );
    }

    // Match found: full-screen "Get ready!" splash until the arena takes over.
    if (phase === 'loading' || phase === 'preparing')
    {
        return (
            <div className="snowwar-overlay">
                <SnowWarLobbyView />
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
