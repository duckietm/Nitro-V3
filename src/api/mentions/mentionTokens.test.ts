import { describe, expect, it } from 'vitest';
import { classifyMentionToken, MENTION_ROOM_ALIASES, tokenIsMention } from './mentionTokens';

describe('classifyMentionToken', () => {
    it('returns "self" for the own nick', () => {
        expect(classifyMentionToken('@Bob', 'Bob')).toBe('self');
    });

    it('returns "self" for a broadcast alias', () => {
        expect(classifyMentionToken('@all', 'Bob')).toBe('self');

        for (const alias of MENTION_ROOM_ALIASES) {
            expect(classifyMentionToken(`@${alias}`, 'Bob')).toBe('self');
        }
    });

    it('returns "tag" for any other @user', () => {
        expect(classifyMentionToken('@Charlie', 'Bob')).toBe('tag');
    });

    it('matches the own nick case-insensitively', () => {
        expect(classifyMentionToken('@bOb', 'BOB')).toBe('self');
    });

    it('returns "" for non-mentions and a bare @', () => {
        expect(classifyMentionToken('@', 'Bob')).toBe('');
        expect(classifyMentionToken('nothing', 'Bob')).toBe('');
    });

    it('still tags others when the own username is empty', () => {
        expect(classifyMentionToken('@Charlie', '')).toBe('tag');
    });
});

describe('tokenIsMention', () => {
    it('is true only for self/alias mentions', () => {
        expect(tokenIsMention('@Bob', 'Bob')).toBe(true);
        expect(tokenIsMention('@everyone', 'Bob')).toBe(true);
        expect(tokenIsMention('@Charlie', 'Bob')).toBe(false);
    });
});
