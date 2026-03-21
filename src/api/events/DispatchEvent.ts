import { IEventDispatcher } from '@nitrots/api';
import { NitroEvent } from '@nitrots/events';

export const DispatchEvent = (eventDispatcher: IEventDispatcher, event: NitroEvent) => eventDispatcher.dispatchEvent(event);
