import { ActivePrefixUpdatedEvent, PrefixReceivedEvent, RequestPrefixesComposer, SetActivePrefixComposer, DeletePrefixComposer, UserPrefixesEvent } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { IPrefixItem, SendMessageComposer, UnseenItemCategory } from '../../api';
import { useMessageEvent } from '../events';
import { useSharedVisibility } from '../useSharedVisibility';
import { useInventoryUnseenTracker } from './useInventoryUnseenTracker';

const useInventoryPrefixesState = () =>
{
    const [ needsUpdate, setNeedsUpdate ] = useState(true);
    const [ prefixes, setPrefixes ] = useState<IPrefixItem[]>([]);
    const [ activePrefix, setActivePrefix ] = useState<IPrefixItem | null>(null);
    const [ selectedPrefix, setSelectedPrefix ] = useState<IPrefixItem | null>(null);
    const { isVisible = false, activate = null, deactivate = null } = useSharedVisibility();
    const { isUnseen = null, resetCategory = null } = useInventoryUnseenTracker();

    useMessageEvent<UserPrefixesEvent>(UserPrefixesEvent, event =>
    {
        const parser = event.getParser();
        const newPrefixes: IPrefixItem[] = parser.prefixes.map(p => ({
            id: p.id,
            text: p.text,
            color: p.color,
            icon: p.icon || '',
            effect: p.effect || '',
            active: p.active
        }));

        setPrefixes(newPrefixes);

        const active = newPrefixes.find(p => p.active) || null;
        setActivePrefix(active);
    });

    useMessageEvent<PrefixReceivedEvent>(PrefixReceivedEvent, event =>
    {
        const parser = event.getParser();
        const newPrefix: IPrefixItem = {
            id: parser.id,
            text: parser.text,
            color: parser.color,
            icon: parser.icon || '',
            effect: parser.effect || '',
            active: false
        };

        setPrefixes(prevValue => [ newPrefix, ...prevValue ]);
    });

    useMessageEvent<ActivePrefixUpdatedEvent>(ActivePrefixUpdatedEvent, event =>
    {
        const parser = event.getParser();

        setPrefixes(prevValue =>
        {
            return prevValue.map(p => ({
                ...p,
                active: p.id === parser.prefixId
            }));
        });

        if(parser.prefixId === 0)
        {
            setActivePrefix(null);
        }
        else
        {
            setActivePrefix(prev =>
            {
                const found = prefixes.find(p => p.id === parser.prefixId);
                if(found) return { ...found, active: true };
                return { id: parser.prefixId, text: parser.text, color: parser.color, icon: parser.icon || '', effect: parser.effect || '', active: true };
            });
        }
    });

    const activatePrefix = (prefixId: number) =>
    {
        SendMessageComposer(new SetActivePrefixComposer(prefixId));
    };

    const deactivatePrefix = () =>
    {
        SendMessageComposer(new SetActivePrefixComposer(0));
    };

    const deletePrefix = (prefixId: number) =>
    {
        SendMessageComposer(new DeletePrefixComposer(prefixId));
    };

    useEffect(() =>
    {
        if(!prefixes || !prefixes.length) return;

        setSelectedPrefix(prevValue =>
        {
            if(prevValue && prefixes.find(p => p.id === prevValue.id)) return prevValue;
            return prefixes[0];
        });
    }, [ prefixes ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        return () =>
        {
            resetCategory(UnseenItemCategory.PREFIX);
        };
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        if(!isVisible || !needsUpdate) return;

        SendMessageComposer(new RequestPrefixesComposer());

        setNeedsUpdate(false);
    }, [ isVisible, needsUpdate ]);

    return { prefixes, activePrefix, selectedPrefix, setSelectedPrefix, activatePrefix, deactivatePrefix, deletePrefix, activate, deactivate };
};

export const useInventoryPrefixes = () => useBetween(useInventoryPrefixesState);
