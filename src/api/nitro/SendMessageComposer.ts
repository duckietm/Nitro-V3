import { IMessageComposer } from '@nitrots/api';
import { GetCommunication } from '@nitrots/communication';

export const SendMessageComposer = (event: IMessageComposer<unknown[]>) => GetCommunication().connection.send(event);
