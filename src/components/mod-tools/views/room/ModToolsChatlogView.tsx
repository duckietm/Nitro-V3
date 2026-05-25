import { ChatRecordData, GetRoomChatlogMessageComposer, RoomChatlogEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { ChatlogView } from '../chatlog/ChatlogView';

interface ModToolsChatlogViewProps
{
    roomId: number;
    onCloseClick: () => void;
}

export const ModToolsChatlogView: FC<ModToolsChatlogViewProps> = props =>
{
    const { roomId = null, onCloseClick = null } = props;
    const [ roomChatlog, setRoomChatlog ] = useState<ChatRecordData>(null);

    useMessageEvent<RoomChatlogEvent>(RoomChatlogEvent, event =>
    {
        const parser = event.getParser();

        if(!parser || parser.data.roomId !== roomId) return;

        setRoomChatlog(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomChatlogMessageComposer(roomId));
    }, [ roomId ]);

    return (
        <NitroCardView className="nitro-mod-tools-chatlog min-w-[460px] max-w-[520px] max-h-[500px]" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText={ LocalizeText('modtools.room.chatlog.title') } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black" gap={ 1 } overflow="auto">
                { roomChatlog
                    ? <ChatlogView records={ [ roomChatlog ] } />
                    : <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-50 text-sm">
                        <FaSpinner className="animate-spin" size={ 22 } />
                        <span>{ LocalizeText('modtools.user.chatlog.loading') }</span>
                    </div> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
