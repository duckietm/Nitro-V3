import { useEffect, useMemo, useState } from 'react';
import { MENTION_ROOM_ALIASES } from '../../components/room/widgets/chat/highlightMentions';
import { useFriendsState } from '../friends/useFriends';
import { useRoomUserListSnapshot } from '../session/useSessionSnapshots';

export interface MentionSuggestion
{
    name: string;
    figure: string;
    isAlias: boolean;
}

const MAX_SUGGESTIONS = 8;

// Trova il token @<parziale> che si sta digitando alla FINE del valore.
// Restituisce il parziale (anche '' subito dopo @) oppure null se non si è in un @mention.
const activeMentionPartial = (value: string): string | null =>
{
    if(!value || value.indexOf('@') < 0) return null;

    const match = /(?:^|\s)@([A-Za-z0-9_]*)$/.exec(value);

    return match ? match[1] : null;
};

export interface MentionAutocompleteState
{
    isVisible: boolean;
    suggestions: MentionSuggestion[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    moveUp: () => void;
    moveDown: () => void;
    current: () => MentionSuggestion | null;
    // Inserisce il nome scelto sostituendo il parziale @... alla fine del valore.
    applyTo: (value: string, name: string) => string;
}

export const useMentionAutocomplete = (chatValue: string): MentionAutocompleteState =>
{
    const roomUsers = useRoomUserListSnapshot();
    const { onlineFriends } = useFriendsState();
    const [ selectedIndex, setSelectedIndex ] = useState(0);

    const partial = useMemo(() => activeMentionPartial(chatValue), [ chatValue ]);

    const suggestions = useMemo<MentionSuggestion[]>(() =>
    {
        if(partial === null) return [];

        const query = partial.toLowerCase();
        const seen = new Set<string>();
        const out: MentionSuggestion[] = [];

        const add = (name: string, figure: string, isAlias: boolean) =>
        {
            if(!name || out.length >= MAX_SUGGESTIONS) return;

            const key = name.toLowerCase();

            if(seen.has(key)) return;
            if(query && !key.startsWith(query)) return;

            seen.add(key);
            out.push({ name, figure: figure || '', isAlias });
        };

        for(const user of (roomUsers || [])) add(user?.name, (user as any)?.figure, false);
        for(const friend of (onlineFriends || [])) add(friend?.name, friend?.figure, false);
        for(const alias of MENTION_ROOM_ALIASES) add(alias, '', true);

        return out;
    }, [ partial, roomUsers, onlineFriends ]);

    useEffect(() => { setSelectedIndex(0); }, [ partial ]);

    const isVisible = (partial !== null) && (suggestions.length > 0);

    return {
        isVisible,
        suggestions,
        selectedIndex,
        setSelectedIndex,
        moveUp: () => setSelectedIndex(index => (index <= 0 ? suggestions.length - 1 : index - 1)),
        moveDown: () => setSelectedIndex(index => (index >= suggestions.length - 1 ? 0 : index + 1)),
        current: () => suggestions[selectedIndex] ?? null,
        applyTo: (value: string, name: string) => value.replace(/@([A-Za-z0-9_]*)$/, '@' + name + ' ')
    };
};
