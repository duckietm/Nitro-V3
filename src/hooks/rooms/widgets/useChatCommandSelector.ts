import { AvailableCommandsEvent, GetCommunication } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandDefinition, LocalizeText } from '../../../api';
import { createNitroStore } from '../../../state/createNitroStore';
import { useMessageEvent } from '../../events';

const CLIENT_COMMANDS: { key: string; descriptionKey: string }[] = [
    // Room effects
    { key: 'shake',       descriptionKey: 'chatcmd.client.shake' },
    { key: 'rotate',      descriptionKey: 'chatcmd.client.rotate' },
    { key: 'zoom',        descriptionKey: 'chatcmd.client.zoom' },
    { key: 'flip',        descriptionKey: 'chatcmd.client.flip' },
    { key: 'iddqd',       descriptionKey: 'chatcmd.client.iddqd' },
    { key: 'screenshot',  descriptionKey: 'chatcmd.client.screenshot' },
    { key: 'togglefps',   descriptionKey: 'chatcmd.client.togglefps' },
    // Expressions
    { key: 'd',           descriptionKey: 'chatcmd.client.laugh' },
    { key: 'kiss',        descriptionKey: 'chatcmd.client.kiss' },
    { key: 'jump',        descriptionKey: 'chatcmd.client.jump' },
    { key: 'idle',        descriptionKey: 'chatcmd.client.idle' },
    { key: 'sign',        descriptionKey: 'chatcmd.client.sign' },
    // Room management
    { key: 'furni',       descriptionKey: 'chatcmd.client.furni' },
    { key: 'chooser',     descriptionKey: 'chatcmd.client.chooser' },
    { key: 'floor',       descriptionKey: 'chatcmd.client.floor' },
    { key: 'bcfloor',     descriptionKey: 'chatcmd.client.floor' },
    { key: 'pickall',     descriptionKey: 'chatcmd.client.pickall' },
    { key: 'ejectall',    descriptionKey: 'chatcmd.client.ejectall' },
    { key: 'settings',    descriptionKey: 'chatcmd.client.settings' },
    // Info
    { key: 'client',      descriptionKey: 'chatcmd.client.info' },
    { key: 'nitro',       descriptionKey: 'chatcmd.client.info' },
];

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
    catch {}
};

ensureGlobalListener();

export const useChatCommandSelector = (chatValue: string) =>
{
    const serverCommands = useChatCommandStore(s => s.serverCommands);
    const setServerCommands = useChatCommandStore(s => s.setServerCommands);
    const [ selectedIndex, setSelectedIndex ] = useState(0);
    const [ dismissed, setDismissed ] = useState(false);

    useEffect(() =>
    {
        ensureGlobalListener();
    }, []);

    useMessageEvent<AvailableCommandsEvent>(AvailableCommandsEvent, event =>
    {
        const parser = event.getParser();
        setServerCommands(parser.commands.map(cmd => ({ key: cmd.key, description: cmd.description })));
    });

    const allCommands = useMemo(() =>
    {
        const merged: CommandDefinition[] = [ ...serverCommands ];

        for(const clientCmd of CLIENT_COMMANDS)
        {
            if(merged.some(cmd => cmd.key === clientCmd.key)) continue;
            merged.push({ key: clientCmd.key, description: LocalizeText(clientCmd.descriptionKey) });
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

    useEffect(() =>
    {
        if(chatValue === ':' || chatValue === '') setDismissed(false);
    }, [ chatValue ]);

    useEffect(() =>
    {
        setSelectedIndex(0);
    }, [ filterText ]);

    return { isVisible, filteredCommands, selectedIndex, setSelectedIndex, moveUp, moveDown, selectCurrent, close };
};
