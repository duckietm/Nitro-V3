import { MarkMentionsReadComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback } from 'react';
import { LocalizeText, SendMessageComposer } from '../../api';
import { Button, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMentionsSnapshot } from '../../hooks';
import { markAllRead } from '../../hooks/mentions/mentionsStore';
import { MentionRowView } from './MentionRowView';
import { useMentionRowClick } from './useMentionRowClick';

interface MentionsViewProps
{
    onClose: () => void;
}

export const MentionsView: FC<MentionsViewProps> = props =>
{
    const { onClose } = props;
    const { mentions } = useMentionsSnapshot();
    const onRowClick = useMentionRowClick();

    const onMarkAll = useCallback(() =>
    {
        markAllRead();
        SendMessageComposer(new MarkMentionsReadComposer(0, 0));
    }, []);

    return (
        <NitroCardView className="w-[340px] h-[420px]" theme="primary-slim" uniqueKey="mentions">
            <NitroCardHeaderView headerText={ LocalizeText('mentions.window.title') } onCloseClick={ onClose } />
            <NitroCardContentView gap={ 1 }>
                <Flex grow column className="min-h-0 overflow-y-auto" gap={ 0 }>
                    { (mentions.length === 0)
                        ? <Text center variant="gray">{ LocalizeText('mentions.window.empty') }</Text>
                        : mentions.map(mention => (
                            <MentionRowView key={ mention.mentionId } mention={ mention } onClick={ onRowClick } />
                        )) }
                </Flex>
                { (mentions.length > 0) &&
                    <Button variant="primary" onClick={ onMarkAll }>{ LocalizeText('mentions.window.markall') }</Button> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
