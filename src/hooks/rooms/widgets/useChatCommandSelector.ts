import { AvailableCommandsEvent, GetCommunication } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandDefinition } from '../../../api';
import { createNitroStore } from '../../../state/createNitroStore';
import { useMessageEvent } from '../../events';

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

const ensureGlobalListener = (): void =>
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
ensureGlobalListener();

export const useChatCommandSelector = (chatValue: string) =>
{
    const serverCommands = useChatCommandStore(s => s.serverCommands);
    const setServerCommands = useChatCommandStore(s => s.setServerCommands);
    const [ selectedIndex, setSelectedIndex ] = useState(0);
    const [ dismissed, setDismissed ] = useState(false);

    useEffect(() =>
    {
        // Cover the case where the module-level registration failed
        // because GetCommunication() wasn't ready at import time.
        ensureGlobalListener();
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

    const filterText = useMemo(() =>
    {
        if(!chatValue.startsWith(':') || chatValue.includes(' ')) return '';

        return chatValue.slice(1).toLowerCase();
    }, [ chatValue ]);

    const filteredCommands = useMemo(() =>
    {
        if(!filterText && !chatValue.startsWith(':')) return [];

        return allCommands.filter(cmd => cmd.key.toLowerCase().startsWith(filterText));
    }, [ allCommands, filterText, chatValue ]);

    const isVisible = useMemo(() =>
    {
        return chatValue.startsWith(':') && !chatValue.includes(' ') && filteredCommands.length > 0 && !dismissed;
    }, [ chatValue, filteredCommands, dismissed ]);

    const moveUp = useCallback(() =>
    {
        setSelectedIndex(prev => (prev <= 0 ? filteredCommands.length - 1 : prev - 1));
    }, [ filteredCommands.length ]);

    const moveDown = useCallback(() =>
    {
        setSelectedIndex(prev => (prev >= filteredCommands.length - 1 ? 0 : prev + 1));
    }, [ filteredCommands.length ]);

    const selectCurrent = useCallback((): CommandDefinition | null =>
    {
        if(selectedIndex >= 0 && selectedIndex < filteredCommands.length)
        {
            return filteredCommands[selectedIndex];
        }

        return null;
    }, [ selectedIndex, filteredCommands ]);

    const close = useCallback(() =>
    {
        setDismissed(true);
    }, []);

    // Reset dismissed when chatValue changes to a new command start
    useEffect(() =>
    {
        if(chatValue === ':' || chatValue === '') setDismissed(false);
    }, [ chatValue ]);

    // Reset selectedIndex when filtered list changes
    useEffect(() =>
    {
        setSelectedIndex(0);
    }, [ filterText ]);

    return { isVisible, filteredCommands, selectedIndex, setSelectedIndex, moveUp, moveDown, selectCurrent, close };
};
