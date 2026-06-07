import { describe, expect, it } from 'vitest';
import { buildChatMentionSuggestions, computeMentionContext, MentionAlias } from './useChatMentions.helpers';

const ALIASES: MentionAlias[] = [
    { key: 'all', scope: 'everyone', description: '' },
    { key: 'room', scope: 'room', description: '' }
];

const ROOM = [
    { webID: 1, type: 1, name: 'tester', figure: 'a' },
    { webID: 2, type: 1, name: 'alice', figure: 'b' },
    { webID: 3, type: 1, name: 'bob', figure: 'c' },
    { webID: 9, type: 2, name: 'petbot', figure: 'd' } // non-real user (pet/bot)
];

describe('computeMentionContext', () =>
{
    it('detects a trailing @query', () =>
    {
        expect(computeMentionContext('hi @al', false)).toEqual({ atIndex: 3, replaceFrom: 3, replaceTo: 6, query: 'al' });
    });

    it('detects @ at the very start', () =>
    {
        expect(computeMentionContext('@al', false)).toEqual({ atIndex: 0, replaceFrom: 0, replaceTo: 3, query: 'al' });
    });

    it('returns null when a command popover is open', () =>
    {
        expect(computeMentionContext('hi @al', true)).toBeNull();
    });

    it('returns null when @ is glued to a previous word (e.g. an email)', () =>
    {
        expect(computeMentionContext('mail me@al', false)).toBeNull();
    });

    it('returns null when the @token is not at the end', () =>
    {
        expect(computeMentionContext('@al ready', false)).toBeNull();
    });

    it('returns null when there is no @', () =>
    {
        expect(computeMentionContext('plain text', false)).toBeNull();
    });
});

describe('buildChatMentionSuggestions', () =>
{
    it('excludes the viewer by id and keeps the other real users + aliases', () =>
    {
        const names = buildChatMentionSuggestions('', ROOM, ALIASES, 1, 'tester').map(s => s.name);

        expect(names).not.toContain('tester'); // own user (webID 1)
        expect(names).toContain('alice');
        expect(names).toContain('bob');
        expect(names).toContain('all');
        expect(names).toContain('room');
    });

    it('excludes the viewer by name when the id does not line up', () =>
    {
        const names = buildChatMentionSuggestions('', ROOM, ALIASES, -1, 'TESTER').map(s => s.name);

        expect(names).not.toContain('tester');
    });

    it('skips non-real users (pets/bots)', () =>
    {
        const names = buildChatMentionSuggestions('', ROOM, [], 1, 'tester').map(s => s.name);

        expect(names).not.toContain('petbot');
    });

    it('prefix-filters users and aliases by the query', () =>
    {
        const names = buildChatMentionSuggestions('al', ROOM, ALIASES, 1, 'tester').map(s => s.name);

        expect(names).toContain('alice');
        expect(names).toContain('all');
        expect(names).not.toContain('bob');
        expect(names).not.toContain('room');
    });

    it('tags user vs alias kinds', () =>
    {
        const out = buildChatMentionSuggestions('', ROOM, ALIASES, 1, 'tester');

        expect(out.find(s => s.name === 'alice')?.kind).toBe('user');
        expect(out.find(s => s.name === 'all')?.kind).toBe('alias');
    });

    it('caps the total at max', () =>
    {
        const many = Array.from({ length: 20 }, (_, i) => ({ webID: 100 + i, type: 1, name: `u${ i }`, figure: '' }));
        const out = buildChatMentionSuggestions('', many, ALIASES, -1, 'me', 5);

        expect(out).toHaveLength(5);
    });
});
