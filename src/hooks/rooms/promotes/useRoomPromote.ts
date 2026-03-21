import { RoomEventEvent, RoomEventMessageParser } from '@nitrots/communication';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { useMessageEvent } from '../../events';

const useRoomPromoteState = () =>
{
    const [ promoteInformation, setPromoteInformation ] = useState<RoomEventMessageParser>(null);
    const [ isExtended, setIsExtended ] = useState<boolean>(false);

    useMessageEvent<RoomEventEvent>(RoomEventEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        setPromoteInformation(parser);
    });

    return { promoteInformation, isExtended, setPromoteInformation, setIsExtended };
};

export const useRoomPromote = () => useBetween(useRoomPromoteState);
