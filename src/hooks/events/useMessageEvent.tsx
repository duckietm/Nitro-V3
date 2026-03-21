import { IMessageEvent } from '@nitrots/api';
import { GetCommunication } from '@nitrots/communication';
import { MessageEvent } from '@nitrots/events';
import { useEffect } from 'react';

export const useMessageEvent = <T extends IMessageEvent>(
    eventType: typeof MessageEvent,
    handler: (event: T) => void
) =>
{
    useEffect(() =>
    {
        //@ts-ignore
        const event = new eventType(handler);

        GetCommunication().registerMessageEvent(event);

        return () => GetCommunication().removeMessageEvent(event);
    }, [eventType, handler]);
};
