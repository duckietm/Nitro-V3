import { MarkMentionsReadComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useMemo, useState } from 'react';
import { IMentionEntry, LocalizeText, MentionType, SendMessageComposer } from '../../api';
import { Button, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMentionsSnapshot } from '../../hooks';
import { markAllRead } from '../../hooks/mentions/mentionsStore';
import { useUserDataSnapshot } from '../../hooks/session/useSessionSnapshots';
import { MentionRowView } from './MentionRowView';
import { getMentionDateGroup, MentionDateGroup } from './mentionsFormat';
import { useMentionActions } from './useMentionActions';

interface MentionsViewProps
{
    onClose: () => void;
}

type MentionFilter = 'all' | 'unread' | 'direct' | 'room';

const FILTERS: ReadonlyArray<{ key: MentionFilter; label: string }> = [
    { key: 'all', label: 'mentions.filter.all' },
    { key: 'unread', label: 'mentions.filter.unread' },
    { key: 'direct', label: 'mentions.filter.direct' },
    { key: 'room', label: 'mentions.filter.room' }
];

const GROUP_ORDER: ReadonlyArray<MentionDateGroup> = [ 'today', 'yesterday', 'older' ];
const GROUP_LABEL: Record<MentionDateGroup, string> = {
    today: 'mentions.group.today',
    yesterday: 'mentions.group.yesterday',
    older: 'mentions.group.older'
};

const matchesFilter = (mention: IMentionEntry, filter: MentionFilter): boolean =>
{
    switch(filter)
    {
        case 'unread': return !mention.read;
        case 'direct': return mention.mentionType === MentionType.DIRECT;
        case 'room': return mention.mentionType === MentionType.ROOM;
        default: return true;
    }
};

export const MentionsView: FC<MentionsViewProps> = props =>
{
    const { onClose } = props;
    const { mentions, unreadCount } = useMentionsSnapshot();
    const { userName: ownUsername = '' } = useUserDataSnapshot();
    const { open, goto, remove } = useMentionActions();
    const [ filter, setFilter ] = useState<MentionFilter>('all');

    const onMarkAll = useCallback(() =>
    {
        markAllRead();
        SendMessageComposer(new MarkMentionsReadComposer(0, 0));
    }, []);

    const groups = useMemo(() =>
    {
        const buckets: Record<MentionDateGroup, IMentionEntry[]> = { today: [], yesterday: [], older: [] };

        for(const mention of mentions)
        {
            if(!matchesFilter(mention, filter)) continue;
            buckets[getMentionDateGroup(mention.timestamp)].push(mention);
        }

        return GROUP_ORDER
            .map(key => ({ key, items: buckets[key] }))
            .filter(group => group.items.length > 0);
    }, [ mentions, filter ]);

    const hasAny = groups.length > 0;

    return (
        <NitroCardView className="w-[360px] h-[440px] has-classic-scrollbar" theme="primary-slim" uniqueKey="mentions">
            <NitroCardHeaderView headerText={ LocalizeText('mentions.window.title') } onCloseClick={ onClose } />
            <NitroCardContentView gap={ 1 }>
                <Flex alignItems="center" className="flex-wrap" gap={ 1 }>
                    { FILTERS.map(({ key, label }) =>
                    {
                        const active = (filter === key);
                        const showCount = ((key === 'unread') && (unreadCount > 0));

                        return (
                            <button
                                key={ key }
                                type="button"
                                onClick={ () => setFilter(key) }
                                className={ `px-2 py-[2px] rounded-full text-xs border transition-colors ${ active ? 'bg-[#1e7295] text-white border-[#1e7295]' : 'bg-black/5 text-black/70 border-transparent hover:bg-black/10' }` }>
                                { LocalizeText(label) }{ showCount ? ` (${ unreadCount })` : '' }
                            </button>
                        );
                    }) }
                </Flex>
                <Flex grow column className="min-h-0 overflow-y-auto" gap={ 0 }>
                    { !hasAny &&
                        <Flex grow column center gap={ 2 } className="py-6 text-center">
                            <span className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-black/5 text-[#1e7295] text-[22px] font-bold">@</span>
                            <Text center variant="gray">{ LocalizeText('mentions.window.empty') }</Text>
                        </Flex> }
                    { hasAny && groups.map(group => (
                        <Flex key={ group.key } column gap={ 0 }>
                            <Text small bold variant="gray" className="px-1 pt-2 pb-[2px] uppercase tracking-wide">
                                { LocalizeText(GROUP_LABEL[group.key]) }
                            </Text>
                            { group.items.map(mention => (
                                <MentionRowView
                                    key={ mention.mentionId }
                                    mention={ mention }
                                    onGoto={ goto }
                                    onOpen={ open }
                                    onRemove={ remove }
                                    ownUsername={ ownUsername } />
                            )) }
                        </Flex>
                    )) }
                </Flex>
                { (unreadCount > 0) &&
                    <Button variant="primary" onClick={ onMarkAll }>{ LocalizeText('mentions.window.markall') }</Button> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
