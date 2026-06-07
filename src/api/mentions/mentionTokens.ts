// Shared @-mention token classification, used by both the chat-bubble
// highlighter and the mentions panel so the two can't diverge.

export const MENTION_ROOM_ALIASES: ReadonlyArray<string> = [
    'all', 'everyone', 'tutti',
    'friends', 'amici',
    'room', 'stanza'
];

const NON_NICK_CHARS = /[^A-Za-z0-9_]/g;

const normalizeToken = (token: string): string =>
{
    if(!token || (token.length < 2) || (token.charAt(0) !== '@')) return '';

    return token.substring(1).replace(NON_NICK_CHARS, '').toLowerCase();
};

const normalizeNick = (value: string): string => (value || '').replace(NON_NICK_CHARS, '').toLowerCase();

// '' = not a mention; 'tag' = any @user (subtle chip); 'self' = the token
// targets the viewer (own nick) or is a broadcast alias (strong highlight).
export type MentionKind = '' | 'tag' | 'self';

export const classifyMentionToken = (
    token: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): MentionKind =>
{
    const nick = normalizeToken(token);

    if(!nick) return '';

    const ownLower = normalizeNick(ownUsername);

    if((ownLower && (nick === ownLower)) || aliases.some(alias => alias.toLowerCase() === nick)) return 'self';

    return 'tag';
};

/**
 * Back-compat boolean — true only when the token targets the viewer or a
 * broadcast alias (i.e. "I was mentioned"), not for generic @user tags.
 */
export const tokenIsMention = (
    token: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): boolean => (classifyMentionToken(token, ownUsername, aliases) === 'self');
