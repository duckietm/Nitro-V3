import { AvailableCommandsEvent, GetCommunication } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandDefinition } from '../../../api';
import { useMessageEvent } from '../../events';

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

// Module-level cache: cattura i comandi dal server anche prima che React monti
let cachedServerCommands: CommandDefinition[] = [];
let globalListenerRegistered = false;

function ensureGlobalListener(): void
{
    if(globalListenerRegistered) return;
    globalListenerRegistered = true;

    try
    {
        const event = new AvailableCommandsEvent((event: AvailableCommandsEvent) =>
        {
            const parser = event.getParser();
            cachedServerCommands = parser.commands.map(cmd => ({ key: cmd.key, description: cmd.description }));
        });

        GetCommunication().registerMessageEvent(event);
    }
    catch(e)
    {
        // Communication not ready yet, will retry on hook mount
        globalListenerRegistered = false;
    }
}

// Try to register immediately at module load
ensureGlobalListener();

export const useChatCommandSelector = (chatValue: string) =>
{
    const [ serverCommands, setServerCommands ] = useState<CommandDefinition[]>(cachedServerCommands);
    const [ selectedIndex, setSelectedIndex ] = useState(0);
    const [ dismissed, setDismissed ] = useState(false);

    // Ensure global listener is registered
    useEffect(() =>
    {
        ensureGlobalListener();

        // If cache already has data (from login), use it
        if(cachedServerCommands.length > 0 && serverCommands.length === 0)
        {
            setServerCommands(cachedServerCommands);
        }
    }, []);

    // Also listen via React hook for any future updates (e.g. rank change)
    useMessageEvent<AvailableCommandsEvent>(AvailableCommandsEvent, event =>
    {
        const parser = event.getParser();
        const cmds = parser.commands.map(cmd => ({ key: cmd.key, description: cmd.description }));
        cachedServerCommands = cmds;
        setServerCommands(cmds);
    });

    const allCommands = useMemo(() =>
    {
        const merged = [ ...serverCommands ];

        for(const clientCmd of CLIENT_COMMANDS)
        {
            if(!merged.some(cmd => cmd.key === clientCmd.key))
            {
                merged.push(clientCmd);
            }
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
