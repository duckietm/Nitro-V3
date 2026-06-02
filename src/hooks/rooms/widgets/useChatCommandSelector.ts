import { AvailableCommandsEvent, GetCommunication } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandDefinition } from '../../../api';
import { createNitroStore } from '../../../state/createNitroStore';
import { useMessageEvent } from '../../events';
import { getChatCommandQuery, getRankedCommandSuggestions } from './useChatCommandSelector.helpers';

const MAX_VISIBLE_COMMANDS = 8;

// Client-only commands are static; safe to keep at module scope.
const CLIENT_COMMANDS: CommandDefinition[] = [
    // Effetti stanza
    { key: 'shake', description: 'Scuoti la stanza' },
    { key: 'rotate', description: 'Ruota la stanza' },
    { key: 'zoom', description: 'Zoom stanza' },
    { key: 'flip', description: 'Reset zoom' },
    { key: 'iddqd', description: 'Reset zoom' },
    { key: 'screenshot', description: 'Screenshot stanza' },
    { key: 'togglefps', description: 'Toggle FPS' },
    // Espressioni
    { key: 'd', description: 'Ridi (VIP)' },
    { key: 'kiss', description: 'Manda un bacio (VIP)' },
    { key: 'jump', description: 'Salta (VIP)' },
    { key: 'idle', description: 'Vai in idle' },
    { key: 'sign', description: 'Mostra cartello' },
    // Gestione stanza
    { key: 'furni', description: 'Furni chooser' },
    { key: 'chooser', description: 'User chooser' },
    { key: 'floor', description: 'Floor editor' },
    { key: 'bcfloor', description: 'Floor editor' },
    { key: 'pickall', description: 'Raccogli tutti i furni' },
    { key: 'ejectall', description: 'Espelli tutti i furni' },
    { key: 'settings', description: 'Impostazioni stanza' },
    // Info
    { key: 'client', description: 'Info client' },
    { key: 'nitro', description: 'Info client' },
];

/**
 * Server-pushed command cache. Lives in a Zustand store (instead of
 * module-level `let` variables) so the React Compiler can analyze the
 * surrounding hook cleanly, and so a future test can `setState({…})`
 * a deterministic fixture without monkey-patching the module.
 *
 * The `isListenerRegistered` flag prevents the renderer from getting
 * two AvailableCommandsEvent listeners — one from the module-level
 * pre-mount registration (which captures the server's reply that lands
 * during login, BEFORE any React widget mounts) and one from the
 * in-hook `useMessageEvent` (which covers later rank-change refreshes).
 */
interface ChatCommandStore
{
    serverCommands: CommandDefinition[];
    isListenerRegistered: boolean;
    setServerCommands: (commands: CommandDefinition[]) => void;
    markListenerRegistered: () => void;
}

const useChatCommandStore = createNitroStore<ChatCommandStore>()((set) => ({
    serverCommands: [],
    isListenerRegistered: false,
    setServerCommands: (commands) => set({ serverCommands: commands }),
    markListenerRegistered: () => set({ isListenerRegistered: true })
}));

export const ensureChatCommandListener = (): void =>
{
    if(useChatCommandStore.getState().isListenerRegistered) return;

    try
    {
        const event = new AvailableCommandsEvent((event: AvailableCommandsEvent) =>
        {
            const parser = event.getParser();
            useChatCommandStore.getState().setServerCommands(parser.commands.map(cmd => ({ key: cmd.key, description: cmd.description })));
        });

        GetCommunication().registerMessageEvent(event);
        useChatCommandStore.getState().markListenerRegistered();
    }
    catch
    {
        // Communication not ready yet — the in-hook useMessageEvent
        // below covers later mounts.
    }
};

// Try once at module load so the server's response landing before any
// React mount still hits the cache.
ensureChatCommandListener();

export const useChatCommandSelector = (chatValue: string) =>
{
    const serverCommands = useChatCommandStore(s => s.serverCommands);
    const setServerCommands = useChatCommandStore(s => s.setServerCommands);
    const [ selectedIndex, setSelectedIndex ] = useState(0);
    const [ dismissedQuery, setDismissedQuery ] = useState<string | null>(null);

    useEffect(() =>
    {
        // Cover the case where the module-level registration failed
        // because GetCommunication() wasn't ready at import time.
        ensureChatCommandListener();
    }, []);

    // Late updates (rank change, etc.) — go through the store so all
    // consumers see the same data.
    useMessageEvent<AvailableCommandsEvent>(AvailableCommandsEvent, event =>
    {
        const parser = event.getParser();
        setServerCommands(parser.commands.map(cmd => ({ key: cmd.key, description: cmd.description })));
    });

    const allCommands = useMemo(() =>
    {
        const merged = [ ...serverCommands ];

        for(const clientCmd of CLIENT_COMMANDS)
        {
            if(!merged.some(cmd => cmd.key === clientCmd.key)) merged.push(clientCmd);
        }

        return merged.sort((a, b) => a.key.localeCompare(b.key));
    }, [ serverCommands ]);

    const filterText = useMemo(() => getChatCommandQuery(chatValue), [ chatValue ]);

    const filteredCommands = useMemo(() =>
    {
        if(filterText === null) return [];

        return getRankedCommandSuggestions(allCommands, filterText, MAX_VISIBLE_COMMANDS);
    }, [ allCommands, filterText ]);

    const isVisible = useMemo(() =>
    {
        return filterText !== null && filteredCommands.length > 0 && dismissedQuery !== filterText;
    }, [ filterText, filteredCommands, dismissedQuery ]);

    const boundedSelectedIndex = useMemo(() =>
    {
        if(!filteredCommands.length) return 0;

        return Math.min(selectedIndex, filteredCommands.length - 1);
    }, [ filteredCommands.length, selectedIndex ]);

    const moveUp = useCallback(() =>
    {
        if(!filteredCommands.length) return;

        setSelectedIndex(prev => ((prev <= 0 || prev >= filteredCommands.length) ? filteredCommands.length - 1 : prev - 1));
    }, [ filteredCommands.length ]);

    const moveDown = useCallback(() =>
    {
        if(!filteredCommands.length) return;

        setSelectedIndex(prev => (prev >= filteredCommands.length - 1 ? 0 : prev + 1));
    }, [ filteredCommands.length ]);

    const selectCurrent = useCallback((): CommandDefinition | null =>
    {
        if(boundedSelectedIndex >= 0 && boundedSelectedIndex < filteredCommands.length)
        {
            return filteredCommands[boundedSelectedIndex];
        }

        return null;
    }, [ boundedSelectedIndex, filteredCommands ]);

    const close = useCallback(() =>
    {
        setDismissedQuery(filterText);
    }, [ filterText ]);

    return { isVisible, filteredCommands, selectedIndex: boundedSelectedIndex, setSelectedIndex, moveUp, moveDown, selectCurrent, close };
};
