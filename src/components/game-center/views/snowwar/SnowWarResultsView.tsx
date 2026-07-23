import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import { useSnowWar } from '../../../../hooks';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return text && text !== key ? text : fallback;
};

const TEAM_COLORS = ['#e64545', '#4577e6', '#3fb550', '#e6c245'];
const TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];

export const SnowWarResultsView: FC = () =>
{
    const { results, rematchedUserIds, playAgain, exitGame } = useSnowWar();

    if (!results) return null;

    const orderedTeams = [...results.teams].sort((a, b) => b.score - a.score);
    const winner = orderedTeams[0];
    const isDraw = orderedTeams.length > 1 && orderedTeams[0].score === orderedTeams[1].score;

    return (
        <div className="snowwar-results">
            <div className="snowwar-results__card">
                <div className="snowwar-results__title">
                    {isDraw
                        ? localizeWithFallback('snowwar.results.draw', 'It\'s a draw!')
                        : localizeWithFallback('snowwar.results.winner', 'Team %team% wins!')
                            .replace('%team%', localizeWithFallback(
                                `snowwar.team.${winner.teamId}`, TEAM_NAMES[winner.teamId % TEAM_NAMES.length]))}
                </div>

                {orderedTeams.map(team => (
                    <div key={team.teamId} className="snowwar-results__team">
                        <div
                            className="snowwar-results__team-header"
                            style={{ color: TEAM_COLORS[team.teamId % TEAM_COLORS.length] }}
                        >
                            <span>
                                {localizeWithFallback(`snowwar.team.${team.teamId}`, TEAM_NAMES[team.teamId % TEAM_NAMES.length])}
                            </span>
                            <span>{team.score}</span>
                        </div>
                        {[...team.players].sort((a, b) => b.score - a.score).map(player => (
                            <div key={player.userId} className="snowwar-results__player">
                                <span>
                                    {player.name}
                                    {rematchedUserIds.includes(player.userId) && (
                                        <span className="snowwar-results__rematched">
                                            {' '}• {localizeWithFallback('snowwar.results.rematched', 'plays again')}
                                        </span>
                                    )}
                                </span>
                                <span>{player.score}</span>
                            </div>
                        ))}
                    </div>
                ))}

                <div className="snowwar-results__actions">
                    <button type="button" className="snowwar-button" onClick={() => playAgain()}>
                        {localizeWithFallback('snowwar.results.play_again', 'Play again')}
                    </button>
                    <button type="button" className="snowwar-button snowwar-button--danger" onClick={() => exitGame()}>
                        {localizeWithFallback('snowwar.results.leave', 'Back to hotel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
