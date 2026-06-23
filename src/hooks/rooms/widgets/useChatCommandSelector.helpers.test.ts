import { describe, expect, it } from 'vitest';
import { CommandDefinition } from '../../../api';
import { getChatCommandQuery, getRankedCommandSuggestions } from './useChatCommandSelector.helpers';

const commands: CommandDefinition[] = [
    { key: 'commands', description: 'Mostra tutti i comandi' },
    { key: 'empty', description: 'Svuota la stanza' },
    { key: 'emptybots', description: 'Svuota inventario bot' },
    { key: 'xempty', description: 'Comando di test' },
    { key: 'ejectall', description: 'Espelli tutti i furni' },
    { key: 'togglefps', description: 'Mostra o nasconde FPS' }
];

describe('getChatCommandQuery', () => {
    it('returns null when the input is not a command prefix', () => {
        expect(getChatCommandQuery('ciao')).toBeNull();
        expect(getChatCommandQuery(':empty ')).toBeNull();
    });

    it('returns the normalized command query', () => {
        expect(getChatCommandQuery(':Em')).toBe('em');
    });
});

describe('getRankedCommandSuggestions', () => {
    it('ranks prefix matches before contains and description matches', () => {
        const result = getRankedCommandSuggestions(commands, 'em', 10);

        expect(result.map((command) => command.key)).toEqual(['empty', 'emptybots', 'xempty']);
    });

    it('matches command descriptions when the key does not match', () => {
        const result = getRankedCommandSuggestions(commands, 'furni', 10);

        expect(result.map((command) => command.key)).toEqual(['ejectall']);
        expect(result[0].matchType).toBe('description');
    });

    it('limits the visible suggestions', () => {
        const result = getRankedCommandSuggestions(commands, '', 2);

        expect(result).toHaveLength(2);
    });
});
