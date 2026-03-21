import { IEventDispatcher } from '@nitrots/api';
import { EventDispatcher } from '@nitrots/events';

export const UI_EVENT_DISPATCHER: IEventDispatcher = new EventDispatcher();
