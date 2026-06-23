import { CatalogGroupsComposer, GuildMembershipsMessageEvent, HabboGroupEntryData } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

const useUserGroupsStore = () => {
    const [groups, setGroups] = useState<HabboGroupEntryData[]>([]);

    const onGuildMemberships = useCallback((event: GuildMembershipsMessageEvent) => {
        setGroups(event.getParser()?.groups || []);
    }, []);

    useMessageEvent<GuildMembershipsMessageEvent>(GuildMembershipsMessageEvent, onGuildMemberships);

    useEffect(() => {
        SendMessageComposer(new CatalogGroupsComposer());
    }, []);

    return { groups };
};

export const useUserGroups = (): { data: HabboGroupEntryData[] } => {
    const { groups } = useBetween(useUserGroupsStore);

    return { data: groups };
};
