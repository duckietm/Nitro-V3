// Pure helpers for the chat-input @-mention autocomplete. Kept framework-free
// so the suggestion building and the caret-context detection are unit-testable.

export type MentionSuggestionKind = 'user' | 'alias';

export interface MentionSuggestion
{
    key: string;
    kind: MentionSuggestionKind;
    name: string;
    insertToken: string;
    figure?: string;
    description?: string;
}

export type MentionAliasScope = 'everyone' | 'friends' | 'room';

export interface MentionAlias
{
    key: string;
    scope: MentionAliasScope;
    description: string;
}

export interface MentionContext
{
    atIndex: number;
    replaceFrom: number;
    replaceTo: number;
    query: string;
}

export const MAX_MENTION_SUGGESTIONS = 8;

const USER_TYPE_REAL_USER = 1;

export const MENTION_ALIAS_CONFIG_KEY: Record<MentionAliasScope, string> = {
    everyone: 'mentions_ui.aliases.everyone',
    friends:  'mentions_ui.aliases.friends',
    room:     'mentions_ui.aliases.room'
};

export const MENTION_ALIAS_DEFAULTS: Record<MentionAliasScope, string[]> = {
    everyone: [ 'all', 'everyone', 'tutti' ],
    friends:  [ 'friends', 'amici' ],
    room:     [ 'room', 'stanza' ]
};

export const MENTION_ALIAS_DESCRIPTION_KEY: Record<MentionAliasScope, string> = {
    everyone: 'mentions.alias.description.everyone',
    friends:  'mentions.alias.description.friends',
    room:     'mentions.alias.description.room'
};

export const sanitizeAliasList = (raw: unknown, fallback: string[]): string[] =>
{
    if(!Array.isArray(raw)) return fallback;

    const out: string[] = [];

    for(const entry of raw)
    {
        if(typeof entry !== 'string') continue;

        const trimmed = entry.trim();

        if(!trimmed) continue;

        out.push(trimmed);
    }

    return out;
};

/**
 * Detect an in-progress `@partial` token at the END of the input. Returns the
 * token bounds + the query (text after `@`), or null when not in a mention (no
 * trailing `@token`, `@` glued to a previous word, or a command popover open).
 * End-anchored (no caret read) so it stays a pure render-safe computation.
 */
export const computeMentionContext = (value: string, commandSelectorVisible: boolean): MentionContext | null =>
{
    if(!value) return null;
    if(commandSelectorVisible) return null;

    const match = /(?:^|\s)@([A-Za-z0-9_]*)$/.exec(value);

    if(!match) return null;

    const query = match[1];
    const atIndex = value.length - query.length - 1;

    return { atIndex, replaceFrom: atIndex, replaceTo: value.length, query };
};

interface MentionRoomUser
{
    webID?: number;
    type?: number;
    name?: string;
    figure?: string;
}

/**
 * Build the suggestion list for the current query: real room users (minus the
 * viewer themselves — match by id, name as fallback) then the broadcast
 * aliases, prefix-filtered and capped.
 */
export const buildChatMentionSuggestions = (
    query: string,
    roomUserList: ReadonlyArray<MentionRoomUser>,
    aliases: ReadonlyArray<MentionAlias>,
    ownUserId: number,
    ownUsername: string,
    max: number = MAX_MENTION_SUGGESTIONS
): MentionSuggestion[] =>
{
    const q = (query || '').toLowerCase();
    const ownNameLower = (ownUsername || '').toLowerCase();
    const out: MentionSuggestion[] = [];

    for(const user of (roomUserList || []))
    {
        if(out.length >= max) break;
        if(!user || (user.type !== USER_TYPE_REAL_USER)) continue;
        if(!user.name) continue;
        // You can't mention yourself — skip the own user (match by id, name as fallback).
        if((user.webID === ownUserId) || (ownNameLower && (user.name.toLowerCase() === ownNameLower))) continue;
        if((q.length > 0) && !user.name.toLowerCase().startsWith(q)) continue;

        out.push({ key: `user:${ user.webID }`, kind: 'user', name: user.name, insertToken: user.name, figure: user.figure || '' });
    }

    for(const alias of aliases)
    {
        if(out.length >= max) break;
        if((q.length > 0) && !alias.key.toLowerCase().startsWith(q)) continue;

        out.push({ key: `alias:${ alias.key }`, kind: 'alias', name: alias.key, insertToken: alias.key, description: alias.description });
    }

    return out;
};
