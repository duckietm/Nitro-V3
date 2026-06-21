import { CommandDefinition } from '../../../api';

export interface RankedCommandDefinition extends CommandDefinition {
    matchType: 'prefix' | 'contains' | 'description' | 'all';
}

const normalize = (value: string) => value.trim().toLowerCase();

export const getChatCommandQuery = (chatValue: string): string | null => {
    if (!chatValue.startsWith(':') || chatValue.includes(' ')) return null;

    return normalize(chatValue.slice(1));
};

const getCommandScore = (command: CommandDefinition, query: string): { score: number; matchType: RankedCommandDefinition['matchType'] } | null => {
    const key = normalize(command.key);
    const description = normalize(command.description || '');

    if (!query) return { score: 100 + key.length, matchType: 'all' };
    if (key === query) return { score: 0, matchType: 'prefix' };
    if (key.startsWith(query)) return { score: 10 + (key.length - query.length), matchType: 'prefix' };
    if (key.includes(query)) return { score: 40 + key.indexOf(query), matchType: 'contains' };
    if (description.includes(query)) return { score: 70 + description.indexOf(query), matchType: 'description' };

    return null;
};

export const getRankedCommandSuggestions = (commands: CommandDefinition[], query: string, limit: number): RankedCommandDefinition[] => {
    const seen = new Set<string>();

    return commands
        .map((command) => {
            const match = getCommandScore(command, query);

            if (!match) return null;

            return { command, score: match.score, matchType: match.matchType };
        })
        .filter((entry): entry is { command: CommandDefinition; score: number; matchType: RankedCommandDefinition['matchType'] } => !!entry)
        .sort((a, b) => a.score - b.score || a.command.key.localeCompare(b.command.key))
        .filter((entry) => {
            const key = normalize(entry.command.key);

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        })
        .slice(0, limit)
        .map((entry) => ({ ...entry.command, matchType: entry.matchType }));
};
