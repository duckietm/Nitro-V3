export const MENTION_ROOM_ALIASES: ReadonlyArray<string> = [
    'all', 'everyone', 'tutti',
    'friends', 'amici',
    'room', 'stanza'
];

const NON_NICK_CHARS = /[^A-Za-z0-9_]/g;

const normalizeToken = (token: string): string =>
{
    if(!token || token.length < 2 || token.charAt(0) !== '@') return '';

    return token.substring(1).replace(NON_NICK_CHARS, '').toLowerCase();
};


const isMentionToken = (token: string, ownUsernameLower: string, aliases: ReadonlySet<string>): boolean =>
{
    const nick = normalizeToken(token);

    if(!nick) return false;

    if(ownUsernameLower && nick === ownUsernameLower) return true;

    return aliases.has(nick);
};

export const tokenIsMention = (
    token: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): boolean =>
{
    const ownUsernameLower = (ownUsername || '').replace(NON_NICK_CHARS, '').toLowerCase();
    return isMentionToken(token, ownUsernameLower, new Set(aliases.map(a => a.toLowerCase())));
};

const HIGHLIGHT_OPEN = '<span class="mention-highlight">';
const HIGHLIGHT_CLOSE = '</span>';

const highlightTextChunk = (chunk: string, ownUsernameLower: string, aliases: ReadonlySet<string>): string =>
{
    if(chunk.indexOf('@') < 0) return chunk;

    const segments = chunk.split(/(\s+)/);

    let result = '';

    for(const segment of segments)
    {
        if(segment.length === 0) continue;

        if(/^\s+$/.test(segment) || !isMentionToken(segment, ownUsernameLower, aliases))
        {
            result += segment;
            continue;
        }

        result += `${ HIGHLIGHT_OPEN }${ segment }${ HIGHLIGHT_CLOSE }`;
    }

    return result;
};

export const highlightMentions = (
    formattedHtml: string,
    ownUsername: string,
    aliases: ReadonlyArray<string> = MENTION_ROOM_ALIASES
): string =>
{
    if(!formattedHtml || formattedHtml.indexOf('@') < 0) return formattedHtml;

    const ownUsernameLower = (ownUsername || '').replace(NON_NICK_CHARS, '').toLowerCase();
    const aliasSet = new Set(aliases.map(a => a.toLowerCase()));

    if(!ownUsernameLower && aliasSet.size === 0) return formattedHtml;

    let result = '';
    let cursor = 0;

    while(cursor < formattedHtml.length)
    {
        const tagStart = formattedHtml.indexOf('<', cursor);

        if(tagStart < 0)
        {
            result += highlightTextChunk(formattedHtml.slice(cursor), ownUsernameLower, aliasSet);
            break;
        }

        if(tagStart > cursor)
        {
            result += highlightTextChunk(formattedHtml.slice(cursor, tagStart), ownUsernameLower, aliasSet);
        }

        const tagEnd = formattedHtml.indexOf('>', tagStart);

        if(tagEnd < 0)
        {
            result += formattedHtml.slice(tagStart);
            break;
        }

        result += formattedHtml.slice(tagStart, tagEnd + 1);
        cursor = tagEnd + 1;
    }

    return result;
};
