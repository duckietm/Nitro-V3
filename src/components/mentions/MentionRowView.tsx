import { FC } from 'react';
import { IMentionEntry } from '../../api';
import { Flex, Text } from '../../common';

interface MentionRowViewProps
{
    mention: IMentionEntry;
    onClick: (mention: IMentionEntry) => void;
}

export const MentionRowView: FC<MentionRowViewProps> = props =>
{
    const { mention, onClick } = props;

    return (
        <Flex pointer alignItems="center" className="p-1 hover:bg-black/5" gap={ 2 } onClick={ () => onClick(mention) }>
            <span
                className={ `inline-block w-[8px] h-[8px] rounded-full shrink-0 ${ mention.read ? 'bg-transparent' : 'bg-[#1e7295]' }` } />
            <Flex grow column className="min-w-0" gap={ 0 }>
                <Flex alignItems="center" gap={ 1 }>
                    <Text bold={ !mention.read } truncate variant="primary">{ mention.senderUsername }</Text>
                    { (mention.roomName && mention.roomName.length > 0) &&
                        <Text small truncate variant="gray">{ mention.roomName }</Text> }
                </Flex>
                <Text truncate variant="black">{ mention.message }</Text>
            </Flex>
        </Flex>
    );
};
